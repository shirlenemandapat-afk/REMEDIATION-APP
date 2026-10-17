import React, { useState, useMemo, useEffect } from 'react';
import {
  Student,
  SessionRecord,
  TeacherProfile,
  interpretMasteryLevel,
} from '../types';
import { storage } from '../services/storage';
import { SchoolLogo } from './SchoolLogo';
import { KagawaranNgEdukasyonLogo, BagongPilipinasLogo } from './DepEdOfficialLogos';
import {
  Building2,
  TrendingUp,
  Users,
  Award,
  BookOpen,
  Filter,
  CheckCircle2,
  Clock,
  Printer,
  RefreshCw,
  Search,
  Sparkles,
  BarChart3,
  Calendar,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Eye,
  X,
  FileText,
  UserCheck,
  Target,
  GraduationCap,
  Activity,
  Compass,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend,
  Cell,
  PieChart,
  Pie,
} from 'recharts';

export type SchoolHeadTab =
  | 'overview'
  | 'enrollment'
  | 'subjects'
  | 'teachers'
  | 'sessions'
  | 'progress'
  | 'interventions';

interface SchoolHeadDashboardProps {
  currentPrincipal?: TeacherProfile;
  students: Student[];
  sessions: SessionRecord[];
  onRefreshData?: () => void;
  onSelectStudent?: (student: Student) => void;
  onShowToast?: (message: string, type?: 'success' | 'info' | 'warning') => void;
  onBackToAdmin?: () => void;
}

