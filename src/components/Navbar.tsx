import React, { useState } from 'react';
import { TeacherProfile } from '../types';
import { storage } from '../services/storage';
import { isSupabaseConfigured } from '../services/supabase';
import { SchoolLogo } from './SchoolLogo';
import { TeacherPositionSelect } from './BookingSchedulePicker';
import {
  LogOut,
  User,
  Key,
  Edit3,
  X,
  Check,
  Laptop,
  Utensils,
  Wrench,
  Sprout,
  Shield,
  Building2,
  Award,
  FileSignature,
  School,
  Sparkles,
  Info,
  RotateCcw,
  Database,
  Cloud,
} from 'lucide-react';

interface NavbarProps {
  teacher: TeacherProfile;
  onUpdateTeacher: (updated: TeacherProfile) => void;
  onLogout: () => void;
  selectedSection: string;
  onSelectSection: (section: string) => void;
  sectionsList: string[];
  onOpenSupabaseModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  teacher,
  onUpdateTeacher,
  onLogout,
  selectedSection,
  onSelectSection,
  sectionsList,
  onOpenSupabaseModal,
}) => {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'signatories' | 'teacher' | 'school'>('signatories');

  // Teacher info
  const [editName, setEditName] = useState(teacher.name);
  const [editTitle, setEditTitle] = useState(teacher.title);
  const [editDepartment, setEditDepartment] = useState(teacher.department || 'Technology and Livelihood Education (TLE)');
  const [editSchool, setEditSchool] = useState(teacher.schoolName || 'Ramon Magsaysay (Cubao) High School');
  const [editDivision, setEditDivision] = useState(teacher.division || 'SDO Quezon City • TLE Department');
  const [editAcademicYear, setEditAcademicYear] = useState(teacher.academicYear || '2025-2026');

  // Official Signatories
  const [editMasterTeacherName, setEditMasterTeacherName] = useState(
    teacher.masterTeacherName || 'Shirlene M. Mandapat'
  );
  const [editMasterTeacherPosition, setEditMasterTeacherPosition] = useState(
    teacher.masterTeacherPosition || 'Master Teacher I / TLE Subject Coordinator'
  );
  const [editHeadTeacherName, setEditHeadTeacherName] = useState(
    teacher.headTeacherName || 'Dr. Corazon V. Santos'
  );
  const [editHeadTeacherPosition, setEditHeadTeacherPosition] = useState(
    teacher.headTeacherPosition || 'Head Teacher III / TLE Department'
  );
  const [editPrincipalName, setEditPrincipalName] = useState(
    teacher.principalName || 'Dr. Maria Luisa T. Ramos'
  );
  const [editPrincipalPosition, setEditPrincipalPosition] = useState(
    teacher.principalPosition || 'Secondary School Principal IV'
  );

  const [newPassword, setNewPassword] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  // Sync state whenever teacher profile changes or modal opens
  const syncStateFromTeacher = () => {
    setEditName(teacher.name);
    setEditTitle(teacher.title);
    setEditDepartment(teacher.department || 'Technology and Livelihood Education (TLE)');
    setEditSchool(teacher.schoolName || 'Ramon Magsaysay (Cubao) High School');
    setEditDivision(teacher.division || 'SDO Quezon City • TLE Department');
    setEditAcademicYear(teacher.academicYear || '2025-2026');

    setEditMasterTeacherName(teacher.masterTeacherName || 'Shirlene M. Mandapat');
    setEditMasterTeacherPosition(
      teacher.masterTeacherPosition || 'Master Teacher I / TLE Subject Coordinator'
    );
    setEditHeadTeacherName(teacher.headTeacherName || 'Dr. Corazon V. Santos');
    setEditHeadTeacherPosition(
      teacher.headTeacherPosition || 'Head Teacher III / TLE Department'
    );
    setEditPrincipalName(teacher.principalName || 'Dr. Maria Luisa T. Ramos');
    setEditPrincipalPosition(
      teacher.principalPosition || 'Secondary School Principal IV'
    );
    setNewPassword('');
    setSaveSuccess('');
  };

  const handleOpenModal = () => {
    syncStateFromTeacher();
    setShowProfileModal(true);
  };

  const handleResetToRMCHSDefaults = () => {
    setEditHeadTeacherName('Dr. Corazon V. Santos');
    setEditHeadTeacherPosition('Head Teacher III / TLE Department');
    setEditPrincipalName('Dr. Maria Luisa T. Ramos');
    setEditPrincipalPosition('Secondary School Principal IV');
    setEditMasterTeacherName('Shirlene M. Mandapat');
    setEditMasterTeacherPosition('Master Teacher I / TLE Subject Coordinator');
    setEditDepartment('Technology and Livelihood Education (TLE)');
    setEditSchool('Ramon Magsaysay (Cubao) High School');
    setEditDivision('SDO Quezon City • TLE Department');
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: TeacherProfile = {
      ...teacher,
      name: editName.trim() || teacher.name,
      title: editTitle.trim() || teacher.title,
      department: editDepartment.trim() || 'Technology and Livelihood Education (TLE)',
      schoolName: editSchool.trim() || 'Ramon Magsaysay (Cubao) High School',
      division: editDivision.trim() || 'SDO Quezon City • TLE Department',
      academicYear: editAcademicYear.trim() || '2025-2026',

      // Updated Signatories
      masterTeacherName: editMasterTeacherName.trim() || editName.trim(),
      masterTeacherPosition: editMasterTeacherPosition.trim() || 'Master Teacher I',
      headTeacherName: editHeadTeacherName.trim() || 'Dr. Corazon V. Santos',
      headTeacherPosition: editHeadTeacherPosition.trim() || 'Head Teacher III / TLE Department',
      principalName: editPrincipalName.trim() || 'Dr. Maria Luisa T. Ramos',
      principalPosition: editPrincipalPosition.trim() || 'Secondary School Principal IV',
    };

    if (newPassword && newPassword.length >= 4) {
      updated.passwordHash = newPassword;
      updated.isPasswordSet = true;
    }

    storage.saveTeacherProfile(updated);
    onUpdateTeacher(updated);
    setSaveSuccess('Teacher profile & official signatories updated successfully!');
    setTimeout(() => {
      setSaveSuccess('');
      setShowProfileModal(false);
    }, 1200);
  };

  return (
    <header className="bg-emerald-950 text-white sticky top-0 z-30 shadow-xl border-b border-emerald-900">
      {/* Top Gold Institutional Accent Stripe */}
      <div className="h-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 w-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-2.5 sm:py-3">
          
          {/* Official RMCHS TLE Department Logo & Header Title */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="relative group cursor-pointer transition-transform hover:scale-105">
              <SchoolLogo size="sm" className="sm:hidden" />
              <SchoolLogo size="md" className="hidden sm:block" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-extrabold text-xs sm:text-base md:text-lg tracking-wide uppercase text-yellow-300 drop-shadow-xs font-serif truncate">
                  RAMON MAGSAYSAY (CUBAO) HIGH SCHOOL
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400/25 text-amber-300 border border-amber-400/50 shadow-xs">
                  PROJECT S.M.I.L.E.
                </span>
              </div>

              {/* TLE and SMILE title on clear separate lines */}
              <div className="mt-0.5 space-y-0.5">
                <p className="text-xs sm:text-sm font-bold text-white tracking-tight">
                  Technology and Livelihood Education (TLE)
                </p>
                <p className="text-[11px] sm:text-xs text-amber-200 font-medium tracking-wide">
                  Student Monitoring and Intervention for Learning Enhancement
                </p>
              </div>

              {/* TLE 4 Strands Quick Tags */}
              <div className="hidden xl:flex items-center gap-1.5 mt-1">
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-900/90 text-emerald-200 border border-emerald-700/60">
                  <Laptop className="w-2.5 h-2.5 text-yellow-400" /> ICT
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-900/90 text-emerald-200 border border-emerald-700/60">
                  <Sprout className="w-2.5 h-2.5 text-yellow-400" /> AFA
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-900/90 text-emerald-200 border border-emerald-700/60">
                  <Utensils className="w-2.5 h-2.5 text-yellow-400" /> FCS / H.E.
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-900/90 text-emerald-200 border border-emerald-700/60">
                  <Wrench className="w-2.5 h-2.5 text-yellow-400" /> IA
                </span>
              </div>
            </div>
          </div>

          {/* Section Selector & Profile Controls */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Filter by Grade & Section */}
            <div className="hidden md:flex items-center gap-2 bg-emerald-900/80 px-3 py-1.5 rounded-xl border border-emerald-700/80 shadow-xs">
              <label htmlFor="navbar-section-select" className="text-xs text-amber-200 font-semibold whitespace-nowrap">
                Section:
              </label>
              <select
                id="navbar-section-select"
                aria-label="Filter by Class or Section"
                value={selectedSection}
                onChange={(e) => onSelectSection(e.target.value)}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer pr-1"
              >
                <option value="ALL" className="bg-emerald-950 text-white">
                  All Sections
                </option>
                {sectionsList.map((sec) => (
                  <option key={sec} value={sec} className="bg-emerald-950 text-white">
                    {sec}
                  </option>
                ))}
              </select>
            </div>

            {/* Teacher / Admin Profile & Signatories Button */}
            <button
              onClick={handleOpenModal}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-white text-xs font-semibold border transition shadow-xs cursor-pointer ${
                teacher.role === 'admin' || teacher.email === 'admin@projectsmile'
                  ? 'bg-purple-950/90 hover:bg-purple-900 border-purple-500/70 hover:border-amber-400'
                  : 'bg-emerald-900/90 hover:bg-emerald-800 border-emerald-700/80 hover:border-amber-400/60'
              }`}
              title={teacher.role === 'admin' ? "System Administrator Profile & Console" : "Edit Teacher Profile & Official Signatories"}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs shadow-xs ${
                teacher.role === 'admin' || teacher.email === 'admin@projectsmile'
                  ? 'bg-amber-400 text-purple-950'
                  : 'bg-amber-500 text-emerald-950'
              }`}>
                {teacher.name ? teacher.name.charAt(0) : 'A'}
              </div>
              <div className="text-left hidden lg:block max-w-[140px] truncate">
                <div className="flex items-center gap-1">
                  <p className="font-bold text-xs truncate leading-tight">{teacher.name}</p>
                  {(teacher.role === 'admin' || teacher.email === 'admin@projectsmile') && (
                    <span className="px-1.5 py-0.2 bg-amber-400 text-purple-950 text-[9px] font-black rounded uppercase">
                      ADMIN
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-amber-200 truncate leading-tight">{teacher.title}</p>
              </div>
              <Edit3 className="w-3.5 h-3.5 text-amber-300 ml-0.5" />
            </button>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="p-2 rounded-xl bg-emerald-900/90 hover:bg-rose-950/80 text-emerald-200 hover:text-rose-300 border border-emerald-700/80 hover:border-rose-800 transition shadow-xs cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Edit Teacher Profile & Official Signatories Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-emerald-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white text-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-emerald-100 animate-in fade-in zoom-in-95 duration-150 my-6">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-950 p-4 sm:p-5 text-white flex items-center justify-between border-b-2 border-amber-400">
              <div className="flex items-center gap-3">
                <SchoolLogo size="sm" showShadow={false} />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base sm:text-lg text-yellow-300">
                      Teacher Profile & Signatories
                    </h3>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-amber-400 text-emerald-950 rounded-full">
                      Settings
                    </span>
                  </div>
                  <p className="text-xs text-emerald-200">
                    Configure teacher information and approving signatories for all official DepEd reports
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-2 text-xs font-bold overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('signatories')}
                className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'signatories'
                    ? 'border-emerald-700 text-emerald-900 font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileSignature className="w-4 h-4 text-amber-600" />
                <span>Official Report Signatories</span>
                <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded-full font-black">
                  New
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('teacher')}
                className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'teacher'
                    ? 'border-emerald-700 text-emerald-900 font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <User className="w-4 h-4 text-emerald-700" />
                <span>Teacher & Account</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('school')}
                className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'school'
                    ? 'border-emerald-700 text-emerald-900 font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <School className="w-4 h-4 text-emerald-700" />
                <span>School & Department</span>
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {saveSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  {saveSuccess}
                </div>
              )}

              {/* TAB 1: OFFICIAL REPORT SIGNATORIES */}
              {activeTab === 'signatories' && (
                <div className="space-y-4">
                  <div className="p-3.5 bg-amber-50/70 border border-amber-300/80 rounded-xl text-xs text-amber-950 flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Official DepEd Report Signatories</p>
                      <p className="text-[11px] text-amber-900 leading-relaxed mt-0.5">
                        These signatory names and designations will automatically be populated across all printed Accomplishment Reports, Individual Student Anecdotal Records, and Parent Communication Letters.
                      </p>
                    </div>
                  </div>

                  {/* Head Teacher / TLE Department */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/90 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-emerald-700" />
                        Head Teacher / TLE Department (Noted / Recommending Approval)
                      </label>
                      <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded-md">
                        Primary Approver
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Head Teacher Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={editHeadTeacherName}
                          onChange={(e) => setEditHeadTeacherName(e.target.value)}
                          placeholder="e.g. Dr. Corazon V. Santos"
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Head Teacher Official Position / Title
                        </label>
                        <input
                          type="text"
                          required
                          value={editHeadTeacherPosition}
                          onChange={(e) => setEditHeadTeacherPosition(e.target.value)}
                          placeholder="e.g. Head Teacher III / TLE Department"
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* School Principal */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/90 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-emerald-700" />
                        School Principal / School Head (Approved By)
                      </label>
                      <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded-md">
                        School Head
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Principal Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={editPrincipalName}
                          onChange={(e) => setEditPrincipalName(e.target.value)}
                          placeholder="e.g. Dr. Maria Luisa T. Ramos"
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Principal Official Position / Title
                        </label>
                        <input
                          type="text"
                          required
                          value={editPrincipalPosition}
                          onChange={(e) => setEditPrincipalPosition(e.target.value)}
                          placeholder="e.g. Secondary School Principal IV"
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Master Teacher / Subject Coordinator */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/90 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-600" />
                        Master Teacher / Subject Coordinator (Optional Signatory)
                      </label>
                      <span className="text-[10px] text-slate-500 font-medium">
                        Curriculum Leader
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Master Teacher Full Name
                        </label>
                        <input
                          type="text"
                          value={editMasterTeacherName}
                          onChange={(e) => setEditMasterTeacherName(e.target.value)}
                          placeholder="e.g. Shirlene M. Mandapat"
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Master Teacher Designation
                        </label>
                        <input
                          type="text"
                          value={editMasterTeacherPosition}
                          onChange={(e) => setEditMasterTeacherPosition(e.target.value)}
                          placeholder="e.g. Master Teacher I / TLE Subject Coordinator"
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Reset Defaults Button */}
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleResetToRMCHSDefaults}
                      className="text-xs text-slate-600 hover:text-emerald-800 flex items-center gap-1 font-semibold transition cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                      Reset to Official RMCHS TLE Signatories
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: TEACHER & ACCOUNT */}
              {activeTab === 'teacher' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Registered DepEd Email Address
                    </label>
                    <input
                      type="text"
                      disabled
                      value={teacher.email}
                      className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 cursor-not-allowed font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Teacher Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="e.g. Shirlene M. Mandapat"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>

                  <div>
                    <TeacherPositionSelect
                      label="Position / Faculty Rank"
                      required
                      value={editTitle}
                      onChange={(val) => setEditTitle(val)}
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-200">
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <Key className="w-3.5 h-3.5 text-amber-600" />
                      Change Account Password (Optional)
                    </label>
                    <input
                      type="password"
                      placeholder="Leave blank to keep current password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Minimum 4 characters required if updating password.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 3: SCHOOL & DEPARTMENT */}
              {activeTab === 'school' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Department / Area <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editDepartment}
                      onChange={(e) => setEditDepartment(e.target.value)}
                      placeholder="e.g. Technology and Livelihood Education (TLE)"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      School Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editSchool}
                      onChange={(e) => setEditSchool(e.target.value)}
                      placeholder="e.g. Ramon Magsaysay (Cubao) High School"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Division / SDO <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={editDivision}
                        onChange={(e) => setEditDivision(e.target.value)}
                        placeholder="e.g. SDO Quezon City • TLE Department"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Academic Year <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={editAcademicYear}
                        onChange={(e) => setEditAcademicYear(e.target.value)}
                        placeholder="e.g. 2025-2026"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-4 border-t border-slate-200">
                <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                  All changes will be saved to your local profile.
                </span>
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setShowProfileModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-yellow-300 rounded-xl text-xs font-extrabold transition shadow-md border border-emerald-900 cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4 text-amber-400" />
                    Save Changes & Signatories
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
