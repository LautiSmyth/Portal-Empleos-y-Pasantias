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
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'Método no permitido' })
  if (!isAuthorized(req)) return res.status(401).json({ ok: false, error: 'Unauthorized' })
  const emailQ = (req.query?.email || '').toString().trim().toLowerCase()
  const roleQ = (req.query?.role || '').toString().trim()
  const uniQ = (req.query?.university || '').toString().trim()
  const limit = Number(req.query?.limit || 20)

  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: Math.min(limit, 50) })
    if (error) return res.status(400).json({ ok: false, error: error.message || 'No se pudo listar usuarios' })
    const users = Array.isArray(data?.users) ? data.users : []
    const filtered = users.filter(u => {
      const email = (u.email || '').toLowerCase()
      const matchEmail = emailQ ? email.includes(emailQ) : true
      return matchEmail
    })
    const ids = filtered.map(u => u.id)
    let q = supabase
      .from('profiles')
      .select('id, first_name, role, university, company_verified, created_at')
      .in('id', ids)
    if (roleQ && ['STUDENT','COMPANY','ADMIN'].includes(roleQ)) {
      q = q.eq('role', roleQ)
    }
    if (uniQ) q = q.ilike('university', `%${uniQ}%`)
    const { data: profiles, error: pErr } = await q
    if (pErr) console.warn('search-users: profiles query failed', pErr)
    const byId = new Map((profiles || []).map((p: any) => [p.id, p]))
    const results = filtered.slice(0, limit).map(u => ({
      id: u.id,
      email: u.email,
      email_verified: Boolean((u as any)?.email_confirmed_at),
      first_name: byId.get(u.id)?.first_name || null,
      role: byId.get(u.id)?.role || 'STUDENT',
      university: byId.get(u.id)?.university || null,
      company_verified: byId.get(u.id)?.company_verified || null,
      created_at: byId.get(u.id)?.created_at || u.created_at || new Date().toISOString(),
    }))
    return res.status(200).json({ ok: true, results })
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message || 'Fallo inesperado' })
  }
}