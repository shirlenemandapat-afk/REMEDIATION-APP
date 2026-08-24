import React, { useState } from 'react';
import { Student, SessionRecord, RemediationProgram, TeacherProfile, LEARNING_AREAS } from '../../types';
import {
  TrendingUp,
  BarChart2,
  PieChart,
  FileSpreadsheet,
  Printer,
  Download,
  Calendar,
  CheckCircle2,
  Target,
  Award,
  Users,
  Activity,
  ArrowUpRight,
  Filter,
} from 'lucide-react';

interface AdminAnalyticsReportsProps {
  students: Student[];
  sessions: SessionRecord[];
  programs: RemediationProgram[];
  teachers: TeacherProfile[];
}

export const AdminAnalyticsReports: React.FC<AdminAnalyticsReportsProps> = ({
  students,
  sessions,
  programs,
  teachers,
}) => {
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('Quarter 1 (2025-2026)');

  const activeStudents = students.filter((s) => !s.isArchived);

  // Filter students by subject
  const filteredStudents = activeStudents.filter((s) => {
    return selectedSubject === 'all' || s.subject === selectedSubject;
  });

  // Calculate Key Effectiveness Metrics
  const totalEnrolled = filteredStudents.length;

  const masteredCount = filteredStudents.filter((s) => s.status === 'Mastered / Promoted').length;
  const progressingCount = filteredStudents.filter((s) => s.status === 'Progressing').length;
  const needsRemediationCount = filteredStudents.filter((s) => s.status === 'Needs Remediation').length;

  const averageBaselineScore =
    totalEnrolled > 0
      ? Math.round(filteredStudents.reduce((acc, s) => acc + s.baselineScore, 0) / totalEnrolled)
      : 0;

  // Calculate current average score based on latest session or baseline
  const currentScores = filteredStudents.map((s) => {
    const studentSessions = sessions.filter((sess) => sess.studentId === s.id);
    if (studentSessions.length === 0) return s.baselineScore;
    return studentSessions[studentSessions.length - 1].score;
  });

  const averageCurrentScore =
    totalEnrolled > 0
      ? Math.round(currentScores.reduce((acc, score) => acc + score, 0) / totalEnrolled)
      : 0;

  const overallGain = averageCurrentScore - averageBaselineScore;
  const effectivenessRate =
    totalEnrolled > 0 ? Math.round(((masteredCount + progressingCount) / totalEnrolled) * 100) : 0;

  // Attendance breakdown
  const highAttendanceStudents = filteredStudents.filter((s) => {
    const count = sessions.filter((sess) => sess.studentId === s.id).length;
    return count >= 3;
  });

  const highAttendanceAvgGain =
    highAttendanceStudents.length > 0
      ? Math.round(
          highAttendanceStudents.reduce((acc, s) => {
            const stSessions = sessions.filter((sess) => sess.studentId === s.id);
            const latest = stSessions[stSessions.length - 1]?.score || s.baselineScore;
            return acc + (latest - s.baselineScore);
          }, 0) / highAttendanceStudents.length
        )
      : 0;

  // Export CSV Report
  const handleExportCSV = () => {
    const headers = [
      'Student Name',
      'Grade & Section',
      'Learning Area',
      'Baseline Score (%)',
      'Latest Score (%)',
      'Net Improvement',
      'Sessions Attended',
      'Current Status',
    ];

    const rows = filteredStudents.map((s) => {
      const stSessions = sessions.filter((sess) => sess.studentId === s.id);
      const latest = stSessions[stSessions.length - 1]?.score || s.baselineScore;
      const gain = latest - s.baselineScore;
      return [
        `"${s.lastName}, ${s.firstName} ${s.middleInitial}"`,
        `"${s.gradeLevel} - ${s.section}"`,
        `"${s.subject}"`,
        s.baselineScore,
        latest,
        gain >= 0 ? `+${gain}` : gain,
        stSessions.length,
        `"${s.status}"`,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DepEd_TLE_Remediation_Analytics_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm print:hidden">
        <div>
          <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-700" />
            Remediation Analytics & Institutional Department Reports
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Diagnostic gains, mastery conversion rates, attendance-performance correlations, and DepEd Division compliant summaries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold rounded-xl text-xs transition flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-yellow-300" />
            EXPORT SPREADSHEET (CSV)
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-extrabold rounded-xl text-xs transition flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4 text-yellow-300" />
            PRINT REPORT
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" /> Filter Area:
          </span>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All 6 TLE Learning Areas</option>
            {LEARNING_AREAS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold">Evaluation Period:</span>
          <span className="text-xs font-mono font-extrabold text-slate-800 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            {selectedPeriod}
          </span>
        </div>
      </div>

      {/* Official DepEd Header when printing */}
      <div className="hidden print:block text-center space-y-1 pb-4 border-b border-slate-300">
        <p className="text-xs font-bold uppercase text-slate-600">Republic of the Philippines • Department of Education</p>
        <p className="text-sm font-black text-slate-900">RAMON MAGSAYSAY (CUBAO) HIGH SCHOOL</p>
        <p className="text-xs text-slate-600">Technology and Livelihood Education (TLE) Department • SDO Quezon City</p>
        <h3 className="text-base font-black text-slate-900 pt-2 uppercase">
          Comprehensive Remediation Program Effectiveness & Mastery Summary
        </h3>
        <p className="text-[11px] text-slate-500 font-mono">Academic Year 2025-2026 • As of {new Date().toLocaleDateString()}</p>
      </div>

      {/* Executive Key Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Program Effectiveness</span>
            <Target className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-950 font-mono">{effectivenessRate}%</span>
            <span className="text-xs text-emerald-700 font-bold">Positive Growth</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${effectivenessRate}%` }} />
          </div>
          <p className="text-[10px] text-slate-400">Learners showing mastery or progressing</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Pre vs Post Gain</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-blue-950 font-mono">
              {overallGain >= 0 ? `+${overallGain}%` : `${overallGain}%`}
            </span>
            <span className="text-xs text-blue-700 font-bold">Average Delta</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-600 font-mono pt-1">
            <span>Baseline: {averageBaselineScore}%</span>
            <span>Current: {averageCurrentScore}%</span>
          </div>
          <p className="text-[10px] text-slate-400">Longitudinal cohort score shift</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Mastery Promoted</span>
            <Award className="w-4 h-4 text-yellow-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-mono">{masteredCount}</span>
            <span className="text-xs text-slate-500 font-bold">/ {totalEnrolled} Learners</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-yellow-500 h-full rounded-full"
              style={{ width: `${totalEnrolled > 0 ? (masteredCount / totalEnrolled) * 100 : 0}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400">Achieved full competency mastery (≥85%)</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Attendance Correlation</span>
            <Activity className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-indigo-950 font-mono">+{highAttendanceAvgGain}%</span>
            <span className="text-xs text-indigo-700 font-bold">High Attendance</span>
          </div>
          <p className="text-[11px] text-slate-600 pt-1">
            Learners attending ≥3 sessions gained an extra <strong className="text-indigo-900">+{highAttendanceAvgGain}%</strong> score advantage.
          </p>
          <p className="text-[10px] text-slate-400">Verified attendance impact</p>
        </div>
      </div>

      {/* Learning Area Breakdown Matrix */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-4">
        <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-emerald-700" />
          Learning Area Comparative Performance & Progress Breakdown
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px]">
              <tr>
                <th className="px-4 py-3">TLE Learning Area</th>
                <th className="px-4 py-3 text-center">Enrolled Learners</th>
                <th className="px-4 py-3 text-center">Avg Diagnostic</th>
                <th className="px-4 py-3 text-center">Avg Post-Remediation</th>
                <th className="px-4 py-3 text-center">Net Score Gain</th>
                <th className="px-4 py-3 text-center">Mastery Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {LEARNING_AREAS.map((area) => {
                const areaStudents = activeStudents.filter((s) => s.subject === area);
                const count = areaStudents.length;
                const baseAvg =
                  count > 0 ? Math.round(areaStudents.reduce((acc, s) => acc + s.baselineScore, 0) / count) : 0;

                const currScores = areaStudents.map((s) => {
                  const sSess = sessions.filter((sess) => sess.studentId === s.id);
                  return sSess.length > 0 ? sSess[sSess.length - 1].score : s.baselineScore;
                });
                const currAvg = count > 0 ? Math.round(currScores.reduce((a, b) => a + b, 0) / count) : 0;
                const gain = currAvg - baseAvg;

                const mastered = areaStudents.filter((s) => s.status === 'Mastered / Promoted').length;
                const rate = count > 0 ? Math.round((mastered / count) * 100) : 0;

                return (
                  <tr key={area} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3.5 font-extrabold text-slate-900">{area}</td>
                    <td className="px-4 py-3.5 text-center font-bold text-slate-700">{count}</td>
                    <td className="px-4 py-3.5 text-center font-mono">{baseAvg > 0 ? `${baseAvg}%` : '-'}</td>
                    <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-900">
                      {currAvg > 0 ? `${currAvg}%` : '-'}
                    </td>
                    <td className="px-4 py-3.5 text-center font-mono font-bold">
                      {count > 0 ? (
                        <span className={gain >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                          {gain >= 0 ? `+${gain}%` : `${gain}%`}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center font-mono font-bold text-emerald-800">
                      {count > 0 ? `${rate}%` : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sign-off for printable DepEd Compliance */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-6">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Official DepEd Department Sign-off</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 text-xs">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-400 uppercase">Prepared by:</p>
            <div className="pt-8 border-b border-slate-300" />
            <p className="font-extrabold text-slate-900 mt-1">LEOPOLDO F. ESTABILLO JR.</p>
            <p className="text-[11px] text-slate-500">Remediation Coordinator / Teacher I</p>
          </div>

          <div className="space-y-1">
            <p className="text-[10px] text-slate-400 uppercase">Reviewed by:</p>
            <div className="pt-8 border-b border-slate-300" />
            <p className="font-extrabold text-slate-900 mt-1">DEPARTMENT HEAD, TLE</p>
            <p className="text-[11px] text-slate-500">Technology and Livelihood Education</p>
          </div>

          <div className="space-y-1">
            <p className="text-[10px] text-slate-400 uppercase">Noted & Approved by:</p>
            <div className="pt-8 border-b border-slate-300" />
            <p className="font-extrabold text-slate-900 mt-1">PRINCIPAL IV / SCHOOL HEAD</p>
            <p className="text-[11px] text-slate-500">Ramon Magsaysay (Cubao) High School</p>
          </div>
        </div>
      </div>
    </div>
  );
};
