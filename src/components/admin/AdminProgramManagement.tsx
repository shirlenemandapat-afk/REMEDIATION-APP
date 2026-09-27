import React, { useState, useMemo } from 'react';
import {
  TeacherProfile,
  Student,
  SessionRecord,
  RemediationProgram,
  LEARNING_AREAS,
} from '../../types';
import { storage } from '../../services/storage';
import {
  BookOpen,
  Users,
  GraduationCap,
  Search,
  Filter,
  UserCheck,
  PlusCircle,
  Printer,
  ChevronDown,
  ChevronUp,
  FileCheck2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Layers,
  X,
  ExternalLink,
  ShieldCheck,
  Calendar,
  ClipboardList,
} from 'lucide-react';

export interface AdminProgramManagementProps {
  currentAdmin: TeacherProfile;
  programs: RemediationProgram[];
  teachers: TeacherProfile[];
  students: Student[];
  sessions?: SessionRecord[];
  onRefresh: () => void;
  onSelectStudent?: (student: Student) => void;
}

// Canonical DepEd TLE Curriculum Tracks and Subject Definitions
export interface DepEdSubjectMetadata {
  title: string;
  code: string;
  track: 'Information & Communications Technology (ICT)' | 'Home Economics (HE)' | 'Industrial Arts (IA)' | 'Exploratory & General TLE' | 'Academic & Special Subject';
  description: string;
  aliases: string[];
}

export const CANONICAL_DEPED_SUBJECTS: DepEdSubjectMetadata[] = [
  {
    title: 'ICT - Computer Systems Servicing',
    code: 'ICT-CSS',
    track: 'Information & Communications Technology (ICT)',
    description: 'Computer assembly, hardware troubleshooting, operating system installation, networking, and server deployment.',
    aliases: ['computer systems servicing', 'css', 'ict css', 'computer hardware servicing', 'chs', 'ict computer systems servicing', 'ict-css'],
  },
  {
    title: 'ICT - Computer Programming',
    code: 'ICT-PROG',
    track: 'Information & Communications Technology (ICT)',
    description: 'Computational thinking, algorithms, logic formulation, web application development, and software design.',
    aliases: ['computer programming', 'programming', 'ict programming', 'ict computer programming', 'coding', 'ict-prog'],
  },
  {
    title: 'ICT - Technical Drafting',
    code: 'ICT-TD',
    track: 'Information & Communications Technology (ICT)',
    description: 'Architectural blueprints, orthographic drawing, schematic diagrams, and computer-aided drafting (CAD).',
    aliases: ['technical drafting', 'drafting', 'ict drafting', 'cad', 'ict technical drafting', 'ict-td'],
  },
  {
    title: 'Cookery & Bread/Pastry',
    code: 'HE-COOK',
    track: 'Home Economics (HE)',
    description: 'Culinary preparation, kitchen sanitation, commercial baking, pastry production, and food service presentation.',
    aliases: ['cookery', 'bread and pastry', 'bpp', 'bread/pastry', 'culinary', 'commercial cookery'],
  },
  {
    title: 'Food Preservation & Processing',
    code: 'HE-FOOD',
    track: 'Home Economics (HE)',
    description: 'Food canning, sugar concentration, curing, fermentation, dehydration, and DepEd food safety compliance.',
    aliases: ['food preservation', 'food processing', 'preservation', 'food processing and preservation', 'food tech'],
  },
  {
    title: 'Garments & Pattern Drafting',
    code: 'HE-GARM',
    track: 'Home Economics (HE)',
    description: 'Pattern drafting, tailoring, industrial sewing machine operation, and garment construction techniques.',
    aliases: ['garments', 'dressmaking', 'pattern drafting', 'tailoring', 'sewing', 'garment construction'],
  },
  {
    title: 'Health and Wellness Caregiving',
    code: 'HE-CARE',
    track: 'Home Economics (HE)',
    description: 'Patient care, elderly and infant assistance, vital signs monitoring, hygiene, and wellness management.',
    aliases: ['caregiving', 'health care', 'health wellness caregiving', 'wellness', 'health and wellness'],
  },
  {
    title: 'Electronics and Electricity Servicing',
    code: 'IA-EES',
    track: 'Industrial Arts (IA)',
    description: 'Circuit testing, residential electrical wiring, electronic component repair, and electrical safety standards.',
    aliases: ['electronics', 'electricity', 'electrical installation', 'eim', 'epas', 'electronic products assembly', 'electronics and electricity'],
  },
  {
    title: 'Automotive & Small Engine Servicing',
    code: 'IA-AUTO',
    track: 'Industrial Arts (IA)',
    description: 'Automotive engine maintenance, small engine repair, vehicle inspection, and diagnostic tune-up.',
    aliases: ['automotive', 'small engine', 'motorcycle servicing', 'auto servicing'],
  },
  {
    title: 'General TLE / TVL Exploratory',
    code: 'TLE-EXP',
    track: 'Exploratory & General TLE',
    description: 'Foundational exploratory modules introducing Grade 7 and Grade 8 learners to various vocational competencies.',
    aliases: ['general tle', 'exploratory', 'tvl exploratory', 'tle exploratory', 'exploratory tle'],
  },
];

