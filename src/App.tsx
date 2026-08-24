import React, { useState, useEffect } from 'react';
import { TeacherProfile, Student, SessionRecord } from './types';
import { storage } from './services/storage';
import { supabaseService, isSupabaseConfigured, getSupabaseConfig } from './services/supabase';
import { AuthScreen } from './components/AuthScreen';
import { Navbar } from './components/Navbar';
import { StudentList } from './components/StudentList';
import { SessionLogList } from './components/SessionLogList';
import { ClassProgressDashboard } from './components/ClassProgressDashboard';
import { NarrativeReportGenerator } from './components/NarrativeReportGenerator';
import { ArchiveManagement } from './components/ArchiveManagement';
import { AdminDashboard } from './components/AdminDashboard';
import { EnrollStudentModal } from './components/EnrollStudentModal';
import { AddSessionModal } from './components/AddSessionModal';
import { StudentDetailModal } from './components/StudentDetailModal';
import { MOVViewerModal } from './components/MOVViewerModal';
import { ParentCommunicationLetterModal } from './components/ParentCommunicationLetterModal';
import { IndividualAnecdotalReportModal } from './components/IndividualAnecdotalReportModal';
import { SupabaseDatabaseModal } from './components/SupabaseDatabaseModal';
import { ConfirmModal, ConfirmActionType } from './components/ConfirmModal';
import { SchoolLogo } from './components/SchoolLogo';
import { RMCHSHeaderBanner } from './components/RMCHSHeaderBanner';
import {
  Users,
  Calendar,
  BarChart3,
  FileCheck2,
  UserPlus,
  PlusCircle,
  Sparkles,
  Flame,
  Award,
  FolderArchive,
  Archive,
  CheckCircle,
  X,
  ShieldAlert,
} from 'lucide-react';

