import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createJobViaAdminApi, updateJobViaAdminApi } from '../services/jobsService'

function mockFetchOk(payload: any) {
  return vi.fn().mockResolvedValue({ ok: true, json: async () => payload })
}

function mockFetchFail(error: string) {
  return vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error }) })
}

const sampleCreate = {
  title: 'Frontend Engineer',
  description: 'Build great UIs',
  area: 'Engineering',
  location: 'Remote',
  experienceMin: 2,
  salaryMin: 1000,
  salaryMax: 2000,
  modality: 'Remote',
  companyId: 'c_123',
  isActive: true,
}

const sampleUpdate = {
  jobId: 'j_999',
  title: 'Sr Frontend',
  description: 'Lead UI projects',
  area: 'Engineering',
  location: 'Hybrid',
  experienceMin: 5,
  salaryMin: 3000,
  salaryMax: 5000,
  modality: 'Hybrid',
  isActive: false,
}

beforeEach(() => {
  vi.restoreAllMocks()
  delete (process as any).env.VITE_ADMIN_API_URL
  delete (process as any).env.VITE_ADMIN_API_TOKEN
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('jobsService admin API', () => {
  it('createJobViaAdminApi usa VITE_ADMIN_API_URL y X-Admin-Token cuando están configurados', async () => {
    vi.stubEnv('VITE_ADMIN_API_URL', 'https://admin.example')
    vi.stubEnv('VITE_ADMIN_API_TOKEN', 'secret')
    const fetchSpy = mockFetchOk({ ok: true, id: 'abc' })
    vi.stubGlobal('fetch', fetchSpy)

    const res = await createJobViaAdminApi(sampleCreate)
    expect(res.ok).toBe(true)
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    const [url, init] = fetchSpy.mock.calls[0]
    expect(url).toBe('https://admin.example/create-job')
    expect((init as any).headers['X-Admin-Token']).toBe('secret')
    const body = JSON.parse((init as any).body)
    expect(body).toMatchObject({
      title: sampleCreate.title,
      description: sampleCreate.description,
      area: sampleCreate.area,
      location: sampleCreate.location,
      experience_min: sampleCreate.experienceMin,
      salary_min: sampleCreate.salaryMin,
      salary_max: sampleCreate.salaryMax,
      modality: sampleCreate.modality,
      company_id: sampleCreate.companyId,
      is_active: true,
    })
  })

  it('createJobViaAdminApi hace fallback a /api/create-job cuando no hay URL de admin', async () => {
    vi.stubEnv('VITE_ADMIN_API_URL', '')
    vi.stubEnv('VITE_ADMIN_API_TOKEN', '')
    const fetchSpy = mockFetchOk({ ok: true, id: 'xyz' })
    vi.stubGlobal('fetch', fetchSpy)

    const res = await createJobViaAdminApi(sampleCreate)
    expect(res.ok).toBe(true)
    const [url, init] = fetchSpy.mock.calls[0]
    expect(String(url)).toMatch(/\/(create-job)$/)
    expect((init as any).headers['X-Admin-Token']).toBeUndefined()
  })

  it('updateJobViaAdminApi usa VITE_ADMIN_API_URL si está presente', async () => {
    vi.stubEnv('VITE_ADMIN_API_URL', 'https://admin.example')
    const fetchSpy = mockFetchOk({ ok: true })
    vi.stubGlobal('fetch', fetchSpy)

    const res = await updateJobViaAdminApi(sampleUpdate)
    expect(res.ok).toBe(true)
    const [url] = fetchSpy.mock.calls[0]
    expect(url).toBe('https://admin.example/update-job')
  })

  it('updateJobViaAdminApi hace fallback a /api/update-job cuando no hay URL', async () => {
    vi.stubEnv('VITE_ADMIN_API_URL', '')
    const fetchSpy = mockFetchOk({ ok: true })
    vi.stubGlobal('fetch', fetchSpy)

    const res = await updateJobViaAdminApi(sampleUpdate)
    expect(res.ok).toBe(true)
    const [url] = fetchSpy.mock.calls[0]
    expect(String(url)).toMatch(/\/(update-job)$/)
  })

  it('propaga error cuando la API responde con estado no OK', async () => {
    vi.stubEnv('VITE_ADMIN_API_URL', 'https://admin.example')
    const fetchSpy = mockFetchFail('No autorizado')
    vi.stubGlobal('fetch', fetchSpy)

    const res = await createJobViaAdminApi(sampleCreate)
    expect(res.ok).toBe(false)
    expect(res.error).toBe('No autorizado')
  })
})