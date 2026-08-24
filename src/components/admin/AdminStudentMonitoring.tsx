import React, { useState } from 'react';
import { Student, SessionRecord, interpretMasteryLevel } from '../../types';
import {
  GraduationCap,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  FileText,
  Printer,
  ChevronRight,
  TrendingUp,
  Image as ImageIcon,
  Activity,
  Layers,
  Award,
} from 'lucide-react';

interface AdminStudentMonitoringProps {
  students: Student[];
  sessions: SessionRecord[];
  onSelectStudent?: (student: Student) => void;
}

export const AdminStudentMonitoring: React.FC<AdminStudentMonitoringProps> = ({
  students,
  sessions,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    students[0]?.id || null
  );

  const activeStudents = students.filter((s) => !s.isArchived);

  // Filtered Students
  const filteredStudents = activeStudents.filter((s) => {
    const matchesSearch =
      `${s.lastName}, ${s.firstName} ${s.middleInitial}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.section.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.subject.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesGrade = gradeFilter === 'all' || s.gradeLevel === gradeFilter;
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;

    return matchesSearch && matchesGrade && matchesStatus;
  });

  const currentStudent = activeStudents.find((s) => s.id === selectedStudentId) || filteredStudents[0] || null;

  // Student specific session logs
  const studentSessions = currentStudent
    ? sessions.filter((sess) => sess.studentId === currentStudent.id).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    : [];

  // Attendance Record
  const totalSessionsAttended = studentSessions.length;
  const latestSession = studentSessions[studentSessions.length - 1];
  const latestScore = latestSession ? latestSession.score : currentStudent?.baselineScore || 0;
  const scoreImprovement = currentStudent ? latestScore - currentStudent.baselineScore : 0;

  // Mastered vs Needing Improvement Competencies
  const masteredCompetencies = studentSessions
    .filter((s) => s.score >= 75)
    .map((s) => ({
      competency: s.focusCompetency,
      score: s.score,
      date: s.date,
      mastery: interpretMasteryLevel(s.score),
    }));

  const improvementCompetencies = studentSessions
    .filter((s) => s.score < 75)
    .map((s) => ({
      competency: s.focusCompetency,
      score: s.score,
      date: s.date,
      mastery: interpretMasteryLevel(s.score),
    }));

  // Trigger browser print for student progress dossier
  const handlePrintStudentReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm print:hidden">
        <div>
          <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-emerald-700" />
            Student Remediation & Competency Progress Monitoring
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Detailed longitudinal records per learner: Attendance history, assessment scores, mastered competencies, teacher remarks, and verification evidence.
          </p>
        </div>

        {currentStudent && (
          <button
            type="button"
            onClick={handlePrintStudentReport}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-extrabold rounded-xl text-xs transition flex items-center gap-2 shadow-sm cursor-pointer active:scale-95 shrink-0"
          >
            <Printer className="w-4 h-4 text-yellow-300" />
            PRINT INDIVIDUAL PROGRESS DOSSIER
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Student Selector List (Hidden during print) */}
        <div className="lg:col-span-4 space-y-3 print:hidden">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search student name or section..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-700 font-semibold focus:outline-none"
              >
                <option value="all">All Grades</option>
                <option value="Grade 7">Grade 7</option>
                <option value="Grade 8">Grade 8</option>
                <option value="Grade 9">Grade 9</option>
                <option value="Grade 10">Grade 10</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-700 font-semibold focus:outline-none"
              >
                <option value="all">All Status</option>
                <option value="Needs Remediation">Needs Remediation</option>
                <option value="Progressing">Progressing</option>
                <option value="Mastered / Promoted">Mastered</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {filteredStudents.map((s) => {
              const isSelected = currentStudent?.id === s.id;
              const statusBg =
                s.status === 'Mastered / Promoted'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : s.status === 'Progressing'
                  ? 'bg-teal-50 text-teal-700 border-teal-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200';

              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedStudentId(s.id)}
                  className={`p-3.5 transition cursor-pointer flex items-center justify-between gap-2 ${
                    isSelected ? 'bg-emerald-50/80 border-l-4 border-emerald-700' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-extrabold text-slate-900 text-xs truncate">
                      {s.lastName}, {s.firstName} {s.middleInitial}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {s.gradeLevel} - {s.section} • {s.subject}
                    </p>
                  </div>

                  <div className="flex flex-col items-end shrink-0 gap-1">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${statusBg}`}>
                      {s.status.replace(' / Promoted', '')}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono font-bold">
                      Base: {s.baselineScore}%
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredStudents.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400">No students match filter.</div>
            )}
          </div>
        </div>

        {/* Right Column: Detailed Student Profile Dossier */}
        <div className="lg:col-span-8 space-y-6">
          {currentStudent ? (
            <div className="space-y-6">
              {/* Student Header Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-900 font-black text-base flex items-center justify-center shrink-0">
                      {currentStudent.lastName[0]}
                      {currentStudent.firstName[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-black text-slate-900">
                          {currentStudent.lastName}, {currentStudent.firstName} {currentStudent.middleInitial}
                        </h3>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            currentStudent.status === 'Mastered / Promoted'
                              ? 'bg-emerald-100 text-emerald-800'
                              : currentStudent.status === 'Progressing'
                              ? 'bg-teal-100 text-teal-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {currentStudent.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {currentStudent.gradeLevel} - Section {currentStudent.section} • {currentStudent.subject} (
                        {currentStudent.programType})
                      </p>
                    </div>
                  </div>

                  <div className="text-right sm:text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Enrolled Date</span>
                    <p className="text-xs font-mono font-bold text-slate-700">{currentStudent.enrolledDate}</p>
                  </div>
                </div>

                {/* Score Progression Quick Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Baseline Score</span>
                    <p className="text-xl font-black text-slate-800 mt-1">{currentStudent.baselineScore}%</p>
                    <span className="text-[10px] text-slate-400">Initial Diagnostic</span>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase">Latest Mastery</span>
                    <p className="text-xl font-black text-emerald-950 mt-1">{latestScore}%</p>
                    <span className="text-[10px] text-emerald-700 font-bold">
                      {interpretMasteryLevel(latestScore).level}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                    <span className="text-[10px] font-bold text-blue-800 uppercase">Net Score Gain</span>
                    <p
                      className={`text-xl font-black mt-1 ${
                        scoreImprovement >= 0 ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {scoreImprovement >= 0 ? `+${scoreImprovement}%` : `${scoreImprovement}%`}
                    </p>
                    <span className="text-[10px] text-blue-700">Improvement Delta</span>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                    <span className="text-[10px] font-bold text-amber-800 uppercase">Attended Sessions</span>
                    <p className="text-xl font-black text-amber-950 mt-1">{totalSessionsAttended}</p>
                    <span className="text-[10px] text-amber-700">Remediation Logs</span>
                  </div>
                </div>
              </div>

              {/* Mastered Competencies vs Needing Improvement */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Mastered Competencies */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Mastered Competencies (Score ≥ 75%)
                    </h4>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      {masteredCompetencies.length} Skills
                    </span>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {masteredCompetencies.map((comp, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100 text-xs flex items-start justify-between gap-2"
                      >
                        <div>
                          <p className="font-bold text-emerald-950">{comp.competency}</p>
                          <span className="text-[10px] text-emerald-700 font-mono">Assessed: {comp.date}</span>
                        </div>
                        <span className="font-black text-emerald-800 shrink-0 font-mono">{comp.score}%</span>
                      </div>
                    ))}

                    {masteredCompetencies.length === 0 && (
                      <p className="text-center text-xs text-slate-400 py-6 italic">No competencies mastered yet.</p>
                    )}
                  </div>
                </div>

                {/* Competencies Needing Improvement */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      Target Competencies Needing Drill (&lt; 75%)
                    </h4>
                    <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">
                      {improvementCompetencies.length} Focus Items
                    </span>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {improvementCompetencies.map((comp, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-rose-50/60 border border-rose-100 text-xs flex items-start justify-between gap-2"
                      >
                        <div>
                          <p className="font-bold text-rose-950">{comp.competency}</p>
                          <span className="text-[10px] text-rose-700 font-mono">Assessed: {comp.date}</span>
                        </div>
                        <span className="font-black text-rose-800 shrink-0 font-mono">{comp.score}%</span>
                      </div>
                    ))}

                    {improvementCompetencies.length === 0 && (
                      <p className="text-center text-xs text-emerald-600 py-6 font-bold">
                        Great job! All assessed competencies are at passing mastery.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Longitudinal Remediation History Timeline */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-700" />
                    Intervention & Anecdotal Session History
                  </h4>
                  <span className="text-xs text-slate-500 font-medium">
                    {studentSessions.length} Recorded Sessions
                  </span>
                </div>

                <div className="space-y-4">
                  {studentSessions.map((sess) => {
                    const masteryInfo = interpretMasteryLevel(sess.score);
                    return (
                      <div
                        key={sess.id}
                        className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3 text-xs"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-900 font-mono">{sess.date}</span>
                            <span className="text-slate-400">•</span>
                            <span className="font-bold text-slate-800">{sess.focusCompetency}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-slate-600 font-bold">
                              Raw: {sess.rawScore}/{sess.totalItems} ({sess.score}%)
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${masteryInfo.badgeColor}`}>
                              {masteryInfo.level}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600">
                          <div>
                            <span className="font-bold text-slate-700">Activity Type:</span>{' '}
                            {sess.activityTypes?.join(', ') || sess.activityType}
                          </div>
                          <div>
                            <span className="font-bold text-slate-700">Intervention Strategy:</span>{' '}
                            {sess.interventions?.join(', ') || sess.intervention}
                          </div>
                        </div>

                        {sess.remarks && (
                          <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs">
                            <strong className="text-slate-900">Teacher Remarks:</strong> {sess.remarks}
                          </div>
                        )}

                        {sess.movs && sess.movs.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                              <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                              Means of Verification (MOVs):
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {sess.movs.map((m) => (
                                <div key={m.id} className="p-2 rounded-lg bg-white border border-slate-200 space-y-1">
                                  {m.dataUrl ? (
                                    <img
                                      src={m.dataUrl}
                                      alt={m.caption}
                                      className="w-full h-16 object-cover rounded-md"
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <div className="w-full h-16 bg-slate-100 rounded-md flex items-center justify-center text-[10px] text-slate-400 font-mono">
                                      Photo Attached
                                    </div>
                                  )}
                                  <p className="text-[10px] text-slate-600 line-clamp-1">{m.caption}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {studentSessions.length === 0 && (
                    <div className="py-10 text-center text-xs text-slate-400">
                      No anecdotal remediation sessions recorded for this learner yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
              Select a student from the left panel to inspect their remediation dossier.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
