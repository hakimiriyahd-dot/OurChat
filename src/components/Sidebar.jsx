import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import ChatList from './ChatList'
import { Search, Menu, CircleDashed, Star, Archive, Settings as SettingsIcon, LogOut, MessageCirclePlus } from 'lucide-react'

export default function Sidebar({ view, setView, activeChatId, setActiveChatId }) {
  const { profile, signOut } = useAuth()
  const { themeKey } = useTheme()
  const [tab, setTab] = useState('all')
  const [q, setQ] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  const isDark = themeKey !== 'light'

  return (
    <div className="flex flex-col h-full relative">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2" style={{ background: 'var(--header)' }}>
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('settings')}>
          <img src={profile?.avatar_url} alt="avatar" className="w-9 h-9 rounded-full bg-white/20" />
          <div className="text-white text-sm font-medium hover:underline">{profile?.username || 'You'}</div>
        </div>
        <div className="flex items-center gap-1 text-white relative">
          <button className="p-2 rounded hover:bg-white/10" title="New Chat" onClick={() => setView('group-create')}>
            <MessageCirclePlus size={18}/>
          </button>
          <button className="p-2 rounded hover:bg-white/10" title="Menu" onClick={() => setMenuOpen(o => !o)}>
            <Menu size={18}/>
          </button>
          {menuOpen && (
            <div className="absolute top-10 right-0 z-50 w-56 rounded-lg shadow-xl overflow-hidden"
                 style={{ background: isDark ? '#233138' : '#FFFFFF', color: 'var(--text-primary)' }}>
              <MenuItem icon={<CircleDashed size={16}/>} label="Status" onClick={() => { setView('status'); setMenuOpen(false) }}/>
              <MenuItem icon={<Star size={16}/>} label="Starred messages" onClick={() => { setView('starred'); setMenuOpen(false) }}/>
              <MenuItem icon={<Archive size={16}/>} label="Archived chats" onClick={() => { setView('archived'); setMenuOpen(false) }}/>
              <MenuItem icon={<SettingsIcon size={16}/>} label="Settings" onClick={() => { setView('settings'); setMenuOpen(false) }}/>
              <MenuItem icon={<LogOut size={16}/>} label="Logout" onClick={signOut}/>
            </div>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="p-2" style={{ background: 'var(--bg-secondary)' }}>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'var(--bg-primary)' }}>
          <Search size={16} style={{ color: 'var(--text-secondary)' }}/>
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search or start new chat"
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-3 pb-2" style={{ background: 'var(--bg-secondary)' }}>
        {[{ k: 'all', label: 'All' }, { k: 'unread', label: 'Unread' }, { k: 'groups', label: 'Groups' }].map(t => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className="px-3 py-1 rounded-full text-xs font-medium"
            style={{ background: tab === t.k ? 'var(--accent)' : 'transparent', color: tab === t.k ? '#fff' : 'var(--text-secondary)' }}
          >{t.label}</button>
        ))}
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin" style={{ background: 'var(--bg-primary)' }}>
        <ChatList
          filter={tab}
          query={q}
          activeChatId={activeChatId}
          onSelect={(id) => { setView('chats'); setActiveChatId(id) }}
          onSwitchView={setView}
        />
      </div>
    </div>
  )
}

function MenuItem({ icon, label, onClick }) {
  return (
    <button onClick={onClick} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-black/5 text-left" style={{ color: 'inherit' }}>
      {icon} <span>{label}</span>
    </button>
  )
}
