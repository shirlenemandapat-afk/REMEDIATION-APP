import React, { useState } from 'react';
import { Student, SessionRecord, interpretMasteryLevel } from '../types';
import { BarChart3, TrendingUp, Users, Award, BookOpen, Filter, ArrowUpRight } from 'lucide-react';
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
} from 'recharts';

interface ClassProgressDashboardProps {
  students: Student[];
  sessions: SessionRecord[];
  selectedSection: string;
  onSelectSection: (sec: string) => void;
  sectionsList: string[];
  onSelectStudent: (student: Student) => void;
  onOpenAddSession: (studentId?: string) => void;
}

export const ClassProgressDashboard: React.FC<ClassProgressDashboardProps> = ({
  students,
  sessions,
  selectedSection,
  onSelectSection,
  sectionsList,
  onSelectStudent,
  onOpenAddSession,
}) => {
  const [selectedProgram, setSelectedProgram] = useState<string>('ALL');

  // Filter students based on section and program (Remediation & Skills Enhancement only)
  const filteredStudents = students.filter((s) => {
    const matchesSec = selectedSection === 'ALL' || s.section === selectedSection || `${s.gradeLevel} - ${s.section}` === selectedSection;
    const matchesProg = selectedProgram === 'ALL' || s.programType === selectedProgram;
    return matchesSec && matchesProg;
  });

  const filteredStudentIds = new Set(filteredStudents.map((s) => s.id));

  // Filter sessions for selected students
  const filteredSessions = sessions.filter((sess) => filteredStudentIds.has(sess.studentId));

  // Calculate metrics
  const totalStudents = filteredStudents.length;
  const avgBaseline = totalStudents > 0
    ? Math.round(filteredStudents.reduce((acc, s) => acc + s.baselineScore, 0) / totalStudents)
    : 0;

  // Calculate latest current score for each student
  const studentLatestScores = filteredStudents.map((s) => {
    const sSessions = sessions
      .filter((sess) => sess.studentId === s.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return sSessions.length > 0 ? sSessions[0].score : s.baselineScore;
  });

  const avgCurrent = totalStudents > 0
    ? Math.round(studentLatestScores.reduce((acc, score) => acc + score, 0) / totalStudents)
    : 0;

  const masteredCount = filteredStudents.filter((s) => s.status === 'Mastered / Promoted').length;
  const progressingCount = filteredStudents.filter((s) => s.status === 'Progressing').length;
  const needsSupportCount = filteredStudents.filter((s) => s.status === 'Needs Remediation').length;

  // Build Whole Class Progress Trend Data
  const sessionDatesMap = new Map<string, { totalScore: number; count: number }>();
  
  // Sort sessions chronologically
  const sortedSessions = [...filteredSessions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  sortedSessions.forEach((sess) => {
    const curr = sessionDatesMap.get(sess.date) || { totalScore: 0, count: 0 };
    sessionDatesMap.set(sess.date, {
      totalScore: curr.totalScore + sess.score,
      count: curr.count + 1,
    });
  });

  const classProgressData = Array.from(sessionDatesMap.entries()).map(([date, val]) => ({
    date,
    avgMastery: Math.round(val.totalScore / val.count),
    sessionCount: val.count,
    baselineBenchmark: avgBaseline,
  }));

  // Build Status Distribution Chart Data
  const statusDistData = [
    { name: 'Needs Remediation (<60%)', count: needsSupportCount, fill: '#ef4444' },
    { name: 'Progressing (60-79%)', count: progressingCount, fill: '#f59e0b' },
    { name: 'Mastered / Promoted (80%+)', count: masteredCount, fill: '#059669' },
  ];

  // Build Activity Type Frequency Data (accounting for array of activityTypes)
  const activityCountMap = new Map<string, number>();
  filteredSessions.forEach((sess) => {
    const activities = sess.activityTypes && sess.activityTypes.length > 0 ? sess.activityTypes : [sess.activityType];
    activities.forEach((act) => {
      if (act) {
        activityCountMap.set(act, (activityCountMap.get(act) || 0) + 1);
      }
    });
  });

  const activityDistData = Array.from(activityCountMap.entries()).map(([name, count]) => ({
    name,
    count,
  })).sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-6">
      {/* Top Section & Program Filter Controls */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-xs border border-emerald-100 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 mb-1 uppercase tracking-wide">
            Project S.M.I.L.E. Analytics
          </div>
          <h2 className="text-base sm:text-lg font-extrabold text-emerald-950 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-700" />
            Class / Section Progress & Mastery Dashboard
          </h2>
          <p className="text-xs text-slate-500">
            Student Monitoring and Intervention for Learning Enhancement &bull; RMCHS TLE Department
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            <Filter className="w-3.5 h-3.5 text-emerald-700" />
            <span className="text-xs font-bold text-slate-700">Section:</span>
            <select
              value={selectedSection}
              onChange={(e) => onSelectSection(e.target.value)}
              className="bg-transparent text-xs font-bold text-emerald-900 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Sections ({students.length})</option>
              {sectionsList.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-700">Program:</span>
            <select
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              className="bg-transparent text-xs font-bold text-amber-900 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Programs</option>
              <option value="Remediation">Remediation</option>
              <option value="Skills Enhancement">Skills Enhancement</option>
            </select>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-500 block uppercase">Total Enrolled</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{totalStudents}</span>
            <Users className="w-5 h-5 text-emerald-700" />
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Students in target scope</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-500 block uppercase">Baseline vs. Current Avg</span>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-slate-400 line-through">{avgBaseline}%</span>
            <span className="text-2xl font-black text-emerald-800">{avgCurrent}%</span>
          </div>
          <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            +{avgCurrent - avgBaseline}% Net Mastery Growth
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-500 block uppercase">Mastery / Promotion Rate</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-700">
              {totalStudents > 0 ? Math.round((masteredCount / totalStudents) * 100) : 0}%
            </span>
            <Award className="w-5 h-5 text-amber-500" />
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            {masteredCount} of {totalStudents} attained mastery
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-500 block uppercase">Sessions Conducted</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-800">{filteredSessions.length}</span>
            <BookOpen className="w-5 h-5 text-amber-600" />
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Daily anecdotal entries</span>
        </div>
      </div>

      {/* CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Whole Class Average Score Progress Trend */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-700" />
                Whole Class Mastery Growth Trend
              </h3>
              <p className="text-[11px] text-slate-500">Average score trajectory across all conducted sessions</p>
            </div>
          </div>

          {classProgressData.length > 0 ? (
            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={classProgressData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 border border-slate-700">
                            <p className="font-bold text-amber-300">Date: {data.date}</p>
                            <p className="font-black text-emerald-400">Class Avg Score: {data.avgMastery}%</p>
                            <p className="text-slate-300">Sessions on this date: {data.sessionCount}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="avgMastery"
                    name="Class Average Mastery %"
                    stroke="#047857"
                    strokeWidth={3}
                    dot={{ r: 5, fill: '#047857' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="baselineBenchmark"
                    name="Baseline Benchmark"
                    stroke="#ef4444"
                    strokeDasharray="4 4"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-60 flex items-center justify-center text-slate-400 text-xs italic">
              No daily session data logged yet for this filter.
            </div>
          )}
        </div>

        {/* Student Status Distribution Bar Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">Student Mastery Status Distribution</h3>
            <p className="text-[11px] text-slate-500">Current standing of students in selected section</p>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusDistData} margin={{ top: 10, right: 10, left: -25, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 9, fill: '#475569' }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {statusDistData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Activity Type Breakdown */}
      {activityDistData.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-sm font-extrabold text-slate-900">Intervention / Activity Type Frequency</h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityDistData} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={140} />
                <Tooltip />
                <Bar dataKey="count" fill="#047857" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
