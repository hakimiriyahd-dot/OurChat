import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabase'
import { db } from '../db'
import { v4 as uuid } from 'uuid'
import { Plus, X } from 'lucide-react'

export default function StatusPage() {
  const { user } = useAuth()
  const [statuses, setStatuses] = useState([])
  const [composer, setComposer] = useState(false)
  const [text, setText] = useState('')

  const load = async () => {
    const list = await db.statuses.toArray()
    const active = list.filter(s => new Date(s.expires_at) > new Date())
    setStatuses(active)
  }
  useEffect(() => { load() }, [])

  const post = async () => {
    if (!text.trim()) return
    const s = {
      id: uuid(), user_id: user.id, content: text, media_url: null,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 86400000).toISOString()
    }
    await db.statuses.put(s)
    if (navigator.onLine) await supabase.from('statuses').insert(s)
    setText(''); setComposer(false); load()
  }

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-primary)' }}>
      <div className="flex items-center justify-between px-6 py-3" style={{ background: 'var(--header)' }}>
        <h1 className="text-white text-lg font-medium">Status</h1>
        <button onClick={() => setComposer(c => !c)} className="text-white p-2 rounded hover:bg-white/10">
          {composer ? <X size={20}/> : <Plus size={20}/>}
        </button>
      </div>

      {composer && (
        <div className="p-4 border-b">
          <textarea value={text} onChange={e => setText(e.target.value)}
                    placeholder="Type a status..." rows={3}
                    className="w-full p-3 rounded-lg border outline-none"
                    style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', borderColor: 'rgba(0,0,0,0.1)' }}/>
          <button onClick={post} className="mt-2 px-4 py-2 rounded text-white text-sm" style={{ background: 'var(--accent)' }}>Post</button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {statuses.length === 0 && <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No active statuses.</p>}
        {statuses.map(s => (
          <div key={s.id} className="p-3 rounded-lg border" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
            <div className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
              {new Date(s.created_at).toLocaleString()}
            </div>
            <div className="text-sm">{s.content}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
