import React, { useState } from 'react';
import { TeacherProfile, SessionRecord, Student } from '../../types';
import { storage } from '../../services/storage';
import {
  FileCheck2,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  Download,
  Filter,
  Users,
  Award,
  Eye,
  X,
} from 'lucide-react';

interface AdminTeacherReportsProps {
  currentAdmin: TeacherProfile;
  teachers: TeacherProfile[];
  sessions: SessionRecord[];
  students: Student[];
  onRefresh: () => void;
}

export const AdminTeacherReports: React.FC<AdminTeacherReportsProps> = ({
  currentAdmin,
  teachers,
  sessions,
  students,
  onRefresh,
}) => {
  const [selectedTeacherEmail, setSelectedTeacherEmail] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingMovModal, setViewingMovModal] = useState<SessionRecord | null>(null);

  // Group stats per teacher
  const teacherStats = teachers.map((teacher) => {
    const tEmailNorm = (teacher.email || '').toLowerCase().trim();

    // Filter sessions matching this teacher strictly by session teacherEmail or student.teacherEmail
    const teacherSessions = sessions.filter((s) => {
      const student = students.find((st) => st.id === s.studentId);
      const isDirectSessionEmailMatch = Boolean(
        s.teacherEmail && s.teacherEmail.toLowerCase().trim() === tEmailNorm
      );
      const isStudentEmailMatch = Boolean(
        student?.teacherEmail &&
        student.teacherEmail.toLowerCase().trim() === tEmailNorm
      );

      return isDirectSessionEmailMatch || isStudentEmailMatch;
    });

    const movCount = teacherSessions.reduce((acc, s) => acc + (s.movs?.length || 0), 0);

    return {
      teacher,
      sessionCount: teacherSessions.length,
      movCount,
      submissionStatus: teacher.reportsSubmissionStatus || 'Submitted',
    };
  });

  // Filtered teachers table
  const filteredTeacherStats = teacherStats.filter((item) => {
    const matchesSearch =
      item.teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.teacher.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || item.submissionStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Detailed Sessions Log Filter for Administrator
  const [drilldownTeacherFilter, setDrilldownTeacherFilter] = useState<string>('all');
  const [drilldownSearch, setDrilldownSearch] = useState<string>('');

  const filteredDrilldownSessions = sessions.filter((sess) => {
    const student = students.find((st) => st.id === sess.studentId);
    const sessTeacherEmail = (sess.teacherEmail || student?.teacherEmail || '').toLowerCase().trim();
    
    const matchesTeacher =
      drilldownTeacherFilter === 'all' || sessTeacherEmail === drilldownTeacherFilter.toLowerCase().trim();

    const matchesSearch =
      !drilldownSearch.trim() ||
      (sess.studentName || '').toLowerCase().includes(drilldownSearch.toLowerCase()) ||
      (sess.focusCompetency || '').toLowerCase().includes(drilldownSearch.toLowerCase()) ||
      (sess.subject || '').toLowerCase().includes(drilldownSearch.toLowerCase()) ||
      (sess.remarks || '').toLowerCase().includes(drilldownSearch.toLowerCase()) ||
      sessTeacherEmail.includes(drilldownSearch.toLowerCase());

    return matchesTeacher && matchesSearch;
  });

  // All session logs with MOVs for verification gallery
  const sessionsWithMovs = sessions.filter((s) => s.movs && s.movs.length > 0);

  // Toggle status for teacher submission
  const handleToggleSubmissionStatus = async (teacherEmail: string, newStatus: 'Submitted' | 'Pending' | 'Draft') => {
    await storage.adminUpdateTeacher(currentAdmin.email, teacherEmail, {
      reportsSubmissionStatus: newStatus,
    });
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
        <div>
          <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-emerald-700" />
            Teacher Remediation Reports & MOV Verification
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor teacher compliance, review uploaded anecdotal logs and photo Means of Verification (MOVs), and sign off on DepEd department submissions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sessions, null, 2));
              const downloadAnchor = document.createElement('a');
              downloadAnchor.setAttribute("href", dataStr);
              downloadAnchor.setAttribute("download", `all_remediation_logs_${new Date().toISOString().slice(0,10)}.json`);
              document.body.appendChild(downloadAnchor);
              downloadAnchor.click();
              downloadAnchor.remove();
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-extrabold rounded-xl text-xs transition flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4 text-yellow-300" />
            EXPORT ALL LOGS & MOVS
          </button>
        </div>
      </div>

      {/* Submission Status Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Total Faculty</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{teachers.length}</p>
          <span className="text-[10px] text-slate-400">TLE Instructors</span>
        </div>

        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 shadow-sm">
          <span className="text-[11px] font-bold text-emerald-800 uppercase">Reports Submitted</span>
          <p className="text-2xl font-black text-emerald-950 mt-1">
            {teacherStats.filter((t) => t.submissionStatus === 'Submitted').length}
          </p>
          <span className="text-[10px] text-emerald-700 font-bold">Compliant & Signed</span>
        </div>

        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 shadow-sm">
          <span className="text-[11px] font-bold text-amber-800 uppercase">Pending Review</span>
          <p className="text-2xl font-black text-amber-950 mt-1">
            {teacherStats.filter((t) => t.submissionStatus === 'Pending').length}
          </p>
          <span className="text-[10px] text-amber-700 font-bold">Awaiting Dept Sign-off</span>
        </div>

        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200 shadow-sm">
          <span className="text-[11px] font-bold text-blue-800 uppercase">Total Verified MOVs</span>
          <p className="text-2xl font-black text-blue-950 mt-1">
            {sessions.reduce((acc, s) => acc + (s.movs?.length || 0), 0)}
          </p>
          <span className="text-[10px] text-blue-700 font-bold">Photo & Sheet Evidence</span>
        </div>
      </div>

      {/* Teachers Submission Compliance Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search faculty name or email..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none"
            >
              <option value="all">All Submission Statuses</option>
              <option value="Submitted">Submitted (Compliant)</option>
              <option value="Pending">Pending Review</option>
              <option value="Draft">Draft / Incomplete</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3.5">Teacher Name</th>
                <th className="px-4 py-3.5">Assigned Learning Areas</th>
                <th className="px-4 py-3.5 text-center">Anecdotal Logs</th>
                <th className="px-4 py-3.5 text-center">Attached MOVs</th>
                <th className="px-4 py-3.5 text-center">Submission Status</th>
                <th className="px-5 py-3.5 text-right">Department Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredTeacherStats.map((item) => {
                const statusBadge =
                  item.submissionStatus === 'Submitted'
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    : item.submissionStatus === 'Pending'
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-slate-100 text-slate-700 border-slate-300';

                return (
                  <tr key={item.teacher.email} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-4">
                      <p className="font-extrabold text-slate-900">{item.teacher.name}</p>
                      <p className="text-[11px] text-slate-500 font-mono">{item.teacher.email}</p>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {item.teacher.assignedSubjects?.map((s) => (
                          <span key={s} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="px-4 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => setDrilldownTeacherFilter(item.teacher.email)}
                        className="font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
                        title="Click to view sessions logged by this teacher"
                      >
                        {item.sessionCount} Sessions
                      </button>
                    </td>

                    <td className="px-4 py-4 text-center">
                      <span className="font-bold text-blue-700">{item.movCount} Files</span>
                    </td>

                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusBadge}`}>
                        {item.submissionStatus}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {item.submissionStatus !== 'Submitted' ? (
                          <button
                            type="button"
                            onClick={() => handleToggleSubmissionStatus(item.teacher.email, 'Submitted')}
                            className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1 shadow-2xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-yellow-300" />
                            Sign-off
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleSubmissionStatus(item.teacher.email, 'Pending')}
                            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition cursor-pointer"
                          >
                            Mark Pending
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredTeacherStats.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-xs text-slate-400">
                    No faculty found matching the filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Synchronized Faculty Remediation Session Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden space-y-0">
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-700" />
              Faculty Remediation Session Logs ({filteredDrilldownSessions.length} Synchronized Records)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live synchronized individual session logs submitted by teachers across all learning areas and sections.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={drilldownTeacherFilter}
              onChange={(e) => setDrilldownTeacherFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none shadow-2xs"
            >
              <option value="all">All Faculty Members ({sessions.length} total sessions)</option>
              {teachers.map((t) => (
                <option key={t.email} value={t.email}>
                  {t.name} ({t.email})
                </option>
              ))}
            </select>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={drilldownSearch}
                onChange={(e) => setDrilldownSearch(e.target.value)}
                placeholder="Search student, competency, remarks..."
                className="pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none w-56 shadow-2xs"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/90 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px] sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Logged By Teacher</th>
                <th className="px-4 py-3">Student & Section</th>
                <th className="px-4 py-3">Learning Area / Subject</th>
                <th className="px-4 py-3">Focus Competency</th>
                <th className="px-4 py-3 text-center">Score & Mastery</th>
                <th className="px-4 py-3 text-center">MOVs</th>
                <th className="px-4 py-3 text-right">Remarks & Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredDrilldownSessions.map((sess) => {
                const student = students.find((st) => st.id === sess.studentId);
                const teacherObj = teachers.find(
                  (t) => (t.email || '').toLowerCase().trim() === (sess.teacherEmail || student?.teacherEmail || '').toLowerCase().trim()
                );
                const teacherDisplayName = teacherObj ? teacherObj.name : (sess.teacherEmail || student?.teacherEmail || 'Department Faculty');

                return (
                  <tr key={sess.id} className="hover:bg-emerald-50/40 transition">
                    <td className="px-4 py-3.5 font-mono text-slate-700 whitespace-nowrap font-bold">
                      {sess.date}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <p className="font-bold text-slate-900">{teacherDisplayName}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{sess.teacherEmail || student?.teacherEmail || 'shirlene.mandapat@depedqc.ph'}</p>
                    </td>

                    <td className="px-4 py-3.5">
                      <p className="font-bold text-slate-900">{sess.studentName || (student ? `${student.lastName}, ${student.firstName}` : 'Student')}</p>
                      <p className="text-[11px] text-slate-500">{sess.gradeLevel} - {sess.section}</p>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                        {sess.subject || student?.subject || 'TLE'}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">{sess.programType || student?.programType || 'Remediation'}</p>
                    </td>

                    <td className="px-4 py-3.5 max-w-xs">
                      <p className="font-semibold text-slate-800 line-clamp-2">{sess.focusCompetency}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                        {sess.interventions?.join(', ') || sess.intervention || 'Individual Drill'}
                      </p>
                    </td>

                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      <div className="inline-flex flex-col items-center">
                        <span className="font-mono font-bold text-slate-900">
                          {sess.rawScore}/{sess.totalItems || 20} ({sess.score}%)
                        </span>
                        <span
                          className={`mt-0.5 px-2 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            sess.score >= 85
                              ? 'bg-emerald-100 text-emerald-900'
                              : sess.score >= 75
                              ? 'bg-teal-100 text-teal-900'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {sess.masteryLevel || (sess.score >= 75 ? 'Mastered' : 'Needs Practice')}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      {sess.movs && sess.movs.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => setViewingMovModal(sess)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-[11px] transition cursor-pointer border border-blue-200"
                        >
                          <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                          {sess.movs.length} MOVs
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">None</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      {sess.remarks ? (
                        <span className="text-xs text-slate-700 italic max-w-xs inline-block text-left line-clamp-2">
                          "{sess.remarks}"
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredDrilldownSessions.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-slate-400">
                    <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No session logs found matching the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Means of Verification (MOV) Evidence Gallery */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-blue-700" />
            Remediation Photo MOVs & Activity Sheet Gallery
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            {sessionsWithMovs.length} Sessions with Uploaded Evidence
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {sessionsWithMovs.slice(0, 12).map((sess) => {
            const student = students.find((s) => s.id === sess.studentId);
            const firstMov = sess.movs?.[0];

            return (
              <div
                key={sess.id}
                onClick={() => setViewingMovModal(sess)}
                className="bg-slate-50 rounded-xl p-3 border border-slate-200 hover:border-blue-300 hover:shadow-md transition cursor-pointer space-y-2 group"
              >
                <div className="w-full h-36 bg-slate-200 rounded-lg overflow-hidden relative">
                  {firstMov?.dataUrl ? (
                    <img
                      src={firstMov.dataUrl}
                      alt={firstMov.caption}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                      <ImageIcon className="w-8 h-8 mb-1" />
                      <span className="text-[10px]">Photo Evidence</span>
                    </div>
                  )}

                  <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-slate-900/80 text-white text-[10px] font-bold font-mono">
                    {sess.movs?.length || 0} Files
                  </span>
                </div>

                <div>
                  <p className="text-xs font-extrabold text-slate-900 truncate">
                    {student ? `${student.lastName}, ${student.firstName}` : 'Student Record'}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">{sess.focusCompetency}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-1">
                    <span>{sess.date}</span>
                    <span className="font-bold text-emerald-700">Score: {sess.score}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- MOV INSPECTION MODAL --- */}
      {viewingMovModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Verification Evidence Inspection
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {viewingMovModal.focusCompetency} • {viewingMovModal.date}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingMovModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <p className="font-bold text-slate-800">Intervention Remarks:</p>
                <p className="text-slate-600">{viewingMovModal.remarks || 'No detailed remarks.'}</p>
              </div>

              <div className="space-y-3">
                <h4 className="font-extrabold text-slate-800">Uploaded Photos & Worksheets:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {viewingMovModal.movs?.map((m) => (
                    <div key={m.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      {m.dataUrl && (
                        <img
                          src={m.dataUrl}
                          alt={m.caption}
                          className="w-full h-44 object-cover rounded-lg border border-slate-200"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <p className="text-xs font-semibold text-slate-800">{m.caption}</p>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Uploaded: {new Date(m.uploadedAt).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setViewingMovModal(null)}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-extrabold rounded-xl text-xs transition"
                >
                  Close Inspection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
