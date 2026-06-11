import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useAuth() {
  const [session, setSession]   = useState(undefined) // undefined = todavía cargando
  const [profile, setProfile]   = useState(null)
  const fetchingRef             = useRef(false)

  const loading = session === undefined

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (event === 'SIGNED_OUT' || !newSession) {
        setSession(null)
        setProfile(null)
        return
      }
      setSession(newSession)
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        await fetchOrCreateProfile(newSession)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchOrCreateProfile(sess) {
    if (fetchingRef.current) return
    fetchingRef.current = true
    try {
      const authId = sess.user.id
      const nombre = sess.user.user_metadata?.full_name
                  || sess.user.user_metadata?.name
                  || sess.user.email
      const email  = sess.user.email

      const { data: existing } = await supabase
        .from('inspectores').select('*').eq('google_id', authId).maybeSingle()

      if (existing) { setProfile(existing); return }

      const { data: nuevo, error: insertError } = await supabase
        .from('inspectores')
        .insert({ google_id: authId, nombre, email, rol: 'inspector' })
        .select().maybeSingle()

      if (insertError?.code === '23505') {
        // Carrera entre dos inserts simultáneos: releer
        const { data: retry } = await supabase
          .from('inspectores').select('*').eq('google_id', authId).maybeSingle()
        setProfile(retry)
      } else if (!insertError) {
        setProfile(nuevo)
      } else {
        console.error('Error creando perfil:', insertError)
      }
    } finally {
      fetchingRef.current = false
    }
  }

  async function refreshProfile() {
    if (!session) return
    const { data } = await supabase
      .from('inspectores').select('*').eq('google_id', session.user.id).maybeSingle()
    if (data) setProfile(data)
  }

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signUp(email, password, nombre) {
    const { error } = await supabase.auth.signUp({
      email, password, options: { data: { full_name: nombre } },
    })
    if (error) throw error
  }

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) throw error
  }

  async function signOut() {
    setProfile(null)
    setSession(null)
    await supabase.auth.signOut()
  }

  return { session, profile, loading, signIn, signUp, signInWithGoogle, signOut, refreshProfile }
}
