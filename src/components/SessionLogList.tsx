import React, { useState } from 'react';
import { SessionRecord, Student, interpretMasteryLevel } from '../types';
import { Calendar, Search, Filter, Plus, FileText, Trash2, BookOpen, Paperclip, ChevronRight } from 'lucide-react';

interface SessionLogListProps {
  sessions: SessionRecord[];
  students: Student[];
  onOpenAddSession: (studentId?: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onViewMOV: (movUrl: string, title: string) => void;
  onSelectStudent: (student: Student) => void;
}

export const SessionLogList: React.FC<SessionLogListProps> = ({
  sessions,
  students,
  onOpenAddSession,
  onDeleteSession,
  onViewMOV,
  onSelectStudent,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProgram, setFilterProgram] = useState('ALL');

  // Filtered sessions
  const filteredSessions = sessions.filter((sess) => {
    const actTypes = sess.activityTypes && sess.activityTypes.length > 0 ? sess.activityTypes.join(' ') : sess.activityType;
    const intervs = sess.interventions && sess.interventions.length > 0 ? sess.interventions.join(' ') : sess.intervention;

    const matchesSearch =
      sess.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sess.remarks.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sess.focusCompetency && sess.focusCompetency.toLowerCase().includes(searchQuery.toLowerCase())) ||
      intervs.toLowerCase().includes(searchQuery.toLowerCase()) ||
      actTypes.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesProg = filterProgram === 'ALL' || sess.programType === filterProgram;

    return matchesSearch && matchesProg;
  });

  return (
    <div className="space-y-4">
      {/* Top Header & Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-emerald-100 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-emerald-950 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-700" />
            Daily Anecdotal Session Records ({filteredSessions.length})
          </h2>
          <p className="text-xs text-slate-500">
            Technology & Livelihood Education &bull; Per-session focus competencies, activity types, score evaluations, and MOVs
          </p>
        </div>

        <button
          onClick={() => onOpenAddSession()}
          className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-yellow-300 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm border border-emerald-900"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          Add Daily Session
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search student name, focus competency, activity, or remarks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filterProgram}
            onChange={(e) => setFilterProgram(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 px-3 py-1.5 rounded-xl focus:outline-none"
          >
            <option value="ALL">All Programs</option>
            <option value="Remediation">Remediation</option>
            <option value="Skills Enhancement">Skills Enhancement</option>
          </select>
        </div>
      </div>

      {/* Sessions Grid */}
      {filteredSessions.length > 0 ? (
        <div className="space-y-3">
          {filteredSessions.map((sess) => {
            const studentObj = students.find((s) => s.id === sess.studentId);
            const mastery = interpretMasteryLevel(sess.score);
            const actTypes = sess.activityTypes && sess.activityTypes.length > 0 ? sess.activityTypes : [sess.activityType];
            const intervs = sess.interventions && sess.interventions.length > 0 ? sess.interventions : [sess.intervention];

            return (
              <div
                key={sess.id}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition space-y-3"
              >
                {/* Session Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <button
                      onClick={() => studentObj && onSelectStudent(studentObj)}
                      className="text-sm font-extrabold text-slate-900 hover:text-emerald-800 transition flex items-center gap-1 group"
                    >
                      <span>{sess.studentName}</span>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 transition" />
                    </button>
                    <span className="text-xs text-slate-500 font-medium">
                      ({sess.gradeLevel} - {sess.section} &bull; {sess.subject})
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 uppercase">
                      {sess.programType}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md">
                      {sess.date}
                    </span>
                    {sess.rawScore !== undefined && sess.totalItems !== undefined && (
                      <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        Raw: {sess.rawScore}/{sess.totalItems}
                      </span>
                    )}
                    <span className="text-xs font-black text-emerald-950 bg-emerald-100 px-2.5 py-0.5 rounded-lg border border-emerald-300">
                      {sess.score}% &bull; {mastery.description}
                    </span>
                    <button
                      onClick={() => onDeleteSession(sess.id)}
                      className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                      title="Delete Session Entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Session Focus Competency & Strategies */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 block uppercase">Session Focus Competency:</span>
                    <span className="font-extrabold text-emerald-900 bg-emerald-50 px-2 py-1 rounded-md inline-block mt-0.5 border border-emerald-100">
                      {sess.focusCompetency || 'General Competency'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-slate-400 block uppercase">Activity Types:</span>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {actTypes.map((act, i) => (
                        <span key={i} className="font-bold text-emerald-800 bg-emerald-50/80 border border-emerald-200 px-2 py-0.5 rounded-md text-[10px]">
                          {act}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-slate-400 block uppercase">Intervention / Strategies:</span>
                    <span className="font-medium text-slate-800 mt-0.5 block">{intervs.join('; ')}</span>
                  </div>
                </div>

                {/* Remarks */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed">
                  <span className="font-bold text-slate-900 block mb-0.5">Daily Anecdotal Remark:</span>
                  "{sess.remarks}"
                </div>

                {/* Assessment Tool & MOV Attachments Footer */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                  {sess.assessmentTool ? (
                    <div className="flex items-center gap-1.5 text-xs text-blue-800 font-semibold bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      <span>Assessment Tool: <strong>{sess.assessmentTool.caption || sess.assessmentTool.name}</strong></span>
                      <button
                        onClick={() => onViewMOV(sess.assessmentTool!.dataUrl, sess.assessmentTool!.caption || sess.assessmentTool!.name)}
                        className="text-[10px] underline ml-1 text-blue-600 hover:text-blue-900"
                      >
                        View Attachment
                      </button>
                    </div>
                  ) : <div />}

                  {sess.movs && sess.movs.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                        <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                        MOVs ({sess.movs.length}):
                      </span>
                      <div className="flex items-center gap-1 flex-wrap">
                        {sess.movs.map((mov) => (
                          <button
                            key={mov.id}
                            onClick={() => onViewMOV(mov.dataUrl, mov.caption || mov.name)}
                            className="px-2 py-0.5 bg-slate-100 hover:bg-emerald-50 text-emerald-800 rounded text-[10px] font-semibold flex items-center gap-1 border border-slate-200 transition"
                          >
                            <FileText className="w-3 h-3 text-emerald-600" />
                            {mov.caption || mov.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 space-y-2">
          <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700">No session records match your search or filter.</p>
          <button
            onClick={() => onOpenAddSession()}
            className="mt-2 text-xs font-bold text-emerald-700 hover:text-emerald-900 underline"
          >
            Click here to add a new daily session
          </button>
        </div>
      )}
    </div>
  );
};