interface ConfirmConfig {
  isOpen: boolean;
  type: ConfirmActionType;
  title: string;
  message: string;
  itemName?: string;
  itemDetails?: string;
  confirmLabel?: string;
  confirmVariant?: 'danger' | 'warning' | 'primary' | 'success';
  onConfirm: () => void;
  onAlternativeAction?: () => void;
  alternativeActionLabel?: string;
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [teacher, setTeacher] = useState<TeacherProfile>(storage.getTeacherProfile());
  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);

  // Navigation & Filtering State
  const [activeTab, setActiveTab] = useState<
    'admin-portal' | 'students' | 'sessions' | 'class-progress' | 'report' | 'archive'
  >(() => (storage.getTeacherProfile().role === 'admin' ? 'admin-portal' : 'students'));
  const [selectedSection, setSelectedSection] = useState<string>('ALL');

  // Modal Controls
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState<boolean>(false);
  const [isAddSessionModalOpen, setIsAddSessionModalOpen] = useState<boolean>(false);
  const [addSessionStudentId, setAddSessionStudentId] = useState<string | undefined>(undefined);
  const [viewStudent, setViewStudent] = useState<Student | null>(null);
  const [viewMovUrl, setViewMovUrl] = useState<{ url: string; title: string } | null>(null);
  const [parentLetterStudent, setParentLetterStudent] = useState<Student | null>(null);
  const [anecdotalReportStudent, setAnecdotalReportStudent] = useState<Student | null>(null);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState<boolean>(false);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // In-App Confirmation Modal State (replaces blocked window.confirm)
  const [confirmConfig, setConfirmConfig] = useState<ConfirmConfig>({
    isOpen: false,
    type: 'delete_student',
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Load initial state on boot + Supabase sync if credentials exist in environment
  useEffect(() => {
    const loggedIn = storage.isLoggedIn();
    setIsLoggedIn(loggedIn);
    if (loggedIn) {
      const localTeacher = storage.getTeacherProfile();
      const localStudents = storage.getStudents();
      const localSessions = storage.getSessions();
      setTeacher(localTeacher);
      setStudents(localStudents);
      setSessions(localSessions);

      // If Supabase is configured in environment, sync cloud data
      if (isSupabaseConfigured()) {
        const config = getSupabaseConfig();
        if (config.autoSync) {
          supabaseService.fetchAll().then((cloudData) => {
            if (cloudData) {
              if (cloudData.students && cloudData.students.length > 0) {
                // Cloud has data -> update local state
                setStudents(cloudData.students);
                storage.saveStudents(cloudData.students);
                if (cloudData.sessions) {
                  setSessions(cloudData.sessions);
                  storage.saveSessions(cloudData.sessions);
                }
                if (cloudData.teacher) {
                  setTeacher(cloudData.teacher);
                  storage.saveTeacherProfile(cloudData.teacher);
                }
              } else if (localStudents.length > 0) {
                // Cloud is empty -> auto-populate Supabase with existing local roster
                console.log('Populating empty Supabase tables with local records...');
                supabaseService.pushAll(localTeacher, localStudents, localSessions);
              }
            }
          }).catch((err) => {
            console.warn('Silent cloud sync initial check:', err);
          });
        }
      }
    }
  }, []);

  const refreshData = () => {
    setTeacher(storage.getTeacherProfile());
    setStudents(storage.getStudents());
    setSessions(storage.getSessions());
  };

  const handleLoginSuccess = (profile: TeacherProfile) => {
    const localStudents = storage.getStudents();
    const localSessions = storage.getSessions();
    setTeacher(profile);
    setStudents(localStudents);
    setSessions(localSessions);
    setIsLoggedIn(true);

    if (profile.role === 'admin' || profile.email === 'admin@projectsmile') {
      setActiveTab('admin-portal');
    } else {
      setActiveTab('students');
    }

    if (isSupabaseConfigured()) {
      supabaseService.upsertTeacher(profile);
      supabaseService.fetchAll().then((cloudData) => {
        if (cloudData) {
          if (cloudData.students && cloudData.students.length > 0) {
            setStudents(cloudData.students);
            storage.saveStudents(cloudData.students);
            if (cloudData.sessions) {
              setSessions(cloudData.sessions);
              storage.saveSessions(cloudData.sessions);
            }
            if (cloudData.teacher) {
              setTeacher(cloudData.teacher);
              storage.saveTeacherProfile(cloudData.teacher);
            }
          } else if (localStudents.length > 0) {
            console.log('Pushing local data to freshly connected Supabase on login...');
            supabaseService.pushAll(profile, localStudents, localSessions);
          }
        }
      }).catch((e) => console.warn('Supabase cloud fetch on login:', e));
    }
  };

  const handleUpdateTeacher = (updated: TeacherProfile) => {
    setTeacher(updated);
    storage.saveTeacherProfile(updated);
    if (isSupabaseConfigured()) {
      supabaseService.upsertTeacher(updated);
    }
  };

  const handleLogout = () => {
    storage.logout();
    setIsLoggedIn(false);
  };

  // Enrolled Students Sections list
  const sectionsList = Array.from(
    new Set(students.map((s) => s.section).filter(Boolean))
  );

  // Student Enrollment
  const handleEnrollStudent = (
    studentData: Omit<Student, 'id' | 'enrolledDate' | 'status'>
  ) => {
    const newStudent = storage.addStudent(studentData);
    if (isSupabaseConfigured()) {
      supabaseService.upsertStudent(newStudent);
    }
    refreshData();
    setParentLetterStudent(newStudent);
  };

  // Student Deletion Execution
  const handleDeleteStudent = (studentId: string) => {
    storage.deleteStudent(studentId);
    if (isSupabaseConfigured()) {
      supabaseService.deleteStudent(studentId);
    }
    refreshData();
    if (viewStudent && viewStudent.id === studentId) {
      setViewStudent(null);
    }
  };

  // Delete All Archived Records
  const handleDeleteAllArchived = () => {
    storage.deleteAllArchived();
    refreshData();
    if (viewStudent && viewStudent.isArchived) {
      setViewStudent(null);
    }
  };

  // Student Deletion with In-App Confirmation Dialog
  const handleRequestDeleteStudent = (student: Student) => {
    setConfirmConfig({
      isOpen: true,
      type: 'delete_student',
      title: 'Permanently Delete Student',
      message: `Are you sure you want to permanently delete ${student.firstName} ${student.lastName}? This will permanently remove their enrollment profile and all associated session logs.`,
      itemName: `${student.lastName}, ${student.firstName} ${student.middleInitial}`,
      itemDetails: `${student.gradeLevel} - ${student.section} • ${student.subject}`,
      confirmLabel: 'Delete Permanently',
      confirmVariant: 'danger',
      alternativeActionLabel: student.isArchived ? undefined : 'Archive Student Instead',
      onAlternativeAction: student.isArchived ? undefined : () => handleRequestArchiveStudent(student),
      onConfirm: () => {
        handleDeleteStudent(student.id);
      },
    });
  };

  // Student Archive
  const handleRequestArchiveStudent = (student: Student) => {
    setConfirmConfig({
      isOpen: true,
      type: 'archive_student',
      title: 'Archive Student Record',
      message: `Archive ${student.firstName} ${student.lastName}? The student will be removed from the active roster but their records, scores, and photos will be preserved in the Archive section.`,
      itemName: `${student.lastName}, ${student.firstName} ${student.middleInitial}`,
      itemDetails: `${student.gradeLevel} - ${student.section} (${student.subject})`,
      confirmLabel: 'Archive Student',
      confirmVariant: 'warning',
      onConfirm: () => {
        storage.archiveStudent(student.id);
        if (isSupabaseConfigured()) {
          const updatedStudent = storage.getStudents().find((s) => s.id === student.id);
          if (updatedStudent) supabaseService.upsertStudent(updatedStudent);
        }
        refreshData();
        if (viewStudent && viewStudent.id === student.id) {
          setViewStudent(null);
        }
      },
    });
  };

  // Student Unarchive
  const handleRequestUnarchiveStudent = (studentId: string) => {
    storage.unarchiveStudent(studentId);
    if (isSupabaseConfigured()) {
      const updatedStudent = storage.getStudents().find((s) => s.id === studentId);
      if (updatedStudent) supabaseService.upsertStudent(updatedStudent);
    }
    refreshData();
  };

  // Section Level Handlers
  const handleArchiveSection = (sectionName: string) => {
    storage.archiveSection(sectionName);
    refreshData();
  };

  const handleUnarchiveSection = (sectionName: string) => {
    storage.unarchiveSection(sectionName);
    refreshData();
  };

  const handleDeleteSection = (sectionName: string) => {
    storage.deleteSection(sectionName);
    refreshData();
  };

  // Session CRUD
  const handleAddSession = (sessionData: Omit<SessionRecord, 'id' | 'createdAt'>) => {
    const saved = storage.addSession(sessionData);
    if (isSupabaseConfigured()) {
      supabaseService.upsertSession(saved);
    }
    refreshData();
    showToast(`Daily session log saved for ${sessionData.studentName} (${sessionData.score}% Mastery)!`, 'success');
    if (viewStudent && viewStudent.id === sessionData.studentId) {
      const updated = storage.getStudents().find((s) => s.id === sessionData.studentId);
      if (updated) setViewStudent(updated);
    }
  };

  const handleRequestDeleteSession = (sessionId: string) => {
    const targetSession = sessions.find((s) => s.id === sessionId);
    setConfirmConfig({
      isOpen: true,
      type: 'delete_session',
      title: 'Delete Daily Session Log',
      message: 'Are you sure you want to delete this anecdotal session log entry?',
      itemName: targetSession ? `${targetSession.studentName} — ${targetSession.date}` : undefined,
      itemDetails: targetSession ? `Score: ${targetSession.score}% (${targetSession.focusCompetency || 'Competency'})` : undefined,
      confirmLabel: 'Delete Session',
      confirmVariant: 'danger',
      onConfirm: () => {
        storage.deleteSession(sessionId);
        if (isSupabaseConfigured()) {
          supabaseService.deleteSession(sessionId);
        }
        refreshData();
      },
    });
  };

  // If not logged in, render AuthScreen
  if (!isLoggedIn) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // Active vs Archived counts
  const activeStudents = students.filter((s) => !s.isArchived);
  const archivedStudents = students.filter((s) => s.isArchived);

  // Quick summary counts for active students
  const totalMastered = activeStudents.filter((s) => s.status === 'Mastered / Promoted').length;
  const totalProgressing = activeStudents.filter((s) => s.status === 'Progressing').length;
  const totalNeedsHelp = activeStudents.filter((s) => s.status === 'Needs Remediation').length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 via-slate-50 to-slate-100 text-slate-900 font-sans antialiased flex flex-col selection:bg-amber-400 selection:text-emerald-950">
      {/* Institutional Top Navbar with RMCHS TLE Header */}
      <Navbar
        teacher={teacher}
        onUpdateTeacher={handleUpdateTeacher}
        onLogout={handleLogout}
        selectedSection={selectedSection}
        onSelectSection={setSelectedSection}
        sectionsList={sectionsList}
      />

      {/* Main Dashboard Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Upper Portion of Dashboard: Official RMCHS TLE Department Banner */}
        <div className="w-full">
          <RMCHSHeaderBanner showSubtitle={true} />
        </div>

        {/* Department Welcome & Action Banner with RMCHS Green & Gold Theme (For Classroom Teacher views) */}
        {teacher.role !== 'admin' && teacher.email !== 'admin@projectsmile' && (
          <div className="relative overflow-hidden bg-gradient-to-r from-emerald-950 via-emerald-900 to-green-950 rounded-2xl p-6 text-white shadow-xl border border-emerald-800/80">
            {/* Subtle background glow & watermark seal */}
            <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none translate-x-12 -translate-y-4 overflow-hidden flex items-center">
              <SchoolLogo size="xl" showShadow={false} />
            </div>

            <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                {/* Project S.M.I.L.E. Institutional Tag with acronym meaning placed directly under */}
                <div className="flex flex-col items-start gap-1">
                  <div className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-black text-amber-300 uppercase tracking-widest bg-amber-400/25 border border-amber-400/40 shadow-xs">
                    PROJECT S.M.I.L.E.
                  </div>
                  <div className="text-xs text-amber-200/90 font-semibold tracking-wide">
                    Student Monitoring and Intervention for Learning Enhancement
                  </div>
                </div>

                <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
                  <span>Welcome,</span>
                  <span className="text-yellow-300 underline decoration-amber-400/60 decoration-2 underline-offset-4">
                    {teacher.name}
                  </span>
                </h1>

                <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
                  Project S.M.I.L.E. provides daily anecdotal logs, remediation tracking, and skills enhancement monitoring across <strong>ICT</strong> (Information & Communications Technology), <strong>AFA</strong> (Agri-Fishery Arts), <strong>FCS / H.E.</strong> (Family & Consumer Sciences), and <strong>IA</strong> (Industrial Arts).
                </p>

                {/* Quick status pill counters */}
                <div className="pt-2 flex items-center gap-2.5 flex-wrap text-xs font-semibold">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-900/90 border border-emerald-700/80 text-emerald-200">
                    Active Roster: <strong className="text-white ml-1">{activeStudents.length}</strong>
                  </span>
                  {archivedStudents.length > 0 && (
                    <span className="px-2.5 py-1 rounded-lg bg-amber-900/80 border border-amber-500/80 text-amber-200">
                      Archived: <strong className="text-amber-300 ml-1">{archivedStudents.length}</strong>
                    </span>
                  )}
                  <span className="px-2.5 py-1 rounded-lg bg-amber-950/80 border border-amber-600/60 text-amber-200">
                    Needs Remediation: <strong className="text-amber-300 ml-1">{totalNeedsHelp}</strong>
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-green-950/80 border border-green-600/60 text-green-200">
                    Mastered / Promoted: <strong className="text-green-300 ml-1">{totalMastered}</strong>
                  </span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2.5 flex-wrap shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEnrollModalOpen(true)}
                  className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-emerald-950 font-extrabold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-amber-900/40 border border-amber-300/60 active:scale-95 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4 text-emerald-950" />
                  ENROLL STUDENT
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAddSessionStudentId(undefined);
                    setIsAddSessionModalOpen(true);
                  }}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-emerald-950/40 border border-emerald-400/40 active:scale-95 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4 text-yellow-300" />
                  ADD SESSION LOG
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs Styled with Green & Gold Accents (For Classroom Teacher views) */}
        {teacher.role !== 'admin' && teacher.email !== 'admin@projectsmile' && (
          <div className="bg-white rounded-2xl p-1.5 border border-emerald-100 shadow-sm flex items-center gap-1.5 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('students')}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'students'
                  ? 'bg-emerald-800 text-yellow-300 shadow-md border border-emerald-700'
                  : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-900'
              }`}
            >
              <Users className="w-4 h-4 text-amber-400" />
              STUDENT ROSTER ({activeStudents.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('sessions')}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'sessions'
                  ? 'bg-emerald-800 text-yellow-300 shadow-md border border-emerald-700'
                  : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-900'
              }`}
            >
              <Calendar className="w-4 h-4 text-amber-400" />
              DAILY ANECDOTAL LOGS ({sessions.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('class-progress')}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'class-progress'
                  ? 'bg-emerald-800 text-yellow-300 shadow-md border border-emerald-700'
                  : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-900'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-amber-400" />
              CLASS PROGRESS GRAPH
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('report')}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'report'
                  ? 'bg-emerald-900 text-amber-300 shadow-md border border-amber-400/50'
                  : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-900'
              }`}
            >
              <FileCheck2 className="w-4 h-4 text-amber-400" />
              NARRATIVE REPORT GENERATOR
            </button>

            {/* Dedicated Archive Section Tab */}
            <button
              type="button"
              onClick={() => setActiveTab('archive')}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'archive'
                  ? 'bg-amber-600 text-white shadow-md border border-amber-700'
                  : 'text-amber-900 bg-amber-50/70 hover:bg-amber-100'
              }`}
            >
              <FolderArchive className="w-4 h-4 text-amber-600" />
              ARCHIVED RECORDS & SECTIONS
              {archivedStudents.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-amber-700 text-white font-black">
                  {archivedStudents.length}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Tab Content Views */}
        {activeTab === 'admin-portal' && (
          <AdminDashboard
            currentAdmin={teacher}
            students={students}
            sessions={sessions}
            onRefreshData={refreshData}
            onSelectStudent={(stud) => setViewStudent(stud)}
          />
        )}

        {activeTab === 'students' && (
          <StudentList
            students={students}
            sessions={sessions}
            onOpenEnrollModal={() => setIsEnrollModalOpen(true)}
            onOpenAddSession={(studId) => {
              setAddSessionStudentId(studId);
              setIsAddSessionModalOpen(true);
            }}
            onSelectStudent={(stud) => setViewStudent(stud)}
            onDeleteStudent={handleRequestDeleteStudent}
            onArchiveStudent={handleRequestArchiveStudent}
            selectedSection={selectedSection}
            onSelectSection={setSelectedSection}
            sectionsList={sectionsList}
            onOpenParentLetter={(stud) => setParentLetterStudent(stud)}
            onOpenAnecdotalReport={(stud) => setAnecdotalReportStudent(stud)}
            onOpenArchiveTab={() => setActiveTab('archive')}
          />
        )}

        {activeTab === 'sessions' && (
          <SessionLogList
            sessions={sessions}
            students={students}
            onOpenAddSession={(studId) => {
              setAddSessionStudentId(studId);
              setIsAddSessionModalOpen(true);
            }}
            onDeleteSession={handleRequestDeleteSession}
            onViewMOV={(url, title) => setViewMovUrl({ url, title })}
            onSelectStudent={(stud) => setViewStudent(stud)}
          />
        )}

        {activeTab === 'class-progress' && (
          <ClassProgressDashboard
            students={students}
            sessions={sessions}
            selectedSection={selectedSection}
            onSelectSection={setSelectedSection}
            sectionsList={sectionsList}
            onSelectStudent={(stud) => setViewStudent(stud)}
            onOpenAddSession={(studId) => {
              setAddSessionStudentId(studId);
              setIsAddSessionModalOpen(true);
            }}
          />
        )}

        {activeTab === 'report' && (
          <NarrativeReportGenerator
            teacher={teacher}
            students={students}
            sessions={sessions}
            sectionsList={sectionsList}
          />
        )}

        {activeTab === 'archive' && (
          <ArchiveManagement
            students={students}
            sessions={sessions}
            onUnarchiveStudent={handleRequestUnarchiveStudent}
            onDeleteStudent={handleDeleteStudent}
            onDeleteAllArchived={handleDeleteAllArchived}
            onUnarchiveSection={handleUnarchiveSection}
            onArchiveSection={handleArchiveSection}
            onDeleteSection={handleDeleteSection}
            onSelectStudent={(stud) => setViewStudent(stud)}
            onRequestConfirm={(config) => {
              setConfirmConfig({
                ...config,
                isOpen: true,
              });
            }}
          />
        )}
      </main>

      {/* Institutional Footer */}
      <footer className="bg-emerald-950 text-emerald-200 border-t-2 border-amber-500 py-6 mt-12 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <SchoolLogo size="sm" showShadow={false} />
            <div>
              <p className="font-extrabold text-sm text-yellow-300">
                RAMON MAGSAYSAY (CUBAO) HIGH SCHOOL
              </p>
              <p className="text-xs text-emerald-300">
                Technology and Livelihood Education (TLE) Department &bull; Project S.M.I.L.E.
              </p>
            </div>
          </div>
          <div className="text-xs text-emerald-300/80">
            <p>Anecdotal Record & Progress Monitoring System</p>
            <p className="text-[11px] text-amber-300 font-semibold mt-0.5">Republic of the Philippines • Department of Education</p>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      <EnrollStudentModal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        onEnrollStudent={handleEnrollStudent}
      />

      <AddSessionModal
        isOpen={isAddSessionModalOpen}
        onClose={() => setIsAddSessionModalOpen(false)}
        students={students}
        onAddSession={handleAddSession}
        preSelectedStudentId={addSessionStudentId}
      />

      <StudentDetailModal
        isOpen={!!viewStudent}
        onClose={() => setViewStudent(null)}
        student={viewStudent}
        sessions={sessions}
        onOpenAddSession={(studId) => {
          setAddSessionStudentId(studId);
          setIsAddSessionModalOpen(true);
        }}
        onViewMOV={(url, title) => setViewMovUrl({ url, title })}
        onOpenParentLetter={(stud) => setParentLetterStudent(stud)}
        onOpenAnecdotalReport={(stud) => setAnecdotalReportStudent(stud)}
        onDeleteStudent={(stud) => handleRequestDeleteStudent(stud)}
        onArchiveStudent={(stud) => handleRequestArchiveStudent(stud)}
        onUnarchiveStudent={(stud) => handleRequestUnarchiveStudent(stud.id)}
      />

      {parentLetterStudent && (
        <ParentCommunicationLetterModal
          isOpen={!!parentLetterStudent}
          onClose={() => setParentLetterStudent(null)}
          student={parentLetterStudent}
          teacher={teacher}
        />
      )}

      {anecdotalReportStudent && (
        <IndividualAnecdotalReportModal
          isOpen={!!anecdotalReportStudent}
          onClose={() => setAnecdotalReportStudent(null)}
          student={anecdotalReportStudent}
          sessions={sessions}
          teacher={teacher}
        />
      )}

      {viewMovUrl && (
        <MOVViewerModal
          isOpen={!!viewMovUrl}
          onClose={() => setViewMovUrl(null)}
          dataUrl={viewMovUrl.url}
          title={viewMovUrl.title}
        />
      )}

      {/* Toast Notification Container */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-5 fade-in duration-200 max-w-md">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 ${
              toastMessage.type === 'success'
                ? 'bg-emerald-900 text-white border-emerald-700'
                : toastMessage.type === 'warning'
                ? 'bg-amber-900 text-white border-amber-700'
                : 'bg-slate-900 text-white border-slate-700'
            }`}
          >
            <div className="p-1 bg-amber-400 text-emerald-950 rounded-full shrink-0">
              <CheckCircle className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold leading-snug">{toastMessage.message}</p>
            <button
              onClick={() => setToastMessage(null)}
              className="text-white/60 hover:text-white p-1 ml-auto cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Supabase Cloud Database Sync & Table Setup Modal */}
      <SupabaseDatabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        teacher={teacher}
        students={students}
        sessions={sessions}
        onSyncComplete={() => {
          refreshData();
          showToast('Supabase database sync complete!', 'success');
        }}
      />

      {/* In-App Action Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.onConfirm}
        onAlternativeAction={confirmConfig.onAlternativeAction}
        alternativeActionLabel={confirmConfig.alternativeActionLabel}
        type={confirmConfig.type}
        title={confirmConfig.title}
        message={confirmConfig.message}
        itemName={confirmConfig.itemName}
        itemDetails={confirmConfig.itemDetails}
        confirmLabel={confirmConfig.confirmLabel}
        confirmVariant={confirmConfig.confirmVariant}
      />
    </div>
  );
}

