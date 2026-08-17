import React, { useState } from 'react';
import { Student, SessionRecord, interpretMasteryLevel } from '../types';
import {
  Archive,
  RotateCcw,
  Trash2,
  Search,
  Filter,
  Users,
  Layers,
  CheckCircle2,
  AlertCircle,
  Eye,
  TrendingUp,
  FolderArchive,
  GraduationCap,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface ArchiveManagementProps {
  students: Student[];
  sessions: SessionRecord[];
  onUnarchiveStudent: (studentId: string) => void;
  onDeleteStudent: (studentId: string) => void;
  onDeleteAllArchived?: () => void;
  onUnarchiveSection: (sectionName: string) => void;
  onArchiveSection: (sectionName: string) => void;
  onDeleteSection: (sectionName: string) => void;
  onSelectStudent: (student: Student) => void;
  onRequestConfirm: (config: {
    type: any;
    title: string;
    message: string;
    itemName?: string;
    itemDetails?: string;
    confirmLabel?: string;
    confirmVariant?: 'danger' | 'warning' | 'primary' | 'success';
    onConfirm: () => void;
  }) => void;
}

export const ArchiveManagement: React.FC<ArchiveManagementProps> = ({
  students,
  sessions,
  onUnarchiveStudent,
  onDeleteStudent,
  onDeleteAllArchived,
  onUnarchiveSection,
  onArchiveSection,
  onDeleteSection,
  onSelectStudent,
  onRequestConfirm,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'students' | 'sections'>('students');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState('ALL');

  const archivedStudents = students.filter((s) => s.isArchived === true);
  const activeStudents = students.filter((s) => !s.isArchived);

  // Group all sections (both active & archived)
  const allSectionNames = Array.from(
    new Set(students.map((s) => `${s.gradeLevel} - ${s.section}`).filter(Boolean))
  );

  // Filter archived students
  const filteredArchivedStudents = archivedStudents.filter((s) => {
    const fullName = `${s.lastName}, ${s.firstName} ${s.middleInitial}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchQuery.toLowerCase()) ||
      s.section.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.focusTopic.toLowerCase().includes(searchQuery.toLowerCase());

    const fullSection = `${s.gradeLevel} - ${s.section}`;
    const matchesSection =
      selectedSectionFilter === 'ALL' ||
      s.section === selectedSectionFilter ||
      fullSection === selectedSectionFilter;

    return matchesSearch && matchesSection;
  });

  return (
    <div className="space-y-6">
      {/* Archive Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-100 text-amber-900 rounded-xl">
              <FolderArchive className="w-5 h-5 text-amber-700" />
            </span>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                Archived Records & Section Management
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Safely store, restore, or organize archived TLE remediation records and end-of-period sections.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Summary Pill Badges */}
        <div className="flex items-center gap-2 flex-wrap text-xs font-bold">
          <span className="px-3 py-1.5 bg-amber-50 text-amber-900 border border-amber-300 rounded-xl flex items-center gap-1.5">
            <Archive className="w-3.5 h-3.5 text-amber-700" />
            Archived Students: <strong>{archivedStudents.length}</strong>
          </span>
          <span className="px-3 py-1.5 bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-xl flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-emerald-700" />
            Active Roster: <strong>{activeStudents.length}</strong>
          </span>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveSubTab('students')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'students'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Archive className="w-4 h-4" />
            ARCHIVED STUDENTS ({archivedStudents.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('sections')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'sections'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            SECTION ARCHIVE & BULK MANAGEMENT ({allSectionNames.length})
          </button>
        </div>

        {/* Bulk Action Buttons if there are archived students */}
        {archivedStudents.length > 0 && activeSubTab === 'students' && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                onRequestConfirm({
                  type: 'unarchive_section',
                  title: 'Restore All Archived Students',
                  message: `Are you sure you want to restore all ${archivedStudents.length} archived students back to the active roster?`,
                  confirmLabel: 'Restore All',
                  confirmVariant: 'success',
                  onConfirm: () => {
                    archivedStudents.forEach((s) => onUnarchiveStudent(s.id));
                  },
                });
              }}
              className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-emerald-700" />
              Restore All ({archivedStudents.length})
            </button>

            {onDeleteAllArchived && (
              <button
                type="button"
                onClick={() => {
                  onRequestConfirm({
                    type: 'delete_student',
                    title: 'Delete All Archived Records',
                    message: `Are you sure you want to permanently delete all ${archivedStudents.length} archived student records and their associated session logs?`,
                    itemDetails: `This will permanently delete ${archivedStudents.length} student profiles from storage.`,
                    confirmLabel: 'Delete All Archived',
                    confirmVariant: 'danger',
                    onConfirm: () => {
                      onDeleteAllArchived();
                    },
                  });
                }}
                className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                Delete All Archived
              </button>
            )}
          </div>
        )}
      </div>

      {/* SUB-TAB 1: ARCHIVED STUDENTS */}
      {activeSubTab === 'students' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search archived students by name, strand, topic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1.5 rounded-xl border border-amber-200 shrink-0">
              <Filter className="w-3.5 h-3.5 text-amber-700" />
              <select
                value={selectedSectionFilter}
                onChange={(e) => setSelectedSectionFilter(e.target.value)}
                className="bg-transparent text-xs font-bold text-amber-950 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Sections</option>
                {allSectionNames.map((sec) => (
                  <option key={sec} value={sec}>
                    {sec}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Archived Students Grid */}
          {filteredArchivedStudents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredArchivedStudents.map((student) => {
                const studentSessions = sessions.filter((s) => s.studentId === student.id);
                const latestScore =
                  studentSessions.length > 0
                    ? studentSessions[studentSessions.length - 1].score
                    : student.baselineScore;

                return (
                  <div
                    key={student.id}
                    className="bg-white rounded-2xl border border-amber-200/90 shadow-xs hover:shadow-md transition flex flex-col justify-between overflow-hidden"
                  >
                    <div className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              {student.programType}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-100 text-slate-600">
                              ARCHIVED
                            </span>
                          </div>
                          <h3 className="font-extrabold text-sm text-slate-900">
                            {student.lastName}, {student.firstName} {student.middleInitial}
                          </h3>
                          <p className="text-xs text-slate-500 font-medium">
                            {student.gradeLevel} - {student.section} &bull;{' '}
                            <span className="font-semibold text-emerald-800">{student.subject}</span>
                          </p>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold text-center border ${
                            student.status === 'Mastered / Promoted'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-amber-50 text-amber-800 border-amber-300'
                          }`}
                        >
                          {student.status}
                        </span>
                      </div>

                      {/* Details & Target Competency */}
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
                        <p className="text-slate-600 font-medium truncate">
                          <span className="font-bold text-slate-800">Target Competency: </span>
                          {student.focusTopic}
                        </p>
                        <div className="grid grid-cols-2 gap-1 pt-1 border-t border-slate-200 font-semibold text-[11px] text-center">
                          <div className="bg-white p-1 rounded-md border border-slate-200">
                            <span className="text-slate-500 block text-[9px]">Baseline</span>
                            <strong className="text-slate-800">{student.baselineScore}%</strong>
                          </div>
                          <div className="bg-emerald-50 p-1 rounded-md border border-emerald-200">
                            <span className="text-emerald-800 block text-[9px]">Latest Result</span>
                            <strong className="text-emerald-950">{latestScore}%</strong>
                          </div>
                        </div>
                      </div>

                      {/* Total sessions logged */}
                      <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
                        <span>Sessions Recorded: {studentSessions.length}</span>
                        {student.archivedAt && (
                          <span className="text-[10px] text-slate-400">
                            Archived {new Date(student.archivedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions Footer */}
                    <div className="bg-amber-50/50 p-3 border-t border-amber-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => onSelectStudent(student)}
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-600" />
                        View History
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            onRequestConfirm({
                              type: 'unarchive_student',
                              title: 'Restore Student to Active Roster',
                              message: `Restore ${student.firstName} ${student.lastName} back to the active student roster?`,
                              itemName: `${student.lastName}, ${student.firstName} ${student.middleInitial}`,
                              itemDetails: `${student.gradeLevel} - ${student.section} (${student.subject})`,
                              confirmLabel: 'Restore to Active',
                              confirmVariant: 'success',
                              onConfirm: () => onUnarchiveStudent(student.id),
                            });
                          }}
                          className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                          title="Restore student to active roster"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-yellow-300" />
                          Restore
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            onRequestConfirm({
                              type: 'delete_student',
                              title: 'Permanently Delete Student Record',
                              message: `Are you sure you want to permanently delete this student record and all associated daily session logs and photos?`,
                              itemName: `${student.lastName}, ${student.firstName} ${student.middleInitial}`,
                              itemDetails: `${student.gradeLevel} - ${student.section} (${student.subject})`,
                              confirmLabel: 'Delete Permanently',
                              confirmVariant: 'danger',
                              onConfirm: () => onDeleteStudent(student.id),
                            });
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                          title="Permanently delete student"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 space-y-3">
              <Archive className="w-10 h-10 text-amber-400 mx-auto" />
              <p className="text-sm font-bold text-slate-800">No archived student records found.</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                When students complete their remediation cycle or at the end of the grading period, you can archive their profiles to keep the main roster clean.
              </p>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: SECTION ARCHIVE & BULK MANAGEMENT */}
      {activeSubTab === 'sections' && (
        <div className="space-y-4">
          <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-200 text-xs text-blue-900 leading-relaxed flex items-start gap-2.5">
            <Layers className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
            <div>
              <strong>Section Bulk Operations:</strong> Archiving a section moves all students in that class to the archive while preserving their complete session logs, parent notes, and mastery calculations. Restoring a section reactivates all its students.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allSectionNames.map((sectionFullName) => {
              const sectionStudents = students.filter(
                (s) => `${s.gradeLevel} - ${s.section}` === sectionFullName || s.section === sectionFullName
              );
              const activeCount = sectionStudents.filter((s) => !s.isArchived).length;
              const archivedCount = sectionStudents.filter((s) => s.isArchived).length;
              const isFullyArchived = activeCount === 0 && archivedCount > 0;
              const isMixed = activeCount > 0 && archivedCount > 0;

              return (
                <div
                  key={sectionFullName}
                  className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between space-y-4 ${
                    isFullyArchived
                      ? 'border-amber-300 bg-amber-50/20'
                      : 'border-slate-200 hover:border-emerald-300'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                          Class Section
                        </span>
                        <h3 className="font-extrabold text-base text-slate-900">{sectionFullName}</h3>
                      </div>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                          isFullyArchived
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : isMixed
                            ? 'bg-blue-100 text-blue-900 border-blue-300'
                            : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                        }`}
                      >
                        {isFullyArchived ? 'Fully Archived' : isMixed ? 'Partially Archived' : 'Active Section'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                      <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                        <span className="text-[10px] font-bold text-emerald-800 block">Active Students</span>
                        <strong className="text-base text-emerald-950 font-black">{activeCount}</strong>
                      </div>
                      <div className="p-2 bg-amber-50 rounded-xl border border-amber-200 text-center">
                        <span className="text-[10px] font-bold text-amber-800 block">Archived Students</span>
                        <strong className="text-base text-amber-950 font-black">{archivedCount}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Section Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    {activeCount > 0 ? (
                      <button
                        type="button"
                        onClick={() => {
                          onRequestConfirm({
                            type: 'archive_section',
                            title: `Archive Section: ${sectionFullName}`,
                            message: `Are you sure you want to archive all ${activeCount} active students in ${sectionFullName}?`,
                            itemName: sectionFullName,
                            itemDetails: `${activeCount} active student records will be moved to the archive.`,
                            confirmLabel: 'Archive Section',
                            confirmVariant: 'warning',
                            onConfirm: () => onArchiveSection(sectionFullName),
                          });
                        }}
                        className="flex-1 px-3 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 font-extrabold rounded-xl text-xs transition border border-amber-300 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Archive className="w-3.5 h-3.5 text-amber-800" />
                        Archive Section
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          onRequestConfirm({
                            type: 'unarchive_section',
                            title: `Restore Section: ${sectionFullName}`,
                            message: `Restore all ${archivedCount} students in ${sectionFullName} back to the active roster?`,
                            itemName: sectionFullName,
                            itemDetails: `${archivedCount} students will be reactivated.`,
                            confirmLabel: 'Restore Section',
                            confirmVariant: 'success',
                            onConfirm: () => onUnarchiveSection(sectionFullName),
                          });
                        }}
                        className="flex-1 px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-yellow-300" />
                        Restore Section
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        onRequestConfirm({
                          type: 'delete_section',
                          title: `Delete Section: ${sectionFullName}`,
                          message: `Are you sure you want to permanently delete section ${sectionFullName} and all of its ${sectionStudents.length} students and their session logs?`,
                          itemName: sectionFullName,
                          itemDetails: `Total of ${sectionStudents.length} student records and their logs will be deleted.`,
                          confirmLabel: 'Delete Section',
                          confirmVariant: 'danger',
                          onConfirm: () => onDeleteSection(sectionFullName),
                        });
                      }}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                      title="Permanently delete entire section"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
