import { useState } from 'react'
import { useAuth } from './context/AuthContext'
import Auth from './components/Auth'
import Sidebar from './components/Sidebar'
import ChatWindow from './components/ChatWindow'
import StatusPage from './components/StatusPage'
import StarredMessages from './components/StarredMessages'
import ArchivedChats from './components/ArchivedChats'
import CreateGroup from './components/CreateGroup'
import Settings from './components/Settings'

function EmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-8"
         style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
      <div className="w-40 h-40 rounded-full mb-6 flex items-center justify-center"
           style={{ background: 'var(--bg-chat)' }}>
        <svg viewBox="0 0 24 24" width="80" height="80" fill="var(--accent)">
          <path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"/>
        </svg>
      </div>
      <h1 className="text-3xl font-light mb-3" style={{ color: 'var(--text-primary)' }}>OurChat Web</h1>
      <p className="max-w-md text-sm leading-relaxed">
        Send and receive messages without keeping your phone online.<br/>
        Select a chat or start a new conversation.
      </p>
    </div>
  )
}

export default function App() {
  const { user, loading } = useAuth()
  const [view, setView] = useState('chats')
  const [activeChatId, setActiveChatId] = useState(null)

  if (loading) {
    return <div className="h-screen w-screen flex items-center justify-center" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Loading…</div>
  }
  if (!user) return <Auth />

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <div className="w-full sm:w-[380px] flex-shrink-0 flex flex-col border-r" style={{ background: 'var(--bg-secondary)', borderColor: 'rgba(0,0,0,0.08)' }}>
        <Sidebar
          view={view}
          setView={setView}
          activeChatId={activeChatId}
          setActiveChatId={setActiveChatId}
        />
      </div>
      <div className="flex-1 hidden sm:flex flex-col min-w-0">
        {view === 'chats' && (activeChatId
          ? <ChatWindow chatId={activeChatId} onClose={() => setActiveChatId(null)} />
          : <EmptyState />)}
        {view === 'status' && <StatusPage />}
        {view === 'starred' && <StarredMessages onOpenChat={(id) => { setView('chats'); setActiveChatId(id) }} />}
        {view === 'archived' && <ArchivedChats onOpenChat={(id) => { setView('chats'); setActiveChatId(id) }} />}
        {view === 'group-create' && <CreateGroup onCreated={(id) => { setView('chats'); setActiveChatId(id) }} />}
        {view === 'settings' && <Settings />}
      </div>
    </div>
  )
}
