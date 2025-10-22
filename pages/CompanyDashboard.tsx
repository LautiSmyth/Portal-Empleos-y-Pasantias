
import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../App';
import { Link, Navigate } from 'react-router-dom';
import { Role, Job, Company } from '../types';

import { fetchCompanyByOwnerId } from '../services/companiesService';
import { fetchJobsByCompanyId } from '../services/jobsService';
import { fetchApplicationCountsByJobIds } from '../services/applicationsService';

const CompanyDashboard: React.FC = () => {
    const auth = useContext(AuthContext);
+   const isVerified = Boolean(auth?.currentUser?.company_verified);

    const [jobTitle, setJobTitle] = useState('');
    const [jobKeywords, setJobKeywords] = useState('');
    const [jobDescription, setJobDescription] = useState('');

    const [company, setCompany] = useState<Company | null>(null);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [applicationCounts, setApplicationCounts] = useState<Record<string, number>>({});

    useEffect(() => {
        const run = async () => {
            if (!auth?.currentUser) return;
            const comp = await fetchCompanyByOwnerId(auth.currentUser.id);
            setCompany(comp);
            if (comp) {
                const js = await fetchJobsByCompanyId(comp.id);
                setJobs(js);
                const counts = await fetchApplicationCountsByJobIds(js.map(j => j.id));
                setApplicationCounts(counts);
            }
        };
        run();
    }, [auth?.currentUser?.id]);

    if (!auth?.currentUser || auth.currentUser.role !== Role.COMPANY) {
        return <Navigate to="/" />;
    }



    if (!company) {
        return <div className="text-center text-red-500">No se encontró una empresa asociada a tu usuario.</div>;
    }

    return (
        <div>
            <h1 className="text-3xl font-bold mb-8">Company Dashboard</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                
                {/* Create Job Section */}
                <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm">
                    <h2 className="text-2xl font-bold mb-4">Create New Job Posting</h2>
+                    {!isVerified && (
+                      <div className="mb-4 border border-yellow-200 bg-yellow-50 text-yellow-800 p-3 rounded">
+                        Your company is not verified yet. Posting is disabled until an admin verifies your account.
+                      </div>
+                    )}
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700">Job Title</label>
                            <input
                                type="text"
                                id="jobTitle"
                                value={jobTitle}
                                onChange={(e) => setJobTitle(e.target.value)}
                                placeholder="e.g., Software Engineer Intern"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                            />
                        </div>
                        <div>
                            <label htmlFor="jobKeywords" className="block text-sm font-medium text-gray-700">Keywords / Key Responsibilities</label>
                            <input
                                type="text"
                                id="jobKeywords"
                                value={jobKeywords}
                                onChange={(e) => setJobKeywords(e.target.value)}
                                placeholder="e.g., React, TypeScript, APIs"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                            />
                        </div>
                        <div className="relative">
                            <label htmlFor="jobDescription" className="block text-sm font-medium text-gray-700">Job Description</label>
                            <textarea
                                id="jobDescription"
                                rows={10}
                                value={jobDescription}
                                onChange={(e) => setJobDescription(e.target.value)}
                                placeholder="Describe the role, responsibilities, and qualifications..."
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                            />
                        </div>
                         <button className="w-full px-4 py-3 text-md font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700">
+                         <button
+                           className="w-full px-4 py-3 text-md font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
+                           disabled={!isVerified}
+                           title={!isVerified ? 'Posting disabled until company verification' : undefined}
+                         >
                            Post Job (Demo)
                        </button>
+                        {!isVerified && (
+                          <p className="text-xs text-gray-500 mt-2">If you believe this is a mistake, please contact support or wait for admin review.</p>
+                        )}
                    </div>
                </div>

                {/* Company Jobs & Metrics */}
                <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-sm">
                    <h2 className="text-2xl font-bold mb-4">Your Job Postings</h2>
                    <div className="space-y-4">
                        {jobs.map(job => {
                            const applicationCount = applicationCounts[job.id] ?? 0;
                            return (
                                <div key={job.id} className="border p-3 rounded-md">
                                    <Link to={`/jobs/${job.id}`} className="font-semibold text-blue-600 hover:underline">{job.title}</Link>
                                    <div className="text-sm text-gray-500 flex justify-between mt-2">
                                        <span>{job.views.toLocaleString()} views</span>
                                        <span>{applicationCount} applications</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CompanyDashboard;
