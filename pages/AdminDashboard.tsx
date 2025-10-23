import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../App';
import { Role, ApplicationStatus } from '../types';
import { updateApplicationStatus, toggleJobActive, toggleCompanySuspended, createUserViaAdminApi, requestPasswordReset, adminUpdateProfile, logAdminAction, searchProfiles, authorizeUserAccount } from '../services/adminService';
import { Navigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

function UserCreateForm() {
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [role, setRole] = React.useState<Role>('STUDENT')
  const [name, setName] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)
  const [message, setMessage] = React.useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setSubmitting(true)
    const { ok, error } = await createUserViaAdminApi({ email, password, role, name: name || undefined })
    setSubmitting(false)
    if (!ok) {
      setMessage(error || 'No se pudo crear el usuario')
      return
    }
    setMessage('Usuario creado correctamente')
    setEmail('')
    setPassword('')
    setName('')
    setRole('STUDENT')
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 w-full border rounded p-2" placeholder="usuario@dominio.com" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 w-full border rounded p-2" placeholder="••••••••" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Rol</label>
        <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="mt-1 w-full border rounded p-2">
          <option value="STUDENT">STUDENT</option>
          <option value="COMPANY">COMPANY</option>
          <option value="ADMIN">ADMIN</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Nombre</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full border rounded p-2" placeholder="Nombre opcional" />
      </div>
      <div className="md:col-span-2 flex items-center gap-3">
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50" disabled={submitting}>
          {submitting ? 'Creando...' : 'Crear usuario'}
        </button>
        {message && <span className="text-sm text-gray-700">{message}</span>}
      </div>
      {/* Aviso removido para no interferir con el diseño */}
      {/* <p className="md:col-span-2 text-xs text-gray-500">Requiere configurar `VITE_ADMIN_API_URL` apuntando a un backend con Service Role de Supabase.</p> */}
    </form>
  )
}


type DbProfile = {
  id: string;
  first_name: string | null;
  role: string;
  university: string | null;
  company_verified: boolean | null;
  created_at: string;
  email?: string;
  email_verified?: boolean;
};

type DbCompany = {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  suspended?: boolean;
};

