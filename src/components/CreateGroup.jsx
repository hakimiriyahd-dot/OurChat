import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabase'
import { db } from '../db'
import { v4 as uuid } from 'uuid'
import { ArrowLeft } from 'lucide-react'

export default function CreateGroup({ onBack, onCreated }) {
  const { user } = useAuth()
  const [mode, setMode] = useState('chat') // 'chat' or 'group'
  const [name, setName] = useState('')
  const [users, setUsers] = useState([])
  const [selected, setSelected] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  useEffect(() => {
    ;(async () => {
      const { data, error } = await supabase.from('profiles').select('*').neq('id', user.id).limit(100)
      if (error) setErr(error.message)
      setUsers(data || [])
      setLoading(false)
    })()
  }, [user.id])

  const create = async () => {
    if (mode === 'group' && !name.trim()) return alert('Please enter a group name')
    if (selected.size === 0) return alert('Please select at least one contact')
    if (mode === 'chat' && selected.size > 1) return alert('Select only one contact for a direct chat')

    const chatId = uuid()
    const isGroup = mode === 'group'
    const chat = {
      id: chatId, 
      name: isGroup ? name.trim() : null, 
      is_group: isGroup, 
      created_by: user.id,
      created_at: new Date().toISOString(), 
      last_message_at: new Date().toISOString()
    }
    
    await db.chats.put(chat)
    if (navigator.onLine) await supabase.from('chats').insert(chat)

    const memberIds = [user.id, ...selected]
    for (const uid of memberIds) {
      const m = { chat_id: chatId, user_id: uid, is_archived: false, is_pinned: false }
      await db.chat_members.put(m)
      if (navigator.onLine) await supabase.from('chat_members').insert(m)
    }

    if (isGroup) {
      const code = Math.random().toString(36).slice(2, 10)
      const link = { id: uuid(), chat_id: chatId, invite_code: code, created_by: user.id, created_at: new Date().toISOString() }
      await db.group_invite_links.put(link)
      if (navigator.onLine) await supabase.from('group_invite_links').insert(link)
    }

    onCreated(chatId)
  }

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-primary)' }}>
      <div className="flex items-center px-4 py-3" style={{ background: 'var(--header)' }}>
        <button onClick={onBack} className="text-white mr-4 sm:hidden"><ArrowLeft size={20}/></button>
        <h1 className="text-white text-lg font-medium">{mode === 'chat' ? 'New Chat' : 'New Group'}</h1>
      </div>
      
      <div className="flex border-b" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
        <button onClick={() => { setMode('chat'); setSelected(new Set()) }} className={`flex-1 p-3 text-sm font-medium ${mode === 'chat' ? 'border-b-2 border-green-500 text-green-500' : 'text-gray-500'}`}>Direct Chat</button>
        <button onClick={() => { setMode('group'); setSelected(new Set()) }} className={`flex-1 p-3 text-sm font-medium ${mode === 'group' ? 'border-b-2 border-green-500 text-green-500' : 'text-gray-500'}`}>Group</button>
      </div>

      <div className="p-4 space-y-3 flex-1 overflow-y-auto">
        {mode === 'group' && (
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Group name"
                 className="w-full p-3 rounded-lg border outline-none"
                 style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', borderColor: 'rgba(0,0,0,0.1)' }}/>
        )}
        
        <div className="text-sm font-semibold mt-4" style={{ color: 'var(--text-secondary)' }}>
          {mode === 'chat' ? 'Select a contact' : 'Select members'}
        </div>
        
        {err && <div className="text-red-500 text-sm">{err}</div>}
        {loading ? <div className="text-sm">Loading contacts...</div> : users.length === 0 ? (
          <div className="text-sm p-4 border rounded" style={{ borderColor: 'var(--accent)', color: 'var(--text-primary)' }}>
            <b>No contacts found.</b><br/>
            If you have other users registered, you need to allow reading profiles in Supabase. Run this SQL in your Supabase SQL Editor:<br/>
            <code className="block mt-2 p-2 bg-black/10 rounded text-xs break-all">CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);</code>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
            {users.map(u => (
              <label key={u.id} className="flex items-center gap-3 p-3 border-b hover:bg-black/5 cursor-pointer" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                <input type={mode === 'chat' ? 'radio' : 'checkbox'} name="user-select" checked={selected.has(u.id)} onChange={() => {
                  const s = new Set(mode === 'chat' ? [] : selected)
                  if (s.has(u.id)) s.delete(u.id)
                  else s.add(u.id)
                  setSelected(s)
                }}/>
                <span className="text-sm">{u.username}</span>
              </label>
            ))}
          </div>
        )}
        
        <button onClick={create} className="w-full py-3 rounded-lg text-white font-semibold mt-4" style={{ background: 'var(--accent)' }}>
          {mode === 'chat' ? 'Start Chat' : 'Create Group'}
        </button>
      </div>
    </div>
  )
}
