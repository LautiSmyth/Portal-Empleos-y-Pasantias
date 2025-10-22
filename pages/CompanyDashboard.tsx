
import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../App';
import { Link, Navigate } from 'react-router-dom';
import { Role, Job, Company } from '../types';
import { generateJobDescription } from '../services/geminiService';
import SparklesIcon from '../components/icons/SparklesIcon';
import Spinner from '../components/Spinner';
import { fetchCompanyByOwnerId } from '../services/companiesService';
import { fetchJobsByCompanyId } from '../services/jobsService';
import { fetchApplicationCountsByJobIds } from '../services/applicationsService';

const CompanyDashboard: React.FC = () => {
    const auth = useContext(AuthContext);
    const [isGenerating, setIsGenerating] = useState(false);
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

    const handleGenerateDescription = async () => {
        if (!jobTitle.trim()) {
            alert('Please enter a job title first.');
            return;
        }
        setIsGenerating(true);
        setJobDescription('');
        try {
            const description = await generateJobDescription(jobTitle, jobKeywords);
            setJobDescription(description);
        } catch (error) {
            console.error(error);
            setJobDescription("Failed to generate description.");
        } finally {
            setIsGenerating(false);
        }
    };

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
                            <button
                                onClick={handleGenerateDescription}
                                disabled={isGenerating}
                                className="absolute top-0 right-0 mt-2 mr-2 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400"
                            >
                                <SparklesIcon className="w-4 h-4 mr-1.5"/>
                                {isGenerating ? 'Generating...' : 'Generate with AI'}
                            </button>
                            <label htmlFor="jobDescription" className="block text-sm font-medium text-gray-700">Job Description</label>
                            <textarea
                                id="jobDescription"
                                rows={10}
                                value={jobDescription}
                                onChange={(e) => setJobDescription(e.target.value)}
                                placeholder="Describe the role, responsibilities, and qualifications..."
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                            />
                            {isGenerating && <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75"><Spinner /></div>}
                        </div>
                         <button className="w-full px-4 py-3 text-md font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700">
                            Post Job (Demo)
                        </button>
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
