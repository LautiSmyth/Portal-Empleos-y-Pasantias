
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

export enum SkillLevel {
  BASICO = 'Básico',
  MEDIO = 'Medio',
  AVANZADO = 'Avanzado',
  NATIVO = 'Nativo'
}

export enum UniversityCareer {
  INGENIERIA_INDUSTRIAL = 'Ingeniería Industrial',
  INGENIERIA_MECANICA = 'Ingeniería Mecánica',
  INGENIERIA_MECATRONICA = 'Ingeniería Mecatrónica',
  INGENIERIA_FERROVIARIA = 'Ingeniería Ferroviaria',
  LICENCIATURA_HIGIENE_SEGURIDAD = 'Licenciatura en Higiene y Seguridad'
}

export type Skill = { name: string; level: number };
export type LanguageSkill = { name: string; written: string; spoken: string };
export type Education = { institution: string; degree: string; start: string; end: string };
export type WorkExperience = { company: string; role: string; responsibilities: string; start: string; end: string };
export type Project = { title: string; description: string; technologies: string[]; link?: string };

// Nuevos tipos para las mejoras del CV
export type UniversityEducation = {
  career: UniversityCareer;
  university: string;
  approvedSubjects: number;
  totalSubjects: number;
  startYear: number;
  graduationYear: number;
};

export type TechnicalSkill = {
  name: string;
  level: SkillLevel;
};

export type OfficeSkill = TechnicalSkill;
export type LanguageSkillNew = {
  language: string;
  level: SkillLevel;
};
export type DesignSkill = TechnicalSkill;
export type ProgrammingSkill = TechnicalSkill;
export type ManagementSystemSkill = TechnicalSkill;

export type TrainingCourse = {
  name: string;
  institution: string;
  duration: number; // en horas
  year: number;
  certified: boolean;
  description: string;
};

export type ComplementaryKnowledge = {
  name: string;
  level: SkillLevel;
};

export interface CV {
  ownerId: string;
  personal: { 
    firstName: string; 
    lastName: string; 
    email: string; 
    phone: string;
    dni: string;
    birthDate?: string; // formato DD/MM/YYYY
    locality?: string;
  };
  links: { linkedin?: string; github?: string; portfolio?: string };
  education: Education[];
  universityEducation: UniversityEducation[];
  experience: WorkExperience[];
  projects: Project[];
  languages: LanguageSkill[];
  // Nuevas secciones de conocimientos técnicos categorizados
  technicalSkills: {
    office: OfficeSkill[];
    languages: LanguageSkillNew[];
    design: DesignSkill[];
    programming: ProgrammingSkill[];
    managementSystems: ManagementSystemSkill[];
  };
  complementaryKnowledge: ComplementaryKnowledge[];
  trainingCourses: TrainingCourse[];
  pdfFileName?: string;
  pdfDataUrl?: string;
}
