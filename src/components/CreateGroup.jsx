import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabase'
import { db } from '../db'
import { v4 as uuid } from 'uuid'

export default function CreateGroup({ onCreated }) {
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [users, setUsers] = useState([])
  const [selected, setSelected] = useState(new Set())
  const [invite, setInvite] = useState(null)

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase.from('profiles').select('*').neq('id', user.id).limit(100)
      setUsers(data || [])
    })()
  }, [user.id])

  const create = async () => {
    if (!name.trim() || selected.size === 0) return
    const chatId = uuid()
    const chat = {
      id: chatId, name: name.trim(), is_group: true, created_by: user.id,
      created_at: new Date().toISOString(), last_message_at: new Date().toISOString()
    }
    await db.chats.put(chat)
    if (navigator.onLine) await supabase.from('chats').insert(chat)

    const memberIds = [user.id, ...selected]
    for (const uid of memberIds) {
      const m = { chat_id: chatId, user_id: uid, is_archived: false, is_pinned: false }
      await db.chat_members.put(m)
      if (navigator.onLine) await supabase.from('chat_members').insert(m)
    }

    const code = Math.random().toString(36).slice(2, 10)
    const link = { id: uuid(), chat_id: chatId, invite_code: code, created_by: user.id, created_at: new Date().toISOString() }
    await db.group_invite_links.put(link)
    if (navigator.onLine) await supabase.from('group_invite_links').insert(link)

    setInvite(window.location.origin + '/?invite=' + code)
    setTimeout(() => onCreated(chatId), 1500)
  }

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-primary)' }}>
      <div className="px-6 py-3" style={{ background: 'var(--header)' }}>
        <h1 className="text-white text-lg font-medium">New Group</h1>
      </div>
      <div className="p-4 space-y-3">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Group name"
               className="w-full p-3 rounded-lg border outline-none"
               style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', borderColor: 'rgba(0,0,0,0.1)' }}/>
        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Add members:</div>
        <div className="max-h-72 overflow-y-auto border rounded-lg" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
          {users.map(u => (
            <label key={u.id} className="flex items-center gap-2 p-2 border-b hover:bg-black/5 cursor-pointer"
                   style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
              <input type="checkbox" checked={selected.has(u.id)} onChange={() => {
                const s = new Set(selected)
                s.has(u.id) ? s.delete(u.id) : s.add(u.id)
                setSelected(s)
              }}/>
              <span className="text-sm">{u.username}</span>
            </label>
          ))}
        </div>
        <button onClick={create} className="px-4 py-2 rounded text-white text-sm" style={{ background: 'var(--accent)' }}>
          Create Group
        </button>
        {invite && (
          <div className="text-xs p-2 rounded border" style={{ borderColor: 'var(--accent)', color: 'var(--text-secondary)' }}>
            Invite link: <code className="break-all">{invite}</code>
          </div>
        )}
      </div>
    </div>
  )
}
