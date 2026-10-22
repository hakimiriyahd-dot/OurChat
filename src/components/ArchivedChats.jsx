import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { db } from '../db'

export default function ArchivedChats({ onOpenChat }) {
  const { user } = useAuth()
  const [items, setItems] = useState([])

  useEffect(() => {
    ;(async () => {
      const ms = await db.chat_members.where('user_id').equals(user.id).toArray()
      const archived = ms.filter(m => m.is_archived)
      const list = []
      for (const m of archived) {
        const c = await db.chats.get(m.chat_id)
        if (c) list.push(c)
      }
      setItems(list)
    })()
  }, [user.id])

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-primary)' }}>
      <div className="px-6 py-3" style={{ background: 'var(--header)' }}>
        <h1 className="text-white text-lg font-medium">Archived Chats</h1>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {items.length === 0 && <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No archived chats.</p>}
        {items.map(c => (
          <button key={c.id} onClick={() => onOpenChat(c.id)}
                  className="w-full text-left p-3 rounded-lg border hover:bg-black/5"
                  style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
            {c.name || 'Chat'}
          </button>
        ))}
      </div>
    </div>
  )
}
