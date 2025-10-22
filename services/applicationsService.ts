import { supabase } from './supabaseClient'
import { Application, ApplicationStatus } from '../types'

interface DbApplicationRow {
  id: string
  job_id: string
  student_id: string
  status: string
  applied_at: string
}

const mapRow = (row: DbApplicationRow): Application => ({
  id: row.id,
  jobId: row.job_id,
  studentId: row.student_id,
  status: row.status as ApplicationStatus,
  appliedAt: new Date(row.applied_at),
})

export async function fetchApplicationsByStudent(studentId: string): Promise<Application[]> {
  const { data, error } = await supabase
    .from('applications')
    .select('id, job_id, student_id, status, applied_at')
    .eq('student_id', studentId)
    .order('applied_at', { ascending: false })

  if (error || !data) {
    console.warn('fetchApplicationsByStudent: error or empty', error)
    return []
  }
  return (data as DbApplicationRow[]).map(mapRow)
}

export async function fetchApplicationCountsByJobIds(jobIds: string[]): Promise<Record<string, number>> {
  if (jobIds.length === 0) return {}
  const { data, error } = await supabase
    .from('applications')
    .select('job_id')
    .in('job_id', jobIds)

  if (error || !data) {
    console.warn('fetchApplicationCountsByJobIds: error', error)
    return {}
  }
  const counts: Record<string, number> = {}
  for (const row of data as { job_id: string }[]) {
    counts[row.job_id] = (counts[row.job_id] || 0) + 1
  }
  return counts
}

export async function hasAppliedToJob(jobId: string, studentId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('applications')
    .select('id')
    .eq('job_id', jobId)
    .eq('student_id', studentId)
    .limit(1)
  if (error) {
    console.warn('hasAppliedToJob error', error)
    return false
  }
  return Array.isArray(data) && data.length > 0
}

export async function applyToJob(jobId: string, studentId: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from('applications')
    .insert({ job_id: jobId, student_id: studentId })
  if (error) {
    const msg = String(error.message || '')
    // Unique constraint means already applied; treat as ok for idempotency
    if (msg.toLowerCase().includes('duplicate') || (error as any).code === '23505') {
      return { ok: true }
    }
    return { ok: false, error: msg }
  }
  return { ok: true }
}