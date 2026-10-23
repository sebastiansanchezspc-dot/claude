import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'
import { applyTheme, DEFAULT_THEME } from '../lib/themes.js'
import { useAuth } from './useAuth.jsx'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const { profile } = useAuth()
  const [themeKey, setThemeKey] = useState(() => localStorage.getItem('ra_theme') || DEFAULT_THEME)

  useEffect(() => {
    applyTheme(themeKey)
    localStorage.setItem('ra_theme', themeKey)
  }, [themeKey])

  useEffect(() => {
    async function loadFromSupabase() {
      if (!profile?.id) return
      const { data } = await supabase
        .from('temas')
        .select('tema_key')
        .eq('profile_id', profile.id)
        .maybeSingle()
      if (data?.tema_key) setThemeKey(data.tema_key)
    }
    loadFromSupabase()
  }, [profile?.id])

  const setTheme = useCallback(async (key) => {
    setThemeKey(key)
    if (profile?.id) {
      await supabase
        .from('temas')
        .upsert({ profile_id: profile.id, tema_key: key }, { onConflict: 'profile_id' })
    }
  }, [profile?.id])

  return (
    <ThemeContext.Provider value={{ themeKey, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme debe usarse dentro de ThemeProvider')
  return ctx
}
