export type ProgramType = 'Remediation' | 'Skills Enhancement';

export type ActivityType =
  | 'Simulation Exercises'
  | 'Case Study Analysis'
  | 'Project-Based Task'
  | 'Skill Demonstration'
  | 'Portfolio Development'
  | 'Role Assignment'
  | 'Performance Task'
  | 'Skill Stations'
  | 'Remedial Hands-on Practice'
  | 'Reteaching'
  | 'Diagnostic Drill'
  | 'Guided Practice'
  | 'Peer Tutoring'
  | 'Interactive Quiz'
  | 'Practical Exam'
  | 'Written Exam'
  | 'Hands-on Lab / Workshop';

export type InterventionStrategy =
  | 'Task Simplification'
  | 'Error Analysis'
  | 'Think-Aloud Method'
  | 'Practice with Feedback'
  | 'Collaborative Learning'
  | 'Scaffolding Support'
  | 'Use of Rubrics'
  | 'Gamified Activities'
  | 'Remediation Contracts'
  | 'Blended Learning'
  | 'Differentiated Instruction'
  | 'One-on-One Coaching'
  | 'Simplified Learning Activity Sheet (LAS)'
  | 'Visual Aid & Manipulatives Support';

export interface ActivityDefinition {
  name: string;
  category: 'Experiential' | 'Demonstration' | 'Assessment' | 'Practice';
  description: string;
}

export interface StrategyDefinition {
  name: string;
  category: 'Cognitive' | 'Scaffolding' | 'Engagement' | 'Assessment';
  description: string;
}

export const ACTIVITY_DEFINITIONS: ActivityDefinition[] = [
  {
    name: 'Simulation Exercises',
    category: 'Experiential',
    description: 'Role-play or mock scenarios (e.g., customer service in a food stall, troubleshooting in ICT).',
  },
  {
    name: 'Case Study Analysis',
    category: 'Experiential',
    description: 'Students examine real-life situations and propose solutions.',
  },
  {
    name: 'Project-Based Task',
    category: 'Experiential',
    description: 'Small projects like designing a menu, creating a simple website, or building a tool organizer.',
  },
  {
    name: 'Skill Demonstration',
    category: 'Demonstration',
    description: 'Teacher or expert shows proper execution, followed by student replication.',
  },
  {
    name: 'Portfolio Development',
    category: 'Assessment',
    description: 'Students compile evidence of skills learned (photos, reports, outputs).',
  },
  {
    name: 'Role Assignment',
    category: 'Experiential',
    description: 'Assigning specific roles in group work (e.g., leader, recorder, checker).',
  },
  {
    name: 'Performance Task',
    category: 'Assessment',
    description: 'Graded activity requiring mastery of a competency (e.g., cooking a dish, wiring a circuit).',
  },
  {
    name: 'Skill Stations',
    category: 'Practice',
    description: 'Rotating stations where students practice different skills in sequence.',
  },
  {
    name: 'Remedial Hands-on Practice',
    category: 'Practice',
    description: 'Extra practice time for students struggling with specific tools or processes.',
  },
  {
    name: 'Reteaching',
    category: 'Demonstration',
    description: 'Systematic re-explanation of core competency concepts using alternative approaches.',
  },
  {
    name: 'Diagnostic Drill',
    category: 'Assessment',
    description: 'Targeted diagnostic assessment to identify exact learning gaps and misconceptions.',
  },
  {
    name: 'Guided Practice',
    category: 'Practice',
    description: 'Teacher-led step-by-step practice before independent student execution.',
  },
  {
    name: 'Peer Tutoring',
    category: 'Practice',
    description: 'Paired collaborative learning where advanced peers assist struggling students.',
  },
  {
    name: 'Interactive Quiz',
    category: 'Assessment',
    description: 'Formative interactive assessment checks to measure immediate retention.',
  },
  {
    name: 'Practical Exam',
    category: 'Assessment',
    description: 'Authentic hands-on practical test evaluating vocational and technical execution.',
  },
  {
    name: 'Written Exam',
    category: 'Assessment',
    description: 'Summative paper-and-pencil or online evaluation of theoretical knowledge.',
  },
  {
    name: 'Hands-on Lab / Workshop',
    category: 'Experiential',
    description: 'Laboratory workshop session utilizing authentic tools, machines, and kitchen/electrical equipment.',
  },
];

