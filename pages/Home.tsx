
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import JobCard from '../components/JobCard';
import { Job, Company } from '../types';
import { fetchJobs } from '../services/jobsService';
import { fetchCompanies } from '../services/companiesService';

const Home: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);

  useEffect(() => {
    let mounted = true;
    fetchJobs()
      .then((remote) => { if (mounted) setJobs(remote ?? []); })
      .catch(() => { if (mounted) setJobs([]); });
    fetchCompanies()
      .then((cos) => { if (mounted) setCompanies(cos ?? []); })
      .catch(() => { if (mounted) setCompanies([]); });
    return () => { mounted = false };
  }, []);

  const companyMap = useMemo(() => {
    const map: Record<string, Company> = {};
    for (const c of companies) map[c.id] = c;
    return map;
  }, [companies]);

  const featuredJobs = useMemo(() => jobs.slice(0, 4), [jobs]);
  const featuredCompanies = useMemo(() => companies.slice(0, 8), [companies]);

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="bg-blue-50 p-8 rounded-lg">
        <h1 className="text-3xl font-bold mb-2">Encuentra tu próximo trabajo</h1>
        <p className="text-gray-700 mb-4">Explora oportunidades publicadas por empresas reales.</p>
        <Link to="/jobs" className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Ver ofertas</Link>
      </section>

      {/* Featured Jobs */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Últimas ofertas</h2>
          <Link to="/jobs" className="text-blue-600 hover:underline">Ver todas</Link>
        </div>
        {featuredJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featuredJobs.map(job => (
              <JobCard key={job.id} job={job} company={companyMap[job.companyId]} />
            ))}
          </div>
        ) : (
          <div className="bg-white p-6 rounded shadow-sm text-gray-600">No hay ofertas todavía.</div>
        )}
      </section>

      {/* Featured Companies */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Empresas</h2>
          <Link to="/companies" className="text-blue-600 hover:underline">Ver todas</Link>
        </div>
        {featuredCompanies.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {featuredCompanies.map(c => (
              <div key={c.id} className="bg-white p-4 rounded shadow-sm flex items-center gap-3">
                {c.logoUrl ? (
                  <img src={c.logoUrl} alt={c.name} className="w-10 h-10 rounded object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center text-gray-600 font-semibold">
                    {c.name[0]}
                  </div>
                )}
                <span className="font-medium">{c.name}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-6 rounded shadow-sm text-gray-600">No hay empresas todavía.</div>
        )}
      </section>
    </div>
  );
};

export default Home;
