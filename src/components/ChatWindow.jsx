import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabase'
import { db } from '../db'
import { v4 as uuid } from 'uuid'
import { Pin, Users, MoreVertical, ArrowLeft, Star } from 'lucide-react'
import MessageBubble from './MessageBubble'
import MessageInput from './MessageInput'

export default function ChatWindow({ chatId, onClose }) {
  const { user } = useAuth()
  const [chat, setChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [statuses, setStatuses] = useState({})
  const [reactions, setReactions] = useState({})
  const [typing, setTyping] = useState(null)
  const [memberProfiles, setMemberProfiles] = useState({})
  const [members, setMembers] = useState([])
  const [pinned, setPinned] = useState([])
  const [replyTo, setReplyTo] = useState(null)
  const [disappearing, setDisappearing] = useState(0)
  const scrollRef = useRef(null)
  const activityTimerRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    async function init() {
      const c = await db.chats.get(chatId)
      if (!cancelled) setChat(c)
      const ms = await db.chat_members.where('chat_id').equals(chatId).toArray()
      if (!cancelled) setMembers(ms)
      const profiles = {}
      for (const m of ms) {
        const p = await db.profiles.get(m.user_id)
        if (p) profiles[m.user_id] = p
      }
      if (!cancelled) setMemberProfiles(profiles)
      const pins = await db.pinned_messages.where('chat_id').equals(chatId).toArray()
      if (!cancelled) setPinned(pins.map(p => p.message_id))
      const st = await db.chat_settings.get(chatId)
      if (!cancelled) setDisappearing(st?.disappearing_seconds || 0)

      await loadMessages()
      await markRead()

      if (navigator.onLine) {
        await syncFromCloud()
      }
    }
    init()
    return () => { cancelled = true }
  }, [chatId])

  const loadMessages = async () => {
    const msgs = await db.messages.where('chat_id').equals(chatId).toArray()
    // filter deletes-for-user
    const del = await db.message_deletes_for_user.where('user_id').equals(user.id).toArray()
    const delSet = new Set(del.map(d => d.message_id))
    const visible = msgs.filter(m => !delSet.has(m.id))
    visible.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    setMessages(visible)

    const allStatus = await db.message_status.toArray()
    const map = {}
    for (const s of allStatus) {
      if (!map[s.message_id]) map[s.message_id] = []
      map[s.message_id].push(s)
    }
    setStatuses(map)

    const allReacts = await db.message_reactions.toArray()
    const rmap = {}
    for (const r of allReacts) {
      if (!rmap[r.message_id]) rmap[r.message_id] = []
      rmap[r.message_id].push(r)
    }
    setReactions(rmap)
    setTimeout(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }) }, 50)
  }

  const syncFromCloud = async () => {
    const { data: msgs } = await supabase.from('messages').select('*').eq('chat_id', chatId).order('created_at', { ascending: true })
    if (msgs) for (const m of msgs) await db.messages.put(m)
    const { data: st } = await supabase.from('message_status').select('*')
    if (st) for (const s of st) await db.message_status.put(s)
    const { data: rx } = await supabase.from('message_reactions').select('*')
    if (rx) for (const r of rx) await db.message_reactions.put(r)
    loadMessages()
  }

  const markRead = async () => {
    const myStatuses = await db.message_status.where('user_id').equals(user.id).toArray()
    const myChatMessages = new Set(messages.map(m => m.id))
    for (const s of myStatuses) {
      if (myChatMessages.has(s.message_id) && s.status !== 'read') {
        await db.message_status.put({ ...s, status: 'read' })
        if (navigator.onLine) {
          await supabase.from('message_status')
            .update({ status: 'read' }).eq('message_id', s.message_id).eq('user_id', user.id)
        }
      }
    }
  }

  // Real-time
  useEffect(() => {
    const ch = supabase.channel(`chat-${chatId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
        async payload => { await db.messages.put(payload.new); loadMessages() })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
        async payload => { await db.messages.put(payload.new); loadMessages() })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'message_status' },
        async payload => {
          const row = payload.new || payload.old
          if (row) { await db.message_status.put(row); loadMessages() }
        })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'message_reactions' },
        async payload => {
          const row = payload.new || payload.old
          if (row) {
            await db.message_reactions.put(row)
            loadMessages()
          }
        })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_activity', filter: `chat_id=eq.${chatId}` },
        payload => {
          const row = payload.new
          if (row && row.user_id !== user.id && row.activity_type === 'typing') {
            const p = memberProfiles[row.user_id]
            setTyping(p?.username || 'Someone')
            clearTimeout(activityTimerRef.current)
            activityTimerRef.current = setTimeout(() => setTyping(null), 3500)
          }
        })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [chatId, user.id, memberProfiles])

  // Send message
  const sendMessage = async (content, type = 'text', mediaUrl = null, extra = {}) => {
    if (!content && !mediaUrl) return
    const id = uuid()
    const msg = {
      id, chat_id: chatId, sender_id: user.id, content, is_deleted: false,
      reply_to_id: replyTo?.id || null,
      message_type: type,
      created_at: new Date().toISOString(),
      pending_sync: navigator.onLine ? 0 : 1,
      ...extra
    }
    await db.messages.put(msg)
    setMessages(prev => [...prev, msg])
    setReplyTo(null)
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }), 30)

    if (type === 'image' && mediaUrl) {
      await db.message_media.put({ id: uuid(), message_id: id, url: mediaUrl, media_type: 'image' })
    }

    if (navigator.onLine) {
      const { error } = await supabase.from('messages').insert(msg)
      if (!error) {
        await db.messages.update(id, { pending_sync: 0 })
        // Message statuses
        for (const m of members) {
          await supabase.from('message_status').insert({ message_id: id, user_id: m.user_id, status: 'sent' })
          await db.message_status.put({ message_id: id, user_id: m.user_id, status: 'sent' })
        }
        await supabase.from('chats').update({ last_message_at: msg.created_at }).eq('id', chatId)
      }
    } else {
      // queued; will sync on online
      await db.messages.update(id, { pending_sync: 1 })
    }
  }

  // Typing activity
  const onTyping = async () => {
    if (!navigator.onLine) return
    const row = {
      chat_id: chatId, user_id: user.id,
      activity_type: 'typing', updated_at: new Date().toISOString()
    }
    await supabase.from('chat_activity').upsert(row, { onConflict: 'chat_id,user_id' })
  }

  const onDelete = async (msg, forEveryone) => {
    if (forEveryone) {
      await supabase.from('messages').update({ is_deleted: true }).eq('id', msg.id)
      await db.messages.update(msg.id, { is_deleted: true })
    } else {
      await supabase.from('message_deletes_for_user').insert({ message_id: msg.id, user_id: user.id })
      await db.message_deletes_for_user.put({ message_id: msg.id, user_id: user.id })
    }
    loadMessages()
  }

  const onReact = async (msg, emoji) => {
    const react = { message_id: msg.id, user_id: user.id, emoji, created_at: new Date().toISOString() }
    await db.message_reactions.put(react)
    if (navigator.onLine) {
      await supabase.from('message_reactions').upsert(react, { onConflict: 'message_id,user_id,emoji' })
    }
    loadMessages()
  }

  const onStar = async (msg) => {
    const s = { message_id: msg.id, user_id: user.id, created_at: new Date().toISOString() }
    await db.starred_messages.put(s)
    if (navigator.onLine) await supabase.from('starred_messages').upsert(s, { onConflict: 'message_id,user_id' })
  }

  const onPin = async (msg) => {
    const isPinned = pinned.includes(msg.id)
    if (isPinned) {
      await db.pinned_messages.delete([chatId, msg.id])
      if (navigator.onLine) await supabase.from('pinned_messages').delete().eq('chat_id', chatId).eq('message_id', msg.id)
      setPinned(pinned.filter(p => p !== msg.id))
    } else {
      await db.pinned_messages.put({ chat_id: chatId, message_id: msg.id })
      if (navigator.onLine) await supabase.from('pinned_messages').upsert({ chat_id: chatId, message_id: msg.id }, { onConflict: 'chat_id,message_id' })
      setPinned([...pinned, msg.id])
    }
  }

  const headerName = chat?.is_group
    ? chat?.name || 'Group'
    : memberProfiles[members.find(m => m.user_id !== user.id)?.user_id]?.username || 'Chat'

  const pinnedMsg = pinned.length ? messages.find(m => m.id === pinned[0]) : null

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-chat)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2 flex-shrink-0" style={{ background: 'var(--header)' }}>
        <button className="sm:hidden text-white p-1" onClick={onClose}><ArrowLeft size={20}/></button>
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white" style={{ background: 'rgba(255,255,255,0.2)' }}>
          {chat?.is_group ? <Users size={20}/> : headerName[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0 text-white">
          <div className="font-medium truncate">{headerName}</div>
          <div className="text-xs opacity-80 truncate">
            {typing ? `${typing} is typing…` : (chat?.is_group ? `${members.length} members` : 'online')}
          </div>
        </div>
        <div className="text-white flex gap-2">
          <button className="p-2 rounded hover:bg-white/10" title="More"><MoreVertical size={18}/></button>
        </div>
      </div>

      {/* Pinned bar */}
      {pinnedMsg && (
        <div className="px-3 py-2 flex items-center gap-2 text-sm" style={{ background: 'var(--bg-secondary)' }}>
          <Pin size={14} style={{ color: 'var(--accent)' }}/>
          <div className="flex-1 truncate" style={{ color: 'var(--text-secondary)' }}>
            {pinnedMsg.content || '[media]'}
          </div>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-2 sm:px-6 py-4 scrollbar-thin chat-wallpaper space-y-1">
        {messages.map((m, i) => {
          const prev = messages[i - 1]
          const sameSender = prev && prev.sender_id === m.sender_id &&
            (new Date(m.created_at) - new Date(prev.created_at) < 120000)
          return (
            <MessageBubble
              key={m.id}
              msg={m}
              isMine={m.sender_id === user.id}
              sameSender={sameSender}
              statuses={statuses[m.id] || []}
              reactions={reactions[m.id] || []}
              senderName={memberProfiles[m.sender_id]?.username}
              isPinned={pinned.includes(m.id)}
              replyTo={m.reply_to_id ? messages.find(x => x.id === m.reply_to_id) : null}
              onReply={() => setReplyTo(m)}
              onDelete={(evr) => onDelete(m, evr)}
              onReact={(e) => onReact(m, e)}
              onStar={() => onStar(m)}
              onPin={() => onPin(m)}
            />
          )
        })}
      </div>

      {/* Input */}
      <MessageInput
        onSend={sendMessage}
        onTyping={onTyping}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
      />
    </div>
  )
}
