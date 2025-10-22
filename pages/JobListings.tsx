
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import JobCard from '../components/JobCard';
import { AuthContext } from '../App';
import { Role, ExperienceLevel, Job, Company } from '../types';
import { fetchJobs } from '../services/jobsService';
import { fetchCompanies } from '../services/companiesService';

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

  useEffect(() => {
    let mounted = true;
    fetchJobs()
      .then((remote) => {
        if (mounted) setJobs(remote ?? []);
      })
      .catch(() => { if (mounted) setJobs([]); });
    fetchCompanies()
      .then((cos) => { if (mounted) setCompanies(cos ?? []); })
      .catch(() => { if (mounted) setCompanies([]); });
    return () => { mounted = false };
  }, []);

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

  if (studentNeedsCVGate) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-sm text-center space-y-4">
        <h2 className="text-2xl font-bold">Completa tu CV para acceder a la bolsa</h2>
        <p className="text-gray-600">Como alumno, necesitas tener un CV completo para ver y postularte a las ofertas.</p>
        <Link to="/dashboard/student/cv" className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Ir al constructor de CV</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Filters Sidebar */}
      <aside className="md:w-1/4 lg:w-1/5">
        <div className="bg-white p-6 rounded-lg shadow-sm sticky top-24">
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
