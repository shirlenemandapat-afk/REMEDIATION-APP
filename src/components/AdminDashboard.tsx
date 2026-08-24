import React, { useState, useEffect } from 'react';
import {
  TeacherProfile,
  Student,
  SessionRecord,
  RemediationProgram,
  RemediationClass,
  SystemAnnouncement,
  SystemSettings,
} from '../types';
import { storage } from '../services/storage';
import { SchoolLogo } from './SchoolLogo';
import { AdminDashboardOverview } from './admin/AdminDashboardOverview';
import { AdminUserManagement } from './admin/AdminUserManagement';
import { AdminProgramManagement } from './admin/AdminProgramManagement';
import { AdminClassScheduleManagement } from './admin/AdminClassScheduleManagement';
import { AdminStudentMonitoring } from './admin/AdminStudentMonitoring';
import { AdminTeacherReports } from './admin/AdminTeacherReports';
import { AdminAnalyticsReports } from './admin/AdminAnalyticsReports';
import { AdminAnnouncementManagement } from './admin/AdminAnnouncementManagement';
import { AdminSystemSettings } from './admin/AdminSystemSettings';

import {
  LayoutDashboard,
  Users,
  BookOpen,
  CalendarCheck,
  GraduationCap,
  FileCheck2,
  TrendingUp,
  Bell,
  Settings,
  ShieldCheck,
  FileSpreadsheet,
  Printer,
  Sparkles,
} from 'lucide-react';

export type AdminActiveTab =
  | 'overview'
  | 'users'
  | 'programs'
  | 'classes'
  | 'students'
  | 'reports'
  | 'analytics'
  | 'announcements'
  | 'settings';

