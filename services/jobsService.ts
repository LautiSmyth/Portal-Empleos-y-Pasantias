import { supabase } from './supabaseClient'
import { Job, JobModality } from '../types'

// Shape based on db/schema.sql
interface DbJobRow {
  id: string
  title: string
  description: string
  area: string
  location: string
  experience_min: number
  salary_min: number | null
  salary_max: number | null
  modality: string
  company_id: string
  created_at: string
  views?: number
}

const mapDbRowToJob = (row: DbJobRow): Job => {
  // Ensure modality maps to enum string values (Remote/Hybrid/On-site)
  const normalizedModality =
    row.modality === 'Remote' || row.modality === 'Hybrid' || row.modality === 'On-site'
      ? (row.modality as JobModality)
      : (('Remote' as unknown) as JobModality)

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    area: row.area,
    location: row.location,
    experienceMin: row.experience_min,
    salaryRange:
      row.salary_min != null && row.salary_max != null
        ? [row.salary_min, row.salary_max]
        : null,
    modality: normalizedModality,
    companyId: row.company_id,
    createdAt: new Date(row.created_at),
    views: row.views ?? 0,
  }
}

export async function fetchJobs(): Promise<Job[]> {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false })

  if (error || !data) {
    return []
  }
  return (data as DbJobRow[]).map(mapDbRowToJob)
}

export async function fetchJobById(id: string): Promise<Job | null> {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', id)
    .limit(1)
    .maybeSingle()

  if (error || !data) {
    return null
  }
  return mapDbRowToJob(data as DbJobRow)
}

export async function fetchJobsByIds(ids: string[]): Promise<Job[]> {
  if (!ids.length) return []
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .in('id', ids)

  if (error || !data) {
    return []
  }
  return (data as DbJobRow[]).map(mapDbRowToJob)
}

export async function fetchJobsByCompanyId(companyId: string): Promise<Job[]> {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (error || !data) {
    return []
  }
  return (data as DbJobRow[]).map(mapDbRowToJob)
}

export async function createJobViaAdminApi(payload: { title: string; description: string; area: string; location: string; experienceMin: number; salaryMin?: number | null; salaryMax?: number | null; modality: string; companyId: string; isActive?: boolean }): Promise<{ ok: boolean; id?: string; error?: string }> {
  const envUrl = (import.meta as any).env?.VITE_ADMIN_API_URL || process.env.VITE_ADMIN_API_URL || ''
  const token = (import.meta as any).env?.VITE_ADMIN_API_TOKEN || process.env.VITE_ADMIN_API_TOKEN || ''
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['X-Admin-Token'] = token
  const url = envUrl ? `${envUrl}/create-job` : `/api/create-job`
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      title: payload.title,
      description: payload.description,
      area: payload.area,
      location: payload.location,
      experience_min: payload.experienceMin,
      salary_min: payload.salaryMin ?? null,
      salary_max: payload.salaryMax ?? null,
      modality: payload.modality,
      company_id: payload.companyId,
      is_active: payload.isActive,
    }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) return { ok: false, error: json?.error || 'No se pudo crear el puesto' }
  return { ok: true, id: json?.id }
}

export async function updateJobViaAdminApi(payload: { jobId: string; title?: string; description?: string; area?: string; location?: string; experienceMin?: number; salaryMin?: number | null; salaryMax?: number | null; modality?: string; isActive?: boolean }): Promise<{ ok: boolean; error?: string }> {
  const envUrl = (import.meta as any).env?.VITE_ADMIN_API_URL || process.env.VITE_ADMIN_API_URL || ''
  const token = (import.meta as any).env?.VITE_ADMIN_API_TOKEN || process.env.VITE_ADMIN_API_TOKEN || ''
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['X-Admin-Token'] = token
  const url = envUrl ? `${envUrl}/update-job` : `/api/update-job`
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      job_id: payload.jobId,
      title: payload.title,
      description: payload.description,
      area: payload.area,
      location: payload.location,
      experience_min: payload.experienceMin,
      salary_min: payload.salaryMin,
      salary_max: payload.salaryMax,
      modality: payload.modality,
      is_active: payload.isActive,
    }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) return { ok: false, error: json?.error || 'No se pudo actualizar el puesto' }
  return { ok: true }
}