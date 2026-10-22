import { useState } from 'react'
import { format } from 'date-fns'
import { Check, CheckCheck, Star, Pin, Trash2, Reply, Smile } from 'lucide-react'

const QUICK_REACTS = ['👍', '❤️', '😂', '😮', '😢', '🙏']

export default function MessageBubble({
  msg, isMine, sameSender, statuses, reactions, senderName, isPinned, replyTo,
  onReply, onDelete, onReact, onStar, onPin
}) {
  const [open, setOpen] = useState(false)

  const tick = (() => {
    if (!isMine) return null
    const mine = statuses.find(s => s.user_id !== msg.sender_id)
    const byStatus = statuses.map(s => s.status)
    if (byStatus.includes('read')) return 'read'
    if (byStatus.includes('delivered')) return 'delivered'
    return 'sent'
  })()

  const grouped = {}
  for (const r of reactions) {
    grouped[r.emoji] = (grouped[r.emoji] || 0) + 1
  }

  if (msg.is_deleted) {
    return (
      <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} px-1`}>
        <div className="max-w-[75%] rounded-lg px-3 py-2 text-sm italic"
             style={{ background: 'var(--bubble-other)', color: 'var(--text-secondary)' }}>
          🚫 This message was deleted
        </div>
      </div>
    )
  }

  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} px-1 group`}>
      <div className="relative max-w-[85%] sm:max-w-[70%]">
        <div
          className={`relative rounded-lg px-3 py-2 shadow-sm ${isMine ? 'bubble-tail-me' : 'bubble-tail-other'}`}
          style={{ background: isMine ? 'var(--bubble-me)' : 'var(--bubble-other)', color: 'var(--text-primary)' }}
        >
          {!isMine && !sameSender && (
            <div className="text-xs font-semibold mb-0.5" style={{ color: 'var(--accent)' }}>{senderName || 'User'}</div>
          )}
          {replyTo && (
            <div className="border-l-4 pl-2 mb-1 text-xs opacity-80 rounded"
                 style={{ borderColor: 'var(--accent)', background: 'rgba(0,0,0,0.05)' }}>
              <div className="font-medium">{replyTo.sender_id === msg.sender_id ? 'You' : 'Reply'}</div>
              <div className="truncate">{replyTo.content || '[media]'}</div>
            </div>
          )}
          {msg.message_type === 'image' && msg.media_url ? (
            <img src={msg.media_url} alt="" className="rounded max-h-72 mb-1"/>
          ) : null}
          <div className="text-sm whitespace-pre-wrap break-words">{msg.content}</div>
          <div className="flex items-center justify-end gap-1 mt-0.5 text-[10px]" style={{ color: 'var(--text-secondary)' }}>
            <span>{format(new Date(msg.created_at), 'HH:mm')}</span>
            {isMine && (
              <>
                {tick === 'sent' && <Check size={12}/>}
                {tick === 'delivered' && <CheckCheck size={12}/>}
                {tick === 'read' && <CheckCheck size={12} style={{ color: '#53BDEB' }}/>}
              </>
            )}
            {isPinned && <Pin size={10}/>}
          </div>
        </div>

        {Object.keys(grouped).length > 0 && (
          <div className="absolute -bottom-3 left-2 bg-white dark:bg-gray-800 rounded-full px-1.5 py-0.5 shadow text-xs flex gap-0.5 border" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
            {Object.entries(grouped).map(([e, n]) => <span key={e}>{e}{n > 1 ? n : ''}</span>)}
          </div>
        )}

        <button
          onClick={() => setOpen(o => !o)}
          className="absolute top-0 right-0 -mt-1 -mr-1 opacity-0 group-hover:opacity-100 transition bg-white rounded-full p-1 shadow text-gray-600"
        ><Smile size={14}/></button>

        {open && (
          <div className="absolute z-30 top-0 -translate-y-full right-0 mb-1 bg-white rounded-lg shadow-xl p-1 flex gap-1">
            {QUICK_REACTS.map(e => (
              <button key={e} onClick={() => { onReact(e); setOpen(false) }} className="p-1 text-lg hover:bg-gray-100 rounded">{e}</button>
            ))}
          </div>
        )}

        <div className="hidden group-hover:flex absolute top-0 right-0 translate-x-full pl-2 gap-1">
          <IconBtn onClick={onReply} title="Reply"><Reply size={14}/></IconBtn>
          <IconBtn onClick={onStar} title="Star"><Star size={14}/></IconBtn>
          <IconBtn onClick={onPin} title="Pin"><Pin size={14}/></IconBtn>
          <IconBtn onClick={() => onDelete(false)} title="Delete for me"><Trash2 size={14}/></IconBtn>
          {isMine && <IconBtn onClick={() => onDelete(true)} title="Delete for everyone"><Trash2 size={14} color="red"/></IconBtn>}
        </div>
      </div>
    </div>
  )
}

function IconBtn({ children, onClick, title }) {
  return (
    <button onClick={onClick} title={title}
            className="bg-white p-1.5 rounded shadow hover:bg-gray-100 text-gray-700">{children}</button>
  )
}