export const SchoolHeadDashboard: React.FC<SchoolHeadDashboardProps> = ({
  currentPrincipal,
  students: propStudents,
  sessions: propSessions,
  onRefreshData,
  onSelectStudent,
  onShowToast,
  onBackToAdmin,
}) => {
  // Live local state updated in real-time
  const [liveStudents, setLiveStudents] = useState<Student[]>(() =>
    propStudents.length > 0 ? propStudents : storage.getAllStudents()
  );
  const [liveSessions, setLiveSessions] = useState<SessionRecord[]>(() =>
    propSessions.length > 0 ? propSessions : storage.getAllSessions()
  );
  const [teachers, setTeachers] = useState<TeacherProfile[]>(() => storage.getAllTeachers());

  const [activeTab, setActiveTab] = useState<SchoolHeadTab>('overview');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  // Filters
  const [selectedProgram, setSelectedProgram] = useState<string>('ALL');
  const [selectedGrade, setSelectedGrade] = useState<string>('ALL');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Keep live data synchronized with parent props and background events
  useEffect(() => {
    if (propStudents && propStudents.length > 0) {
      setLiveStudents(propStudents);
    }
  }, [propStudents]);

  useEffect(() => {
    if (propSessions && propSessions.length > 0) {
      setLiveSessions(propSessions);
    }
  }, [propSessions]);

  // Real-Time auto-listener for live multi-device data updates
  useEffect(() => {
    const handleSyncEvent = () => {
      setLiveStudents(storage.getAllStudents());
      setLiveSessions(storage.getAllSessions());
      setTeachers(storage.getAllTeachers());
      setLastSyncTime(new Date());
    };

    window.addEventListener('deped-data-synced', handleSyncEvent);
    const interval = setInterval(handleSyncEvent, 6000);

    return () => {
      window.removeEventListener('deped-data-synced', handleSyncEvent);
      clearInterval(interval);
    };
  }, []);

  const handleManualRefresh = async () => {
    setIsSyncing(true);
    try {
      if (onRefreshData) onRefreshData();
      await storage.syncFromServer();
      setLiveStudents(storage.getAllStudents());
      setLiveSessions(storage.getAllSessions());
      setTeachers(storage.getAllTeachers());
      setLastSyncTime(new Date());
      if (onShowToast) onShowToast('School-wide remediation analytics updated.', 'success');
    } catch {
      // offline fallback
    } finally {
      setIsSyncing(false);
    }
  };

  // Distinct Filter Option Lists
  const availableGrades = useMemo(() => {
    const set = new Set<string>();
    liveStudents.forEach((s) => {
      if (s.gradeLevel) set.add(s.gradeLevel.trim());
    });
    return Array.from(set).sort();
  }, [liveStudents]);

  const availableSubjects = useMemo(() => {
    const set = new Set<string>();
    liveStudents.forEach((s) => {
      if (s.subject) set.add(s.subject.trim());
    });
    liveSessions.forEach((sess) => {
      if (sess.subject) set.add(sess.subject.trim());
    });
    return Array.from(set).sort();
  }, [liveStudents, liveSessions]);

  // Filtered Students and Sessions
  const filteredStudents = useMemo(() => {
    return liveStudents.filter((s) => {
      if (selectedProgram !== 'ALL' && s.programType !== selectedProgram) return false;
      if (selectedGrade !== 'ALL' && s.gradeLevel !== selectedGrade) return false;
      if (selectedSubject !== 'ALL' && s.subject !== selectedSubject) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
        const lrn = (s.lrn || '').toLowerCase();
        const subj = (s.subject || '').toLowerCase();
        const sec = (s.section || '').toLowerCase();
        if (!fullName.includes(q) && !lrn.includes(q) && !subj.includes(q) && !sec.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [liveStudents, selectedProgram, selectedGrade, selectedSubject, searchQuery]);

  const filteredStudentIdSet = useMemo(() => {
    return new Set(filteredStudents.map((s) => s.id));
  }, [filteredStudents]);

  const filteredSessions = useMemo(() => {
    return liveSessions.filter((sess) => {
      if (!filteredStudentIdSet.has(sess.studentId)) return false;
      if (selectedProgram !== 'ALL' && sess.programType !== selectedProgram) return false;
      if (selectedGrade !== 'ALL' && sess.gradeLevel !== selectedGrade) return false;
      if (selectedSubject !== 'ALL' && sess.subject !== selectedSubject) return false;
      return true;
    });
  }, [liveSessions, filteredStudentIdSet, selectedProgram, selectedGrade, selectedSubject]);

  // Map student latest scores
  const studentLatestScoreMap = useMemo(() => {
    const map = new Map<string, number>();
    liveStudents.forEach((st) => {
      const studentSessions = liveSessions
        .filter((sess) => sess.studentId === st.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const latestScore = studentSessions.length > 0 ? studentSessions[0].score : st.baselineScore;
      map.set(st.id, latestScore);
    });
    return map;
  }, [liveStudents, liveSessions]);

  // Core KPI Calculations
  const metrics = useMemo(() => {
    const totalEnrolled = filteredStudents.length;
    const remediationCount = filteredStudents.filter((s) => s.programType === 'Remediation').length;
    const skillsCount = filteredStudents.filter((s) => s.programType === 'Skills Enhancement').length;

    const totalSessions = filteredSessions.length;
    const avgSessionsPerLearner =
      totalEnrolled > 0 ? (totalSessions / totalEnrolled).toFixed(1) : '0';

    const baselineSum = filteredStudents.reduce((acc, s) => acc + (s.baselineScore || 0), 0);
    const avgBaseline = totalEnrolled > 0 ? Math.round(baselineSum / totalEnrolled) : 0;

    let currentSum = 0;
    filteredStudents.forEach((s) => {
      currentSum += studentLatestScoreMap.get(s.id) ?? s.baselineScore;
    });
    const avgCurrent = totalEnrolled > 0 ? Math.round(currentSum / totalEnrolled) : 0;
    const avgGain = avgCurrent - avgBaseline;

    // Passing & Mastery rate (DepEd standard >= 75%)
    const passedCount = filteredStudents.filter((s) => {
      const score = studentLatestScoreMap.get(s.id) ?? s.baselineScore;
      return score >= 75;
    }).length;
    const passingRate = totalEnrolled > 0 ? Math.round((passedCount / totalEnrolled) * 100) : 0;

    // High Growth count (gain >= 15 pts)
    const highGrowthCount = filteredStudents.filter((s) => {
      const current = studentLatestScoreMap.get(s.id) ?? s.baselineScore;
      return current - s.baselineScore >= 15;
    }).length;

    // Active participating teachers in remediation
    const activeTeacherEmailSet = new Set<string>();
    filteredSessions.forEach((sess) => {
      if (sess.teacherEmail) activeTeacherEmailSet.add(sess.teacherEmail.toLowerCase().trim());
    });
    filteredStudents.forEach((st) => {
      if (st.teacherEmail) activeTeacherEmailSet.add(st.teacherEmail.toLowerCase().trim());
    });
    const participatingTeachersCount = activeTeacherEmailSet.size;

    // MOV Documentation rate
    const sessionsWithMOV = filteredSessions.filter((s) => (s.movs && s.movs.length > 0) || s.assessmentTool).length;
    const movComplianceRate = totalSessions > 0 ? Math.round((sessionsWithMOV / totalSessions) * 100) : 0;

    return {
      totalEnrolled,
      remediationCount,
      skillsCount,
      totalSessions,
      avgSessionsPerLearner,
      avgBaseline,
      avgCurrent,
      avgGain,
      passedCount,
      passingRate,
      highGrowthCount,
      participatingTeachersCount,
      movComplianceRate,
    };
  }, [filteredStudents, filteredSessions, studentLatestScoreMap]);

  // --- CHART 1: Longitudinal Progress Timeline ---
  const longitudinalTimelineData = useMemo(() => {
    const datesMap = new Map<string, { totalScore: number; count: number }>();
    const sorted = [...filteredSessions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    sorted.forEach((sess) => {
      const existing = datesMap.get(sess.date) || { totalScore: 0, count: 0 };
      datesMap.set(sess.date, {
        totalScore: existing.totalScore + sess.score,
        count: existing.count + 1,
      });
    });

    return Array.from(datesMap.entries()).map(([date, val]) => ({
      date: date.length > 5 ? date.substring(5) : date,
      fullDate: date,
      averageScore: Math.round(val.totalScore / val.count),
      sessionVolume: val.count,
      baselineBenchmark: metrics.avgBaseline,
      targetBenchmark: 75,
    }));
  }, [filteredSessions, metrics.avgBaseline]);

  // --- CHART 2: Mastery Level Distribution ---
  const masteryBracketData = useMemo(() => {
    let advanced = 0;
    let closelyApprox = 0;
    let moving = 0;
    let average = 0;
    let low = 0;

    filteredStudents.forEach((st) => {
      const score = studentLatestScoreMap.get(st.id) ?? st.baselineScore;
      if (score >= 96) advanced++;
      else if (score >= 85) closelyApprox++;
      else if (score >= 75) moving++;
      else if (score >= 50) average++;
      else low++;
    });

    return [
      { name: 'Advanced Mastery (96-100%)', count: advanced, fill: '#047857' },
      { name: 'Approximating Mastery (85-95%)', count: closelyApprox, fill: '#059669' },
      { name: 'Moving Towards Mastery (75-84%)', count: moving, fill: '#2563eb' },
      { name: 'Average Mastery (50-74%)', count: average, fill: '#d97706' },
      { name: 'Low / Needs Support (<50%)', count: low, fill: '#dc2626' },
    ];
  }, [filteredStudents, studentLatestScoreMap]);

  // --- STUDENT ENROLLMENT & DEMOGRAPHICS DATA ---
  const enrollmentBreakdownData = useMemo(() => {
    const gradeMap = new Map<string, { grade: string; total: number; remediation: number; skills: number }>();
    const sectionMap = new Map<
      string,
      {
        section: string;
        gradeLevel: string;
        total: number;
        remediation: number;
        skills: number;
        baselineSum: number;
        currentSum: number;
        subjects: Set<string>;
      }
    >();

    filteredStudents.forEach((st) => {
      const g = st.gradeLevel || 'Grade 7';
      const sec = st.section || 'General';
      const subj = (st.subject || 'General TLE').trim();
      const isRem = st.programType === 'Remediation';
      const curScore = studentLatestScoreMap.get(st.id) ?? st.baselineScore;

      // Grade
      const gEntry = gradeMap.get(g) || { grade: g, total: 0, remediation: 0, skills: 0 };
      gEntry.total++;
      if (isRem) gEntry.remediation++;
      else gEntry.skills++;
      gradeMap.set(g, gEntry);

      // Section
      const secKey = `${g} - ${sec}`;
      const secEntry =
        sectionMap.get(secKey) || {
          section: sec,
          gradeLevel: g,
          total: 0,
          remediation: 0,
          skills: 0,
          baselineSum: 0,
          currentSum: 0,
          subjects: new Set<string>(),
        };
      secEntry.total++;
      if (isRem) secEntry.remediation++;
      else secEntry.skills++;
      secEntry.baselineSum += st.baselineScore || 0;
      secEntry.currentSum += curScore;
      secEntry.subjects.add(subj);
      sectionMap.set(secKey, secEntry);
    });

    const gradesList = Array.from(gradeMap.values()).sort((a, b) => a.grade.localeCompare(b.grade));
    const sectionsList = Array.from(sectionMap.values())
      .map((e) => ({
        ...e,
        avgBaseline: e.total > 0 ? Math.round(e.baselineSum / e.total) : 0,
        avgCurrent: e.total > 0 ? Math.round(e.currentSum / e.total) : 0,
        gain: e.total > 0 ? Math.round(e.currentSum / e.total) - Math.round(e.baselineSum / e.total) : 0,
        subjectList: Array.from(e.subjects).join(', '),
      }))
      .sort((a, b) => b.total - a.total);

    return {
      gradesList,
      sectionsList,
      totalEnrolled: filteredStudents.length,
      remediationCount: filteredStudents.filter((s) => s.programType === 'Remediation').length,
      skillsCount: filteredStudents.filter((s) => s.programType === 'Skills Enhancement').length,
      activeSectionsCount: sectionsList.length,
      activeGradesCount: gradesList.length,
    };
  }, [filteredStudents, studentLatestScoreMap]);

  // --- SUBJECT AREA PERFORMANCE DATA ---
  const subjectPerformanceList = useMemo(() => {
    const map = new Map<
      string,
      {
        subject: string;
        students: Student[];
        sessions: SessionRecord[];
      }
    >();

    filteredStudents.forEach((st) => {
      const subj = (st.subject || 'General TLE').trim();
      const entry = map.get(subj) || { subject: subj, students: [], sessions: [] };
      entry.students.push(st);
      map.set(subj, entry);
    });

    filteredSessions.forEach((sess) => {
      const subj = (sess.subject || 'General TLE').trim();
      const entry = map.get(subj) || { subject: subj, students: [], sessions: [] };
      entry.sessions.push(sess);
      map.set(subj, entry);
    });

    return Array.from(map.values())
      .map(({ subject, students: stList, sessions: sessList }) => {
        const studentCount = stList.length;
        const sessionCount = sessList.length;

        const baselineAvg =
          studentCount > 0
            ? Math.round(stList.reduce((acc, s) => acc + (s.baselineScore || 0), 0) / studentCount)
            : 0;

        let currentSum = 0;
        stList.forEach((s) => {
          currentSum += studentLatestScoreMap.get(s.id) ?? s.baselineScore;
        });
        const currentAvg = studentCount > 0 ? Math.round(currentSum / studentCount) : baselineAvg;
        const gain = currentAvg - baselineAvg;

        const passedCount = stList.filter((s) => {
          const score = studentLatestScoreMap.get(s.id) ?? s.baselineScore;
          return score >= 75;
        }).length;
        const passRate = studentCount > 0 ? Math.round((passedCount / studentCount) * 100) : 0;

        return {
          subject,
          studentCount,
          sessionCount,
          baselineAvg,
          currentAvg,
          gain,
          passRate,
        };
      })
      .sort((a, b) => b.studentCount - a.studentCount);
  }, [filteredStudents, filteredSessions, studentLatestScoreMap]);

  // --- FACULTY PARTICIPATION DATA ---
  const facultyParticipationList = useMemo(() => {
    const teachingTeachers = teachers.filter((t) => t.role !== 'admin' && t.role !== 'school_head');
    const teacherMap = new Map<string, TeacherProfile>();
    teachingTeachers.forEach((t) => teacherMap.set(t.email.toLowerCase().trim(), t));

    // Also include any teacher who logged sessions but isn't in teachers array
    filteredSessions.forEach((s) => {
      if (s.teacherEmail) {
        const em = s.teacherEmail.toLowerCase().trim();
        if (!teacherMap.has(em)) {
          teacherMap.set(em, {
            email: em,
            name: s.teacherEmail.split('@')[0].replace(/[._]/g, ' ').toUpperCase(),
            title: 'Teacher',
            isPasswordSet: true,
            schoolName: 'Ramon Magsaysay (Cubao) High School',
            division: 'SDO Quezon City • TLE Department',
            region: 'National Capital Region (NCR)',
            academicYear: '2026-2027',
          });
        }
      }
    });

    return Array.from(teacherMap.values()).map((t) => {
      const email = t.email.toLowerCase().trim();
      const teacherStudents = liveStudents.filter(
        (st) => (st.teacherEmail || '').toLowerCase().trim() === email
      );
      const teacherSessions = liveSessions.filter(
        (sess) => (sess.teacherEmail || '').toLowerCase().trim() === email
      );

      const latestSessionDate =
        teacherSessions.length > 0
          ? teacherSessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date
          : null;

      let learnerCurrentSum = 0;
      teacherStudents.forEach((st) => {
        learnerCurrentSum += studentLatestScoreMap.get(st.id) ?? st.baselineScore;
      });
      const avgLearnerMastery =
        teacherStudents.length > 0
          ? Math.round(learnerCurrentSum / teacherStudents.length)
          : teacherSessions.length > 0
          ? Math.round(teacherSessions.reduce((acc, s) => acc + s.score, 0) / teacherSessions.length)
          : 0;

      const movCount = teacherSessions.filter(
        (s) => (s.movs && s.movs.length > 0) || s.assessmentTool
      ).length;
      const movRate = teacherSessions.length > 0 ? Math.round((movCount / teacherSessions.length) * 100) : 0;

      let activityStatus: 'Active & Consistent' | 'Progressing' | 'No Sessions Logged' = 'No Sessions Logged';
      if (teacherSessions.length >= 8) activityStatus = 'Active & Consistent';
      else if (teacherSessions.length > 0) activityStatus = 'Progressing';

      return {
        email: t.email,
        name: t.name,
        title: t.title || 'Teacher I',
        specialization: (t.assignedSubjects && t.assignedSubjects.length > 0 ? t.assignedSubjects.join(', ') : t.specialization) || 'TLE General',
        learnerCount: teacherStudents.length,
        sessionCount: teacherSessions.length,
        latestSessionDate,
        avgLearnerMastery,
        movRate,
        activityStatus,
      };
    }).sort((a, b) => b.sessionCount - a.sessionCount);
  }, [teachers, liveStudents, liveSessions, filteredSessions, studentLatestScoreMap]);

  // --- INTERVENTION STRATEGY EFFECTIVENESS DATA ---
  const strategyEffectivenessList = useMemo(() => {
    const strategyMap = new Map<
      string,
      { strategy: string; count: number; totalScore: number; totalGain: number; gainCount: number }
    >();

    const studentBaselineMap = new Map<string, number>();
    liveStudents.forEach((s) => studentBaselineMap.set(s.id, s.baselineScore || 0));

    filteredSessions.forEach((sess) => {
      const strategies =
        Array.isArray(sess.interventions) && sess.interventions.length > 0
          ? sess.interventions
          : [sess.intervention || 'General Remediation'];

      const stBaseline = studentBaselineMap.get(sess.studentId) ?? 50;
      const sessionGain = sess.score - stBaseline;

      strategies.forEach((strat) => {
        if (!strat) return;
        const entry = strategyMap.get(strat) || {
          strategy: strat,
          count: 0,
          totalScore: 0,
          totalGain: 0,
          gainCount: 0,
        };
        entry.count++;
        entry.totalScore += sess.score;
        entry.totalGain += sessionGain;
        entry.gainCount++;
        strategyMap.set(strat, entry);
      });
    });

    return Array.from(strategyMap.values())
      .map(({ strategy, count, totalScore, totalGain, gainCount }) => ({
        strategy,
        count,
        avgScore: count > 0 ? Math.round(totalScore / count) : 0,
        avgGain: gainCount > 0 ? Math.round((totalGain / gainCount) * 10) / 10 : 0,
      }))
      .sort((a, b) => b.avgGain - a.avgGain);
  }, [filteredSessions, liveStudents]);

  return (
    <div className="space-y-6 pb-12 selection:bg-blue-100 selection:text-blue-950 font-sans">
      
      {/* ============================================================== */}
      {/* 1. INSTITUTIONAL EXECUTIVE HEADER & READ-ONLY NOTICE          */}
      {/* ============================================================== */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-xl border border-blue-900/40 relative overflow-hidden">
        {/* Soft Gold Institutional Highlight Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 relative z-10">
          <div className="flex items-start sm:items-center gap-3.5 sm:gap-4.5 min-w-0">
            <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-2xl bg-white/10 p-1.5 border border-white/20 shadow-md backdrop-blur-xs flex items-center justify-center">
              <SchoolLogo size="md" showShadow={false} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-amber-300">
                  OFFICE OF THE SCHOOL HEAD / PRINCIPAL
                </span>
                <span className="text-[10px] text-white/60">·</span>
                <span className="text-[10px] font-bold text-blue-200">
                  SDO Quezon City
                </span>
                <span className="text-[10px] text-white/60">·</span>
                <span className="text-[10px] font-bold text-amber-300/90">
                  S.Y. 2026-2027
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5 font-serif">
                Project S.M.I.L.E. School-Wide Analytics & Monitoring Portal
              </h1>
              <p className="text-xs sm:text-sm text-blue-100/90 font-medium max-w-3xl mt-0.5">
                Executive supervisory dashboard for monitoring student remediation progress, curriculum learning area gains, and faculty participation across Ramon Magsaysay (Cubao) High School.
              </p>
            </div>
          </div>

          {/* Executive Action Controls & Live Status */}
          <div className="flex items-center gap-2.5 flex-wrap shrink-0 w-full sm:w-auto justify-end">
            {/* Live Real-Time Heartbeat Indicator */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-900/70 border border-blue-400/30 text-xs font-medium text-blue-200">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>Live Real-Time Sync</span>
              <span className="text-white/40">·</span>
              <span className="text-[11px] text-blue-300 font-mono">
                {lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isSyncing}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1.5 border border-white/20 cursor-pointer"
              title="Refresh School Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-300 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Refresh'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowPrintModal(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 text-xs font-extrabold transition flex items-center gap-1.5 shadow-md shadow-amber-950/20 active:scale-95 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-950" />
              <span>Print Executive Summary</span>
            </button>

            {onBackToAdmin && (
              <button
                type="button"
                onClick={onBackToAdmin}
                className="px-3.5 py-2 rounded-xl bg-purple-900/80 hover:bg-purple-800 text-yellow-300 text-xs font-bold transition flex items-center gap-1.5 border border-purple-500/50 cursor-pointer"
                title="Return to System Administrator Console"
              >
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                <span>Admin Console</span>
              </button>
            )}
          </div>
        </div>

        {/* Read-Only Safeguard Banner */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-blue-200/80 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold text-white">
              Read-Only Executive Monitoring Mode:
            </span>
            <span>
              All remediation logs, scores, and faculty records are loaded transparently for administrative evaluation without editing privileges.
            </span>
          </div>
          <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">
            Attested: {currentPrincipal?.name || 'JOSEPHINE M. MANINGAS, PhD'} · Secondary School Principal IV
          </span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. EXECUTIVE SCORECARD: TOP-LEVEL KPI METRICS                  */}
      {/* ============================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* KPI 1: Total Enrolled Remediation Learners */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Enrolled Learners</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono">
            {metrics.totalEnrolled}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <span>{metrics.remediationCount} Remediation</span>
            <span>·</span>
            <span>{metrics.skillsCount} Skills</span>
          </div>
        </div>

        {/* KPI 2: Total Remediation Sessions Completed */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Sessions Logged</span>
            <Calendar className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono">
            {metrics.totalSessions}
          </div>
          <div className="text-[11px] text-slate-500">
            <span>{metrics.avgSessionsPerLearner} avg sessions / learner</span>
          </div>
        </div>

        {/* KPI 3: School-Wide Current Mastery Rate */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Current Mastery</span>
            <Target className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono">
            {metrics.avgCurrent}%
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <span>Baseline: {metrics.avgBaseline}%</span>
            <span>·</span>
            <span className={`font-bold ${metrics.avgGain >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {metrics.avgGain >= 0 ? `+${metrics.avgGain}%` : `${metrics.avgGain}%`}
            </span>
          </div>
        </div>

        {/* KPI 4: Passing / Competency Attainment Rate */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Passed Rate (≥75%)</span>
            <Award className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono">
            {metrics.passingRate}%
          </div>
          <div className="text-[11px] text-slate-500">
            <span>{metrics.passedCount} of {metrics.totalEnrolled} met passing grade</span>
          </div>
        </div>

        {/* KPI 5: Faculty Remediation Participation */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Active Faculty</span>
            <UserCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono">
            {metrics.participatingTeachersCount}
          </div>
          <div className="text-[11px] text-slate-500">
            <span>Across all learning areas</span>
          </div>
        </div>

        {/* KPI 6: Authentic MOV Compliance */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>MOV Documentation</span>
            <FileText className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono">
            {metrics.movComplianceRate}%
          </div>
          <div className="text-[11px] text-slate-500">
            <span>Sessions with verified artifacts</span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. EXECUTIVE FILTER BAR & SEARCH                               */}
      {/* ============================================================== */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="font-bold text-slate-700 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-blue-700" />
            Filters:
          </span>

          {/* Program Type Filter */}
          <select
            value={selectedProgram}
            onChange={(e) => setSelectedProgram(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
          >
            <option value="ALL">All Programs</option>
            <option value="Remediation">Remediation Only</option>
            <option value="Skills Enhancement">Skills Enhancement Only</option>
          </select>

          {/* Grade Level Filter */}
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
          >
            <option value="ALL">All Grade Levels</option>
            {availableGrades.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>

          {/* Learning Area Filter */}
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer max-w-[220px] truncate"
          >
            <option value="ALL">All Learning Areas</option>
            {availableSubjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {(selectedProgram !== 'ALL' || selectedGrade !== 'ALL' || selectedSubject !== 'ALL' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setSelectedProgram('ALL');
                setSelectedGrade('ALL');
                setSelectedSubject('ALL');
                setSearchQuery('');
              }}
              className="text-xs font-semibold text-blue-700 hover:text-blue-900 underline ml-1 cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Global Search Input */}
        <div className="relative min-w-[220px] w-full sm:w-auto">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search learner, subject, section..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. EXECUTIVE NAVIGATION TABS                                   */}
      {/* ============================================================== */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 overflow-x-auto pb-1 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeTab === 'overview'
              ? 'border-blue-700 text-blue-900 font-extrabold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-blue-700" />
          <span>School-Wide Analytics</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('enrollment')}
          className={`px-4 py-2.5 font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeTab === 'enrollment'
              ? 'border-blue-700 text-blue-900 font-extrabold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Users className="w-4 h-4 text-blue-700" />
          <span>Student Enrollment ({filteredStudents.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('subjects')}
          className={`px-4 py-2.5 font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeTab === 'subjects'
              ? 'border-blue-700 text-blue-900 font-extrabold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <BookOpen className="w-4 h-4 text-blue-700" />
          <span>Subject-Area Performance ({subjectPerformanceList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('teachers')}
          className={`px-4 py-2.5 font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeTab === 'teachers'
              ? 'border-blue-700 text-blue-900 font-extrabold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <UserCheck className="w-4 h-4 text-blue-700" />
          <span>Teacher Participation ({facultyParticipationList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sessions')}
          className={`px-4 py-2.5 font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeTab === 'sessions'
              ? 'border-blue-700 text-blue-900 font-extrabold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Calendar className="w-4 h-4 text-blue-700" />
          <span>Session Logs & Frequency ({filteredSessions.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('progress')}
          className={`px-4 py-2.5 font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeTab === 'progress'
              ? 'border-blue-700 text-blue-900 font-extrabold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <GraduationCap className="w-4 h-4 text-blue-700" />
          <span>Learner Progress Roster ({filteredStudents.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('interventions')}
          className={`px-4 py-2.5 font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeTab === 'interventions'
              ? 'border-blue-700 text-blue-900 font-extrabold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Activity className="w-4 h-4 text-blue-700" />
          <span>Intervention Effectiveness</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* 5. TAB 1: SCHOOL-WIDE ANALYTICS OVERVIEW                      */}
      {/* ============================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Dual Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Chart A: Longitudinal Mastery Progression Trend */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    School-Wide Remediation Mastery Trajectory
                  </h3>
                  <p className="text-xs text-slate-500">
                    Average learner score across session dates vs. DepEd passing benchmark (75%)
                  </p>
                </div>
                <div className="text-xs text-slate-500 font-mono">
                  Current Avg: <span className="font-bold text-slate-900">{metrics.avgCurrent}%</span>
                </div>
              </div>

              <div className="h-64 w-full pt-2">
                {longitudinalTimelineData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={longitudinalTimelineData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
                      <YAxis domain={[30, 100]} tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="averageScore"
                        name="Average Mastery Score"
                        stroke="#2563eb"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#2563eb' }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="baselineBenchmark"
                        name="Initial Baseline"
                        stroke="#94a3b8"
                        strokeDasharray="4 4"
                        strokeWidth={1.5}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="targetBenchmark"
                        name="DepEd Benchmark (75%)"
                        stroke="#059669"
                        strokeDasharray="5 5"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    No timeline session logs recorded yet.
                  </div>
                )}
              </div>
            </div>

            {/* Chart B: DepEd Mastery Level Breakdown */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    DepEd Mastery Level Distribution
                  </h3>
                  <p className="text-xs text-slate-500">
                    Learner distribution across DepEd proficiency categories
                  </p>
                </div>
                <div className="text-xs text-slate-500 font-mono">
                  Total: <span className="font-bold text-slate-900">{metrics.totalEnrolled}</span>
                </div>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={masteryBracketData} layout="vertical" margin={{ left: 20, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
                    <YAxis dataKey="name" type="category" width={160} tick={{ fontSize: 10, fill: '#334155' }} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                    />
                    <Bar dataKey="count" name="Learner Count" radius={[0, 6, 6, 0]}>
                      {masteryBracketData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Executive Insights & Institutional Observation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50/60 border border-blue-200/70 p-4 rounded-2xl space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                <TrendingUp className="w-4 h-4 text-blue-700" />
                <span>Overall Learning Trajectory</span>
              </div>
              <p className="text-xs text-blue-950 leading-relaxed">
                School-wide average learner scores rose from a baseline of <strong>{metrics.avgBaseline}%</strong> to <strong>{metrics.avgCurrent}%</strong> ({metrics.avgGain >= 0 ? `+${metrics.avgGain}%` : `${metrics.avgGain}%`} net gain). <strong>{metrics.passingRate}%</strong> of enrolled learners have already crossed the DepEd passing threshold (75%).
              </p>
            </div>

            <div className="bg-emerald-50/60 border border-emerald-200/70 p-4 rounded-2xl space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>Supervisory & MOV Compliance</span>
              </div>
              <p className="text-xs text-emerald-950 leading-relaxed">
                <strong>{metrics.movComplianceRate}%</strong> of conducted sessions feature authentic evidence (checked LAS, score rubrics, and project photos). Department heads review teacher logs continuously.
              </p>
            </div>

            <div className="bg-amber-50/60 border border-amber-200/70 p-4 rounded-2xl space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                <Compass className="w-4 h-4 text-amber-700" />
                <span>Faculty Mobilization</span>
              </div>
              <p className="text-xs text-amber-950 leading-relaxed">
                <strong>{metrics.participatingTeachersCount} faculty members</strong> are actively conducting remedial drills across TLE specializations, with an average of <strong>{metrics.avgSessionsPerLearner} sessions</strong> completed per learner.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5B. TAB 2: STUDENT ENROLLMENT & DEMOGRAPHICS                   */}
      {/* ============================================================== */}
      {activeTab === 'enrollment' && (
        <div className="space-y-6">
          {/* Enrollment KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="text-slate-500 text-xs font-medium flex items-center justify-between">
                <span>Total Enrolled</span>
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-3xl font-black text-slate-900 font-mono">
                {enrollmentBreakdownData.totalEnrolled}
              </div>
              <div className="text-[11px] text-slate-500">
                Learners in Project S.M.I.L.E.
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="text-slate-500 text-xs font-medium flex items-center justify-between">
                <span>Remediation Track</span>
                <Target className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-3xl font-black text-amber-600 font-mono">
                {enrollmentBreakdownData.remediationCount}
              </div>
              <div className="text-[11px] text-slate-500">
                {enrollmentBreakdownData.totalEnrolled > 0
                  ? Math.round((enrollmentBreakdownData.remediationCount / enrollmentBreakdownData.totalEnrolled) * 100)
                  : 0}
                % of enrolled cohort
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="text-slate-500 text-xs font-medium flex items-center justify-between">
                <span>Skills Enhancement</span>
                <Award className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-3xl font-black text-emerald-600 font-mono">
                {enrollmentBreakdownData.skillsCount}
              </div>
              <div className="text-[11px] text-slate-500">
                {enrollmentBreakdownData.totalEnrolled > 0
                  ? Math.round((enrollmentBreakdownData.skillsCount / enrollmentBreakdownData.totalEnrolled) * 100)
                  : 0}
                % advanced mastery track
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="text-slate-500 text-xs font-medium flex items-center justify-between">
                <span>Active Sections</span>
                <Layers className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-3xl font-black text-indigo-900 font-mono">
                {enrollmentBreakdownData.activeSectionsCount}
              </div>
              <div className="text-[11px] text-slate-500">
                Across {enrollmentBreakdownData.activeGradesCount} grade levels
              </div>
            </div>
          </div>

          {/* Enrollment Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Grade Level Enrollment Breakdown */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Enrollment Distribution by Grade Level
                  </h3>
                  <p className="text-xs text-slate-500">
                    Remediation vs Skills Enhancement learner headcount
                  </p>
                </div>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={enrollmentBreakdownData.gradesList} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="grade" tick={{ fontSize: 11, fill: '#475569' }} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="remediation" name="Remediation" fill="#d97706" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="skills" name="Skills Enhancement" fill="#059669" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Top Class Sections by Enrolled Learners */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Class Section Enrollment Volume
                  </h3>
                  <p className="text-xs text-slate-500">
                    Participating class sections ranked by learner caseload
                  </p>
                </div>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={enrollmentBreakdownData.sectionsList.slice(0, 8)}
                    layout="vertical"
                    margin={{ left: 25, right: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
                    <YAxis dataKey="section" type="category" width={110} tick={{ fontSize: 10, fill: '#334155' }} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                    <Bar dataKey="total" name="Enrolled Learners" fill="#2563eb" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Section Enrollment Summary Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Class Section Enrollment & Performance Register
                </h4>
                <p className="text-[11px] text-slate-500">
                  School-wide learner headcount, program allocation, and diagnostic baselines per section
                </p>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {enrollmentBreakdownData.sectionsList.length} Active Sections
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Grade Level & Section</th>
                    <th className="py-3 px-3 text-center">Total Enrolled</th>
                    <th className="py-3 px-3 text-center">Remediation</th>
                    <th className="py-3 px-3 text-center">Skills Enhancement</th>
                    <th className="py-3 px-3 text-center">Baseline Avg</th>
                    <th className="py-3 px-3 text-center">Current Avg</th>
                    <th className="py-3 px-3 text-center">Net Gain</th>
                    <th className="py-3 px-4">Learning Area(s)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {enrollmentBreakdownData.sectionsList.map((sec) => (
                    <tr key={`${sec.gradeLevel}-${sec.section}`} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {sec.gradeLevel} - {sec.section}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-900">
                        {sec.total}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-amber-700 font-semibold">
                        {sec.remediation}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-emerald-700 font-semibold">
                        {sec.skills}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-500">
                        {sec.avgBaseline}%
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-900">
                        {sec.avgCurrent}%
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold">
                        <span className={sec.gain >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                          {sec.gain >= 0 ? `+${sec.gain}%` : `${sec.gain}%`}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-[220px] truncate" title={sec.subjectList}>
                        {sec.subjectList}
                      </td>
                    </tr>
                  ))}
                  {enrollmentBreakdownData.sectionsList.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No enrolled sections found matching criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 6. TAB 3: SUBJECT-AREA PERFORMANCE (LEARNING AREAS)           */}
      {/* ============================================================== */}
      {activeTab === 'subjects' && (
        <div className="space-y-6">
          {/* Comparative Subject Chart */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Learning Area / Specialization Performance Comparison
                </h3>
                <p className="text-xs text-slate-500">
                  Initial Diagnostic Baseline vs. Current Remediation Score across subject specializations
                </p>
              </div>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectPerformanceList} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="subject" tick={{ fontSize: 10, fill: '#475569' }} interval={0} angle={-25} textAnchor="end" />
                  <YAxis domain={[30, 100]} tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="baselineAvg" name="Baseline Score (%)" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="currentAvg" name="Current Mastery (%)" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Subject Performance Summary Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Subject-Area Remediation Summary
              </h4>
              <span className="text-xs text-slate-500">
                {subjectPerformanceList.length} Learning Areas Recorded
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Learning Area / Subject</th>
                    <th className="py-3 px-3 text-center">Enrolled</th>
                    <th className="py-3 px-3 text-center">Sessions Logged</th>
                    <th className="py-3 px-3 text-center">Baseline Avg</th>
                    <th className="py-3 px-3 text-center">Current Avg</th>
                    <th className="py-3 px-3 text-center">Net Gain</th>
                    <th className="py-3 px-3 text-center">Passing Rate (≥75%)</th>
                    <th className="py-3 px-4 text-center">Outcome Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subjectPerformanceList.map((row) => (
                    <tr key={row.subject} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {row.subject}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-700">
                        {row.studentCount}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-700">
                        {row.sessionCount}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-500">
                        {row.baselineAvg}%
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-900">
                        {row.currentAvg}%
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold">
                        <span className={row.gain >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                          {row.gain >= 0 ? `+${row.gain}%` : `${row.gain}%`}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-900">
                        {row.passRate}%
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                          row.passRate >= 80
                            ? 'bg-emerald-50 text-emerald-800'
                            : row.passRate >= 60
                            ? 'bg-blue-50 text-blue-800'
                            : 'bg-amber-50 text-amber-800'
                        }`}>
                          {row.passRate >= 80 ? 'Exemplary Attainment' : row.passRate >= 60 ? 'Progressing Well' : 'Ongoing Support Needed'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {subjectPerformanceList.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No subject data found matching current filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 7. TAB 3: TEACHER PARTICIPATION & FACULTY ENGAGEMENT          */}
      {/* ============================================================== */}
      {activeTab === 'teachers' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Faculty Remediation Participation & Accountability Tracker
                </h4>
                <p className="text-[11px] text-slate-500">
                  Read-only supervisory log tracking session completion, learner caseload, and verified artifact submissions per faculty member
                </p>
              </div>
              <span className="text-xs text-slate-500">
                {facultyParticipationList.length} Teachers Active
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Faculty Member</th>
                    <th className="py-3 px-3">Subject / Specialization</th>
                    <th className="py-3 px-3 text-center">Learners</th>
                    <th className="py-3 px-3 text-center">Sessions Logged</th>
                    <th className="py-3 px-3 text-center">Last Session Date</th>
                    <th className="py-3 px-3 text-center">Learner Avg Mastery</th>
                    <th className="py-3 px-3 text-center">MOV Compliance</th>
                    <th className="py-3 px-4 text-center">Faculty Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {facultyParticipationList.map((t) => (
                    <tr key={t.email} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{t.name}</div>
                        <div className="text-[11px] text-slate-500">{t.title} · {t.email}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-700 font-medium">
                        {t.specialization}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-semibold text-slate-800">
                        {t.learnerCount}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-blue-900">
                        {t.sessionCount}
                      </td>
                      <td className="py-3 px-3 text-center text-slate-600 font-mono text-[11px]">
                        {t.latestSessionDate || '—'}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-900">
                        {t.avgLearnerMastery > 0 ? `${t.avgLearnerMastery}%` : '—'}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-700">
                        {t.sessionCount > 0 ? `${t.movRate}%` : '—'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.activityStatus === 'Active & Consistent'
                            ? 'bg-emerald-50 text-emerald-800'
                            : t.activityStatus === 'Progressing'
                            ? 'bg-blue-50 text-blue-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {t.activityStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {facultyParticipationList.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No faculty records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 8. TAB 4: REMEDIATION SESSION FREQUENCY & LOGS                 */}
      {/* ============================================================== */}
      {activeTab === 'sessions' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  School-Wide Anecdotal & Remedial Session Register
                </h4>
                <p className="text-[11px] text-slate-500">
                  Chronological record of conducted remediation and skills enhancement interventions
                </p>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {filteredSessions.length} Sessions Logged
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-3">Student Learner</th>
                    <th className="py-3 px-3">Grade & Section</th>
                    <th className="py-3 px-3">Learning Area</th>
                    <th className="py-3 px-3">Conducting Teacher</th>
                    <th className="py-3 px-4">Focus Competency</th>
                    <th className="py-3 px-3 text-center">Score</th>
                    <th className="py-3 px-3 text-center">Mastery Level</th>
                    <th className="py-3 px-3 text-center">MOV</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {filteredSessions.slice(0, 100).map((sess) => {
                    const mastery = interpretMasteryLevel(sess.score);
                    return (
                      <tr key={sess.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                          {sess.date}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900">
                          {sess.studentName}
                        </td>
                        <td className="py-3 px-3 text-slate-700 whitespace-nowrap">
                          {sess.gradeLevel} - {sess.section}
                        </td>
                        <td className="py-3 px-3 text-slate-700 font-medium whitespace-nowrap">
                          {sess.subject}
                        </td>
                        <td className="py-3 px-3 text-slate-600 truncate max-w-[140px]">
                          {sess.teacherEmail || 'Faculty'}
                        </td>
                        <td className="py-3 px-4 text-slate-800 max-w-[200px] truncate" title={sess.focusCompetency}>
                          {sess.focusCompetency}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-900">
                          {sess.score}%
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                            sess.score >= 85
                              ? 'bg-emerald-50 text-emerald-800'
                              : sess.score >= 75
                              ? 'bg-blue-50 text-blue-800'
                              : 'bg-amber-50 text-amber-800'
                          }`}>
                            {mastery.level}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-slate-500">
                          {sess.movs && sess.movs.length > 0 ? (
                            <span className="text-emerald-700 font-bold">Yes ({sess.movs.length})</span>
                          ) : sess.assessmentTool ? (
                            <span className="text-blue-700 font-bold">LAS</span>
                          ) : (
                            <span>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredSessions.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        No session logs found matching current filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 9. TAB 5: LEARNER PROGRESS ROSTER                              */}
      {/* ============================================================== */}
      {activeTab === 'progress' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Learner Progress & Outcome Roster
                </h4>
                <p className="text-[11px] text-slate-500">
                  Read-only student monitoring register tracking baseline diagnostic to current mastery progression
                </p>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {filteredStudents.length} Students Monitored
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">LRN</th>
                    <th className="py-3 px-3">Student Name</th>
                    <th className="py-3 px-3">Grade & Section</th>
                    <th className="py-3 px-3">Learning Area</th>
                    <th className="py-3 px-3">Program</th>
                    <th className="py-3 px-3 text-center">Baseline</th>
                    <th className="py-3 px-3 text-center">Current Score</th>
                    <th className="py-3 px-3 text-center">Net Gain</th>
                    <th className="py-3 px-3 text-center">Mastery Status</th>
                    <th className="py-3 px-4">Assigned Faculty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((st) => {
                    const currentScore = studentLatestScoreMap.get(st.id) ?? st.baselineScore;
                    const gain = currentScore - st.baselineScore;
                    return (
                      <tr
                        key={st.id}
                        onClick={() => onSelectStudent && onSelectStudent(st)}
                        className={`hover:bg-blue-50/50 transition ${onSelectStudent ? 'cursor-pointer' : ''}`}
                      >
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                          {st.lrn || '—'}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900">
                          {st.lastName}, {st.firstName} {st.middleInitial ? `${st.middleInitial}.` : ''}
                        </td>
                        <td className="py-3 px-3 text-slate-700 whitespace-nowrap">
                          {st.gradeLevel} - {st.section}
                        </td>
                        <td className="py-3 px-3 text-slate-700 font-medium whitespace-nowrap">
                          {st.subject}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                            st.programType === 'Skills Enhancement'
                              ? 'bg-amber-50 text-amber-900'
                              : 'bg-blue-50 text-blue-900'
                          }`}>
                            {st.programType}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-slate-500">
                          {st.baselineScore}%
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-900">
                          {currentScore}%
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold">
                          <span className={gain >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                            {gain >= 0 ? `+${gain}%` : `${gain}%`}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                            currentScore >= 85
                              ? 'bg-emerald-50 text-emerald-800'
                              : currentScore >= 75
                              ? 'bg-teal-50 text-teal-800'
                              : currentScore >= 60
                              ? 'bg-blue-50 text-blue-800'
                              : 'bg-rose-50 text-rose-800'
                          }`}>
                            {st.status || 'Progressing'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 truncate max-w-[140px]">
                          {st.teacherEmail || 'Department Faculty'}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-400">
                        No learners found matching current filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 10. TAB 6: INTERVENTION STRATEGY EFFECTIVENESS                 */}
      {/* ============================================================== */}
      {activeTab === 'interventions' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                DepEd Remediation Intervention Strategy Efficacy Ranking
              </h3>
              <p className="text-xs text-slate-500">
                Evaluation of pedagogical intervention strategies by average learner score improvement (+Δ%)
              </p>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={strategyEffectivenessList} layout="vertical" margin={{ left: 30, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
                  <YAxis dataKey="strategy" type="category" width={180} tick={{ fontSize: 10, fill: '#334155' }} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                  />
                  <Bar dataKey="avgGain" name="Average Gain (+pts)" fill="#059669" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Strategy Details Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Intervention Strategy Application Breakdown
              </h4>
              <span className="text-xs text-slate-500">
                {strategyEffectivenessList.length} Strategies Applied
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Intervention Strategy</th>
                    <th className="py-3 px-3 text-center">Times Utilized</th>
                    <th className="py-3 px-3 text-center">Average Session Score</th>
                    <th className="py-3 px-3 text-center">Average Learner Gain</th>
                    <th className="py-3 px-4">Pedagogical Recommendation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {strategyEffectivenessList.map((st) => (
                    <tr key={st.strategy} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {st.strategy}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-700">
                        {st.count}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-900">
                        {st.avgScore}%
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-emerald-700">
                        +{st.avgGain}%
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-[11px]">
                        {st.avgGain >= 15
                          ? 'Highly Effective: Recommend school-wide dissemination and faculty peer sharing.'
                          : st.avgGain >= 8
                          ? 'Consistent Efficacy: Suitable for regular small-group guided remedial tasks.'
                          : 'Supplemental: Best paired with concrete manipulative tools and visual aids.'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 11. PRINTABLE OFFICIAL EXECUTIVE SUMMARY MODAL                */}
      {/* ============================================================== */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 my-8 max-h-[90vh] overflow-y-auto print:p-0 print:border-none print:shadow-none">
            
            {/* Modal Header Controls (Hidden on print) */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 print:hidden">
              <div className="flex items-center gap-2 text-slate-900">
                <Building2 className="w-5 h-5 text-blue-900" />
                <h3 className="font-extrabold text-base">Executive Institutional Summary</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Report</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Official DepEd Header */}
            <div className="text-center space-y-1">
              <div className="flex justify-center items-center gap-4 mb-2">
                <KagawaranNgEdukasyonLogo size={60} showShadow={false} />
                <SchoolLogo size="sm" showShadow={false} />
                <BagongPilipinasLogo size={60} showShadow={false} />
              </div>
              <p className="text-xs font-serif text-slate-700">Republic of the Philippines · Department of Education</p>
              <p className="text-xs font-bold text-slate-800 uppercase">National Capital Region · Schools Division of Quezon City</p>
              <h2 className="text-base font-extrabold uppercase text-slate-950 font-serif">
                RAMON MAGSAYSAY (CUBAO) HIGH SCHOOL
              </h2>
              <p className="text-xs font-semibold text-slate-600">
                OFFICE OF THE SCHOOL HEAD / PRINCIPAL
              </p>
              <div className="inline-block mt-1 px-3 py-0.5 bg-blue-50 border border-blue-200 rounded text-xs font-extrabold text-blue-900">
                EXECUTIVE INSTITUTIONAL REMEDIATION & LEARNING ENHANCEMENT SUMMARY (S.Y. 2026-2027)
              </div>
            </div>

            {/* Core Statistical Summary Grid */}
            <div className="grid grid-cols-3 gap-3 border border-slate-200 p-4 rounded-xl text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Total Monitored Learners:</span>
                <span className="font-black text-slate-900 text-lg font-mono">{metrics.totalEnrolled}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Remediation Sessions Completed:</span>
                <span className="font-black text-slate-900 text-lg font-mono">{metrics.totalSessions}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Overall Mastery Attainment:</span>
                <span className="font-black text-emerald-800 text-lg font-mono">{metrics.avgCurrent}% (gain: +{metrics.avgGain}%)</span>
              </div>
            </div>

            {/* Subject Area Performance Table */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-slate-900 uppercase">
                Learning Area Mastery Accomplishment
              </h5>
              <table className="w-full text-left text-xs border border-slate-200 divide-y divide-slate-200">
                <thead className="bg-slate-50 font-bold text-slate-700 text-[11px]">
                  <tr>
                    <th className="p-2">Subject / Learning Area</th>
                    <th className="p-2 text-center">Learners</th>
                    <th className="p-2 text-center">Sessions</th>
                    <th className="p-2 text-center">Baseline</th>
                    <th className="p-2 text-center">Current Mastery</th>
                    <th className="p-2 text-center">Gain</th>
                    <th className="p-2 text-center">Passing Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subjectPerformanceList.map((s) => (
                    <tr key={s.subject}>
                      <td className="p-2 font-medium text-slate-900">{s.subject}</td>
                      <td className="p-2 text-center font-mono">{s.studentCount}</td>
                      <td className="p-2 text-center font-mono">{s.sessionCount}</td>
                      <td className="p-2 text-center font-mono">{s.baselineAvg}%</td>
                      <td className="p-2 text-center font-mono font-bold">{s.currentAvg}%</td>
                      <td className="p-2 text-center font-mono font-bold text-emerald-800">+{s.gain}%</td>
                      <td className="p-2 text-center font-mono font-bold">{s.passRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Official DepEd Signatories */}
            <div className="pt-6 border-t border-slate-200 grid grid-cols-3 gap-6 text-center text-xs">
              <div>
                <p className="text-[11px] text-slate-500 mb-6">Prepared by:</p>
                <p className="font-bold text-slate-900 uppercase">MELANI R. SANTOS, PhD</p>
                <p className="text-[10px] text-slate-600">Head Teacher VI / TLE Department</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-500 mb-6">Attested by:</p>
                <p className="font-bold text-slate-900 uppercase">SHIRLENE M. MANDAPAT</p>
                <p className="text-[10px] text-slate-600">Master Teacher I / TLE Subject Coordinator</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-500 mb-6">Approved & Certified:</p>
                <p className="font-bold text-slate-900 uppercase">
                  {currentPrincipal?.name || 'JOSEPHINE M. MANINGAS, PhD'}
                </p>
                <p className="text-[10px] text-slate-600">
                  {currentPrincipal?.title || 'Secondary School Principal IV'}
                </p>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
