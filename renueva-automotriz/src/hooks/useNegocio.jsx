import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from './useAuth.jsx'

const NegocioContext = createContext(null)

const DEFAULT_CONFIG = { nombre_negocio: 'Mi Negocio', rubros_activos: ['automotriz'] }

export function NegocioProvider({ children }) {
  const { user } = useAuth()
  const [config, setConfig] = useState(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return }
    const { data } = await supabase.from('negocio_config').select('*').limit(1).maybeSingle()
    if (data) setConfig(data)
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  const updateRubros = useCallback(async (rubros) => {
    if (!config.id) return
    const { error } = await supabase.from('negocio_config').update({ rubros_activos: rubros }).eq('id', config.id)
    if (!error) setConfig((c) => ({ ...c, rubros_activos: rubros }))
    return { error }
  }, [config.id])

  const updateNombre = useCallback(async (nombre) => {
    if (!config.id) return
    const { error } = await supabase.from('negocio_config').update({ nombre_negocio: nombre }).eq('id', config.id)
    if (!error) setConfig((c) => ({ ...c, nombre_negocio: nombre }))
    return { error }
  }, [config.id])

  const value = {
    rubrosActivos: config.rubros_activos || ['automotriz'],
    nombreNegocio: config.nombre_negocio || 'Mi Negocio',
    loading,
    updateRubros,
    updateNombre,
  }

  return <NegocioContext.Provider value={value}>{children}</NegocioContext.Provider>
}

export function useNegocio() {
  const ctx = useContext(NegocioContext)
  if (!ctx) throw new Error('useNegocio debe usarse dentro de NegocioProvider')
  return ctx
}
