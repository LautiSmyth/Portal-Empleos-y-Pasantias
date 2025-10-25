
import React from 'react';
import { Link } from 'react-router-dom';
import { Job, Company } from '../types';
import LocationIcon from './icons/LocationIcon';
import BriefcaseIcon from './icons/BriefcaseIcon';
import BuildingIcon from './icons/BuildingIcon';

/**
 * JobCard
 * Muestra un puesto con información resumida y un CTA a detalles.
 * Props:
 * - job: objeto Job (id, title, location, modality, experienceMin, salaryRange, createdAt, companyId)
 * - company?: objeto Company para logo y nombre (opcional)
 */
interface JobCardProps {
  job: Job;
  company?: Company;
}

const JobCard: React.FC<JobCardProps> = ({ job, company }) => {
  const timeSince = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return "Just now";
  };

  return (
    <div className="ui-card flex flex-col">
      <div className="flex items-start space-x-4">
        {company && <img src={company.logoUrl} alt={`${company.name} logo`} className="w-16 h-16 rounded-md object-cover"/>}
        <div className="flex-1">
          <p className="text-sm text-gray-500 flex items-center">
            <BuildingIcon className="w-4 h-4 mr-1.5" />
            {company?.name || '...'}
          </p>
          <h3 className="text-xl font-bold text-gray-800 mt-1">{job.title}</h3>
        </div>
      </div>
      <div className="mt-4 space-y-2 text-sm text-gray-600">
        <p className="flex items-center"><LocationIcon className="w-4 h-4 mr-2" /> {job.location} ({job.modality})</p>
        <p className="flex items-center"><BriefcaseIcon className="w-4 h-4 mr-2" /> {job.experienceMin}+ years of experience</p>
        {job.salaryRange && (
          <p className="font-semibold text-green-600">
            ${job.salaryRange[0].toLocaleString()} - ${job.salaryRange[1].toLocaleString()}
          </p>
        )}
      </div>
      <div className="mt-6 flex justify-between items-center pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-400">{timeSince(job.createdAt)}</p>
        <Link 
          to={`/jobs/${job.id}`} 
          className="btn btn-primary"
        >
          View Details
        </Link>
      </div>
    </div>
  );
};

export default JobCard;
