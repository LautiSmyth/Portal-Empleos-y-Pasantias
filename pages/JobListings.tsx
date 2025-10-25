
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import JobCard from '../components/JobCard';
import { AuthContext } from '../App';
import { Role, ExperienceLevel, Job, Company, ApplicationStatus, Application, CV } from '../types';
import { fetchJobs, fetchJobsByIds } from '../services/jobsService';
import { fetchCompanies, fetchCompaniesByIds } from '../services/companiesService';
import { fetchApplicationsByStudent } from '../services/applicationsService';
import { fetchCVByOwnerId } from '../services/cvService';
import StudentSidebar from '../components/StudentSidebar';

const getStatusColor = (status: ApplicationStatus) => {
  switch (status) {
    case ApplicationStatus.HIRED: return 'chip chip--green';
    case ApplicationStatus.INTERVIEW: return 'chip chip--blue';
    case ApplicationStatus.REVIEWED: return 'chip chip--yellow';
    case ApplicationStatus.REJECTED: return 'chip chip--red';
    case ApplicationStatus.PENDING:
    default: return 'chip';
  }
};

const JobListings: React.FC = () => {
  const auth = useContext(AuthContext);
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [area, setArea] = useState('');
  const [location, setLocation] = useState('');
  const [minExperience, setMinExperience] = useState(0);
  const [modality, setModality] = useState('');
  const [level, setLevel] = useState<ExperienceLevel | ''>('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobsById, setJobsById] = useState<Record<string, Job>>({});
  const [companiesById, setCompaniesById] = useState<Record<string, Company>>({});
  const [cv, setCv] = useState<CV | null>(null);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        const [remoteJobs, cos] = await Promise.all([fetchJobs(), fetchCompanies()]);
        if (mounted) {
          setJobs(remoteJobs ?? []);
          setCompanies(cos ?? []);
        }
        if (auth?.currentUser && auth.currentUser.role === Role.STUDENT) {
          const studentId = auth.currentUser.id;
          const apps = await fetchApplicationsByStudent(studentId);
          if (mounted) setApplications(apps ?? []);
          const jobIds = Array.from(new Set(apps.map(a => a.jobId)));
          if (jobIds.length) {
            const jobsDetail = await fetchJobsByIds(jobIds);
            const jobsMap: Record<string, Job> = {};
            jobsDetail.forEach(j => jobsMap[j.id] = j);
            if (mounted) setJobsById(jobsMap);
            const companyIds = Array.from(new Set(jobsDetail.map(j => j.companyId)));
            if (companyIds.length) {
              const comps = await fetchCompaniesByIds(companyIds);
              const compMap: Record<string, Company> = {};
              comps.forEach(c => compMap[c.id] = c);
              if (mounted) setCompaniesById(compMap);
            }
          }
          const { cv: dbCV } = await fetchCVByOwnerId(studentId);
          if (mounted) setCv(dbCV || null);
        }
      } catch {
        if (mounted) {
          setJobs([]);
          setCompanies([]);
        }
      }
    };
    run();
    return () => { mounted = false };
  }, [auth?.currentUser?.id]);

  const hasCompleteCV = (studentId: string): boolean => {
    // Prefer CV from DB when available; fallback to localStorage
    if (cv) {
      const personalOk = !!(cv.personal?.firstName && cv.personal?.lastName && cv.personal?.email && cv.personal?.phone);
      const contentOk = !!cv.pdfDataUrl || (Array.isArray(cv.education) && cv.education.length > 0) || (Array.isArray(cv.experience) && cv.experience.length > 0);
      const skillsOk = Array.isArray(cv.skills) && cv.skills.length > 0;
      return Boolean(personalOk && contentOk && skillsOk);
    }
    try {
      const raw = localStorage.getItem(`cv_${studentId}`);
      if (!raw) return false;
      const localCV = JSON.parse(raw);
      const personalOk = localCV.personal?.firstName && localCV.personal?.lastName && localCV.personal?.email && localCV.personal?.phone;
      const contentOk = !!localCV.pdfDataUrl || (Array.isArray(localCV.education) && localCV.education.length > 0) || (Array.isArray(localCV.experience) && localCV.experience.length > 0);
      const skillsOk = Array.isArray(localCV.skills) && localCV.skills.length > 0;
      return Boolean(personalOk && contentOk && skillsOk);
    } catch {
      return false;
    }
  };

  const studentNeedsCVGate = useMemo(() => {
    if (!auth?.currentUser || auth.currentUser.role !== Role.STUDENT) return false;
    return !hasCompleteCV(auth.currentUser.id);
  }, [auth?.currentUser, cv]);

  const uniqueAreas = useMemo(() => [...new Set(jobs.map(j => j.area))], [jobs]);
  const uniqueLocations = useMemo(() => [...new Set(jobs.map(j => j.location))], [jobs]);
  const uniqueModalities = useMemo(() => [...new Set(jobs.map(j => j.modality))], [jobs]);

  const companyMap = useMemo(() => {
    const map: Record<string, Company> = {};
    for (const c of companies) map[c.id] = c;
    return map;
  }, [companies]);

  const filteredJobs = useMemo(() => {
    const matchesLevel = (years: number, lvl: ExperienceLevel | '') => {
      if (lvl === '') return true;
      if (lvl === ExperienceLevel.JUNIOR) return years <= 2;
      if (lvl === ExperienceLevel.SEMISENIOR) return years >= 3 && years <= 5;
      if (lvl === ExperienceLevel.SENIOR) return years >= 5;
      return true;
    };

    return jobs.filter(job => {
      const company = companyMap[job.companyId];
      const searchString = `${job.title} ${job.description} ${company?.name ?? ''}`.toLowerCase();
      return (
        (query === '' || searchString.includes(query.toLowerCase())) &&
        (area === '' || job.area === area) &&
        (location === '' || job.location === location) &&
        (modality === '' || job.modality === modality) &&
        matchesLevel(job.experienceMin, level) &&
        (job.experienceMin >= minExperience)
      );
    });
  }, [jobs, companyMap, query, area, location, modality, level, minExperience]);

  const recommendedJobs = useMemo(() => {
    if (!cv || jobs.length === 0) return jobs.slice(0, 6);
    const skills = (cv.skills || []).map(s => String(s).toLowerCase());
    const q = (query || '').toLowerCase();
    const scored = jobs.map(job => {
      const company = companyMap[job.companyId];
      const text = `${job.title} ${job.description} ${job.area} ${company?.name ?? ''}`.toLowerCase();
      let score = 0;
      for (const s of skills) {
        if (s && text.includes(s)) score += 2;
      }
      if (q && text.includes(q)) score += 1;
      return { job, score };
    });
    return scored
      .sort((a, b) => b.score - a.score)
      .map(x => x.job)
      .slice(0, 6);
  }, [cv, jobs, companyMap, query]);

  if (studentNeedsCVGate) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1 self-start sticky top-24 max-h-[calc(100vh-6rem-3rem)] overflow-auto">
          <StudentSidebar />
        </aside>
        <div className="lg:col-span-3">
          <h1 className="text-3xl font-bold mb-6">Empleos para ti</h1>
          <div className="bg-white p-8 rounded-lg shadow-sm text-center space-y-4">
            <h2 className="text-2xl font-bold">Completa tu CV para acceder a la bolsa</h2>
            <p className="text-gray-600">Como alumno, necesitas tener un CV completo para ver y postularte a las ofertas.</p>
            <Link to="/dashboard/student/cv" className="btn btn--primary btn--md">Ir al constructor de CV</Link>
          </div>
        </div>
      </div>
    );
  }

  // Student-focused view: "Empleos para ti"
  if (auth?.currentUser?.role === Role.STUDENT) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1 self-start sticky top-24 max-h-[calc(100vh-6rem-3rem)] overflow-auto">
          <StudentSidebar />
        </aside>
        <div className="lg:col-span-3 space-y-8">
          <h1 className="text-3xl font-bold mb-6">Empleos para ti</h1>
          {/* Tus postulaciones */}
          <section className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Tus postulaciones</h2>
              <div className="flex items-center space-x-2">
                <button className="btn btn--sm">Tablero</button>
                <button className="btn btn--sm btn--primary">Lista</button>
              </div>
            </div>
            <div className="space-y-4">
              {applications.length > 0 ? (
                applications.map(app => {
                  const job = jobsById[app.jobId];
                  const company = job ? companiesById[job.companyId] : undefined;
                  if (!job || !company) return (
                    <div key={app.id} className="border p-4 rounded-md text-gray-500">Puesto no disponible</div>
                  );
                  return (
                    <div key={app.id} className="border p-4 rounded-md flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div>
                        <Link to={`/jobs/${job.id}`} className="font-bold text-lg brand-link hover:underline">{job.title}</Link>
                        <p className="text-gray-600">{company.name}</p>
                        <p className="text-sm text-gray-500 mt-1">Enviada: {app.appliedAt.toLocaleDateString()}</p>
                      </div>
                      <span className={getStatusColor(app.status)}>
                        {app.status}
                      </span>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-500">Aún no has postulado a empleos.</p>
              )}
            </div>
          </section>

          {/* Propuestas para ti */}
          <section className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-bold mb-4">Propuestas para ti</h2>
            {recommendedJobs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {recommendedJobs.map((job) => (
                  <JobCard key={job.id} job={job} company={companyMap[job.companyId]} />
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500">Sin propuestas por ahora. Completa tu CV para mejores recomendaciones.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    );
  }

  // Fallback: listado original de empleos para otros roles
  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Sidebar */}
      <aside className="md:w-1/4 lg:w-1/5">
        <div className="sticky top-24 space-y-4">
          <StudentSidebar />
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-bold mb-4">Filters</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-gray-700">Keywords</label>
                <input
                  type="text"
                  id="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Job title, company..."
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="area" className="block text-sm font-medium text-gray-700">Area</label>
                <select
                  id="area"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">All Areas</option>
                  {uniqueAreas.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700">Location</label>
                <select
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">All Locations</option>
                  {uniqueLocations.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="modality" className="block text-sm font-medium text-gray-700">Modality</label>
                <select
                  id="modality"
                  value={modality}
                  onChange={(e) => setModality(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">All Modalities</option>
                  {uniqueModalities.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="level" className="block text-sm font-medium text-gray-700">Experience Level</label>
                <select
                  id="level"
                  value={level}
                  onChange={(e) => setLevel(e.target.value as any)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Any level</option>
                  <option value={ExperienceLevel.JUNIOR}>Junior</option>
                  <option value={ExperienceLevel.SEMISENIOR}>Semi-senior</option>
                  <option value={ExperienceLevel.SENIOR}>Senior</option>
                </select>
              </div>
              <div>
                <label htmlFor="experience" className="block text-sm font-medium text-gray-700">Minimum Experience</label>
                <input
                  type="range"
                  id="experience"
                  min="0"
                  max="10"
                  value={minExperience}
                  onChange={(e) => setMinExperience(parseInt(e.target.value))}
                  className="mt-1 w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="text-right text-sm text-gray-600">{minExperience}+ years</div>
              </div>
            </div>
          </div>
        </div>
      </aside>
      {/* Job Listings */}
      <div className="flex-1">
        <h2 className="text-2xl font-bold mb-4">
          {filteredJobs.length} Job Openings
        </h2>
        {filteredJobs.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredJobs.map((job) => (
              <JobCard key={job.id} job={job} company={companyMap[job.companyId]} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold">No jobs found</h3>
            <p className="text-gray-500 mt-2">Try adjusting your filters to find what you're looking for.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobListings;
