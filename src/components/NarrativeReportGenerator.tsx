import React, { useState, useEffect } from 'react';
import { Student, SessionRecord, TeacherProfile, interpretMasteryLevel } from '../types';
import { SchoolLogo } from './SchoolLogo';
import { DepEdDocHeader, DepEdDocFooter } from './DepEdDocHeaderFooter';
import { safePrintDocument, downloadPDFDocument } from '../utils/printHelper';
import {
  Printer,
  Copy,
  Download,
  FileCheck2,
  Filter,
  Sparkles,
  Check,
  School,
  ShieldCheck,
  UserCheck,
  BookOpen,
  Layers,
  Loader2,
  X,
  Award,
  Image as ImageIcon,
  Calendar,
  MapPin,
  Users,
  Edit3,
  CheckCircle2,
  FileText,
  Upload,
  Plus,
  Trash2,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import { IndividualAnecdotalReportModal } from './IndividualAnecdotalReportModal';

interface NarrativeReportGeneratorProps {
  teacher: TeacherProfile;
  students: Student[];
  sessions: SessionRecord[];
  sectionsList: string[];
  isHeadTeacherReport?: boolean;
  supervisedTeachers?: TeacherProfile[];
  subjectSpecialization?: string;
}

type DocumentViewTab =
  | 'NARRATIVE_REPORT' // Formal Paragraph / Prose Narrative Report (NOT A TABLE)
  | 'CERTIFICATE_RECOMPUTED' // Certificate of Recomputed Grade Consolidated (Page 1)
  | 'CERTIFICATE_INDIVIDUAL' // Individual Student Certificate (Page 2)
  | 'PHOTO_DOCUMENTATION' // Photo / Documentation Annex with PTC (Pages 5-6)
  | 'ACCOMPLISHMENT_TABLE'; // DepEd A-H Accomplishment Table (Pages 3-4)

interface DocumentationPhoto {
  id: string;
  url: string;
  caption: string;
  category: 'REMEDIAL_SESSION' | 'PTC_CONFERENCE' | 'LAS_ACTIVITY' | 'LAB_WORK';
}

export const NarrativeReportGenerator: React.FC<NarrativeReportGeneratorProps> = ({
  teacher,
  students,
  sessions,
  sectionsList,
  isHeadTeacherReport = false,
  supervisedTeachers = [],
  subjectSpecialization = 'TLE',
}) => {
  const isHTMode = isHeadTeacherReport || teacher.role === 'head_teacher';

  const [activeTab, setActiveTab] = useState<DocumentViewTab>('NARRATIVE_REPORT');
  const [selectedSection, setSelectedSection] = useState<string>('ALL');

  // Program Type Switch: Remediation vs Skills Enhancement vs Combined
  const [programType, setProgramType] = useState<'Remediation' | 'Skills Enhancement' | 'Combined'>(
    'Remediation'
  );

  const [schoolYear, setSchoolYear] = useState<string>(teacher.academicYear || '2025 – 2026');
  const [quarterPeriod, setQuarterPeriod] = useState<string>('First Quarter');

  // Signatories
  const [teacherName, setTeacherName] = useState<string>(
    teacher.name || 'SHIRLENE MANDAPAT – TINDOC'
  );
  const [teacherPosition, setTeacherPosition] = useState<string>(
    teacher.title || 'Grade 10 - ICT Teacher'
  );
  const [headTeacherName, setHeadTeacherName] = useState<string>(
    isHTMode ? teacher.name || 'MELANI R. SANTOS' : teacher.headTeacherName || 'MELANI R. SANTOS'
  );
  const [headTeacherPosition, setHeadTeacherPosition] = useState<string>(
    isHTMode
      ? teacher.title
        ? `${teacher.title}${teacher.title.toLowerCase().includes('tle') ? '' : ', TLE Department'}`
        : 'Head Teacher VI, TLE Department'
      : teacher.headTeacherPosition || 'Head Teacher VI, TLE Dept.'
  );
  const [principalName, setPrincipalName] = useState<string>(
    teacher.principalName || 'JOSEPHINE M. MANINGAS, PhD'
  );
  const [principalPosition, setPrincipalPosition] = useState<string>(
    teacher.principalPosition || 'Principal IV'
  );

  // General Report Metadata
  const [reportDates, setReportDates] = useState<string>('September 2 to September 3, 2025');
  const [reportVenue, setReportVenue] = useState<string>(
    isHTMode ? 'TLE Laboratories & Designated Classrooms' : 'ICT Room (RM 9)'
  );

  // Photo Documentation State
  const [docPhotos, setDocPhotos] = useState<DocumentationPhoto[]>([]);
  const [ptcPhotoUrl, setPtcPhotoUrl] = useState<string | null>(null);
  const [ptcDate, setPtcDate] = useState<string>('September 6, 2025');

  // Selected Student for Individual Certificate
  const [selectedIndividualStudent, setSelectedIndividualStudent] = useState<Student | null>(null);

  // Export / Print states
  const [copied, setCopied] = useState<boolean>(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);

  const showFeedback = (text: string, type: 'success' | 'error') => {
    setFeedbackMessage({ text, type });
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 5000);
  };

  // Sync state if teacher profile updates in settings
  useEffect(() => {
    if (teacher.name) setTeacherName(teacher.name);
    if (teacher.title) setTeacherPosition(teacher.title);
    if (isHTMode) {
      if (teacher.name) setHeadTeacherName(teacher.name);
      if (teacher.title) {
        setHeadTeacherPosition(
          teacher.title.toLowerCase().includes('tle')
            ? teacher.title
            : `${teacher.title}, TLE Department`
        );
      }
    } else {
      if (teacher.headTeacherName) setHeadTeacherName(teacher.headTeacherName);
      if (teacher.headTeacherPosition) setHeadTeacherPosition(teacher.headTeacherPosition);
    }
    if (teacher.principalName) setPrincipalName(teacher.principalName);
    if (teacher.principalPosition) setPrincipalPosition(teacher.principalPosition);
    if (teacher.academicYear) setSchoolYear(teacher.academicYear);
  }, [teacher, isHTMode]);

  // Lookup map of supervised teachers by email
  const teacherByEmailMap = React.useMemo(() => {
    const map = new Map<string, TeacherProfile>();
    supervisedTeachers.forEach((t) => {
      if (t.email) {
        map.set(t.email.toLowerCase().trim(), t);
      }
    });
    return map;
  }, [supervisedTeachers]);

  const getStudentTeacherProfile = (s: Student): TeacherProfile | undefined => {
    const email = (s.teacherEmail || (s as any).teacher_email || '').toLowerCase().trim();
    return email ? teacherByEmailMap.get(email) : undefined;
  };

  // Program counts across all students (before program filter)
  const totalRemediationStudentsAll = students.filter(
    (s) => (s.programType || 'Remediation') === 'Remediation'
  ).length;
  const totalEnhancementStudentsAll = students.filter(
    (s) => s.programType === 'Skills Enhancement'
  ).length;

  // Filter Data according to Program Type and Section
  const filteredStudents = students.filter((s) => {
    const matchSec =
      selectedSection === 'ALL' ||
      s.section === selectedSection ||
      `${s.gradeLevel} - ${s.section}` === selectedSection;
    const sProg = s.programType || 'Remediation';
    const matchProg = programType === 'Combined' || sProg === programType;
    return matchSec && matchProg;
  });

  const filteredStudentIds = new Set(filteredStudents.map((s) => String(s.id)));

  const filteredSessions = sessions
    .filter((sess) => filteredStudentIds.has(String(sess.studentId)))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Derive all uploaded MOVs from sessions
  useEffect(() => {
    const sessionMovs = filteredSessions.flatMap((s) => {
      const stud = filteredStudents.find((st) => String(st.id) === String(s.studentId));
      const tProf = stud ? getStudentTeacherProfile(stud) : undefined;
      const tName = tProf?.name || s.teacherEmail || '';
      return (s.movs || []).map((m, idx) => ({
        id: `mov-${s.id}-${m.id || idx}`,
        url: m.dataUrl,
        caption: isHTMode
          ? `${m.caption || m.name || 'Session Verification Photo'} — Learner: ${
              s.studentName || (stud ? `${stud.lastName}, ${stud.firstName}` : 'Student')
            }${tName ? ` (Conducted by ${tName})` : ''}`
          : m.caption || m.name || 'Session Verification Photo',
        category: 'REMEDIAL_SESSION' as const,
      }));
    });
    if (sessionMovs.length > 0) {
      setDocPhotos((prev) => {
        const customOnes = prev.filter((p) => p.id.startsWith('custom-photo-'));
        const existingIds = new Set(customOnes.map((p) => p.id));
        const dedupedSessionMovs = sessionMovs.filter((c) => {
          if (!c.url || existingIds.has(c.id)) return false;
          existingIds.add(c.id);
          return true;
        });
        return [...customOnes, ...dedupedSessionMovs];
      });
    }
  }, [filteredSessions.length, programType, selectedSection, isHTMode]);

  // Set default individual student if null
  useEffect(() => {
    if (!selectedIndividualStudent && filteredStudents.length > 0) {
      setSelectedIndividualStudent(filteredStudents[0]);
    } else if (
      filteredStudents.length > 0 &&
      !filteredStudents.some((s) => s.id === selectedIndividualStudent?.id)
    ) {
      setSelectedIndividualStudent(filteredStudents[0]);
    }
  }, [filteredStudents, selectedIndividualStudent]);

  // Calculate Breakdown by Section (e.g., Grade 10–Aguho (13 students) and Grade 10–Almaciga (5 students))
  const sectionCountsMap = new Map<string, number>();
  filteredStudents.forEach((s) => {
    const secKey = `${s.gradeLevel}–${s.section}`;
    sectionCountsMap.set(secKey, (sectionCountsMap.get(secKey) || 0) + 1);
  });

  const sectionBreakdownText = Array.from(sectionCountsMap.entries())
    .map(([sec, count]) => `${sec} (${count} student${count > 1 ? 's' : ''})`)
    .join(', ');

  const totalStudents = filteredStudents.length;
  const totalSessions = filteredSessions.length;

  // Students who attended sessions
  const attendedStudentsCount = filteredStudents.filter((s) =>
    filteredSessions.some((sess) => String(sess.studentId) === String(s.id))
  ).length;
  const actualParticipantsCount = attendedStudentsCount > 0 ? attendedStudentsCount : totalStudents;

  // Compute Statistics
  const avgBaseline =
    totalStudents > 0
      ? Math.round(filteredStudents.reduce((acc, s) => acc + s.baselineScore, 0) / totalStudents)
      : 0;

  // Calculate per-student average mastery & recomputed grades (including conducting teacher info)
  const studentMasteryStats = filteredStudents.map((s) => {
    const sSessions = sessions
      .filter((sess) => String(sess.studentId) === String(s.id))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const sessionScores = sSessions.map((sess) => sess.score);
    const avgStudentMastery =
      sessionScores.length > 0
        ? Math.round(sessionScores.reduce((sum, sc) => sum + sc, 0) / sessionScores.length)
        : s.baselineScore;
    const latestScore =
      sessionScores.length > 0 ? sessionScores[sessionScores.length - 1] : s.baselineScore;

    // DepEd Recomputation Rule: Initial failing grade (70-74) upgraded to 75 if passing remediation
    const isPassing =
      latestScore >= 75 || s.status === 'Mastered / Promoted' || avgStudentMastery >= 75;
    const recomputedGrade = isPassing ? 75 : Math.max(s.baselineScore, latestScore);

    const conductingTeacher = getStudentTeacherProfile(s);
    const teacherEmailNorm = (s.teacherEmail || (s as any).teacher_email || '')
      .toLowerCase()
      .trim();

    return {
      student: s,
      conductingTeacher,
      conductingTeacherName:
        conductingTeacher?.name || s.teacherEmail || teacherName || 'TLE Faculty',
      conductingTeacherTitle: conductingTeacher?.title || 'TLE Subject Teacher',
      conductingTeacherEmail: teacherEmailNorm,
      sessionsCount: sSessions.length,
      baseline: s.baselineScore,
      latest: latestScore,
      avgMastery: avgStudentMastery,
      recomputedGrade,
      masteryLevel: interpretMasteryLevel(avgStudentMastery),
    };
  });

  const overallAvgMastery =
    studentMasteryStats.length > 0
      ? Math.round(
          studentMasteryStats.reduce((acc, item) => acc + item.avgMastery, 0) /
            studentMasteryStats.length
        )
      : 0;

  const passedStudentsCount = studentMasteryStats.filter((item) => {
    if (programType === 'Remediation') return item.recomputedGrade >= 75;
    if (programType === 'Skills Enhancement') return item.avgMastery >= 85;
    return item.student.programType === 'Skills Enhancement'
      ? item.avgMastery >= 85
      : item.recomputedGrade >= 75;
  }).length;

  const passRatePercent =
    totalStudents > 0 ? Math.round((passedStudentsCount / totalStudents) * 100) : 100;

  // Extract unique least mastered / target skills across all filtered students and sessions
  const targetCompetencies = Array.from(
    new Set([
      ...filteredStudents.flatMap((s) => s.leastMasteredSkills || []),
      ...filteredSessions.map((sess) => sess.focusCompetency).filter(Boolean),
    ])
  );

  // Extract unique interventions implemented across all filtered sessions
  const implementedInterventionsList = Array.from(
    new Set(
      filteredSessions.flatMap((sess) =>
        [...(sess.interventions || []), sess.intervention, ...(sess.activityTypes || []), sess.activityType].filter(
          Boolean
        )
      )
    )
  );

  // Head Teacher Whole-Program Per-Teacher & Student Cohort Aggregation
  const teacherProgramBreakdown = React.useMemo(() => {
    const map = new Map<
      string,
      {
        teacher: TeacherProfile | null;
        teacherName: string;
        teacherTitle: string;
        teacherEmail: string;
        subjects: Set<string>;
        sections: Set<string>;
        studentStats: typeof studentMasteryStats;
        sessions: SessionRecord[];
        verifiedSessionsCount: number;
        movCount: number;
        competencies: Set<string>;
      }
    >();

    // Seed with supervised teachers so all department faculty can be accounted for
    supervisedTeachers.forEach((t) => {
      const emailNorm = (t.email || '').toLowerCase().trim();
      if (!emailNorm) return;
      map.set(emailNorm, {
        teacher: t,
        teacherName: t.name || emailNorm,
        teacherTitle: t.title || 'TLE Teacher',
        teacherEmail: emailNorm,
        subjects: new Set(
          [...(t.assignedSubjects || []), t.specialization].filter(Boolean) as string[]
        ),
        sections: new Set(),
        studentStats: [],
        sessions: [],
        verifiedSessionsCount: 0,
        movCount: 0,
        competencies: new Set(),
      });
    });

    // Populate with filtered students
    studentMasteryStats.forEach((stat) => {
      const emailKey = stat.conductingTeacherEmail || 'unassigned';
      if (!map.has(emailKey)) {
        map.set(emailKey, {
          teacher: stat.conductingTeacher || null,
          teacherName: stat.conductingTeacherName,
          teacherTitle: stat.conductingTeacherTitle,
          teacherEmail: emailKey,
          subjects: new Set(),
          sections: new Set(),
          studentStats: [],
          sessions: [],
          verifiedSessionsCount: 0,
          movCount: 0,
          competencies: new Set(),
        });
      }
      const entry = map.get(emailKey)!;
      entry.studentStats.push(stat);
      if (stat.student.subject) entry.subjects.add(stat.student.subject);
      if (stat.student.gradeLevel && stat.student.section) {
        entry.sections.add(`${stat.student.gradeLevel}–${stat.student.section}`);
      } else if (stat.student.section) {
        entry.sections.add(stat.student.section);
      }
      (stat.student.leastMasteredSkills || []).forEach((sk) => entry.competencies.add(sk));
    });

    // Populate with filtered sessions
    filteredSessions.forEach((sess) => {
      const studStat = studentMasteryStats.find(
        (st) => String(st.student.id) === String(sess.studentId)
      );
      const emailKey =
        (sess.teacherEmail || studStat?.conductingTeacherEmail || '').toLowerCase().trim() ||
        'unassigned';
      if (!map.has(emailKey)) {
        const tProf = teacherByEmailMap.get(emailKey);
        map.set(emailKey, {
          teacher: tProf || null,
          teacherName: tProf?.name || sess.teacherEmail || 'TLE Teacher',
          teacherTitle: tProf?.title || 'TLE Teacher',
          teacherEmail: emailKey,
          subjects: new Set(),
          sections: new Set(),
          studentStats: [],
          sessions: [],
          verifiedSessionsCount: 0,
          movCount: 0,
          competencies: new Set(),
        });
      }
      const entry = map.get(emailKey)!;
      entry.sessions.push(sess);
      if (sess.subject) entry.subjects.add(sess.subject);
      if (sess.focusCompetency) entry.competencies.add(sess.focusCompetency);
      if (sess.supervisoryStatus === 'Verified' || sess.supervisoryStatus === 'Exemplary') {
        entry.verifiedSessionsCount += 1;
      }
      const mCount =
        (sess.movs?.length || 0) +
        (sess.assessmentTool &&
        (!sess.movs || !sess.movs.some((m) => m.id === sess.assessmentTool?.id))
          ? 1
          : 0);
      entry.movCount += mCount;
    });

    return Array.from(map.values())
      .map((entry) => {
        const sCount = entry.studentStats.length;
        const avgBase =
          sCount > 0
            ? Math.round(
                entry.studentStats.reduce((sum, st) => sum + st.baseline, 0) / sCount
              )
            : 0;
        const avgMast =
          sCount > 0
            ? Math.round(
                entry.studentStats.reduce((sum, st) => sum + st.avgMastery, 0) / sCount
              )
            : 0;
        const passed = entry.studentStats.filter((st) => {
          if (programType === 'Remediation') return st.recomputedGrade >= 75;
          if (programType === 'Skills Enhancement') return st.avgMastery >= 85;
          return st.student.programType === 'Skills Enhancement'
            ? st.avgMastery >= 85
            : st.recomputedGrade >= 75;
        }).length;

        return {
          ...entry,
          subjectsList: Array.from(entry.subjects),
          sectionsList: Array.from(entry.sections),
          competenciesList: Array.from(entry.competencies),
          studentsCount: sCount,
          sessionsCount: entry.sessions.length,
          avgBaseline: avgBase,
          avgMastery: avgMast,
          passedCount: passed,
          passRate: sCount > 0 ? Math.round((passed / sCount) * 100) : 0,
        };
      })
      .sort((a, b) => b.studentsCount - a.studentsCount || b.sessionsCount - a.sessionsCount);
  }, [supervisedTeachers, studentMasteryStats, filteredSessions, programType, teacherByEmailMap]);

  // Teachers who have enrolled students or conducted sessions in the current program
  const activeImplementingTeachers = teacherProgramBreakdown.filter(
    (t) => t.studentsCount > 0 || t.sessionsCount > 0
  );
  const effectiveTeachersForReport =
    activeImplementingTeachers.length > 0 ? activeImplementingTeachers : teacherProgramBreakdown;

  const totalVerifiedSessionsCount = filteredSessions.filter(
    (s) => s.supervisoryStatus === 'Verified' || s.supervisoryStatus === 'Exemplary'
  ).length;

  const totalMovsSubmittedCount = filteredSessions.reduce((sum, s) => {
    const c =
      (s.movs?.length || 0) +
      (s.assessmentTool && (!s.movs || !s.movs.some((m) => m.id === s.assessmentTool?.id)) ? 1 : 0);
    return sum + c;
  }, 0);

  const handlePrint = () => {
    try {
      const docId = `printable-deped-doc-${activeTab}`;
      const prefix = isHTMode ? `RMCHS_HT_${subjectSpecialization}` : 'RMCHS';
      const filename = `${prefix}_${programType}_${activeTab}_SY${schoolYear.replace(/[^a-zA-Z0-9]/g, '_')}`;
      safePrintDocument(docId, filename, {
        pageSize: '8.5in 13in',
        pageMargin: '0.75in',
      });
    } catch (err) {
      showFeedback('Print dialog failed to open. You can use Download PDF instead.', 'error');
    }
  };

  const handleDownloadPDF = async () => {
    if (isDownloadingPDF) return;
    setIsDownloadingPDF(true);
    setFeedbackMessage(null);
    try {
      const docId = `printable-deped-doc-${activeTab}`;
      const prefix = isHTMode ? `RMCHS_HT_${subjectSpecialization}` : 'RMCHS';
      const filename = `${prefix}_${programType}_${activeTab}_SY${schoolYear.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const success = await downloadPDFDocument(docId, filename, {
        format: 'folio',
        orientation: 'portrait',
      });
      if (success) {
        showFeedback(
          'Official Document PDF (8.5" × 13" Long Bond) successfully downloaded!',
          'success'
        );
      } else {
        showFeedback('PDF generation issue. Click Print and select "Save as PDF".', 'error');
      }
    } catch (e) {
      console.error(e);
      showFeedback('Could not generate PDF. Please use Print -> Save as PDF.', 'error');
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  const handleCopyNarrativeText = () => {
    const el = document.getElementById('narrative-prose-content');
    if (!el) return;
    navigator.clipboard.writeText(el.innerText).then(() => {
      setCopied(true);
      showFeedback('Narrative report text copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 3000);
    });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const newPhoto: DocumentationPhoto = {
        id: `custom-photo-${Date.now()}`,
        url: dataUrl,
        caption: 'Program Session / Learning Activity Documentation',
        category: 'REMEDIAL_SESSION',
      };
      setDocPhotos((prev) => [newPhoto, ...prev]);
      showFeedback('Photo successfully added to documentation annex!', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = (id: string) => {
    setDocPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const handlePtcPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showFeedback('Please select a valid image file (JPG, PNG).', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setPtcPhotoUrl(dataUrl);
      showFeedback('PTC Conference photo uploaded successfully!', 'success');
    };
    reader.readAsDataURL(file);
  };

  // Photo Caption Editing State
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [editingCaptionText, setEditingCaptionText] = useState<string>('');
  const [isEditingPtcCaption, setIsEditingPtcCaption] = useState<boolean>(false);
  const [customPtcCaption, setCustomPtcCaption] = useState<string>('');

  const handleStartEditCaption = (photo: DocumentationPhoto) => {
    setEditingPhotoId(photo.id);
    setEditingCaptionText(photo.caption);
  };

  const handleSaveCaption = (id: string) => {
    if (!editingCaptionText.trim()) {
      showFeedback('Caption cannot be empty.', 'error');
      return;
    }
    setDocPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, caption: editingCaptionText.trim() } : p))
    );
    setEditingPhotoId(null);
    showFeedback('Photo caption updated successfully!', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Feedback Alert Banner */}
      {feedbackMessage && (
        <div
          className={`p-3 text-xs font-bold rounded-xl flex items-center justify-between gap-2 border print:hidden animate-in fade-in duration-150 ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          <span>{feedbackMessage.text}</span>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-slate-500 hover:text-slate-800 p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* NON-PRINTABLE TOP CONTROLS & DOCUMENT SELECTOR */}
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-emerald-100 print:hidden space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300">
                {isHTMode
                  ? `Head Teacher Whole-Program Report · ${subjectSpecialization}`
                  : 'DepEd Official Documentation'}
              </span>
              <h2 className="text-base sm:text-lg font-extrabold text-emerald-950 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-700" />
                {isHTMode
                  ? `Departmental Narrative & Accomplishment Report (${subjectSpecialization} Teachers & Students)`
                  : 'Narrative & Accomplishment Reports Generator'}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {isHTMode
                ? `Constructed for the whole Remediation or Skills Enhancement program conducted by your ${supervisedTeachers.length} supervised ${subjectSpecialization} teacher(s) across ${students.length} enrolled learner(s) and ${sessions.length} logged session(s).`
                : 'Generate formal narrative reports (in clean prose/paragraph format), certificates of recomputed grade, and photo documentation annexes.'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {activeTab === 'NARRATIVE_REPORT' && (
              <button
                onClick={handleCopyNarrativeText}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition flex items-center gap-1.5 border border-slate-300 cursor-pointer"
                title="Copy complete narrative text"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4 text-slate-600" />
                )}
                <span>{copied ? 'Copied!' : 'Copy Text'}</span>
              </button>
            )}

            <button
              onClick={handleDownloadPDF}
              disabled={isDownloadingPDF}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-yellow-300 font-extrabold rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm border border-emerald-500 cursor-pointer disabled:opacity-50"
              title="Download official PDF matching DepEd formatting"
            >
              {isDownloadingPDF ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-yellow-300" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-yellow-300" />
                  <span>Download PDF Document</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-emerald-950 font-extrabold rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm border border-amber-300 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official Document</span>
            </button>
          </div>
        </div>

        {/* 1. WHOLE PROGRAM SELECTOR */}
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50 p-3 sm:p-4 rounded-xl border border-emerald-200/90 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-600" />
              {isHTMode ? 'Select Whole Program Scope:' : 'Select Program Mode:'}
            </span>
            <span className="text-[11px] text-slate-600 hidden md:inline">
              {isHTMode
                ? `Construct report for the entire Remediation program, entire Skills Enhancement program, or both across all ${subjectSpecialization} teachers and their students`
                : 'Choose an individual track or generate a consolidated report for both programs'}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              id="narrative-program-mode-select"
              value={programType}
              onChange={(e) =>
                setProgramType(
                  e.target.value as 'Remediation' | 'Skills Enhancement' | 'Combined'
                )
              }
              className="w-full sm:w-[430px] bg-white border-2 border-emerald-700/80 hover:border-emerald-800 text-xs sm:text-sm font-extrabold text-slate-900 rounded-xl px-3.5 py-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer transition"
            >
              <option value="Remediation">
                {isHTMode
                  ? `Whole Remediation Program (${totalRemediationStudentsAll} Learners Across Supervised Teachers)`
                  : 'Remediation Program (Least Mastered Skills)'}
              </option>
              <option value="Skills Enhancement">
                {isHTMode
                  ? `Whole Skills Enhancement Program (${totalEnhancementStudentsAll} Learners Across Supervised Teachers)`
                  : 'Skills Enhancement Program (Advanced Competencies)'}
              </option>
              <option value="Combined">
                {isHTMode
                  ? `Consolidated Remediation & Skills Enhancement Programs (${students.length} Total Learners)`
                  : 'Combined Report (Remediation & Skills Enhancement)'}
              </option>
            </select>
          </div>
        </div>

        {/* 2. DOCUMENT MODE TABS */}
        <div
          className={`grid gap-2 p-2 bg-slate-100/90 rounded-2xl border border-slate-200 shadow-xs ${
            programType === 'Skills Enhancement'
              ? 'grid-cols-1 sm:grid-cols-3'
              : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'
          }`}
        >
          <button
            type="button"
            onClick={() => setActiveTab('NARRATIVE_REPORT')}
            className={`min-h-[48px] px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 text-center cursor-pointer shadow-xs ${
              activeTab === 'NARRATIVE_REPORT'
                ? 'bg-emerald-800 text-yellow-300 border-2 border-emerald-900 shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 hover:text-slate-900'
            }`}
          >
            <FileText
              className={`w-4 h-4 shrink-0 ${
                activeTab === 'NARRATIVE_REPORT' ? 'text-yellow-300' : 'text-emerald-700'
              }`}
            />
            <span className="truncate">
              {isHTMode ? 'Whole-Program Narrative (Prose)' : 'Narrative Report (Prose)'}
            </span>
          </button>

          {(programType === 'Remediation' || programType === 'Combined') && (
            <button
              type="button"
              onClick={() => setActiveTab('CERTIFICATE_RECOMPUTED')}
              className={`min-h-[48px] px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 text-center cursor-pointer shadow-xs ${
                activeTab === 'CERTIFICATE_RECOMPUTED'
                  ? 'bg-emerald-800 text-yellow-300 border-2 border-emerald-900 shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 hover:text-slate-900'
              }`}
            >
              <Award
                className={`w-4 h-4 shrink-0 ${
                  activeTab === 'CERTIFICATE_RECOMPUTED' ? 'text-yellow-300' : 'text-amber-600'
                }`}
              />
              <span className="truncate">Consolidated Certificate</span>
            </button>
          )}

          {(programType === 'Remediation' || programType === 'Combined') && (
            <button
              type="button"
              onClick={() => setActiveTab('CERTIFICATE_INDIVIDUAL')}
              className={`min-h-[48px] px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 text-center cursor-pointer shadow-xs ${
                activeTab === 'CERTIFICATE_INDIVIDUAL'
                  ? 'bg-emerald-800 text-yellow-300 border-2 border-emerald-900 shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 hover:text-slate-900'
              }`}
            >
              <UserCheck
                className={`w-4 h-4 shrink-0 ${
                  activeTab === 'CERTIFICATE_INDIVIDUAL' ? 'text-yellow-300' : 'text-blue-600'
                }`}
              />
              <span className="truncate">Individual Certificate</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('PHOTO_DOCUMENTATION')}
            className={`min-h-[48px] px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 text-center cursor-pointer shadow-xs ${
              activeTab === 'PHOTO_DOCUMENTATION'
                ? 'bg-emerald-800 text-yellow-300 border-2 border-emerald-900 shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 hover:text-slate-900'
            }`}
          >
            <ImageIcon
              className={`w-4 h-4 shrink-0 ${
                activeTab === 'PHOTO_DOCUMENTATION' ? 'text-yellow-300' : 'text-purple-600'
              }`}
            />
            <span className="truncate">Photo Documentation & PTC</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ACCOMPLISHMENT_TABLE')}
            className={`min-h-[48px] px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 text-center cursor-pointer shadow-xs ${
              activeTab === 'ACCOMPLISHMENT_TABLE'
                ? 'bg-emerald-800 text-yellow-300 border-2 border-emerald-900 shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 hover:text-slate-900'
            }`}
          >
            <Layers
              className={`w-4 h-4 shrink-0 ${
                activeTab === 'ACCOMPLISHMENT_TABLE' ? 'text-yellow-300' : 'text-slate-600'
              }`}
            />
            <span className="truncate">Accomplishment Matrix</span>
          </button>
        </div>

        {/* 3. CUSTOMIZATION & FILTER CONTROLS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              {isHTMode ? 'Grade & Section Filter' : 'Section Filter'}
            </label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
            >
              <option value="ALL">
                All Sections ({totalStudents}{' '}
                {programType === 'Combined' ? 'total' : programType.toLowerCase()} students)
              </option>
              {sectionsList.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              School Year & Quarter
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <input
                type="text"
                value={schoolYear}
                onChange={(e) => setSchoolYear(e.target.value)}
                placeholder="2025 – 2026"
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
              />
              <input
                type="text"
                value={quarterPeriod}
                onChange={(e) => setQuarterPeriod(e.target.value)}
                placeholder="First Quarter"
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Program Dates & Venue
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <input
                type="text"
                value={reportDates}
                onChange={(e) => setReportDates(e.target.value)}
                placeholder="Sept 2 to 3, 2025"
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
              />
              <input
                type="text"
                value={reportVenue}
                onChange={(e) => setReportVenue(e.target.value)}
                placeholder={isHTMode ? 'TLE Laboratories & Classrooms' : 'ICT Room (RM 9)'}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-slate-700">
                Approving Authority (School Principal)
              </label>
              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(
                    new CustomEvent('smile:open-profile-signatories', {
                      detail: { tab: 'signatories' },
                    })
                  );
                }}
                className="text-[10px] text-emerald-700 hover:text-emerald-900 font-semibold underline cursor-pointer"
                title="Edit in Teacher Profile & Signatories"
              >
                Edit in Profile & Signatories
              </button>
            </div>
            <input
              type="text"
              value={principalName}
              onChange={(e) => setPrincipalName(e.target.value)}
              placeholder="JOSEPHINE M. MANINGAS, PhD"
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. DOCUMENT VIEW: FORMAL NARRATIVE REPORT (PROSE / PARAGRAPH FORMAT)     */}
      {/* ========================================================================= */}
      {activeTab === 'NARRATIVE_REPORT' && (
        <div
          id="printable-deped-doc-NARRATIVE_REPORT"
          className="bg-white p-8 sm:p-14 rounded-2xl shadow-lg border border-slate-200 text-slate-900 max-w-4xl mx-auto print:shadow-none print:border-none print:p-0 font-serif leading-relaxed"
        >
          <DepEdDocHeader department="Technology and Livelihood Education (TLE)" />

          {/* Title and Metadata */}
          <div className="text-center my-6 space-y-1.5">
            <h1 className="text-base sm:text-lg font-black uppercase tracking-wider text-slate-950 font-serif">
              {isHTMode
                ? programType === 'Combined'
                  ? `DEPARTMENTAL NARRATIVE REPORT ON THE WHOLE ${subjectSpecialization.toUpperCase()} REMEDIATION AND SKILLS ENHANCEMENT PROGRAMS`
                  : `DEPARTMENTAL NARRATIVE REPORT ON THE WHOLE ${subjectSpecialization.toUpperCase()} ${programType.toUpperCase()} PROGRAM`
                : programType === 'Combined'
                ? 'CONSOLIDATED NARRATIVE REPORT ON TLE REMEDIATION & SKILLS ENHANCEMENT PROGRAMS'
                : `NARRATIVE REPORT ON ${programType.toUpperCase()} PROGRAM`}
            </h1>
            <p className="text-xs font-bold text-slate-800 italic">
              {isHTMode
                ? `Technology and Livelihood Education (${subjectSpecialization}) Department – Supervised Faculty & Student Cohort Report`
                : 'Technology and Livelihood Education (TLE) – Grade 10 ICT'}
            </p>
            <p className="text-xs font-semibold text-slate-700">
              School Year: {schoolYear} | {quarterPeriod}
            </p>
          </div>

          {/* PROSE / NARRATIVE CONTENT BODY */}
          {isHTMode ? (
            /* =============================================================== */
            /* HEAD TEACHER WHOLE-PROGRAM NARRATIVE REPORT (TEACHERS & STUDENTS)*/
            /* =============================================================== */
            <div
              id="narrative-prose-content"
              className="space-y-6 text-xs text-justify text-slate-900"
            >
              {/* Section I: Executive Summary & Whole-Program Overview */}
              <div className="space-y-2.5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-950 border-b border-slate-400 pb-1">
                  I. Executive Summary & Whole-Program Overview
                </h2>
                <p>
                  In compliance with the Department of Education’s commitment to inclusive, mastery-oriented education under the MATATAG Curriculum and school-wide implementation of Project S.M.I.L.E. (
                  <em>Student Monitoring and Intervention for Learning Enhancement</em>), the{' '}
                  <span className="font-semibold">
                    {teacher.department || 'Technology and Livelihood Education (TLE)'} Department
                  </span>{' '}
                  of Ramon Magsaysay (Cubao) High School implemented and supervised{' '}
                  <span className="font-semibold">
                    {programType === 'Combined'
                      ? `the whole ${subjectSpecialization} Remediation and Skills Enhancement Programs`
                      : programType === 'Remediation'
                      ? `the whole ${subjectSpecialization} Remediation Program`
                      : `the whole ${subjectSpecialization} Skills Enhancement & Enrichment Program`}
                  </span>{' '}
                  for the <span className="font-semibold">{quarterPeriod}</span> of School Year{' '}
                  <span className="font-semibold">{schoolYear}</span>. The department-wide intervention was conducted from{' '}
                  <span className="font-semibold">{reportDates}</span> across{' '}
                  <span className="font-semibold">{reportVenue}</span>, under the direct instructional supervision of{' '}
                  <span className="font-semibold">{headTeacherName}</span> ({headTeacherPosition}) and carried out by the supervised{' '}
                  <span className="font-semibold">{subjectSpecialization}</span> faculty members for their respective student cohorts.
                </p>
                <p>
                  This consolidated departmental narrative report encompasses the entire{' '}
                  <span className="font-semibold">
                    {programType === 'Combined'
                      ? 'Remediation and Skills Enhancement initiative'
                      : `${programType} Program`}
                  </span>{' '}
                  conducted by{' '}
                  <span className="font-semibold">
                    {supervisedTeachers.length > 0 ? supervisedTeachers.length : effectiveTeachersForReport.length}{' '}
                    supervised {subjectSpecialization} teacher(s)
                  </span>
                  {activeImplementingTeachers.length > 0 && (
                    <>
                      —specifically led in active session facilitation by{' '}
                      <span className="font-semibold">
                        {activeImplementingTeachers.map((t) => t.teacherName).join(', ')}
                      </span>
                      —
                    </>
                  )}
                  on a total cohort of{' '}
                  <span className="font-semibold">{totalStudents} enrolled learner(s)</span>{' '}
                  {sectionBreakdownText ? `across ${sectionBreakdownText}` : 'across monitored TLE class sections'}. Throughout the implementation period, the department teachers facilitated and documented a total of{' '}
                  <span className="font-semibold">{totalSessions} structured intervention session(s)</span>{' '}
                  designed to{' '}
                  {programType === 'Combined'
                    ? 'bridge foundational competency gaps among at-risk learners (70–74 baseline marks) so they achieve the 75% passing standard, while simultaneously providing advanced technical enrichment for high-performing students.'
                    : programType === 'Remediation'
                    ? 'address least mastered competencies among identified at-risk learners whose initial quarterly performance fell between 70% and 74%, guiding them to attain at least the 75% passing standard.'
                    : 'elevate technical proficiency, laboratory mastery, and applied problem-solving skills among learners enrolled in the Skills Enhancement track.'}
                </p>
              </div>

              {/* Section II: Supervised Teachers' Implementation & Student Cohort Breakdown */}
              <div className="space-y-2.5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-950 border-b border-slate-400 pb-1">
                  II. Faculty Implementation & Student Cohort Breakdown (Teachers & Their Students)
                </h2>
                <p>
                  Under the supervisory monitoring of the Head Teacher, the department’s{' '}
                  <span className="font-semibold">{subjectSpecialization}</span> teachers diagnosed learner needs within their respective classes, enrolled target students into the program, and conducted targeted instructional sessions. Below is the consolidated narrative and statistical breakdown of the program conducted by the teachers and the performance of their students:
                </p>

                {/* Narrative Prose Breakdown per Implementing Teacher and Their Students */}
                <div className="space-y-2 pl-3 border-l-2 border-slate-400">
                  {effectiveTeachersForReport.map((tItem, idx) => {
                    const studentNamesSummary = tItem.studentStats
                      .map(
                        (st) =>
                          `${st.student.lastName}, ${st.student.firstName} (${st.student.gradeLevel}–${st.student.section}: Baseline ${st.baseline}% → Mastery ${st.avgMastery}%, Recomputed ${st.recomputedGrade})`
                      )
                      .join('; ');

                    return (
                      <div key={tItem.teacherEmail || idx} className="space-y-0.5">
                        <p className="text-slate-900">
                          <span className="font-bold">
                            {idx + 1}. {tItem.teacherName}
                          </span>{' '}
                          <span className="italic text-slate-700">
                            ({tItem.teacherTitle}
                            {tItem.subjectsList.length > 0
                              ? ` • ${tItem.subjectsList.join(', ')}`
                              : ` • ${subjectSpecialization}`}
                            )
                          </span>
                          :{' '}
                          {tItem.studentsCount > 0 ? (
                            <>
                              Facilitated{' '}
                              <span className="font-semibold">
                                {tItem.sessionsCount} intervention session(s)
                              </span>{' '}
                              ({tItem.movCount} MOV attachment{tItem.movCount === 1 ? '' : 's'} submitted) for{' '}
                              <span className="font-semibold">
                                {tItem.studentsCount} target student(s)
                              </span>{' '}
                              in{' '}
                              <span className="font-semibold">
                                {tItem.sectionsList.join(', ') || 'assigned sections'}
                              </span>
                              . Learners under {tItem.teacherName} improved from an initial baseline average of{' '}
                              <span className="font-semibold">{tItem.avgBaseline}%</span> to a post-intervention mastery average of{' '}
                              <span className="font-semibold">{tItem.avgMastery}%</span>, with{' '}
                              <span className="font-semibold">
                                {tItem.passedCount} out of {tItem.studentsCount} student(s) ({tItem.passRate}%)
                              </span>{' '}
                              achieving passing mastery.{' '}
                              {studentNamesSummary && (
                                <span className="text-slate-700">
                                  Enrolled students: <em>{studentNamesSummary}</em>.
                                </span>
                              )}
                            </>
                          ) : (
                            <>
                              Monitored under {subjectSpecialization} department supervision; zero learners currently requiring {programType.toLowerCase()} intervention in this period ({tItem.sessionsCount} logs recorded).
                            </>
                          )}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Consolidated Table of Teachers & Student Cohorts */}
                <div className="my-3 border border-slate-900 overflow-x-auto">
                  <table className="w-full text-[11px] text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-950 font-bold border-b border-slate-900">
                        <th className="p-2 border-r border-slate-900">Implementing Teacher</th>
                        <th className="p-2 border-r border-slate-900">Specialization & Sections</th>
                        <th className="p-2 border-r border-slate-900 text-center">Target Students</th>
                        <th className="p-2 border-r border-slate-900 text-center">Sessions & MOVs</th>
                        <th className="p-2 border-r border-slate-900 text-center">Baseline → Mastery</th>
                        <th className="p-2 text-center">Passed / Promoted</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900">
                      {effectiveTeachersForReport.map((tItem, idx) => (
                        <tr key={tItem.teacherEmail || idx}>
                          <td className="p-2 border-r border-slate-900 font-bold text-slate-900">
                            <div>{tItem.teacherName}</div>
                            <div className="text-[10px] font-normal text-slate-600">
                              {tItem.teacherTitle}
                            </div>
                          </td>
                          <td className="p-2 border-r border-slate-900 text-slate-800">
                            <div className="font-semibold">
                              {tItem.subjectsList.join(', ') || subjectSpecialization}
                            </div>
                            <div className="text-[10px] text-slate-600">
                              {tItem.sectionsList.length > 0
                                ? tItem.sectionsList.join(', ')
                                : 'All Assigned Sections'}
                            </div>
                          </td>
                          <td className="p-2 border-r border-slate-900 text-center font-bold text-slate-900">
                            {tItem.studentsCount}
                          </td>
                          <td className="p-2 border-r border-slate-900 text-center text-slate-800">
                            <span className="font-bold">{tItem.sessionsCount}</span> logs ({tItem.movCount} MOVs)
                          </td>
                          <td className="p-2 border-r border-slate-900 text-center font-semibold text-slate-900">
                            {tItem.studentsCount > 0
                              ? `${tItem.avgBaseline}% → ${tItem.avgMastery}%`
                              : '—'}
                          </td>
                          <td className="p-2 text-center font-bold text-slate-950">
                            {tItem.studentsCount > 0
                              ? `${tItem.passedCount}/${tItem.studentsCount} (${tItem.passRate}%)`
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section III: Target Competencies & Learning Objectives Across Supervised Classes */}
              <div className="space-y-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-950 border-b border-slate-400 pb-1">
                  III. Target Competencies & Skills Addressed by Department Teachers
                </h2>
                <p>
                  Based on quarterly diagnostic item analyses, practical laboratory assessments, and classroom performance tracking conducted by the {subjectSpecialization} teachers on their students, the whole{' '}
                  {programType === 'Combined'
                    ? 'Remediation and Skills Enhancement program'
                    : `${programType} program`}{' '}
                  targeted the following critical competencies across the supervised classes:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-slate-800">
                  {targetCompetencies.length > 0 ? (
                    targetCompetencies.map((comp, idx) => (
                      <li key={idx}>
                        <span className="font-semibold">{comp}</span> – reinforced through teacher-guided laboratory exercises, diagnostic reteaching, and individualized learner outputs.
                      </li>
                    ))
                  ) : (
                    <>
                      <li>
                        <span className="font-semibold">
                          Computer Systems Servicing, Hardware Diagnostics & Network Configuration
                        </span>{' '}
                        – hands-on identification of hardware components, systems servicing, and troubleshooting protocols.
                      </li>
                      <li>
                        <span className="font-semibold">
                          Technical Documentation, Occupational Health & Safety (OHS) Standards
                        </span>{' '}
                        – proper laboratory workflow execution, tool safety, and technical drafting/documentation.
                      </li>
                      <li>
                        <span className="font-semibold">
                          Applied TLE / ICT Laboratory Operations & Problem-Solving
                        </span>{' '}
                        – independent execution of performance tasks and competency-based practical exercises.
                      </li>
                    </>
                  )}
                </ul>
              </div>

              {/* Section IV: Teacher Interventions & Head Teacher Instructional Supervision */}
              <div className="space-y-2.5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-950 border-b border-slate-400 pb-1">
                  IV. Implemented Teacher Interventions & Head Teacher Instructional Supervision
                </h2>
                <p>
                  To address diverse learner needs across all participating sections, the supervised {subjectSpecialization} teachers utilized structured pedagogical interventions on their students, while the Head Teacher conducted continuous instructional supervision and quality assurance:
                </p>

                <div className="space-y-2.5 pl-3 border-l-2 border-slate-300">
                  <div>
                    <p className="font-bold text-slate-950">
                      1. Classroom & Laboratory Interventions Conducted by Teachers on Their Students
                    </p>
                    <p className="text-slate-800">
                      Department teachers implemented differentiated intervention tools—including{' '}
                      <span className="font-semibold">
                        {implementedInterventionsList.length > 0
                          ? implementedInterventionsList.join(', ')
                          : 'Simplified Self-Paced Modules, Targeted Reteaching Sessions, Learning Activity Sheets (LAS), and Hands-on Laboratory Simulations'}
                      </span>
                      . Teachers provided one-on-one and small-group coaching to clarify misconceptions, guide practical skill execution, and assess student mastery after each session.
                    </p>
                  </div>

                  <div>
                    <p className="font-bold text-slate-950">
                      2. Head Teacher Supervision of Remediation Logs & Evaluation of Session MOVs
                    </p>
                    <p className="text-slate-800">
                      As Department Head, <span className="font-semibold">{headTeacherName}</span> systematically reviewed all{' '}
                      <span className="font-semibold">{totalSessions} daily anecdotal session log(s)</span> submitted by the implementing teachers ({totalVerifiedSessionsCount} session log(s) formally verified and signed off) and evaluated{' '}
                      <span className="font-semibold">{totalMovsSubmittedCount} Means of Verification (MOVs)</span> and assessment tools against DepEd quality criteria (competency alignment, authentic learner output, and clear photographic/documentary evidence).
                    </p>
                  </div>

                  <div>
                    <p className="font-bold text-slate-950">
                      3. Parent-Teacher Collaboration & Stakeholder Engagement
                    </p>
                    <p className="text-slate-800">
                      Implementing teachers issued official Parent Communication Letters to secure home support for all{' '}
                      <span className="font-semibold">{totalStudents} enrolled students</span> and conducted a coordinated{' '}
                      <span className="font-semibold">Parent-Teacher Conference (PTC)</span> on{' '}
                      <span className="font-semibold">{ptcDate}</span> to present student progress trajectories, recomputed grades, and home-school follow-up agreements.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section V: Whole-Program Evaluation, Statistical Results & Student Outcomes */}
              <div className="space-y-2.5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-950 border-b border-slate-400 pb-1">
                  V. Consolidated Program Evaluation, Statistical Results & Student Outcomes
                </h2>
                <p>
                  Consolidated post-intervention evaluations across all participating {subjectSpecialization} teachers and their students demonstrated substantial quantitative and qualitative gains across the department:
                </p>

                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-300 space-y-1.5 text-slate-800">
                  <p>
                    • <span className="font-bold">Supervised Implementing Faculty & Student Reach:</span>{' '}
                    <span className="font-semibold">
                      {activeImplementingTeachers.length || supervisedTeachers.length} implementing {subjectSpecialization} teacher(s)
                    </span>{' '}
                    conducted <span className="font-semibold">{totalSessions} total session(s)</span> for{' '}
                    <span className="font-semibold">{actualParticipantsCount} active learner participant(s)</span> (out of {totalStudents} enrolled learners across {sectionCountsMap.size || 1} section(s)).
                  </p>
                  <p>
                    • <span className="font-bold">Whole-Program Baseline Average vs. Post-Intervention Mastery:</span>{' '}
                    The consolidated student cohort improved from an initial baseline average of{' '}
                    <span className="font-bold">{avgBaseline}%</span> to a post-intervention mastery average of{' '}
                    <span className="font-bold">{overallAvgMastery}%</span> (a net departmental mastery gain of{' '}
                    <span className="font-bold">+{Math.max(0, overallAvgMastery - avgBaseline)}%</span>).
                  </p>
                  <p>
                    • <span className="font-bold">Whole-Program Passing, Promotion & Grade Recomputation Rate:</span>{' '}
                    Out of <span className="font-bold">{totalStudents} students</span> enrolled by the teachers,{' '}
                    <span className="font-bold text-slate-950">
                      {passedStudentsCount} students ({passRatePercent}%)
                    </span>{' '}
                    successfully achieved the required mastery threshold ({programType === 'Skills Enhancement' ? '≥85% proficiency' : '≥75% passing mark'}), qualifying remedial learners for official grade recomputation from failing marks (70–74) to a passing final grade of{' '}
                    <span className="font-bold">75</span>.
                  </p>
                </div>

                {/* Consolidated Student Outcomes Roster across Teachers */}
                {studentMasteryStats.length > 0 && (
                  <div className="my-2 border border-slate-900 overflow-x-auto">
                    <table className="w-full text-[11px] text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-950 font-bold border-b border-slate-900">
                          <th className="p-2 border-r border-slate-900">Name of Student</th>
                          <th className="p-2 border-r border-slate-900 text-center">Grade & Section</th>
                          <th className="p-2 border-r border-slate-900">Conducting Teacher & Subject</th>
                          <th className="p-2 border-r border-slate-900 text-center">Sessions</th>
                          <th className="p-2 border-r border-slate-900 text-center">Baseline</th>
                          <th className="p-2 border-r border-slate-900 text-center">Avg Mastery</th>
                          <th className="p-2 text-center">Recomputed / Final</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900">
                        {studentMasteryStats.map((st) => (
                          <tr key={st.student.id}>
                            <td className="p-1.5 border-r border-slate-900 font-bold uppercase text-slate-900">
                              {st.student.lastName}, {st.student.firstName} {st.student.middleInitial}
                            </td>
                            <td className="p-1.5 border-r border-slate-900 text-center text-slate-800">
                              {st.student.gradeLevel}–{st.student.section}
                            </td>
                            <td className="p-1.5 border-r border-slate-900 text-slate-800">
                              <span className="font-semibold">{st.conductingTeacherName}</span>
                              <span className="text-[10px] text-slate-600 block">
                                {st.student.subject || subjectSpecialization}
                              </span>
                            </td>
                            <td className="p-1.5 border-r border-slate-900 text-center font-semibold">
                              {st.sessionsCount}
                            </td>
                            <td className="p-1.5 border-r border-slate-900 text-center font-bold text-slate-700">
                              {st.baseline}%
                            </td>
                            <td className="p-1.5 border-r border-slate-900 text-center font-bold text-slate-900">
                              {st.avgMastery}%
                            </td>
                            <td className="p-1.5 text-center font-black text-slate-950">
                              {st.student.programType === 'Skills Enhancement'
                                ? `${st.avgMastery}% (${st.masteryLevel})`
                                : st.recomputedGrade}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Section VI: Supervisory Insights & Departmental Recommendations */}
              <div className="space-y-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-950 border-b border-slate-400 pb-1">
                  VI. Supervisory Synthesis & Actionable Departmental Recommendations
                </h2>
                <p>
                  Based on the Head Teacher’s instructional supervision of the {subjectSpecialization} faculty and evaluation of student mastery outcomes across the whole{' '}
                  {programType === 'Combined'
                    ? 'Remediation and Skills Enhancement program'
                    : `${programType} program`}
                  , the following departmental actions are recommended for succeeding quarters:
                </p>
                <ol className="list-decimal pl-6 space-y-1 text-slate-800">
                  <li>
                    <span className="font-semibold">
                      Department-Wide Early Diagnostic Screening:
                    </span>{' '}
                    Institutionalize formative competency checks across all {subjectSpecialization} classes during the mid-quarter period so teachers can enroll at-risk learners into early remediation before quarterly failing marks occur.
                  </li>
                  <li>
                    <span className="font-semibold">
                      Collaborative Sharing of Validated LAS & Assessment Tools:
                    </span>{' '}
                    Consolidate exemplary Learning Activity Sheets (LAS), simplified modules, and laboratory rubrics developed by supervised teachers into a shared {subjectSpecialization} department repository.
                  </li>
                  <li>
                    <span className="font-semibold">
                      Sustained Instructional Supervision & Parent Partnership:
                    </span>{' '}
                    Continue weekly Head Teacher verification of teacher session logs and MOVs alongside regular parent-teacher conferences to sustain the {passRatePercent}% student passing and mastery rate.
                  </li>
                </ol>
              </div>
            </div>
          ) : (
            /* =============================================================== */
            /* REGULAR SUBJECT TEACHER NARRATIVE REPORT                        */
            /* =============================================================== */
            <div
              id="narrative-prose-content"
              className="space-y-6 text-xs text-justify text-slate-900"
            >
              {/* Section I: Executive Summary & Overview */}
              <div className="space-y-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-950 border-b border-slate-400 pb-1">
                  I. Executive Summary & Program Overview
                </h2>
                <p>
                  In compliance with the Department of Education’s commitment to inclusive, mastery-oriented education under the MATATAG Curriculum, Ramon Magsaysay (Cubao) High School conducted{' '}
                  <span className="font-semibold">
                    {programType === 'Combined'
                      ? 'the TLE Remediation and Skills Enhancement Programs'
                      : programType === 'Remediation'
                      ? 'a targeted TLE Remediation Program'
                      : 'a targeted TLE Skills Enhancement & Enrichment Program'}
                  </span>{' '}
                  for Grade 10 Information and Communications Technology (ICT) learners during the{' '}
                  {quarterPeriod} of School Year {schoolYear}. The program was formally held from{' '}
                  <span className="font-semibold">{reportDates}</span> at the{' '}
                  <span className="font-semibold">{reportVenue}</span>, under the facilitation and supervision of{' '}
                  <span className="font-semibold">{teacherName}</span> ({teacherPosition}).
                </p>
                <p>
                  The primary purpose of this educational initiative was to{' '}
                  {programType === 'Combined'
                    ? 'provide a comprehensive dual-track intervention—reinforcing least mastered competencies for students requiring remediation to achieve a passing 75% standard, while challenging advanced learners through technical enrichment.'
                    : programType === 'Remediation'
                    ? 'address critical learning gaps and reinforce least mastered competencies among identified at-risk learners whose quarterly performance fell below the standard 75% passing threshold.'
                    : 'deepen practical competencies, provide advanced enrichment opportunities, and elevate academic proficiency among promising ICT learners.'}{' '}
                  A total of <span className="font-semibold">{totalStudents} target learners</span>{' '}
                  {sectionBreakdownText ? `across ${sectionBreakdownText}` : ''} were enrolled in structured, high-impact intervention sessions.
                </p>
              </div>

              {/* Section II: Program Objectives & Competency Targets */}
              <div className="space-y-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-950 border-b border-slate-400 pb-1">
                  II. Target Competencies & Learning Objectives
                </h2>
                <p>
                  Based on diagnostic evaluations, periodic quarterly assessments, and classroom performance tasks, the program focused specifically on the following key areas:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-slate-800">
                  {targetCompetencies.length > 0 ? (
                    targetCompetencies.map((comp, idx) => (
                      <li key={idx}>
                        <span className="font-semibold">{comp}</span> – reinforcement of core fundamentals, practical execution, and diagnostic mastery.
                      </li>
                    ))
                  ) : (
                    <>
                      <li>
                        <span className="font-semibold">
                          Computer Systems Servicing & Troubleshooting
                        </span>{' '}
                        – identifying hardware components, network configuration, and diagnostic tools.
                      </li>
                      <li>
                        <span className="font-semibold">
                          Technical Documentation & Safety Protocols
                        </span>{' '}
                        – adhering to OHS standards and proper equipment handling.
                      </li>
                      <li>
                        <span className="font-semibold">
                          Software Application & Practical Laboratory Operations
                        </span>{' '}
                        – independent task execution and applied digital skills.
                      </li>
                    </>
                  )}
                </ul>
                <p>
                  {programType === 'Combined'
                    ? 'Through structured diagnostic assessments and enriched laboratory modules, the dual-track program targeted both foundational remediation and advanced performance: guiding remedial learners toward at least 75% passing proficiency while advancing enhancement learners toward technical mastery exceeding 85%.'
                    : programType === 'Remediation'
                    ? 'By providing targeted diagnostic intervention, the program aimed to elevate each student’s average mastery level to at least 75%, allowing them to attain a passing mark and maintain solid foundations for succeeding quarters.'
                    : 'The program aimed to challenge learners with advanced technical case studies, independent lab simulations, and high-level problem-solving tasks.'}
                </p>
              </div>

              {/* Section III: Implemented Interventions & Pedagogical Tools */}
              <div className="space-y-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-950 border-b border-slate-400 pb-1">
                  III. Implemented Interventions & Pedagogical Tools
                </h2>
                <p>
                  To ensure comprehensive learning outcomes and cater to diverse learning styles, the subject teacher designed and utilized three core intervention instruments:
                </p>

                <div className="space-y-2.5 pl-3 border-l-2 border-slate-300">
                  <div>
                    <p className="font-bold text-slate-950">
                      1. Simplified Modules & Self-Paced Guides
                    </p>
                    <p className="text-slate-800">
                      Curated instructional modules that distilled complex technical concepts into accessible, bite-sized lessons with visual diagrams, step-by-step walk-throughs, and clear glossaries, enabling students to review lessons at their own individualized pace.
                    </p>
                  </div>

                  <div>
                    <p className="font-bold text-slate-950">
                      2. Targeted Reteaching & Interactive Clarification Sessions
                    </p>
                    <p className="text-slate-800">
                      Small-group interactive discussions where the teacher revisited difficult topics, corrected misconceptions, performed live laboratory demonstrations, and provided scaffolded guidance to encourage active learner participation.
                    </p>
                  </div>

                  <div>
                    <p className="font-bold text-slate-950">
                      3. Learning Activity Sheets (LAS) & Independent Reinforcement
                    </p>
                    <p className="text-slate-800">
                      Structured practice worksheets and practical performance checkpoints designed to test conceptual retention, promote independent problem solving, and provide immediate evaluative feedback.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section IV: Program Implementation, Attendance & Parent Collaboration */}
              <div className="space-y-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-950 border-b border-slate-400 pb-1">
                  IV. Program Implementation & Stakeholder Collaboration
                </h2>
                <p>
                  The program achieved outstanding student attendance and active engagement throughout the scheduled duration. Out of the{' '}
                  <span className="font-semibold">{totalStudents} targeted learners</span>,{' '}
                  <span className="font-semibold">
                    {actualParticipantsCount} students actively attended
                  </span>{' '}
                  and completed the required remediation modules and diagnostic exercises.
                </p>
                <p>
                  Recognizing that home-school collaboration is essential to learner success, official Parent Communication Letters were issued prior to the start of the program to secure parental consent and support. Furthermore, a dedicated{' '}
                  <span className="font-semibold">Parent-Teacher Conference (PTC)</span> was held on{' '}
                  <span className="font-semibold">{ptcDate}</span> to discuss learner progress, address attendance habits, and establish joint monitoring strategies between guardians and the school faculty.
                </p>
              </div>

              {/* Section V: Evaluation, Statistical Results & Academic Outcomes */}
              <div className="space-y-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-950 border-b border-slate-400 pb-1">
                  V. Evaluation, Results & Academic Outcomes
                </h2>
                <p>
                  Post-intervention diagnostic scores and re-evaluations demonstrated significant quantitative and qualitative improvement across all participating sections:
                </p>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-300 space-y-1 text-slate-800">
                  <p>
                    • <span className="font-bold">Initial Baseline Average:</span> {avgBaseline}% (with scores ranging from 70% to 74% prior to intervention).
                  </p>
                  <p>
                    • <span className="font-bold">Post-Intervention Average Mastery:</span>{' '}
                    {overallAvgMastery}% (representing an overall positive score trajectory across{' '}
                    {totalSessions} logged session logs).
                  </p>
                  <p>
                    • <span className="font-bold">Program Passing & Promotion Rate:</span> Out of{' '}
                    {totalStudents} students,{' '}
                    <span className="font-bold text-slate-950">
                      {passedStudentsCount} students ({passRatePercent}%)
                    </span>{' '}
                    successfully achieved a passing mark of 75% or higher, qualifying them for official grade recomputation and advancement.
                  </p>
                </div>

                {(programType === 'Remediation' || programType === 'Combined') && (
                  <p>
                    In accordance with DepEd guidelines on grade recomputation for remedial classes, learners who achieved passing mastery had their quarterly failing marks (70–74) officially upgraded to a recomputed final grade of{' '}
                    <span className="font-semibold">75</span>, as documented in the attached Certificate of Recomputed Grade.
                  </p>
                )}
              </div>

              {/* Section VI: Insights, Best Practices & Recommendations */}
              <div className="space-y-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-950 border-b border-slate-400 pb-1">
                  VI. Key Insights & Actionable Recommendations
                </h2>
                <p>
                  The successful completion of the{' '}
                  {programType === 'Combined'
                    ? 'Remediation and Skills Enhancement'
                    : programType}{' '}
                  program highlighted the efficacy of differentiated instruction and structured self-paced materials. To sustain learner progress in subsequent quarters, the following recommendations are submitted:
                </p>
                <ol className="list-decimal pl-6 space-y-1 text-slate-800">
                  <li>
                    <span className="font-semibold">Early Diagnostic Identification:</span> Continue conducting formative assessments early in each quarter to identify struggling students before failing grades occur.
                  </li>
                  <li>
                    <span className="font-semibold">
                      Expanded Learning Activity Sheets (LAS):
                    </span>{' '}
                    Broaden the digital and printed repository of localized LAS tailored to ICT hands-on operations.
                  </li>
                  <li>
                    <span className="font-semibold">Sustained Parent-Teacher Alignment:</span>{' '}
                    Maintain regular communication channels with parents and guardians to reinforce study routines at home.
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* OFFICIAL SIGNATORIES SECTION */}
          <div className="pt-10 grid grid-cols-1 sm:grid-cols-2 gap-8 font-serif">
            <div>
              <p className="text-xs text-slate-800 font-medium mb-5">Prepared by:</p>
              <div>
                <p className="font-bold text-xs uppercase tracking-wide text-slate-950">
                  {teacherName}
                </p>
                <p className="text-[11px] text-slate-700">{teacherPosition}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-800 font-medium mb-5">Noted & Approved by:</p>
              <div>
                <p className="font-bold text-xs uppercase tracking-wide text-slate-950">
                  {principalName}
                </p>
                <p className="text-[11px] text-slate-700">{principalPosition}</p>
              </div>
            </div>
          </div>

          <DepEdDocFooter />
        </div>
      )}

      {/* =================================================================================== */}
      {/* 2. DOCUMENT VIEW: CERTIFICATE OF RECOMPUTED GRADE (Consolidated Section - Page 1)  */}
      {/* =================================================================================== */}
      {activeTab === 'CERTIFICATE_RECOMPUTED' && (
        <div
          id="printable-deped-doc-CERTIFICATE_RECOMPUTED"
          className="bg-white p-8 sm:p-12 rounded-2xl shadow-lg border border-slate-200 text-slate-900 max-w-4xl mx-auto print:shadow-none print:border-none print:p-0 font-serif"
        >
          <DepEdDocHeader department="Technology and Livelihood Education (TLE)" />

          <div className="text-center my-5 space-y-1">
            <h1 className="text-base sm:text-lg font-bold uppercase tracking-wider text-slate-950 font-serif">
              {isHTMode
                ? `CONSOLIDATED DEPARTMENTAL CERTIFICATE OF RECOMPUTED GRADE (${subjectSpecialization})`
                : 'CERTIFICATE OF RECOMPUTED GRADE'}
            </h1>
            {isHTMode && (
              <p className="text-xs font-semibold text-slate-700 italic">
                Whole {programType} Program Across Supervised {subjectSpecialization} Teachers & Students
              </p>
            )}
          </div>

          {/* Metadata Header line */}
          <div className="flex items-center justify-between text-xs font-serif font-bold text-slate-900 pb-3 pt-1">
            <div>
              <span>School Year: </span>
              <span className="font-semibold underline decoration-slate-400 underline-offset-2">
                {schoolYear}
              </span>
            </div>
            <div>
              <span>Quarter: </span>
              <span className="font-semibold underline decoration-slate-400 underline-offset-2">
                {quarterPeriod}
              </span>
            </div>
          </div>

          {/* Consolidated Recomputed Grades Table */}
          <div className="my-2 border border-slate-900">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-950 font-bold border-b border-slate-900">
                  <th className="p-2.5 border-r border-slate-900 text-center">Name of Student</th>
                  <th className="p-2.5 border-r border-slate-900 text-center">Year and Section</th>
                  {isHTMode && (
                    <th className="p-2.5 border-r border-slate-900 text-center">
                      Subject & Facilitating Teacher
                    </th>
                  )}
                  <th className="p-2.5 border-r border-slate-900 text-center">Final Grade</th>
                  <th className="p-2.5 text-center">Recomputed Final Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {studentMasteryStats.length > 0 ? (
                  studentMasteryStats.map(
                    ({ student: s, baseline, recomputedGrade, conductingTeacherName }) => (
                      <tr key={s.id} className="hover:bg-slate-50/50">
                        <td className="p-2 border-r border-slate-900 font-semibold uppercase text-slate-900">
                          {s.lastName}, {s.firstName} {s.middleInitial}
                        </td>
                        <td className="p-2 border-r border-slate-900 text-center text-slate-900 font-medium">
                          {s.gradeLevel}- {s.section}
                        </td>
                        {isHTMode && (
                          <td className="p-2 border-r border-slate-900 text-center text-slate-800">
                            <div className="font-semibold">{conductingTeacherName}</div>
                            <div className="text-[10px] text-slate-600">
                              {s.subject || subjectSpecialization}
                            </div>
                          </td>
                        )}
                        <td className="p-2 border-r border-slate-900 text-center font-bold text-slate-800">
                          {baseline}
                        </td>
                        <td className="p-2 text-center font-bold text-slate-950">
                          {recomputedGrade}
                        </td>
                      </tr>
                    )
                  )
                ) : (
                  <tr>
                    <td
                      colSpan={isHTMode ? 5 : 4}
                      className="p-4 text-center text-slate-500 italic"
                    >
                      No students currently found for the selected section and program.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* SIGNATORIES */}
          <div className="pt-10 grid grid-cols-1 sm:grid-cols-2 gap-8 font-serif">
            <div>
              <p className="text-xs text-slate-800 font-medium mb-5">
                Prepared & Certified Correct by:
              </p>
              <div>
                <p className="font-bold text-xs uppercase tracking-wide text-slate-950">
                  {teacherName}
                </p>
                <p className="text-[11px] text-slate-700">{teacherPosition}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-800 font-medium mb-5">Noted & Approved by:</p>
              <div>
                <p className="font-bold text-xs uppercase tracking-wide text-slate-950">
                  {principalName}
                </p>
                <p className="text-[11px] text-slate-700">{principalPosition}</p>
              </div>
            </div>
          </div>

          <DepEdDocFooter />
        </div>
      )}

      {/* =================================================================================== */}
      {/* 3. DOCUMENT VIEW: INDIVIDUAL CERTIFICATE OF RECOMPUTED GRADE (Page 2)               */}
      {/* =================================================================================== */}
      {activeTab === 'CERTIFICATE_INDIVIDUAL' && (
        <div className="space-y-4">
          <div className="bg-white p-3 rounded-xl border border-emerald-200 print:hidden flex items-center justify-between gap-3">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-emerald-700" />
              Select Learner for Individual Certificate:
            </span>
            <select
              value={selectedIndividualStudent?.id || ''}
              onChange={(e) => {
                const found = students.find((s) => String(s.id) === String(e.target.value));
                if (found) setSelectedIndividualStudent(found);
              }}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 cursor-pointer"
            >
              {filteredStudents.map((s) => {
                const tProf = getStudentTeacherProfile(s);
                return (
                  <option key={s.id} value={s.id}>
                    {s.lastName}, {s.firstName} ({s.gradeLevel} - {s.section}
                    {tProf ? ` · Teacher: ${tProf.name}` : ''})
                  </option>
                );
              })}
            </select>
          </div>

          <div
            id="printable-deped-doc-CERTIFICATE_INDIVIDUAL"
            className="bg-white p-8 sm:p-12 rounded-2xl shadow-lg border border-slate-200 text-slate-900 max-w-4xl mx-auto print:shadow-none print:border-none print:p-0 font-serif"
          >
            <DepEdDocHeader department="Technology and Livelihood Education (TLE)" />

            <div className="text-center my-6">
              <h1 className="text-base sm:text-lg font-bold uppercase tracking-wider text-slate-950 font-serif">
                CERTIFICATE OF RECOMPUTED GRADE
              </h1>
            </div>

            <div className="space-y-3 text-xs font-serif text-slate-900 py-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <span className="font-bold shrink-0">Name of Student:</span>
                  <span className="flex-1 border-b border-slate-900 font-semibold px-2 uppercase">
                    {selectedIndividualStudent
                      ? `${selectedIndividualStudent.lastName}, ${selectedIndividualStudent.firstName} ${selectedIndividualStudent.middleInitial}`
                      : '____________________________'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold shrink-0">Grade Level:</span>
                  <span className="flex-1 border-b border-slate-900 font-semibold px-2">
                    {selectedIndividualStudent
                      ? `${selectedIndividualStudent.gradeLevel} - ${selectedIndividualStudent.section}`
                      : '_______________'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold shrink-0">School Year:</span>
                  <span className="flex-1 border-b border-slate-900 font-semibold px-2">
                    {schoolYear}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold shrink-0">Quarter:</span>
                  <span className="flex-1 border-b border-slate-900 font-semibold px-2">
                    {quarterPeriod}
                  </span>
                </div>
              </div>
            </div>

            <div className="my-6 border border-slate-900">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-950 font-bold border-b border-slate-900">
                    <th className="p-3 border-r border-slate-900 text-center w-1/4">
                      Learning Area
                    </th>
                    <th className="p-3 border-r border-slate-900 text-center w-1/4">Final Grade</th>
                    <th className="p-3 border-r border-slate-900 text-center w-1/4">
                      Remedial Class Grade
                    </th>
                    <th className="p-3 text-center w-1/4">Recomputed Final Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {selectedIndividualStudent ? (
                    <tr className="h-16">
                      <td className="p-3 border-r border-slate-900 text-center font-semibold text-slate-900">
                        {selectedIndividualStudent.subject ||
                          'Technology & Livelihood Education (TLE / ICT)'}
                      </td>
                      <td className="p-3 border-r border-slate-900 text-center font-bold text-slate-800">
                        {selectedIndividualStudent.baselineScore}
                      </td>
                      <td className="p-3 border-r border-slate-900 text-center font-bold text-blue-900">
                        {(() => {
                          const stat = studentMasteryStats.find(
                            (item) => item.student.id === selectedIndividualStudent.id
                          );
                          return stat ? stat.avgMastery : selectedIndividualStudent.baselineScore;
                        })()}
                        %
                      </td>
                      <td className="p-3 text-center font-black text-slate-950">
                        {(() => {
                          const stat = studentMasteryStats.find(
                            (item) => item.student.id === selectedIndividualStudent.id
                          );
                          return stat ? stat.recomputedGrade : 75;
                        })()}
                      </td>
                    </tr>
                  ) : (
                    <tr className="h-16">
                      <td className="p-3 border-r border-slate-900 text-center"></td>
                      <td className="p-3 border-r border-slate-900 text-center"></td>
                      <td className="p-3 border-r border-slate-900 text-center"></td>
                      <td className="p-3 text-center"></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {(() => {
              const indivStat = selectedIndividualStudent
                ? studentMasteryStats.find(
                    (item) => item.student.id === selectedIndividualStudent.id
                  )
                : null;
              const prepName =
                isHTMode && indivStat?.conductingTeacherName
                  ? indivStat.conductingTeacherName
                  : teacherName;
              const prepPos =
                isHTMode && indivStat?.conductingTeacherTitle
                  ? indivStat.conductingTeacherTitle
                  : teacherPosition;

              return (
                <div className="pt-10 grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div>
                    <p className="text-xs text-slate-800 font-medium mb-5">
                      Prepared by (Subject Teacher):
                    </p>
                    <div>
                      <p className="font-bold text-xs uppercase tracking-wide text-slate-950">
                        {prepName}
                      </p>
                      <p className="text-[11px] text-slate-700">{prepPos}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-slate-800 font-medium mb-5">Noted & Approved by:</p>
                    <div>
                      <p className="font-bold text-xs uppercase tracking-wide text-slate-950">
                        {principalName}
                      </p>
                      <p className="text-[11px] text-slate-700">{principalPosition}</p>
                    </div>
                  </div>
                </div>
              );
            })()}

            <DepEdDocFooter />
          </div>
        </div>
      )}

      {/* =================================================================================== */}
      {/* 4. DOCUMENT VIEW: PHOTO / DOCUMENTATION ANNEX (Pages 5 & 6)                        */}
      {/* =================================================================================== */}
      {activeTab === 'PHOTO_DOCUMENTATION' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-emerald-200 print:hidden flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-extrabold text-emerald-950 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-emerald-700" />
                Documentation Annex Management
              </h3>
              <p className="text-[11px] text-slate-500">
                {isHTMode
                  ? `Consolidated MOV photos submitted by ${subjectSpecialization} teachers during remediation & enhancement sessions.`
                  : 'Upload program photos, activity sheets, or PTC conference captures.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload New Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>

              <div className="flex items-center gap-1 text-xs">
                <span className="text-slate-500 font-semibold">PTC Date:</span>
                <input
                  type="text"
                  value={ptcDate}
                  onChange={(e) => setPtcDate(e.target.value)}
                  className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-semibold text-slate-800"
                />
              </div>
            </div>
          </div>

          <div
            id="printable-deped-doc-PHOTO_DOCUMENTATION"
            className="bg-white p-8 sm:p-12 rounded-2xl shadow-lg border border-slate-200 text-slate-900 max-w-4xl mx-auto print:shadow-none print:border-none print:p-0 font-serif"
          >
            <DepEdDocHeader department="Technology and Livelihood Education (TLE)" />

            <div className="text-center my-6">
              <h1 className="text-base sm:text-lg font-black uppercase tracking-wider text-slate-950 font-serif">
                PHOTO/ DOCUMENTATION
              </h1>
              <p className="text-xs font-bold text-slate-700 italic">
                {isHTMode
                  ? `Whole ${subjectSpecialization} ${
                      programType === 'Combined'
                        ? 'Remediation & Skills Enhancement Programs'
                        : `${programType} Program`
                    } – Supervised Teachers & Students`
                  : `${
                      programType === 'Combined'
                        ? 'Consolidated Remediation & Skills Enhancement Programs'
                        : `${programType} Program`
                    } – Grade 10 ICT`}
              </p>
            </div>

            {/* Photo Collage Grid */}
            {docPhotos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
                {docPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className="relative group border border-slate-300 p-2.5 bg-slate-50/70 rounded-xl space-y-2 flex flex-col justify-between transition hover:border-emerald-600/60 shadow-xs"
                  >
                    <div className="w-full h-44 sm:h-52 overflow-hidden rounded-lg bg-slate-200 border border-slate-200 relative">
                      <img
                        src={photo.url}
                        alt={photo.caption}
                        className="w-full h-full object-cover"
                        crossOrigin="anonymous"
                      />

                      <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition print:hidden">
                        <button
                          type="button"
                          onClick={() => handleStartEditCaption(photo)}
                          className="p-1.5 bg-white/95 hover:bg-emerald-50 text-emerald-800 rounded-md shadow-xs transition cursor-pointer border border-slate-200/80"
                          title="Edit caption"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(photo.id)}
                          className="p-1.5 bg-white/95 hover:bg-red-50 text-red-600 rounded-md shadow-xs transition cursor-pointer border border-slate-200/80"
                          title="Remove photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {editingPhotoId === photo.id ? (
                      <div className="space-y-1.5 pt-1 print:hidden">
                        <textarea
                          value={editingCaptionText}
                          onChange={(e) => setEditingCaptionText(e.target.value)}
                          placeholder="Enter description/caption..."
                          className="w-full p-2 text-xs font-serif border-2 border-emerald-600 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-700 leading-relaxed"
                          rows={2}
                          autoFocus
                        />
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingPhotoId(null)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-800 bg-slate-200/80 rounded-md cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveCaption(photo.id)}
                            className="px-3 py-1 text-[11px] font-bold text-white bg-emerald-700 hover:bg-emerald-600 rounded-md flex items-center gap-1 cursor-pointer shadow-xs"
                          >
                            <Check className="w-3 h-3" /> Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-center gap-1.5 px-1 py-0.5">
                        <p className="text-[11px] font-serif text-slate-800 text-center font-medium leading-relaxed flex-1">
                          {photo.caption}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleStartEditCaption(photo)}
                          className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-slate-200/60 rounded transition print:hidden cursor-pointer shrink-0"
                          title="Edit caption"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="my-8 p-8 border-2 border-dashed border-slate-300 rounded-2xl text-center space-y-3 bg-slate-50/60 print:hidden">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 font-sans">
                    No Documentation Photos Added Yet
                  </p>
                  <p className="text-xs text-slate-500 font-sans mt-0.5 max-w-md mx-auto">
                    Upload session photos, student activity sheets, or laboratory work using the button below. Photos attached during session logs will also automatically appear here.
                  </p>
                </div>
                <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-xs">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Documentation Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>
            )}

            {/* Parent-Teacher Conference (PTC) Specific Documentation Card */}
            <div className="mt-8 pt-6 border-t-2 border-dashed border-slate-300 text-center space-y-3">
              {ptcPhotoUrl ? (
                <div className="max-w-md mx-auto p-2 bg-slate-50/80 border border-slate-300 rounded-lg relative group">
                  <img
                    src={ptcPhotoUrl}
                    alt="Parent-Teacher Conference"
                    className="w-full h-56 object-cover rounded border border-slate-200"
                    crossOrigin="anonymous"
                  />
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 print:hidden">
                    <button
                      type="button"
                      onClick={() => {
                        if (!customPtcCaption)
                          setCustomPtcCaption(
                            `Photo taken during the Parent-Teacher Conference held on ${ptcDate}`
                          );
                        setIsEditingPtcCaption(!isEditingPtcCaption);
                      }}
                      className="p-1.5 bg-white/95 hover:bg-emerald-50 text-emerald-800 rounded-md shadow-xs transition cursor-pointer border border-slate-200/80"
                      title="Edit PTC caption"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPtcPhotoUrl(null)}
                      className="p-1.5 bg-white/95 hover:bg-red-50 text-red-600 rounded-md shadow-xs transition cursor-pointer border border-slate-200/80"
                      title="Remove PTC Photo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="max-w-md mx-auto p-6 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50/60 print:hidden text-center space-y-2">
                  <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload PTC Conference Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePtcPhotoUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[11px] text-slate-500 font-sans">
                    Optional: Upload photo documentation from your Parent-Teacher Conference held on {ptcDate}.
                  </p>
                </div>
              )}

              {isEditingPtcCaption ? (
                <div className="max-w-md mx-auto space-y-1.5 print:hidden">
                  <input
                    type="text"
                    value={
                      customPtcCaption ||
                      `Photo taken during the Parent-Teacher Conference held on ${ptcDate}`
                    }
                    onChange={(e) => setCustomPtcCaption(e.target.value)}
                    className="w-full p-2 text-xs font-serif border-2 border-emerald-600 rounded-lg text-center bg-white text-slate-900"
                    autoFocus
                  />
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingPtcCaption(false)}
                      className="px-3 py-1 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 rounded-md cursor-pointer"
                    >
                      Save Caption
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-1.5 max-w-lg mx-auto">
                  <p className="text-xs font-serif font-bold text-slate-900 leading-relaxed">
                    {customPtcCaption ||
                      `Photo taken during the Parent-Teacher Conference held on ${ptcDate}`}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (!customPtcCaption)
                        setCustomPtcCaption(
                          `Photo taken during the Parent-Teacher Conference held on ${ptcDate}`
                        );
                      setIsEditingPtcCaption(true);
                    }}
                    className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-slate-200/60 rounded transition print:hidden cursor-pointer shrink-0"
                    title="Edit PTC caption"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            <DepEdDocFooter />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. DOCUMENT VIEW: TLE ACCOMPLISHMENT REPORT (TABLE FORMAT)                */}
      {/* ========================================================================= */}
      {activeTab === 'ACCOMPLISHMENT_TABLE' && (
        <div
          id="printable-deped-doc-ACCOMPLISHMENT_TABLE"
          className="bg-white p-8 sm:p-12 rounded-2xl shadow-lg border border-slate-200 text-slate-900 max-w-4xl mx-auto print:shadow-none print:border-none print:p-0 font-serif"
        >
          <DepEdDocHeader department="Technology and Livelihood Education (TLE)" />

          <div className="text-center my-4 space-y-1">
            <h1 className="text-base sm:text-lg font-serif font-bold italic text-slate-900">
              Technology and Livelihood Education ({subjectSpecialization})
            </h1>
            <h2 className="text-sm sm:text-base font-serif font-black tracking-wide uppercase text-slate-950">
              {isHTMode
                ? `DEPARTMENTAL ACCOMPLISHMENT REPORT ON THE WHOLE ${programType.toUpperCase()} PROGRAM`
                : 'ACCOMPLISHMENT REPORT (TABLE FORMAT)'}
            </h2>
            <p className="text-xs font-serif font-bold text-slate-800">
              S.Y. {schoolYear} • {quarterPeriod}
            </p>
          </div>

          <div className="my-5 border-2 border-slate-900">
            <table className="w-full text-xs text-left border-collapse">
              <tbody className="divide-y-2 divide-slate-900">
                <tr>
                  <td className="w-1/3 p-3 border-r-2 border-slate-900 font-bold font-serif align-top text-slate-950 bg-slate-50/50">
                    {isHTMode
                      ? 'A. Head Teacher / Supervisor & Implementing Teachers:'
                      : 'A. Name of Teacher Assigned:'}
                  </td>
                  <td className="w-2/3 p-3 font-serif text-slate-900 space-y-1">
                    {isHTMode ? (
                      <>
                        <div className="font-bold">
                          Supervised by: {headTeacherName} ({headTeacherPosition})
                        </div>
                        <div>
                          <span className="font-semibold">
                            Implementing {subjectSpecialization} Teachers ({effectiveTeachersForReport.length}):
                          </span>{' '}
                          {effectiveTeachersForReport
                            .map(
                              (t) =>
                                `${t.teacherName} (${t.studentsCount} student${
                                  t.studentsCount === 1 ? '' : 's'
                                }, ${t.sessionsCount} session${t.sessionsCount === 1 ? '' : 's'})`
                            )
                            .join('; ')}
                        </div>
                      </>
                    ) : (
                      <span className="font-semibold">{teacherName}</span>
                    )}
                  </td>
                </tr>

                <tr>
                  <td className="p-3 border-r-2 border-slate-900 font-bold font-serif align-top text-slate-950 bg-slate-50/50">
                    B. Program:
                  </td>
                  <td className="p-3 font-serif font-semibold text-slate-900">
                    {isHTMode
                      ? programType === 'Skills Enhancement'
                        ? `Whole ${subjectSpecialization} Department Skills Enhancement Program (Teachers & Students)`
                        : programType === 'Combined'
                        ? `Whole ${subjectSpecialization} Department Consolidated Remediation & Skills Enhancement Programs (Teachers & Students)`
                        : `Whole ${subjectSpecialization} Department Remediation Program (Teachers & Students)`
                      : programType === 'Skills Enhancement'
                      ? 'Skills Enhancement Program'
                      : programType === 'Combined'
                      ? 'Consolidated Remediation & Skills Enhancement Programs'
                      : 'Remediation Program'}
                  </td>
                </tr>

                <tr>
                  <td className="p-3 border-r-2 border-slate-900 font-bold font-serif align-top text-slate-950 bg-slate-50/50">
                    C. Date and Venue:
                  </td>
                  <td className="p-3 font-serif text-slate-900 leading-relaxed">
                    <div>{reportDates}</div>
                    <div className="font-semibold">{reportVenue}</div>
                  </td>
                </tr>

                <tr>
                  <td className="p-3 border-r-2 border-slate-900 font-bold font-serif align-top text-slate-950 bg-slate-50/50">
                    D. Target Participants
                  </td>
                  <td className="p-3 font-serif text-slate-900 leading-relaxed text-justify">
                    {isHTMode
                      ? `The target participants of the whole ${programType.toLowerCase()} program are the ${totalStudents} enrolled students (${
                          sectionBreakdownText || 'across monitored TLE sections'
                        }) handled and instructed by ${
                          activeImplementingTeachers.length || supervisedTeachers.length
                        } supervised ${subjectSpecialization} teacher(s).`
                      : sectionBreakdownText
                      ? `The target participants are the students from ${sectionBreakdownText}, total of ${totalStudents} students.`
                      : `The target participants are the students enrolled in the ${programType.toLowerCase()} program (${totalStudents} students total).`}
                  </td>
                </tr>

                <tr>
                  <td className="p-3 border-r-2 border-slate-900 font-bold font-serif align-top text-slate-950 bg-slate-50/50">
                    E. Actual Participants
                  </td>
                  <td className="p-3 font-serif text-slate-900 leading-relaxed text-justify">
                    {isHTMode
                      ? `A total of ${actualParticipantsCount} students actively attended and completed ${totalSessions} intervention session(s) conducted by ${
                          activeImplementingTeachers.length || supervisedTeachers.length
                        } implementing ${subjectSpecialization} teacher(s)${
                          sectionBreakdownText ? ` across ${sectionBreakdownText}` : ''
                        }.`
                      : sectionBreakdownText
                      ? `The number of actual students who attended the program are ${actualParticipantsCount} students, ${sectionBreakdownText}.`
                      : `The number of actual students who attended the program are ${actualParticipantsCount} students.`}
                  </td>
                </tr>

                <tr>
                  <td className="p-3 border-r-2 border-slate-900 font-bold font-serif align-top text-slate-950 bg-slate-50/50">
                    F. Brief Description of Implemented Program or Activities
                  </td>
                  <td className="p-3 font-serif text-slate-900 leading-relaxed text-justify">
                    {isHTMode
                      ? `Under the instructional supervision of ${headTeacherName} (${headTeacherPosition}), the ${subjectSpecialization} department teachers implemented a coordinated ${
                          programType === 'Combined'
                            ? 'Remediation and Skills Enhancement program'
                            : `${programType} program`
                        } for their students using Simplified Modules, Targeted Reteaching Sessions, Learning Activity Sheets (LAS), and Hands-on Laboratory Exercises. The Head Teacher monitored teacher implementation, reviewed ${totalSessions} daily anecdotal session logs (${totalVerifiedSessionsCount} verified), and evaluated ${totalMovsSubmittedCount} submitted MOVs to ensure high-impact learning outcomes.`
                      : `To address the least mastered skills in ICT, a remediation program was implemented using three intervention tools: Simplified Modules, Reteaching Sessions, and Learning Activity Sheets (LAS). The simplified modules provide concepts in an easy-to-understand format, allowing learners to review lessons at their own pace. Reteaching sessions where the teacher revisited difficult topics and clarified misconceptions. Lastly, the LAS served as reinforcement activities, enabling learners to practice independently and apply what they had learned.`}
                  </td>
                </tr>

                <tr>
                  <td className="p-3 border-r-2 border-slate-900 font-bold font-serif align-top text-slate-950 bg-slate-50/50">
                    G. List of Implemented Activities or Intervention
                  </td>
                  <td className="p-3 font-serif text-slate-900 leading-relaxed">
                    <p className="mb-1.5">
                      {isHTMode
                        ? `Supervised ${subjectSpecialization} teachers and the Head Teacher executed the following classroom interventions and supervisory mechanisms:`
                        : 'Students were provided with following structured learning activities aimed at addressing their least mastered skills in ICT:'}
                    </p>
                    <ol className="list-none space-y-1 pl-3 font-medium">
                      <li className="flex items-start gap-2">
                        <span className="font-serif font-bold text-slate-800">i.</span>
                        <span>Simplified Modules & Self-Paced Instructional Guides</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-serif font-bold text-slate-800">ii.</span>
                        <span>Targeted Reteaching & Laboratory Demonstrations by Subject Teachers</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-serif font-bold text-slate-800">iii.</span>
                        <span>Learning Activity Sheets (LAS) & Practical Competency Checkpoints</span>
                      </li>
                      {isHTMode && (
                        <li className="flex items-start gap-2">
                          <span className="font-serif font-bold text-slate-800">iv.</span>
                          <span>
                            Head Teacher Instructional Supervision, Daily Log Verification ({totalVerifiedSessionsCount}/{totalSessions} logs), and MOV Rubric Evaluation ({totalMovsSubmittedCount} MOVs)
                          </span>
                        </li>
                      )}
                    </ol>
                  </td>
                </tr>

                <tr>
                  <td className="p-3 border-r-2 border-slate-900 font-bold font-serif align-top text-slate-950 bg-slate-50/50">
                    H. Results:
                  </td>
                  <td className="p-3 font-serif text-slate-900 leading-relaxed space-y-1.5">
                    <div className="font-semibold">
                      Out of {totalStudents} students enrolled across the program, {passedStudentsCount} students ({passRatePercent}%) achieved passing mastery after {totalSessions} conducted sessions, improving from a {avgBaseline}% baseline average to {overallAvgMastery}% post-intervention mastery.
                    </div>
                    {isHTMode && activeImplementingTeachers.length > 0 && (
                      <div className="text-[11px] text-slate-800">
                        <span className="font-bold">Per-Teacher Student Outcomes: </span>
                        {activeImplementingTeachers
                          .map(
                            (t) =>
                              `${t.teacherName}: ${t.passedCount}/${t.studentsCount} students passed (${t.avgBaseline}% → ${t.avgMastery}% avg mastery)`
                          )
                          .join(' • ')}
                      </div>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="pt-8 grid grid-cols-1 sm:grid-cols-2 gap-8 font-serif">
            <div>
              <p className="text-xs text-slate-800 font-medium mb-5">Prepared by:</p>
              <div>
                <p className="font-bold text-xs uppercase tracking-wide text-slate-950">
                  {teacherName}
                </p>
                <p className="text-[11px] text-slate-700">{teacherPosition}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-800 font-medium mb-5">Noted & Approved by:</p>
              <div>
                <p className="font-bold text-xs uppercase tracking-wide text-slate-950">
                  {principalName}
                </p>
                <p className="text-[11px] text-slate-700">{principalPosition}</p>
              </div>
            </div>
          </div>

          <DepEdDocFooter />
        </div>
      )}
    </div>
  );
};
