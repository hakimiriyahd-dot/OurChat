import { useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useFont } from '../context/FontContext'
import { useAuth } from '../context/AuthContext'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { supabase } from '../supabase'
import { db } from '../db'

export default function Settings({ onBack }) {
  const { themeKey, setTheme, presets } = useTheme()
  const { fontKey, setFont, families, fontWeight, setWeight, fontStyle, setStyle, fontSize, setSize } = useFont()
  const { profile, signOut, user } = useAuth()
  
  const [avatarSeed, setAvatarSeed] = useState(profile?.username || 'user')

  const updateAvatar = async () => {
    const newAvatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${avatarSeed}`
    await supabase.from('profiles').update({ avatar_url: newAvatarUrl }).eq('id', user.id)
    await db.profiles.update(user.id, { avatar_url: newAvatarUrl })
    window.location.reload() // Quick refresh to update everywhere
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ background: 'var(--bg-primary)' }}>
      <div className="px-4 py-3 sticky top-0 flex items-center gap-4 z-10" style={{ background: 'var(--header)' }}>
        <button onClick={onBack} className="text-white sm:hidden"><ArrowLeft size={20}/></button>
        <h1 className="text-white text-lg font-medium">Settings</h1>
      </div>
      
      <div className="p-6 space-y-8 max-w-2xl">
        <div>
          <h2 className="font-semibold mb-4">Profile</h2>
          <div className="p-4 rounded-xl border flex flex-col items-center gap-4" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
            <img src={profile?.avatar_url} alt="Avatar" className="w-24 h-24 rounded-full bg-gray-200" />
            
            <div className="w-full flex gap-2 items-center">
              <input 
                value={avatarSeed} 
                onChange={e => setAvatarSeed(e.target.value)} 
                placeholder="Type a name for new avatar"
                className="flex-1 p-2 rounded-lg border text-sm outline-none"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', borderColor: 'rgba(0,0,0,0.1)' }}
              />
              <button onClick={updateAvatar} className="p-2 rounded-lg text-white" style={{ background: 'var(--accent)' }}>
                <RefreshCw size={18}/>
              </button>
            </div>

            <div className="w-full border-t pt-4 mt-2 text-sm text-center" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
              Username: <b>{profile?.username}</b>
            </div>
            
            <button onClick={signOut} className="w-full py-2 rounded-lg text-sm text-red-500 bg-red-50 dark:bg-red-900/20 font-medium">
              Logout
            </button>
          </div>
        </div>

        {/* Themes and Fonts... */}
        <div>
          <h2 className="font-semibold mb-2">Theme</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(presets).map(([k, p]) => (
              <button key={k} onClick={() => setTheme(k)}
                      className="p-3 rounded-lg border text-left text-sm"
                      style={{
                        borderColor: themeKey === k ? 'var(--accent)' : 'rgba(0,0,0,0.08)',
                        background: p.colors.sidebar, color: p.colors.text
                      }}>
                {p.name}
                <div className="mt-1 flex gap-1">
                  {['bubbleMe', 'bubbleOther', 'accent'].map(f => (
                    <span key={f} className="w-3 h-3 rounded-full" style={{ background: p.colors[f] }}/>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-semibold mb-2">Font</h2>
          <div className="grid grid-cols-2 gap-2">
            {families.map(f => (
              <button key={f.key} onClick={() => setFont(f.key)}
                      className="p-2 rounded border text-sm"
                      style={{
                        borderColor: fontKey === f.key ? 'var(--accent)' : 'rgba(0,0,0,0.08)',
                        fontFamily: f.css
                      }}>
                {f.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
