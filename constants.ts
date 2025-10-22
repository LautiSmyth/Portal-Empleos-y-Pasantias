
import { Company, Job, Student, Application, JobModality, ApplicationStatus } from './types';

export const MOCK_COMPANIES: Company[] = [
  {
    id: 'comp1',
    name: 'InnovateTech',
    logoUrl: 'https://picsum.photos/seed/innovate/200',
    website: 'https://innovate.tech',
    description: 'A leading company in AI and machine learning solutions.',
  },
  {
    id: 'comp2',
    name: 'Data Solutions Inc.',
    logoUrl: 'https://picsum.photos/seed/datasol/200',
    website: 'https://datasolutions.com',
    description: 'We turn big data into smart decisions.',
  },
  {
    id: 'comp3',
    name: 'Creative Minds Agency',
    logoUrl: 'https://picsum.photos/seed/creative/200',
    website: 'https://creativeminds.io',
    description: 'A digital marketing agency for the modern web.',
  },
];

export const MOCK_JOBS: Job[] = [
  {
    id: 'job1',
    title: 'Frontend Developer (React)',
    description: 'We are looking for a skilled React developer to join our team. You will be responsible for developing and implementing user interface components using React.js concepts and workflows such as Redux, Flux, and Webpack.',
    area: 'Software Development',
    location: 'New York, NY',
    experienceMin: 2,
    salaryRange: [80000, 110000],
    modality: JobModality.HYBRID,
    companyId: 'comp1',
    createdAt: new Date('2024-07-20T10:00:00Z'),
    views: 1254,
  },
  {
    id: 'job2',
    title: 'Data Scientist',
    description: 'Join our data science team to analyze large amounts of raw information to find patterns that will help improve our company. We will rely on you to build data products to extract valuable business insights.',
    area: 'Data Science',
    location: 'San Francisco, CA',
    experienceMin: 3,
    salaryRange: [120000, 160000],
    modality: JobModality.ON_SITE,
    companyId: 'comp2',
    createdAt: new Date('2024-07-18T14:30:00Z'),
    views: 876,
  },
  {
    id: 'job3',
    title: 'Digital Marketing Specialist',
    description: 'We are looking for an experienced Digital Marketing Specialist to assist in the planning, execution, and optimization of our online marketing efforts. The promotion of products and services through digital channels is a complex procedure with great potential which becomes increasingly useful for companies such as ours.',
    area: 'Marketing',
    location: 'Remote',
    experienceMin: 1,
    salaryRange: [60000, 75000],
    modality: JobModality.REMOTE,
    companyId: 'comp3',
    createdAt: new Date('2024-07-21T09:00:00Z'),
    views: 2341,
  },
  {
    id: 'job4',
    title: 'Backend Engineer (Node.js)',
    description: 'As a Backend Engineer, you will be responsible for managing the interchange of data between the server and the users. Your primary focus will be the development of all server-side logic, definition and maintenance of the central database, and ensuring high performance and responsiveness to requests from the front-end.',
    area: 'Software Development',
    location: 'Austin, TX',
    experienceMin: 4,
    salaryRange: null,
    modality: JobModality.HYBRID,
    companyId: 'comp1',
    createdAt: new Date('2024-07-15T11:00:00Z'),
    views: 942,
  },
  {
    id: 'job5',
    title: 'UI/UX Designer',
    description: 'We are seeking a talented UI/UX Designer to create amazing user experiences. The ideal candidate should have an eye for clean and artful design, possess superior UI skills and be able to translate high-level requirements into interaction flows and artifacts, and transform them into beautiful, intuitive, and functional user interfaces.',
    area: 'Design',
    location: 'Remote',
    experienceMin: 2,
    salaryRange: [75000, 95000],
    modality: JobModality.REMOTE,
    companyId: 'comp3',
    createdAt: new Date('2024-07-22T16:00:00Z'),
    views: 1530,
  },
];

export const MOCK_STUDENTS: Student[] = [
  {
    id: 'student1',
    name: 'Alice',
    lastname: 'Smith',
    email: 'alice.s@university.edu',
    university: 'State University',
    profileImageUrl: 'https://picsum.photos/seed/alice/200',
  },
  {
    id: 'student2',
    name: 'Bob',
    lastname: 'Johnson',
    email: 'bob.j@university.edu',
    university: 'Tech Institute',
    profileImageUrl: 'https://picsum.photos/seed/bob/200',
  },
];

export const MOCK_APPLICATIONS: Application[] = [
    {
        id: 'app1',
        jobId: 'job1',
        studentId: 'student1',
        status: ApplicationStatus.REVIEWED,
        appliedAt: new Date('2024-07-21T10:00:00Z'),
    },
    {
        id: 'app2',
        jobId: 'job3',
        studentId: 'student1',
        status: ApplicationStatus.PENDING,
        appliedAt: new Date('2024-07-22T11:00:00Z'),
    },
    {
        id: 'app3',
        jobId: 'job2',
        studentId: 'student2',
        status: ApplicationStatus.INTERVIEW,
        appliedAt: new Date('2024-07-19T15:00:00Z'),
    }
]
