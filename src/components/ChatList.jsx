import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabase'
import { db } from '../db'
import { format } from 'date-fns'
import { Pin, Users } from 'lucide-react'

export default function ChatList({ filter, query, activeChatId, onSelect, onSwitchView }) {
  const { user } = useAuth()
  const [items, setItems] = useState([])

  const load = async () => {
    if (!user) return
    const memberships = await db.chat_members.where('user_id').equals(user.id).toArray()
    const active = memberships.filter(m => !m.is_archived)
    const list = []
    
    for (const m of active) {
      const chat = await db.chats.get(m.chat_id)
      if (!chat) continue
      
      const lastMsgs = await db.messages.where('chat_id').equals(m.chat_id).toArray()
      lastMsgs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      const last = lastMsgs[0]
      
      const unread = (await db.message_status.where('user_id').equals(user.id).toArray())
        .filter(s => s.status !== 'read')
        .filter(s => lastMsgs.some(mm => mm.id === s.message_id && mm.sender_id !== user.id))
        .length
        
      let displayName = chat.name
      let displayAvatar = null
      
      if (!chat.is_group) {
        const otherMember = (await db.chat_members.where('chat_id').equals(chat.id).toArray())
          .find(x => x.user_id !== user.id)
        if (otherMember) {
          const p = await db.profiles.get(otherMember.user_id)
          displayName = p?.username || 'Unknown User'
          displayAvatar = p?.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${otherMember.user_id}`
        } else {
          displayName = 'Just You'
        }
      }

      list.push({
        chat, member: m, last, displayName, displayAvatar, unread,
        lastAt: chat.last_message_at || chat.created_at || last?.created_at
      })
    }
    list.sort((a, b) => new Date(b.lastAt || 0) - new Date(a.lastAt || 0))
    setItems(list)
  }

  const sync = async () => {
    if (!user || !navigator.onLine) return
    
    // 1. Sync my chats
    const { data: members } = await supabase.from('chat_members').select('*').eq('user_id', user.id)
    if (members) for (const m of members) await db.chat_members.put(m)
    
    if (members?.length) {
      const ids = members.map(m => m.chat_id)
      
      // 2. Sync chat details
      const { data: chats } = await supabase.from('chats').select('*').in('id', ids)
      if (chats) for (const c of chats) await db.chats.put(c)
      
      // 3. Sync ALL members of these chats
      const { data: allMembers } = await supabase.from('chat_members').select('*').in('chat_id', ids)
      if (allMembers) {
        const userIds = new Set()
        for (const am of allMembers) {
          await db.chat_members.put(am)
          userIds.add(am.user_id)
        }
        
        // 4. Fetch profiles for ALL these users at once
        const { data: profiles } = await supabase.from('profiles').select('*').in('id', Array.from(userIds))
        if (profiles) {
          for (const p of profiles) {
             // Fallback avatar if missing in DB
             if(!p.avatar_url) p.avatar_url = `https://api.dicebear.com/7.x/adventurer/svg?seed=${p.username || p.id}`
             await db.profiles.put(p)
          }
        }
      }
      
      // 5. Sync recent messages
      const { data: msgs } = await supabase.from('messages').select('*').in('chat_id', ids).order('created_at', { ascending: false }).limit(200)
      if (msgs) for (const msg of msgs) await db.messages.put(msg)
    }
    load()
  }

  useEffect(() => { load(); sync() }, [user?.id])

  useEffect(() => {
    const ch = supabase.channel('chatlist-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chats' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_members' }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [user?.id])

  let filtered = items
  if (filter === 'unread') filtered = filtered.filter(i => i.unread > 0)
  if (filter === 'groups') filtered = filtered.filter(i => i.chat.is_group)
  if (query) filtered = filtered.filter(i => i.displayName?.toLowerCase().includes(query.toLowerCase()))

  if (!filtered.length) {
    return (
      <div className="p-6 text-sm text-center" style={{ color: 'var(--text-secondary)' }}>
        No chats yet.
        <div className="mt-2">
          <button className="underline" style={{ color: 'var(--accent)' }} onClick={() => onSwitchView('group-create')}>
            Start a chat
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {filtered.map(it => (
        <button
          key={it.chat.id}
          onClick={() => onSelect(it.chat.id)}
          className="w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-black/5 transition-colors"
          style={{ background: activeChatId === it.chat.id ? 'var(--bg-secondary)' : 'transparent' }}
        >
          {it.chat.is_group ? (
             <div className="w-12 h-12 rounded-full flex items-center justify-center text-white flex-shrink-0" style={{ background: '#6A7175' }}>
               <Users size={20}/>
             </div>
          ) : (
            <img src={it.displayAvatar} alt="avatar" className="w-12 h-12 rounded-full flex-shrink-0 bg-gray-200" />
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm truncate">{it.displayName}</span>
              <span className="text-xs flex-shrink-0 ml-2" style={{ color: 'var(--text-secondary)' }}>
                {it.last?.created_at ? format(new Date(it.last.created_at), 'HH:mm') : ''}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                {it.last ? (it.last.is_deleted ? 'Message deleted' : (it.last.content || '[media]')) : 'Start chatting'}
              </span>
              <div className="flex items-center gap-1">
                {it.member.is_pinned && <Pin size={12} style={{ color: 'var(--text-secondary)' }}/>}
                {it.unread > 0 && (
                  <span className="text-[10px] rounded-full px-1.5 py-0.5 text-white" style={{ background: 'var(--accent)' }}>
                    {it.unread}
                  </span>
                )}
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}
