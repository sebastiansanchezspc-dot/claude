import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from './useAuth.jsx'
import { getPlan } from '../lib/planes.js'

const NegocioContext = createContext(null)

const DEFAULT_CONFIG = { nombre_negocio: 'Mi Negocio', rubros_activos: ['automotriz'], plan: 'standard', max_usuarios: 1 }

export function NegocioProvider({ children }) {
  const { user } = useAuth()
  const [config, setConfig] = useState(DEFAULT_CONFIG)
  const [totalUsuarios, setTotalUsuarios] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return }
    const [{ data }, { count }] = await Promise.all([
      supabase.from('negocio_config').select('*').limit(1).maybeSingle(),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
    ])
    if (data) setConfig(data)
    setTotalUsuarios(count || 0)
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

  const updatePlan = useCallback(async (planKey) => {
    if (!config.id) return
    const plan = getPlan(planKey)
    if (totalUsuarios > plan.maxUsuarios) {
      return { error: { message: `No puedes bajar a ${plan.label}: ya tienes ${totalUsuarios} usuarios y el plan permite ${plan.maxUsuarios}. Elimina o desactiva usuarios primero.` } }
    }
    const { data, error } = await supabase.from('negocio_config').update({ plan: planKey }).eq('id', config.id).select().single()
    if (!error && data) setConfig(data)
    return { error }
  }, [config.id, totalUsuarios])

  const value = {
    rubrosActivos: config.rubros_activos || ['automotriz'],
    nombreNegocio: config.nombre_negocio || 'Mi Negocio',
    plan: config.plan || 'standard',
    maxUsuarios: config.max_usuarios || 1,
    totalUsuarios,
    loading,
    updateRubros,
    updateNombre,
    updatePlan,
    refreshUsuarios: load,
  }

  return <NegocioContext.Provider value={value}>{children}</NegocioContext.Provider>
}

export function useNegocio() {
  const ctx = useContext(NegocioContext)
  if (!ctx) throw new Error('useNegocio debe usarse dentro de NegocioProvider')
  return ctx
}