export const STRATEGY_DEFINITIONS: StrategyDefinition[] = [
  {
    name: 'Task Simplification',
    category: 'Scaffolding',
    description: 'Breaking down complex tasks into smaller, manageable parts.',
  },
  {
    name: 'Error Analysis',
    category: 'Cognitive',
    description: 'Reviewing mistakes together and correcting them step by step.',
  },
  {
    name: 'Think-Aloud Method',
    category: 'Cognitive',
    description: 'Teacher verbalizes thought process while solving a task, modeling problem-solving.',
  },
  {
    name: 'Practice with Feedback',
    category: 'Cognitive',
    description: 'Immediate correction and reinforcement during skill drills.',
  },
  {
    name: 'Collaborative Learning',
    category: 'Engagement',
    description: 'Group activities where students solve tasks collectively.',
  },
  {
    name: 'Scaffolding Support',
    category: 'Scaffolding',
    description: 'Gradually reducing teacher assistance as students gain confidence.',
  },
  {
    name: 'Use of Rubrics',
    category: 'Assessment',
    description: 'Clear criteria for performance tasks to guide improvement.',
  },
  {
    name: 'Gamified Activities',
    category: 'Engagement',
    description: 'Turning drills into games or competitions to motivate learners.',
  },
  {
    name: 'Remediation Contracts',
    category: 'Engagement',
    description: 'Personalized agreements where students commit to specific improvement tasks.',
  },
  {
    name: 'Blended Learning',
    category: 'Cognitive',
    description: 'Combining online tutorials with hands-on practice.',
  },
  {
    name: 'Differentiated Instruction',
    category: 'Scaffolding',
    description: 'Adapting teaching pacing, content, and output according to student readiness.',
  },
  {
    name: 'One-on-One Coaching',
    category: 'Scaffolding',
    description: 'Individualized direct teacher mentorship and tailored corrective guidance.',
  },
  {
    name: 'Simplified Learning Activity Sheet (LAS)',
    category: 'Scaffolding',
    description: 'Bite-sized contextualized DepEd activity sheets with illustrated guides.',
  },
  {
    name: 'Visual Aid & Manipulatives Support',
    category: 'Cognitive',
    description: 'Real equipment, 3D models, flowcharts, and tangible manipulatory objects.',
  },
];

export type StudentStatus = 'Needs Remediation' | 'Progressing' | 'Mastered / Promoted';

export interface MOVAttachment {
  id: string;
  name: string;
  type: 'image' | 'pdf' | 'document';
  dataUrl: string; // Base64 or object URL or placeholder image
  uploadedAt: string;
  caption: string;
  isAssessmentTool?: boolean; // Tagged if uploaded as assessment / intervention tool
  evaluationStatus?: 'Pending' | 'Verified' | 'Exemplary' | 'Needs Revision';
  evaluationNotes?: string;
  evaluatedBy?: string;
  evaluatedAt?: string;
  rubricChecks?: {
    alignedWithCompetency: boolean;
    authenticLearnerOutput: boolean;
    clearDocumentation: boolean;
  };
}

export interface Student {
  id: string;
  lastName: string;
  firstName: string;
  middleInitial: string;
  gradeLevel: string; // e.g. "Grade 7"
  section: string;    // e.g. "Diamond"
  subject: string;    // e.g. "ICT - Technical Drafting", "Cookery", "Mathematics"
  programType: ProgramType;
  baselineScore: number; // e.g. 45% initial score
  focusTopic: string;   // Optional initial topic or identified per session
  enrolledDate: string; // YYYY-MM-DD
  status: StudentStatus;
  parentName?: string;
  parentContact?: string;
  scheduleDetails?: string; // e.g., "Every Tuesday & Thursday, 3:30 PM - 4:30 PM"
  notes?: string;
  isArchived?: boolean;
  archivedAt?: string;
  teacherEmail?: string; // Teacher account email who enrolled/manages this student
}