interface AdminDashboardProps {
  currentAdmin: TeacherProfile;
  students: Student[];
  sessions: SessionRecord[];
  onRefreshData: () => void;
  onSelectStudent?: (student: Student) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentAdmin,
  students,
  sessions,
  onRefreshData,
  onSelectStudent,
}) => {
  const [activeTab, setActiveTab] = useState<AdminActiveTab>('overview');

  // Local state for loaded entities
  const [teachers, setTeachers] = useState<TeacherProfile[]>(() => storage.getAllTeachers());
  const [programs, setPrograms] = useState<RemediationProgram[]>(() => storage.getPrograms());
  const [classes, setClasses] = useState<RemediationClass[]>(() => storage.getRemediationClasses());
  const [announcements, setAnnouncements] = useState<SystemAnnouncement[]>(() => storage.getAnnouncements());
  const [settings, setSettings] = useState<SystemSettings>(() => storage.getSettings());
  const [auditLogs, setAuditLogs] = useState(() => storage.getAuditLogs());

  const handleRefreshAll = () => {
    setTeachers(storage.getAllTeachers());
    setPrograms(storage.getPrograms());
    setClasses(storage.getRemediationClasses());
    setAnnouncements(storage.getAnnouncements());
    setSettings(storage.getSettings());
    setAuditLogs(storage.getAuditLogs());
    onRefreshData();
  };

  useEffect(() => {
    handleRefreshAll();
  }, []);

  const navItems = [
    { id: 'overview' as AdminActiveTab, label: 'Dashboard Overview', icon: LayoutDashboard, badge: null },
    { id: 'users' as AdminActiveTab, label: 'User & Faculty Management', icon: Users, badge: teachers.length },
    { id: 'programs' as AdminActiveTab, label: 'Remediation Programs', icon: BookOpen, badge: programs.length },
    { id: 'classes' as AdminActiveTab, label: 'Class & Schedule', icon: CalendarCheck, badge: classes.length },
    { id: 'students' as AdminActiveTab, label: 'Student Progress Monitoring', icon: GraduationCap, badge: null },
    { id: 'reports' as AdminActiveTab, label: 'Teacher Reports & MOVs', icon: FileCheck2, badge: null },
    { id: 'analytics' as AdminActiveTab, label: 'Analytics & Reports', icon: TrendingUp, badge: null },
    { id: 'announcements' as AdminActiveTab, label: 'Announcements', icon: Bell, badge: announcements.length },
    { id: 'settings' as AdminActiveTab, label: 'System Settings', icon: Settings, badge: null },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & DepEd Header */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-950 text-white rounded-3xl p-6 sm:p-7 shadow-xl border-2 border-emerald-800/80 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-emerald-900/90 rounded-2xl border border-amber-400/40 shadow-md shrink-0">
              <SchoolLogo size="md" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-400 text-emerald-950 shadow-xs uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-950" />
                  ADMINISTRATIVE EXECUTIVE CONSOLE
                </span>
                <span className="text-xs text-amber-200 font-semibold">
                  SDO Quezon City • DepEd NCR
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white font-serif mt-1 tracking-tight">
                RMCHS PROJECT S.M.I.L.E. REMEDIATION MANAGEMENT
              </h1>
              <p className="text-xs sm:text-sm text-emerald-200 mt-0.5">
                Central Administration: Users, Remediation Programs, Schedules, Progress Monitoring & DepEd Reports
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTab('analytics')}
              className="px-4 py-2.5 bg-white hover:bg-slate-100 text-emerald-950 font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-sm border border-slate-200 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              VIEW ANALYTICS
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-emerald-950 font-extrabold rounded-xl text-xs transition flex items-center gap-2 shadow-md border border-amber-300 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-emerald-950" />
              PRINT DOSSIER
            </button>
          </div>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="bg-white rounded-2xl p-1.5 border border-slate-200 shadow-sm flex items-center gap-1.5 overflow-x-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-emerald-900 text-yellow-300 shadow-md border border-emerald-800 ring-1 ring-emerald-700'
                  : 'text-slate-600 hover:bg-emerald-50/80 hover:text-emerald-900'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-yellow-300' : 'text-slate-400'}`} />
              <span>{item.label}</span>
              {item.badge !== null && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-emerald-800 text-yellow-200' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content Panels */}
      <div>
        {activeTab === 'overview' && (
          <AdminDashboardOverview
            currentAdmin={currentAdmin}
            students={students}
            sessions={sessions}
            programs={programs}
            classes={classes}
            teachers={teachers}
            announcements={announcements}
            auditLogs={auditLogs}
            onNavigateTab={(tab) => setActiveTab(tab as AdminActiveTab)}
            onNavigate={(tab) => setActiveTab(tab as AdminActiveTab)}
            onSelectStudent={onSelectStudent}
          />
        )}

        {activeTab === 'users' && (
          <AdminUserManagement
            currentAdmin={currentAdmin}
            teachers={teachers}
            onRefresh={handleRefreshAll}
          />
        )}

        {activeTab === 'programs' && (
          <AdminProgramManagement
            currentAdmin={currentAdmin}
            programs={programs}
            teachers={teachers}
            onRefresh={handleRefreshAll}
          />
        )}

        {activeTab === 'classes' && (
          <AdminClassScheduleManagement
            currentAdmin={currentAdmin}
            classes={classes}
            programs={programs}
            teachers={teachers}
            students={students}
            onRefresh={handleRefreshAll}
          />
        )}

        {activeTab === 'students' && (
          <AdminStudentMonitoring
            students={students}
            sessions={sessions}
            onSelectStudent={onSelectStudent}
          />
        )}

        {activeTab === 'reports' && (
          <AdminTeacherReports
            currentAdmin={currentAdmin}
            teachers={teachers}
            sessions={sessions}
            students={students}
            onRefresh={handleRefreshAll}
          />
        )}

        {activeTab === 'analytics' && (
          <AdminAnalyticsReports
            students={students}
            sessions={sessions}
            programs={programs}
            teachers={teachers}
          />
        )}

        {activeTab === 'announcements' && (
          <AdminAnnouncementManagement
            currentAdmin={currentAdmin}
            announcements={announcements}
            onRefresh={handleRefreshAll}
          />
        )}

        {activeTab === 'settings' && (
          <AdminSystemSettings
            currentAdmin={currentAdmin}
            settings={settings}
            onRefresh={handleRefreshAll}
          />
        )}
      </div>
    </div>
  );
};
