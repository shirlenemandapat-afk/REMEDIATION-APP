import React, { useState } from 'react';
import { SystemSettings, TeacherProfile, LEARNING_AREAS, AdminAuditLog } from '../../types';
import { storage } from '../../services/storage';
import {
  Settings,
  Sliders,
  Database,
  Save,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Building,
  Calendar,
  Layers,
  ShieldAlert,
  KeyRound,
  History,
  Search,
  FileSpreadsheet,
  Lock,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

interface AdminSystemSettingsProps {
  currentAdmin: TeacherProfile;
  settings: SystemSettings;
  onRefresh: () => void;
}

export const AdminSystemSettings: React.FC<AdminSystemSettingsProps> = ({
  currentAdmin,
  settings,
  onRefresh,
}) => {
  const safeSettings = settings || storage.getSettings();
  const [academicYear, setAcademicYear] = useState(safeSettings?.academicYear || safeSettings?.schoolYear || '2025-2026');
  const [currentQuarter, setCurrentQuarter] = useState(safeSettings?.currentQuarter || 'Quarter 1');
  const [passingScoreThreshold, setPassingScoreThreshold] = useState(
    safeSettings?.passingScoreThreshold || 75
  );
  const [schoolName, setSchoolName] = useState(
    safeSettings?.schoolName || 'Ramon Magsaysay (Cubao) High School'
  );
  const [division, setDivision] = useState(
    safeSettings?.division || 'SDO Quezon City • TLE Department'
  );
  const [region, setRegion] = useState(
    safeSettings?.region || 'National Capital Region (NCR)'
  );
  const [departmentName, setDepartmentName] = useState(
    safeSettings?.departmentName || safeSettings?.department || 'Technology and Livelihood Education (TLE)'
  );

  // Security / Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Audit Logs State
  const [auditSearch, setAuditSearch] = useState('');
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>(() => storage.getAuditLogs());

  const [feedback, setFeedback] = useState<string | null>(null);
  const [restoreFeedback, setRestoreFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    storage.saveSettings(currentAdmin.email, {
      academicYear,
      currentQuarter,
      passingScoreThreshold: Number(passingScoreThreshold),
      schoolName,
      division,
      region,
      departmentName,
      activeLearningAreas: settings.activeLearningAreas || [...LEARNING_AREAS],
    });

    setFeedback('System configuration saved successfully!');
    setAuditLogs(storage.getAuditLogs());
    onRefresh();
    setTimeout(() => setFeedback(null), 2500);
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 4) {
      setPasswordFeedback({ type: 'error', message: 'Password must be at least 4 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ type: 'error', message: 'New passwords do not match.' });
      return;
    }

    const res = storage.adminResetTeacherPassword(currentAdmin.email, currentAdmin.email, newPassword);
    if (res.success) {
      setPasswordFeedback({ type: 'success', message: 'Admin security password updated successfully.' });
      setNewPassword('');
      setConfirmPassword('');
      setAuditLogs(storage.getAuditLogs());
      setTimeout(() => setPasswordFeedback(null), 3000);
    } else {
      setPasswordFeedback({ type: 'error', message: res.message });
    }
  };

  // Export Full Database Backup
  const handleExportBackup = () => {
    const backupJson = storage.exportDatabaseBackup();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(backupJson);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `deped_tle_database_backup_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Export Audit Logs as CSV
  const handleExportAuditLogsCSV = () => {
    const headers = ['ID', 'Date & Time', 'User', 'Action', 'Target', 'Details'];
    const rows = auditLogs.map((l) => [
      `"${l.id}"`,
      `"${l.timestamp}"`,
      `"${l.userEmail}"`,
      `"${l.action}"`,
      `"${l.targetId || ''}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `system_audit_trail_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Import / Restore Database
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const parsed = event.target?.result as string;
          const res = storage.restoreDatabaseBackup(currentAdmin.email, parsed);
          if (res.success) {
            setRestoreFeedback({ type: 'success', message: res.message });
            setAuditLogs(storage.getAuditLogs());
            onRefresh();
          } else {
            setRestoreFeedback({ type: 'error', message: res.message });
          }
        } catch (err: any) {
          setRestoreFeedback({ type: 'error', message: 'Failed to read backup file: ' + err.message });
        }
      };
    }
  };

  // Factory Reset
  const handleFactoryReset = () => {
    if (
      confirm(
        'WARNING: This will reset all students, logs, and remediation classes to the initial sample seed data. Are you sure?'
      )
    ) {
      storage.factoryReset(currentAdmin.email);
      setAuditLogs(storage.getAuditLogs());
      onRefresh();
      alert('System restored to default sample state.');
    }
  };

  const filteredLogs = (auditLogs || []).filter((l) => {
    if (!auditSearch.trim()) return true;
    const q = auditSearch.toLowerCase();
    return (
      (l.userEmail || '').toLowerCase().includes(q) ||
      (l.action || '').toLowerCase().includes(q) ||
      (l.details || '').toLowerCase().includes(q) ||
      (l.timestamp || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
        <div>
          <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-700" />
            System Configuration & Institution Settings
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure school metadata, academic periods, passing thresholds, security credentials, and audit logs.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Settings Form */}
        <div className="lg:col-span-8 space-y-6">
          <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-6 text-xs">
            {/* Academic Year & Quarter */}
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
                <Calendar className="w-4 h-4 text-emerald-700" />
                Academic Term & Grading Period
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Academic Year</label>
                  <input
                    type="text"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    placeholder="e.g. 2025-2026"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Active Grading Period / Quarter</label>
                  <select
                    value={currentQuarter}
                    onChange={(e) => setCurrentQuarter(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="Quarter 1">Quarter 1</option>
                    <option value="Quarter 2">Quarter 2</option>
                    <option value="Quarter 3">Quarter 3</option>
                    <option value="Quarter 4">Quarter 4</option>
                    <option value="Summer Remediation">Summer Remediation Term</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  DepEd Passing & Mastery Threshold (%)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={50}
                    max={100}
                    value={passingScoreThreshold}
                    onChange={(e) => setPassingScoreThreshold(Number(e.target.value))}
                    className="w-32 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <span className="text-slate-500 text-xs">
                    Scores &ge; {passingScoreThreshold}% are marked as Mastered / Passing in compliance with DepEd Order No. 8, s. 2015.
                  </span>
                </div>
              </div>
            </div>

            {/* School & Division Information */}
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
                <Building className="w-4 h-4 text-blue-700" />
                DepEd School & Division Profile
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">School Name</label>
                  <input
                    type="text"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={departmentName}
                    onChange={(e) => setDepartmentName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Schools Division Office</label>
                  <input
                    type="text"
                    value={division}
                    onChange={(e) => setDivision(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Region</label>
                  <input
                    type="text"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Active Learning Areas Info */}
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
                <Layers className="w-4 h-4 text-purple-700" />
                Active TLE Learning Area Streams (6 Tracks)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {LEARNING_AREAS.map((area) => (
                  <div
                    key={area}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{area}</span>
                  </div>
                ))}
              </div>
            </div>

            {feedback && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{feedback}</span>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold rounded-xl transition shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4 text-yellow-300" />
                Save System Settings
              </button>
            </div>
          </form>

          {/* Security & Password Management Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-4 text-xs">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
              <Lock className="w-4 h-4 text-amber-600" />
              Administrator Account Security & Credentials
            </h3>
            <p className="text-slate-600">
              Update your master administrator login password for <span className="font-mono font-bold text-slate-900">{currentAdmin.email}</span>.
            </p>

            <form onSubmit={handleUpdatePassword} className="space-y-4 pt-1 max-w-lg">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 4 characters"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type new password"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {passwordFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                    passwordFeedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {passwordFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{passwordFeedback.message}</span>
                </div>
              )}

              <button
                type="submit"
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-extrabold rounded-xl transition flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <KeyRound className="w-4 h-4 text-amber-400" />
                UPDATE ADMIN PASSWORD
              </button>
            </form>
          </div>
        </div>

        {/* Database Backup, Roles & Maintenance Panel */}
        <div className="lg:col-span-4 space-y-6">
          {/* Role Permissions Matrix */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-4 text-xs">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              Role & Permissions Matrix
            </h3>
            <div className="space-y-2.5">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-900 block">Admin</span>
                <span className="text-[11px] text-slate-600">Full platform governance, settings, faculty credentials & audit trails.</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-900 block">School Head</span>
                <span className="text-[11px] text-slate-600">Executive inspection of teacher reports, institutional analytics & sign-offs.</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-900 block">Remediation Coordinator</span>
                <span className="text-[11px] text-slate-600">Manage remediation programs, schedules, teacher assignments & curriculum.</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-900 block">Teacher</span>
                <span className="text-[11px] text-slate-600">Manage assigned remedial learners, session logs, MOVs & grade cards.</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-900 block">Student</span>
                <span className="text-[11px] text-slate-600">View schedules, activities, learning materials & personal progress.</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-5 text-xs">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
              <Database className="w-4 h-4 text-blue-700" />
              Database Backup & Restore
            </h3>

            <div className="space-y-2">
              <p className="text-slate-600 leading-relaxed">
                Export full local application state (faculty, students, remediation sessions, programs, classes, and MOVs) into a portable JSON snapshot.
              </p>
              <button
                type="button"
                onClick={handleExportBackup}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white font-extrabold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <Download className="w-4 h-4 text-yellow-300" />
                DOWNLOAD DATABASE SNAPSHOT (JSON)
              </button>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-2">
              <span className="font-bold text-slate-800 block">Restore Database from Backup File</span>
              <p className="text-slate-500 text-[11px]">
                Select a previously downloaded <code className="font-mono text-slate-700">.json</code> snapshot to restore records.
              </p>
              <label className="w-full py-2.5 px-4 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 font-extrabold rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer">
                <Upload className="w-4 h-4 text-blue-700" />
                UPLOAD BACKUP SNAPSHOT
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {restoreFeedback && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  restoreFeedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {restoreFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{restoreFeedback.message}</span>
              </div>
            )}
          </div>

          {/* Reset System Panel */}
          <div className="bg-rose-50/50 p-6 rounded-2xl border border-rose-200/90 shadow-sm space-y-3 text-xs">
            <h4 className="text-sm font-extrabold text-rose-950 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              Reset to Factory Seed
            </h4>
            <p className="text-rose-800 text-[11px] leading-relaxed">
              Reset database to initial baseline test data. Use only for demo testing or clearing corrupt temporary data.
            </p>
            <button
              type="button"
              onClick={handleFactoryReset}
              className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              RESET DATABASE TO SAMPLE SEED
            </button>
          </div>
        </div>
      </div>

      {/* Comprehensive Audit Trail Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5 text-purple-700" />
              System Activity & Audit Trail (DepEd Compliance)
            </h3>
            <p className="text-xs text-slate-500">
              Immutable chronological record of administrator logins, faculty registration, report submissions, and curriculum updates.
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search audit trail..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <button
              type="button"
              onClick={handleExportAuditLogsCSV}
              className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 font-bold rounded-xl text-xs transition flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-purple-700" />
              EXPORT CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold">
              <tr>
                <th className="py-2.5 px-3">Date & Timestamp</th>
                <th className="py-2.5 px-3">User</th>
                <th className="py-2.5 px-3">Action Type</th>
                <th className="py-2.5 px-3">Activity Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-800 whitespace-nowrap">
                    {log.userEmail}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span className="inline-block px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {log.action.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 leading-relaxed">
                    {log.details}
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-slate-400">
                    No matching audit records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