export interface SessionRecord {
  id: string;
  studentId: string;
  studentName: string; // Formatted "LastName, FirstName M."
  section: string;
  gradeLevel: string;
  subject: string;
  programType: ProgramType;
  date: string; // YYYY-MM-DD
  focusCompetency: string; // Focus competency per session
  activityType: ActivityType | string; // Joined or primary
  activityTypes: string[]; // Multiple activity types
  intervention: string; // Strategy used (joined)
  interventions: string[]; // Multiple strategies applied
  rawScore: number; // Raw score (e.g., 18)
  totalItems: number; // Total possible score/items (e.g., 20)
  score: number; // Calculated Mastery / Assessment percentage 0-100
  masteryLevel: string; // e.g., "Mastered (90-100%)", "Closely Approximating Mastery (75-89%)"
  remarks: string; // Anecdotal observation
  movs: MOVAttachment[]; // Means of verification files/photos
  assessmentTool?: MOVAttachment; // Uploaded assessment/intervention tool with mandatory caption
  createdAt: string;
  teacherEmail?: string; // Teacher account email who conducted/logged this session
  supervisoryStatus?: 'Pending Review' | 'Verified' | 'Exemplary' | 'Needs Follow-up';
  supervisoryRemarks?: string;
  supervisedBy?: string;
  supervisedAt?: string;
}

export type UserRole = 'teacher' | 'admin' | 'head_teacher' | 'school_head' | 'coordinator';

export interface RoleDefinition {
  id: UserRole;
  code: string; // e.g. 'TEACHER' | 'ADMIN' | 'HEAD TEACHER' | 'SCHOOL HEAD' | 'COORDINATOR'
  name: string;
  label: string;
  category: string;
  description: string;
  badgeClass: string;
  badgeColor: string;
  pillColor: string;
  accessLevel: 'classroom' | 'department' | 'executive' | 'system';
  permissions: string[];
}

export const SYSTEM_ROLES: RoleDefinition[] = [
  {
    id: 'teacher',
    code: 'TEACHER',
    name: 'Classroom / Subject Teacher',
    label: 'Teacher',
    category: 'Classroom Instruction',
    description: 'Logs daily student anecdotal remediation records, intervention activities, and assessment MOVs for assigned classes.',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    badgeColor: 'emerald',
    pillColor: 'bg-emerald-500',
    accessLevel: 'classroom',
    permissions: [
      'Enroll and monitor assigned learners',
      'Log daily anecdotal remediation sessions',
      'Upload assessment tools and photo MOVs',
      'Generate DepEd Parent Communication Letters',
      'Generate Individual Anecdotal Reports',
      'Export student mastery logs',
    ],
  },
  {
    id: 'admin',
    code: 'ADMIN',
    name: 'System & ICT Administrator',
    label: 'Administrator',
    category: 'System Management',
    description: 'Full administrative privileges over accounts, database backups, audit logs, system configurations, and faculty roles.',
    badgeClass: 'bg-purple-100 text-purple-900 border-purple-300',
    badgeColor: 'purple',
    pillColor: 'bg-purple-600',
    accessLevel: 'system',
    permissions: [
      'Full administrative access to all data',
      'Manage faculty accounts & assign roles',
      'System settings & academic calendar setup',
      'Database backup, restore & cloud sync',
      'View administrative audit logs',
      'Manage school-wide programs & schedules',
    ],
  },
  {
    id: 'head_teacher',
    code: 'HEAD TEACHER',
    name: 'Head Teacher / Department Head',
    label: 'Head Teacher',
    category: 'Instructional Supervision',
    description: 'Department-level instructional leader supervising teacher remediation submissions, reviewing logs, and generating departmental narrative reports.',
    badgeClass: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    badgeColor: 'indigo',
    pillColor: 'bg-indigo-600',
    accessLevel: 'department',
    permissions: [
      'Supervise department teachers & submissions',
      'School-wide and department student monitoring',
      'Review teacher session records & MOVs',
      'Generate Department Narrative Reports',
      'Review Class Progress Analytics',
      'Signatory for remedial accomplishment reports',
    ],
  },
  {
    id: 'school_head',
    code: 'SCHOOL HEAD',
    name: 'School Head / Principal',
    label: 'School Head / Principal',
    category: 'Executive Leadership',
    description: 'Executive school administrator with school-wide institutional oversight, compliance tracking, and overall remediation evaluation.',
    badgeClass: 'bg-blue-100 text-blue-900 border-blue-300',
    badgeColor: 'blue',
    pillColor: 'bg-blue-600',
    accessLevel: 'executive',
    permissions: [
      'Executive institutional oversight',
      'School-wide remediation completion monitoring',
      'DepEd SDO compliance & audit review',
      'Access all teacher reports and analytics',
      'Review school-wide diagnostic outcomes',
      'Final signatory for institutional reports',
    ],
  },
  {
    id: 'coordinator',
    code: 'COORDINATOR',
    name: 'Remediation Coordinator / Master Teacher',
    label: 'Coordinator / Master Teacher',
    category: 'Curriculum & Program Coordination',
    description: 'Curriculum & intervention coordinator designing programs, class schedules, aligning learning areas, and mentoring faculty.',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    badgeColor: 'amber',
    pillColor: 'bg-amber-600',
    accessLevel: 'department',
    permissions: [
      'Design & manage remediation programs',
      'Configure remediation classes & schedules',
      'Assign teachers to subject areas & programs',
      'Monitor cross-subject student interventions',
      'Review learning area diagnostic rubrics',
      'Coordinate department intervention schedules',
    ],
  },
];

