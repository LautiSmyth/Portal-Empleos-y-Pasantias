import { supabase } from './supabaseClient'
import { ApplicationStatus, Role } from '../types'

export async function updateApplicationStatus(appId: string, newStatus: ApplicationStatus): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.rpc('admin_update_application_status', { app_id: appId, new_status: newStatus })
  if (error) return { ok: false, error: error.message || 'No se pudo actualizar el estado de la postulación' }
  return { ok: true }
}

export async function toggleJobActive(jobId: string, active: boolean): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.rpc('admin_toggle_job_active', { job_id: jobId, active })
  if (error) return { ok: false, error: error.message || 'No se pudo actualizar el estado del puesto' }
  return { ok: true }
}

export async function toggleCompanySuspended(companyId: string, suspended: boolean): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.rpc('admin_toggle_company_suspended', { company_id: companyId, suspended })
  if (error) return { ok: false, error: error.message || 'No se pudo actualizar el estado de la empresa' }
  return { ok: true }
}

export async function createUserViaAdminApi(payload: { email: string; password: string; role: Role; name?: string }): Promise<{ ok: boolean; error?: string }> {
  const adminApiUrl = (import.meta as any).env?.VITE_ADMIN_API_URL || process.env.VITE_ADMIN_API_URL || ''
  if (!adminApiUrl) return { ok: false, error: 'Configurar VITE_ADMIN_API_URL apuntando al endpoint de servicio (server con service role).'
  }
  try {
    const token = (import.meta as any).env?.VITE_ADMIN_API_TOKEN || process.env.VITE_ADMIN_API_TOKEN || ''
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) headers['X-Admin-Token'] = token
    const res = await fetch(`${adminApiUrl}/create-user`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) return { ok: false, error: json?.error || 'Fallo al crear usuario en API admin' }
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'No se pudo contactar al API admin' }
  }
}

export async function requestPasswordReset(email: string): Promise<{ ok: boolean; error?: string; link?: string }> {
  const adminApiUrl = (import.meta as any).env?.VITE_ADMIN_API_URL || process.env.VITE_ADMIN_API_URL || ''
  if (!adminApiUrl) return { ok: false, error: 'Configurar VITE_ADMIN_API_URL para reset password (server con service role).' }
  try {
    const token = (import.meta as any).env?.VITE_ADMIN_API_TOKEN || process.env.VITE_ADMIN_API_TOKEN || ''
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) headers['X-Admin-Token'] = token
    const res = await fetch(`${adminApiUrl}/reset-password`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ email }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) return { ok: false, error: json?.error || 'Fallo al iniciar reset de contraseña' }
    return { ok: true, link: json?.action_link }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'No se pudo contactar al API admin' }
  }
}

// Admin: actualizar perfil con Service Role
// Estrategia: preferir API admin; si no está configurada, intentar RPC 'admin_update_profile';
// como último recurso (no recomendado), update directo (puede fallar por RLS).
export async function adminUpdateProfile(payload: { userId: string; firstName?: string | null; university?: string | null; role?: Role }): Promise<{ ok: boolean; error?: string }> {
  const adminApiUrl = (import.meta as any).env?.VITE_ADMIN_API_URL || process.env.VITE_ADMIN_API_URL || ''
  try {
    if (adminApiUrl) {
      const token = (import.meta as any).env?.VITE_ADMIN_API_TOKEN || process.env.VITE_ADMIN_API_TOKEN || ''
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['X-Admin-Token'] = token
      const res = await fetch(`${adminApiUrl}/update-profile`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          user_id: payload.userId,
          first_name: payload.firstName ?? null,
          university: payload.university ?? null,
          role: payload.role ?? null,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) return { ok: false, error: json?.error || 'Fallo al actualizar perfil en API admin' }
      return { ok: true }
    }

    // Fallback a RPC
    const { error: rpcErr } = await supabase.rpc('admin_update_profile', {
      user_id: payload.userId,
      first_name: payload.firstName ?? null,
      university: payload.university ?? null,
      role: payload.role ?? null,
    })
    if (rpcErr) return { ok: false, error: rpcErr.message || 'No se pudo actualizar perfil (RPC)' }
    return { ok: true }
  } catch (e: any) {
    // Último recurso: update directo (puede fallar por RLS)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ first_name: payload.firstName ?? null, university: payload.university ?? null, role: payload.role ?? null })
        .eq('id', payload.userId)
      if (error) return { ok: false, error: error.message || 'No se pudo actualizar perfil (RLS)' }
      return { ok: true }
    } catch (e2: any) {
      return { ok: false, error: e2?.message || e?.message || 'Fallo inesperado al actualizar perfil' }
    }
  }
}

