-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.applications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL,
  student_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'Pending'::text CHECK (status = ANY (ARRAY['Pending'::text, 'Reviewed'::text, 'Interview'::text, 'Rejected'::text, 'Hired'::text])),
  applied_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT applications_pkey PRIMARY KEY (id),
  CONSTRAINT applications_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id),
  CONSTRAINT applications_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.companies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  website text,
  description text,
  owner_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT companies_pkey PRIMARY KEY (id),
  CONSTRAINT companies_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.cv_education (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cv_id uuid NOT NULL,
  institution text NOT NULL,
  degree text NOT NULL,
  start_date date,
  end_date date,
  current boolean NOT NULL DEFAULT false,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT cv_education_pkey PRIMARY KEY (id),
  CONSTRAINT cv_education_cv_id_fkey FOREIGN KEY (cv_id) REFERENCES public.cvs(id)
);
CREATE TABLE public.cv_experiences (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cv_id uuid NOT NULL,
  company text NOT NULL,
  role text NOT NULL,
  responsibilities text,
  start_date date,
  end_date date,
  current boolean NOT NULL DEFAULT false,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT cv_experiences_pkey PRIMARY KEY (id),
  CONSTRAINT cv_experiences_cv_id_fkey FOREIGN KEY (cv_id) REFERENCES public.cvs(id)
);
CREATE TABLE public.cv_languages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cv_id uuid NOT NULL,
  name text NOT NULL,
  written_level text NOT NULL CHECK (written_level = ANY (ARRAY['Basico'::text, 'Intermedio'::text, 'Avanzado'::text, 'Nativo'::text])),
  spoken_level text NOT NULL CHECK (spoken_level = ANY (ARRAY['Basico'::text, 'Intermedio'::text, 'Avanzado'::text, 'Nativo'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT cv_languages_pkey PRIMARY KEY (id),
  CONSTRAINT cv_languages_cv_id_fkey FOREIGN KEY (cv_id) REFERENCES public.cvs(id)
);
CREATE TABLE public.cv_links (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cv_id uuid NOT NULL UNIQUE,
  linkedin text,
  github text,
  portfolio text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT cv_links_pkey PRIMARY KEY (id),
  CONSTRAINT cv_links_cv_id_fkey FOREIGN KEY (cv_id) REFERENCES public.cvs(id)
);
CREATE TABLE public.cv_projects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cv_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  link text,
  technologies ARRAY NOT NULL DEFAULT '{}'::text[],
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT cv_projects_pkey PRIMARY KEY (id),
  CONSTRAINT cv_projects_cv_id_fkey FOREIGN KEY (cv_id) REFERENCES public.cvs(id)
);
CREATE TABLE public.cv_skills (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cv_id uuid NOT NULL,
  name text NOT NULL,
  level integer NOT NULL CHECK (level >= 1 AND level <= 5),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT cv_skills_pkey PRIMARY KEY (id),
  CONSTRAINT cv_skills_cv_id_fkey FOREIGN KEY (cv_id) REFERENCES public.cvs(id)
);
CREATE TABLE public.cv_soft_skills (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cv_id uuid NOT NULL,
  name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT cv_soft_skills_pkey PRIMARY KEY (id),
  CONSTRAINT cv_soft_skills_cv_id_fkey FOREIGN KEY (cv_id) REFERENCES public.cvs(id)
);
CREATE TABLE public.cvs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  pdf_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT cvs_pkey PRIMARY KEY (id),
  CONSTRAINT cvs_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  area text NOT NULL,
  location text NOT NULL,
  experience_min integer NOT NULL,
  salary_min integer,
  salary_max integer,
  modality text NOT NULL CHECK (modality = ANY (ARRAY['Remote'::text, 'Hybrid'::text, 'On-site'::text])),
  company_id uuid NOT NULL,
  views integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT jobs_pkey PRIMARY KEY (id),
  CONSTRAINT jobs_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  role text NOT NULL CHECK (role = ANY (ARRAY['STUDENT'::text, 'COMPANY'::text, 'ADMIN'::text])),
  first_name text,
  last_name text,
  university text,
  profile_image_url text,
  company_verified boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);