import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE || ''
  if (!url || !key) throw new Error('SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY faltan')
  return createClient(url, key)
}

function getResend() {
  const key = process.env.RESEND_API_KEY || process.env.RESEND_KEY || ''
  if (!key) throw new Error('RESEND_API_KEY faltante')
  return new Resend(key)
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
  const { email, type, redirectTo, from, subject } = body
  if (!email || !type) return res.status(400).json({ ok: false, error: 'email y type son requeridos' })
  const validTypes = ['signup', 'magiclink', 'recovery', 'email_change']
  if (!validTypes.includes(type)) return res.status(400).json({ ok: false, error: 'type inválido' })
  try {
    const supabase = getSupabaseAdmin()
    const options: any = {}
    if (redirectTo) options.redirectTo = redirectTo
    const { data, error } = await supabase.auth.admin.generateLink({ type, email, options })
    if (error || !data) return res.status(400).json({ ok: false, error: error?.message || 'No se pudo generar link' })
    const actionLink = (data as any)?.properties?.action_link || (data as any)?.action_link
    if (!actionLink) return res.status(400).json({ ok: false, error: 'No se obtuvo action_link' })

    const resend = getResend()
    const mailSubject = subject || (type === 'recovery' ? 'Recupera tu contraseña' : type === 'signup' ? 'Verifica tu correo' : 'Accede a tu cuenta')
    const html = `<h1>${mailSubject}</h1><p>Haz clic <a href="${actionLink}">aquí</a> para continuar.</p>`
    const result = await resend.emails.send({
      from: from || process.env.RESEND_FROM || 'no-reply@resend.dev',
      to: [email],
      subject: mailSubject,
      html,
    })
    if ((result as any)?.error) {
      return res.status(400).json({ ok: false, error: (result as any).error?.message || 'Fallo enviando email' })
    }
    return res.status(200).json({ ok: true, action_link: actionLink, data: result?.data })
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message || 'Fallo inesperado' })
  }
}