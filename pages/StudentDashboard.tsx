import React, { useContext, useMemo, useEffect, useState } from 'react';
import { AuthContext } from '../App';
import { Link, Navigate } from 'react-router-dom';
import { Role, ApplicationStatus, Application, Job, Company } from '../types';
import { fetchApplicationsByStudent } from '../services/applicationsService';
import { fetchJobsByIds } from '../services/jobsService';
import { fetchCompaniesByIds } from '../services/companiesService';
import { supabase } from '../services/supabaseClient';
// import StudentSidebar from '../components/StudentSidebar';

const getStatusColor = (status: ApplicationStatus) => {
    switch (status) {
        case ApplicationStatus.HIRED: return 'chip chip--green';
        case ApplicationStatus.INTERVIEW: return 'chip chip--blue';
        case ApplicationStatus.REVIEWED: return 'chip chip--yellow';
        case ApplicationStatus.REJECTED: return 'chip chip--red';
        case ApplicationStatus.PENDING:
        default: return 'chip';
    }
}

const StudentDashboard: React.FC = () => {
    const auth = useContext(AuthContext);

    const [profile, setProfile] = useState<{ firstName?: string | null; lastName?: string | null; university?: string | null; profileImageUrl?: string | null; email?: string | null }>({});
    const [applications, setApplications] = useState<Application[]>([]);
    const [jobsById, setJobsById] = useState<Record<string, Job>>({});
    const [companiesById, setCompaniesById] = useState<Record<string, Company>>({});

    useEffect(() => {
        const run = async () => {
            if (!auth?.currentUser) return;
            const userId = auth.currentUser.id;
            // Profile
            const { data: prof, error: profErr } = await supabase
                .from('profiles')
                .select('first_name, last_name, university, profile_image_url')
                .eq('id', userId)
                .maybeSingle();
            if (!profErr && prof) {
                setProfile({
                    firstName: (prof as any).first_name,
                    lastName: (prof as any).last_name,
                    university: (prof as any).university,
                    profileImageUrl: (prof as any).profile_image_url,
                    email: auth.currentUser.email ?? null,
                });
            } else {
                setProfile({ email: auth.currentUser.email ?? null });
            }

            // Applications
            const apps = await fetchApplicationsByStudent(userId);
            setApplications(apps);
            const jobIds = Array.from(new Set(apps.map(a => a.jobId)));
            if (jobIds.length) {
                const jobs = await fetchJobsByIds(jobIds);
                const jobsMap: Record<string, Job> = {};
                jobs.forEach(j => jobsMap[j.id] = j);
                setJobsById(jobsMap);
                const companyIds = Array.from(new Set(jobs.map(j => j.companyId)));
                if (companyIds.length) {
                    const companies = await fetchCompaniesByIds(companyIds);
                    const compMap: Record<string, Company> = {};
                    companies.forEach(c => compMap[c.id] = c);
                    setCompaniesById(compMap);
                }
            }
        };
        run();
    }, [auth?.currentUser?.id]);

    if (!auth?.currentUser || auth.currentUser.role !== Role.STUDENT) {
        return <Navigate to="/" />;
    }

    const fullName = `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim() || auth.currentUser.email || 'Estudiante';
    const university = profile.university ?? '';
    const imageUrl = profile.profileImageUrl || 'https://via.placeholder.com/128x128.png?text=Profile';

    return (
        <div>
            <h1 className="text-3xl font-bold mb-8">Panel del alumno</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Section */}
                <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-sm">
                    <div className="text-center">
                        <img src={imageUrl} alt="Profile" className="w-32 h-32 rounded-full mx-auto mb-4 object-cover" />
                        <h2 className="text-2xl font-bold">{fullName}</h2>
                        {university && <p className="text-gray-600">{university}</p>}
                        <p className="text-sm text-gray-500 mt-1">{profile.email}</p>
                        <Link to="/dashboard/student/cv" className="mt-4 w-full btn btn--primary btn--md text-center">
                            Completar CV
                        </Link>
                    </div>
                </div>

                {/* My Applications Section */}
                <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm">
                    <h2 className="text-2xl font-bold mb-4">Mis postulaciones</h2>
                    <div className="space-y-4">
                        {applications.length > 0 ? applications.map(app => {
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
                                        <p className="text-sm text-gray-500 mt-1">Postulado: {app.appliedAt.toLocaleDateString()}</p>
                                    </div>
                                    <span className={getStatusColor(app.status)}>
                                        {app.status}
                                    </span>
                                </div>
                            );
                        }) : (
                            <p className="text-gray-500">Todavía no te postulaste a empleos.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default StudentDashboard;