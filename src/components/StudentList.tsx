import React, { useState } from 'react';
import { Student, SessionRecord, interpretMasteryLevel } from '../types';
import {
  UserPlus,
  Search,
  Filter,
  TrendingUp,
  Award,
  PlusCircle,
  Trash2,
  Eye,
  User,
  Sparkles,
  Mail,
  FileText,
  Archive,
  FolderArchive,
  Layers,
} from 'lucide-react';

interface StudentListProps {
  students: Student[];
  sessions: SessionRecord[];
  onOpenEnrollModal: () => void;
  onOpenAddSession: (studentId: string) => void;
  onSelectStudent: (student: Student) => void;
  onDeleteStudent: (student: Student) => void;
  onArchiveStudent: (student: Student) => void;
  selectedSection: string;
  onSelectSection: (section: string) => void;
  sectionsList: string[];
  onOpenParentLetter?: (student: Student) => void;
  onOpenAnecdotalReport?: (student: Student) => void;
  onOpenArchiveTab?: () => void;
}

export const StudentList: React.FC<StudentListProps> = ({
  students,
  sessions,
  onOpenEnrollModal,
  onOpenAddSession,
  onSelectStudent,
  onDeleteStudent,
  onArchiveStudent,
  selectedSection,
  onSelectSection,
  sectionsList,
  onOpenParentLetter,
  onOpenAnecdotalReport,
  onOpenArchiveTab,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProgramTab, setSelectedProgramTab] = useState<string>('ALL');

  // Filter only active (non-archived) students for the main roster
  const activeStudents = students.filter((s) => !s.isArchived);
  const archivedCount = students.filter((s) => s.isArchived).length;

  const filteredStudents = activeStudents.filter((s) => {
    const fullName = `${s.lastName}, ${s.firstName} ${s.middleInitial}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchQuery.toLowerCase()) ||
      s.section.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.focusTopic.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSection =
      selectedSection === 'ALL' ||
      s.section === selectedSection ||
      `${s.gradeLevel} - ${s.section}` === selectedSection;
    const matchesProgram = selectedProgramTab === 'ALL' || s.programType === selectedProgramTab;

    return matchesSearch && matchesSection && matchesProgram;
  });

  return (
    <div className="space-y-4">
      {/* Directory Banner Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-emerald-100 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-extrabold text-emerald-950 flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-700" />
              Enrolled Students Roster ({filteredStudents.length})
            </h2>
            {archivedCount > 0 && onOpenArchiveTab && (
              <button
                type="button"
                onClick={onOpenArchiveTab}
                className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 transition flex items-center gap-1 cursor-pointer"
                title="View Archived Students & Sections"
              >
                <FolderArchive className="w-3 h-3 text-amber-700" />
                {archivedCount} in Archive
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Technology & Livelihood Education (TLE) • Daily Remediation & Skills Enhancement Registry
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenArchiveTab && (
            <button
              type="button"
              onClick={onOpenArchiveTab}
              className="px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 border border-amber-200 shadow-2xs cursor-pointer"
            >
              <FolderArchive className="w-4 h-4 text-amber-700" />
              ARCHIVE SECTION
            </button>
          )}

          <button
            type="button"
            onClick={onOpenEnrollModal}
            className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-yellow-300 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm border border-emerald-900 cursor-pointer active:scale-95"
          >
            <UserPlus className="w-4 h-4 text-amber-400" />
            ENROLL STUDENT
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-emerald-100 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Program Filter Pills (Remediation & Skills Enhancement only) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'Remediation', 'Skills Enhancement'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setSelectedProgramTab(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition cursor-pointer ${
                selectedProgramTab === tab
                  ? 'bg-emerald-800 text-yellow-300 shadow-xs border border-emerald-900'
                  : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-900'
              }`}
            >
              {tab === 'ALL' ? 'All Enrolled' : tab}
            </button>
          ))}
        </div>

        {/* Search & Section Filter */}
        <div className="flex items-center gap-2 flex-1 max-w-md min-w-[220px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search student name, TLE strand, section..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-1 bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-200 shrink-0">
            <Filter className="w-3.5 h-3.5 text-emerald-700" />
            <select
              value={selectedSection}
              onChange={(e) => onSelectSection(e.target.value)}
              className="bg-transparent text-xs font-bold text-emerald-900 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Sections</option>
              {sectionsList.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Student Cards Grid */}
      {filteredStudents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((student) => {
            const studentSessions = sessions
              .filter((s) => s.studentId === student.id)
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            const latestScore =
              studentSessions.length > 0 ? studentSessions[0].score : student.baselineScore;

            const sessionScores = studentSessions.map((s) => s.score);
            const avgMasteryScore =
              sessionScores.length > 0
                ? Math.round(sessionScores.reduce((a, b) => a + b, 0) / sessionScores.length)
                : student.baselineScore;
            const avgMasteryInterpretation = interpretMasteryLevel(avgMasteryScore);

            return (
              <div
                key={student.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-emerald-400 transition flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-4 space-y-3">
                  {/* Top Header info */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 mb-1 border border-amber-300">
                        {student.programType}
                      </span>
                      <h3 className="font-extrabold text-sm text-slate-900 tracking-tight group-hover:text-emerald-900 transition">
                        {student.lastName}, {student.firstName} {student.middleInitial}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        {student.gradeLevel} - {student.section} &bull;{' '}
                        <span className="font-semibold text-emerald-800">{student.subject}</span>
                      </p>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold text-center whitespace-nowrap border ${
                        student.status === 'Mastered / Promoted'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : student.status === 'Progressing'
                          ? 'bg-amber-50 text-amber-800 border-amber-300'
                          : 'bg-rose-50 text-rose-800 border-rose-300'
                      }`}
                    >
                      {student.status}
                    </span>
                  </div>

                  {/* Focus Area & Baseline vs Latest vs Average */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
                    <p className="text-slate-600 font-medium truncate">
                      <span className="font-bold text-slate-800">Target Competency: </span>
                      {student.focusTopic}
                    </p>
                    <div className="grid grid-cols-3 gap-1 pt-1 border-t border-slate-200/80 font-semibold text-[11px] text-center">
                      <div className="bg-white p-1 rounded-md border border-slate-200">
                        <span className="text-slate-500 block text-[9px]">Baseline</span>
                        <strong className="text-slate-800">{student.baselineScore}%</strong>
                      </div>
                      <div className="bg-white p-1 rounded-md border border-slate-200">
                        <span className="text-slate-500 block text-[9px]">Latest</span>
                        <strong className="text-emerald-900">{latestScore}%</strong>
                      </div>
                      <div className="bg-emerald-50 p-1 rounded-md border border-emerald-200">
                        <span className="text-emerald-800 block text-[9px]">Avg Mastery</span>
                        <strong className="text-emerald-950 font-black">{avgMasteryScore}%</strong>
                      </div>
                    </div>
                  </div>

                  {/* Document Generation Shortcut Buttons */}
                  <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                    {onOpenParentLetter && (
                      <button
                        type="button"
                        onClick={() => onOpenParentLetter(student)}
                        className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 border border-amber-200 cursor-pointer"
                        title="Generate Parent Communication Letter"
                      >
                        <Mail className="w-3 h-3 text-amber-700" />
                        Parent Notice
                      </button>
                    )}
                    {onOpenAnecdotalReport && (
                      <button
                        type="button"
                        onClick={() => onOpenAnecdotalReport(student)}
                        className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 border border-emerald-200 cursor-pointer"
                        title="Generate Printable Anecdotal Report (Parent's Copy)"
                      >
                        <FileText className="w-3 h-3 text-emerald-700" />
                        Anecdotal Report
                      </button>
                    )}
                  </div>
                </div>

                {/* Card Actions Footer with Progress, Session, Archive, and Delete */}
                <div className="bg-slate-50/80 p-3 border-t border-slate-100 flex items-center justify-between gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => onSelectStudent(student)}
                    className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 hover:border-emerald-400 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer"
                  >
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
                    Progress Graph
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onOpenAddSession(student.id)}
                      className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer"
                      title="Add Daily Anecdotal Session"
                    >
                      <PlusCircle className="w-3.5 h-3.5 text-yellow-300" />
                      Session
                    </button>

                    {/* Archive Action Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onArchiveStudent(student);
                      }}
                      className="p-1.5 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded-xl transition cursor-pointer"
                      title="Archive Student Record (Preserves Logs)"
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Action Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteStudent(student);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                      title="Delete Student Record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 text-center bg-white rounded-2xl border border-emerald-100 text-slate-500 space-y-2">
          <User className="w-8 h-8 text-emerald-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700">No active student records found matching filter.</p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={onOpenEnrollModal}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
            >
              Enroll a New Student
            </button>
            {archivedCount > 0 && onOpenArchiveTab && (
              <>
                <span className="text-slate-300">&bull;</span>
                <button
                  type="button"
                  onClick={onOpenArchiveTab}
                  className="text-xs font-bold text-amber-700 hover:text-amber-900 underline cursor-pointer"
                >
                  View {archivedCount} Archived Students
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

