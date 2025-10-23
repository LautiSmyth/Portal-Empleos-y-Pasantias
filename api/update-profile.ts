import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE || ''
  if (!url || !key) throw new Error('SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY faltan')
  return createClient(url, key)
}

function isAuthorized(req: any) {
  const token = process.env.ADMIN_API_TOKEN
  if (!token) return true
  return (req.headers?.['x-admin-token'] || req.headers?.['X-Admin-Token']) === token
}

function sanitizeOptionalString(v: any): string | undefined {
  if (v === undefined) return undefined
  if (v === null) return undefined
  if (typeof v === 'string' && v.trim() === '') return undefined
  if (typeof v === 'string') return v
  return undefined
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Método no permitido' })
  if (!isAuthorized(req)) return res.status(401).json({ ok: false, error: 'Unauthorized' })
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {})
  const user_id = body?.user_id
  const has = (k: string) => Object.prototype.hasOwnProperty.call(body, k)
  const first_name_raw = has('first_name') ? (body as any).first_name : undefined
  const university_raw = has('university') ? (body as any).university : undefined
  const role_raw = has('role') ? (body as any).role : undefined
  const company_verified_raw = has('company_verified') ? (body as any).company_verified : undefined

  const first_name = sanitizeOptionalString(first_name_raw)
  const university = sanitizeOptionalString(university_raw)
  const role = (typeof role_raw === 'string' && role_raw.trim() !== '') ? role_raw : undefined
  const company_verified = typeof company_verified_raw === 'boolean' ? company_verified_raw : undefined

  if (!user_id) return res.status(400).json({ ok: false, error: 'user_id requerido' })
  try {
    const supabase = getSupabaseAdmin()

    // 1) Actualizar user_metadata para mantener consistencia con el cliente (App.tsx deriva rol y nombre).
    if (first_name !== undefined || role !== undefined) {
      const currentMeta: any = {}
      if (first_name !== undefined) currentMeta.name = first_name
      if (role !== undefined && role) currentMeta.role = role
      const { error: metaErr } = await supabase.auth.admin.updateUserById(user_id, { user_metadata: currentMeta })
      if (metaErr) {
        console.warn('update-profile: fallo al actualizar user_metadata', metaErr)
      }
    }

    // 2) Actualizar tabla profiles (ignorar strings vacíos y nulls)
    const payload: any = {}
    if (first_name !== undefined) payload.first_name = first_name
    if (university !== undefined) payload.university = university
    if (role !== undefined && role) payload.role = role
    if (company_verified !== undefined) payload.company_verified = company_verified
    if (Object.keys(payload).length === 0) return res.status(400).json({ ok: false, error: 'No hay campos válidos para actualizar' })

    const { error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', user_id)
    if (error) return res.status(400).json({ ok: false, error: error.message || 'No se pudo actualizar perfil' })
    return res.status(200).json({ ok: true })
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message || 'Fallo inesperado' })
  }
}