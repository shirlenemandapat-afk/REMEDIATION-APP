import React, { useState } from 'react';
import { RemediationProgram, TeacherProfile, LEARNING_AREAS, LearningArea } from '../../types';
import { storage } from '../../services/storage';
import {
  BookOpen,
  PlusCircle,
  Edit3,
  Trash2,
  Calendar,
  Users,
  Target,
  CheckCircle2,
  AlertCircle,
  X,
  Search,
  Filter,
  Sparkles,
  Layers,
} from 'lucide-react';

interface AdminProgramManagementProps {
  currentAdmin: TeacherProfile;
  programs: RemediationProgram[];
  teachers: TeacherProfile[];
  onRefresh: () => void;
}

export const AdminProgramManagement: React.FC<AdminProgramManagementProps> = ({
  currentAdmin,
  programs,
  teachers,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [areaFilter, setAreaFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Create Program Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [learningArea, setLearningArea] = useState<LearningArea>(LEARNING_AREAS[0]);
  const [targetGradeLevel, setTargetGradeLevel] = useState('Grade 7 & 8');
  const [programObjectives, setProgramObjectives] = useState('');
  const [assignedTeacherEmails, setAssignedTeacherEmails] = useState<string[]>([]);
  const [scheduleDescription, setScheduleDescription] = useState('Every Tuesday & Thursday, 3:30 PM - 4:45 PM');
  const [startDate, setStartDate] = useState('2026-08-01');
  const [endDate, setEndDate] = useState('2026-10-31');
  const [status, setStatus] = useState<'Active' | 'Upcoming' | 'Completed'>('Active');
  const [maxStudents, setMaxStudents] = useState(25);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Edit Program Modal
  const [editProgram, setEditProgram] = useState<RemediationProgram | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editLearningArea, setEditLearningArea] = useState<LearningArea>(LEARNING_AREAS[0]);
  const [editTargetGradeLevel, setEditTargetGradeLevel] = useState('');
  const [editProgramObjectives, setEditProgramObjectives] = useState('');
  const [editAssignedTeacherEmails, setEditAssignedTeacherEmails] = useState<string[]>([]);
  const [editScheduleDescription, setEditScheduleDescription] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editStatus, setEditStatus] = useState<'Active' | 'Upcoming' | 'Completed'>('Active');
  const [editMaxStudents, setEditMaxStudents] = useState(25);
  const [editFeedback, setEditFeedback] = useState<string | null>(null);

  // Delete Confirm Modal
  const [deleteProgramId, setDeleteProgramId] = useState<string | null>(null);

  // Filtered Programs
  const filteredPrograms = programs.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.learningArea.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.programObjectives.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesArea = areaFilter === 'all' || p.learningArea === areaFilter;
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;

    return matchesSearch && matchesArea && matchesStatus;
  });

  const toggleTeacherSelection = (email: string, isEdit = false) => {
    if (isEdit) {
      setEditAssignedTeacherEmails((prev) =>
        prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
      );
    } else {
      setAssignedTeacherEmails((prev) =>
        prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
      );
    }
  };

  const handleCreateProgram = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !learningArea || !programObjectives) {
      setFeedback({ type: 'error', message: 'Please provide title, learning area, and program objectives.' });
      return;
    }

    const assignedNames = teachers
      .filter((t) => assignedTeacherEmails.includes(t.email))
      .map((t) => t.name);

    storage.createProgram(currentAdmin.email, {
      title: title.trim(),
      learningArea,
      targetGradeLevel,
      programObjectives: programObjectives.trim(),
      assignedTeacherEmails,
      assignedTeacherNames: assignedNames,
      scheduleDescription: scheduleDescription.trim(),
      startDate,
      endDate,
      status,
      maxStudents: Number(maxStudents),
    });

    setFeedback({ type: 'success', message: 'Remediation Program created successfully!' });
    onRefresh();
    setTimeout(() => {
      setIsCreateOpen(false);
      setTitle('');
      setProgramObjectives('');
      setAssignedTeacherEmails([]);
      setFeedback(null);
    }, 1200);
  };

  const openEdit = (p: RemediationProgram) => {
    setEditProgram(p);
    setEditTitle(p.title);
    setEditLearningArea(p.learningArea);
    setEditTargetGradeLevel(p.targetGradeLevel);
    setEditProgramObjectives(p.programObjectives);
    setEditAssignedTeacherEmails(p.assignedTeacherEmails || []);
    setEditScheduleDescription(p.scheduleDescription);
    setEditStartDate(p.startDate);
    setEditEndDate(p.endDate);
    setEditStatus(p.status);
    setEditMaxStudents(p.maxStudents || 25);
    setEditFeedback(null);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProgram) return;

    const assignedNames = teachers
      .filter((t) => editAssignedTeacherEmails.includes(t.email))
      .map((t) => t.name);

    storage.updateProgram(currentAdmin.email, editProgram.id, {
      title: editTitle.trim(),
      learningArea: editLearningArea,
      targetGradeLevel: editTargetGradeLevel,
      programObjectives: editProgramObjectives.trim(),
      assignedTeacherEmails: editAssignedTeacherEmails,
      assignedTeacherNames: assignedNames,
      scheduleDescription: editScheduleDescription.trim(),
      startDate: editStartDate,
      endDate: editEndDate,
      status: editStatus,
      maxStudents: Number(editMaxStudents),
    });

    setEditFeedback('Remediation Program updated successfully.');
    onRefresh();
    setTimeout(() => {
      setEditProgram(null);
      setEditFeedback(null);
    }, 1000);
  };

  const handleDelete = () => {
    if (!deleteProgramId) return;
    storage.deleteProgram(currentAdmin.email, deleteProgramId);
    setDeleteProgramId(null);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
        <div>
          <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-700" />
            Remediation Program Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure curriculum objectives, target competencies, schedules, and faculty assignments across the 6 DepEd TLE learning areas.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold rounded-xl text-xs transition flex items-center gap-2 shadow-sm cursor-pointer active:scale-95 shrink-0"
        >
          <PlusCircle className="w-4 h-4 text-yellow-300" />
          CREATE REMEDIATION PROGRAM
        </button>
      </div>

      {/* 6 Learning Area Quick Selector Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {LEARNING_AREAS.map((area) => {
          const count = programs.filter((p) => p.learningArea === area).length;
          const isSelected = areaFilter === area;
          return (
            <button
              key={area}
              type="button"
              onClick={() => setAreaFilter(isSelected ? 'all' : area)}
              className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-emerald-900 text-yellow-300 border-emerald-800 shadow-md ring-2 ring-emerald-600'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/90 shadow-2xs'
              }`}
            >
              <span className="text-[11px] font-bold leading-tight line-clamp-2">{area}</span>
              <span className={`text-[10px] font-mono mt-2 ${isSelected ? 'text-emerald-200' : 'text-slate-400'}`}>
                {count} {count === 1 ? 'Program' : 'Programs'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search programs by title, objectives, or learning area..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Status</option>
            <option value="Active">Active</option>
            <option value="Upcoming">Upcoming</option>
            <option value="Completed">Completed</option>
          </select>

          {areaFilter !== 'all' && (
            <button
              type="button"
              onClick={() => setAreaFilter('all')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Clear Area
            </button>
          )}
        </div>
      </div>

      {/* Programs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredPrograms.map((prog) => {
          const statusBg =
            prog.status === 'Active'
              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
              : prog.status === 'Upcoming'
              ? 'bg-blue-100 text-blue-900 border-blue-300'
              : 'bg-slate-100 text-slate-700 border-slate-300';

          return (
            <div
              key={prog.id}
              className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition space-y-3.5 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                    {prog.learningArea}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusBg}`}>
                    {prog.status}
                  </span>
                </div>

                <h3 className="text-sm font-extrabold text-slate-900 leading-snug">{prog.title}</h3>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                  <div className="flex items-center gap-1 font-bold text-slate-700 text-[11px]">
                    <Target className="w-3.5 h-3.5 text-emerald-600" /> Program Objectives:
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed line-clamp-3">{prog.programObjectives}</p>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1 text-slate-500">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> Schedule:
                  </span>
                  <span className="font-semibold text-slate-800">{prog.scheduleDescription}</span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1 text-slate-500">
                    <Users className="w-3.5 h-3.5 text-slate-400" /> Assigned Faculty:
                  </span>
                  <span className="font-semibold text-slate-800 text-right truncate max-w-[180px]">
                    {prog.assignedTeacherNames?.join(', ') || 'None assigned'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Target: {prog.targetGradeLevel}</span>
                  <span className="text-slate-400 font-mono">
                    {prog.startDate} to {prog.endDate}
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => openEdit(prog)}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteProgramId(prog.id)}
                    className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredPrograms.length === 0 && (
          <div className="col-span-2 py-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
            No remediation programs found. Click "Create Remediation Program" to set up a new program.
          </div>
        )}
      </div>

      {/* --- CREATE PROGRAM MODAL --- */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-700" />
                Create Remediation Program
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProgram} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Program Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Q1 Intensive ICT - Computer Programming Logic Booster"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Learning Area *</label>
                  <select
                    value={learningArea}
                    onChange={(e) => setLearningArea(e.target.value as LearningArea)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {LEARNING_AREAS.map((area) => (
                      <option key={area} value={area}>
                        {area}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Grade Level</label>
                  <input
                    type="text"
                    value={targetGradeLevel}
                    onChange={(e) => setTargetGradeLevel(e.target.value)}
                    placeholder="e.g. Grade 7 & 8"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Program Objectives & Focus Competencies *</label>
                <textarea
                  required
                  rows={3}
                  value={programObjectives}
                  onChange={(e) => setProgramObjectives(e.target.value)}
                  placeholder="Describe the learning intervention objectives, target diagnostic skills, and hands-on laboratory goals..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Schedule Description</label>
                <input
                  type="text"
                  value={scheduleDescription}
                  onChange={(e) => setScheduleDescription(e.target.value)}
                  placeholder="e.g. Every Tuesday & Thursday, 3:30 PM - 4:45 PM"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Upcoming">Upcoming</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* Assign Teachers */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Assign Lead Teachers</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 max-h-36 overflow-y-auto">
                  {teachers.map((t) => {
                    const isChecked = assignedTeacherEmails.includes(t.email);
                    return (
                      <label
                        key={t.email}
                        onClick={() => toggleTeacherSelection(t.email, false)}
                        className={`flex items-center gap-2 p-2 rounded-lg text-[11px] font-semibold cursor-pointer transition ${
                          isChecked ? 'bg-emerald-100 text-emerald-950 border border-emerald-300' : 'bg-white text-slate-700 border border-slate-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded text-emerald-600 focus:ring-emerald-500 pointer-events-none"
                        />
                        <span className="truncate">{t.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {feedback && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                    feedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {feedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{feedback.message}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold rounded-xl transition shadow-md cursor-pointer"
                >
                  Create Program
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT PROGRAM MODAL --- */}
      {editProgram && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-700" />
                Edit Remediation Program
              </h3>
              <button
                type="button"
                onClick={() => setEditProgram(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Program Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Learning Area</label>
                  <select
                    value={editLearningArea}
                    onChange={(e) => setEditLearningArea(e.target.value as LearningArea)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {LEARNING_AREAS.map((area) => (
                      <option key={area} value={area}>
                        {area}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Grade Level</label>
                  <input
                    type="text"
                    value={editTargetGradeLevel}
                    onChange={(e) => setEditTargetGradeLevel(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Program Objectives & Focus Competencies</label>
                <textarea
                  required
                  rows={3}
                  value={editProgramObjectives}
                  onChange={(e) => setEditProgramObjectives(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Schedule Description</label>
                <input
                  type="text"
                  value={editScheduleDescription}
                  onChange={(e) => setEditScheduleDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={editEndDate}
                    onChange={(e) => setEditEndDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Upcoming">Upcoming</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Assign Lead Teachers</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 max-h-36 overflow-y-auto">
                  {teachers.map((t) => {
                    const isChecked = editAssignedTeacherEmails.includes(t.email);
                    return (
                      <label
                        key={t.email}
                        onClick={() => toggleTeacherSelection(t.email, true)}
                        className={`flex items-center gap-2 p-2 rounded-lg text-[11px] font-semibold cursor-pointer transition ${
                          isChecked ? 'bg-emerald-100 text-emerald-950 border border-emerald-300' : 'bg-white text-slate-700 border border-slate-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded text-emerald-600 focus:ring-emerald-500 pointer-events-none"
                        />
                        <span className="truncate">{t.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {editFeedback && (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{editFeedback}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditProgram(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-700 hover:bg-blue-600 text-white font-extrabold rounded-xl transition shadow-md cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DELETE CONFIRM MODAL --- */}
      {deleteProgramId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-rose-600" />
              Delete Remediation Program?
            </h3>
            <p className="text-xs text-slate-600">
              Are you sure you want to delete this remediation program? Associated class logs and records will remain archived.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteProgramId(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs transition shadow-md cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
