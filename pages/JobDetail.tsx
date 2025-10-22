
import React, { useEffect, useMemo, useState, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { Role, Job, Company } from '../types';
import { fetchJobs } from '../services/jobsService';
import { fetchCompanies } from '../services/companiesService';
import { hasAppliedToJob, applyToJob } from '../services/applicationsService';

const JobDetail: React.FC = () => {
  const { jobId } = useParams();
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isApplied, setIsApplied] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetchJobs()
      .then((js) => {
        if (!mounted) return;
        const found = (js ?? []).find(j => j.id === jobId);
        setJob(found || null);
        return found;
      })
      .then((found) => {
        if (!mounted) return;
        if (found?.companyId) {
          return fetchCompanies().then(cs => {
            const cmp = (cs ?? []).find(c => c.id === found.companyId) || null;
            setCompany(cmp);
          });
        } else {
          setCompany(null);
        }
      })
      .catch(() => { if (mounted) { setJob(null); setCompany(null); } });
    return () => { mounted = false };
  }, [jobId]);

  useEffect(() => {
    const checkApplied = async () => {
      if (!auth?.currentUser || auth.currentUser.role !== Role.STUDENT || !jobId) return;
      const applied = await hasAppliedToJob(jobId, auth.currentUser.id);
      setIsApplied(applied);
    };
    checkApplied();
  }, [auth?.currentUser?.id, auth?.currentUser?.role, jobId]);

  const hasCompleteCV = (studentId: string): boolean => {
    try {
      const raw = localStorage.getItem(`cv_${studentId}`);
      if (!raw) return false;
      const cv = JSON.parse(raw);
      const personalOk = cv.personal?.firstName && cv.personal?.lastName && cv.personal?.email && cv.personal?.phone;
      const contentOk = !!cv.pdfDataUrl || (Array.isArray(cv.education) && cv.education.length > 0) || (Array.isArray(cv.experience) && cv.experience.length > 0);
      const skillsOk = Array.isArray(cv.skills) && cv.skills.length > 0;
      return Boolean(personalOk && contentOk && skillsOk);
    } catch {
      return false;
    }
  };

  const studentNeedsCVGate = useMemo(() => {
    if (!auth?.currentUser || auth.currentUser.role !== Role.STUDENT) return false;
    return !hasCompleteCV(auth.currentUser.id);
  }, [auth?.currentUser]);

  const isLoading = useMemo(() => job === null, [job]);

  const handleApply = async () => {
    if (!auth?.currentUser) {
      navigate('/auth/login');
      return;
    }
    if (auth.currentUser.role !== Role.STUDENT) {
      alert('Solo los alumnos pueden postularse a ofertas.');
      return;
    }
    if (studentNeedsCVGate) {
      navigate('/dashboard/student/cv');
      return;
    }
    if (!jobId || isApplied) return;
    setIsApplying(true);
    const res = await applyToJob(jobId, auth.currentUser.id);
    setIsApplying(false);
    if (res.ok) setIsApplied(true);
    else alert(res.error || 'No se pudo postular, intenta nuevamente.');
  };

  if (auth?.currentUser?.role === Role.STUDENT && studentNeedsCVGate) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-sm text-center space-y-4">
        <h2 className="text-2xl font-bold">Completa tu CV para ver y postularte</h2>
        <p className="text-gray-600">Necesitas un CV completo antes de postularte a una oferta.</p>
        <button onClick={() => navigate('/dashboard/student/cv')} className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Ir al constructor de CV</button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-sm">
        <p className="text-gray-600">Cargando oferta...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-sm">
        <h2 className="text-xl font-bold mb-2">Oferta no encontrada</h2>
        <p className="text-gray-600 mb-4">La oferta podría haber sido eliminada o ya no está disponible.</p>
        <Link to="/jobs" className="text-blue-600 hover:underline">Volver a ofertas</Link>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-lg shadow-sm">
      <div className="flex items-center gap-4 mb-6">
        {company?.logoUrl ? (
          <img src={company.logoUrl} alt={company.name} className="w-16 h-16 rounded object-cover" />
        ) : (
          <div className="w-16 h-16 rounded bg-gray-200 flex items-center justify-center text-gray-600 font-semibold">
            {company?.name ? company.name[0] : '?'}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold">{job.title}</h1>
          <p className="text-gray-600">{company?.name ?? 'Empresa desconocida'}</p>
        </div>
      </div>

      <div className="prose max-w-none">
        <h2 className="text-xl font-semibold mb-2">Descripción</h2>
        <p className="text-gray-700 whitespace-pre-line">{job.description}</p>
      </div>

      <div className="mt-8 flex items-center gap-3">
        <Link to="/jobs" className="inline-block px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">Volver a ofertas</Link>
        {auth?.currentUser?.role === Role.STUDENT && (
          isApplied ? (
            <span className="inline-block px-4 py-2 bg-green-600 text-white rounded">Ya postulaste</span>
          ) : (
            <button
              onClick={handleApply}
              disabled={isApplying}
              className={`inline-block px-4 py-2 rounded text-white ${isApplying ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {isApplying ? 'Postulando...' : 'Postular'}
            </button>
          )
        )}
      </div>
    </div>
  );
};

export default JobDetail;
