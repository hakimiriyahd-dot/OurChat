import { useState, useRef } from 'react'
import { Smile, Paperclip, Mic, Send, X } from 'lucide-react'
import EmojiPicker from 'emoji-picker-react'

export default function MessageInput({ onSend, onTyping, replyTo, onCancelReply }) {
  const [text, setText] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const fileRef = useRef(null)
  const typingTimer = useRef(null)

  const handleSend = () => {
    if (!text.trim()) return
    onSend(text.trim())
    setText('')
    setShowEmoji(false)
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const handleChange = (e) => {
    setText(e.target.value)
    if (typingTimer.current) clearTimeout(typingTimer.current)
    onTyping?.()
    typingTimer.current = setTimeout(() => {}, 2000)
  }

  const handleFile = async (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => {
      onSend(`📎 ${f.name}`, 'image', reader.result)
    }
    reader.readAsDataURL(f)
    e.target.value = ''
  }

  return (
    <div className="flex-shrink-0 px-2 py-2" style={{ background: 'var(--bg-secondary)' }}>
      {replyTo && (
        <div className="flex items-center gap-2 px-3 py-1 mb-1 rounded border-l-4 text-sm"
             style={{ borderColor: 'var(--accent)', background: 'var(--bg-primary)' }}>
          <div className="flex-1 truncate" style={{ color: 'var(--text-secondary)' }}>
            Replying: {replyTo.content?.slice(0, 60) || '[media]'}
          </div>
          <button onClick={onCancelReply}><X size={14}/></button>
        </div>
      )}
      {showEmoji && (
        <div className="absolute bottom-20 right-4 z-40">
          <EmojiPicker onEmojiClick={e => setText(t => t + e.emoji)} theme="auto" />
        </div>
      )}
      <div className="flex items-end gap-2">
        <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-2xl" style={{ background: 'var(--bg-primary)' }}>
          <button onClick={() => setShowEmoji(s => !s)}><Smile size={22} style={{ color: 'var(--text-secondary)' }}/></button>
          <button onClick={() => fileRef.current?.click()}><Paperclip size={20} style={{ color: 'var(--text-secondary)' }}/></button>
          <input type="file" ref={fileRef} className="hidden" onChange={handleFile}/>
          <textarea
            rows={1}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKey}
            placeholder="Type a message"
            className="flex-1 bg-transparent outline-none resize-none text-sm py-1 max-h-32"
            style={{ color: 'var(--text-primary)' }}
          />
          <button><Mic size={20} style={{ color: 'var(--text-secondary)' }}/></button>
        </div>
        <button onClick={handleSend} className="rounded-full p-3 text-white" style={{ background: 'var(--accent)' }}>
          <Send size={18}/>
        </button>
      </div>
    </div>
  )
}
