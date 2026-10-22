import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { db } from '../db'
import { ArrowLeft } from 'lucide-react'

export default function StarredMessages({ onBack, onOpenChat }) {
  const { user } = useAuth()
  const [items, setItems] = useState([])

  useEffect(() => {
    ;(async () => {
      const stars = await db.starred_messages.where('user_id').equals(user.id).toArray()
      const list = []
      for (const s of stars) {
        const m = await db.messages.get(s.message_id)
        if (m) list.push(m)
      }
      setItems(list)
    })()
  }, [user.id])

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-primary)' }}>
      <div className="px-4 py-3 flex items-center gap-4" style={{ background: 'var(--header)' }}>
        <button onClick={onBack} className="text-white sm:hidden"><ArrowLeft size={20}/></button>
        <h1 className="text-white text-lg font-medium">Starred Messages</h1>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {items.length === 0 && <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No starred messages.</p>}
        {items.map(m => (
          <button key={m.id} onClick={() => onOpenChat(m.chat_id)}
                  className="w-full text-left p-3 rounded-lg border hover:bg-black/5"
                  style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
            <div className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>{new Date(m.created_at).toLocaleString()}</div>
            <div className="text-sm">{m.content || '[media]'}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
