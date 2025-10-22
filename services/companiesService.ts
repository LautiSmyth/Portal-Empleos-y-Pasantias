import { supabase } from './supabaseClient'
import { Company } from '../types'

interface DbCompanyRow {
  id: string
  name: string
  logo_url: string | null
  website: string | null
  description: string | null
  owner_id?: string | null
}

const mapRow = (row: DbCompanyRow): Company => ({
  id: row.id,
  name: row.name,
  logoUrl: row.logo_url ?? '',
  website: row.website ?? '',
  description: row.description ?? '',
})

export async function fetchCompanies(): Promise<Company[]> {
  const { data, error } = await supabase
    .from('companies')
    .select('id, name, logo_url, website, description')
    .order('name', { ascending: true })

  if (error || !data) {
    return []
  }
  return (data as DbCompanyRow[]).map(mapRow)
}

export async function fetchCompanyById(id: string): Promise<Company | null> {
  const { data, error } = await supabase
    .from('companies')
    .select('id, name, logo_url, website, description')
    .eq('id', id)
    .limit(1)
    .maybeSingle()

  if (error || !data) {
    return null
  }
  return mapRow(data as DbCompanyRow)
}

export async function fetchCompaniesByIds(ids: string[]): Promise<Company[]> {
  if (!ids.length) return []
  const { data, error } = await supabase
    .from('companies')
    .select('id, name, logo_url, website, description')
    .in('id', ids)

  if (error || !data) {
    return []
  }
  return (data as DbCompanyRow[]).map(mapRow)
}

export async function fetchCompanyByOwnerId(ownerId: string): Promise<Company | null> {
  const { data, error } = await supabase
    .from('companies')
    .select('id, name, logo_url, website, description, owner_id')
    .eq('owner_id', ownerId)
    .limit(1)
    .maybeSingle()

  if (error || !data) {
    return null
  }
  const row = data as DbCompanyRow
  return mapRow(row)
}