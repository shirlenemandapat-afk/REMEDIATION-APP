import React from 'react';
import { TeacherProfile } from '../types';
import { storage } from '../services/storage';
import { AdminActiveTab } from './AdminDashboard';
import { HeadTeacherTab } from './HeadTeacherDashboard';
import { SchoolHeadTab } from './SchoolHeadDashboard';
import {
  Users,
  Calendar,
  BarChart3,
  FileCheck2,
  FolderArchive,
  Sparkles,
  Building2,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  X,
  LayoutDashboard,
  Award,
  BookOpen,
  GraduationCap,
  TrendingUp,
  Bell,
  Settings,
  Layers,
  Compass,
  Target,
  FileText,
  UserCheck,
} from 'lucide-react';

export type NavTabType =
  | 'admin-portal'
  | 'head-teacher-portal'
  | 'school-head-portal'
  | 'students'
  | 'sessions'
  | 'class-progress'
  | 'report'
  | 'archive';

interface SidebarProps {
  activeTab: NavTabType;
  onSelectTab: (tab: NavTabType) => void;
  adminSubTab?: AdminActiveTab;
  onSelectAdminSubTab?: (tab: AdminActiveTab) => void;
  headTeacherSubTab?: HeadTeacherTab;
  onSelectHeadTeacherSubTab?: (tab: HeadTeacherTab) => void;
  schoolHeadSubTab?: SchoolHeadTab;
  onSelectSchoolHeadSubTab?: (tab: SchoolHeadTab) => void;
  teacher: TeacherProfile;
  activeStudentsCount: number;
  sessionsCount: number;
  archivedCount: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  adminSubTab = 'overview',
  onSelectAdminSubTab,
  headTeacherSubTab = 'overview',
  onSelectHeadTeacherSubTab,
  schoolHeadSubTab = 'overview',
  onSelectSchoolHeadSubTab,
  teacher,
  activeStudentsCount,
  sessionsCount,
  archivedCount,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}) => {
  const isHeadTeacher = teacher?.role === 'head_teacher';
  const isSchoolHead = teacher?.role === 'school_head';
  const isAdmin = teacher?.role === 'admin' || teacher?.email === 'admin@projectsmile';

  interface SectionItem {
    id: string;
    label: string;
    icon: React.ElementType;
    badge?: number | string | null;
    badgeColor?: string;
    onClick: () => void;
    isActive: boolean;
    isSpecial?: boolean;
  }

  interface NavSection {
    title: string;
    shortTitle: string;
    icon?: React.ElementType;
    items: SectionItem[];
  }

  const sections: NavSection[] = [];

  // 1. Admin Role Section
  if (isAdmin) {
    sections.push({
      title: 'SYSTEM ADMIN CONSOLE',
      shortTitle: 'ADMIN',
      icon: Sparkles,
      items: [
        {
          id: 'admin-overview',
          label: 'Dashboard Overview',
          icon: LayoutDashboard,
          onClick: () => {
            onSelectTab('admin-portal');
            onSelectAdminSubTab?.('overview');
          },
          isActive: activeTab === 'admin-portal' && adminSubTab === 'overview',
          isSpecial: true,
        },
        {
          id: 'admin-users',
          label: 'User & Faculty Mgmt',
          icon: Users,
          onClick: () => {
            onSelectTab('admin-portal');
            onSelectAdminSubTab?.('users');
          },
          isActive: activeTab === 'admin-portal' && adminSubTab === 'users',
          isSpecial: true,
        },
        {
          id: 'admin-programs',
          label: 'Remediation Programs',
          icon: BookOpen,
          onClick: () => {
            onSelectTab('admin-portal');
            onSelectAdminSubTab?.('programs');
          },
          isActive: activeTab === 'admin-portal' && adminSubTab === 'programs',
          isSpecial: true,
        },
        {
          id: 'admin-students',
          label: 'Student Monitoring',
          icon: GraduationCap,
          onClick: () => {
            onSelectTab('admin-portal');
            onSelectAdminSubTab?.('students');
          },
          isActive: activeTab === 'admin-portal' && adminSubTab === 'students',
          isSpecial: true,
        },
        {
          id: 'admin-reports',
          label: 'Teacher Reports & MOVs',
          icon: FileCheck2,
          onClick: () => {
            onSelectTab('admin-portal');
            onSelectAdminSubTab?.('reports');
          },
          isActive: activeTab === 'admin-portal' && adminSubTab === 'reports',
          isSpecial: true,
        },
        {
          id: 'admin-analytics',
          label: 'Analytics & Reports',
          icon: TrendingUp,
          onClick: () => {
            onSelectTab('admin-portal');
            onSelectAdminSubTab?.('analytics');
          },
          isActive: activeTab === 'admin-portal' && adminSubTab === 'analytics',
          isSpecial: true,
        },
        {
          id: 'admin-announcements',
          label: 'Announcements',
          icon: Bell,
          onClick: () => {
            onSelectTab('admin-portal');
            onSelectAdminSubTab?.('announcements');
          },
          isActive: activeTab === 'admin-portal' && adminSubTab === 'announcements',
          isSpecial: true,
        },
        {
          id: 'admin-settings',
          label: 'System Settings',
          icon: Settings,
          onClick: () => {
            onSelectTab('admin-portal');
            onSelectAdminSubTab?.('settings');
          },
          isActive: activeTab === 'admin-portal' && adminSubTab === 'settings',
          isSpecial: true,
        },
      ],
    });
  }

  // 2. Head Teacher Section
  if (isHeadTeacher) {
    sections.push({
      title: 'DEPARTMENT SUPERVISORY',
      shortTitle: 'SUPERVISORY',
      icon: ShieldCheck,
      items: [
        {
          id: 'ht-overview',
          label: 'Supervisory Overview',
          icon: LayoutDashboard,
          onClick: () => {
            onSelectTab('head-teacher-portal');
            onSelectHeadTeacherSubTab?.('overview');
          },
          isActive: activeTab === 'head-teacher-portal' && headTeacherSubTab === 'overview',
          isSpecial: true,
        },
        {
          id: 'ht-teachers',
          label: 'Supervise Faculty',
          icon: Users,
          onClick: () => {
            onSelectTab('head-teacher-portal');
            onSelectHeadTeacherSubTab?.('teachers');
          },
          isActive: activeTab === 'head-teacher-portal' && headTeacherSubTab === 'teachers',
          isSpecial: true,
        },
        {
          id: 'ht-logs',
          label: 'Review Anecdotal Logs',
          icon: Calendar,
          onClick: () => {
            onSelectTab('head-teacher-portal');
            onSelectHeadTeacherSubTab?.('logs');
          },
          isActive: activeTab === 'head-teacher-portal' && headTeacherSubTab === 'logs',
          isSpecial: true,
        },
        {
          id: 'ht-movs',
          label: 'Evaluate Session MOVs',
          icon: FileCheck2,
          onClick: () => {
            onSelectTab('head-teacher-portal');
            onSelectHeadTeacherSubTab?.('movs');
          },
          isActive: activeTab === 'head-teacher-portal' && headTeacherSubTab === 'movs',
          isSpecial: true,
        },
        {
          id: 'ht-reports',
          label: 'Department Narrative Reports',
          icon: FileText,
          onClick: () => {
            onSelectTab('head-teacher-portal');
            onSelectHeadTeacherSubTab?.('reports');
          },
          isActive: activeTab === 'head-teacher-portal' && headTeacherSubTab === 'reports',
          isSpecial: true,
        },
      ],
    });
  }

  // 3. School Head Section
  if (isSchoolHead) {
    sections.push({
      title: 'SCHOOL HEAD EXECUTIVE',
      shortTitle: 'EXECUTIVE',
      icon: Building2,
      items: [
        {
          id: 'sh-overview',
          label: 'Executive Overview',
          icon: LayoutDashboard,
          onClick: () => {
            onSelectTab('school-head-portal');
            onSelectSchoolHeadSubTab?.('overview');
          },
          isActive: activeTab === 'school-head-portal' && schoolHeadSubTab === 'overview',
          isSpecial: true,
        },
        {
          id: 'sh-enrollment',
          label: 'School Enrollment',
          icon: GraduationCap,
          onClick: () => {
            onSelectTab('school-head-portal');
            onSelectSchoolHeadSubTab?.('enrollment');
          },
          isActive: activeTab === 'school-head-portal' && schoolHeadSubTab === 'enrollment',
          isSpecial: true,
        },
        {
          id: 'sh-subjects',
          label: 'Learning Areas & Subjects',
          icon: BookOpen,
          onClick: () => {
            onSelectTab('school-head-portal');
            onSelectSchoolHeadSubTab?.('subjects');
          },
          isActive: activeTab === 'school-head-portal' && schoolHeadSubTab === 'subjects',
          isSpecial: true,
        },
        {
          id: 'sh-teachers',
          label: 'Faculty Supervision',
          icon: Users,
          onClick: () => {
            onSelectTab('school-head-portal');
            onSelectSchoolHeadSubTab?.('teachers');
          },
          isActive: activeTab === 'school-head-portal' && schoolHeadSubTab === 'teachers',
          isSpecial: true,
        },
        {
          id: 'sh-sessions',
          label: 'Remediation Log Registry',
          icon: Calendar,
          onClick: () => {
            onSelectTab('school-head-portal');
            onSelectSchoolHeadSubTab?.('sessions');
          },
          isActive: activeTab === 'school-head-portal' && schoolHeadSubTab === 'sessions',
          isSpecial: true,
        },
        {
          id: 'sh-progress',
          label: 'Competency Progress',
          icon: TrendingUp,
          onClick: () => {
            onSelectTab('school-head-portal');
            onSelectSchoolHeadSubTab?.('progress');
          },
          isActive: activeTab === 'school-head-portal' && schoolHeadSubTab === 'progress',
          isSpecial: true,
        },
        {
          id: 'sh-interventions',
          label: 'High-Impact Interventions',
          icon: Target,
          onClick: () => {
            onSelectTab('school-head-portal');
            onSelectSchoolHeadSubTab?.('interventions');
          },
          isActive: activeTab === 'school-head-portal' && schoolHeadSubTab === 'interventions',
          isSpecial: true,
        },
      ],
    });
  }

  // 4. Standard Teacher Menu (Only for standard classroom teacher accounts)
  if (!isAdmin && !isHeadTeacher && !isSchoolHead) {
    sections.push({
      title: 'TEACHER DASHBOARD MENU',
      shortTitle: 'TEACHER',
      icon: Users,
      items: [
        {
          id: 'students',
          label: 'Student Roster',
          icon: Users,
          badge: activeStudentsCount,
          badgeColor: 'bg-emerald-500/30 text-emerald-300 border-emerald-400/40',
          onClick: () => onSelectTab('students'),
          isActive: activeTab === 'students',
        },
        {
          id: 'sessions',
          label: 'Daily Anecdotal Logs',
          icon: Calendar,
          badge: sessionsCount,
          badgeColor: 'bg-amber-500/30 text-amber-300 border-amber-400/40',
          onClick: () => onSelectTab('sessions'),
          isActive: activeTab === 'sessions',
        },
        {
          id: 'class-progress',
          label: 'Class Progress Graph',
          icon: BarChart3,
          onClick: () => onSelectTab('class-progress'),
          isActive: activeTab === 'class-progress',
        },
        {
          id: 'report',
          label: 'Narrative Report Generator',
          icon: FileCheck2,
          onClick: () => onSelectTab('report'),
          isActive: activeTab === 'report',
        },
        {
          id: 'archive',
          label: 'Archived Records',
          icon: FolderArchive,
          badge: archivedCount > 0 ? archivedCount : undefined,
          badgeColor: 'bg-amber-500/40 text-amber-200 border-amber-400/60',
          onClick: () => onSelectTab('archive'),
          isActive: activeTab === 'archive',
        },
      ],
    });
  }

  const handleItemClick = (item: SectionItem) => {
    item.onClick();
    if (isMobileOpen) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-emerald-950/80 backdrop-blur-xs z-40 md:hidden transition-opacity animate-in fade-in"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Content Container */}
      <aside
        className={`
          bg-emerald-950/95 backdrop-blur-md text-white border-r border-emerald-900/80 shadow-2xl flex flex-col justify-between transition-all duration-300 ease-in-out z-40
          fixed md:sticky top-[52px] sm:top-[56px] bottom-0 left-0 h-[calc(100vh-52px)] sm:h-[calc(100vh-56px)]
          ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'}
          ${isCollapsed ? 'md:w-16' : 'md:w-64'}
        `}
      >
        {/* Top Header & Toggle */}
        <div className="p-3 border-b border-emerald-900/80 flex items-center justify-between gap-2 shrink-0">
          {(!isCollapsed || isMobileOpen) && (
            <div className="flex items-center gap-2 min-w-0 px-1">
              <LayoutDashboard className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-xs font-black text-amber-300 uppercase tracking-wider truncate">
                Dashboard Menu
              </span>
            </div>
          )}

          {/* Desktop Collapse / Expand Toggle Button */}
          <button
            type="button"
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Expand Navigation Sidebar' : 'Collapse Navigation Sidebar'}
            className="hidden md:flex p-1.5 rounded-lg bg-emerald-900/80 hover:bg-emerald-800 text-amber-300 hover:text-yellow-200 border border-emerald-700/70 transition cursor-pointer mx-auto"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="md:hidden p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4 select-none custom-scrollbar">
          {sections.map((section, secIdx) => {
            const SectionHeaderIcon = section.icon;
            return (
              <div key={section.title} className="space-y-1">
                {/* Section Title Header */}
                {(!isCollapsed || isMobileOpen) ? (
                  <div className="px-3 pt-2 pb-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-amber-400/90 border-b border-emerald-900/50">
                    {SectionHeaderIcon && <SectionHeaderIcon className="w-3 h-3 text-amber-300 shrink-0" />}
                    <span className="truncate">{section.title}</span>
                  </div>
                ) : secIdx > 0 ? (
                  <div className="my-2 border-t border-emerald-900/60 mx-2" />
                ) : null}

                {/* Section Items */}
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.isActive;
                    const isSpecial = item.isSpecial;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleItemClick(item)}
                        title={isCollapsed ? `${item.label}${item.badge !== undefined && item.badge !== null ? ` (${item.badge})` : ''}` : undefined}
                        className={`
                          w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all group relative cursor-pointer
                          ${
                            isActive
                              ? isSpecial
                                ? 'bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 text-amber-300 border border-purple-500/60 shadow-lg'
                                : 'bg-gradient-to-r from-emerald-800 to-emerald-900 text-yellow-300 border border-amber-400/50 shadow-md'
                              : isSpecial
                              ? 'bg-purple-950/40 hover:bg-purple-900/60 text-purple-200 border border-purple-800/40'
                              : 'text-emerald-100/80 hover:bg-emerald-900/60 hover:text-white border border-transparent'
                          }
                          ${isCollapsed ? 'justify-center px-0 py-2' : ''}
                        `}
                      >
                        <Icon
                          className={`
                            w-4 h-4 shrink-0 transition-transform group-hover:scale-110
                            ${
                              isActive
                                ? 'text-yellow-300'
                                : isSpecial
                                ? 'text-purple-300'
                                : 'text-amber-400/90 group-hover:text-amber-300'
                            }
                          `}
                        />

                        {/* Text Label & Badge when Expanded */}
                        {(!isCollapsed || isMobileOpen) && (
                          <div className="flex items-center justify-between flex-1 min-w-0 text-left">
                            <span className="truncate leading-snug">{item.label}</span>
                            {item.badge !== undefined && item.badge !== null && (
                              <span
                                className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-black border ${
                                  item.badgeColor || 'bg-amber-400/20 text-amber-300 border-amber-400/40'
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Collapsed Indicators */}
                        {isCollapsed && !isMobileOpen && (
                          <>
                            {isActive && (
                              <span className="absolute right-1 top-1 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                            )}
                            {item.badge !== undefined && item.badge !== null && !isActive && (
                              <span className="absolute right-1 top-1 w-2 h-2 rounded-full bg-emerald-400" />
                            )}
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info in sidebar */}
        {(!isCollapsed || isMobileOpen) && (
          <div className="p-3 border-t border-emerald-900/80 text-[11px] text-emerald-300/80 shrink-0 bg-emerald-950/60">
            <div className="flex items-center gap-2">
              <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <div className="truncate">
                <p className="font-bold text-amber-200 truncate">{teacher?.name || 'Teacher'}</p>
                <p className="text-[10px] text-emerald-300/70 truncate">{teacher?.title || 'Faculty'}</p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
