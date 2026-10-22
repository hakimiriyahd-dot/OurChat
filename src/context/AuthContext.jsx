import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { db } from '../db'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function bootstrap(session) {
      if (!session?.user) {
        if (mounted) { setUser(null); setProfile(null); setLoading(false) }
        return
      }
      const u = session.user
      if (mounted) setUser(u)

      // Try local profile first (offline)
      const local = await db.profiles.get(u.id)
      if (local && mounted) setProfile(local)

      // Sync from Supabase
      const { data } = await supabase.from('profiles').select('*').eq('id', u.id).maybeSingle()
      if (data) {
        await db.profiles.put(data)
        if (mounted) setProfile(data)
      } else {
        // Auto-create profile
        const username = u.email ? u.email.split('@')[0] : 'user'
        const newProfile = { id: u.id, username, phone: '' }
        await supabase.from('profiles').insert(newProfile).select().maybeSingle()
        await db.profiles.put(newProfile)
        if (mounted) setProfile(newProfile)
      }
      if (mounted) setLoading(false)
    }

    supabase.auth.getSession().then(({ data }) => bootstrap(data.session))

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      bootstrap(session)
    })

    return () => { mounted = false; sub.subscription.unsubscribe() }
  }, [])

  const signUp = async (email, password, username) => {
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: { username } // Saves username to user metadata just in case
      }
    })
    if (error) throw error
    
    // Immediately create the profile
    if (data.user) {
      const p = { id: data.user.id, username: username || email.split('@')[0], phone: '' }
      await supabase.from('profiles').upsert(p)
      await db.profiles.put(p)
      
      // Force user state immediately to trigger the UI switch to /chat
      if (data.session) {
        setUser(data.user)
        setProfile(p)
      }
    }
    return data
  }

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null); setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() { return useContext(AuthContext) }