// Registrar auditoría; intenta insertar en admin_logs; si no, usa API admin
export async function logAdminAction(params: { actorId: string; action: string; entity: string; entityId?: string; details?: any }): Promise<void> {
  try {
    const { error } = await supabase
      .from('admin_logs')
      .insert({
        actor_id: params.actorId,
        action: params.action,
        entity: params.entity,
        entity_id: params.entityId || null,
        details: params.details ?? null,
      })
    if (!error) return
  } catch (_) {}

  const adminApiUrl = (import.meta as any).env?.VITE_ADMIN_API_URL || process.env.VITE_ADMIN_API_URL || ''
  if (!adminApiUrl) return
  try {
    const token = (import.meta as any).env?.VITE_ADMIN_API_TOKEN || process.env.VITE_ADMIN_API_TOKEN || ''
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) headers['X-Admin-Token'] = token
    await fetch(`${adminApiUrl}/log`, {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    })
  } catch (_) {}
}

// Búsqueda de perfiles; si hay email, usar API admin (auth.users); si no, filtrar por rol/universidad en profiles
export async function searchProfiles(criteria: { email?: string; role?: Role | 'ALL'; universityLike?: string; limit?: number }): Promise<Array<{ id: string; first_name: string | null; role: Role; university: string | null; company_verified: boolean | null; created_at: string; email?: string }>> {
  const limit = criteria.limit ?? 20
  const email = (criteria.email || '').trim()
  const adminApiUrl = (import.meta as any).env?.VITE_ADMIN_API_URL || process.env.VITE_ADMIN_API_URL || ''

  // Buscar por email vía API admin
  if (email && adminApiUrl) {
    try {
      const url = new URL(`${adminApiUrl}/search-users`)
      url.searchParams.set('email', email)
      url.searchParams.set('limit', String(limit))
      if (criteria.role && criteria.role !== 'ALL') url.searchParams.set('role', String(criteria.role))
      if (criteria.universityLike) url.searchParams.set('university', criteria.universityLike)
      const token = (import.meta as any).env?.VITE_ADMIN_API_TOKEN || process.env.VITE_ADMIN_API_TOKEN || ''
      const headers: Record<string, string> = {}
      if (token) headers['X-Admin-Token'] = token
      const res = await fetch(url.toString(), { headers })
      const json = await res.json().catch(() => ({}))
      if (res.ok && Array.isArray(json?.results)) {
        return json.results as Array<{ id: string; first_name: string | null; role: Role; university: string | null; company_verified: boolean | null; created_at: string; email?: string }>
      }
    } catch (_) {}
  }

  // Fallback a consulta directa por rol/universidad
  let q = supabase
    .from('profiles')
    .select('id, first_name, role, university, company_verified, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (criteria.role && criteria.role !== 'ALL') {
    q = q.eq('role', criteria.role)
  }
  if (criteria.universityLike) {
    q = q.ilike('university', `%${criteria.universityLike}%`)
  }
  const { data } = await q
  return (data || []) as Array<{ id: string; first_name: string | null; role: Role; university: string | null; company_verified: boolean | null; created_at: string }>
}

export async function authorizeUserAccount(params: { userId?: string; email?: string }): Promise<{ ok: boolean; error?: string }> {
  const adminApiUrl = (import.meta as any).env?.VITE_ADMIN_API_URL || process.env.VITE_ADMIN_API_URL || ''
  if (!adminApiUrl) {
    return { ok: false, error: 'Configurar VITE_ADMIN_API_URL para autorizar cuentas (requiere Service Role).' }
  }
  try {
    const token = (import.meta as any).env?.VITE_ADMIN_API_TOKEN || process.env.VITE_ADMIN_API_TOKEN || ''
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) headers['X-Admin-Token'] = token
    const res = await fetch(`${adminApiUrl}/authorize-user`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ user_id: params.userId, email: params.email }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) return { ok: false, error: json?.error || 'Fallo al autorizar la cuenta' }
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'No se pudo contactar al API admin' }
  }
}