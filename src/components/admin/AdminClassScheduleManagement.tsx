import React, { useState } from 'react';
import { RemediationClass, RemediationProgram, TeacherProfile, Student, LEARNING_AREAS, LearningArea } from '../../types';
import { storage } from '../../services/storage';
import {
  CalendarCheck,
  PlusCircle,
  Edit3,
  Trash2,
  Users,
  MapPin,
  Video,
  Clock,
  Calendar,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
  BookOpen,
} from 'lucide-react';

interface AdminClassScheduleManagementProps {
  currentAdmin: TeacherProfile;
  classes: RemediationClass[];
  programs: RemediationProgram[];
  teachers: TeacherProfile[];
  students: Student[];
  onRefresh: () => void;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const AdminClassScheduleManagement: React.FC<AdminClassScheduleManagementProps> = ({
  currentAdmin,
  classes,
  programs,
  teachers,
  students,
  onRefresh,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [dayFilter, setDayFilter] = useState<string>('all');

  // Create Class Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [className, setClassName] = useState('');
  const [programId, setProgramId] = useState<string>(programs[0]?.id || '');
  const [learningArea, setLearningArea] = useState<LearningArea>(LEARNING_AREAS[0]);
  const [assignedTeacherEmail, setAssignedTeacherEmail] = useState<string>(teachers[0]?.email || '');
  const [enrolledStudentIds, setEnrolledStudentIds] = useState<string[]>([]);
  const [scheduleDays, setScheduleDays] = useState<string[]>(['Monday', 'Wednesday']);
  const [startTime, setStartTime] = useState('15:30');
  const [endTime, setEndTime] = useState('16:45');
  const [venueType, setVenueType] = useState<'Physical Room' | 'Online Link'>('Physical Room');
  const [venueOrLink, setVenueOrLink] = useState('ICT Computer Lab 1');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Edit Class Modal
  const [editClass, setEditClass] = useState<RemediationClass | null>(null);
  const [editClassName, setEditClassName] = useState('');
  const [editLearningArea, setEditLearningArea] = useState<LearningArea>(LEARNING_AREAS[0]);
  const [editAssignedTeacherEmail, setEditAssignedTeacherEmail] = useState('');
  const [editEnrolledStudentIds, setEditEnrolledStudentIds] = useState<string[]>([]);
  const [editScheduleDays, setEditScheduleDays] = useState<string[]>([]);
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editVenueType, setEditVenueType] = useState<'Physical Room' | 'Online Link'>('Physical Room');
  const [editVenueOrLink, setEditVenueOrLink] = useState('');
  const [editStatus, setEditStatus] = useState<'Active' | 'Completed' | 'Suspended'>('Active');
  const [editFeedback, setEditFeedback] = useState<string | null>(null);

  // Delete Confirm Modal
  const [deleteClassId, setDeleteClassId] = useState<string | null>(null);

  const activeStudents = students.filter((s) => !s.isArchived);

  // Filtered Classes
  const filteredClasses = classes.filter((c) => {
    const matchesSearch =
      c.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.learningArea.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.assignedTeacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.venueOrLink.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDay = dayFilter === 'all' || (c.scheduleDays && c.scheduleDays.includes(dayFilter));

    return matchesSearch && matchesDay;
  });

  const toggleDay = (day: string, isEdit = false) => {
    if (isEdit) {
      setEditScheduleDays((prev) =>
        prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
      );
    } else {
      setScheduleDays((prev) =>
        prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
      );
    }
  };

  const toggleStudentEnrollment = (studentId: string, isEdit = false) => {
    if (isEdit) {
      setEditEnrolledStudentIds((prev) =>
        prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
      );
    } else {
      setEnrolledStudentIds((prev) =>
        prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
      );
    }
  };

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!className || !learningArea || !assignedTeacherEmail) {
      setFeedback({ type: 'error', message: 'Please fill in class name, learning area, and assign a teacher.' });
      return;
    }