const AdminDashboard: React.FC = () => {
  const auth = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [profilesCount, setProfilesCount] = useState<number | null>(null);
  const [companiesCount, setCompaniesCount] = useState<number | null>(null);
  const [jobsCount, setJobsCount] = useState<number | null>(null);
  const [applicationsCount, setApplicationsCount] = useState<number | null>(null);

  const [recentProfiles, setRecentProfiles] = useState<DbProfile[]>([]);
  const [companies, setCompanies] = useState<(DbCompany & { owner_verified?: boolean | null })[]>([]);
  const [jobs, setJobs] = useState<{ id: string; title: string; company_id: string; created_at: string; is_active: boolean }[]>([]);
  const [recentApplications, setRecentApplications] = useState<{ id: string; job_id: string; student_id: string; status: string; applied_at: string }[]>([]);

  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [editFirstName, setEditFirstName] = useState('');
  const [editUniversity, setEditUniversity] = useState('');
  const [editRole, setEditRole] = useState<Role>(Role.STUDENT);
  const [savingProfile, setSavingProfile] = useState(false);
  const [authorizingUserId, setAuthorizingUserId] = useState<string | null>(null);

  // Filtros de usuarios
  const [filterRole, setFilterRole] = useState<Role | 'ALL'>('ALL');
  const [filterUniversity, setFilterUniversity] = useState('');
  const [filterEmail, setFilterEmail] = useState('');
  const [searchingProfiles, setSearchingProfiles] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (!auth?.currentUser || auth.currentUser.role !== Role.ADMIN) return;
      setError(null);
      setLoading(true);
      try {
        const [p, c, j, a] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('companies').select('*', { count: 'exact', head: true }),
          supabase.from('jobs').select('*', { count: 'exact', head: true }),
          supabase.from('applications').select('*', { count: 'exact', head: true }),
        ]);
        setProfilesCount(p.count ?? null);
        setCompaniesCount(c.count ?? null);
        setJobsCount(j.count ?? null);
        setApplicationsCount(a.count ?? null);

        const recProfiles = await searchProfiles({ limit: 10 });
        setRecentProfiles(recProfiles ?? []);

        // Empresas: intentar incluir 'suspended'; si la columna no existe en el proyecto, caer sin ella
        // Empresas: cargar columnas existentes para evitar 400 en proyectos sin 'suspended'
        const { data: companiesData } = await supabase
          .from('companies')
          .select('id, name, owner_id, created_at')
          .order('created_at', { ascending: false })
          .limit(10);

        const owners = (companiesData ?? []).map((c: any) => c.owner_id).filter(Boolean);
        let ownersVerified: Record<string, boolean | null> = {};
        if (owners.length > 0) {
          const { data: ownersProfiles } = await supabase
            .from('profiles')
            .select('id, company_verified')
            .in('id', owners);
          (ownersProfiles ?? []).forEach(op => { ownersVerified[op.id] = op.company_verified ?? null; });
        }
        setCompanies((companiesData ?? []).map((c: any) => ({
          ...c,
          suspended: c.suspended ?? false,
          owner_verified: ownersVerified[c.owner_id] ?? null,
        })));
        const { data: jobsData } = await supabase
          .from('jobs')
          .select('id, title, company_id, created_at')
          .order('created_at', { ascending: false })
          .limit(10);
        setJobs((jobsData ?? []).map((j: any) => ({
          ...j,
          is_active: j.is_active ?? true,
        })));

        const { data: apps } = await supabase
          .from('applications')
          .select('id, job_id, student_id, status, applied_at')
          .order('applied_at', { ascending: false })
          .limit(20);
        setRecentApplications(apps ?? []);
      } catch (err: any) {
        setError(err?.message ?? 'Error cargando datos de administración');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [auth?.currentUser?.id, auth?.currentUser?.role]);

  const handleToggleCompanySuspended = async (companyId: string, newStatus: boolean) => {
    setError(null);
    try {
      const res = await toggleCompanySuspended(companyId, newStatus);
      if (!res.ok) throw new Error(res.error || 'No se pudo actualizar empresa');
      setCompanies(prev => prev.map(c => c.id === companyId ? { ...c, suspended: newStatus } : c));
    } catch (err: any) {
      setError(err?.message ?? 'No se pudo actualizar estado de empresa');
    }
  };

  const handleToggleJobActive = async (jobId: string, newStatus: boolean) => {
    setError(null);
    try {
      const res = await toggleJobActive(jobId, newStatus);
      if (!res.ok) throw new Error(res.error || 'No se pudo actualizar estado del puesto');
      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, is_active: newStatus } : j));
    } catch (err: any) {
      setError(err?.message ?? 'No se pudo actualizar estado del puesto');
    }
  };

  const handleUpdateApplicationStatus = async (appId: string, newStatus: ApplicationStatus) => {
    setError(null);
    try {
      const res = await updateApplicationStatus(appId, newStatus);
      if (!res.ok) throw new Error(res.error || 'No se pudo actualizar estado de la postulación');
      setRecentApplications(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a));
    } catch (err: any) {
      setError(err?.message ?? 'No se pudo actualizar estado de la postulación');
    }
  };

  const startEditProfile = (p: DbProfile) => {
    setEditingProfileId(p.id);
    setEditFirstName(p.first_name || '');
    setEditUniversity(p.university || '');
    setEditRole((p.role as Role) || Role.STUDENT);
  };

  const cancelEditProfile = () => {
    setEditingProfileId(null);
    setEditFirstName('');
    setEditUniversity('');
    setEditRole(Role.STUDENT);
  };

  const handleSearchProfiles = async () => {
    setSearchingProfiles(true);
    try {
      const results = await searchProfiles({
        email: filterEmail || undefined,
        role: filterRole,
        universityLike: filterUniversity || undefined,
        limit: 20,
      });
      setRecentProfiles(results || []);
    } catch (e: any) {
      setError(e?.message || 'Error buscando perfiles');
    } finally {
      setSearchingProfiles(false);
    }
  };

  const handleClearFilters = async () => {
    setFilterRole('ALL');
    setFilterUniversity('');
    setFilterEmail('');
    setSearchingProfiles(true);
    try {
      const results = await searchProfiles({ limit: 10 });
      setRecentProfiles(results || []);
    } finally {
      setSearchingProfiles(false);
    }
  };

  const handleAuthorizeUser = async (userId: string) => {
    if (!auth?.currentUser) return;
    setAuthorizingUserId(userId);
    try {
      const res = await authorizeUserAccount({ userId });
      if (!res.ok) throw new Error(res.error || 'No se pudo autorizar la cuenta');
      await logAdminAction({
        actorId: auth.currentUser.id,
        action: 'authorize_user',
        entity: 'auth.users',
        entityId: userId,
        details: { via: 'admin_api' },
      });
      // Refrescar lista para reflejar estado de verificación de email
      const refreshed = await searchProfiles({
        email: filterEmail || undefined,
        role: filterRole,
        universityLike: filterUniversity || undefined,
        limit: 20,
      });
      setRecentProfiles(refreshed || []);
    } catch (e: any) {
      setError(e?.message || 'Error al autorizar la cuenta');
    } finally {
      setAuthorizingUserId(null);
    }
  };

  const saveEditProfile = async () => {
    if (!editingProfileId || !auth?.currentUser) return;
    setSavingProfile(true);
    try {
      const before = recentProfiles.find(p => p.id === editingProfileId) || null;
      const res = await adminUpdateProfile({
        userId: editingProfileId,
        firstName: editFirstName,
        university: editUniversity,
        role: editRole,
      });
      if (!res.ok) throw new Error(res.error || 'No se pudo guardar');
      await logAdminAction({
        actorId: auth.currentUser.id,
        action: 'update_profile',
        entity: 'profiles',
        entityId: editingProfileId,
        details: {
          before,
          after: { first_name: editFirstName, university: editUniversity, role: editRole },
        },
      });
      const refreshed = await searchProfiles({ limit: 10 });
      setRecentProfiles(refreshed || []);
      setEditingProfileId(null);
    } catch (e: any) {
      setError(e?.message || 'Error al guardar perfil');
    } finally {
      setSavingProfile(false);
    }
  };

  if (!auth?.currentUser || auth.currentUser.role !== Role.ADMIN) {
    return <Navigate to="/" />;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Panel de Administración</h1>
      <div className="flex items-center gap-3">
        <Link to="/dashboard/admin/jobs" className="btn border border-gray-300 bg-white hover:bg-gray-50">
          Gestionar puestos
        </Link>
        <Link to="/dashboard/admin/cv" className="btn border border-gray-300 bg-white hover:bg-gray-50">
          CV del Admin
        </Link>
      </div>
      {error && <div className="p-3 rounded bg-red-50 text-red-700">{error}</div>}
      {loading && <div className="text-gray-600">Cargando...</div>}

      {/* Gestión de usuarios (alta y reset password vía API externa) */}
      <section className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-bold mb-4">Gestión de usuarios</h2>
        <p className="text-sm text-gray-600 mb-3">Crear cuentas sin Gmail y autenticarlas desde el dashboard mediante un endpoint con service role.</p>
        <UserCreateForm />
        <div className="mt-6 border-t pt-6">
          <h3 className="text-lg font-semibold mb-2">Reset password (alumnos y empresas)</h3>
          <PasswordResetForm />
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="text-sm text-gray-500">Usuarios</p>
          <p className="text-2xl font-semibold">{profilesCount ?? '...'}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="text-sm text-gray-500">Empresas</p>
          <p className="text-2xl font-semibold">{companiesCount ?? '...'}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="text-sm text-gray-500">Puestos</p>
          <p className="text-2xl font-semibold">{jobsCount ?? '...'}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="text-sm text-gray-500">Postulaciones</p>
          <p className="text-2xl font-semibold">{applicationsCount ?? '...'}</p>
        </div>
      </section>

      {/* Recent users + editor */}
      <section className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-bold mb-4">Usuarios recientes</h2>
        {/* Filtros */}
        <div className="mb-4 grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs text-gray-700">Rol</label>
            <select className="mt-1 w-full border rounded p-2" value={filterRole} onChange={(e) => setFilterRole(e.target.value as Role | 'ALL')}>
              <option value="ALL">Todos</option>
              <option value="STUDENT">STUDENT</option>
              <option value="COMPANY">COMPANY</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-700">Universidad (contiene)</label>
            <input className="mt-1 w-full border rounded p-2" value={filterUniversity} onChange={(e) => setFilterUniversity(e.target.value)} placeholder="e.g. UBA" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-gray-700">Email</label>
            <input className="mt-1 w-full border rounded p-2" value={filterEmail} onChange={(e) => setFilterEmail(e.target.value)} placeholder="usuario@dominio.com" />
            {/* Nota removida para limpiar el diseño */}
            {/* <p className="text-xs text-gray-500 mt-1">Para email se requiere API admin configurada.</p> */}
          </div>
          <div className="flex items-end gap-2">
            <button className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50" onClick={handleSearchProfiles} disabled={searchingProfiles}>Buscar</button>
            <button className="px-4 py-2 bg-gray-300 text-gray-700 rounded" onClick={handleClearFilters}>Limpiar</button>
          </div>
        </div>
        <div className="divide-y">
          {recentProfiles.map(p => (
            <div key={p.id} className="py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{p.first_name || '(sin nombre)'} <span className="ml-2 text-sm text-gray-500">{p.id.slice(0, 8)}</span></p>
                  <p className="text-sm text-gray-600">Rol: {p.role} • Univ: {p.university || '—'}</p>
                  <p className="text-sm text-gray-600">Email: {p.email || '—'}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs rounded ${p.company_verified ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    Empresa verificada: {p.company_verified ? 'Sí' : 'No'}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded ${p.email_verified ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    Email verificado: {p.email_verified ? 'Sí' : 'No'}
                  </span>
                  <button
                    className="px-3 py-1 text-sm rounded bg-gray-200 hover:bg-gray-300"
                    onClick={() => startEditProfile(p)}
                  >
                    Editar
                  </button>
                  <button
                    className="px-3 py-1 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                    onClick={() => handleAuthorizeUser(p.id)}
                    disabled={authorizingUserId === p.id || p.email_verified === true}
                  >
                    Autorizar
                  </button>
                </div>
              </div>
              {editingProfileId === p.id && (
                <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs text-gray-700">Nombre</label>
                    <input className="mt-1 w-full border rounded p-2" value={editFirstName} onChange={(e) => setEditFirstName(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-700">Universidad</label>
                    <input className="mt-1 w-full border rounded p-2" value={editUniversity} onChange={(e) => setEditUniversity(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-700">Rol</label>
                    <select className="mt-1 w-full border rounded p-2" value={editRole} onChange={(e) => setEditRole(e.target.value as Role)}>
                      <option value="STUDENT">STUDENT</option>
                      <option value="COMPANY">COMPANY</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>
                  <div className="flex items-end gap-2">
                    <button className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50" onClick={saveEditProfile} disabled={savingProfile}>Guardar</button>
                    <button className="px-4 py-2 bg-gray-300 text-gray-700 rounded" onClick={cancelEditProfile}>Cancelar</button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {recentProfiles.length === 0 && (
            <p className="text-sm text-gray-500">Sin usuarios recientemente.</p>
          )}
        </div>
      </section>

      {/* Companies verification */}
      <section className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-bold mb-4">Empresas recientes</h2>
        <div className="divide-y">
          {companies.map(c => (
            <div key={c.id} className="py-3 flex items-center justify-between">
              <div>
                <p className="font-medium">{c.name}</p>
                <p className="text-sm text-gray-600">Owner: {c.owner_id.slice(0, 8)} • Creada: {new Date(c.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`px-2 py-1 text-xs rounded ${c.suspended ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                  Suspendida: {c.suspended ? 'Sí' : 'No'}
                </span>
                <button
                  className="px-3 py-1 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
                  onClick={() => handleToggleCompanySuspended(c.id, !(c.suspended ?? false))}
                >
                  {c.suspended ? 'Reactivar' : 'Suspender'}
                </button>
              </div>
            </div>
          ))}
          {companies.length === 0 && (
            <p className="text-sm text-gray-500">Sin empresas recientemente.</p>
          )}
        </div>
      </section>

      {/* Puestos recientes */}
      <section className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-bold mb-4">Puestos recientes</h2>
        <div className="divide-y">
          {jobs.map(j => (
            <div key={j.id} className="py-3 flex items-center justify-between">
              <div>
                <p className="font-medium">{j.title}</p>
                <p className="text-sm text-gray-600">Company: {j.company_id.slice(0,8)} • Publicado: {new Date(j.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`px-2 py-1 text-xs rounded ${j.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                  Activo: {j.is_active ? 'Sí' : 'No'}
                </span>
                <button
                  className="px-3 py-1 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
                  onClick={() => handleToggleJobActive(j.id, !j.is_active)}
                >
                  {j.is_active ? 'Ocultar' : 'Activar'}
                </button>
              </div>
            </div>
          ))}
          {jobs.length === 0 && (
            <p className="text-sm text-gray-500">Sin puestos recientemente.</p>
          )}
        </div>
      </section>

      {/* Moderación de postulaciones */}
      <section className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-bold mb-4">Moderación de postulaciones</h2>
        <div className="divide-y">
          {recentApplications.map(a => (
            <div key={a.id} className="py-3 flex items-center justify-between">
              <div>
                <p className="font-medium">Postulación {a.id.slice(0,8)}</p>
                <p className="text-sm text-gray-600">Job: {a.job_id.slice(0,8)} • Alumno: {a.student_id.slice(0,8)} • Fecha: {new Date(a.applied_at).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center space-x-3">
                <select
                  value={a.status}
                  onChange={(e) => handleUpdateApplicationStatus(a.id, e.target.value as ApplicationStatus)}
                  className="border border-gray-300 rounded-md py-1 px-2 text-sm"
                >
                  {[
                    ApplicationStatus.PENDING,
                    ApplicationStatus.REVIEWED,
                    ApplicationStatus.INTERVIEW,
                    ApplicationStatus.REJECTED,
                    ApplicationStatus.HIRED,
                  ].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
          {recentApplications.length === 0 && (
            <p className="text-sm text-gray-500">Sin postulaciones recientes.</p>
          )}
        </div>
      </section>

    </div>
  );
};

export default AdminDashboard;


function PasswordResetForm() {
  const [email, setEmail] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)
  const [message, setMessage] = React.useState<string | null>(null)
  const [actionLink, setActionLink] = React.useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setActionLink(null)
    setSubmitting(true)
    const { ok, error, link } = await requestPasswordReset(email)
    setSubmitting(false)
    if (!ok) {
      setMessage(error || 'No se pudo iniciar el reset de contraseña')
      return
    }
    setMessage('Reset iniciado. Si tu API envía correos, el usuario recibirá instrucciones.')
    if (link) setActionLink(link)
    setEmail('')
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700">Email del usuario (alumno o empresa)</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 w-full border rounded p-2" placeholder="usuario@dominio.com" />
      </div>
      <div className="md:col-span-2 flex items-center gap-3">
        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded disabled:opacity-50" disabled={submitting}>
          {submitting ? 'Enviando...' : 'Enviar reset password'}
        </button>
        {message && <span className="text-sm text-gray-700">{message}</span>}
      </div>
      {actionLink && (
        <div className="md:col-span-2 text-xs text-gray-700">
          Link de recuperación generado (para pruebas): <a href={actionLink} target="_blank" rel="noreferrer" className="text-blue-600 underline">{actionLink}</a>
        </div>
      )}
      {/* Aviso removido para no interferir con el diseño */}
      {/* <p className="md:col-span-2 text-xs text-gray-500">Requiere `VITE_ADMIN_API_URL` y un backend con Service Role generando links de recuperación para alumnos y empresas.</p> */}
    </form>
  )
}