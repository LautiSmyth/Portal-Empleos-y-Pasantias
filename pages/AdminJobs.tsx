import React, { useContext, useEffect, useMemo, useState } from 'react';
import { AuthContext } from '../App';
import { Role, Job, JobModality, Company } from '../types';
import { fetchCompanies } from '../services/companiesService';
import { fetchJobsByCompanyId } from '../services/jobsService';
import { createJobViaAdminApi, updateJobViaAdminApi } from '../services/jobsService';
import { toggleJobActive, logAdminAction } from '../services/adminService';

const AdminJobs: React.FC = () => {
  const auth = useContext(AuthContext);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [area, setArea] = useState('');
  const [location, setLocation] = useState('');
  const [experienceMin, setExperienceMin] = useState<number>(0);
  const [salaryMin, setSalaryMin] = useState<number | ''>('');
  const [salaryMax, setSalaryMax] = useState<number | ''>('');
  const [modality, setModality] = useState<JobModality>(JobModality.REMOTE);
  const [submitting, setSubmitting] = useState(false);
  // Edición
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editArea, setEditArea] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editExperienceMin, setEditExperienceMin] = useState<number>(0);
  const [editSalaryMin, setEditSalaryMin] = useState<number | ''>('');
  const [editSalaryMax, setEditSalaryMax] = useState<number | ''>('');
  const [editModality, setEditModality] = useState<JobModality>(JobModality.REMOTE);

  const canSubmit = useMemo(() => {
    return !!selectedCompanyId && !!title && !!description && !!area && !!location && typeof experienceMin === 'number' && experienceMin >= 0 && !!modality;
  }, [selectedCompanyId, title, description, area, location, experienceMin, modality]);

  useEffect(() => {
    if (!auth?.currentUser || auth.currentUser.role !== Role.ADMIN) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const comps = await fetchCompanies();
        setCompanies(comps);
        if (comps.length > 0) setSelectedCompanyId(comps[0].id);
      } catch (e: any) {
        setError(e?.message || 'Error cargando compañías');
      } finally {
        setLoading(false);
      }
    })();
  }, [auth?.currentUser]);

  useEffect(() => {
    if (!selectedCompanyId) return;
    (async () => {
      const js = await fetchJobsByCompanyId(selectedCompanyId);
      setJobs(js);
    })();
  }, [selectedCompanyId]);

  if (!auth?.currentUser || auth.currentUser.role !== Role.ADMIN) {
    return <div className="text-center text-red-600">Debes iniciar sesión como ADMIN.</div>;
  }

  const handleCreateJob = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await createJobViaAdminApi({
        title,
        description,
        area,
        location,
        experienceMin,
        salaryMin: salaryMin === '' ? null : Number(salaryMin),
        salaryMax: salaryMax === '' ? null : Number(salaryMax),
        modality,
        companyId: selectedCompanyId,
        isActive: true,
      });
      if (!res.ok) throw new Error(res.error || 'No se pudo crear el puesto');
      await logAdminAction({
        actorId: auth.currentUser.id,
        action: 'create_job',
        entity: 'jobs',
        entityId: res.id || undefined,
        details: { title, companyId: selectedCompanyId },
      });
      setTitle(''); setDescription(''); setArea(''); setLocation(''); setExperienceMin(0); setSalaryMin(''); setSalaryMax(''); setModality(JobModality.REMOTE);
      const js = await fetchJobsByCompanyId(selectedCompanyId);
      setJobs(js);
    } catch (e: any) {
      setError(e?.message || 'Error creando puesto');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (jobId: string, newStatus: boolean) => {
    setError(null);
    try {
      const res = await toggleJobActive(jobId, newStatus);
      if (!res.ok) throw new Error(res.error || 'No se pudo actualizar estado');
      await logAdminAction({ actorId: auth.currentUser.id, action: 'toggle_job', entity: 'jobs', entityId: jobId, details: { is_active: newStatus } });
      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, is_active: newStatus } as any : j));
    } catch (e: any) {
      setError(e?.message || 'Fallo al actualizar estado');
    }
  };

  const setEditing = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;
    setEditingJobId(jobId);
    setEditTitle(job.title);
    setEditDescription(job.description);
    setEditArea(job.area);
    setEditLocation(job.location);
    setEditExperienceMin(job.experienceMin);
    setEditSalaryMin(job.salaryRange ? job.salaryRange[0] : '');
    setEditSalaryMax(job.salaryRange ? job.salaryRange[1] : '');
    setEditModality(job.modality);
  };

  const cancelEditing = () => {
    setEditingJobId(null);
  };

  const saveEditing = async () => {
    if (!editingJobId) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await updateJobViaAdminApi({
        jobId: editingJobId,
        title: editTitle,
        description: editDescription,
        area: editArea,
        location: editLocation,
        experienceMin: editExperienceMin,
        salaryMin: editSalaryMin === '' ? null : Number(editSalaryMin),
        salaryMax: editSalaryMax === '' ? null : Number(editSalaryMax),
        modality: editModality,
      });
      if (!res.ok) throw new Error(res.error || 'No se pudo actualizar el puesto');
      await logAdminAction({ actorId: auth.currentUser.id, action: 'update_job', entity: 'jobs', entityId: editingJobId, details: { title: editTitle } });
      const js = await fetchJobsByCompanyId(selectedCompanyId);
      setJobs(js);
      setEditingJobId(null);
    } catch (e: any) {
      setError(e?.message || 'Fallo al actualizar el puesto');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Gestión de Puestos (ADMIN)</h1>
      {error && (
        <div className="border border-red-200 bg-red-50 text-red-800 p-3 rounded">{error}</div>
      )}
      <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Compañía</label>
          <select className="mt-1 w-full border rounded p-2" value={selectedCompanyId} onChange={(e) => setSelectedCompanyId(e.target.value)}>
            {companies.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Título del puesto</label>
          <input className="mt-1 w-full border rounded p-2" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Backend Developer" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Descripción</label>
          <textarea className="mt-1 w-full border rounded p-2" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Describe responsabilidades, stack y beneficios" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Área</label>
            <input className="mt-1 w-full border rounded p-2" value={area} onChange={(e) => setArea(e.target.value)} placeholder="Ej: IT / Data" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Ubicación</label>
            <input className="mt-1 w-full border rounded p-2" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ej: Buenos Aires" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Experiencia mínima (años)</label>
            <input type="number" min={0} className="mt-1 w-full border rounded p-2" value={experienceMin} onChange={(e) => setExperienceMin(Number(e.target.value))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Salario mínimo</label>
            <input type="number" min={0} className="mt-1 w-full border rounded p-2" value={salaryMin} onChange={(e) => setSalaryMin(e.target.value === '' ? '' : Number(e.target.value))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Salario máximo</label>
            <input type="number" min={0} className="mt-1 w-full border rounded p-2" value={salaryMax} onChange={(e) => setSalaryMax(e.target.value === '' ? '' : Number(e.target.value))} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Modalidad</label>
          <select className="mt-1 w-full border rounded p-2" value={modality} onChange={(e) => setModality(e.target.value as JobModality)}>
            <option value={JobModality.REMOTE}>Remote</option>
            <option value={JobModality.HYBRID}>Hybrid</option>
            <option value={JobModality.ON_SITE}>On-site</option>
          </select>
        </div>
        <div className="flex justify-end">
          <button disabled={!canSubmit || submitting} onClick={handleCreateJob} className="btn btn--primary btn--md">{submitting ? 'Creando…' : 'Crear Puesto'}</button>
        </div>
      </div>

      {/* Lista de puestos de la compañía seleccionada */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Puestos de {companies.find(c => c.id === selectedCompanyId)?.name || ''}</h2>
        <div className="space-y-3">
          {jobs.map(j => (
            <div key={j.id} className="border p-3 rounded-md">
              {editingJobId === j.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md-grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Título</label>
                      <input className="mt-1 w-full border rounded p-2" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Área</label>
                      <input className="mt-1 w-full border rounded p-2" value={editArea} onChange={(e) => setEditArea(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Ubicación</label>
                      <input className="mt-1 w-full border rounded p-2" value={editLocation} onChange={(e) => setEditLocation(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Experiencia mínima</label>
                      <input type="number" min={0} className="mt-1 w-full border rounded p-2" value={editExperienceMin} onChange={(e) => setEditExperienceMin(Number(e.target.value))} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Descripción</label>
                    <textarea className="mt-1 w-full border rounded p-2" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Salario mínimo</label>
                      <input type="number" min={0} className="mt-1 w-full border rounded p-2" value={editSalaryMin} onChange={(e) => setEditSalaryMin(e.target.value === '' ? '' : Number(e.target.value))} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Salario máximo</label>
                      <input type="number" min={0} className="mt-1 w-full border rounded p-2" value={editSalaryMax} onChange={(e) => setEditSalaryMax(e.target.value === '' ? '' : Number(e.target.value))} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Modalidad</label>
                      <select className="mt-1 w-full border rounded p-2" value={editModality} onChange={(e) => setEditModality(e.target.value as JobModality)}>
                        <option value={JobModality.REMOTE}>Remote</option>
                        <option value={JobModality.HYBRID}>Hybrid</option>
                        <option value={JobModality.ON_SITE}>On-site</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button className="btn btn--outline btn--sm" onClick={cancelEditing}>Cancelar</button>
                    <button className="btn btn--primary btn--sm" disabled={submitting} onClick={saveEditing}>{submitting ? 'Guardando…' : 'Guardar'}</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{j.title}</p>
                    <p className="text-sm text-gray-500">{j.area} • {j.location} • {j.modality}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="btn btn--outline btn--sm" onClick={() => setEditing(j.id)}>Editar</button>
                    <button className="btn btn--secondary btn--sm" onClick={() => handleToggleActive(j.id, !(j as any).is_active)}>{(j as any).is_active ? 'Desactivar' : 'Activar'}</button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {jobs.length === 0 && (
            <p className="text-sm text-gray-500">Sin puestos para esta compañía.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminJobs;