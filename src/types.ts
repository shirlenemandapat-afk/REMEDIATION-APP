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
}

export interface TeacherProfile {
  email: string;
  passwordHash?: string;
  isPasswordSet: boolean;
  name: string;
  title: string; // e.g., "Teacher III" / "Master Teacher I"
  schoolName: string; // e.g., "Ramon Magsaysay (Cubao) High School"
  division: string;   // e.g., "SDO Quezon City"
  region: string;     // e.g., "NCR"
  academicYear: string; // e.g., "2025-2026"
  department?: string; // e.g., "Technology and Livelihood Education (TLE)"

  // Official Report Signatories & Approving Authorities
  masterTeacherName?: string;
  masterTeacherPosition?: string; // e.g., "Master Teacher I / TLE Subject Coordinator"

  headTeacherName?: string;       // e.g., "Dr. Corazon V. Santos"
  headTeacherPosition?: string;   // e.g., "Head Teacher III / TLE Department Head"

  principalName?: string;         // e.g., "Dr. Maria Luisa T. Ramos"
  principalPosition?: string;     // e.g., "Secondary School Principal IV"
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
