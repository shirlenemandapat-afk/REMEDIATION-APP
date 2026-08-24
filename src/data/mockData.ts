import {
  Student,
  SessionRecord,
  TeacherProfile,
  interpretMasteryLevel,
  SystemSettings,
  RemediationProgram,
  RemediationClass,
  SystemAnnouncement,
} from '../types';

export const INITIAL_TEACHER: TeacherProfile = {
  email: 'shirlene.mandapat@depedqc.ph',
  isPasswordSet: true,
  passwordHash: 'teacher123', // Demo / initial password
  role: 'coordinator',
  accountStatus: 'Active',
  name: 'Shirlene M. Mandapat',
  title: 'Master Teacher I / TLE Coordinator',
  schoolName: 'Ramon Magsaysay (Cubao) High School',
  division: 'SDO Quezon City • TLE Department',
  region: 'National Capital Region (NCR)',
  academicYear: '2025-2026',
  department: 'Technology and Livelihood Education (TLE)',
  assignedSubjects: ['ICT - Computer Programming', 'ICT - Computer Systems Servicing'],
  reportsSubmissionStatus: 'Submitted',
  registeredAt: '2025-06-15',

  masterTeacherName: 'Shirlene M. Mandapat',
  masterTeacherPosition: 'Master Teacher I / TLE Subject Coordinator',

  headTeacherName: 'Dr. Corazon V. Santos',
  headTeacherPosition: 'Head Teacher III / TLE Department',

  principalName: 'Dr. Maria Luisa T. Ramos',
  principalPosition: 'Secondary School Principal IV',
};

export const DEFAULT_ADMIN_ACCOUNT: TeacherProfile = {
  email: 'admin@projectsmile',
  passwordHash: 'admin2025',
  isPasswordSet: true,
  role: 'admin',
  accountStatus: 'Active',
  name: 'TLE Department Head Admin',
  title: 'Department Head / System Administrator',
  schoolName: 'Ramon Magsaysay (Cubao) High School',
  division: 'SDO Quezon City • TLE Department',
  region: 'National Capital Region (NCR)',
  academicYear: '2025-2026',
  department: 'Technology and Livelihood Education (TLE)',
  assignedSubjects: ['ICT - Computer Programming', 'Electronics and Electricity Servicing', 'Food Preservation'],
  reportsSubmissionStatus: 'Submitted',
  registeredAt: '2025-06-01',

  masterTeacherName: 'Shirlene M. Mandapat',
  masterTeacherPosition: 'Master Teacher I / TLE Subject Coordinator',
  headTeacherName: 'Dr. Corazon V. Santos',
  headTeacherPosition: 'Head Teacher III / TLE Department',
  principalName: 'Dr. Maria Luisa T. Ramos',
  principalPosition: 'Secondary School Principal IV',
};

export const SAMPLE_FACULTY_ACCOUNTS: TeacherProfile[] = [];

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  schoolName: 'Ramon Magsaysay (Cubao) High School',
  schoolYear: '2025-2026',
  currentQuarter: 'Q1',
  semester: '1st Semester',
  division: 'SDO Quezon City • TLE Department',
  region: 'National Capital Region (NCR)',
  department: 'Technology and Livelihood Education (TLE)',
  allowTeacherSelfRegistration: true,
  maintenanceMode: false,
  lastBackupDate: '2026-08-20',
};

export const INITIAL_REMEDIATION_PROGRAMS: RemediationProgram[] = [
  {
    id: 'prog-001',
    title: 'Q1 ICT - Computer Programming Code Booster',
    learningArea: 'ICT - Computer Programming',
    targetGradeLevel: 'Grade 7 & 8',
    programObjectives: 'Strengthen fundamental syntax mastery, conditional statements, and algorithm design through hands-on coding labs.',
    assignedTeacherEmails: [],
    assignedTeacherNames: [],
    scheduleDescription: 'Every Tuesday & Thursday, 3:30 PM - 4:45 PM',
    startDate: '2026-07-01',
    endDate: '2026-09-30',
    status: 'Active',
    maxStudents: 30,
    createdAt: '2026-06-20',
  },
  {
    id: 'prog-002',
    title: 'Intensive Computer Systems Servicing (CSS) Diagnostic Workshop',
    learningArea: 'ICT - Computer Systems Servicing',
    targetGradeLevel: 'Grade 9 & 10',
    programObjectives: 'Hands-on PC assembly/disassembly, BIOS configuration, cable crimping, and networking troubleshooting.',
    assignedTeacherEmails: [],
    assignedTeacherNames: [],
    scheduleDescription: 'Every Wednesday & Friday, 4:00 PM - 5:15 PM',
    startDate: '2026-07-05',
    endDate: '2026-10-15',
    status: 'Active',
    maxStudents: 25,
    createdAt: '2026-06-25',
  },
  {
    id: 'prog-003',
    title: 'Practical Electronics & Electrical Safety Remediation',
    learningArea: 'Electronics and Electricity Servicing',
    targetGradeLevel: 'Grade 8 & 9',
    programObjectives: 'Master multitester reading, circuit soldering, schematic interpretation, and occupational health safety.',
    assignedTeacherEmails: [],
    assignedTeacherNames: [],
    scheduleDescription: 'Every Monday & Wednesday, 3:30 PM - 4:45 PM',
    startDate: '2026-07-10',
    endDate: '2026-10-10',
    status: 'Active',
    maxStudents: 20,
    createdAt: '2026-06-28',
  },
  {
    id: 'prog-004',
    title: 'Food Preservation & Safe Processing Techniques',
    learningArea: 'Food Preservation',
    targetGradeLevel: 'Grade 7 & 8',
    programObjectives: 'Correct sugar concentration, pickling ratios, thermal processing, and sanitation standards in food lab.',
    assignedTeacherEmails: [],
    assignedTeacherNames: [],
    scheduleDescription: 'Every Tuesday & Thursday, 3:00 PM - 4:15 PM',
    startDate: '2026-07-15',
    endDate: '2026-09-30',
    status: 'Active',
    maxStudents: 25,
    createdAt: '2026-07-01',
  },
  {
    id: 'prog-005',
    title: 'Garments & Pattern Drafting Core Skill Clinic',
    learningArea: 'Garments',
    targetGradeLevel: 'Grade 9',
    programObjectives: 'Precision body measurement taking, pattern layout, sewing machine maintenance, and seam construction.',
    assignedTeacherEmails: [],
    assignedTeacherNames: [],
    scheduleDescription: 'Every Friday, 2:30 PM - 4:30 PM',
    startDate: '2026-08-01',
    endDate: '2026-10-31',
    status: 'Active',
    maxStudents: 20,
    createdAt: '2026-07-20',
  },
  {
    id: 'prog-006',
    title: 'Health and Wellness Caregiving Fundamentals',
    learningArea: 'Health and Wellness',
    targetGradeLevel: 'Grade 10',
    programObjectives: 'Vital signs monitoring, patient hygiene protocols, therapeutic communication, and wellness therapy routines.',
    assignedTeacherEmails: [],
    assignedTeacherNames: [],
    scheduleDescription: 'Every Monday & Thursday, 4:00 PM - 5:00 PM',
    startDate: '2026-08-05',
    endDate: '2026-11-15',
    status: 'Active',
    maxStudents: 20,
    createdAt: '2026-07-25',
  },
];

