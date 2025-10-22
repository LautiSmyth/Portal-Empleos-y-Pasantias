
export enum Role {
  STUDENT = 'STUDENT',
  COMPANY = 'COMPANY',
  ADMIN = 'ADMIN',
}

export enum JobModality {
  REMOTE = 'Remote',
  HYBRID = 'Hybrid',
  ON_SITE = 'On-site',
}

export enum ApplicationStatus {
  PENDING = 'Pending',
  REVIEWED = 'Reviewed',
  INTERVIEW = 'Interview',
  REJECTED = 'Rejected',
  HIRED = 'Hired',
}

export interface Company {
  id: string;
  name: string;
  logoUrl: string;
  website: string;
  description: string;
  // Nuevos campos de registro empresarial
  email?: string;
  legalName?: string;
  industry?: string;
  hrContactName?: string;
  contactPhone?: string;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  area: string;
  location: string;
  experienceMin: number;
  salaryRange: [number, number] | null;
  modality: JobModality;
  companyId: string;
  createdAt: Date;
  views: number;
}

export interface Student {
  id: string;
  name: string;
  lastname: string;
  email: string;
  university: string;
  profileImageUrl: string;
}

export interface Application {
  id: string;
  jobId: string;
  studentId: string;
  status: ApplicationStatus;
  appliedAt: Date;
}

export enum ExperienceLevel {
  JUNIOR = 'junior',
  SEMISENIOR = 'semi-senior',
  SENIOR = 'senior',
}

export type Skill = { name: string; level: number };
export type LanguageSkill = { name: string; written: string; spoken: string };
export type Education = { institution: string; degree: string; start: string; end: string };
export type WorkExperience = { company: string; role: string; responsibilities: string; start: string; end: string };
export type Project = { title: string; description: string; technologies: string[]; link?: string };

export interface CV {
  ownerId: string;
  personal: { firstName: string; lastName: string; email: string; phone: string };
  links: { linkedin?: string; github?: string; portfolio?: string };
  education: Education[];
  experience: WorkExperience[];
  projects: Project[];
  skills: Skill[];
  softSkills: string[];
  languages: LanguageSkill[];
  pdfFileName?: string;
  pdfDataUrl?: string;
}