export function getRoleDefinition(role?: string | null): RoleDefinition {
  const norm = (role || 'teacher').toLowerCase().trim();
  if (norm === 'admin') return SYSTEM_ROLES[1];
  if (norm === 'head_teacher' || norm === 'head-teacher' || norm === 'headteacher' || norm.includes('head teacher')) return SYSTEM_ROLES[2];
  if (norm === 'school_head' || norm === 'school-head' || norm === 'principal' || norm.includes('school head')) return SYSTEM_ROLES[3];
  if (norm === 'coordinator' || norm === 'master_teacher' || norm === 'master-teacher' || norm.includes('coordinator')) return SYSTEM_ROLES[4];
  return SYSTEM_ROLES[0]; // teacher
}

export function formatRoleTitle(role?: string | null): string {
  return getRoleDefinition(role).code;
}

export const LEARNING_AREAS = [
  'ICT - Computer Programming',
  'ICT - Computer Systems Servicing',
  'ICT - Technical Drafting',
  'Food Preservation & Processing',
  'Cookery & Bread/Pastry',
  'Garments & Pattern Drafting',
  'Electronics and Electricity Servicing',
  'Health and Wellness Caregiving',
  'Automotive & Small Engine Servicing',
  'General TLE / TVL Exploratory',
] as const;
export type LearningArea = (typeof LEARNING_AREAS)[number] | string;

export interface RemediationProgram {
  id: string;
  title: string; // The subject name (e.g., "Math", "Science", "Programming")
  learningArea?: string; // Optional legacy / subject categorization
  targetGradeLevel: string; // e.g. "Grade 7", "Grade 8", "All Grades"
  programObjectives: string;
  assignedTeacherEmails: string[];
  assignedTeacherNames: string[];
  scheduleDescription: string; // e.g. "Every Mon & Wed, 3:30 PM - 4:30 PM"
  startDate: string;
  endDate: string;
  status: 'Active' | 'Upcoming' | 'Completed';
  maxStudents?: number;
  createdAt: string;
}

export interface RemediationClass {
  id: string;
  programId?: string;
  className: string;
  learningArea: LearningArea;
  assignedTeacherEmail: string;
  assignedTeacherName: string;
  enrolledStudentIds: string[];
  scheduleDays: string[]; // e.g. ["Monday", "Wednesday", "Friday"]
  startTime: string; // e.g. "15:30"
  endTime: string; // e.g. "16:30"
  venueType: 'Physical Room' | 'Online Link';
  venueOrLink: string; // e.g. "TLE Lab 204" or "https://meet.google.com/xyz"
  status: 'Active' | 'Completed' | 'Suspended';
  createdAt: string;
}

export interface SystemAnnouncement {
  id: string;
  title: string;
  content: string;
  targetAudience: 'All Faculty' | 'Remediation Coordinators' | 'Teachers' | 'All Users' | string;
  priority: 'Low' | 'Normal' | 'High' | 'Urgent';
  authorName: string;
  authorRole: string;
  publishDate: string;
  isPinned: boolean;
  isScheduled?: boolean;
  scheduledFor?: string;
  expiresAt?: string;
  status: 'Published' | 'Draft' | 'Scheduled';
}

