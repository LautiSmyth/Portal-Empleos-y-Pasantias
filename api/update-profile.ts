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

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Método no permitido' })
  if (!isAuthorized(req)) return res.status(401).json({ ok: false, error: 'Unauthorized' })
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {})
  const { user_id, first_name = null, university = null, role = null } = body || {}
  if (!user_id) return res.status(400).json({ ok: false, error: 'user_id requerido' })
  try {
    const supabase = getSupabaseAdmin()
    const payload: any = {}
    if (first_name !== undefined) payload.first_name = first_name
    if (university !== undefined) payload.university = university
    if (role !== undefined && role) payload.role = role
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