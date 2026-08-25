import React, { useState } from 'react';
import { TeacherProfile, UserRole, LEARNING_AREAS } from '../../types';
import { storage } from '../../services/storage';
import { TeacherPositionSelect } from '../BookingSchedulePicker';
import {
  Users,
  UserPlus,
  Edit3,
  KeyRound,
  ShieldCheck,
  Power,
  Search,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  X,
  Shield,
  UserCheck,
  Filter,
} from 'lucide-react';

interface AdminUserManagementProps {
  currentAdmin: TeacherProfile;
  teachers: TeacherProfile[];
  onRefresh: () => void;
}

export const AdminUserManagement: React.FC<AdminUserManagementProps> = ({
  currentAdmin,
  teachers,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Add Teacher Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newTitle, setNewTitle] = useState('Teacher I');
  const [newRole, setNewRole] = useState<UserRole>('teacher');
  const [newPassword, setNewPassword] = useState('deped2025');
  const [newAssignedSubjects, setNewAssignedSubjects] = useState<string[]>([]);
  const [addFeedback, setAddFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Edit Teacher Modal
  const [editTeacher, setEditTeacher] = useState<TeacherProfile | null>(null);
  const [editName, setEditName] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('teacher');
  const [editAssignedSubjects, setEditAssignedSubjects] = useState<string[]>([]);
  const [editFeedback, setEditFeedback] = useState<string | null>(null);

  // Reset Password Modal
  const [resetTeacher, setResetTeacher] = useState<TeacherProfile | null>(null);
  const [resetPasswordInput, setResetPasswordInput] = useState('');
  const [resetFeedback, setResetFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Assign Subject Modal
  const [assignSubjectsTeacher, setAssignSubjectsTeacher] = useState<TeacherProfile | null>(null);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [assignFeedback, setAssignFeedback] = useState<string | null>(null);

  // Filter teachers
  const filteredTeachers = teachers.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.title.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'all' || (t.role || 'teacher') === roleFilter;
    const matchesStatus = statusFilter === 'all' || (t.accountStatus || 'Active') === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Handle Add Teacher
  const handleCreateTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newName || !newPassword) {
      setAddFeedback({ type: 'error', message: 'Please fill in all required fields.' });
      return;
    }

    const res = storage.adminCreateTeacher(currentAdmin.email, {
      name: newName.trim(),
      email: newEmail.trim().toLowerCase(),
      title: newTitle.trim(),
      role: newRole,
      passwordHash: newPassword.trim(),
      isPasswordSet: true,
      accountStatus: 'Active',
      schoolName: 'Ramon Magsaysay (Cubao) High School',
      division: 'SDO Quezon City • TLE Department',
      region: 'National Capital Region (NCR)',
      academicYear: '2025-2026',
      department: 'Technology and Livelihood Education (TLE)',
      assignedSubjects: newAssignedSubjects,
      reportsSubmissionStatus: 'Submitted',
    });

    if (res.success) {
      setAddFeedback({ type: 'success', message: res.message });
      onRefresh();
      setTimeout(() => {
        setIsAddModalOpen(false);
        setNewName('');
        setNewEmail('');
        setNewPassword('deped2025');
        setNewAssignedSubjects([]);
        setAddFeedback(null);
      }, 1200);
    } else {
      setAddFeedback({ type: 'error', message: res.message });
    }
  };

  // Open Edit Modal
  const openEditModal = (t: TeacherProfile) => {
    setEditTeacher(t);
    setEditName(t.name);
    setEditTitle(t.title);
    setEditRole(t.role || 'teacher');
    setEditAssignedSubjects(t.assignedSubjects || []);
    setEditFeedback(null);
  };

  // Handle Update Teacher
  const handleSaveEditTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTeacher) return;

    const res = storage.adminUpdateTeacher(currentAdmin.email, editTeacher.email, {
      name: editName.trim(),
      title: editTitle.trim(),
      role: editRole,
      assignedSubjects: editAssignedSubjects,
    });

    if (res.success) {
      setEditFeedback('Teacher profile updated successfully.');
      onRefresh();
      setTimeout(() => {
        setEditTeacher(null);
        setEditFeedback(null);
      }, 1000);
    }
  };

  // Handle Toggle Status
  const handleToggleStatus = (t: TeacherProfile) => {
    const nextStatus = t.accountStatus === 'Inactive' ? 'Active' : 'Inactive';
    const res = storage.adminToggleAccountStatus(currentAdmin.email, t.email, nextStatus);
    if (res.success) {
      onRefresh();
    } else {
      alert(res.message);
    }
  };

  // Handle Reset Password
  const handleExecuteResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTeacher || !resetPasswordInput) return;

    const res = storage.adminResetTeacherPassword(
      currentAdmin.email,
      resetTeacher.email,
      resetPasswordInput.trim()
    );

    if (res.success) {
      setResetFeedback({ type: 'success', message: res.message });
      onRefresh();
      setTimeout(() => {
        setResetTeacher(null);
        setResetPasswordInput('');
        setResetFeedback(null);
      }, 1200);
    } else {
      setResetFeedback({ type: 'error', message: res.message });
    }
  };

  // Open Assign Subjects Modal
  const openAssignSubjects = (t: TeacherProfile) => {
    setAssignSubjectsTeacher(t);
    setSelectedSubjects(t.assignedSubjects || []);
    setAssignFeedback(null);
  };

  // Save Assigned Subjects
  const handleSaveAssignedSubjects = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignSubjectsTeacher) return;

    const res = storage.adminAssignTeacherSubjects(
      currentAdmin.email,
      assignSubjectsTeacher.email,
      selectedSubjects
    );

    if (res.success) {
      setAssignFeedback('Assigned learning areas updated.');
      onRefresh();
      setTimeout(() => {
        setAssignSubjectsTeacher(null);
        setAssignFeedback(null);
      }, 1000);
    }
  };

  const toggleSubjectSelection = (subj: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subj) ? prev.filter((s) => s !== subj) : [...prev, subj]
    );
  };

  const toggleNewSubjectSelection = (subj: string) => {
    setNewAssignedSubjects((prev) =>
      prev.includes(subj) ? prev.filter((s) => s !== subj) : [...prev, subj]
    );
  };

  const toggleEditSubjectSelection = (subj: string) => {
    setEditAssignedSubjects((prev) =>
      prev.includes(subj) ? prev.filter((s) => s !== subj) : [...prev, subj]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Add Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
        <div>
          <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-700" />
            User & Faculty Account Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage teacher profiles, access credentials, account activation, and TLE learning area assignments.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold rounded-xl text-xs transition flex items-center gap-2 shadow-sm cursor-pointer active:scale-95 shrink-0"
        >
          <UserPlus className="w-4 h-4 text-yellow-300" />
          ADD NEW TEACHER
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, DepEd email, or title..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
            <Filter className="w-3.5 h-3.5 text-slate-400" /> Role:
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Roles</option>
            <option value="admin">Administrator</option>
            <option value="school_head">School Head</option>
            <option value="coordinator">Remediation Coordinator</option>
            <option value="teacher">Teacher</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Teachers Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3.5">Faculty Member</th>
                <th className="px-4 py-3.5">Role & Designation</th>
                <th className="px-4 py-3.5">Assigned Learning Areas</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredTeachers.map((t) => {
                const isActive = t.accountStatus !== 'Inactive';
                const roleBadge =
                  t.role === 'admin'
                    ? 'bg-purple-100 text-purple-900 border-purple-200'
                    : t.role === 'school_head'
                    ? 'bg-indigo-100 text-indigo-900 border-indigo-200'
                    : t.role === 'coordinator'
                    ? 'bg-amber-100 text-amber-900 border-amber-200'
                    : 'bg-emerald-100 text-emerald-900 border-emerald-200';

                const roleLabel =
                  t.role === 'admin'
                    ? 'Administrator'
                    : t.role === 'school_head'
                    ? 'School Head'
                    : t.role === 'coordinator'
                    ? 'Remediation Coordinator'
                    : 'Teacher';

                return (
                  <tr key={t.email} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 font-black flex items-center justify-center text-xs shrink-0">
                          {t.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .substring(0, 2)
                            .toUpperCase()}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900">{t.name}</p>
                          <p className="text-[11px] text-slate-500 font-mono">{t.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${roleBadge}`}>
                        {roleLabel}
                      </span>
                      <p className="text-[11px] text-slate-500 mt-1">{t.title}</p>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {(t.assignedSubjects && t.assignedSubjects.length > 0) ? (
                          t.assignedSubjects.map((subj) => (
                            <span
                              key={subj}
                              className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200"
                            >
                              {subj}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">None assigned</span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openAssignSubjects(t)}
                          title="Assign Learning Areas"
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-emerald-50 hover:text-emerald-800 transition cursor-pointer"
                        >
                          <BookOpen className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditModal(t)}
                          title="Edit Teacher Info"
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-blue-50 hover:text-blue-800 transition cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setResetTeacher(t);
                            setResetPasswordInput('');
                            setResetFeedback(null);
                          }}
                          title="Reset Password"
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-amber-50 hover:text-amber-800 transition cursor-pointer"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>

                        {t.email.toLowerCase() !== currentAdmin.email.toLowerCase() && (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(t)}
                            title={isActive ? 'Deactivate Account' : 'Activate Account'}
                            className={`p-1.5 rounded-lg transition cursor-pointer ${
                              isActive
                                ? 'text-rose-600 hover:bg-rose-50 hover:text-rose-800'
                                : 'text-emerald-600 hover:bg-emerald-50 hover:text-emerald-800'
                            }`}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredTeachers.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-xs text-slate-400">
                    No faculty accounts matched your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Suggested User Roles & Permissions Matrix */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-4">
        <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-700" />
          DepEd Role Matrix & Access Permissions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200 text-xs space-y-1">
            <div className="flex items-center justify-between font-black text-purple-950">
              <span>Admin</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-200 text-purple-900">FULL ACCESS</span>
            </div>
            <p className="text-[11px] text-purple-800">
              Manage system settings, faculty accounts, programs, schedules, audit trail, and full backup/restore.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200 text-xs space-y-1">
            <div className="flex items-center justify-between font-black text-indigo-950">
              <span>School Head</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-200 text-indigo-900">REPORTS & ANALYTICS</span>
            </div>
            <p className="text-[11px] text-indigo-800">
              Institutional executive oversight, program evaluation, Department Head narrative reviews, and DepEd compliance.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs space-y-1">
            <div className="flex items-center justify-between font-black text-amber-950">
              <span>Remediation Coordinator</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-200 text-amber-900">PROGRAMS & FACULTY</span>
            </div>
            <p className="text-[11px] text-amber-800">
              Curriculum setup, teacher assignments, diagnostic rubric libraries, and weekly remediation alignment.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs space-y-1">
            <div className="flex items-center justify-between font-black text-emerald-950">
              <span>Teacher</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-900">STUDENTS & SESSIONS</span>
            </div>
            <p className="text-[11px] text-emerald-800">
              Enroll students, conduct daily anecdotal remediation logs, upload assessment MOVs, and generate class progress charts.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
            <div className="flex items-center justify-between font-black text-slate-800">
              <span>Student</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">READ-ONLY PORTAL</span>
            </div>
            <p className="text-[11px] text-slate-600">
              View remediation workshop schedules, meeting venue links, activity sheets, and personal competency progress.
            </p>
          </div>
        </div>
      </div>

      {/* --- ADD TEACHER MODAL --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-700" />
                Register New Teacher Account
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTeacher} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Teacher Name *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Corazon V. Santos"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">DepEd Email *</label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="name@depedqc.ph"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Initial Password *</label>
                  <input
                    type="text"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <TeacherPositionSelect
                    label="Position / Title"
                    value={newTitle}
                    onChange={(val) => setNewTitle(val)}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">System Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="teacher">Teacher</option>
                    <option value="coordinator">Remediation Coordinator</option>
                    <option value="school_head">School Head</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              {/* Learning Area assignments */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Assign TLE Learning Areas</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 max-h-40 overflow-y-auto">
                  {LEARNING_AREAS.map((subj) => {
                    const isChecked = newAssignedSubjects.includes(subj);
                    return (
                      <label
                        key={subj}
                        onClick={() => toggleNewSubjectSelection(subj)}
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
                        <span className="truncate">{subj}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {addFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                    addFeedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {addFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{addFeedback.message}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold rounded-xl transition shadow-md cursor-pointer"
                >
                  Save Teacher Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT TEACHER MODAL --- */}
      {editTeacher && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-700" />
                Edit Teacher Information
              </h3>
              <button
                type="button"
                onClick={() => setEditTeacher(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditTeacher} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Teacher Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">DepEd Email (Immutable)</label>
                  <input
                    type="text"
                    disabled
                    value={editTeacher.email}
                    className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">System Role</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="teacher">Teacher</option>
                    <option value="coordinator">Remediation Coordinator</option>
                    <option value="school_head">School Head</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              <div>
                <TeacherPositionSelect
                  label="Position / Title"
                  value={editTitle}
                  onChange={(val) => setEditTitle(val)}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Assigned TLE Learning Areas</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 max-h-40 overflow-y-auto">
                  {LEARNING_AREAS.map((subj) => {
                    const isChecked = editAssignedSubjects.includes(subj);
                    return (
                      <label
                        key={subj}
                        onClick={() => toggleEditSubjectSelection(subj)}
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
                        <span className="truncate">{subj}</span>
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
                  onClick={() => setEditTeacher(null)}
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

      {/* --- RESET PASSWORD MODAL --- */}
      {resetTeacher && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-600" />
                Reset Teacher Password
              </h3>
              <button
                type="button"
                onClick={() => setResetTeacher(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteResetPassword} className="space-y-4 text-xs">
              <p className="text-slate-600">
                You are resetting the password for <strong>{resetTeacher.name}</strong> ({resetTeacher.email}).
              </p>

              <div>
                <label className="block font-bold text-slate-700 mb-1">New Temporary Password *</label>
                <input
                  type="text"
                  required
                  minLength={4}
                  value={resetPasswordInput}
                  onChange={(e) => setResetPasswordInput(e.target.value)}
                  placeholder="e.g. deped2026"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {resetFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                    resetFeedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {resetFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{resetFeedback.message}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetTeacher(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-extrabold rounded-xl transition shadow-md cursor-pointer"
                >
                  Confirm Password Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ASSIGN SUBJECTS MODAL --- */}
      {assignSubjectsTeacher && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-700" />
                Assign TLE Learning Areas
              </h3>
              <button
                type="button"
                onClick={() => setAssignSubjectsTeacher(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAssignedSubjects} className="space-y-4 text-xs">
              <p className="text-slate-600">
                Select learning areas taught by <strong>{assignSubjectsTeacher.name}</strong>:
              </p>

              <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200 max-h-60 overflow-y-auto">
                {LEARNING_AREAS.map((subj) => {
                  const isChecked = selectedSubjects.includes(subj);
                  return (
                    <label
                      key={subj}
                      onClick={() => toggleSubjectSelection(subj)}
                      className={`flex items-center gap-2.5 p-2.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
                        isChecked
                          ? 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                          : 'bg-white text-slate-700 border border-slate-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="rounded text-emerald-600 focus:ring-emerald-500 pointer-events-none"
                      />
                      <span>{subj}</span>
                    </label>
                  );
                })}
              </div>

              {assignFeedback && (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{assignFeedback}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssignSubjectsTeacher(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold rounded-xl transition shadow-md cursor-pointer"
                >
                  Save Subject Assignments
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