export const INITIAL_REMEDIATION_CLASSES: RemediationClass[] = [];

export const INITIAL_ANNOUNCEMENTS: SystemAnnouncement[] = [
  {
    id: 'anc-001',
    title: 'Submission of Q1 Anecdotal Remediation Records & MOVs',
    content: 'All TLE faculty handling Remediation and Skills Enhancement under Project S.M.I.L.E. are requested to finalize and submit student progress charts and assessment MOVs by Friday, August 28, 2026.',
    targetAudience: 'All Faculty',
    priority: 'High',
    authorName: 'Dr. Corazon V. Santos',
    authorRole: 'Head Teacher III / TLE Dept Head',
    publishDate: '2026-08-20',
    isPinned: true,
    status: 'Published',
  },
  {
    id: 'anc-002',
    title: 'New DepEd Diagnostic Assessment Tools Available in System',
    content: 'Standardized Diagnostic Rubrics and Simplified Learning Activity Sheets (LAS) for ICT, Electronics, and Home Economics are now linked in the assessment tools library.',
    targetAudience: 'Teachers',
    priority: 'Normal',
    authorName: 'Shirlene M. Mandapat',
    authorRole: 'Master Teacher I / Remediation Coordinator',
    publishDate: '2026-08-18',
    isPinned: false,
    status: 'Published',
  },
  {
    id: 'anc-003',
    title: 'Weekly Department Alignment on Student Risk Mitigation',
    content: 'Departmental consultation on learners scoring below 50% baseline in technical skills will be conducted every Friday at 4:30 PM via Google Meet.',
    targetAudience: 'All Faculty',
    priority: 'Normal',
    authorName: 'TLE Department Admin',
    authorRole: 'System Administrator',
    publishDate: '2026-08-15',
    isPinned: false,
    status: 'Published',
  },
];

// Realistic MOV sample graphics for optional demo inspection
export const MOV_SAMPLE_WORKLIST = [
  {
    id: 'mov-1',
    name: 'Worksheet_Fractions_Check.jpg',
    type: 'image' as const,
    dataUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&q=80',
    uploadedAt: '2026-08-01',
    caption: 'Student activity sheet showing 85% mastery in fractions simplification.',
    isAssessmentTool: true,
  },
  {
    id: 'mov-2',
    name: 'OneOnOne_Coaching_Photo.jpg',
    type: 'image' as const,
    dataUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=600&q=80',
    uploadedAt: '2026-08-05',
    caption: 'Guided one-on-one session using visual fraction bars manipulatives.',
  },
  {
    id: 'mov-3',
    name: 'Reading_Diagnostic_Rubric.jpg',
    type: 'image' as const,
    dataUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=600&q=80',
    uploadedAt: '2026-08-08',
    caption: 'Signed oral reading verification rubric and fluency log sheet.',
    isAssessmentTool: true,
  },
  {
    id: 'mov-4',
    name: 'Practical_Exam_Output.jpg',
    type: 'image' as const,
    dataUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80',
    uploadedAt: '2026-08-10',
    caption: 'Practical exam task sheet with teacher feedback and corrections.',
    isAssessmentTool: true,
  }
];

// Initial roster is completely empty so newly logged in teachers start with 0 students
export const INITIAL_STUDENTS: Student[] = [];
export const INITIAL_SESSIONS: SessionRecord[] = [];

// Empty datasets
export const SAMPLE_DEMO_STUDENTS: Student[] = [];
export const SAMPLE_DEMO_SESSIONS: SessionRecord[] = [];


