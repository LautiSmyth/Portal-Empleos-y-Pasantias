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
  const { title, description, area, location, experience_min, salary_min, salary_max, modality, company_id, is_active } = body || {}
  if (!title || !description || !area || !location || typeof experience_min !== 'number' || !modality || !company_id) {
    return res.status(400).json({ ok: false, error: 'Campos requeridos: title, description, area, location, experience_min, modality, company_id' })
  }
  if (!['Remote', 'Hybrid', 'On-site'].includes(String(modality))) {
    return res.status(400).json({ ok: false, error: 'modality inválida' })
  }
  try {
    const supabase = getSupabaseAdmin()
    const insertPayload: any = {
      title,
      description,
      area,
      location,
      experience_min,
      salary_min: salary_min ?? null,
      salary_max: salary_max ?? null,
      modality,
      company_id,
    }
    if (typeof is_active === 'boolean') insertPayload.is_active = is_active
    const { data, error } = await supabase
      .from('jobs')
      .insert(insertPayload)
      .select('id')
      .maybeSingle()
    if (error) return res.status(400).json({ ok: false, error: error.message || 'No se pudo crear el puesto' })
    return res.status(200).json({ ok: true, id: (data as any)?.id })
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message || 'Fallo inesperado' })
  }
}