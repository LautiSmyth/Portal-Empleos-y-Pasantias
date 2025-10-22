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
  const { job_id, title, description, area, location, experience_min, salary_min, salary_max, modality, is_active } = body || {}
  if (!job_id) return res.status(400).json({ ok: false, error: 'job_id requerido' })
  const updatePayload: any = {}
  if (title !== undefined) updatePayload.title = title
  if (description !== undefined) updatePayload.description = description
  if (area !== undefined) updatePayload.area = area
  if (location !== undefined) updatePayload.location = location
  if (experience_min !== undefined) updatePayload.experience_min = experience_min
  if (salary_min !== undefined) updatePayload.salary_min = salary_min
  if (salary_max !== undefined) updatePayload.salary_max = salary_max
  if (modality !== undefined) updatePayload.modality = modality
  if (is_active !== undefined) updatePayload.is_active = is_active
  if (Object.keys(updatePayload).length === 0) return res.status(400).json({ ok: false, error: 'No hay campos para actualizar' })
  try {
    const supabase = getSupabaseAdmin()
    const { error } = await supabase
      .from('jobs')
      .update(updatePayload)
      .eq('id', job_id)
    if (error) return res.status(400).json({ ok: false, error: error.message || 'No se pudo actualizar el puesto' })
    return res.status(200).json({ ok: true })
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message || 'Fallo inesperado' })
  }
}