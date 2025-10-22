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
  let { user_id, email } = body || {}
  if (!user_id && !email) return res.status(400).json({ ok: false, error: 'user_id o email requerido' })
  try {
    const supabase = getSupabaseAdmin()
    if (!user_id) {
      const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 })
      if (error) return res.status(400).json({ ok: false, error: error.message || 'No se pudo obtener usuarios' })
      const found = (data?.users || []).find((u: any) => (u.email || '').toLowerCase() === (email || '').toLowerCase())
      if (!found) return res.status(404).json({ ok: false, error: 'Usuario no encontrado por email' })
      user_id = found.id
    }
    const { error } = await supabase.auth.admin.updateUserById(user_id, { email_confirm: true })
    if (error) return res.status(400).json({ ok: false, error: error.message || 'No se pudo autorizar la cuenta' })
    return res.status(200).json({ ok: true })
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message || 'Fallo inesperado' })
  }
}