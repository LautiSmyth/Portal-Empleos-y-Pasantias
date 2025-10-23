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

    // Consultar rol del perfil para definir borrado en cascada
    const { data: profile, error: profErr } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user_id)
      .maybeSingle()
    if (profErr) console.warn('delete-user: error obteniendo perfil', profErr)
    const role = (profile as any)?.role || null

    // Borrado en cascada según rol
    if (role === 'COMPANY') {
      const { data: companies, error: compErr } = await supabase
        .from('companies')
        .select('id')
        .eq('owner_id', user_id)
      if (compErr) console.warn('delete-user: error listando companies', compErr)
      const companyIds: string[] = Array.isArray(companies) ? companies.map((c: any) => c.id) : []
      if (companyIds.length > 0) {
        const { data: jobs, error: jobsErr } = await supabase
          .from('jobs')
          .select('id')
          .in('company_id', companyIds)
        if (jobsErr) console.warn('delete-user: error listando jobs', jobsErr)
        const jobIds: string[] = Array.isArray(jobs) ? jobs.map((j: any) => j.id) : []
        if (jobIds.length > 0) {
          const { error: appsDelErr } = await supabase
            .from('applications')
            .delete()
            .in('job_id', jobIds)
          if (appsDelErr) console.warn('delete-user: fallo borrando applications', appsDelErr)
        }
        const { error: jobsDelErr } = await supabase
          .from('jobs')
          .delete()
          .in('company_id', companyIds)
        if (jobsDelErr) console.warn('delete-user: fallo borrando jobs', jobsDelErr)
        const { error: compsDelErr } = await supabase
          .from('companies')
          .delete()
          .in('id', companyIds)
        if (compsDelErr) console.warn('delete-user: fallo borrando companies', compsDelErr)
      }
    } else if (role === 'STUDENT') {
      const { error: appsDelErr } = await supabase
        .from('applications')
        .delete()
        .eq('student_id', user_id)
      if (appsDelErr) console.warn('delete-user: fallo borrando applications del estudiante', appsDelErr)
      const { error: cvsDelErr } = await supabase
        .from('cvs')
        .delete()
        .eq('owner_id', user_id)
      if (cvsDelErr) console.warn('delete-user: fallo borrando cvs', cvsDelErr)
    }

    // Eliminar perfil asociado (si existe)
    const { error: pErr } = await supabase
      .from('profiles')
      .delete()
      .eq('id', user_id)
    if (pErr) console.warn('delete-user: fallo al eliminar perfil', pErr)

    // Eliminar del auth.users (incluye metadata)
    const { error: delErr } = await supabase.auth.admin.deleteUser(user_id)
    if (delErr) return res.status(400).json({ ok: false, error: delErr.message || 'No se pudo eliminar usuario' })

    return res.status(200).json({ ok: true })
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message || 'Fallo inesperado' })
  }
}