export interface SystemSettings {
  schoolName: string;
  schoolLogoUrl?: string;
  schoolYear?: string;
  academicYear?: string;
  currentQuarter?: 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'Quarter 1' | 'Quarter 2' | 'Quarter 3' | 'Quarter 4' | 'Summer Remediation' | string;
  semester?: '1st Semester' | '2nd Semester' | string;
  division?: string;
  region?: string;
  department?: string;
  departmentName?: string;
  passingScoreThreshold?: number;
  activeLearningAreas?: string[];
  allowTeacherSelfRegistration?: boolean;
  maintenanceMode?: boolean;
  lastBackupDate?: string;
}

export interface TeacherProfile {
  email: string;
  passwordHash?: string;
  isPasswordSet: boolean;
  role?: UserRole;
  roleTitle?: string; // Standardized display code: 'TEACHER' | 'ADMIN' | 'HEAD TEACHER' | 'SCHOOL HEAD' | 'COORDINATOR'
  permissions?: string[];
  accountStatus?: 'Active' | 'Inactive';
  name: string;
  title: string; // e.g., "Teacher III" / "Master Teacher I"
  schoolName: string; // e.g., "Ramon Magsaysay (Cubao) High School"
  division: string;   // e.g., "SDO Quezon City"
  region: string;     // e.g., "NCR"
  academicYear: string; // e.g., "2025-2026"
  department?: string; // e.g., "Technology and Livelihood Education (TLE)"
  assignedSubjects?: string[]; // e.g. ["ICT - Computer Programming", "Food Preservation"]
  registeredAt?: string;
  lastLoginAt?: string;
  phoneNumber?: string;
  reportsSubmissionStatus?: 'Submitted' | 'Pending' | 'Needs Revision' | 'Draft';
  headTeacherFeedback?: string;
  headTeacherReviewedAt?: string;
  headTeacherReviewedBy?: string;

  // Official Report Signatories & Approving Authorities
  masterTeacherName?: string;
  masterTeacherPosition?: string; // e.g., "Master Teacher I / TLE Subject Coordinator"

  headTeacherName?: string;       // e.g., "Dr. Corazon V. Santos"
  headTeacherPosition?: string;   // e.g., "Head Teacher III / TLE Department"

  principalName?: string;         // e.g., "Dr. Maria Luisa T. Ramos"
  principalPosition?: string;     // e.g., "Secondary School Principal IV"
}

export interface AdminAuditLog {
  id: string;
  timestamp: string;
  adminEmail: string;
  action: string;
  targetUser?: string;
  details: string;
}

export interface NarrativeReportData {
  reportTitle: string;
  programTypeFilter: string;
  sectionFilter: string;
  startDate: string;
  endDate: string;
  totalStudents: number;
  totalSessions: number;
  initialAvgMastery: number;
  currentAvgMastery: number;
  masteredCount: number;
  progressingCount: number;
  needsSupportCount: number;
  introductionText: string;
  highlightsText: string;
  challengesText: string;
  recommendationsText: string;
  preparedBy: string;
  teacherTitle: string;
  headTeacherName: string;
  principalName: string;
}

// Utility function to calculate DepEd Mastery Level from percentage score
export function interpretMasteryLevel(scorePercentage: number): {
  level: string;
  badgeColor: string;
  description: string;
} {
  const score = Math.round(scorePercentage);
  if (score >= 96) {
    return {
      level: 'Mastered',
      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      description: 'Advanced / Full Mastery (96-100%)',
    };
  } else if (score >= 85) {
    return {
      level: 'Closely Approximating Mastery',
      badgeColor: 'bg-teal-100 text-teal-900 border-teal-300',
      description: 'Closely Approximating Mastery (85-95%)',
    };
  } else if (score >= 75) {
    return {
      level: 'Moving Towards Mastery',
      badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
      description: 'Moving Towards Mastery / Passed (75-84%)',
    };
  } else if (score >= 50) {
    return {
      level: 'Average Mastery',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
      description: 'Average Mastery / Progressing (50-74%)',
    };
  } else {
    return {
      level: 'Low Mastery',
      badgeColor: 'bg-rose-100 text-rose-900 border-rose-300',
      description: 'Low / Needs Remediation (0-49%)',
    };
  }
}
