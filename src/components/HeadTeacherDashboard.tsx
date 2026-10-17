import React, { useState, useEffect, useMemo } from 'react';
import {
  TeacherProfile,
  Student,
  SessionRecord,
  MOVAttachment,
  getRoleDefinition,
} from '../types';
import { storage } from '../services/storage';
import { NarrativeReportGenerator } from './NarrativeReportGenerator';
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  Image as ImageIcon,
  FileCheck2,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Award,
  Eye,
  X,
  Download,
  RefreshCw,
  ShieldCheck,
  MessageSquare,
  CheckSquare,
  FileText,
  GraduationCap,
  TrendingUp,
  ChevronRight,
  Sparkles,
  BookOpen,
  UserCheck,
  Printer,
  Filter,
  Settings,
  Plus,
  Check,
  Tag,
} from 'lucide-react';

export type HeadTeacherTab =
  | 'overview'
  | 'teachers'
  | 'logs'
  | 'movs'
  | 'reports';

interface HeadTeacherDashboardProps {
  headTeacher: TeacherProfile;
  students: Student[];
  sessions: SessionRecord[];
  onRefreshData: () => void;
  onSelectStudent?: (student: Student) => void;
  onViewMOV?: (url: string, title: string) => void;
  onShowToast?: (message: string, type?: 'success' | 'info' | 'warning') => void;
}

interface FlattenedMOVItem {
  mov: MOVAttachment;
  session: SessionRecord;
  student?: Student;
  teacher?: TeacherProfile;
  teacherName: string;
  teacherEmail: string;
  isAssessmentTool: boolean;
}

const SUPERVISORY_LOG_TEMPLATES = [
  'Intervention strategy is well-aligned with the target competency. Continue monitoring learner retention.',
  'Commendable mastery gain! Learner is ready for post-remediation summative evaluation.',
  'Good scaffolding approach. Please ensure a checked Learning Activity Sheet (LAS) or photo MOV is attached.',
  'Recommend pairing this learner with peer tutoring or simplified hands-on lab drills in the next session.',
];

const MOV_EVALUATION_TEMPLATES = [
  'Authentic and clear MOV evidence demonstrating hands-on learner participation and output.',
  'Checked Learning Activity Sheet (LAS) clearly shows learner score progression and teacher feedback.',
  'Please provide a clearer photo or more descriptive caption indicating the specific competency assessed.',
];

const PRESET_SPECIALIZATION_AREAS = [
  'TLE',
  'ICT - Computer Systems Servicing',
  'ICT - Computer Programming',
  'ICT - Technical Drafting',
  'ICT - Illustration & Animation',
  'TLE - Home Economics (Cookery / Bread & Pastry)',
  'TLE - Industrial Arts (Electrical / Shielded Metal Arc)',
  'TLE - Agri-Fishery Arts (Food Processing)',
  'Mathematics',
  'Science',
  'English',
  'Filipino',
  'Araling Panlipunan',
  'MAPEH',
  'Edukasyon sa Pagpapakatao (EsP)',
];

