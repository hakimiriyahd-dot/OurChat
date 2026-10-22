import { useTheme } from '../context/ThemeContext'
import { useFont } from '../context/FontContext'
import { useAuth } from '../context/AuthContext'
import { ArrowLeft } from 'lucide-react'

export default function Settings({ onBack }) {
  const { themeKey, setTheme, presets } = useTheme()
  const { fontKey, setFont, families, fontWeight, setWeight, fontStyle, setStyle, fontSize, setSize } = useFont()
  const { profile, signOut } = useAuth()

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ background: 'var(--bg-primary)' }}>
      <div className="px-4 py-3 sticky top-0 flex items-center gap-4" style={{ background: 'var(--header)' }}>
        <button onClick={onBack} className="text-white sm:hidden"><ArrowLeft size={20}/></button>
        <h1 className="text-white text-lg font-medium">Settings</h1>
      </div>
      
      <div className="p-6 space-y-6 max-w-2xl">
        <div>
          <h2 className="font-semibold mb-2">Profile</h2>
          <div className="p-3 rounded-lg border" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
            <div className="text-sm">Username: <b>{profile?.username}</b></div>
            <div className="text-sm mt-1">Phone: {profile?.phone || '—'}</div>
            <button onClick={signOut} className="mt-3 px-3 py-1.5 rounded text-sm text-white" style={{ background: 'var(--accent)' }}>
              Logout
            </button>
          </div>
        </div>

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
          <div className="mt-3 flex gap-2 flex-wrap">
            <button onClick={() => setWeight(fontWeight === 'bold' ? 'normal' : 'bold')}
                    className="px-3 py-1 rounded text-sm border font-bold" style={{ borderColor: 'rgba(0,0,0,0.15)' }}>Bold</button>
            <button onClick={() => setStyle(fontStyle === 'italic' ? 'normal' : 'italic')}
                    className="px-3 py-1 rounded text-sm border italic" style={{ borderColor: 'rgba(0,0,0,0.15)' }}>Italic</button>
            <div className="flex items-center gap-2 ml-2">
              <span className="text-xs">Size</span>
              <input type="range" min={12} max={20} value={fontSize} onChange={e => setSize(Number(e.target.value))}/>
              <span className="text-xs">{fontSize}px</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