// Helper: Normalize strings for tolerant matching
const cleanString = (s: string): string => {
  return (s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
};

export const isSubjectMatching = (subject1: string, subject2: string): boolean => {
  if (!subject1 || !subject2) return false;
  const c1 = cleanString(subject1);
  const c2 = cleanString(subject2);
  if (c1 === c2) return true;

  // Check aliases from canonical list
  for (const item of CANONICAL_DEPED_SUBJECTS) {
    const canonicalClean = cleanString(item.title);
    const itemAliases = item.aliases.map(cleanString);

    const matchesItem1 = c1 === canonicalClean || itemAliases.includes(c1) || c1.includes(canonicalClean);
    const matchesItem2 = c2 === canonicalClean || itemAliases.includes(c2) || c2.includes(canonicalClean);

    if (matchesItem1 && matchesItem2) {
      return true;
    }
  }

  return c1.includes(c2) || c2.includes(c1);
};

const isEmailMatching = (e1?: string, e2?: string): boolean => {
  if (!e1 || !e2) return false;
  return e1.trim().toLowerCase() === e2.trim().toLowerCase();
};

export const isTeachingFaculty = (t?: TeacherProfile | null): boolean => {
  if (!t) return false;
  return !['admin', 'school_head', 'coordinator'].includes(t.role || '');
};

export const AdminProgramManagement: React.FC<AdminProgramManagementProps> = ({
  currentAdmin,
  programs,
  teachers,
  students,
  sessions = [],
  onRefresh,
  onSelectStudent,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [trackFilter, setTrackFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active_teachers' | 'has_students'>('all');
  const [expandedSubjectMap, setExpandedSubjectMap] = useState<Record<string, boolean>>({});

  // Modal State: Assign Teachers to Subject
  const [assignModalSubject, setAssignModalSubject] = useState<string | null>(null);
  const [selectedTeacherEmails, setSelectedTeacherEmails] = useState<string[]>([]);
  const [assignFeedback, setAssignFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal State: Add New Custom Subject
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const [newSubjectTitle, setNewSubjectTitle] = useState('');
  const [newSubjectTrack, setNewSubjectTrack] = useState<DepEdSubjectMetadata['track']>('Information & Communications Technology (ICT)');
  const [newSubjectDescription, setNewSubjectDescription] = useState('');

  // 1. Gather all unique subjects across canonical list, student records, teacher profiles, and programs
  const allSubjects = useMemo(() => {
    const map = new Map<string, { title: string; track: DepEdSubjectMetadata['track']; description: string }>();

    // Seed canonical list
    CANONICAL_DEPED_SUBJECTS.forEach((sub) => {
      map.set(sub.title, {
        title: sub.title,
        track: sub.track,
        description: sub.description,
      });
    });

    // Add subjects from LEARNING_AREAS if any missing
    LEARNING_AREAS.forEach((la) => {
      const exists = Array.from(map.keys()).some((key) => isSubjectMatching(key, la));
      if (!exists) {
        map.set(la, {
          title: la,
          track: la.startsWith('ICT')
            ? 'Information & Communications Technology (ICT)'
            : 'Exploratory & General TLE',
          description: `DepEd learning competency specialization in ${la}.`,
        });
      }
    });

    // Add subjects found in student records
    students.forEach((s) => {
      if (s.subject && s.subject.trim()) {
        const found = Array.from(map.keys()).find((k) => isSubjectMatching(k, s.subject));
        if (!found) {
          map.set(s.subject.trim(), {
            title: s.subject.trim(),
            track: 'Academic & Special Subject',
            description: `Remediation subject tracked under Project S.M.I.L.E.`,
          });
        }
      }
    });

    // Add subjects found in teacher assignedSubjects (only teaching faculty)
    teachers.forEach((t) => {
      if (!isTeachingFaculty(t)) return;
      (t.assignedSubjects || []).forEach((sub) => {
        if (sub && sub.trim()) {
          const found = Array.from(map.keys()).find((k) => isSubjectMatching(k, sub));
          if (!found) {
            map.set(sub.trim(), {
              title: sub.trim(),
              track: sub.startsWith('ICT')
                ? 'Information & Communications Technology (ICT)'
                : 'Exploratory & General TLE',
              description: `Faculty-handled remediation competency in ${sub}.`,
            });
          }
        }
      });
    });

    // Add subjects found in program records
    programs.forEach((p) => {
      const progSub = p.learningArea || p.title;
      if (progSub && progSub.trim()) {
        const found = Array.from(map.keys()).find((k) => isSubjectMatching(k, progSub));
        if (!found) {
          map.set(progSub.trim(), {
            title: progSub.trim(),
            track: 'Exploratory & General TLE',
            description: p.programObjectives || 'DepEd remedial program intervention.',
          });
        }
      }
    });

    return Array.from(map.values());
  }, [students, teachers, programs]);

  // 2. Compute the exact roster of conducting teachers and student loads per subject
  const subjectRosters = useMemo(() => {
    return allSubjects.map((subObj) => {
      const subTitle = subObj.title;

      // Find all students taking this subject
      const subjectStudents = students.filter((s) => isSubjectMatching(s.subject, subTitle));

      // Find all sessions logged for this subject
      const subjectSessions = sessions.filter((sess) => isSubjectMatching(sess.subject, subTitle));

      // Find all teachers conducting this subject (only teaching faculty; admin, school head, and coordinator are excluded):
      const conductingTeachers = teachers.filter((t) => {
        if (!isTeachingFaculty(t)) return false;
        const hasAssigned = (t.assignedSubjects || []).some((asSub) => isSubjectMatching(asSub, subTitle));
        const hasStudents = students.some((s) => isEmailMatching(s.teacherEmail, t.email) && isSubjectMatching(s.subject, subTitle));
        const hasProgram = programs.some(
          (p) =>
            (isSubjectMatching(p.learningArea || '', subTitle) || isSubjectMatching(p.title, subTitle)) &&
            (p.assignedTeacherEmails || []).some((pe) => isEmailMatching(pe, t.email))
        );
        const hasSessions = sessions.some((sess) => isEmailMatching(sess.teacherEmail, t.email) && isSubjectMatching(sess.subject, subTitle));

        return hasAssigned || hasStudents || hasProgram || hasSessions;
      });

      // Map teacher details with their specific student counts and session counts
      const teacherDetails = conductingTeachers.map((t) => {
        const teacherStudents = subjectStudents.filter((s) => isEmailMatching(s.teacherEmail, t.email));
        const teacherSessions = subjectSessions.filter((sess) => isEmailMatching(sess.teacherEmail, t.email));

        const needsRemediationCount = teacherStudents.filter((s) => s.status === 'Needs Remediation').length;
        const progressingCount = teacherStudents.filter((s) => s.status === 'Progressing').length;
        const masteredCount = teacherStudents.filter((s) => s.status === 'Mastered / Promoted').length;

        return {
          teacher: t,
          students: teacherStudents,
          studentCount: teacherStudents.length,
          sessionsCount: teacherSessions.length,
          needsRemediationCount,
          progressingCount,
          masteredCount,
        };
      });

      // Check if there are any students for this subject whose teacherEmail does not match any registered teacher
      const knownTeacherEmails = new Set(conductingTeachers.map((t) => t.email.trim().toLowerCase()));
      const unassignedStudents = subjectStudents.filter((s) => {
        const email = (s.teacherEmail || '').trim().toLowerCase();
        return !email || !knownTeacherEmails.has(email);
      });

      const totalStudentsCount = subjectStudents.length;
      const totalSessionsCount = subjectSessions.length;

      return {
        ...subObj,
        conductingTeachers: teacherDetails,
        unassignedStudents,
        totalTeachersCount: conductingTeachers.length,
        totalStudentsCount,
        totalSessionsCount,
      };
    }).filter((sub) => sub.totalTeachersCount > 0); // Only include subjects where teachers are actively conducting remediation
  }, [allSubjects, teachers, students, programs, sessions]);

  // 3. Filter subjects by search and track
  const filteredSubjectRosters = useMemo(() => {
    return subjectRosters.filter((item) => {
      // Track filter
      if (trackFilter !== 'all' && item.track !== trackFilter) {
        return false;
      }

      // Status filter
      if (statusFilter === 'has_students' && item.totalStudentsCount === 0) {
        return false;
      }

      // Search term filter
      if (searchTerm.trim()) {
        const q = cleanString(searchTerm);
        const matchesTitle = cleanString(item.title).includes(q);
        const matchesTrack = cleanString(item.track).includes(q);
        const matchesTeacher = item.conductingTeachers.some((ct) =>
          cleanString(ct.teacher.name).includes(q) || cleanString(ct.teacher.email).includes(q)
        );
        const matchesStudent = item.conductingTeachers.some((ct) =>
          ct.students.some((s) =>
            cleanString(`${s.firstName} ${s.lastName}`).includes(q) ||
            cleanString(s.section).includes(q)
          )
        );

        if (!matchesTitle && !matchesTrack && !matchesTeacher && !matchesStudent) {
          return false;
        }
      }

      return true;
    });
  }, [subjectRosters, trackFilter, statusFilter, searchTerm]);

  // Overall KPIs
  const totalRemediatedStudents = useMemo(() => students.length, [students]);
  const totalConductingTeachers = useMemo(() => {
    const teacherEmailSet = new Set<string>();
    subjectRosters.forEach((sr) => {
      sr.conductingTeachers.forEach((ct) => {
        if (ct.teacher.email) teacherEmailSet.add(ct.teacher.email.toLowerCase().trim());
      });
    });
    return teacherEmailSet.size;
  }, [subjectRosters]);

  const totalLoggedSessions = useMemo(() => sessions.length, [sessions]);

  // Toggle Accordion
  const toggleSubjectExpanded = (subjectTitle: string) => {
    setExpandedSubjectMap((prev) => ({
      ...prev,
      [subjectTitle]: !prev[subjectTitle],
    }));
  };

  // Open Assign Teachers Modal
  const openAssignModal = (subjectTitle: string) => {
    setAssignModalSubject(subjectTitle);
    setAssignFeedback(null);

    // Pre-check currently assigned teachers
    const foundRoster = subjectRosters.find((r) => r.title === subjectTitle);
    if (foundRoster) {
      setSelectedTeacherEmails(foundRoster.conductingTeachers.map((ct) => ct.teacher.email));
    } else {
      setSelectedTeacherEmails([]);
    }
  };

  // Toggle Teacher Checkbox in Modal
  const toggleTeacherInModal = (email: string) => {
    setSelectedTeacherEmails((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
  };

  // Save Teacher Assignments for Subject
  const handleSaveAssignments = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModalSubject) return;

    try {
      // Update assigned subjects only for eligible teaching faculty
      const teachingFaculty = teachers.filter(isTeachingFaculty);
      teachingFaculty.forEach((t) => {
        const isSelected = selectedTeacherEmails.includes(t.email);
        const currentSubjects = t.assignedSubjects || [];
        const hasSub = currentSubjects.some((s) => isSubjectMatching(s, assignModalSubject));

        let updatedSubjects: string[];
        if (isSelected && !hasSub) {
          // Add subject to teacher
          updatedSubjects = [...currentSubjects, assignModalSubject];
          storage.adminAssignTeacherSubjects(currentAdmin.email, t.email, updatedSubjects);
        } else if (!isSelected && hasSub) {
          // Remove subject from teacher
          updatedSubjects = currentSubjects.filter((s) => !isSubjectMatching(s, assignModalSubject));
          storage.adminAssignTeacherSubjects(currentAdmin.email, t.email, updatedSubjects);
        }
      });

      setAssignFeedback({
        type: 'success',
        message: `Faculty assignments for "${assignModalSubject}" have been updated successfully!`,
      });

      onRefresh();
      setTimeout(() => {
        setAssignModalSubject(null);
        setAssignFeedback(null);
      }, 1200);
    } catch (err) {
      setAssignFeedback({
        type: 'error',
        message: 'Failed to update teacher assignments. Please try again.',
      });
    }
  };

  // Handle Add Custom Subject
  const handleAddCustomSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectTitle.trim()) return;

    // Create a program record to permanently persist this subject in storage
    storage.createProgram(currentAdmin.email, {
      title: newSubjectTitle.trim(),
      learningArea: newSubjectTitle.trim(),
      targetGradeLevel: 'All Grade Levels',
      programObjectives: newSubjectDescription.trim() || `Remediation program for ${newSubjectTitle.trim()}`,
      assignedTeacherEmails: [],
      assignedTeacherNames: [],
      scheduleDescription: 'To be scheduled by assigned teacher',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'Active',
      maxStudents: 30,
    });

    onRefresh();
    setIsAddSubjectOpen(false);
    setNewSubjectTitle('');
    setNewSubjectDescription('');
  };

  return (
    <div className="space-y-6">
      {/* Printable Report View (Visible only when window.print() is triggered) */}
      <div className="hidden print:block print:p-6 bg-white text-slate-900">
        <div className="text-center pb-4 border-b-2 border-slate-900 mb-6">
          <p className="text-xs uppercase font-serif tracking-widest text-slate-700">Republic of the Philippines • Department of Education</p>
          <p className="text-xs font-serif font-bold text-slate-800">National Capital Region • Schools Division Office - Quezon City</p>
          <h1 className="text-lg font-black uppercase font-serif mt-1">Ramon Magsaysay (Cubao) High School</h1>
          <p className="text-xs font-semibold text-emerald-950 mt-0.5">Technology and Livelihood Education (TLE) Department</p>
          <h2 className="text-sm font-black uppercase mt-3 py-1 bg-slate-100 border border-slate-300">
            Project S.M.I.L.E. - Official Remediation Subjects & Faculty Roster
          </h2>
          <p className="text-[10px] text-slate-600 mt-1">
            Academic Year 2025-2026 • Generated on {new Date().toLocaleDateString('en-US', { dateStyle: 'full' })}
          </p>
        </div>

        <table className="w-full text-left text-xs border border-slate-300 border-collapse">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-300 text-[10px] uppercase font-bold text-slate-700">
              <th className="p-2 border-r border-slate-300 w-12 text-center">No.</th>
              <th className="p-2 border-r border-slate-300">Remediation Subject</th>
              <th className="p-2 border-r border-slate-300">Curriculum Track</th>
              <th className="p-2 border-r border-slate-300">Conducting Teacher(s)</th>
              <th className="p-2 border-r border-slate-300 text-center">No. of Remediated Students</th>
              <th className="p-2 text-center">Sessions Logged</th>
            </tr>
          </thead>
          <tbody>
            {subjectRosters.map((sub, idx) => (
              <tr key={sub.title} className="border-b border-slate-200">
                <td className="p-2 border-r border-slate-200 text-center font-mono text-[11px]">{idx + 1}</td>
                <td className="p-2 border-r border-slate-200 font-bold text-slate-900">{sub.title}</td>
                <td className="p-2 border-r border-slate-200 text-[11px] text-slate-700">{sub.track}</td>
                <td className="p-2 border-r border-slate-200 text-[11px]">
                  {sub.conductingTeachers.length > 0 ? (
                    sub.conductingTeachers.map((ct) => (
                      <div key={ct.teacher.email} className="py-0.5">
                        <span className="font-semibold">{ct.teacher.name}</span>{' '}
                        <span className="text-[10px] text-slate-500">({ct.teacher.title || 'Teacher'})</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-slate-400 italic">None assigned</span>
                  )}
                </td>
                <td className="p-2 border-r border-slate-200 text-center font-bold text-emerald-900">
                  {sub.totalStudentsCount}
                </td>
                <td className="p-2 text-center font-bold text-slate-800">{sub.totalSessionsCount}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="grid grid-cols-3 gap-6 mt-12 text-center text-xs">
          <div>
            <p className="border-b border-slate-800 pb-1 font-bold text-slate-900">SHIRLENE M. MANDAPAT</p>
            <p className="text-[10px] text-slate-600 mt-1">Master Teacher I / Remediation Coordinator</p>
          </div>
          <div>
            <p className="border-b border-slate-800 pb-1 font-bold text-slate-900">DR. CORAZON V. SANTOS</p>
            <p className="text-[10px] text-slate-600 mt-1">Head Teacher III / TLE Department</p>
          </div>
          <div>
            <p className="border-b border-slate-800 pb-1 font-bold text-slate-900">DR. MARIA LUISA T. RAMOS</p>
            <p className="text-[10px] text-slate-600 mt-1">Secondary School Principal IV</p>
          </div>
        </div>
      </div>

      {/* Screen Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-lg border border-emerald-700/60 relative overflow-hidden print:hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="px-3 py-1 rounded-full bg-amber-400 text-emerald-950 font-black text-xs uppercase tracking-wider shadow-xs flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-emerald-950" />
                PROJECT S.M.I.L.E. REMEDIATION SUBJECTS
              </span>
              <span className="text-xs text-amber-200 font-semibold">
                DepEd TLE Learning Area Distribution
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white font-serif tracking-tight">
              Remediation Subjects & Conducting Teachers Roster
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl mt-1">
              Directory of active remediation subjects (e.g., <strong>ICT - Computer Systems Servicing</strong>),
              designated conducting teachers, and enrolled remediated students.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2.5 bg-white hover:bg-slate-100 text-emerald-950 font-black rounded-xl text-xs transition flex items-center gap-2 shadow-sm border border-slate-200 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-emerald-700" />
              PRINT DOSSIER
            </button>
            <button
              type="button"
              onClick={() => setIsAddSubjectOpen(true)}
              className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black rounded-xl text-xs transition flex items-center gap-2 shadow-md border border-amber-300 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-emerald-950" />
              ADD CUSTOM SUBJECT
            </button>
          </div>
        </div>

        {/* Live KPI Metric Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-emerald-700/60">
          <div className="bg-emerald-950/50 p-3 rounded-2xl border border-emerald-700/50">
            <p className="text-[10px] font-bold uppercase text-emerald-300 tracking-wider">Active Remediation Subjects</p>
            <p className="text-xl font-black text-white mt-0.5">{subjectRosters.length}</p>
            <p className="text-[10px] text-emerald-200/80">With Assigned Teachers</p>
          </div>
          <div className="bg-emerald-950/50 p-3 rounded-2xl border border-emerald-700/50">
            <p className="text-[10px] font-bold uppercase text-emerald-300 tracking-wider">Conducting Teachers</p>
            <p className="text-xl font-black text-yellow-300 mt-0.5">{totalConductingTeachers}</p>
            <p className="text-[10px] text-emerald-200/80">Active Faculty Members</p>
          </div>
          <div className="bg-emerald-950/50 p-3 rounded-2xl border border-emerald-700/50">
            <p className="text-[10px] font-bold uppercase text-emerald-300 tracking-wider">Remediated Students</p>
            <p className="text-xl font-black text-amber-300 mt-0.5">{totalRemediatedStudents}</p>
            <p className="text-[10px] text-emerald-200/80">Enrolled Learners</p>
          </div>
          <div className="bg-emerald-950/50 p-3 rounded-2xl border border-emerald-700/50">
            <p className="text-[10px] font-bold uppercase text-emerald-300 tracking-wider">Sessions Logged</p>
            <p className="text-xl font-black text-white mt-0.5">{totalLoggedSessions}</p>
            <p className="text-[10px] text-emerald-200/80">Anecdotal Daily Records</p>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by subject (e.g. ICT - Computer Systems Servicing), teacher name, or student..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Track Filter */}
          <select
            value={trackFilter}
            onChange={(e) => setTrackFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="all">All Tracks & Strands</option>
            <option value="Information & Communications Technology (ICT)">ICT Track</option>
            <option value="Home Economics (HE)">Home Economics (HE)</option>
            <option value="Industrial Arts (IA)">Industrial Arts (IA)</option>
            <option value="Exploratory & General TLE">Exploratory & General</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="all">All Active Remediation Subjects</option>
            <option value="has_students">With Enrolled Students</option>
          </select>

          {(searchTerm || trackFilter !== 'all' || statusFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setTrackFilter('all');
                setStatusFilter('all');
              }}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Content: List of Subjects with Teachers & Students Count */}
      <div className="space-y-4 print:hidden">
        {filteredSubjectRosters.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">No Remediation Subjects Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              No active subjects match the search query or filter. Only subjects with assigned conducting teachers are displayed.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setTrackFilter('all');
                setStatusFilter('all');
              }}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Show All Remediation Subjects
            </button>
          </div>
        ) : (
          filteredSubjectRosters.map((subject) => {
            const isExpanded = expandedSubjectMap[subject.title] ?? true; // Default open for immediate clarity
            const hasConductingTeachers = subject.conductingTeachers.length > 0;
            const hasStudents = subject.totalStudentsCount > 0;

            return (
              <div
                key={subject.title}
                className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden transition hover:border-emerald-300"
              >
                {/* Subject Header Card */}
                <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-50 via-white to-emerald-50/40 border-b border-slate-200/80">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-200">
                          {subject.track}
                        </span>
                        {subject.totalTeachersCount > 0 ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-900 border border-blue-200">
                            {subject.totalTeachersCount} Conducting Teacher{subject.totalTeachersCount === 1 ? '' : 's'}
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                            No Faculty Assigned
                          </span>
                        )}
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200">
                          {subject.totalStudentsCount} Remediated Student{subject.totalStudentsCount === 1 ? '' : 's'}
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2 tracking-tight">
                        <BookOpen className="w-5 h-5 text-emerald-700 shrink-0" />
                        <span>{subject.title}</span>
                      </h3>

                      <p className="text-xs text-slate-500 leading-relaxed max-w-3xl">
                        {subject.description}
                      </p>
                    </div>

                    {/* Quick Subject Actions */}
                    <div className="flex items-center gap-2 self-start lg:self-center">
                      <button
                        type="button"
                        onClick={() => openAssignModal(subject.title)}
                        className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Assign Teachers</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleSubjectExpanded(subject.title)}
                        className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                        title={isExpanded ? 'Collapse Details' : 'Expand Details'}
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-4 h-4 text-slate-500" />
                            <span className="hidden sm:inline">Hide</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4 text-slate-500" />
                            <span className="hidden sm:inline">View Details</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Collapsible Body: Teachers List and Enrolled Students Count */}
                {isExpanded && (
                  <div className="p-5 sm:p-6 space-y-5 bg-white">
                    {/* Header Label */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-emerald-700" />
                        Conducting Faculty for this Remediation Subject:
                      </h4>
                      <span className="text-[11px] font-semibold text-slate-500">
                        Total Enrolled Learners: <strong className="text-emerald-800">{subject.totalStudentsCount}</strong>
                      </span>
                    </div>

                    {!hasConductingTeachers ? (
                      <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0">
                            <AlertCircle className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs font-extrabold text-amber-950">
                              No teacher currently assigned for {subject.title}
                            </p>
                            <p className="text-[11px] text-amber-800">
                              Click &quot;Assign Teachers&quot; to designate faculty members who will conduct remediation sessions for this subject.
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => openAssignModal(subject.title)}
                          className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-black rounded-xl text-xs transition cursor-pointer shadow-xs shrink-0"
                        >
                          + Assign Teachers
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {subject.conductingTeachers.map((ct) => {
                          const teacher = ct.teacher;
                          const count = ct.studentCount;
                          const hasTeacherStudents = count > 0;

                          return (
                            <div
                              key={teacher.email}
                              className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5 hover:bg-slate-50 transition space-y-4"
                            >
                              {/* Teacher Info Row */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-3.5">
                                  <div className="w-10 h-10 rounded-2xl bg-emerald-800 text-white font-black flex items-center justify-center text-sm shadow-xs border border-emerald-900 shrink-0">
                                    {teacher.name.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h5 className="text-sm font-black text-slate-900">
                                        {teacher.name}
                                      </h5>
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                                        {teacher.title || teacher.role || 'Faculty Member'}
                                      </span>
                                    </div>
                                    <p className="text-xs text-slate-500 font-mono">
                                      {teacher.email}
                                    </p>
                                  </div>
                                </div>

                                {/* Number of Students Remediated - Prominent Badge */}
                                <div className="flex items-center gap-2.5 sm:self-center">
                                  <div className="text-right">
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-xs shadow-2xs border bg-emerald-100 text-emerald-950 border-emerald-300">
                                      <GraduationCap className="w-4 h-4 text-emerald-800" />
                                      <span>
                                        {count} Remediated Student{count === 1 ? '' : 's'}
                                      </span>
                                    </div>
                                    {ct.sessionsCount > 0 && (
                                      <p className="text-[10px] text-slate-500 mt-0.5">
                                        {ct.sessionsCount} Remediation Session{ct.sessionsCount === 1 ? '' : 's'} Conducted
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Student Status Summary Pills for this Teacher */}
                              {hasTeacherStudents && (
                                <div className="flex items-center gap-2 flex-wrap text-[11px] pt-2 border-t border-slate-200/80">
                                  <span className="text-slate-500 font-semibold">Diagnostic Breakdown:</span>
                                  {ct.needsRemediationCount > 0 && (
                                    <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-bold">
                                      {ct.needsRemediationCount} Needs Remediation
                                    </span>
                                  )}
                                  {ct.progressingCount > 0 && (
                                    <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                                      {ct.progressingCount} Progressing
                                    </span>
                                  )}
                                  {ct.masteredCount > 0 && (
                                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                                      {ct.masteredCount} Mastered / Promoted
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Remediated Students List / Table */}
                              {hasTeacherStudents ? (
                                <div className="mt-3 bg-white rounded-xl border border-slate-200 overflow-hidden">
                                  <div className="bg-slate-100/80 px-4 py-2 text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between border-b border-slate-200">
                                    <span>Enrolled Remediated Students Roster ({count})</span>
                                    <span className="text-slate-500">Subject: {subject.title}</span>
                                  </div>
                                  <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
                                    {ct.students.map((st) => (
                                      <div
                                        key={st.id}
                                        className="p-3 hover:bg-emerald-50/40 transition flex items-center justify-between gap-3 text-xs"
                                      >
                                        <div className="flex items-center gap-2.5">
                                          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-900 font-bold text-xs flex items-center justify-center shrink-0">
                                            {st.firstName.charAt(0)}
                                          </div>
                                          <div>
                                            <p className="font-extrabold text-slate-900">
                                              {st.lastName}, {st.firstName} {st.middleInitial ? `${st.middleInitial}.` : ''}
                                            </p>
                                            <p className="text-[10px] text-slate-500">
                                              {st.gradeLevel} • Section {st.section} • Enrolled: {st.enrolledDate || 'N/A'}
                                            </p>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-3 shrink-0">
                                          <div className="text-right">
                                            <span
                                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                                st.status === 'Needs Remediation'
                                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                                  : st.status === 'Progressing'
                                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                              }`}
                                            >
                                              {st.status}
                                            </span>
                                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                                              Diagnostic: {st.baselineScore}%
                                            </p>
                                          </div>

                                          {onSelectStudent && (
                                            <button
                                              type="button"
                                              onClick={() => onSelectStudent(st)}
                                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-900 transition cursor-pointer"
                                              title="View Student Progress File"
                                            >
                                              <ExternalLink className="w-3.5 h-3.5" />
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <div className="p-3 bg-white rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                                  Teacher is assigned to conduct remediation for this subject with no active student enrollments currently.
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Unassigned Students Section if any exist */}
                    {subject.unassignedStudents.length > 0 && (
                      <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                            <AlertCircle className="w-4 h-4 text-amber-700" />
                            Other Enrolled Students in {subject.title} ({subject.unassignedStudents.length}):
                          </h5>
                          <span className="text-[10px] text-amber-800 font-bold">Unassigned Faculty / Direct Enrollment</span>
                        </div>
                        <div className="divide-y divide-amber-200/60 bg-white rounded-xl border border-amber-200 max-h-40 overflow-y-auto">
                          {subject.unassignedStudents.map((st) => (
                            <div key={st.id} className="p-2.5 flex items-center justify-between text-xs">
                              <div>
                                <span className="font-bold text-slate-800">{st.lastName}, {st.firstName}</span>
                                <span className="text-slate-500 ml-2">({st.gradeLevel} - {st.section})</span>
                              </div>
                              <span className="text-[10px] font-mono text-slate-500">
                                Teacher Email: {st.teacherEmail || 'None'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* --- MODAL: ASSIGN TEACHERS TO SUBJECT --- */}
      {assignModalSubject && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-emerald-700" />
                  Assign Faculty to Remediation Subject
                </h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  Subject: <span className="text-emerald-950 font-bold">{assignModalSubject}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAssignModalSubject(null)}
                className="p-1 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAssignments} className="space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Select teachers assigned to conduct remediation sessions for <strong>{assignModalSubject}</strong>.
                Selected teachers will be authorized to log session records and manage student remedial progress.
              </p>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-700">List of Teaching Faculty:</label>
                  <span className="text-[10px] text-slate-400 italic">
                    Excludes admin, school head & coordinator
                  </span>
                </div>
                <div className="space-y-1.5 max-h-60 overflow-y-auto p-2 bg-slate-50 rounded-2xl border border-slate-200">
                  {teachers.filter(isTeachingFaculty).map((t) => {
                    const isChecked = selectedTeacherEmails.includes(t.email);
                    return (
                      <label
                        key={t.email}
                        onClick={() => toggleTeacherInModal(t.email)}
                        className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition border ${
                          isChecked
                            ? 'bg-emerald-100/80 border-emerald-300 text-emerald-950 font-bold shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="rounded text-emerald-600 focus:ring-emerald-500 pointer-events-none w-4 h-4"
                          />
                          <div>
                            <p className="text-xs font-bold leading-none">{t.name}</p>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">{t.email}</p>
                          </div>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-600 font-semibold">
                          {t.title || 'Teacher'}
                        </span>
                      </label>
                    );
                  })}
                  {teachers.filter(isTeachingFaculty).length === 0 && (
                    <div className="p-4 text-center text-xs text-slate-400">
                      No teaching faculty registered yet. Add a faculty account under User Management to assign subjects.
                    </div>
                  )}
                </div>
              </div>

              {assignFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                    assignFeedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {assignFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{assignFeedback.message}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAssignModalSubject(null)}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-black rounded-xl transition shadow-md cursor-pointer flex items-center gap-2"
                >
                  <UserCheck className="w-4 h-4" />
                  Save Faculty Assignments
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: ADD CUSTOM REMEDIATION SUBJECT --- */}
      {isAddSubjectOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-700" />
                Add New Remediation Subject
              </h3>
              <button
                type="button"
                onClick={() => setIsAddSubjectOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomSubject} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Subject Name / Title *</label>
                <input
                  type="text"
                  required
                  value={newSubjectTitle}
                  onChange={(e) => setNewSubjectTitle(e.target.value)}
                  placeholder="e.g. ICT - Computer Systems Servicing, Robotics, or Food Preservation"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Curriculum Track / Area *</label>
                <select
                  value={newSubjectTrack}
                  onChange={(e) => setNewSubjectTrack(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                >
                  <option value="Information & Communications Technology (ICT)">Information & Communications Technology (ICT)</option>
                  <option value="Home Economics (HE)">Home Economics (HE)</option>
                  <option value="Industrial Arts (IA)">Industrial Arts (IA)</option>
                  <option value="Exploratory & General TLE">Exploratory & General TLE</option>
                  <option value="Academic & Special Subject">Academic & Special Subject</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Subject Description & Objectives</label>
                <textarea
                  rows={3}
                  value={newSubjectDescription}
                  onChange={(e) => setNewSubjectDescription(e.target.value)}
                  placeholder="Brief summary of target remediation competencies, modules, and diagnostic goals..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddSubjectOpen(false)}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-black rounded-xl transition shadow-md cursor-pointer flex items-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  Save Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
