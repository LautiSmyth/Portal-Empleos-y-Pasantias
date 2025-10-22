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
    console.warn('fetchJobs: falling back due to error', error)
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
    console.warn('fetchJobById: not found or error', error)
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
    console.warn('fetchJobsByIds: error', error)
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
    console.warn('fetchJobsByCompanyId: error', error)
    return []
  }
  return (data as DbJobRow[]).map(mapDbRowToJob)
}