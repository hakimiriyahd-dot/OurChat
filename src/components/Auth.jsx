import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Auth() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setErr(''); setBusy(true)
    try {
      if (mode === 'login') {
        await signIn(email, password)
      } else {
        await signUp(email, password, username)
        // The AuthContext will instantly update the user state, 
        // and App.jsx will automatically switch to the Chat UI.
      }
    } catch (e) {
      setErr(e.message || 'Something went wrong')
    } finally { 
      setBusy(false) 
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
         style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
      <div className="w-full max-w-md rounded-2xl shadow-xl p-8" style={{ background: 'var(--bg-primary)' }}>
        <h1 className="text-3xl font-semibold mb-1" style={{ color: 'var(--accent)' }}>OurChat</h1>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          {mode === 'login' ? 'Sign in to continue' : 'Create your account'}
        </p>

        <form onSubmit={submit} className="space-y-3">
          {mode === 'signup' && (
            <input
              className="w-full p-3 rounded-lg outline-none border"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', borderColor: 'rgba(0,0,0,0.1)' }}
              placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required
            />
          )}
          <input
            className="w-full p-3 rounded-lg outline-none border"
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', borderColor: 'rgba(0,0,0,0.1)' }}
            type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required
          />
          <input
            className="w-full p-3 rounded-lg outline-none border"
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', borderColor: 'rgba(0,0,0,0.1)' }}
            type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
          />
          
          {err && <div className="text-sm text-red-500 font-medium">{err}</div>}
          
          <button disabled={busy} className="w-full p-3 rounded-lg text-white font-semibold disabled:opacity-60 transition-opacity" style={{ background: 'var(--accent)' }}>
            {busy ? 'Please wait…' : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <button className="mt-4 text-sm w-full hover:underline" style={{ color: 'var(--accent)' }}
                onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setErr('') }}>
          {mode === 'login' ? 'No account? Sign up' : 'Have an account? Sign in'}
        </button>
      </div>
    </div>
  )
}
