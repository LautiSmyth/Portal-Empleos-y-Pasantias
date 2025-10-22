import { supabase } from './supabaseClient'
import { CV } from '../types'

interface DbCVRow {
  id: string
  owner_id: string
  data: any
  pdf_url: string | null
}

const dataUrlToBlob = (dataUrl: string): Blob => {
  const [meta, base64] = dataUrl.split(',')
  const mimeMatch = /data:(.*?);base64/.exec(meta)
  const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream'
  const bytes = atob(base64)
  const arr = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
  return new Blob([arr], { type: mime })
}

export async function fetchCVByOwnerId(ownerId: string): Promise<{ cv: CV | null; pdfUrl?: string }> {
  const { data, error } = await supabase
    .from('cvs')
    .select('id, owner_id, data, pdf_url')
    .eq('owner_id', ownerId)
    .limit(1)
    .maybeSingle()

  if (error) {
    console.warn('fetchCVByOwnerId error', error)
    return { cv: null }
  }
  if (!data) return { cv: null }
  const row = data as DbCVRow
  const payload = row.data as CV
  // Ensure ownerId is set even if not present in stored JSON
  const cv: CV = {
    ownerId: payload.ownerId || row.owner_id,
    personal: payload.personal || { firstName: '', lastName: '', email: '', phone: '' },
    links: payload.links || {},
    education: Array.isArray(payload.education) ? payload.education : [],
    experience: Array.isArray(payload.experience) ? payload.experience : [],
    projects: Array.isArray(payload.projects) ? payload.projects : [],
    skills: Array.isArray(payload.skills) ? payload.skills : [],
    softSkills: Array.isArray(payload.softSkills) ? payload.softSkills : [],
    languages: Array.isArray(payload.languages) ? payload.languages : [],
    pdfFileName: payload.pdfFileName,
    // Do not include pdfDataUrl from DB; we only store URL
  }
  return { cv, pdfUrl: row.pdf_url || undefined }
}

export async function saveCV(ownerId: string, cv: CV): Promise<{ ok: boolean; pdfUrl?: string; error?: string }> {
  try {
    let pdfUrl: string | undefined
    // Upload PDF if present
    if (cv.pdfDataUrl) {
      const blob = dataUrlToBlob(cv.pdfDataUrl)
      const fileName = cv.pdfFileName || 'cv.pdf'
      const path = `${ownerId}/${Date.now()}_${fileName}`
      const { error: upErr } = await supabase.storage.from('cvs').upload(path, blob, {
        contentType: 'application/pdf',
        upsert: true,
      })
      if (upErr) {
        return { ok: false, error: upErr.message || 'No se pudo subir el PDF' }
      }
      const { data: pub } = supabase.storage.from('cvs').getPublicUrl(path)
      pdfUrl = pub?.publicUrl || path
    }

    // Sanitize CV data before storing (avoid large base64 in DB)
    const { pdfDataUrl, ...sanitized } = cv

    // Find existing row
    const { data: existing, error: selErr } = await supabase
      .from('cvs')
      .select('id')
      .eq('owner_id', ownerId)
      .limit(1)
      .maybeSingle()
    if (selErr) {
      console.warn('saveCV: select error', selErr)
    }

    if (existing && (existing as any).id) {
      const updatePayload: any = { data: sanitized }
      // Only update pdf_url when we uploaded a new PDF in this call
      if (pdfUrl !== undefined) updatePayload.pdf_url = pdfUrl

      const { error: updErr } = await supabase
        .from('cvs')
        .update(updatePayload)
        .eq('id', (existing as any).id)
      if (updErr) return { ok: false, error: updErr.message || 'No se pudo actualizar el CV' }
    } else {
      const insertPayload: any = { owner_id: ownerId, data: sanitized }
      if (pdfUrl !== undefined) insertPayload.pdf_url = pdfUrl

      const { error: insErr } = await supabase
        .from('cvs')
        .insert(insertPayload)
      if (insErr) return { ok: false, error: insErr.message || 'No se pudo guardar el CV' }
    }

    return { ok: true, pdfUrl }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Error inesperado al guardar CV' }
  }
}