export const HeadTeacherDashboard: React.FC<HeadTeacherDashboardProps> = ({
  headTeacher,
  students,
  sessions,
  onRefreshData,
  onSelectStudent,
  onViewMOV,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<HeadTeacherTab>('overview');
  const [teachers, setTeachers] = useState<TeacherProfile[]>(() => storage.getAllTeachers());
  const [liveStudents, setLiveStudents] = useState<Student[]>(() => storage.getAllStudents());
  const [liveSessions, setLiveSessions] = useState<SessionRecord[]>(() => storage.getAllSessions());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // --- Tab 2: Supervise Department Teachers Filters & Modal ---
  const [teacherSearch, setTeacherSearch] = useState<string>('');
  const [teacherStatusFilter, setTeacherStatusFilter] = useState<string>('all');
  const [teacherActivityFilter, setTeacherActivityFilter] = useState<string>('all');
  const [inspectingTeacher, setInspectingTeacher] = useState<TeacherProfile | null>(null);
  const [reviewTeacherStatus, setReviewTeacherStatus] = useState<'Submitted' | 'Pending' | 'Needs Revision' | 'Draft'>('Submitted');
  const [reviewTeacherFeedback, setReviewTeacherFeedback] = useState<string>('');
  const [isSavingTeacherReview, setIsSavingTeacherReview] = useState<boolean>(false);

  // --- Tab 3: Review Remediation Logs Filters & Modal ---
  const [logTeacherFilter, setLogTeacherFilter] = useState<string>('all');
  const [logProgramFilter, setLogProgramFilter] = useState<string>('all');
  const [logSectionFilter, setLogSectionFilter] = useState<string>('all');
  const [logSupervisoryFilter, setLogSupervisoryFilter] = useState<string>('all');
  const [logSearch, setLogSearch] = useState<string>('');
  const [reviewingSession, setReviewingSession] = useState<SessionRecord | null>(null);
  const [sessionVerdict, setSessionVerdict] = useState<'Pending Review' | 'Verified' | 'Exemplary' | 'Needs Follow-up'>('Verified');
  const [sessionRemarks, setSessionRemarks] = useState<string>('');
  const [isSavingSessionReview, setIsSavingSessionReview] = useState<boolean>(false);

  // --- Tab 4: Evaluate Session MOVs Filters & Modal ---
  const [movTeacherFilter, setMovTeacherFilter] = useState<string>('all');
  const [movStatusFilter, setMovStatusFilter] = useState<string>('all');
  const [movTypeFilter, setMovTypeFilter] = useState<string>('all');
  const [movSearch, setMovSearch] = useState<string>('');
  const [showMissingMovSessionsOnly, setShowMissingMovSessionsOnly] = useState<boolean>(false);
  const [evaluatingMovItem, setEvaluatingMovItem] = useState<FlattenedMOVItem | null>(null);
  const [movEvalStatus, setMovEvalStatus] = useState<'Pending' | 'Verified' | 'Exemplary' | 'Needs Revision'>('Verified');
  const [movEvalNotes, setMovEvalNotes] = useState<string>('');
  const [movRubric, setMovRubric] = useState({
    alignedWithCompetency: true,
    authenticLearnerOutput: true,
    clearDocumentation: true,
  });
  const [isSavingMovEval, setIsSavingMovEval] = useState<boolean>(false);

  // --- Tab 5: Generate Narrative Reports Scope ---
  const [reportScopeEmail, setReportScopeEmail] = useState<string>('ALL_DEPARTMENT');

  // --- Subject / Specialization Supervision Filter & Configuration Modals ---
  const [selectedSpecializationFilter, setSelectedSpecializationFilter] = useState<string>('ALL');
  const [showUnassignedFacultyPanel, setShowUnassignedFacultyPanel] = useState<boolean>(false);

  // Modal: Configure Head Teacher's own Subject / Specialization
  const [isConfigSpecOpen, setIsConfigSpecOpen] = useState<boolean>(false);
  const [htSpecList, setHtSpecList] = useState<string[]>([]);
  const [htCustomSpecInput, setHtCustomSpecInput] = useState<string>('');
  const [isSavingHtSpec, setIsSavingHtSpec] = useState<boolean>(false);

  // Modal: Assign / Edit a Teacher's Subject / Specialization
  const [assigningTeacherSpec, setAssigningTeacherSpec] = useState<TeacherProfile | null>(null);
  const [teacherSpecList, setTeacherSpecList] = useState<string[]>([]);
  const [teacherCustomSpecInput, setTeacherCustomSpecInput] = useState<string>('');
  const [isSavingTeacherSpec, setIsSavingTeacherSpec] = useState<boolean>(false);

  useEffect(() => {
    setLiveStudents(storage.getAllStudents());
  }, [students]);

  useEffect(() => {
    setLiveSessions(storage.getAllSessions());
  }, [sessions]);

  const handleSyncAll = async () => {
    setIsSyncing(true);
    try {
      await storage.syncFromServer(headTeacher.email || 'melani.santos@deped.gov.ph');
      try {
        const res = await fetch('/api/sync/all');
        if (res.ok) {
          const json = await res.json();
          if (json && json.success && json.data) {
            if (Array.isArray(json.data.students)) {
              storage.overwriteStudents(json.data.students);
            }
            if (Array.isArray(json.data.sessions)) {
              storage.overwriteSessions(json.data.sessions);
            }
          }
        }
      } catch {}

      const freshTeachers = await storage.fetchAllTeachersFromServer();
      setTeachers(freshTeachers);
      setLiveStudents(storage.getAllStudents());
      setLiveSessions(storage.getAllSessions());
      onRefreshData();
    } catch (e) {
      console.warn('Head Teacher sync notice:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    handleSyncAll();
    const interval = setInterval(handleSyncAll, 8000);
    const handleImmediate = () => {
      setLiveStudents(storage.getAllStudents());
      setLiveSessions(storage.getAllSessions());
      setTeachers(storage.getAllTeachers());
    };
    window.addEventListener('storage', handleImmediate);
    window.addEventListener('deped-data-synced', handleImmediate);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleImmediate);
      window.removeEventListener('deped-data-synced', handleImmediate);
    };
  }, []);

  // Compute Subject / Specialization Supervision Scope strictly from Head Teacher's assigned specializations
  const supervisionScope = useMemo(() => {
    return storage.getHeadTeacherSupervisedData(
      headTeacher,
      teachers,
      liveStudents,
      liveSessions
    );
  }, [headTeacher, teachers, liveStudents, liveSessions]);

  const headTeacherSpecializations = useMemo(
    () =>
      Array.isArray(supervisionScope.headTeacherSpecializations)
        ? supervisionScope.headTeacherSpecializations
        : Array.isArray(supervisionScope.specializations)
        ? supervisionScope.specializations
        : ['TLE'],
    [supervisionScope]
  );

  // Filter supervised teachers, students, and sessions by the active specialization pill (or ALL of Head Teacher's specializations)
  const departmentTeachers = useMemo(() => {
    const baseSupervised = Array.isArray(supervisionScope.supervisedTeachers)
      ? supervisionScope.supervisedTeachers
      : [];
    if (selectedSpecializationFilter === 'ALL') {
      return baseSupervised;
    }
    return baseSupervised.filter((t) => {
      const tEmailNorm = (t.email || '').toLowerCase().trim();
      const tStudents = (supervisionScope.supervisedStudents || []).filter(
        (s) => (s.teacherEmail || (s as any).teacher_email || '').toLowerCase().trim() === tEmailNorm
      );
      const tSessions = (supervisionScope.supervisedSessions || []).filter(
        (s) => (s.teacherEmail || (s as any).teacher_email || '').toLowerCase().trim() === tEmailNorm
      );
      const specs = storage.getTeacherEffectiveSpecializations(t, tStudents, tSessions);
      return (specs || []).some((sp) =>
        storage.doSpecializationsMatch(selectedSpecializationFilter, sp)
      );
    });
  }, [supervisionScope, selectedSpecializationFilter]);

  const monitoredTeacherEmailSet = useMemo(
    () => new Set(departmentTeachers.map((t) => (t.email || '').toLowerCase().trim())),
    [departmentTeachers]
  );

  // Students strictly under the Head Teacher's monitored teachers & Subject / Specialization
  const monitoredStudents = useMemo(() => {
    return supervisionScope.supervisedStudents.filter((s) => {
      const sEmail = (s.teacherEmail || (s as any).teacher_email || '').toLowerCase().trim();
      if (!monitoredTeacherEmailSet.has(sEmail)) return false;
      if (selectedSpecializationFilter === 'ALL') return true;
      return !s.subject || storage.doSpecializationsMatch(selectedSpecializationFilter, s.subject);
    });
  }, [supervisionScope.supervisedStudents, monitoredTeacherEmailSet, selectedSpecializationFilter]);

  // Sessions strictly under the Head Teacher's monitored teachers & Subject / Specialization
  const monitoredSessions = useMemo(() => {
    const validStudentIds = new Set(monitoredStudents.map((s) => String(s.id)));
    return supervisionScope.supervisedSessions.filter((sess) => {
      const sEmail = (sess.teacherEmail || (sess as any).teacher_email || '').toLowerCase().trim();
      const belongsToTeacherOrStudent =
        monitoredTeacherEmailSet.has(sEmail) || validStudentIds.has(String(sess.studentId));
      if (!belongsToTeacherOrStudent) return false;
      if (selectedSpecializationFilter === 'ALL') return true;
      return !sess.subject || storage.doSpecializationsMatch(selectedSpecializationFilter, sess.subject);
    });
  }, [
    supervisionScope.supervisedSessions,
    monitoredStudents,
    monitoredTeacherEmailSet,
    selectedSpecializationFilter,
  ]);

  // Compute detailed metrics per monitored teacher under the Head Teacher's Subject / Specialization
  const teacherSupervisionStats = useMemo(() => {
    return departmentTeachers.map((t) => {
      const tEmailNorm = (t.email || '').toLowerCase().trim();
      const tStudents = monitoredStudents.filter(
        (s) => (s.teacherEmail || (s as any).teacher_email || '').toLowerCase().trim() === tEmailNorm
      );
      const activeStudents = tStudents.filter((s) => !s.isArchived);
      const archivedStudents = tStudents.filter((s) => s.isArchived);

      const tStudentIds = new Set(tStudents.map((s) => String(s.id)));
      const tSessions = monitoredSessions.filter((sess) => {
        const sEmail = (sess.teacherEmail || (sess as any).teacher_email || '').toLowerCase().trim();
        return sEmail === tEmailNorm || tStudentIds.has(String(sess.studentId));
      });

      const movCount = tSessions.reduce((acc, s) => {
        const regularMovs = Array.isArray(s.movs) ? s.movs.length : 0;
        const toolCount =
          s.assessmentTool && (!Array.isArray(s.movs) || !s.movs.some((m) => m.id === s.assessmentTool?.id)) ? 1 : 0;
        return acc + regularMovs + toolCount;
      }, 0);

      const verifiedSessionsCount = tSessions.filter(
        (s) => s.supervisoryStatus === 'Verified' || s.supervisoryStatus === 'Exemplary'
      ).length;

      const avgBaseline =
        activeStudents.length > 0
          ? Math.round(activeStudents.reduce((sum, s) => sum + (s.baselineScore || 0), 0) / activeStudents.length)
          : 0;

      const avgSessionScore =
        tSessions.length > 0
          ? Math.round(tSessions.reduce((sum, s) => sum + (s.score || 0), 0) / tSessions.length)
          : avgBaseline;

      const masteryGain = activeStudents.length > 0 && tSessions.length > 0 ? avgSessionScore - avgBaseline : 0;

      // Derive subjects / specializations handled from teacher profile + enrolled students + sessions
      const derivedSubjects = Array.from(
        new Set([
          ...(t.assignedSubjects || []),
          ...(t.specialization ? [t.specialization] : []),
          ...tStudents.map((s) => s.subject).filter(Boolean),
          ...tSessions.map((s) => s.subject).filter(Boolean),
        ])
      );

      // Identify which specific Head Teacher specializations matched this teacher
      const matchedSpecializations = derivedSubjects.filter((sub) =>
        headTeacherSpecializations.some((htSpec) => storage.doSpecializationsMatch(htSpec, sub))
      );

      const masteredCount = activeStudents.filter((s) => s.status === 'Mastered / Promoted').length;
      const progressingCount = activeStudents.filter((s) => s.status === 'Progressing').length;
      const needsRemediationCount = activeStudents.filter((s) => s.status === 'Needs Remediation').length;

      return {
        teacher: t,
        students: tStudents,
        activeStudents,
        archivedStudents,
        sessions: tSessions,
        sessionCount: tSessions.length,
        verifiedSessionsCount,
        movCount,
        avgBaseline,
        avgSessionScore,
        masteryGain,
        derivedSubjects,
        matchedSpecializations,
        masteredCount,
        progressingCount,
        needsRemediationCount,
        submissionStatus: (t.reportsSubmissionStatus || (tSessions.length > 0 ? 'Submitted' : 'Pending')) as
          | 'Submitted'
          | 'Pending'
          | 'Needs Revision'
          | 'Draft',
      };
    });
  }, [departmentTeachers, monitoredStudents, monitoredSessions, headTeacherSpecializations]);

  // Flatten all MOVs and Assessment Tools across monitored sessions for Tab 4
  const allMovItems = useMemo<FlattenedMOVItem[]>(() => {
    const items: FlattenedMOVItem[] = [];
    monitoredSessions.forEach((sess) => {
      const student = monitoredStudents.find((st) => String(st.id) === String(sess.studentId));
      const tEmail = (sess.teacherEmail || student?.teacherEmail || '').toLowerCase().trim();
      const teacherObj = teachers.find((t) => (t.email || '').toLowerCase().trim() === tEmail);
      const teacherName = teacherObj?.name || tEmail || 'Supervised Faculty';

      const seenIds = new Set<string>();
      if (Array.isArray(sess.movs)) {
        sess.movs.forEach((m) => {
          seenIds.add(String(m.id));
          items.push({
            mov: m,
            session: sess,
            student,
            teacher: teacherObj,
            teacherName,
            teacherEmail: tEmail,
            isAssessmentTool: Boolean(m.isAssessmentTool),
          });
        });
      }
      if (sess.assessmentTool && !seenIds.has(String(sess.assessmentTool.id))) {
        items.push({
          mov: sess.assessmentTool,
          session: sess,
          student,
          teacher: teacherObj,
          teacherName,
          teacherEmail: tEmail,
          isAssessmentTool: true,
        });
      }
    });
    return items.sort(
      (a, b) => new Date(b.session.date).getTime() - new Date(a.session.date).getTime()
    );
  }, [monitoredSessions, monitoredStudents, teachers]);

  // Sessions missing any MOV attachment (within monitored scope)
  const sessionsMissingMovs = useMemo(() => {
    return monitoredSessions.filter(
      (s) => (!s.movs || s.movs.length === 0) && !s.assessmentTool
    );
  }, [monitoredSessions]);

  // Specialization-scoped summary numbers
  const activeDeptStudents = useMemo(
    () => monitoredStudents.filter((s) => !s.isArchived),
    [monitoredStudents]
  );
  const totalDeptMastered = useMemo(
    () => activeDeptStudents.filter((s) => s.status === 'Mastered / Promoted').length,
    [activeDeptStudents]
  );
  const totalDeptProgressing = useMemo(
    () => activeDeptStudents.filter((s) => s.status === 'Progressing').length,
    [activeDeptStudents]
  );
  const totalDeptNeedsRemediation = useMemo(
    () => activeDeptStudents.filter((s) => s.status === 'Needs Remediation').length,
    [activeDeptStudents]
  );

  const submittedTeachersCount = useMemo(
    () => teacherSupervisionStats.filter((item) => item.submissionStatus === 'Submitted').length,
    [teacherSupervisionStats]
  );
  const pendingTeachersCount = useMemo(
    () =>
      teacherSupervisionStats.filter(
        (item) => item.submissionStatus === 'Pending' || item.submissionStatus === 'Needs Revision'
      ).length,
    [teacherSupervisionStats]
  );

  const verifiedLogsCount = useMemo(
    () =>
      monitoredSessions.filter(
        (s) => s.supervisoryStatus === 'Verified' || s.supervisoryStatus === 'Exemplary'
      ).length,
    [monitoredSessions]
  );
  const pendingLogsCount = useMemo(
    () =>
      monitoredSessions.filter(
        (s) => !s.supervisoryStatus || s.supervisoryStatus === 'Pending Review'
      ).length,
    [monitoredSessions]
  );

  const evaluatedMovsCount = useMemo(
    () =>
      allMovItems.filter(
        (item) =>
          item.mov.evaluationStatus === 'Verified' ||
          item.mov.evaluationStatus === 'Exemplary'
      ).length,
    [allMovItems]
  );

  const deptAvgMastery = useMemo(() => {
    if (monitoredSessions.length === 0) return 0;
    return Math.round(
      monitoredSessions.reduce((acc, s) => acc + (s.score || 0), 0) / monitoredSessions.length
    );
  }, [monitoredSessions]);

  // All unique sections across monitored Subject / Specialization
  const allDeptSections = useMemo(() => {
    const set = new Set<string>();
    monitoredStudents.forEach((s) => {
      if (s.gradeLevel && s.section) {
        set.add(`${s.gradeLevel} - ${s.section}`);
      } else if (s.section) {
        set.add(s.section);
      }
    });
    return Array.from(set).sort();
  }, [monitoredStudents]);

  // Filtered teachers for Tab 2
  const filteredTeacherStats = useMemo(() => {
    return teacherSupervisionStats.filter((item) => {
      const q = teacherSearch.trim().toLowerCase();
      const matchesSearch =
        !q ||
        item.teacher.name.toLowerCase().includes(q) ||
        item.teacher.email.toLowerCase().includes(q) ||
        (item.teacher.title || '').toLowerCase().includes(q) ||
        item.derivedSubjects.some((sub) => sub.toLowerCase().includes(q));

      const matchesStatus =
        teacherStatusFilter === 'all' || item.submissionStatus === teacherStatusFilter;

      const matchesActivity =
        teacherActivityFilter === 'all' ||
        (teacherActivityFilter === 'active' && (item.activeStudents.length > 0 || item.sessionCount > 0)) ||
        (teacherActivityFilter === 'empty' && item.activeStudents.length === 0 && item.sessionCount === 0);

      return matchesSearch && matchesStatus && matchesActivity;
    });
  }, [teacherSupervisionStats, teacherSearch, teacherStatusFilter, teacherActivityFilter]);

  // Filtered sessions for Tab 3 (strictly within monitored Subject / Specialization)
  const filteredSessions = useMemo(() => {
    return monitoredSessions
      .filter((sess) => {
        const student = monitoredStudents.find((st) => String(st.id) === String(sess.studentId));
        const sTeacherEmail = (sess.teacherEmail || student?.teacherEmail || '').toLowerCase().trim();

        const matchesTeacher =
          logTeacherFilter === 'all' || sTeacherEmail === logTeacherFilter.toLowerCase().trim();

        const progType = sess.programType || student?.programType || 'Remediation';
        const matchesProgram =
          logProgramFilter === 'all' || progType === logProgramFilter;

        const secLabel = `${sess.gradeLevel || student?.gradeLevel || ''} - ${sess.section || student?.section || ''}`.trim();
        const matchesSection =
          logSectionFilter === 'all' ||
          secLabel === logSectionFilter ||
          (sess.section || student?.section) === logSectionFilter;

        const supStatus = sess.supervisoryStatus || 'Pending Review';
        const matchesSupervisory =
          logSupervisoryFilter === 'all' || supStatus === logSupervisoryFilter;

        const q = logSearch.trim().toLowerCase();
        const matchesSearch =
          !q ||
          (sess.studentName || '').toLowerCase().includes(q) ||
          (sess.focusCompetency || '').toLowerCase().includes(q) ||
          (sess.subject || '').toLowerCase().includes(q) ||
          (sess.remarks || '').toLowerCase().includes(q) ||
          (sess.supervisoryRemarks || '').toLowerCase().includes(q) ||
          sTeacherEmail.includes(q);

        return (
          matchesTeacher &&
          matchesProgram &&
          matchesSection &&
          matchesSupervisory &&
          matchesSearch
        );
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [
    monitoredSessions,
    monitoredStudents,
    logTeacherFilter,
    logProgramFilter,
    logSectionFilter,
    logSupervisoryFilter,
    logSearch,
  ]);

  // Filtered MOV items for Tab 4
  const filteredMovItems = useMemo(() => {
    return allMovItems.filter((item) => {
      const matchesTeacher =
        movTeacherFilter === 'all' ||
        item.teacherEmail === movTeacherFilter.toLowerCase().trim();

      const evalStatus = item.mov.evaluationStatus || 'Pending';
      const matchesStatus =
        movStatusFilter === 'all' || evalStatus === movStatusFilter;

      const matchesType =
        movTypeFilter === 'all' ||
        (movTypeFilter === 'assessment_tool' && item.isAssessmentTool) ||
        (movTypeFilter === 'session_photo' && !item.isAssessmentTool);

      const q = movSearch.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (item.mov.caption || '').toLowerCase().includes(q) ||
        (item.mov.name || '').toLowerCase().includes(q) ||
        (item.session.studentName || '').toLowerCase().includes(q) ||
        (item.session.focusCompetency || '').toLowerCase().includes(q) ||
        item.teacherName.toLowerCase().includes(q);

      return matchesTeacher && matchesStatus && matchesType && matchesSearch;
    });
  }, [allMovItems, movTeacherFilter, movStatusFilter, movTypeFilter, movSearch]);

  // --- Handlers for Teacher Supervision ---
  const handleOpenTeacherInspector = (teacher: TeacherProfile) => {
    setInspectingTeacher(teacher);
    setReviewTeacherStatus(
      (teacher.reportsSubmissionStatus as any) || 'Submitted'
    );
    setReviewTeacherFeedback(teacher.headTeacherFeedback || '');
  };

  const handleSaveTeacherReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectingTeacher) return;
    setIsSavingTeacherReview(true);
    try {
      const res = await storage.headTeacherReviewTeacher(
        headTeacher.email,
        headTeacher.name,
        inspectingTeacher.email,
        reviewTeacherStatus,
        reviewTeacherFeedback
      );
      await handleSyncAll();
      setInspectingTeacher(null);
      if (onShowToast) {
        onShowToast(res.message, 'success');
      }
    } finally {
      setIsSavingTeacherReview(false);
    }
  };

  const handleQuickSignOffTeacher = async (
    teacherEmail: string,
    newStatus: 'Submitted' | 'Pending' | 'Needs Revision'
  ) => {
    const res = await storage.headTeacherReviewTeacher(
      headTeacher.email,
      headTeacher.name,
      teacherEmail,
      newStatus,
      newStatus === 'Submitted'
        ? 'Remediation logs and MOVs reviewed and approved by Head Teacher.'
        : undefined
    );
    await handleSyncAll();
    if (onShowToast) {
      onShowToast(res.message, 'success');
    }
  };

  // --- Handlers for Head Teacher & Faculty Subject / Specialization Configuration ---
  const handleOpenConfigHtSpec = () => {
    setHtSpecList([...headTeacherSpecializations]);
    setHtCustomSpecInput('');
    setIsConfigSpecOpen(true);
  };

  const handleSaveHtSpecialization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (htSpecList.length === 0) {
      if (onShowToast) {
        onShowToast('Please select at least one Subject / Specialization to monitor.', 'warning');
      }
      return;
    }
    setIsSavingHtSpec(true);
    try {
      const res = await storage.headTeacherUpdateSpecialization(
        headTeacher.email,
        htSpecList,
        htSpecList[0]
      );
      await handleSyncAll();
      setSelectedSpecializationFilter('ALL');
      setIsConfigSpecOpen(false);
      if (onShowToast) {
        onShowToast(res.message, 'success');
      }
    } finally {
      setIsSavingHtSpec(false);
    }
  };

  const handleOpenAssignTeacherSpec = (teacher: TeacherProfile) => {
    const tEmailNorm = (teacher.email || '').toLowerCase().trim();
    const tStudents = liveStudents.filter(
      (s) => (s.teacherEmail || (s as any).teacher_email || '').toLowerCase().trim() === tEmailNorm
    );
    const tSessions = liveSessions.filter(
      (s) => (s.teacherEmail || (s as any).teacher_email || '').toLowerCase().trim() === tEmailNorm
    );
    const currentSpecs = storage.getTeacherEffectiveSpecializations(teacher, tStudents, tSessions);
    setAssigningTeacherSpec(teacher);
    setTeacherSpecList(currentSpecs.length > 0 ? currentSpecs : [...headTeacherSpecializations.slice(0, 2)]);
    setTeacherCustomSpecInput('');
  };

  const handleSaveTeacherSpec = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningTeacherSpec) return;
    setIsSavingTeacherSpec(true);
    try {
      const res = await storage.adminAssignTeacherSubjects(
        headTeacher.email,
        assigningTeacherSpec.email,
        teacherSpecList
      );
      await handleSyncAll();
      setAssigningTeacherSpec(null);
      if (onShowToast) {
        onShowToast(res.message, 'success');
      }
    } finally {
      setIsSavingTeacherSpec(false);
    }
  };

  const handleQuickAssignToMySpecialization = async (teacher: TeacherProfile) => {
    const defaultSpecsToAssign =
      selectedSpecializationFilter !== 'ALL'
        ? [selectedSpecializationFilter]
        : headTeacherSpecializations.slice(0, 2);
    setIsSyncing(true);
    try {
      const res = await storage.adminAssignTeacherSubjects(
        headTeacher.email,
        teacher.email,
        defaultSpecsToAssign
      );
      await handleSyncAll();
      if (onShowToast) {
        onShowToast(
          `Assigned ${teacher.name} to your Subject / Specialization (${defaultSpecsToAssign.join(', ')}).`,
          'success'
        );
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // --- Handlers for Session Log Review ---
  const handleOpenSessionReview = (sess: SessionRecord) => {
    setReviewingSession(sess);
    setSessionVerdict(sess.supervisoryStatus || 'Verified');
    setSessionRemarks(
      sess.supervisoryRemarks ||
        'Intervention strategy is well-aligned with the target competency. Continue monitoring learner retention.'
    );
  };

  const handleSaveSessionReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingSession) return;
    setIsSavingSessionReview(true);
    try {
      const res = await storage.headTeacherReviewSession(
        headTeacher.email,
        headTeacher.name,
        reviewingSession.id,
        sessionVerdict,
        sessionRemarks
      );
      await handleSyncAll();
      setReviewingSession(null);
      if (onShowToast) {
        onShowToast(res.message, 'success');
      }
    } finally {
      setIsSavingSessionReview(false);
    }
  };

  const handleBatchVerifyLogs = async () => {
    const pendingInView = filteredSessions.filter(
      (s) => !s.supervisoryStatus || s.supervisoryStatus === 'Pending Review'
    );
    if (pendingInView.length === 0) {
      if (onShowToast) {
        onShowToast('All remediation logs in the current view are already verified.', 'info');
      }
      return;
    }
    setIsSyncing(true);
    try {
      for (const sess of pendingInView) {
        await storage.headTeacherReviewSession(
          headTeacher.email,
          headTeacher.name,
          sess.id,
          'Verified',
          'Verified and noted during departmental remediation log review.'
        );
      }
      await handleSyncAll();
      if (onShowToast) {
        onShowToast(`Verified ${pendingInView.length} remediation session log(s).`, 'success');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportLogsCSV = () => {
    const headers = [
      'Date',
      'Teacher Name',
      'Teacher Email',
      'Student Name',
      'Grade Level',
      'Section',
      'Subject',
      'Program Type',
      'Focus Competency',
      'Activities',
      'Interventions',
      'Raw Score',
      'Total Items',
      'Mastery Percentage',
      'Mastery Level',
      'MOV Count',
      'Teacher Remarks',
      'Head Teacher Status',
      'Head Teacher Supervisory Remarks',
    ];

    const rows = filteredSessions.map((s) => {
      const student = liveStudents.find((st) => String(st.id) === String(s.studentId));
      const tEmail = (s.teacherEmail || student?.teacherEmail || '').toLowerCase().trim();
      const tObj = teachers.find((t) => (t.email || '').toLowerCase().trim() === tEmail);
      const escapeCsv = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;

      return [
        escapeCsv(s.date),
        escapeCsv(tObj?.name || tEmail),
        escapeCsv(tEmail),
        escapeCsv(s.studentName),
        escapeCsv(s.gradeLevel || student?.gradeLevel),
        escapeCsv(s.section || student?.section),
        escapeCsv(s.subject || student?.subject),
        escapeCsv(s.programType || student?.programType),
        escapeCsv(s.focusCompetency),
        escapeCsv((s.activityTypes || [s.activityType]).join('; ')),
        escapeCsv((s.interventions || [s.intervention]).join('; ')),
        escapeCsv(s.rawScore),
        escapeCsv(s.totalItems || 20),
        escapeCsv(`${s.score}%`),
        escapeCsv(s.masteryLevel),
        escapeCsv(s.movs?.length || 0),
        escapeCsv(s.remarks),
        escapeCsv(s.supervisoryStatus || 'Pending Review'),
        escapeCsv(s.supervisoryRemarks || ''),
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent([headers.join(','), ...rows].join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `RMCHS_TLE_Remediation_Logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // --- Handlers for MOV Evaluation ---
  const handleOpenMovEvaluator = (item: FlattenedMOVItem) => {
    setEvaluatingMovItem(item);
    setMovEvalStatus(item.mov.evaluationStatus || 'Verified');
    setMovEvalNotes(
      item.mov.evaluationNotes ||
        'Authentic and clear MOV evidence demonstrating hands-on learner participation and output.'
    );
    setMovRubric(
      item.mov.rubricChecks || {
        alignedWithCompetency: true,
        authenticLearnerOutput: true,
        clearDocumentation: true,
      }
    );
  };

  const handleSaveMovEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evaluatingMovItem) return;
    setIsSavingMovEval(true);
    try {
      const res = await storage.headTeacherEvaluateMOV(
        headTeacher.email,
        headTeacher.name,
        evaluatingMovItem.session.id,
        evaluatingMovItem.mov.id,
        {
          evaluationStatus: movEvalStatus,
          evaluationNotes: movEvalNotes,
          rubricChecks: movRubric,
        }
      );
      await handleSyncAll();
      setEvaluatingMovItem(null);
      if (onShowToast) {
        onShowToast(res.message, 'success');
      }
    } finally {
      setIsSavingMovEval(false);
    }
  };

  const handleQuickVerifyMov = async (item: FlattenedMOVItem) => {
    const res = await storage.headTeacherEvaluateMOV(
      headTeacher.email,
      headTeacher.name,
      item.session.id,
      item.mov.id,
      {
        evaluationStatus: 'Verified',
        evaluationNotes: 'MOV verified as authentic instructional evidence by Head Teacher.',
        rubricChecks: {
          alignedWithCompetency: true,
          authenticLearnerOutput: true,
          clearDocumentation: true,
        },
      }
    );
    await handleSyncAll();
    if (onShowToast) {
      onShowToast(res.message, 'success');
    }
  };

  // --- Data for Tab 5: Narrative Report Generator (Whole Program Conducted by Supervised Teachers & Students) ---
  const reportContext = useMemo(() => {
    const deptTeacherProfile: TeacherProfile = {
      ...headTeacher,
      name: headTeacher.name || 'MELANI R. SANTOS',
      title: headTeacher.title || 'Head Teacher VI, TLE Department',
      headTeacherName: headTeacher.name || 'MELANI R. SANTOS',
      headTeacherPosition: headTeacher.title || 'Head Teacher VI, TLE Dept.',
      principalName: headTeacher.principalName || 'JOSEPHINE M. MANINGAS, PhD',
      principalPosition: headTeacher.principalPosition || 'Secondary School Principal IV',
    };
    return {
      teacherProfile: deptTeacherProfile,
      scopedStudents: activeDeptStudents,
      scopedSessions: monitoredSessions,
      scopedSections: allDeptSections,
    };
  }, [headTeacher, activeDeptStudents, monitoredSessions, allDeptSections]);

  const navItems: {
    id: HeadTeacherTab;
    label: string;
    icon: React.FC<{ className?: string }>;
    count: number | null;
  }[] = [
    { id: 'overview', label: 'Supervisory Overview', icon: LayoutDashboard, count: null },
    {
      id: 'teachers',
      label: 'Supervise Specialization Teachers',
      icon: Users,
      count: departmentTeachers.length,
    },
    {
      id: 'logs',
      label: 'Review Remediation Logs',
      icon: ClipboardCheck,
      count: monitoredSessions.length,
    },
    {
      id: 'movs',
      label: 'Evaluate Session MOVs',
      icon: ImageIcon,
      count: allMovItems.length,
    },
    {
      id: 'reports',
      label: 'Generate Narrative Reports',
      icon: FileCheck2,
      count: null,
    },
  ];

  return (
    <div className="space-y-6">
      {/* ================================================================= */}
      {/* HEAD TEACHER INSTRUCTIONAL SUPERVISION BANNER                     */}
      {/* ================================================================= */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 text-white rounded-2xl p-6 sm:p-7 shadow-lg border border-emerald-800/80 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2.5 max-w-3xl">
            <div className="flex items-center gap-2 text-xs text-amber-300 font-semibold tracking-wide flex-wrap">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <span>HEAD TEACHER SUBJECT / SPECIALIZATION SUPERVISION CONSOLE</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-200">
                {headTeacher.department || 'Technology and Livelihood Education (TLE)'}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              Welcome,{' '}
              <span className="text-yellow-300 underline decoration-amber-400/60 decoration-2 underline-offset-4">
                {headTeacher.name}
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              Strictly monitoring teachers, remediation logs, session Means of Verification (MOVs), and narrative accomplishment reports under your assigned{' '}
              <strong className="text-yellow-300">Subject / Specialization</strong>.
            </p>

            {/* Active Subject / Specialization Badges */}
            <div className="pt-1 flex items-center gap-2 flex-wrap">
              <span className="text-xs font-extrabold text-amber-300 tracking-wide flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>Subject/ Specialization:</span>
              </span>
              {headTeacherSpecializations.map((spec) => (
                <span
                  key={spec}
                  className="px-3 py-0.5 rounded-lg bg-amber-400 text-emerald-950 text-xs font-black tracking-wide shadow-xs"
                >
                  {spec}
                </span>
              ))}
              <button
                type="button"
                onClick={handleOpenConfigHtSpec}
                className="px-2.5 py-0.5 rounded-lg bg-emerald-800/80 hover:bg-emerald-700 border border-emerald-600/70 text-emerald-100 text-[11px] font-bold transition cursor-pointer flex items-center gap-1"
              >
                <Settings className="w-3 h-3 text-amber-300" />
                <span>Change Subject/ Specialization</span>
              </button>
            </div>

            <div className="pt-1 flex items-center gap-3 flex-wrap text-xs text-emerald-200 font-medium tabular-nums">
              <span>
                Supervised {headTeacherSpecializations.join(' / ')} Teachers: <strong className="text-white">{departmentTeachers.length}</strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Compliant Submissions: <strong className="text-yellow-300">{submittedTeachersCount}/{departmentTeachers.length}</strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Monitored Learners: <strong className="text-white">{activeDeptStudents.length}</strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Verified Logs: <strong className="text-emerald-300">{verifiedLogsCount}/{monitoredSessions.length}</strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Evaluated MOVs: <strong className="text-amber-300">{evaluatedMovsCount}/{allMovItems.length}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* SUBJECT / SPECIALIZATION SCOPE FILTER BAR (IF MULTIPLE SPECS)     */}
      {/* ================================================================= */}
      {headTeacherSpecializations.length > 1 && (
        <div className="bg-white rounded-2xl px-4 py-3 border border-emerald-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-extrabold text-emerald-950 flex items-center gap-1.5 mr-1">
              <Filter className="w-3.5 h-3.5 text-emerald-700" />
              <span>Filter by Subject / Specialization:</span>
            </span>

            <button
              type="button"
              onClick={() => setSelectedSpecializationFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer border ${
                selectedSpecializationFilter === 'ALL'
                  ? 'bg-emerald-900 text-yellow-300 border-emerald-800 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-emerald-50'
              }`}
            >
              All My Specializations ({supervisionScope.supervisedTeachers.length} Teachers)
            </button>

            {headTeacherSpecializations.map((spec) => {
              const isSelected = selectedSpecializationFilter === spec;
              return (
                <button
                  key={spec}
                  type="button"
                  onClick={() => setSelectedSpecializationFilter(spec)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                    isSelected
                      ? 'bg-amber-500 text-emerald-950 border-amber-600 font-extrabold shadow-xs'
                      : 'bg-emerald-50/70 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  {spec}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* PRIMARY NAVIGATION BAR FOR HEAD TEACHER                           */}
      {/* ================================================================= */}
      <div className="bg-white rounded-2xl p-1.5 border border-slate-200 shadow-xs flex items-center gap-1.5 overflow-x-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-emerald-900 text-yellow-300 shadow-xs border border-emerald-800'
                  : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-900'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-yellow-300' : 'text-emerald-700'}`} />
              <span>{item.label}</span>
              {item.count !== null && (
                <span
                  className={`text-[11px] font-mono tabular-nums px-1.5 py-0.2 rounded font-bold ${
                    isActive ? 'bg-emerald-800 text-amber-200' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ================================================================= */}
      {/* TAB 1: SUPERVISORY OVERVIEW                                       */}
      {/* ================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 4 Core KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Monitored Specialization Teachers</span>
                <Users className="w-4 h-4 text-emerald-700" />
              </div>
              <div className="mt-3">
                <p className="text-2xl font-black text-slate-900 font-mono tabular-nums">
                  {departmentTeachers.length}
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 tabular-nums">
                  <span className="text-emerald-700 font-semibold">{submittedTeachersCount} Submitted</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-amber-700 font-semibold">{pendingTeachersCount} Pending Review</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Remediation Session Logs</span>
                <ClipboardCheck className="w-4 h-4 text-emerald-700" />
              </div>
              <div className="mt-3">
                <p className="text-2xl font-black text-slate-900 font-mono tabular-nums">
                  {monitoredSessions.length}
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 tabular-nums">
                  <span className="text-emerald-700 font-semibold">{verifiedLogsCount} Verified</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-amber-700 font-semibold">{pendingLogsCount} Awaiting Review</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Session MOVs & Tools</span>
                <ImageIcon className="w-4 h-4 text-emerald-700" />
              </div>
              <div className="mt-3">
                <p className="text-2xl font-black text-slate-900 font-mono tabular-nums">
                  {allMovItems.length}
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 tabular-nums">
                  <span className="text-emerald-700 font-semibold">{evaluatedMovsCount} Evaluated</span>
                  <span aria-hidden="true">·</span>
                  <span>{allMovItems.length - evaluatedMovsCount} Pending</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Specialization Learners & Mastery</span>
                <TrendingUp className="w-4 h-4 text-emerald-700" />
              </div>
              <div className="mt-3">
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-black text-slate-900 font-mono tabular-nums">
                    {activeDeptStudents.length}
                  </p>
                  <span className="text-xs font-bold text-emerald-700 font-mono tabular-nums">
                    ({deptAvgMastery}% Avg Mastery)
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 tabular-nums">
                  <span className="text-emerald-700 font-semibold">{totalDeptMastered} Mastered</span>
                  <span aria-hidden="true">·</span>
                  <span>{totalDeptProgressing} Progressing</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-amber-700">{totalDeptNeedsRemediation} Needs Help</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Core Responsibility Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800">01. Faculty Supervision</span>
                  <Users className="w-4 h-4 text-emerald-700" />
                </div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Supervise Specialization Teachers
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Monitor teachers under your Subject / Specialization, verify submission compliance, and sign off on faculty records.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('teachers')}
                className="w-full py-2 px-4 bg-emerald-900 hover:bg-emerald-800 text-yellow-300 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <span>Supervise Teachers ({departmentTeachers.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800">02. Log Verification</span>
                  <ClipboardCheck className="w-4 h-4 text-emerald-700" />
                </div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Review Remediation Logs
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Inspect daily anecdotal remediation logs under your Subject / Specialization, verify interventions, and annotate feedback.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('logs')}
                className="w-full py-2 px-4 bg-emerald-900 hover:bg-emerald-800 text-yellow-300 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <span>Review Session Logs ({monitoredSessions.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800">03. Evidence Audit</span>
                  <ImageIcon className="w-4 h-4 text-emerald-700" />
                </div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Evaluate Session MOVs
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Evaluate uploaded photo documentation, Learning Activity Sheets (LAS), and diagnostic rubrics against DepEd quality standards.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('movs')}
                className="w-full py-2 px-4 bg-emerald-900 hover:bg-emerald-800 text-yellow-300 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <span>Evaluate MOVs ({allMovItems.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800">04. DepEd Reporting</span>
                  <FileCheck2 className="w-4 h-4 text-emerald-700" />
                </div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Generate Narrative Reports
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Compile and print official DepEd Narrative Accomplishment Reports, Recomputed Grade Certificates, and MOV Annexes.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('reports')}
                className="w-full py-2 px-4 bg-amber-500 hover:bg-amber-400 text-emerald-950 font-extrabold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <span>Open Report Generator</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Two-Column Overview: Department Faculty Status + Recent Remediation Logs */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left 7 Columns: Department Teachers Supervision Summary */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900">
                    Department Faculty Remediation Status
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Real-time student rosters, logged sessions, and report sign-off status per teacher
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('teachers')}
                  className="text-xs font-bold text-emerald-800 hover:text-emerald-950 hover:underline cursor-pointer whitespace-nowrap"
                >
                  View All Faculty
                </button>
              </div>

              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
                    <tr>
                      <th className="px-4 py-3">Teacher</th>
                      <th className="px-3 py-3 text-right">Learners</th>
                      <th className="px-3 py-3 text-right">Sessions</th>
                      <th className="px-3 py-3 text-right">MOVs</th>
                      <th className="px-3 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {teacherSupervisionStats.map((item) => (
                      <tr key={item.teacher.email} className="hover:bg-slate-50/80 transition">
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-900">{item.teacher.name}</p>
                          <p className="text-[11px] text-slate-500">{item.teacher.title}</p>
                        </td>
                        <td className="px-3 py-3 text-right font-mono tabular-nums font-bold text-slate-800">
                          {item.activeStudents.length}
                        </td>
                        <td className="px-3 py-3 text-right font-mono tabular-nums font-bold text-emerald-800">
                          {item.sessionCount}
                        </td>
                        <td className="px-3 py-3 text-right font-mono tabular-nums text-slate-700">
                          {item.movCount}
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={`text-[11px] font-bold ${
                              item.submissionStatus === 'Submitted'
                                ? 'text-emerald-700'
                                : item.submissionStatus === 'Needs Revision'
                                ? 'text-rose-700'
                                : 'text-amber-700'
                            }`}
                          >
                            {item.submissionStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenTeacherInspector(item.teacher)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-900 hover:text-yellow-300 text-slate-800 font-bold rounded-lg text-[11px] transition cursor-pointer whitespace-nowrap"
                          >
                            Supervise
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right 5 Columns: Recent Remediation Logs Awaiting Review */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900">
                    Recent Remediation Session Logs
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Click any session to review and record supervisory remarks
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('logs')}
                  className="text-xs font-bold text-emerald-800 hover:text-emerald-950 hover:underline cursor-pointer whitespace-nowrap"
                >
                  Review All Logs
                </button>
              </div>

              <div className="divide-y divide-slate-100 flex-1 overflow-y-auto max-h-[420px]">
                {monitoredSessions.slice(0, 8).map((sess) => {
                  const student = monitoredStudents.find((s) => String(s.id) === String(sess.studentId));
                  const tEmail = (sess.teacherEmail || student?.teacherEmail || '').toLowerCase().trim();
                  const tObj = teachers.find((t) => (t.email || '').toLowerCase().trim() === tEmail);
                  const statusLabel = sess.supervisoryStatus || 'Pending Review';

                  return (
                    <div
                      key={sess.id}
                      className="p-4 hover:bg-slate-50 transition flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono tabular-nums">
                          <span className="font-bold text-slate-800 font-sans">{sess.studentName}</span>
                          <span aria-hidden="true">·</span>
                          <span>{sess.date}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-bold text-emerald-700">{sess.score}%</span>
                        </div>
                        <p className="text-xs font-semibold text-slate-800 truncate">
                          {sess.focusCompetency}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <span>By {tObj?.name || tEmail}</span>
                          <span aria-hidden="true">·</span>
                          <span
                            className={`font-bold ${
                              statusLabel === 'Verified' || statusLabel === 'Exemplary'
                                ? 'text-emerald-700'
                                : statusLabel === 'Needs Follow-up'
                                ? 'text-rose-700'
                                : 'text-amber-700'
                            }`}
                          >
                            {statusLabel}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenSessionReview(sess)}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-900 text-emerald-900 hover:text-yellow-300 font-bold rounded-lg text-xs transition shrink-0 cursor-pointer whitespace-nowrap"
                      >
                        Review Log
                      </button>
                    </div>
                  );
                })}

                {monitoredSessions.length === 0 && (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No remediation session logs recorded yet under this Subject / Specialization.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 2: SUPERVISE DEPARTMENT TEACHERS (UNDER SPECIALIZATION)       */}
      {/* ================================================================= */}
      {activeTab === 'teachers' && (
        <div className="space-y-6">
          {/* Header & Controls */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-800" />
                <span>
                  Teachers Monitored Under Your Subject / Specialization ({filteredTeacherStats.length})
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Showing only faculty members whose assigned Subject / Specialization matches{' '}
                <strong className="text-emerald-900">
                  {selectedSpecializationFilter === 'ALL'
                    ? headTeacherSpecializations.join(' · ')
                    : selectedSpecializationFilter}
                </strong>
                .
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={teacherSearch}
                  onChange={(e) => setTeacherSearch(e.target.value)}
                  placeholder="Search teacher name, email, specialization..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <select
                value={teacherStatusFilter}
                onChange={(e) => setTeacherStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="all">All Submission Statuses</option>
                <option value="Submitted">Submitted (Approved)</option>
                <option value="Pending">Pending Review</option>
                <option value="Needs Revision">Needs Revision</option>
                <option value="Draft">Draft</option>
              </select>

              <select
                value={teacherActivityFilter}
                onChange={(e) => setTeacherActivityFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="all">All Monitored Faculty</option>
                <option value="active">With Enrolled Students / Logs</option>
                <option value="empty">No Enrolled Students Yet</option>
              </select>
            </div>
          </div>

          {/* Faculty Supervision Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
                  <tr>
                    <th className="px-5 py-3.5">Supervised Teacher</th>
                    <th className="px-4 py-3.5">Subject / Specialization</th>
                    <th className="px-4 py-3.5 text-right">Enrolled Learners</th>
                    <th className="px-4 py-3.5 text-right">Remediation Logs</th>
                    <th className="px-4 py-3.5 text-right">Avg Mastery</th>
                    <th className="px-4 py-3.5 text-right">Attached MOVs</th>
                    <th className="px-4 py-3.5">Submission & Coaching Note</th>
                    <th className="px-5 py-3.5 text-right">Supervisory Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTeacherStats.map((item) => {
                    const roleDef = getRoleDefinition(item.teacher.role);
                    return (
                      <tr key={item.teacher.email} className="hover:bg-slate-50/80 transition">
                        <td className="px-5 py-4">
                          <p className="font-extrabold text-slate-900">{item.teacher.name}</p>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                            <span>{item.teacher.title || roleDef.label}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono">{item.teacher.email}</span>
                          </div>
                        </td>

                        <td className="px-4 py-4 max-w-xs">
                          <div className="flex flex-wrap gap-1">
                            {item.derivedSubjects.map((sub) => (
                              <span
                                key={sub}
                                className="px-2 py-0.5 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-md text-[11px] font-bold"
                              >
                                {sub}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="px-4 py-4 text-right font-mono tabular-nums">
                          <span className="font-extrabold text-slate-900 text-sm">
                            {item.activeStudents.length}
                          </span>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            <span className="text-emerald-700">{item.masteredCount}M</span>
                            {' / '}
                            <span>{item.progressingCount}P</span>
                            {' / '}
                            <span className="text-amber-700">{item.needsRemediationCount}R</span>
                          </div>
                        </td>

                        <td className="px-4 py-4 text-right font-mono tabular-nums">
                          <button
                            type="button"
                            onClick={() => {
                              setLogTeacherFilter(item.teacher.email);
                              setActiveTab('logs');
                            }}
                            className="font-extrabold text-emerald-800 hover:text-emerald-950 underline cursor-pointer text-sm"
                          >
                            {item.sessionCount}
                          </button>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {item.verifiedSessionsCount} verified
                          </p>
                        </td>

                        <td className="px-4 py-4 text-right font-mono tabular-nums">
                          {item.sessionCount > 0 || item.activeStudents.length > 0 ? (
                            <div>
                              <span className="font-extrabold text-slate-900">
                                {item.avgSessionScore}%
                              </span>
                              {item.masteryGain !== 0 && (
                                <p
                                  className={`text-[11px] font-bold ${
                                    item.masteryGain > 0 ? 'text-emerald-700' : 'text-amber-700'
                                  }`}
                                >
                                  {item.masteryGain > 0 ? `+${item.masteryGain}%` : `${item.masteryGain}%`} vs base
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        <td className="px-4 py-4 text-right font-mono tabular-nums">
                          <button
                            type="button"
                            onClick={() => {
                              setMovTeacherFilter(item.teacher.email);
                              setActiveTab('movs');
                            }}
                            className="font-bold text-slate-800 hover:text-emerald-800 underline cursor-pointer"
                          >
                            {item.movCount} files
                          </button>
                        </td>

                        <td className="px-4 py-4 max-w-xs">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`font-extrabold text-xs ${
                                item.submissionStatus === 'Submitted'
                                  ? 'text-emerald-700'
                                  : item.submissionStatus === 'Needs Revision'
                                  ? 'text-rose-700'
                                  : 'text-amber-700'
                              }`}
                            >
                              {item.submissionStatus}
                            </span>
                            {item.teacher.headTeacherReviewedAt && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                · Reviewed
                              </span>
                            )}
                          </div>
                          {item.teacher.headTeacherFeedback ? (
                            <p className="text-[11px] text-slate-600 italic line-clamp-1 mt-0.5">
                              "{item.teacher.headTeacherFeedback}"
                            </p>
                          ) : (
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              No supervisory remarks yet
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenTeacherInspector(item.teacher)}
                              className="px-3 py-1.5 bg-emerald-900 hover:bg-emerald-800 text-yellow-300 font-bold rounded-lg text-xs transition cursor-pointer whitespace-nowrap"
                            >
                              Supervise & Evaluate
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenAssignTeacherSpec(item.teacher)}
                              className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold rounded-lg text-xs transition border border-amber-200 cursor-pointer whitespace-nowrap"
                              title="Edit Subject / Specialization for this Teacher"
                            >
                              Specialization
                            </button>

                            {item.submissionStatus !== 'Submitted' && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleQuickSignOffTeacher(item.teacher.email, 'Submitted')
                                }
                                className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg text-xs transition cursor-pointer whitespace-nowrap border border-emerald-200"
                                title="Quick Sign-Off Submission"
                              >
                                Sign Off
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredTeacherStats.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-xs text-slate-400">
                        No teachers under your Subject / Specialization found matching the current filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Collapsible Panel: Assign Subject / Specialization to Unassigned Faculty */}
          {supervisionScope.unassignedTeachers.length > 0 && (
            <div className="bg-white rounded-2xl border border-amber-200/90 overflow-hidden">
              <div className="p-4 sm:p-5 bg-amber-50/60 border-b border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs sm:text-sm font-extrabold text-amber-950 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-amber-700" />
                    <span>
                      Unassigned Faculty Without Subject / Specialization ({supervisionScope.unassignedTeachers.length})
                    </span>
                  </h3>
                  <p className="text-[11px] text-amber-900/80 mt-0.5">
                    These teachers are not currently monitored in your dashboard because they do not have a Subject / Specialization assigned yet. Assign them to your specialization if they are under your supervision.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowUnassignedFacultyPanel(!showUnassignedFacultyPanel)}
                  className="px-3.5 py-2 bg-white hover:bg-amber-100 text-amber-950 font-bold rounded-xl text-xs border border-amber-300 transition cursor-pointer whitespace-nowrap shrink-0"
                >
                  {showUnassignedFacultyPanel
                    ? 'Hide Unassigned Faculty'
                    : `Show Unassigned Faculty (${supervisionScope.unassignedTeachers.length})`}
                </button>
              </div>

              {showUnassignedFacultyPanel && (
                <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 bg-white">
                  {supervisionScope.unassignedTeachers.map((ut) => (
                    <div
                      key={ut.email}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-slate-900 truncate">{ut.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{ut.title}</p>
                        <p className="text-[10px] text-slate-400 font-mono truncate">{ut.email}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleQuickAssignToMySpecialization(ut)}
                          className="px-2.5 py-1.5 bg-emerald-900 hover:bg-emerald-800 text-yellow-300 font-bold rounded-lg text-[11px] transition cursor-pointer whitespace-nowrap"
                          title="Assign this teacher to your Subject / Specialization"
                        >
                          + Add to My Scope
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenAssignTeacherSpec(ut)}
                          className="px-2 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-lg text-[11px] border border-slate-200 transition cursor-pointer"
                          title="Choose specific Subject / Specialization"
                        >
                          Custom
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 3: REVIEW REMEDIATION LOGS                                    */}
      {/* ================================================================= */}
      {activeTab === 'logs' && (
        <div className="space-y-6">
          {/* Header & Filter Bar */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-emerald-800" />
                  <span>
                    Department Remediation & Skills Enhancement Logs ({filteredSessions.length})
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Review daily anecdotal remediation logs submitted by teachers, verify mastery progress, and record instructional supervision remarks.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap shrink-0">
                <button
                  type="button"
                  onClick={handleBatchVerifyLogs}
                  disabled={isSyncing}
                  className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-700 text-yellow-300 font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verify Pending in View</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportLogsCSV}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Download className="w-4 h-4 text-amber-300" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Filter Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2 border-t border-slate-100">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  placeholder="Search learner, competency, remarks..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <select
                value={logTeacherFilter}
                onChange={(e) => setLogTeacherFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="all">All Department Teachers</option>
                {departmentTeachers.map((t) => (
                  <option key={t.email} value={t.email}>
                    {t.name} ({t.email})
                  </option>
                ))}
              </select>

              <select
                value={logProgramFilter}
                onChange={(e) => setLogProgramFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="all">All Program Types</option>
                <option value="Remediation">Remediation</option>
                <option value="Skills Enhancement">Skills Enhancement</option>
              </select>

              <select
                value={logSectionFilter}
                onChange={(e) => setLogSectionFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="all">All Grade & Sections</option>
                {allDeptSections.map((sec) => (
                  <option key={sec} value={sec}>
                    {sec}
                  </option>
                ))}
              </select>

              <select
                value={logSupervisoryFilter}
                onChange={(e) => setLogSupervisoryFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="all">All Supervisory Statuses</option>
                <option value="Pending Review">Pending Review</option>
                <option value="Verified">Verified</option>
                <option value="Exemplary">Exemplary</option>
                <option value="Needs Follow-up">Needs Follow-up</option>
              </select>
            </div>
          </div>

          {/* Remediation Session Logs Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
                  <tr>
                    <th className="px-4 py-3.5">Date</th>
                    <th className="px-4 py-3.5">Conducted By Teacher</th>
                    <th className="px-4 py-3.5">Learner & Section</th>
                    <th className="px-4 py-3.5">Focus Competency & Strategy</th>
                    <th className="px-4 py-3.5 text-right">Score & Mastery</th>
                    <th className="px-4 py-3.5 text-right">MOVs</th>
                    <th className="px-4 py-3.5">Teacher Remarks & HT Review</th>
                    <th className="px-4 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSessions.map((sess) => {
                    const student = liveStudents.find((st) => String(st.id) === String(sess.studentId));
                    const tEmail = (sess.teacherEmail || student?.teacherEmail || '').toLowerCase().trim();
                    const teacherObj = teachers.find(
                      (t) => (t.email || '').toLowerCase().trim() === tEmail
                    );
                    const supStatus = sess.supervisoryStatus || 'Pending Review';
                    const movCount =
                      (sess.movs?.length || 0) +
                      (sess.assessmentTool &&
                      (!sess.movs || !sess.movs.some((m) => m.id === sess.assessmentTool?.id))
                        ? 1
                        : 0);

                    return (
                      <tr key={sess.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-4 py-4 font-mono tabular-nums font-bold text-slate-800 whitespace-nowrap">
                          {sess.date}
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap">
                          <p className="font-bold text-slate-900">
                            {teacherObj?.name || tEmail || 'TLE Faculty'}
                          </p>
                          <p className="text-[11px] text-slate-500 font-mono">{tEmail}</p>
                        </td>

                        <td className="px-4 py-4">
                          {student && onSelectStudent ? (
                            <button
                              type="button"
                              onClick={() => onSelectStudent(student)}
                              className="font-extrabold text-slate-900 hover:text-emerald-800 underline text-left cursor-pointer"
                            >
                              {sess.studentName || `${student.lastName}, ${student.firstName}`}
                            </button>
                          ) : (
                            <p className="font-extrabold text-slate-900">{sess.studentName}</p>
                          )}
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                            <span>
                              {sess.gradeLevel || student?.gradeLevel} - {sess.section || student?.section}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{sess.subject || student?.subject || 'TLE'}</span>
                          </div>
                        </td>

                        <td className="px-4 py-4 max-w-xs">
                          <p className="font-bold text-slate-900 line-clamp-2">
                            {sess.focusCompetency}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                            {(sess.interventions || [sess.intervention]).filter(Boolean).join(' · ')}
                          </p>
                        </td>

                        <td className="px-4 py-4 text-right font-mono tabular-nums whitespace-nowrap">
                          <p className="font-extrabold text-slate-900">
                            {sess.rawScore}/{sess.totalItems || 20} ({sess.score}%)
                          </p>
                          <p
                            className={`text-[11px] font-sans font-bold ${
                              sess.score >= 85
                                ? 'text-emerald-700'
                                : sess.score >= 75
                                ? 'text-teal-700'
                                : 'text-amber-700'
                            }`}
                          >
                            {sess.masteryLevel || (sess.score >= 75 ? 'Passed / Mastered' : 'Progressing')}
                          </p>
                        </td>

                        <td className="px-4 py-4 text-right font-mono tabular-nums whitespace-nowrap">
                          {movCount > 0 ? (
                            <button
                              type="button"
                              onClick={() => {
                                const firstMov = sess.movs?.[0] || sess.assessmentTool;
                                if (firstMov) {
                                  handleOpenMovEvaluator({
                                    mov: firstMov,
                                    session: sess,
                                    student,
                                    teacher: teacherObj,
                                    teacherName: teacherObj?.name || tEmail,
                                    teacherEmail: tEmail,
                                    isAssessmentTool: Boolean(firstMov.isAssessmentTool),
                                  });
                                }
                              }}
                              className="font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
                            >
                              {movCount} MOV{movCount > 1 ? 's' : ''}
                            </button>
                          ) : (
                            <span className="text-slate-400">None</span>
                          )}
                        </td>

                        <td className="px-4 py-4 max-w-xs">
                          <p className="text-xs text-slate-700 line-clamp-1">
                            {sess.remarks || 'No teacher remarks.'}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span
                              className={`text-[11px] font-extrabold ${
                                supStatus === 'Verified' || supStatus === 'Exemplary'
                                  ? 'text-emerald-700'
                                  : supStatus === 'Needs Follow-up'
                                  ? 'text-rose-700'
                                  : 'text-amber-700'
                              }`}
                            >
                              HT: {supStatus}
                            </span>
                            {sess.supervisoryRemarks && (
                              <span className="text-[11px] text-slate-500 italic truncate max-w-[170px]">
                                · "{sess.supervisoryRemarks}"
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleOpenSessionReview(sess)}
                            className="px-3 py-1.5 bg-emerald-900 hover:bg-emerald-800 text-yellow-300 font-bold rounded-lg text-xs transition cursor-pointer"
                          >
                            Review Log
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredSessions.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-xs text-slate-400">
                        No remediation session logs found matching the current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 4: EVALUATE SESSION MOVS                                      */}
      {/* ================================================================= */}
      {activeTab === 'movs' && (
        <div className="space-y-6">
          {/* Header & Summary Bar */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-emerald-800" />
                  <span>
                    Evaluate Session Means of Verification (MOVs) & Assessment Tools
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Inspect uploaded learner outputs, Learning Activity Sheets (LAS), diagnostic rubrics, and session photos against DepEd verification criteria.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowMissingMovSessionsOnly(!showMissingMovSessionsOnly)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap border ${
                    showMissingMovSessionsOnly
                      ? 'bg-amber-600 text-white border-amber-700'
                      : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  {showMissingMovSessionsOnly
                    ? 'Showing Logs Missing MOVs'
                    : `Logs Missing MOVs (${sessionsMissingMovs.length})`}
                </button>
              </div>
            </div>

            {!showMissingMovSessionsOnly && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={movSearch}
                    onChange={(e) => setMovSearch(e.target.value)}
                    placeholder="Search caption, student, teacher..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                <select
                  value={movTeacherFilter}
                  onChange={(e) => setMovTeacherFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                >
                  <option value="all">All Department Teachers</option>
                  {departmentTeachers.map((t) => (
                    <option key={t.email} value={t.email}>
                      {t.name}
                    </option>
                  ))}
                </select>

                <select
                  value={movStatusFilter}
                  onChange={(e) => setMovStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                >
                  <option value="all">All Evaluation Statuses</option>
                  <option value="Pending">Pending Evaluation</option>
                  <option value="Verified">Verified (Authentic)</option>
                  <option value="Exemplary">Exemplary Evidence</option>
                  <option value="Needs Revision">Needs Revision / Clarity</option>
                </select>

                <select
                  value={movTypeFilter}
                  onChange={(e) => setMovTypeFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                >
                  <option value="all">All Evidence Types</option>
                  <option value="assessment_tool">Assessment Tools & Rubrics</option>
                  <option value="session_photo">Session Photos & Learner Outputs</option>
                </select>
              </div>
            )}
          </div>

          {/* View A: Sessions Missing MOVs */}
          {showMissingMovSessionsOnly ? (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="p-4 bg-amber-50/70 border-b border-amber-200 flex items-center justify-between">
                <p className="text-xs font-bold text-amber-900">
                  Sessions Logged Without Attached Photo or Assessment Tool MOV ({sessionsMissingMovs.length})
                </p>
                <button
                  type="button"
                  onClick={() => setShowMissingMovSessionsOnly(false)}
                  className="text-xs font-bold text-amber-900 underline cursor-pointer"
                >
                  Back to MOV Gallery
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Teacher</th>
                      <th className="px-4 py-3">Learner & Section</th>
                      <th className="px-4 py-3">Competency</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sessionsMissingMovs.map((sess) => {
                      const student = liveStudents.find((s) => String(s.id) === String(sess.studentId));
                      const tEmail = (sess.teacherEmail || student?.teacherEmail || '').toLowerCase().trim();
                      const tObj = teachers.find((t) => (t.email || '').toLowerCase().trim() === tEmail);
                      return (
                        <tr key={sess.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-mono tabular-nums font-bold">{sess.date}</td>
                          <td className="px-4 py-3 font-bold text-slate-900">{tObj?.name || tEmail}</td>
                          <td className="px-4 py-3">
                            {sess.studentName} ({sess.gradeLevel} - {sess.section})
                          </td>
                          <td className="px-4 py-3 text-slate-700">{sess.focusCompetency}</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setReviewingSession(sess);
                                setSessionVerdict('Needs Follow-up');
                                setSessionRemarks(
                                  'Please attach a clear photo MOV or checked Learning Activity Sheet (LAS) to verify this remediation session.'
                                );
                              }}
                              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xs cursor-pointer"
                            >
                              Request MOV
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {sessionsMissingMovs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-xs text-slate-500">
                          100% of logged sessions have attached MOV evidence!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* View B: MOV Verification Cards Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredMovItems.map((item) => {
                const evalStatus = item.mov.evaluationStatus || 'Pending';
                const checks = item.mov.rubricChecks;
                const passedChecksCount = checks
                  ? [
                      checks.alignedWithCompetency,
                      checks.authenticLearnerOutput,
                      checks.clearDocumentation,
                    ].filter(Boolean).length
                  : 0;

                return (
                  <div
                    key={`${item.session.id}-${item.mov.id}`}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col justify-between hover:border-emerald-600/60 transition"
                  >
                    <div>
                      {/* Preview Image or Document Box */}
                      <div
                        onClick={() => handleOpenMovEvaluator(item)}
                        className="w-full h-48 bg-slate-100 relative overflow-hidden cursor-pointer group border-b border-slate-100"
                      >
                        {item.mov.dataUrl ? (
                          <img
                            src={item.mov.dataUrl}
                            alt={item.mov.caption || item.mov.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                            <FileText className="w-10 h-10 mb-2 text-slate-300" />
                            <span className="text-xs font-semibold text-slate-500">
                              {item.mov.name || 'Instructional Document MOV'}
                            </span>
                          </div>
                        )}

                        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2 pointer-events-none">
                          <span className="px-2.5 py-1 rounded-md bg-slate-900/85 text-white text-[10px] font-bold">
                            {item.isAssessmentTool ? 'Assessment Tool / LAS' : 'Session Photo MOV'}
                          </span>
                          <span
                            className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold ${
                              evalStatus === 'Verified' || evalStatus === 'Exemplary'
                                ? 'bg-emerald-900/95 text-yellow-300'
                                : evalStatus === 'Needs Revision'
                                ? 'bg-rose-900/95 text-white'
                                : 'bg-amber-500/95 text-emerald-950'
                            }`}
                          >
                            {evalStatus}
                          </span>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-4 space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono tabular-nums">
                          <span>{item.session.date}</span>
                          <span className="font-bold text-emerald-800">
                            Score: {item.session.score}%
                          </span>
                        </div>

                        <h3 className="text-xs font-extrabold text-slate-900 line-clamp-2">
                          {item.mov.caption || item.mov.name || 'Session Verification Evidence'}
                        </h3>

                        <div className="text-xs text-slate-600 space-y-0.5 pt-1 border-t border-slate-100">
                          <p>
                            <span className="text-slate-400">Learner:</span>{' '}
                            <strong className="text-slate-800">{item.session.studentName}</strong> ({item.session.gradeLevel} - {item.session.section})
                          </p>
                          <p>
                            <span className="text-slate-400">Teacher:</span>{' '}
                            <strong className="text-slate-800">{item.teacherName}</strong>
                          </p>
                          <p className="truncate">
                            <span className="text-slate-400">Competency:</span>{' '}
                            {item.session.focusCompetency}
                          </p>
                        </div>

                        {item.mov.evaluationNotes && (
                          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-700">
                            <div className="flex items-center justify-between font-bold text-emerald-900 mb-0.5">
                              <span>HT Evaluation Note</span>
                              {checks && (
                                <span className="font-mono tabular-nums text-[10px]">
                                  {passedChecksCount}/3 Criteria
                                </span>
                              )}
                            </div>
                            <p className="italic line-clamp-2">"{item.mov.evaluationNotes}"</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenMovEvaluator(item)}
                        className="flex-1 py-2 px-3 bg-emerald-900 hover:bg-emerald-800 text-yellow-300 font-bold rounded-xl text-xs transition cursor-pointer text-center whitespace-nowrap"
                      >
                        Evaluate MOV
                      </button>

                      {evalStatus !== 'Verified' && evalStatus !== 'Exemplary' && (
                        <button
                          type="button"
                          onClick={() => handleQuickVerifyMov(item)}
                          className="py-2 px-3 bg-white hover:bg-emerald-50 text-emerald-800 font-bold rounded-xl text-xs transition border border-emerald-200 cursor-pointer whitespace-nowrap"
                        >
                          Quick Verify
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {filteredMovItems.length === 0 && (
                <div className="col-span-full bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-2">
                  <ImageIcon className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-sm font-bold text-slate-700">
                    No MOV attachments match the selected filters
                  </p>
                  <p className="text-xs text-slate-500">
                    Try selecting "All Department Teachers" or resetting the evaluation status filter.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 5: GENERATE NARRATIVE REPORTS                                 */}
      {/* ================================================================= */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Official DepEd Whole-Program Narrative Report Generator for Head Teachers */}
          <NarrativeReportGenerator
            teacher={reportContext.teacherProfile}
            students={reportContext.scopedStudents}
            sessions={reportContext.scopedSessions}
            sectionsList={reportContext.scopedSections}
            isHeadTeacherReport={true}
            supervisedTeachers={departmentTeachers}
            subjectSpecialization={headTeacherSpecializations.join(' / ') || 'TLE'}
          />
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 1: TEACHER SUPERVISORY PORTFOLIO & EVALUATION               */}
      {/* ================================================================= */}
      {inspectingTeacher && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-6 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-emerald-950 text-white p-5 flex items-center justify-between border-b border-emerald-800">
              <div>
                <p className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                  Department Faculty Supervisory Portfolio
                </p>
                <h3 className="text-lg font-extrabold text-white mt-0.5">
                  {inspectingTeacher.name}
                </h3>
                <p className="text-xs text-emerald-200 font-mono">
                  {inspectingTeacher.title} · {inspectingTeacher.email}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInspectingTeacher(null)}
                className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {(() => {
                const stat = teacherSupervisionStats.find(
                  (s) =>
                    s.teacher.email.toLowerCase().trim() ===
                    inspectingTeacher.email.toLowerCase().trim()
                );
                const tStudents = stat?.activeStudents || [];
                const tSessions = stat?.sessions || [];

                return (
                  <>
                    {/* Teacher Summary Strip */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 tabular-nums">
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[11px] font-bold text-slate-500">Active Learners</span>
                        <p className="text-xl font-black text-slate-900 font-mono mt-0.5">
                          {tStudents.length}
                        </p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[11px] font-bold text-slate-500">Remediation Logs</span>
                        <p className="text-xl font-black text-emerald-800 font-mono mt-0.5">
                          {tSessions.length}
                        </p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[11px] font-bold text-slate-500">Uploaded MOVs</span>
                        <p className="text-xl font-black text-slate-900 font-mono mt-0.5">
                          {stat?.movCount || 0}
                        </p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[11px] font-bold text-slate-500">Avg Mastery</span>
                        <p className="text-xl font-black text-emerald-800 font-mono mt-0.5">
                          {stat?.avgSessionScore || 0}%
                        </p>
                      </div>
                    </div>

                    {/* Enrolled Students Preview */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-extrabold text-slate-800">
                          Enrolled Remediation & Enhancement Learners ({tStudents.length})
                        </h4>
                        <button
                          type="button"
                          onClick={() => {
                            setInspectingTeacher(null);
                            setReportScopeEmail(inspectingTeacher.email);
                            setActiveTab('reports');
                          }}
                          className="text-xs font-bold text-emerald-800 hover:underline cursor-pointer"
                        >
                          Open Teacher Narrative Report
                        </button>
                      </div>

                      {tStudents.length > 0 ? (
                        <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
                              <tr>
                                <th className="px-3 py-2">Learner Name</th>
                                <th className="px-3 py-2">Grade & Section</th>
                                <th className="px-3 py-2">Subject</th>
                                <th className="px-3 py-2 text-right">Baseline</th>
                                <th className="px-3 py-2">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {tStudents.map((st) => (
                                <tr key={st.id} className="hover:bg-slate-50">
                                  <td className="px-3 py-2 font-bold text-slate-900">
                                    {st.lastName}, {st.firstName}
                                  </td>
                                  <td className="px-3 py-2 text-slate-600">
                                    {st.gradeLevel} - {st.section}
                                  </td>
                                  <td className="px-3 py-2 text-slate-600">{st.subject}</td>
                                  <td className="px-3 py-2 text-right font-mono tabular-nums font-bold">
                                    {st.baselineScore}%
                                  </td>
                                  <td className="px-3 py-2 font-semibold text-emerald-800">
                                    {st.status}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl border border-slate-200">
                          This teacher has not enrolled any learners yet.
                        </p>
                      )}
                    </div>

                    {/* Supervisory Review Form */}
                    <form onSubmit={handleSaveTeacherReview} className="space-y-4 pt-3 border-t border-slate-200">
                      <h4 className="text-xs font-extrabold text-slate-900">
                        Head Teacher Supervisory Evaluation & Sign-Off
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Submission Compliance Status
                          </label>
                          <select
                            value={reviewTeacherStatus}
                            onChange={(e) => setReviewTeacherStatus(e.target.value as any)}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                          >
                            <option value="Submitted">Submitted (Approved & Signed Off)</option>
                            <option value="Pending">Pending Review</option>
                            <option value="Needs Revision">Needs Revision / Additional MOVs</option>
                            <option value="Draft">Draft / Incomplete</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Reviewing Authority
                          </label>
                          <input
                            type="text"
                            disabled
                            value={`${headTeacher.name} (${headTeacher.title})`}
                            className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Supervisory Feedback / Instructional Coaching Notes
                        </label>
                        <textarea
                          rows={3}
                          value={reviewTeacherFeedback}
                          onChange={(e) => setReviewTeacherFeedback(e.target.value)}
                          placeholder="Enter supervisory observations, commendations, or follow-up instructions for this teacher..."
                          className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setInspectingTeacher(null)}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSavingTeacherReview}
                          className="px-5 py-2 bg-emerald-900 hover:bg-emerald-800 text-yellow-300 font-extrabold rounded-xl text-xs cursor-pointer"
                        >
                          {isSavingTeacherReview ? 'Saving Review...' : 'Save Supervisory Sign-Off'}
                        </button>
                      </div>
                    </form>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 2: REMEDIATION SESSION LOG SUPERVISORY REVIEW               */}
      {/* ================================================================= */}
      {reviewingSession && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-6">
            <div className="bg-emerald-950 text-white p-5 flex items-center justify-between border-b border-emerald-800">
              <div>
                <p className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                  Remediation Session Supervisory Review
                </p>
                <h3 className="text-base font-extrabold text-white mt-0.5">
                  {reviewingSession.studentName} — {reviewingSession.date}
                </h3>
                <p className="text-xs text-emerald-200">
                  {reviewingSession.gradeLevel} - {reviewingSession.section} · {reviewingSession.subject}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReviewingSession(null)}
                className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSessionReview} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 tabular-nums">
                <div>
                  <span className="text-[11px] text-slate-500 font-bold">Focus Competency</span>
                  <p className="font-bold text-slate-900 mt-0.5">
                    {reviewingSession.focusCompetency}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 font-bold">Intervention Applied</span>
                  <p className="font-bold text-slate-900 mt-0.5">
                    {(reviewingSession.interventions || [reviewingSession.intervention])
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 font-bold">Assessment Score</span>
                  <p className="font-extrabold text-emerald-800 font-mono text-sm mt-0.5">
                    {reviewingSession.rawScore}/{reviewingSession.totalItems || 20} ({reviewingSession.score}%)
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[11px] font-bold text-slate-500">
                  Teacher's Anecdotal Observation:
                </span>
                <p className="text-slate-800 font-medium">
                  "{reviewingSession.remarks || 'No anecdotal remarks provided.'}"
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Head Teacher Supervisory Verdict
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(
                    ['Verified', 'Exemplary', 'Needs Follow-up', 'Pending Review'] as const
                  ).map((statusOption) => (
                    <button
                      key={statusOption}
                      type="button"
                      onClick={() => setSessionVerdict(statusOption)}
                      className={`py-2 px-3 rounded-xl font-bold text-xs border transition cursor-pointer ${
                        sessionVerdict === statusOption
                          ? 'bg-emerald-900 text-yellow-300 border-emerald-800 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {statusOption}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Quick-Insert Supervisory Feedback Templates
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {SUPERVISORY_LOG_TEMPLATES.map((tpl, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSessionRemarks(tpl)}
                      className="text-left px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 rounded-lg text-[11px] border border-slate-200 transition cursor-pointer"
                    >
                      + {tpl.slice(0, 58)}...
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Head Teacher Supervisory Remarks & Coaching Notes
                </label>
                <textarea
                  rows={3}
                  value={sessionRemarks}
                  onChange={(e) => setSessionRemarks(e.target.value)}
                  placeholder="Write supervisory feedback on this remediation session..."
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReviewingSession(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingSessionReview}
                  className="px-5 py-2 bg-emerald-900 hover:bg-emerald-800 text-yellow-300 font-extrabold rounded-xl text-xs cursor-pointer"
                >
                  {isSavingSessionReview ? 'Saving...' : 'Save Log Evaluation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 3: MOV & ASSESSMENT TOOL RUBRIC EVALUATOR                   */}
      {/* ================================================================= */}
      {evaluatingMovItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-6 max-h-[92vh] flex flex-col">
            <div className="bg-emerald-950 text-white p-5 flex items-center justify-between border-b border-emerald-800">
              <div>
                <p className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                  Means of Verification (MOV) Rubric Evaluation
                </p>
                <h3 className="text-base font-extrabold text-white mt-0.5">
                  {evaluatingMovItem.mov.caption || evaluatingMovItem.mov.name}
                </h3>
                <p className="text-xs text-emerald-200">
                  Learner: {evaluatingMovItem.session.studentName} · Teacher: {evaluatingMovItem.teacherName} · {evaluatingMovItem.session.date}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEvaluatingMovItem(null)}
                className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMovEvaluation} className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Left Column: MOV Visual Preview */}
                <div className="space-y-3">
                  <div className="w-full h-64 bg-slate-100 rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center relative">
                    {evaluatingMovItem.mov.dataUrl ? (
                      <img
                        src={evaluatingMovItem.mov.dataUrl}
                        alt={evaluatingMovItem.mov.caption}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain bg-slate-900/5"
                      />
                    ) : (
                      <div className="text-center p-6 text-slate-400">
                        <FileText className="w-12 h-12 mx-auto mb-2" />
                        <p className="font-bold text-slate-600">{evaluatingMovItem.mov.name}</p>
                      </div>
                    )}
                  </div>

                  {evaluatingMovItem.mov.dataUrl && onViewMOV && (
                    <button
                      type="button"
                      onClick={() =>
                        onViewMOV(
                          evaluatingMovItem.mov.dataUrl,
                          evaluatingMovItem.mov.caption || evaluatingMovItem.mov.name
                        )
                      }
                      className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition cursor-pointer"
                    >
                      Open Fullscreen Image Inspector
                    </button>
                  )}

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <p className="font-bold text-slate-800">
                      Competency: {evaluatingMovItem.session.focusCompetency}
                    </p>
                    <p className="text-slate-600">
                      Session Score: <strong className="font-mono">{evaluatingMovItem.session.rawScore}/{evaluatingMovItem.session.totalItems || 20} ({evaluatingMovItem.session.score}%)</strong>
                    </p>
                    <p className="text-slate-600 italic">
                      "{evaluatingMovItem.session.remarks}"
                    </p>
                  </div>
                </div>

                {/* Right Column: DepEd MOV Quality Rubric & Evaluation Controls */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block font-extrabold text-slate-900">
                      DepEd MOV Verification Rubric Criteria
                    </label>

                    <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={movRubric.alignedWithCompetency}
                        onChange={(e) =>
                          setMovRubric((prev) => ({
                            ...prev,
                            alignedWithCompetency: e.target.checked,
                          }))
                        }
                        className="mt-0.5 w-4 h-4 accent-emerald-800 rounded cursor-pointer"
                      />
                      <div>
                        <p className="font-bold text-slate-900">
                          1. Aligned with Focus Competency
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Activity sheet or photo directly addresses the target least-mastered skill.
                        </p>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={movRubric.authenticLearnerOutput}
                        onChange={(e) =>
                          setMovRubric((prev) => ({
                            ...prev,
                            authenticLearnerOutput: e.target.checked,
                          }))
                        }
                        className="mt-0.5 w-4 h-4 accent-emerald-800 rounded cursor-pointer"
                      />
                      <div>
                        <p className="font-bold text-slate-900">
                          2. Authentic Learner Output / Participation
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Demonstrates actual student performance, checked LAS, or coaching session.
                        </p>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={movRubric.clearDocumentation}
                        onChange={(e) =>
                          setMovRubric((prev) => ({
                            ...prev,
                            clearDocumentation: e.target.checked,
                          }))
                        }
                        className="mt-0.5 w-4 h-4 accent-emerald-800 rounded cursor-pointer"
                      />
                      <div>
                        <p className="font-bold text-slate-900">
                          3. Clear Documentation & Caption
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Evidence is legible and properly labeled for SDO / department audit.
                        </p>
                      </div>
                    </label>
                  </div>

                  <div>
                    <label className="block font-extrabold text-slate-900 mb-1.5">
                      MOV Evaluation Decision
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['Verified', 'Exemplary', 'Needs Revision', 'Pending'] as const).map(
                        (st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setMovEvalStatus(st)}
                            className={`py-2 px-3 rounded-xl font-bold text-xs border transition cursor-pointer ${
                              movEvalStatus === st
                                ? 'bg-emerald-900 text-yellow-300 border-emerald-800'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {st}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block font-extrabold text-slate-900">
                      Evaluation Notes / Feedback
                    </label>
                    <div className="flex flex-wrap gap-1 mb-1">
                      {MOV_EVALUATION_TEMPLATES.map((tpl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setMovEvalNotes(tpl)}
                          className="px-2 py-1 bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-900 rounded text-[10px] border border-slate-200 cursor-pointer text-left"
                        >
                          + {tpl.slice(0, 44)}...
                        </button>
                      ))}
                    </div>
                    <textarea
                      rows={3}
                      value={movEvalNotes}
                      onChange={(e) => setMovEvalNotes(e.target.value)}
                      placeholder="Enter evaluation remarks for this MOV attachment..."
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEvaluatingMovItem(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingMovEval}
                  className="px-5 py-2 bg-emerald-900 hover:bg-emerald-800 text-yellow-300 font-extrabold rounded-xl text-xs cursor-pointer"
                >
                  {isSavingMovEval ? 'Saving...' : 'Save MOV Evaluation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 4: CONFIGURE HEAD TEACHER SUBJECT / SPECIALIZATION          */}
      {/* ================================================================= */}
      {isConfigSpecOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden my-6">
            <div className="bg-emerald-950 text-white p-5 flex items-center justify-between border-b border-emerald-800">
              <div>
                <p className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                  Head Teacher Supervision Scope
                </p>
                <h3 className="text-base font-extrabold text-white mt-0.5">
                  Configure Monitored Subject / Specialization
                </h3>
                <p className="text-xs text-emerald-200">
                  Your account will strictly monitor teachers, learners, logs, and MOVs under the selected specializations.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsConfigSpecOpen(false)}
                className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHtSpecialization} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-extrabold text-slate-800 mb-1.5">
                  Active Monitored Subject / Specialization Areas ({htSpecList.length})
                </label>
                <div className="flex flex-wrap gap-1.5 min-h-[38px] p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  {htSpecList.map((spec) => (
                    <span
                      key={spec}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-900 text-yellow-300 font-bold rounded-lg text-xs"
                    >
                      {spec}
                      <button
                        type="button"
                        onClick={() => setHtSpecList((prev) => prev.filter((s) => s !== spec))}
                        className="text-emerald-200 hover:text-white cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                  {htSpecList.length === 0 && (
                    <span className="text-slate-400 italic">
                      Select one or more specializations below...
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Click to Toggle Official Subject / Specialization Areas:
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-1">
                  {PRESET_SPECIALIZATION_AREAS.map((preset) => {
                    const isSelected = htSpecList.includes(preset);
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setHtSpecList((prev) => prev.filter((s) => s !== preset));
                          } else {
                            setHtSpecList((prev) => [...prev, preset]);
                          }
                        }}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? 'bg-emerald-100 text-emerald-950 border-emerald-500 font-extrabold'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-emerald-700" />}
                        <span>{preset}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={htCustomSpecInput}
                  onChange={(e) => setHtCustomSpecInput(e.target.value)}
                  placeholder="Or type custom Subject / Specialization (e.g. ICT - CSS)..."
                  className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
                <button
                  type="button"
                  onClick={() => {
                    const clean = htCustomSpecInput.trim();
                    if (clean && !htSpecList.includes(clean)) {
                      setHtSpecList((prev) => [...prev, clean]);
                      setHtCustomSpecInput('');
                    }
                  }}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsConfigSpecOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingHtSpec}
                  className="px-5 py-2 bg-emerald-900 hover:bg-emerald-800 text-yellow-300 font-extrabold rounded-xl text-xs cursor-pointer"
                >
                  {isSavingHtSpec ? 'Saving Scope...' : 'Save Monitored Specialization'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 5: ASSIGN / EDIT TEACHER SUBJECT / SPECIALIZATION           */}
      {/* ================================================================= */}
      {assigningTeacherSpec && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden my-6">
            <div className="bg-emerald-950 text-white p-5 flex items-center justify-between border-b border-emerald-800">
              <div>
                <p className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                  Faculty Subject / Specialization Assignment
                </p>
                <h3 className="text-base font-extrabold text-white mt-0.5">
                  {assigningTeacherSpec.name}
                </h3>
                <p className="text-xs text-emerald-200 font-mono">
                  {assigningTeacherSpec.title} · {assigningTeacherSpec.email}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAssigningTeacherSpec(null)}
                className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTeacherSpec} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-extrabold text-slate-800 mb-1.5">
                  Assigned Subject / Specialization ({teacherSpecList.length})
                </label>
                <div className="flex flex-wrap gap-1.5 min-h-[38px] p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  {teacherSpecList.map((spec) => (
                    <span
                      key={spec}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-900 text-yellow-300 font-bold rounded-lg text-xs"
                    >
                      {spec}
                      <button
                        type="button"
                        onClick={() => setTeacherSpecList((prev) => prev.filter((s) => s !== spec))}
                        className="text-emerald-200 hover:text-white cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                  {teacherSpecList.length === 0 && (
                    <span className="text-slate-400 italic">
                      No Subject / Specialization assigned.
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Select Subject / Specialization Areas:
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-1">
                  {PRESET_SPECIALIZATION_AREAS.map((preset) => {
                    const isSelected = teacherSpecList.includes(preset);
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setTeacherSpecList((prev) => prev.filter((s) => s !== preset));
                          } else {
                            setTeacherSpecList((prev) => [...prev, preset]);
                          }
                        }}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? 'bg-emerald-100 text-emerald-950 border-emerald-500 font-extrabold'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-emerald-700" />}
                        <span>{preset}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={teacherCustomSpecInput}
                  onChange={(e) => setTeacherCustomSpecInput(e.target.value)}
                  placeholder="Or type custom Subject / Specialization..."
                  className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
                <button
                  type="button"
                  onClick={() => {
                    const clean = teacherCustomSpecInput.trim();
                    if (clean && !teacherSpecList.includes(clean)) {
                      setTeacherSpecList((prev) => [...prev, clean]);
                      setTeacherCustomSpecInput('');
                    }
                  }}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setAssigningTeacherSpec(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingTeacherSpec}
                  className="px-5 py-2 bg-emerald-900 hover:bg-emerald-800 text-yellow-300 font-extrabold rounded-xl text-xs cursor-pointer"
                >
                  {isSavingTeacherSpec ? 'Saving...' : 'Save Teacher Specialization'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
