import React from 'react';
import { Student, SessionRecord, interpretMasteryLevel } from '../types';
import {
  X,
  TrendingUp,
  Calendar,
  Award,
  BookOpen,
  PlusCircle,
  FileText,
  CheckCircle2,
  Mail,
  Sparkles,
  Archive,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';

interface StudentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  sessions: SessionRecord[];
  onOpenAddSession: (studentId: string) => void;
  onViewMOV: (movUrl: string, title: string) => void;
  onOpenParentLetter?: (student: Student) => void;
  onOpenAnecdotalReport?: (student: Student) => void;
  onDeleteStudent?: (student: Student) => void;
  onArchiveStudent?: (student: Student) => void;
  onUnarchiveStudent?: (student: Student) => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  isOpen,
  onClose,
  student,
  sessions,
  onOpenAddSession,
  onViewMOV,
  onOpenParentLetter,
  onOpenAnecdotalReport,
  onDeleteStudent,
  onArchiveStudent,
  onUnarchiveStudent,
}) => {
  if (!isOpen || !student) return null;

  const studentSessions = sessions
    .filter((s) => s.studentId === student.id)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Prepare chart data starting with baseline
  const chartData = [
    {
      date: student.enrolledDate || 'Baseline',
      score: student.baselineScore,
      label: 'Initial Baseline',
      activityTypes: ['Diagnostic Assessment'],
      interventions: ['Initial Screening'],
    },
    ...studentSessions.map((s) => ({
      date: s.date,
      score: s.score,
      label: s.focusCompetency || s.activityType,
      activityTypes: s.activityTypes && s.activityTypes.length > 0 ? s.activityTypes : [s.activityType],
      interventions: s.interventions && s.interventions.length > 0 ? s.interventions : [s.intervention],
      rawScore: s.rawScore,
      totalItems: s.totalItems,
      remarks: s.remarks,
    })),
  ];

  const currentScore =
    studentSessions.length > 0
      ? studentSessions[studentSessions.length - 1].score
      : student.baselineScore;

  const scoreDiff = currentScore - student.baselineScore;

  const sessionScores = studentSessions.map((s) => s.score);
  const avgScore =
    sessionScores.length > 0
      ? Math.round(sessionScores.reduce((acc, sc) => acc + sc, 0) / sessionScores.length)
      : student.baselineScore;
  const avgMasteryLevel = interpretMasteryLevel(avgScore);

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 overflow-y-auto p-2 sm:p-4 md:p-6 flex justify-center items-start">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden border border-slate-200 my-2 sm:my-4 animate-in fade-in zoom-in-95 duration-150">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-green-950 p-6 text-white flex items-start justify-between border-b-2 border-amber-400">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-400/20 text-amber-300 border border-amber-400/40 uppercase">
                {student.programType}
              </span>
              <span className="text-xs font-bold text-emerald-200">
                {student.gradeLevel} - {student.section} &bull; {student.subject}
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white font-serif">
              {student.lastName}, {student.firstName} {student.middleInitial}
            </h2>
            <p className="text-xs text-emerald-100/90 mt-1">
              Target Competency: <span className="font-bold text-yellow-300">{student.focusTopic}</span>
            </p>
            {student.parentName && (
              <p className="text-[11px] text-emerald-300 mt-0.5">
                Parent/Guardian: <strong>{student.parentName}</strong> {student.parentContact ? `(${student.parentContact})` : ''}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onOpenParentLetter && (
              <button
                onClick={() => onOpenParentLetter(student)}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-emerald-950 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 shadow-sm border border-amber-300/60 cursor-pointer"
                title="Generate Guardian's Notice of Remediation"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-950" />
                Guardian Notice
              </button>
            )}
            {onOpenAnecdotalReport && (
              <button
                onClick={() => onOpenAnecdotalReport(student)}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-yellow-300 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 shadow-sm border border-emerald-600"
              >
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                Anecdotal Report
              </button>
            )}
            <button
              onClick={() => onOpenAddSession(student.id)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 shadow-md"
            >
              <PlusCircle className="w-4 h-4 text-yellow-300" />
              Add Session
            </button>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Key Metric Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase block">Baseline Score</span>
              <span className="text-xl font-black text-slate-800">{student.baselineScore}%</span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase block">Latest Mastery Score</span>
              <span className="text-xl font-black text-emerald-800">{currentScore}%</span>
            </div>

            <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200">
              <span className="text-[11px] font-bold text-emerald-800 uppercase block">Average Mastery Level</span>
              <span className="text-xl font-black text-emerald-950">{avgScore}%</span>
              <span className="text-[10px] font-extrabold text-emerald-700 block mt-0.5 uppercase">
                {avgMasteryLevel.description}
              </span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase block">Overall Growth</span>
              <span
                className={`text-xl font-black flex items-center gap-1 ${
                  scoreDiff >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                {scoreDiff >= 0 ? `+${scoreDiff}%` : `${scoreDiff}%`}
              </span>
              <span className="text-[10px] font-semibold text-slate-500 block">
                {studentSessions.length} Session(s) Logged
              </span>
            </div>
          </div>

          {/* STUDENT PROGRESS GRAPH */}
          <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-700" />
                <h3 className="text-sm font-extrabold text-slate-800">
                  Individual Remediation & Skills Enhancement Progress Graph
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Baseline (Red Dash) vs. Formative Session Mastery
              </span>
            </div>

            {chartData.length > 0 ? (
              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      stroke="#cbd5e1"
                    />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 max-w-xs border border-slate-700">
                              <p className="font-bold text-amber-300">{data.date}</p>
                              <p className="font-black text-sm text-emerald-400">Score: {data.score}%</p>
                              <p className="font-semibold text-slate-200">
                                Focus: {data.label}
                              </p>
                              <p className="text-slate-300 text-[11px]">
                                Activities: {Array.isArray(data.activityTypes) ? data.activityTypes.join(', ') : data.activityTypes}
                              </p>
                              {data.remarks && (
                                <p className="text-slate-400 text-[10px] italic pt-1 border-t border-slate-800">
                                  "{data.remarks}"
                                </p>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <ReferenceLine
                      y={student.baselineScore}
                      stroke="#ef4444"
                      strokeDasharray="4 4"
                      label={{
                        value: `Baseline (${student.baselineScore}%)`,
                        fill: '#ef4444',
                        fontSize: 10,
                        position: 'insideBottomLeft',
                      }}
                    />
                    <ReferenceLine
                      y={75}
                      stroke="#10b981"
                      strokeDasharray="2 2"
                      label={{
                        value: 'Passing Benchmark (75%)',
                        fill: '#10b981',
                        fontSize: 10,
                        position: 'insideTopLeft',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#047857"
                      strokeWidth={3}
                      dot={{ r: 6, fill: '#047857', strokeWidth: 2, stroke: '#ffffff' }}
                      activeDot={{ r: 8, fill: '#065f46' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic py-4 text-center">No sessions logged yet.</p>
            )}
          </div>

          {/* Daily Anecdotal Session Records History */}
          <div className="space-y-3">
            <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-700" />
              Daily Anecdotal Log History ({studentSessions.length})
            </h3>

            {studentSessions.length > 0 ? (
              <div className="space-y-3">
                {studentSessions.map((sess) => {
                  const sessMastery = interpretMasteryLevel(sess.score);
                  const activities = sess.activityTypes && sess.activityTypes.length > 0 ? sess.activityTypes : [sess.activityType];
                  const interventions = sess.interventions && sess.interventions.length > 0 ? sess.interventions : [sess.intervention];

                  return (
                    <div
                      key={sess.id}
                      className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-emerald-300 transition space-y-2.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-xs text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md">
                            {sess.date}
                          </span>
                          <span className="font-bold text-xs text-emerald-950 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                            Focus: {sess.focusCompetency || student.focusTopic}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {sess.rawScore !== undefined && sess.totalItems !== undefined && (
                            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                              Raw: {sess.rawScore}/{sess.totalItems}
                            </span>
                          )}
                          <span className="font-black text-xs text-emerald-900 bg-emerald-100 px-2.5 py-1 rounded-md border border-emerald-300">
                            {sess.score}% &bull; {sessMastery.description}
                          </span>
                        </div>
                      </div>

                      {/* Multi-select activity pills & strategies */}
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-bold text-slate-500">Activities:</span>
                          {activities.map((act, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[10px] font-semibold">
                              {act}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap text-slate-600 text-[11px]">
                          <span className="font-bold text-slate-500">Interventions:</span>
                          <span>{interventions.join('; ')}</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <span className="font-bold text-slate-900">Anecdotal Remarks: </span>
                        {sess.remarks}
                      </p>

                      {/* Assessment tool upload caption info & MOVs */}
                      <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-slate-100">
                        {sess.assessmentTool && (
                          <div className="flex items-center gap-1.5 text-xs text-blue-800 font-semibold bg-blue-50 px-2 py-1 rounded-md border border-blue-200">
                            <FileText className="w-3.5 h-3.5 text-blue-600" />
                            <span>Tool: {sess.assessmentTool.caption || sess.assessmentTool.name}</span>
                            <button
                              onClick={() => onViewMOV(sess.assessmentTool!.dataUrl, sess.assessmentTool!.caption || sess.assessmentTool!.name)}
                              className="text-[10px] underline ml-1 text-blue-600 hover:text-blue-900"
                            >
                              View
                            </button>
                          </div>
                        )}

                        {sess.movs && sess.movs.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-semibold text-slate-500">MOVs:</span>
                            {sess.movs.map((mov) => (
                              <button
                                key={mov.id}
                                onClick={() => onViewMOV(mov.dataUrl, mov.caption || mov.name)}
                                className="px-2 py-1 bg-slate-100 hover:bg-emerald-50 text-emerald-800 rounded-md text-[10px] font-semibold flex items-center gap-1 border border-slate-200 transition"
                              >
                                <FileText className="w-3 h-3 text-emerald-600" />
                                {mov.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-xs text-slate-500">No daily anecdotal logs added yet for this student.</p>
                <button
                  onClick={() => onOpenAddSession(student.id)}
                  className="mt-2 text-xs font-bold text-emerald-700 hover:text-emerald-900 underline"
                >
                  Click here to add first session
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer with Archive & Delete Options */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {student.isArchived ? (
              onUnarchiveStudent && (
                <button
                  type="button"
                  onClick={() => onUnarchiveStudent(student)}
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-yellow-300" />
                  Restore to Active Roster
                </button>
              )
            ) : (
              onArchiveStudent && (
                <button
                  type="button"
                  onClick={() => onArchiveStudent(student)}
                  className="px-3.5 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Archive className="w-3.5 h-3.5 text-amber-800" />
                  Archive Student Record
                </button>
              )
            )}

            {onDeleteStudent && (
              <button
                type="button"
                onClick={() => onDeleteStudent(student)}
                className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                Delete Student
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

