'use strict'
require('dotenv').config()
const fastify = require('fastify')({ logger: true })
const cors = require('@fastify/cors')
const { createClient } = require('@supabase/supabase-js')

// CORS (dev-friendly: allow all origins)
fastify.register(cors, {
  origin: true,
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','X-Admin-Token']
})

// Supabase Admin client (Service Role)
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  fastify.log.warn('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY; endpoints will fail until set.')
}
const supabase = createClient(SUPABASE_URL || 'http://localhost.invalid', SUPABASE_SERVICE_ROLE_KEY || 'missing')

// Optional simple admin token gate (header: X-Admin-Token)
function requireAdminToken(req, reply) {
  const token = process.env.ADMIN_API_TOKEN
  if (!token) return true // disabled
  if (req.headers['x-admin-token'] === token) return true
  reply.code(401).send({ ok: false, error: 'Unauthorized' })
  return false
}

// Health
fastify.get('/health', async () => ({ ok: true }))

// Create user (and profile)
fastify.post('/create-user', async (req, reply) => {
  if (!requireAdminToken(req, reply)) return
  const { email, password, role, name } = req.body || {}
  if (!email || !password || !role) return reply.code(400).send({ ok: false, error: 'email, password y role son requeridos' })
  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { role, name },
    })
    if (error || !data?.user) return reply.code(400).send({ ok: false, error: error?.message || 'No se pudo crear el usuario' })
    const userId = data.user.id
    const { error: insErr } = await supabase
      .from('profiles')
      .insert({ id: userId, role, first_name: name || null })
      .select()
    if (insErr) fastify.log.warn({ msg: 'create-user: insert profile failed', error: insErr })
    return reply.send({ ok: true, userId })
  } catch (e) {
    return reply.code(500).send({ ok: false, error: e?.message || 'Fallo inesperado' })
  }
})

// Reset password: generate recovery link
fastify.post('/reset-password', async (req, reply) => {
  if (!requireAdminToken(req, reply)) return
  const { email } = req.body || {}
  if (!email) return reply.code(400).send({ ok: false, error: 'email requerido' })
  try {
    const { data, error } = await supabase.auth.admin.generateLink({ type: 'recovery', email })
    if (error || !data) return reply.code(400).send({ ok: false, error: error?.message || 'No se pudo generar link' })
    const link = data?.properties?.action_link || data?.action_link || null
    return reply.send({ ok: true, action_link: link })
  } catch (e) {
    return reply.code(500).send({ ok: false, error: e?.message || 'Fallo inesperado' })
  }
})

// Update profile (first_name, university, role)
fastify.post('/update-profile', async (req, reply) => {
  if (!requireAdminToken(req, reply)) return
  const { user_id, first_name = null, university = null, role = null } = req.body || {}
  if (!user_id) return reply.code(400).send({ ok: false, error: 'user_id requerido' })
  try {
    const payload = {}
    if (first_name !== undefined) payload.first_name = first_name
    if (university !== undefined) payload.university = university
    if (role !== undefined && role) payload.role = role
    const { error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', user_id)
    if (error) return reply.code(400).send({ ok: false, error: error.message || 'No se pudo actualizar perfil' })
    return reply.send({ ok: true })
  } catch (e) {
    return reply.code(500).send({ ok: false, error: e?.message || 'Fallo inesperado' })
  }
})

// Search users by email (joins profiles); filters role/university
fastify.get('/search-users', async (req, reply) => {
  if (!requireAdminToken(req, reply)) return
  const emailQ = (req.query?.email || '').toString().trim().toLowerCase()
  const roleQ = (req.query?.role || '').toString().trim()
  const uniQ = (req.query?.university || '').toString().trim()
  const limit = Number(req.query?.limit || 20)
  try {
    const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: Math.min(limit, 50) })
    if (error) return reply.code(400).send({ ok: false, error: error.message || 'No se pudo listar usuarios' })
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
    if (pErr) fastify.log.warn({ msg: 'search-users: profiles query failed', error: pErr })
    const byId = new Map((profiles || []).map(p => [p.id, p]))
    const results = filtered.slice(0, limit).map(u => ({
      id: u.id,
      email: u.email,
      first_name: byId.get(u.id)?.first_name || null,
      role: byId.get(u.id)?.role || 'STUDENT',
      university: byId.get(u.id)?.university || null,
      company_verified: byId.get(u.id)?.company_verified || null,
      created_at: byId.get(u.id)?.created_at || u.created_at || new Date().toISOString(),
    }))
    return reply.send({ ok: true, results })
  } catch (e) {
    return reply.code(500).send({ ok: false, error: e?.message || 'Fallo inesperado' })
  }
})

// Log admin action
fastify.post('/log', async (req, reply) => {
  if (!requireAdminToken(req, reply)) return
  const { actorId, action, entity, entityId, details } = req.body || {}
  if (!actorId || !action || !entity) return reply.code(400).send({ ok: false, error: 'actorId, action, entity requeridos' })
  try {
    const { error } = await supabase
      .from('admin_logs')
      .insert({ actor_id: actorId, action, entity, entity_id: entityId || null, details: details ?? null })
    if (error) return reply.code(400).send({ ok: false, error: error.message || 'No se pudo insertar log' })
    return reply.send({ ok: true })
  } catch (e) {
    return reply.code(500).send({ ok: false, error: e?.message || 'Fallo inesperado' })
  }
})

// Authorize user (mark email confirmed)
fastify.post('/authorize-user', async (req, reply) => {
  if (!requireAdminToken(req, reply)) return
  let { user_id, email } = req.body || {}
  if (!user_id && !email) return reply.code(400).send({ ok: false, error: 'user_id o email requerido' })
  try {
    if (!user_id) {
      const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 })
      if (error) return reply.code(400).send({ ok: false, error: error.message || 'No se pudo obtener usuarios' })
      const found = (data?.users || []).find(u => (u.email || '').toLowerCase() === (email || '').toLowerCase())
      if (!found) return reply.code(404).send({ ok: false, error: 'Usuario no encontrado por email' })
      user_id = found.id
    }
    const { error } = await supabase.auth.admin.updateUserById(user_id, { email_confirmed_at: new Date().toISOString() })
    if (error) return reply.code(400).send({ ok: false, error: error.message || 'No se pudo autorizar la cuenta' })
    return reply.send({ ok: true })
  } catch (e) {
    return reply.code(500).send({ ok: false, error: e?.message || 'Fallo inesperado' })
  }
})

// Start
const PORT = Number(process.env.PORT || 8787)
fastify.listen({ port: PORT, host: '0.0.0.0' }).then(() => {
  fastify.log.info(`Admin API running on http://localhost:${PORT}`)
}).catch(err => {
  fastify.log.error(err)
  process.exit(1)
})