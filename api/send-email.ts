import { Resend } from 'resend'

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
  const { to, subject, html, text, from } = body
  if (!to || !subject || (!html && !text)) {
    return res.status(400).json({ ok: false, error: 'to, subject y html o text son requeridos' })
  }
  try {
    const resend = getResend()
    const result = await resend.emails.send({
      from: from || process.env.RESEND_FROM || 'onboarding@resend.dev',
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
    })
    if ((result as any)?.error) {
      return res.status(400).json({ ok: false, error: (result as any).error?.message || 'Fallo enviando email' })
    }
    return res.status(200).json({ ok: true, data: result?.data })
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message || 'Fallo inesperado' })
  }
}