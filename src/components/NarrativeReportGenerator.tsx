import React, { useState, useEffect } from 'react';
import { Student, SessionRecord, TeacherProfile, interpretMasteryLevel } from '../types';
import { SchoolLogo } from './SchoolLogo';
import { safePrintDocument, downloadPDFDocument } from '../utils/printHelper';
import { Printer, Copy, Download, FileCheck2, Filter, Sparkles, Check, School, ShieldCheck, UserCheck, BookOpen, Layers, Loader2 } from 'lucide-react';
import { IndividualAnecdotalReportModal } from './IndividualAnecdotalReportModal';

interface NarrativeReportGeneratorProps {
  teacher: TeacherProfile;
  students: Student[];
  sessions: SessionRecord[];
  sectionsList: string[];
}

export const NarrativeReportGenerator: React.FC<NarrativeReportGeneratorProps> = ({
  teacher,
  students,
  sessions,
  sectionsList,
}) => {
  const [selectedSection, setSelectedSection] = useState<string>('ALL');
  const [reportType, setReportType] = useState<'ALL' | 'Remediation' | 'Skills Enhancement'>('ALL');
  const [periodTitle, setPeriodTitle] = useState<string>(`First Quarter AY ${teacher.academicYear || '2025-2026'}`);
  const [headTeacherName, setHeadTeacherName] = useState<string>(teacher.headTeacherName || 'Dr. Corazon V. Santos');
  const [headTeacherPosition, setHeadTeacherPosition] = useState<string>(teacher.headTeacherPosition || 'Head Teacher III / TLE Department');
  const [principalName, setPrincipalName] = useState<string>(teacher.principalName || 'Dr. Maria Luisa T. Ramos');
  const [principalPosition, setPrincipalPosition] = useState<string>(teacher.principalPosition || 'Secondary School Principal IV');
  const [copied, setCopied] = useState<boolean>(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState<boolean>(false);
  const [selectedStudentForAnecdotal, setSelectedStudentForAnecdotal] = useState<Student | null>(null);

  // Sync state if teacher profile updates in settings
  useEffect(() => {
    if (teacher.headTeacherName) setHeadTeacherName(teacher.headTeacherName);
    if (teacher.headTeacherPosition) setHeadTeacherPosition(teacher.headTeacherPosition);
    if (teacher.principalName) setPrincipalName(teacher.principalName);
    if (teacher.principalPosition) setPrincipalPosition(teacher.principalPosition);
  }, [teacher]);

  // Filter Data according to Report Type and Section
  const filteredStudents = students.filter((s) => {
    const matchSec = selectedSection === 'ALL' || s.section === selectedSection || `${s.gradeLevel} - ${s.section}` === selectedSection;
    const matchProg = reportType === 'ALL' || s.programType === reportType;
    return matchSec && matchProg;
  });

  const filteredStudentIds = new Set(filteredStudents.map((s) => s.id));

  const filteredSessions = sessions
    .filter((sess) => filteredStudentIds.has(sess.studentId))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Collect attached MOVs
  const allMovs = filteredSessions.flatMap((s) => s.movs || []);

  // Compute Statistics
  const totalStudents = filteredStudents.length;
  const totalSessions = filteredSessions.length;

  const avgBaseline = totalStudents > 0
    ? Math.round(filteredStudents.reduce((acc, s) => acc + s.baselineScore, 0) / totalStudents)
    : 0;

  // Calculate per-student average mastery strictly across activities conducted during remediation sessions
  const studentMasteryStats = filteredStudents.map((s) => {
    const sSessions = sessions
      .filter((sess) => sess.studentId === s.id)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const sessionScores = sSessions.map((sess) => sess.score);
    const avgStudentMastery =
      sessionScores.length > 0
        ? Math.round(sessionScores.reduce((sum, sc) => sum + sc, 0) / sessionScores.length)
        : s.baselineScore;
    const latestScore = sessionScores.length > 0 ? sessionScores[sessionScores.length - 1] : s.baselineScore;

    return {
      student: s,
      sessionsCount: sSessions.length,
      baseline: s.baselineScore,
      latest: latestScore,
      avgMastery: avgStudentMastery,
      masteryLevel: interpretMasteryLevel(avgStudentMastery),
    };
  });

  const overallAvgMastery = studentMasteryStats.length > 0
    ? Math.round(studentMasteryStats.reduce((acc, item) => acc + item.avgMastery, 0) / studentMasteryStats.length)
    : 0;

  const overallLatestAvg = studentMasteryStats.length > 0
    ? Math.round(studentMasteryStats.reduce((acc, item) => acc + item.latest, 0) / studentMasteryStats.length)
    : 0;

  const masteredCount = filteredStudents.filter((s) => s.status === 'Mastered / Promoted').length;
  const progressingCount = filteredStudents.filter((s) => s.status === 'Progressing').length;
  const needsSupportCount = filteredStudents.filter((s) => s.status === 'Needs Remediation').length;

  // Top Activity Types Used
  const activityMap = new Map<string, number>();
  filteredSessions.forEach((sess) => {
    const acts = sess.activityTypes && sess.activityTypes.length > 0 ? sess.activityTypes : [sess.activityType];
    acts.forEach((act) => {
      activityMap.set(act, (activityMap.get(act) || 0) + 1);
    });
  });
  const topActivities = Array.from(activityMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([act]) => act)
    .slice(0, 4)
    .join(', ');

  // Report Specific Title & Descriptions
  const reportHeaderTitle =
    reportType === 'Remediation'
      ? 'REMEDIAL PROGRAM ACCOMPLISHMENT REPORT'
      : reportType === 'Skills Enhancement'
      ? 'SKILLS ENHANCEMENT PROGRAM ACCOMPLISHMENT REPORT'
      : 'CONSOLIDATED NARRATIVE ACCOMPLISHMENT REPORT';

  const reportSubtitle =
    reportType === 'Remediation'
      ? 'PROJECT S.M.I.L.E. — REMEDIATION & LEARNING RECOVERY TRACK'
      : reportType === 'Skills Enhancement'
      ? 'PROJECT S.M.I.L.E. — SKILLS ENHANCEMENT & TECHNICAL ENRICHMENT TRACK'
      : 'PROJECT S.M.I.L.E. (STUDENT MONITORING AND INTERVENTION FOR LEARNING ENHANCEMENT)';

  // Synthesize Narrative Text
  const narrativeText = `
I. PROGRAM CONTEXT & OBJECTIVES
During the ${periodTitle}, ${teacher.name} (${teacher.title}) conducted the ${reportHeaderTitle} at ${teacher.schoolName}, ${teacher.division}. The initiative supported ${totalStudents} student(s) in ${selectedSection === 'ALL' ? 'all designated classes' : selectedSection} enrolled in ${reportType === 'ALL' ? 'Remediation and Skills Enhancement' : reportType}.

II. IMPLEMENTATION HIGHLIGHTS & STRATEGIES
A total of ${totalSessions} individual and group anecdotal sessions were conducted. Dominant pedagogical interventions included: ${topActivities || 'Targeted Reteaching, Guided Hands-on Practice, and Performance Tasks'}.

III. STATISTICAL OUTCOMES & MASTERY SUMMARY
- Total Students Monitored: ${totalStudents}
- Total Sessions Conducted: ${totalSessions}
- Class Baseline Mean: ${avgBaseline}%
- Post-Intervention Latest Mean: ${overallLatestAvg}%
- Class Cumulative Average Mastery Percentage: ${overallAvgMastery}% (${interpretMasteryLevel(overallAvgMastery).description})
- Net Performance Growth: +${overallLatestAvg - avgBaseline}%
- Mastered / Promoted: ${masteredCount} (${totalStudents > 0 ? Math.round((masteredCount / totalStudents) * 100) : 0}%)
- Progressing: ${progressingCount}
- Requiring Sustained Remediation: ${needsSupportCount}

IV. RECOMMENDATIONS
1. Maintain regular anecdotal log tracking and MOVs archiving.
2. Provide continuous enrichment exercises for learners reaching mastery level.
3. Sustain home-school coordination with parents through formal anecdotal report issuance.
  `.trim();

  const handleCopyText = () => {
    navigator.clipboard.writeText(narrativeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reportDocFilename = `${reportType}_Accomplishment_Report_${selectedSection}_${periodTitle.replace(/[^a-zA-Z0-9]/g, '_')}`;

  const handlePrint = () => {
    safePrintDocument('printable-narrative-report', reportDocFilename);
  };

  const handleDownloadPDF = async () => {
    setIsDownloadingPDF(true);
    try {
      await downloadPDFDocument('printable-narrative-report', reportDocFilename, {
        format: 'a4',
        orientation: 'portrait',
      });
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Student ID',
      'Last Name',
      'First Name',
      'MI',
      'Grade',
      'Section',
      'Subject',
      'Program Type',
      'Baseline Score (%)',
      'Latest Score (%)',
      'Average Mastery (%)',
      'Mastery Level Description',
      'Total Sessions',
      'Status'
    ];
    const rows = studentMasteryStats.map(({ student: s, baseline, latest, avgMastery, masteryLevel, sessionsCount }) => [
      s.id,
      `"${s.lastName}"`,
      `"${s.firstName}"`,
      `"${s.middleInitial}"`,
      `"${s.gradeLevel}"`,
      `"${s.section}"`,
      `"${s.subject}"`,
      `"${s.programType}"`,
      baseline,
      latest,
      avgMastery,
      `"${masteryLevel.description}"`,
      sessionsCount,
      `"${s.status}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${reportType}_Accomplishment_Report_${selectedSection}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Non-Printable Configuration Controls */}
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-emerald-100 print:hidden space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-emerald-950 flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-emerald-700" />
              Accomplishment Report Generator
            </h2>
            <p className="text-xs text-slate-500">
              Generate separate Remedial, Skills Enhancement, or Consolidated reports with average mastery percentage.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloadingPDF}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-yellow-300 font-extrabold rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm border border-emerald-500 cursor-pointer disabled:opacity-50"
              title="Automatically download official Accomplishment Report PDF"
            >
              {isDownloadingPDF ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-yellow-300" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-yellow-300" />
                  <span>Download PDF Report</span>
                </>
              )}
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-emerald-950 font-extrabold rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm border border-amber-300 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Report</span>
            </button>
            <button
              onClick={handleCopyText}
              className="px-3.5 py-2 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-200 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy Narrative'}
            </button>
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-200 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Report Mode Switcher (Option for Separate Remedial & Skills Enhancement Reports) */}
        <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-emerald-950 mr-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-emerald-700" />
              Report Scope:
            </span>
            <button
              onClick={() => setReportType('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition ${
                reportType === 'ALL'
                  ? 'bg-emerald-800 text-yellow-300 shadow-xs border border-emerald-900'
                  : 'bg-white text-slate-700 hover:bg-emerald-100'
              }`}
            >
              Consolidated (All Programs)
            </button>
            <button
              onClick={() => setReportType('Remediation')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition ${
                reportType === 'Remediation'
                  ? 'bg-emerald-800 text-yellow-300 shadow-xs border border-emerald-900'
                  : 'bg-white text-slate-700 hover:bg-emerald-100'
              }`}
            >
              Separate Remedial Report Only
            </button>
            <button
              onClick={() => setReportType('Skills Enhancement')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition ${
                reportType === 'Skills Enhancement'
                  ? 'bg-emerald-800 text-yellow-300 shadow-xs border border-emerald-900'
                  : 'bg-white text-slate-700 hover:bg-emerald-100'
              }`}
            >
              Separate Skills Enhancement Report Only
            </button>
          </div>

          <div className="text-xs text-emerald-800 font-semibold">
            Filtered Students: <strong className="text-emerald-950 font-bold">{totalStudents}</strong> &bull; Sessions: <strong className="text-emerald-950 font-bold">{totalSessions}</strong>
          </div>
        </div>

        {/* Filter & Signatory Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Target Section Filter</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
            >
              <option value="ALL">All Sections</option>
              {sectionsList.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Period / Academic Quarter</label>
            <input
              type="text"
              value={periodTitle}
              onChange={(e) => setPeriodTitle(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Dept. Head Signatory</label>
            <input
              type="text"
              value={headTeacherName}
              onChange={(e) => setHeadTeacherName(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Principal Signatory</label>
            <input
              type="text"
              value={principalName}
              onChange={(e) => setPrincipalName(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
            />
          </div>
        </div>
      </div>

      {/* FORMAL NARRATIVE REPORT PAPER DOCUMENT VIEW (PRINT FRIENDLY) */}
      <div id="printable-narrative-report" className="bg-white p-8 sm:p-12 rounded-2xl shadow-lg border border-emerald-100 text-slate-900 max-w-4xl mx-auto print:shadow-none print:border-none print:p-0">
        {/* DepEd Document Header with Official Logo */}
        <div className="flex items-center justify-between pb-4 border-b-2 border-emerald-900">
          <SchoolLogo size="md" showShadow={false} />
          <div className="text-center space-y-0.5 flex-1 px-4">
            <p className="text-xs font-serif uppercase tracking-widest text-slate-600">Republic of the Philippines</p>
            <p className="text-sm font-bold uppercase tracking-wider font-serif text-emerald-950">Department of Education</p>
            <p className="text-xs font-semibold text-slate-700">{teacher.region} &bull; {teacher.division}</p>
            <p className="text-base font-extrabold text-emerald-900 uppercase tracking-wide pt-0.5 font-serif">
              RAMON MAGSAYSAY (CUBAO) HIGH SCHOOL
            </p>
            <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">
              Technology and Livelihood Education (TLE) Department
            </p>
          </div>
          <div className="w-14 h-14 rounded-full border border-emerald-800 flex items-center justify-center p-1 bg-emerald-50 shrink-0">
            <span className="text-[9px] font-black text-emerald-900 text-center leading-tight">
              PROJECT<br />S.M.I.L.E.
            </span>
          </div>
        </div>

        {/* Dynamic Report Title */}
        <div className="text-center py-4 border-b border-amber-300">
          <div className="inline-block px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 mb-1.5">
            PROJECT S.M.I.L.E.
          </div>
          <h1 className="text-lg sm:text-xl font-black font-serif uppercase tracking-wide text-emerald-950">
            {reportHeaderTitle}
          </h1>
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mt-0.5">
            {reportSubtitle}
          </p>
          <p className="text-xs italic text-emerald-800 font-semibold">{periodTitle}</p>
        </div>

        {/* SECTION 1: EXECUTIVE SUMMARY */}
        <div className="py-6 space-y-3">
          <h2 className="text-sm font-bold font-serif uppercase text-slate-900 border-b border-slate-300 pb-1">
            I. Program Background & Context
          </h2>
          <p className="text-xs sm:text-sm text-slate-800 leading-relaxed text-justify">
            During the <strong>{periodTitle}</strong>, <strong>{teacher.name}</strong> ({teacher.title}) conducted <strong>Project S.M.I.L.E. (Student Monitoring and Intervention for Learning Enhancement)</strong> at <strong>{teacher.schoolName}</strong> under the Technology and Livelihood Education (TLE) Department. The program focused on providing structured instruction, continuous anecdotal logging, and competency assessment for <strong>{totalStudents}</strong> student(s) in <strong>{selectedSection === 'ALL' ? 'All Classes' : selectedSection}</strong> across ICT, Agri-Fishery Arts (AFA), Family & Consumer Sciences (FCS), and Industrial Arts (IA).
          </p>
        </div>

        {/* SECTION 2: STATISTICAL SUMMARY TABLE (WITH AVERAGE MASTERY PERCENTAGE) */}
        <div className="py-2 space-y-3">
          <h2 className="text-sm font-bold font-serif uppercase text-slate-900 border-b border-slate-300 pb-1">
            II. Statistical Accomplishment Matrix
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold font-serif">
                  <th className="p-2 border border-slate-300">Metric Description</th>
                  <th className="p-2 border border-slate-300 text-center">Initial / Baseline</th>
                  <th className="p-2 border border-slate-300 text-center">Current / Post-Intervention</th>
                  <th className="p-2 border border-slate-300 text-center">Accomplishment / Mastery Analysis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                <tr>
                  <td className="p-2 border border-slate-300 font-semibold">Total Students Enrolled</td>
                  <td className="p-2 border border-slate-300 text-center">{totalStudents}</td>
                  <td className="p-2 border border-slate-300 text-center">{totalStudents}</td>
                  <td className="p-2 border border-slate-300 text-center font-bold text-emerald-700">100% Coverage</td>
                </tr>
                <tr>
                  <td className="p-2 border border-slate-300 font-semibold">Total Anecdotal Sessions Logged</td>
                  <td className="p-2 border border-slate-300 text-center">—</td>
                  <td className="p-2 border border-slate-300 text-center font-bold">{totalSessions}</td>
                  <td className="p-2 border border-slate-300 text-center text-slate-600">Daily Formative Sessions</td>
                </tr>
                <tr>
                  <td className="p-2 border border-slate-300 font-semibold">Class Mean Assessment Score</td>
                  <td className="p-2 border border-slate-300 text-center">{avgBaseline}%</td>
                  <td className="p-2 border border-slate-300 text-center font-bold text-blue-800">{overallLatestAvg}%</td>
                  <td className="p-2 border border-slate-300 text-center font-bold text-emerald-700">
                    +{overallLatestAvg - avgBaseline}% Net Growth
                  </td>
                </tr>
                <tr className="bg-emerald-50/50">
                  <td className="p-2 border border-slate-300 font-bold text-emerald-950">
                    Average Percentage of Level of Mastery
                  </td>
                  <td className="p-2 border border-slate-300 text-center font-semibold">{avgBaseline}%</td>
                  <td className="p-2 border border-slate-300 text-center font-black text-emerald-900">{overallAvgMastery}%</td>
                  <td className="p-2 border border-slate-300 text-center font-bold text-emerald-800">
                    {interpretMasteryLevel(overallAvgMastery).description}
                  </td>
                </tr>
                <tr>
                  <td className="p-2 border border-slate-300 font-semibold">Mastered / Promoted Students</td>
                  <td className="p-2 border border-slate-300 text-center">0</td>
                  <td className="p-2 border border-slate-300 text-center font-bold text-emerald-700">{masteredCount}</td>
                  <td className="p-2 border border-slate-300 text-center font-bold text-emerald-700">
                    {totalStudents > 0 ? Math.round((masteredCount / totalStudents) * 100) : 0}% Promotion Rate
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 3: NARRATIVE HIGHLIGHTS */}
        <div className="py-6 space-y-3">
          <h2 className="text-sm font-bold font-serif uppercase text-slate-900 border-b border-slate-300 pb-1">
            III. Narrative Implementation Highlights & Observations
          </h2>
          <div className="text-xs sm:text-sm text-slate-800 leading-relaxed space-y-2 text-justify">
            <p>
              The program utilized systematic diagnostic scoring, multi-strategy intervention techniques, and per-session focus competency tracking. A total of <strong>{totalSessions} daily anecdotal entries</strong> were logged, incorporating key activities such as <em>{topActivities || 'Targeted Reteaching, Guided Hands-on Practice, and Performance Tasks'}</em>.
            </p>
            <p>
              Teachers observed heightened task persistence, improved technical precision, and marked advancement across evaluated criteria. The student evaluation process automatically derived mastery level benchmarks to guide customized remedial tasks and skills advancement.
            </p>
          </div>
        </div>

        {/* SECTION 4: INDIVIDUAL STUDENT ROSTER (WITH AVERAGE MASTERY PERCENTAGE COLUMN) */}
        <div className="py-2 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-300 pb-1">
            <h2 className="text-sm font-bold font-serif uppercase text-slate-900">
              IV. Individual Student Accomplishment Log & Mastery Breakdown
            </h2>
            <span className="text-[11px] text-slate-500 font-medium print:hidden">
              Click student row for printable Anecdotal Report
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold font-serif">
                  <th className="p-2 border border-slate-300">Student Name</th>
                  <th className="p-2 border border-slate-300">Section</th>
                  <th className="p-2 border border-slate-300">Program</th>
                  <th className="p-2 border border-slate-300 text-center">Baseline</th>
                  <th className="p-2 border border-slate-300 text-center">Latest</th>
                  <th className="p-2 border border-slate-300 text-center bg-emerald-50 text-emerald-950 font-extrabold">
                    Average % of Level of Mastery
                  </th>
                  <th className="p-2 border border-slate-300 text-center">Mastery Level</th>
                  <th className="p-2 border border-slate-300 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {studentMasteryStats.map(({ student: s, baseline, latest, avgMastery, masteryLevel, sessionsCount }) => (
                  <tr
                    key={s.id}
                    onClick={() => setSelectedStudentForAnecdotal(s)}
                    className="hover:bg-emerald-50/50 cursor-pointer transition"
                    title="Click to preview printable Anecdotal Parent's Copy"
                  >
                    <td className="p-2 border border-slate-300 font-semibold text-slate-900">
                      {s.lastName}, {s.firstName} {s.middleInitial}
                    </td>
                    <td className="p-2 border border-slate-300">{s.gradeLevel} - {s.section}</td>
                    <td className="p-2 border border-slate-300 font-medium">{s.programType}</td>
                    <td className="p-2 border border-slate-300 text-center">{baseline}%</td>
                    <td className="p-2 border border-slate-300 text-center font-bold text-blue-700">{latest}%</td>
                    <td className="p-2 border border-slate-300 text-center font-black text-emerald-900 bg-emerald-50/40">
                      {avgMastery}%
                    </td>
                    <td className="p-2 border border-slate-300 text-center text-[10px] font-bold text-slate-700">
                      {masteryLevel.description}
                    </td>
                    <td className="p-2 border border-slate-300 text-center font-bold">
                      <span className={s.status === 'Mastered / Promoted' ? 'text-emerald-700' : 'text-slate-700'}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 5: MOVs PHOTO ANNEX */}
        {allMovs.length > 0 && (
          <div className="py-6 space-y-3 page-break-before">
            <h2 className="text-sm font-bold font-serif uppercase text-slate-900 border-b border-slate-300 pb-1">
              V. Means of Verification (MOVs) Photo Documentation
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              {allMovs.slice(0, 6).map((mov, idx) => (
                <div key={`${mov.id}-${idx}`} className="border border-slate-300 p-2 text-center rounded-lg bg-slate-50">
                  <img
                    src={mov.dataUrl}
                    alt={mov.name}
                    className="w-full h-28 object-cover rounded-md mb-1.5 border border-slate-200"
                  />
                  <p className="text-[10px] font-bold text-slate-800 truncate">{mov.name}</p>
                  <p className="text-[9px] text-slate-600 line-clamp-2">{mov.caption || 'Verification Photo'}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 6: SIGNATORIES */}
        <div className="pt-12 space-y-8 print:pt-8">
          <p className="text-xs font-semibold text-slate-800">Prepared and submitted by:</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div>
              <p className="font-bold text-xs uppercase underline decoration-slate-800 underline-offset-4">
                {teacher.name}
              </p>
              <p className="text-[11px] text-slate-600">{teacher.title}</p>
              <p className="text-[10px] text-slate-500 italic">Program Adviser / Subject Teacher</p>
            </div>

            <div>
              <p className="font-bold text-xs uppercase underline decoration-slate-800 underline-offset-4">
                {headTeacherName}
              </p>
              <p className="text-[11px] text-slate-600 font-medium">{headTeacherPosition}</p>
              <p className="text-[10px] text-slate-500 italic">Recommending Approval</p>
            </div>

            <div>
              <p className="font-bold text-xs uppercase underline decoration-slate-800 underline-offset-4">
                {principalName}
              </p>
              <p className="text-[11px] text-slate-600 font-medium">{principalPosition}</p>
              <p className="text-[10px] text-slate-500 italic">Approved by</p>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded Printable Anecdotal Modal */}
      {selectedStudentForAnecdotal && (
        <IndividualAnecdotalReportModal
          isOpen={!!selectedStudentForAnecdotal}
          onClose={() => setSelectedStudentForAnecdotal(null)}
          student={selectedStudentForAnecdotal}
          sessions={sessions}
          teacher={teacher}
        />
      )}
    </div>
  );
};

