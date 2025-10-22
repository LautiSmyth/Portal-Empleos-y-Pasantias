-- Seed de ejemplo (ejecutar en SQL editor de Supabase con rol de servicio)
-- Nota: owner_id puede ser NULL para datos de demo; luego los dueños podrán reclamar y actualizar

insert into public.companies (id, name, logo_url, website, description, owner_id)
values
  ('00000000-0000-0000-0000-0000000000a1', 'InnovateTech', 'https://picsum.photos/seed/innovate/200', 'https://innovate.tech', 'A leading company in AI and machine learning solutions.', null),
  ('00000000-0000-0000-0000-0000000000a2', 'Data Solutions Inc.', 'https://picsum.photos/seed/datasol/200', 'https://datasolutions.com', 'We turn big data into smart decisions.', null),
  ('00000000-0000-0000-0000-0000000000a3', 'Creative Minds Agency', 'https://picsum.photos/seed/creative/200', 'https://creativeminds.io', 'A digital marketing agency for the modern web.', null)
  on conflict (id) do nothing;

insert into public.jobs (title, description, area, location, experience_min, salary_min, salary_max, modality, company_id)
values
  ('Frontend Developer (React)', 'We are looking for a skilled React developer to join our team. You will be responsible for developing and implementing user interface components using React.js concepts and workflows such as Redux, Flux, and Webpack.', 'Software Development', 'New York, NY', 2, 80000, 110000, 'Hybrid', '00000000-0000-0000-0000-0000000000a1'),
  ('Data Scientist', 'Join our data science team to analyze large amounts of raw information to find patterns that will help improve our company. We will rely on you to build data products to extract valuable business insights.', 'Data Science', 'San Francisco, CA', 3, 120000, 160000, 'On-site', '00000000-0000-0000-0000-0000000000a2'),
  ('Digital Marketing Specialist', 'We are looking for an experienced Digital Marketing Specialist to assist in the planning, execution, and optimization of our online marketing efforts.', 'Marketing', 'Remote', 1, 60000, 75000, 'Remote', '00000000-0000-0000-0000-0000000000a3'),
  ('Backend Engineer (Node.js)', 'As a Backend Engineer, you will be responsible for managing the interchange of data between the server and the users.', 'Software Development', 'Austin, TX', 4, null, null, 'Hybrid', '00000000-0000-0000-0000-0000000000a1'),
  ('UI/UX Designer', 'We are seeking a talented UI/UX Designer to create amazing user experiences.', 'Design', 'Remote', 2, 75000, 95000, 'Remote', '00000000-0000-0000-0000-0000000000a3');