    const teacher = teachers.find((t) => t.email === assignedTeacherEmail);

    storage.createRemediationClass(currentAdmin.email, {
      programId,
      className: className.trim(),
      learningArea,
      assignedTeacherEmail,
      assignedTeacherName: teacher?.name || assignedTeacherEmail,
      enrolledStudentIds,
      scheduleDays,
      startTime,
      endTime,
      venueType,
      venueOrLink: venueOrLink.trim(),
      status: 'Active',
    });

    setFeedback({ type: 'success', message: 'Remediation class & schedule created!' });
    onRefresh();
    setTimeout(() => {
      setIsCreateOpen(false);
      setClassName('');
      setEnrolledStudentIds([]);
      setFeedback(null);
    }, 1200);
  };

  const openEdit = (c: RemediationClass) => {
    setEditClass(c);
    setEditClassName(c.className);
    setEditLearningArea(c.learningArea);
    setEditAssignedTeacherEmail(c.assignedTeacherEmail);
    setEditEnrolledStudentIds(c.enrolledStudentIds || []);
    setEditScheduleDays(c.scheduleDays || []);
    setEditStartTime(c.startTime || '15:30');
    setEditEndTime(c.endTime || '16:45');
    setEditVenueType(c.venueType || 'Physical Room');
    setEditVenueOrLink(c.venueOrLink || '');
    setEditStatus(c.status);
    setEditFeedback(null);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editClass) return;

    const teacher = teachers.find((t) => t.email === editAssignedTeacherEmail);

    storage.updateRemediationClass(currentAdmin.email, editClass.id, {
      className: editClassName.trim(),
      learningArea: editLearningArea,
      assignedTeacherEmail: editAssignedTeacherEmail,
      assignedTeacherName: teacher?.name || editAssignedTeacherEmail,
      enrolledStudentIds: editEnrolledStudentIds,
      scheduleDays: editScheduleDays,
      startTime: editStartTime,
      endTime: editEndTime,
      venueType: editVenueType,
      venueOrLink: editVenueOrLink.trim(),
      status: editStatus,
    });

    setEditFeedback('Remediation class schedule updated.');
    onRefresh();
    setTimeout(() => {
      setEditClass(null);
      setEditFeedback(null);
    }, 1000);
  };

  const handleDelete = () => {
    if (!deleteClassId) return;
    storage.deleteRemediationClass(currentAdmin.email, deleteClassId);
    setDeleteClassId(null);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
        <div>
          <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-blue-700" />
            Class and Schedule Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Organize remediation groups, assign student cohorts and teachers, set weekly timeframes, and configure lab venues or Google Meet links.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'grid' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Class Cards
            </button>
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                viewMode === 'calendar' ? 'bg-white text-blue-900 shadow-2xs font-extrabold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" /> Weekly Timetable
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2.5 bg-blue-700 hover:bg-blue-600 text-white font-extrabold rounded-xl text-xs transition flex items-center gap-2 shadow-sm cursor-pointer active:scale-95"
          >
            <PlusCircle className="w-4 h-4 text-yellow-300" />
            CREATE REMEDIATION CLASS
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search classes by name, teacher, venue, or subject..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={dayFilter}
            onChange={(e) => setDayFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Days</option>
            {DAYS_OF_WEEK.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* VIEW MODE 1: GRID CARDS */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredClasses.map((cls) => {
            const studentCount = cls.enrolledStudentIds?.length || 0;
            const isOnline = cls.venueType === 'Online Link';

            return (
              <div
                key={cls.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-800 border border-blue-200">
                      {cls.learningArea}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                        cls.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {cls.status}
                    </span>
                  </div>

                  <h3 className="text-sm font-extrabold text-slate-900 leading-snug">{cls.className}</h3>

                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="font-bold text-slate-800">
                        {cls.scheduleDays?.join(', ') || 'No days'} • {cls.startTime} - {cls.endTime}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isOnline ? (
                        <Video className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      ) : (
                        <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      )}
                      <span className="truncate">
                        {isOnline ? (
                          <a
                            href={cls.venueOrLink.startsWith('http') ? cls.venueOrLink : `https://${cls.venueOrLink}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-600 hover:underline font-semibold flex items-center gap-1"
                          >
                            {cls.venueOrLink} <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="font-semibold text-slate-700">{cls.venueOrLink}</span>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        Teacher: <strong className="text-slate-800">{cls.assignedTeacherName}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg">
                    <Users className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{studentCount} Enrolled Students</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEdit(cls)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteClassId(cls.id)}
                      className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredClasses.length === 0 && (
            <div className="col-span-2 py-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
              No remediation classes found. Click "Create Remediation Class" to organize a cohort.
            </div>
          )}
        </div>
      )}

      {/* VIEW MODE 2: WEEKLY CALENDAR TIMETABLE */}
      {viewMode === 'calendar' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-700" />
              Weekly Remediation Schedule Matrix
            </h3>
            <span className="text-xs text-slate-500">Scheduled Remediation & Workshop Slots</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            {DAYS_OF_WEEK.map((day) => {
              const dayClasses = classes.filter((c) => c.scheduleDays?.includes(day));
              return (
                <div key={day} className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 space-y-2.5 min-h-[220px]">
                  <div className="pb-1.5 border-b border-slate-200 text-center">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider">{day}</span>
                    <p className="text-[10px] text-slate-400 font-semibold">{dayClasses.length} Scheduled</p>
                  </div>

                  <div className="space-y-2">
                    {dayClasses.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => openEdit(c)}
                        className="p-2.5 rounded-lg bg-white border border-blue-200 shadow-2xs hover:shadow-xs transition cursor-pointer space-y-1 group"
                      >
                        <p className="text-[11px] font-extrabold text-blue-950 line-clamp-2 group-hover:text-blue-700">
                          {c.className}
                        </p>
                        <div className="flex items-center gap-1 text-[10px] text-blue-800 font-bold">
                          <Clock className="w-3 h-3 text-blue-500" />
                          <span>
                            {c.startTime} - {c.endTime}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 truncate">{c.venueOrLink}</p>
                      </div>
                    ))}

                    {dayClasses.length === 0 && (
                      <p className="text-center text-[10px] text-slate-400 py-6 italic">No classes</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- CREATE CLASS MODAL --- */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-blue-700" />
                Create Remediation Class & Schedule
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Class / Cohort Name *</label>
                <input
                  type="text"
                  required
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="e.g. Grade 7 Diamond - Programming Logic Lab"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Learning Area *</label>
                  <select
                    value={learningArea}
                    onChange={(e) => setLearningArea(e.target.value as LearningArea)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {LEARNING_AREAS.map((area) => (
                      <option key={area} value={area}>
                        {area}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assigned Teacher *</label>
                  <select
                    value={assignedTeacherEmail}
                    onChange={(e) => setAssignedTeacherEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {teachers.map((t) => (
                      <option key={t.email} value={t.email}>
                        {t.name} ({t.title})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Schedule Days */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Schedule Days</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {DAYS_OF_WEEK.map((d) => {
                    const isSelected = scheduleDays.includes(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleDay(d, false)}
                        className={`p-2 rounded-xl text-[11px] font-bold border transition cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {d.substring(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Venue Type</label>
                  <select
                    value={venueType}
                    onChange={(e) => setVenueType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Physical Room">Physical Room / Lab</option>
                    <option value="Online Link">Online Meeting Link</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    {venueType === 'Physical Room' ? 'Room / Lab Venue' : 'Meeting Link (Google Meet / Zoom)'}
                  </label>
                  <input
                    type="text"
                    required
                    value={venueOrLink}
                    onChange={(e) => setVenueOrLink(e.target.value)}
                    placeholder={
                      venueType === 'Physical Room' ? 'e.g. TLE Computer Lab 1 (Bldg B, 2F)' : 'e.g. https://meet.google.com/xyz'
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Assign Students from Roster */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Assign Students ({enrolledStudentIds.length} Selected)
                </label>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 max-h-40 overflow-y-auto space-y-1.5">
                  {activeStudents.map((s) => {
                    const isChecked = enrolledStudentIds.includes(s.id);
                    return (
                      <label
                        key={s.id}
                        onClick={() => toggleStudentEnrollment(s.id, false)}
                        className={`flex items-center justify-between p-2 rounded-lg text-[11px] font-semibold cursor-pointer transition ${
                          isChecked
                            ? 'bg-blue-100 text-blue-950 border border-blue-300'
                            : 'bg-white text-slate-700 border border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="rounded text-blue-600 focus:ring-blue-500 pointer-events-none"
                          />
                          <span>
                            {s.lastName}, {s.firstName} {s.middleInitial}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {s.gradeLevel} - {s.section} ({s.status})
                        </span>
                      </label>
                    );
                  })}

                  {activeStudents.length === 0 && (
                    <p className="text-slate-400 text-center py-2">No active students available in roster.</p>
                  )}
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
                  className="px-5 py-2 bg-blue-700 hover:bg-blue-600 text-white font-extrabold rounded-xl transition shadow-md cursor-pointer"
                >
                  Save Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT CLASS MODAL --- */}
      {editClass && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-700" />
                Edit Remediation Class & Schedule
              </h3>
              <button
                type="button"
                onClick={() => setEditClass(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Class Name</label>
                <input
                  type="text"
                  required
                  value={editClassName}
                  onChange={(e) => setEditClassName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Learning Area</label>
                  <select
                    value={editLearningArea}
                    onChange={(e) => setEditLearningArea(e.target.value as LearningArea)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {LEARNING_AREAS.map((area) => (
                      <option key={area} value={area}>
                        {area}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assigned Teacher</label>
                  <select
                    value={editAssignedTeacherEmail}
                    onChange={(e) => setEditAssignedTeacherEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {teachers.map((t) => (
                      <option key={t.email} value={t.email}>
                        {t.name} ({t.title})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Schedule Days</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {DAYS_OF_WEEK.map((d) => {
                    const isSelected = editScheduleDays.includes(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleDay(d, true)}
                        className={`p-2 rounded-xl text-[11px] font-bold border transition cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {d.substring(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={editStartTime}
                    onChange={(e) => setEditStartTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">End Time</label>
                  <input
                    type="time"
                    value={editEndTime}
                    onChange={(e) => setEditEndTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Venue Type</label>
                  <select
                    value={editVenueType}
                    onChange={(e) => setEditVenueType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Physical Room">Physical Room / Lab</option>
                    <option value="Online Link">Online Meeting Link</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Venue / Online Link</label>
                  <input
                    type="text"
                    required
                    value={editVenueOrLink}
                    onChange={(e) => setEditVenueOrLink(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Assign Students ({editEnrolledStudentIds.length} Selected)
                </label>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 max-h-40 overflow-y-auto space-y-1.5">
                  {activeStudents.map((s) => {
                    const isChecked = editEnrolledStudentIds.includes(s.id);
                    return (
                      <label
                        key={s.id}
                        onClick={() => toggleStudentEnrollment(s.id, true)}
                        className={`flex items-center justify-between p-2 rounded-lg text-[11px] font-semibold cursor-pointer transition ${
                          isChecked
                            ? 'bg-blue-100 text-blue-950 border border-blue-300'
                            : 'bg-white text-slate-700 border border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="rounded text-blue-600 focus:ring-blue-500 pointer-events-none"
                          />
                          <span>
                            {s.lastName}, {s.firstName} {s.middleInitial}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {s.gradeLevel} - {s.section}
                        </span>
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
                  onClick={() => setEditClass(null)}
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
      {deleteClassId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-rose-600" />
              Delete Remediation Class?
            </h3>
            <p className="text-xs text-slate-600">
              Are you sure you want to remove this remediation class cohort?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteClassId(null)}
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
