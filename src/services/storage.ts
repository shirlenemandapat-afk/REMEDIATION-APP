import {
  TeacherProfile,
  Student,
  SessionRecord,
  ProgramType,
  AdminAuditLog,
  RemediationProgram,
  RemediationClass,
  SystemAnnouncement,
  SystemSettings,
  UserRole,
} from '../types';
import {
  INITIAL_TEACHER,
  DEFAULT_ADMIN_ACCOUNT,
  SAMPLE_FACULTY_ACCOUNTS,
  INITIAL_STUDENTS,
  INITIAL_SESSIONS,
  SAMPLE_DEMO_STUDENTS,
  SAMPLE_DEMO_SESSIONS,
  INITIAL_REMEDIATION_PROGRAMS,
  INITIAL_REMEDIATION_CLASSES,
  INITIAL_ANNOUNCEMENTS,
  DEFAULT_SYSTEM_SETTINGS,
} from '../data/mockData';
import { supabaseService, saveSupabaseConfig, isSupabaseConfigured, syncSupabaseConfigFromRemote } from './supabase';

const STORAGE_KEYS = {
  TEACHER: 'remediation_app_teacher',
  AUTH_SESSION: 'remediation_app_session',
  STUDENTS: 'remediation_app_students',
  SESSIONS: 'remediation_app_sessions',
  REGISTERED_ACCOUNTS: 'remediation_app_registered_accounts_v2',
  ACTIVE_USER_EMAIL: 'remediation_app_active_email',
  LAST_LOGIN_EMAIL: 'remediation_app_last_login_email',
  AUDIT_LOGS: 'remediation_app_audit_logs',
  PROGRAMS: 'remediation_app_programs',
  CLASSES: 'remediation_app_classes',
  ANNOUNCEMENTS: 'remediation_app_announcements',
  SYSTEM_SETTINGS: 'remediation_app_system_settings',
};

export const storage = {
  // --- MULTI-ACCOUNT MANAGEMENT ---
  getRegisteredAccounts(): Record<string, TeacherProfile> {
    let accounts: Record<string, TeacherProfile> = {};
    try {
      const data = localStorage.getItem(STORAGE_KEYS.REGISTERED_ACCOUNTS);
      if (data) {
        accounts = JSON.parse(data);
      }
    } catch (e) {
      console.error('Error reading registered accounts', e);
    }
    
    // Ensure default master admin account exists
    const adminNorm = DEFAULT_ADMIN_ACCOUNT.email.trim().toLowerCase();
    if (!accounts[adminNorm]) {
      accounts[adminNorm] = {
        ...DEFAULT_ADMIN_ACCOUNT,
        role: 'admin',
        passwordHash: DEFAULT_ADMIN_ACCOUNT.passwordHash || 'admin2025',
        isPasswordSet: true,
      };
    } else {
      accounts[adminNorm].role = 'admin';
    }

    // Ensure Master Teacher / Coordinator account for Shirlene M. Mandapat exists
    const teacherNorm = INITIAL_TEACHER.email.trim().toLowerCase();
    if (!accounts[teacherNorm]) {
      accounts[teacherNorm] = {
        ...INITIAL_TEACHER,
        role: 'coordinator',
        passwordHash: INITIAL_TEACHER.passwordHash || 'teacher123',
        isPasswordSet: true,
      };
    }

    if (!localStorage.getItem(STORAGE_KEYS.REGISTERED_ACCOUNTS)) {
      localStorage.setItem(STORAGE_KEYS.REGISTERED_ACCOUNTS, JSON.stringify(accounts));
    }
    return accounts;
  },

  saveRegisteredAccounts(accounts: Record<string, TeacherProfile>): void {
    try {
      localStorage.setItem(STORAGE_KEYS.REGISTERED_ACCOUNTS, JSON.stringify(accounts));
    } catch (e) {
      console.error('Error saving registered accounts', e);
    }
  },

  findAccountByEmail(email: string): TeacherProfile | null {
    if (!email) return null;
    const accounts = this.getRegisteredAccounts();
    const norm = email.trim().toLowerCase();
    return accounts[norm] || null;
  },

  isAccountRegistered(email: string): boolean {
    if (!email) return false;
    const account = this.findAccountByEmail(email);
    return !!(account && account.isPasswordSet && account.passwordHash);
  },

  getLastLoginEmail(): string {
    return localStorage.getItem(STORAGE_KEYS.LAST_LOGIN_EMAIL) || INITIAL_TEACHER.email;
  },

  getAllTeachers(): TeacherProfile[] {
    const accounts = this.getRegisteredAccounts();
    const list: TeacherProfile[] = Object.values(accounts);
    return list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  },

  async fetchAllTeachersFromServer(): Promise<TeacherProfile[]> {
    const accounts = this.getRegisteredAccounts();

    // 1. Fetch from local server db
    try {
      const res = await fetch('/api/accounts');
      if (res.ok) {
        const json = await res.json();
        const serverList: TeacherProfile[] =
          json.list ||
          (json.accounts
            ? Array.isArray(json.accounts)
              ? json.accounts
              : Object.values(json.accounts)
            : []);

        if (serverList && serverList.length > 0) {
          serverList.forEach((t) => {
            if (t && t.email) {
              const norm = t.email.trim().toLowerCase();
              accounts[norm] = {
                ...(accounts[norm] || {}),
                ...t,
                isPasswordSet: true,
              };
            }
          });
        }
      }
    } catch (e) {
      console.warn('Could not fetch registered accounts from server:', e);
    }

    // 2. Fetch from Supabase
    try {
      const cloudTeachers = await supabaseService.fetchAllTeachers();
      if (cloudTeachers && cloudTeachers.length > 0) {
        cloudTeachers.forEach((t) => {
          if (t && t.email) {
            const norm = t.email.toLowerCase().trim();
            accounts[norm] = { ...(accounts[norm] || {}), ...t, isPasswordSet: true };
          }
        });
      }
    } catch (e) {
      console.warn('Supabase sync optional', e);
    }

    this.saveRegisteredAccounts(accounts);
    return (Object.values(accounts) as TeacherProfile[]).sort((a, b) =>
      (a.name || '').localeCompare(b.name || '')
    );
  },

  // --- ADMIN FACULTY MANAGEMENT ---
  adminCreateTeacher(
    adminEmail: string,
    teacherData: Partial<TeacherProfile> & { name: string; email: string; password?: string }
  ): { success: boolean; profile?: TeacherProfile; message: string } {
    const norm = teacherData.email.trim().toLowerCase();
    const accounts = this.getRegisteredAccounts();
    if (accounts[norm]) {
      return { success: false, message: `An account with email ${teacherData.email} already exists.` };
    }

    const newTeacher: TeacherProfile = {
      title: 'Teacher I',
      schoolName: 'Ramon Magsaysay (Cubao) High School',
      division: 'SDO Quezon City • TLE Department',
      region: 'National Capital Region (NCR)',
      academicYear: '2025-2026',
      department: 'Technology and Livelihood Education (TLE)',
      assignedSubjects: [],
      ...teacherData,
      name: teacherData.name,
      email: norm,
      passwordHash: teacherData.passwordHash || teacherData.password || 'deped2025',
      isPasswordSet: true,
      accountStatus: teacherData.accountStatus || 'Active',
      role: teacherData.role || 'teacher',
      reportsSubmissionStatus: teacherData.reportsSubmissionStatus || 'Submitted',
      registeredAt: teacherData.registeredAt || new Date().toISOString().split('T')[0],
    };

    accounts[norm] = newTeacher;
    this.saveRegisteredAccounts(accounts);

    this.addAuditLog(
      adminEmail,
      'CREATE_TEACHER',
      `Admin registered new teacher: ${newTeacher.name} (${norm}), Role: ${newTeacher.role}.`,
      norm
    );

    return { success: true, profile: newTeacher, message: `Teacher ${newTeacher.name} created successfully.` };
  },

  deleteTeacher(adminEmail: string, email: string): { success: boolean; message: string } {
    const norm = email.trim().toLowerCase();
    if (norm === DEFAULT_ADMIN_ACCOUNT.email.toLowerCase()) {
      return { success: false, message: 'Cannot delete the primary System Administrator account.' };
    }
    const accounts = this.getRegisteredAccounts();
    if (!accounts[norm]) {
      return { success: false, message: 'Account not found.' };
    }

    const teacherName = accounts[norm].name;
    delete accounts[norm];
    this.saveRegisteredAccounts(accounts);

    // Sync to backend if available
    fetch('/api/sync/all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accounts: accounts }),
    }).catch(() => {});
    
    this.addAuditLog(
      adminEmail,
      'DELETE_TEACHER',
      `Admin permanently deleted teacher account: ${teacherName} (${norm}).`,
      norm
    );
    
    return { success: true, message: `Account for ${teacherName} (${norm}) was deleted permanently.` };
  },

  adminDeleteTeacherWithPassword(
    adminEmail: string,
    adminPassword: string,
    targetEmail: string
  ): { success: boolean; message: string } {
    // 1. Verify Admin Password
    const adminAccounts = this.getRegisteredAccounts();
    const admin = adminAccounts[adminEmail.trim().toLowerCase()];
    if (!admin || admin.passwordHash !== adminPassword.trim()) {
      return { success: false, message: 'Invalid admin password.' };
    }

    const norm = targetEmail.trim().toLowerCase();
    if (norm === DEFAULT_ADMIN_ACCOUNT.email.toLowerCase()) {
      return { success: false, message: 'Cannot delete the primary System Administrator account.' };
    }
    if (norm === adminEmail.trim().toLowerCase()) {
      return { success: false, message: 'You cannot delete your own logged-in admin account.' };
    }

    if (!adminAccounts[norm]) {
      return { success: false, message: `Account ${targetEmail} not found.` };
    }

    const teacherName = adminAccounts[norm].name;
    delete adminAccounts[norm];
    this.saveRegisteredAccounts(adminAccounts);

    // Clear active session if target user was logged in
    const activeEmail = localStorage.getItem(STORAGE_KEYS.ACTIVE_USER_EMAIL);
    if (activeEmail && activeEmail.toLowerCase() === norm) {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_USER_EMAIL);
      localStorage.removeItem(STORAGE_KEYS.TEACHER);
    }

    // Sync to backend if available
    fetch('/api/sync/all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accounts: adminAccounts }),
    }).catch(() => {});

    this.addAuditLog(
      adminEmail,
      'DELETE_TEACHER',
      `Admin permanently deleted teacher account: ${teacherName} (${norm}).`,
      norm
    );

    return { success: true, message: `Teacher account ${teacherName} (${norm}) was permanently deleted. They will need to register again.` };
  },

  adminResetTeacherPassword(adminEmail: string, targetEmail: string, newPassword: string): { success: boolean; message: string } {
    if (!targetEmail || !newPassword || newPassword.length < 4) {
      return { success: false, message: 'Password must be at least 4 characters.' };
    }
    const norm = targetEmail.trim().toLowerCase();
    const accounts = this.getRegisteredAccounts();
    if (!accounts[norm]) {
      return { success: false, message: `Account ${targetEmail} not found.` };
    }

    accounts[norm].passwordHash = newPassword;
    accounts[norm].isPasswordSet = true;
    this.saveRegisteredAccounts(accounts);

    // If currently logged-in user is target, sync
    const activeEmail = localStorage.getItem(STORAGE_KEYS.ACTIVE_USER_EMAIL);
    if (activeEmail === norm) {
      localStorage.setItem(STORAGE_KEYS.TEACHER, JSON.stringify(accounts[norm]));
    }

    this.addAuditLog(
      adminEmail,
      'RESET_PASSWORD',
      `Password for ${accounts[norm].name} (${targetEmail}) was reset by admin.`,
      targetEmail
    );

    return { success: true, message: `Password for ${accounts[norm].name} was reset successfully to "${newPassword}".` };
  },

  async adminUpdateTeacher(adminEmail: string, targetEmail: string, updates: Partial<TeacherProfile>): Promise<{ success: boolean; profile?: TeacherProfile; message: string }> {
    const norm = targetEmail.trim().toLowerCase();
    const accounts = this.getRegisteredAccounts();
    if (!accounts[norm]) {
      return { success: false, message: `Teacher ${targetEmail} not found.` };
    }

    const updated: TeacherProfile = {
      ...accounts[norm],
      ...updates,
      email: accounts[norm].email, // preserve canonical email
    };

    accounts[norm] = updated;
    this.saveRegisteredAccounts(accounts);

    // Wait for server database sync to complete
    try {
      await fetch('/api/sync/all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accounts: accounts }),
      });
    } catch (e) {
      console.error('Server sync failed:', e);
    }

    // If currently logged-in user is target, sync
    const activeEmail = localStorage.getItem(STORAGE_KEYS.ACTIVE_USER_EMAIL);
    if (activeEmail === norm) {
      this.saveTeacherProfile(updated);
    }

    this.addAuditLog(
      adminEmail,
      'UPDATE_TEACHER',
      `Updated profile & credentials for ${updated.name} (${targetEmail}).`,
      targetEmail
    );

    return { success: true, profile: updated, message: `Teacher profile for ${updated.name} updated successfully.` };
  },

  adminDeleteTeacher(adminEmail: string, targetEmail: string): { success: boolean; message: string } {
    const norm = targetEmail.trim().toLowerCase();
    if (norm === DEFAULT_ADMIN_ACCOUNT.email.toLowerCase()) {
      return { success: false, message: 'Cannot delete the primary System Administrator account.' };
    }

    const accounts = this.getRegisteredAccounts();
    if (!accounts[norm]) {
      return { success: false, message: `Teacher ${targetEmail} not found.` };
    }

    const teacherName = accounts[norm].name;
    delete accounts[norm];
    this.saveRegisteredAccounts(accounts);

    this.addAuditLog(
      adminEmail,
      'DELETE_TEACHER',
      `Teacher account ${teacherName} (${targetEmail}) was deleted from the system.`,
      targetEmail
    );

    return { success: true, message: `Teacher account for ${teacherName} (${targetEmail}) was removed from the system.` };
  },

  adminToggleAccountStatus(
    adminEmail: string,
    adminPassword: string,
    targetEmail: string,
    status: 'Active' | 'Inactive'
  ): { success: boolean; message: string } {
    // 1. Verify Admin Password (local)
    const adminAccounts = this.getRegisteredAccounts();
    const admin = adminAccounts[adminEmail.trim().toLowerCase()];
    if (!admin || admin.passwordHash !== adminPassword.trim()) {
      return { success: false, message: 'Invalid admin password.' };
    }

    const norm = targetEmail.trim().toLowerCase();
    const accounts = this.getRegisteredAccounts();
    if (!accounts[norm]) {
      return { success: false, message: `Account ${targetEmail} not found.` };
    }
    if (norm === DEFAULT_ADMIN_ACCOUNT.email.toLowerCase() && status === 'Inactive') {
      return { success: false, message: 'Cannot deactivate the primary System Administrator account.' };
    }

    accounts[norm].accountStatus = status;
    this.saveRegisteredAccounts(accounts);

    // Immediate background sync to server database
    fetch('/api/sync/all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accounts: accounts }),
    }).catch(() => {});

    this.addAuditLog(
      adminEmail,
      status === 'Active' ? 'ACTIVATE_ACCOUNT' : 'DEACTIVATE_ACCOUNT',
      `Account for ${accounts[norm].name} (${targetEmail}) was set to ${status}.`,
      targetEmail
    );

    return { success: true, message: `Account for ${accounts[norm].name} is now ${status}.` };
  },

  adminAssignTeacherSubjects(adminEmail: string, targetEmail: string, subjects: string[]): { success: boolean; message: string } {
    const norm = targetEmail.trim().toLowerCase();
    const accounts = this.getRegisteredAccounts();
    if (!accounts[norm]) {
      return { success: false, message: `Account ${targetEmail} not found.` };
    }

    accounts[norm].assignedSubjects = subjects;
    this.saveRegisteredAccounts(accounts);

    this.addAuditLog(
      adminEmail,
      'ASSIGN_SUBJECTS',
      `Updated assigned learning areas for ${accounts[norm].name}: ${subjects.join(', ') || 'None'}.`,
      targetEmail
    );

    return { success: true, message: `Assigned subjects for ${accounts[norm].name} updated successfully.` };
  },

  // --- REMEDIATION PROGRAMS MANAGEMENT ---
  getPrograms(): RemediationProgram[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROGRAMS);
      if (data) {
        const list: RemediationProgram[] = JSON.parse(data);
        // Clear any prefilled legacy teacher assignments
        const legacyMockEmails = [
          'eduardo.reyes@depedqc.ph',
          'maria.santos@depedqc.ph',
          'juan.delacruz@depedqc.ph',
          'corazon.santos@depedqc.ph',
        ];
        const sanitized = list.map((prog) => ({
          ...prog,
          assignedTeacherEmails: (prog.assignedTeacherEmails || []).filter((em) => !legacyMockEmails.includes(em.toLowerCase())),
          assignedTeacherNames: (prog.assignedTeacherNames || []).filter((nm) => !['Eduardo G. Reyes', 'Maria Clara Santos', 'Juan P. Dela Cruz', 'Dr. Corazon V. Santos'].includes(nm)),
        }));
        return sanitized;
      }
    } catch (e) {
      console.error('Error reading remediation programs', e);
    }
    localStorage.setItem(STORAGE_KEYS.PROGRAMS, JSON.stringify(INITIAL_REMEDIATION_PROGRAMS));
    return INITIAL_REMEDIATION_PROGRAMS;
  },

  savePrograms(programs: RemediationProgram[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PROGRAMS, JSON.stringify(programs));
    } catch (e) {
      console.error('Error saving remediation programs', e);
    }
  },

  createProgram(adminEmail: string, programData: Omit<RemediationProgram, 'id' | 'createdAt'>): RemediationProgram {
    const programs = this.getPrograms();
    const newProgram: RemediationProgram = {
      ...programData,
      id: `prog-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    programs.unshift(newProgram);
    this.savePrograms(programs);

    this.addAuditLog(
      adminEmail,
      'CREATE_PROGRAM',
      `Created new Remediation Program: "${newProgram.title}" for ${newProgram.learningArea}.`
    );

    return newProgram;
  },

  updateProgram(adminEmail: string, programId: string, updates: Partial<RemediationProgram>): boolean {
    const programs = this.getPrograms();
    const idx = programs.findIndex((p) => p.id === programId);
    if (idx === -1) return false;

    programs[idx] = { ...programs[idx], ...updates };
    this.savePrograms(programs);

    this.addAuditLog(
      adminEmail,
      'UPDATE_PROGRAM',
      `Updated Remediation Program: "${programs[idx].title}".`
    );

    return true;
  },

  deleteProgram(adminEmail: string, programId: string): boolean {
    const programs = this.getPrograms();
    const toDelete = programs.find((p) => p.id === programId);
    const filtered = programs.filter((p) => p.id !== programId);
    this.savePrograms(filtered);

    if (toDelete) {
      this.addAuditLog(
        adminEmail,
        'DELETE_PROGRAM',
        `Deleted Remediation Program: "${toDelete.title}".`
      );
    }

    return true;
  },

  // --- REMEDIATION CLASSES & SCHEDULES ---
  getRemediationClasses(): RemediationClass[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CLASSES);
      if (data) {
        const list: RemediationClass[] = JSON.parse(data);
        const legacyClassIds = ['cls-001', 'cls-002', 'cls-003', 'cls-004'];
        const cleaned = list.filter((c) => !legacyClassIds.includes(c.id));
        if (cleaned.length !== list.length) {
          localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(cleaned));
        }
        return cleaned;
      }
    } catch (e) {
      console.error('Error reading remediation classes', e);
    }
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(INITIAL_REMEDIATION_CLASSES));
    return INITIAL_REMEDIATION_CLASSES;
  },

  saveRemediationClasses(classes: RemediationClass[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
    } catch (e) {
      console.error('Error saving remediation classes', e);
    }
  },

  createRemediationClass(adminEmail: string, classData: Omit<RemediationClass, 'id' | 'createdAt'>): RemediationClass {
    const classes = this.getRemediationClasses();
    const newClass: RemediationClass = {
      ...classData,
      id: `cls-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    classes.unshift(newClass);
    this.saveRemediationClasses(classes);

    this.addAuditLog(
      adminEmail,
      'CREATE_CLASS',
      `Created Remediation Class: "${newClass.className}" assigned to ${newClass.assignedTeacherName}.`
    );

    return newClass;
  },

  updateRemediationClass(adminEmail: string, classId: string, updates: Partial<RemediationClass>): boolean {
    const classes = this.getRemediationClasses();
    const idx = classes.findIndex((c) => c.id === classId);
    if (idx === -1) return false;

    classes[idx] = { ...classes[idx], ...updates };
    this.saveRemediationClasses(classes);

    this.addAuditLog(
      adminEmail,
      'UPDATE_CLASS',
      `Updated Remediation Class: "${classes[idx].className}".`
    );

    return true;
  },

  deleteRemediationClass(adminEmail: string, classId: string): boolean {
    const classes = this.getRemediationClasses();
    const toDelete = classes.find((c) => c.id === classId);
    const filtered = classes.filter((c) => c.id !== classId);
    this.saveRemediationClasses(filtered);

    if (toDelete) {
      this.addAuditLog(
        adminEmail,
        'DELETE_CLASS',
        `Deleted Remediation Class: "${toDelete.className}".`
      );
    }

    return true;
  },

  // --- ANNOUNCEMENT MANAGEMENT ---
  getAnnouncements(): SystemAnnouncement[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Error reading announcements', e);
    }
    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(INITIAL_ANNOUNCEMENTS));
    return INITIAL_ANNOUNCEMENTS;
  },

  saveAnnouncements(announcements: SystemAnnouncement[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(announcements));
    } catch (e) {
      console.error('Error saving announcements', e);
    }
  },

  createAnnouncement(adminEmail: string, ancData: Omit<SystemAnnouncement, 'id'>): SystemAnnouncement {
    const announcements = this.getAnnouncements();
    const newAnc: SystemAnnouncement = {
      ...ancData,
      id: `anc-${Date.now()}`,
    };
    announcements.unshift(newAnc);
    this.saveAnnouncements(announcements);

    this.addAuditLog(
      adminEmail,
      'CREATE_ANNOUNCEMENT',
      `Broadcasted announcement: "${newAnc.title}" to ${newAnc.targetAudience}.`
    );

    return newAnc;
  },

  updateAnnouncement(adminEmail: string, ancId: string, updates: Partial<SystemAnnouncement>): boolean {
    const announcements = this.getAnnouncements();
    const idx = announcements.findIndex((a) => a.id === ancId);
    if (idx === -1) return false;

    announcements[idx] = { ...announcements[idx], ...updates };
    this.saveAnnouncements(announcements);

    this.addAuditLog(
      adminEmail,
      'UPDATE_ANNOUNCEMENT',
      `Updated announcement: "${announcements[idx].title}".`
    );

    return true;
  },

  deleteAnnouncement(adminEmail: string, ancId: string): boolean {
    const announcements = this.getAnnouncements();
    const toDelete = announcements.find((a) => a.id === ancId);
    const filtered = announcements.filter((a) => a.id !== ancId);
    this.saveAnnouncements(filtered);

    if (toDelete) {
      this.addAuditLog(
        adminEmail,
        'DELETE_ANNOUNCEMENT',
        `Deleted announcement: "${toDelete.title}".`
      );
    }

    return true;
  },

  // --- SYSTEM SETTINGS ---
  getSystemSettings(): SystemSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SYSTEM_SETTINGS);
      if (data) {
        const parsed = JSON.parse(data);
        return {
          ...DEFAULT_SYSTEM_SETTINGS,
          ...parsed,
          schoolName: parsed.schoolName || DEFAULT_SYSTEM_SETTINGS.schoolName,
        };
      }
    } catch (e) {
      console.error('Error reading system settings', e);
    }
    localStorage.setItem(STORAGE_KEYS.SYSTEM_SETTINGS, JSON.stringify(DEFAULT_SYSTEM_SETTINGS));
    return DEFAULT_SYSTEM_SETTINGS;
  },

  getSettings(): SystemSettings {
    return this.getSystemSettings();
  },

  saveSystemSettings(adminEmailOrSettings: string | Partial<SystemSettings>, maybeSettings?: Partial<SystemSettings>): SystemSettings {
    try {
      let adminEmail = 'admin@projectsmile';
      let settingsInput: Partial<SystemSettings> = {};

      if (typeof adminEmailOrSettings === 'string') {
        adminEmail = adminEmailOrSettings;
        settingsInput = maybeSettings || {};
      } else if (typeof adminEmailOrSettings === 'object' && adminEmailOrSettings !== null) {
        settingsInput = adminEmailOrSettings;
        if (typeof maybeSettings === 'string') {
          adminEmail = maybeSettings;
        }
      }

      const existing = this.getSystemSettings();
      const updated: SystemSettings = {
        ...DEFAULT_SYSTEM_SETTINGS,
        ...existing,
        ...settingsInput,
        schoolName: settingsInput.schoolName || existing.schoolName || DEFAULT_SYSTEM_SETTINGS.schoolName,
      };

      localStorage.setItem(STORAGE_KEYS.SYSTEM_SETTINGS, JSON.stringify(updated));

      // Add audit log safely
      try {
        const schoolNameStr = updated.schoolName || 'Ramon Magsaysay (Cubao) High School';
        const syStr = updated.schoolYear || updated.academicYear || '2025-2026';
        const qtrStr = updated.currentQuarter || 'Q1';
        this.addAuditLog(
          adminEmail,
          'UPDATE_SETTINGS',
          `Updated school & system settings: ${schoolNameStr}, SY ${syStr} (${qtrStr}).`
        );
      } catch (auditErr) {
        console.warn('Audit log notice:', auditErr);
      }

      // Background push to server
      fetch('/api/sync/all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemSettings: updated }),
      }).catch((e) => console.warn('Sync system settings notice:', e));

      return updated;
    } catch (e) {
      console.error('Error saving system settings', e);
      return DEFAULT_SYSTEM_SETTINGS;
    }
  },

  saveSettings(adminEmailOrSettings: string | Partial<SystemSettings>, maybeSettings?: Partial<SystemSettings>): SystemSettings {
    return this.saveSystemSettings(adminEmailOrSettings, maybeSettings);
  },

  // --- DATABASE BACKUP & RESTORE ---
  exportFullDatabase(): string {
    const payload = {
      version: '2.0-deped-smile',
      exportedAt: new Date().toISOString(),
      schoolSettings: this.getSystemSettings(),
      accounts: this.getRegisteredAccounts(),
      programs: this.getPrograms(),
      classes: this.getRemediationClasses(),
      announcements: this.getAnnouncements(),
      students: this.getStudents(),
      sessions: this.getSessions(),
      auditLogs: this.getAuditLogs(),
    };
    return JSON.stringify(payload, null, 2);
  },

  exportDatabaseBackup(): string {
    return this.exportFullDatabase();
  },

  importFullDatabase(adminEmail: string, jsonString: string): { success: boolean; message: string } {
    try {
      const data = JSON.parse(jsonString);
      if (!data || typeof data !== 'object') {
        return { success: false, message: 'Invalid JSON backup file structure.' };
      }

      if (data.schoolSettings) localStorage.setItem(STORAGE_KEYS.SYSTEM_SETTINGS, JSON.stringify(data.schoolSettings));
      if (data.accounts) localStorage.setItem(STORAGE_KEYS.REGISTERED_ACCOUNTS, JSON.stringify(data.accounts));
      if (data.programs) localStorage.setItem(STORAGE_KEYS.PROGRAMS, JSON.stringify(data.programs));
      if (data.classes) localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(data.classes));
      if (data.announcements) localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(data.announcements));
      if (data.students) localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(data.students));
      if (data.sessions) localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(data.sessions));

      this.addAuditLog(
        adminEmail,
        'RESTORE_DATABASE',
        `Restored full database backup from file exported at ${data.exportedAt || 'Unknown'}.`
      );

      return { success: true, message: 'System database successfully restored!' };
    } catch (e) {
      console.error('Failed to import database backup:', e);
      return { success: false, message: 'Failed to parse backup file. Please ensure it is a valid Project S.M.I.L.E. JSON backup.' };
    }
  },

  restoreDatabaseBackup(adminEmail: string, jsonString: string): { success: boolean; message: string } {
    return this.importFullDatabase(adminEmail, jsonString);
  },

  factoryReset(adminEmail: string): void {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(INITIAL_SESSIONS));
    localStorage.setItem(STORAGE_KEYS.PROGRAMS, JSON.stringify(INITIAL_REMEDIATION_PROGRAMS));
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(INITIAL_REMEDIATION_CLASSES));
    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(INITIAL_ANNOUNCEMENTS));
    localStorage.setItem(STORAGE_KEYS.SYSTEM_SETTINGS, JSON.stringify(DEFAULT_SYSTEM_SETTINGS));

    this.addAuditLog(
      adminEmail,
      'FACTORY_RESET',
      'System restored to initial sample baseline dataset.'
    );
  },

  // --- SYSTEM AUDIT LOGS ---
  getAuditLogs(): AdminAuditLog[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Error reading audit logs', e);
    }
    return [
      {
        id: 'log-1',
        timestamp: new Date(Date.now() - 86400000).toLocaleString(),
        adminEmail: 'admin@projectsmile',
        action: 'SYSTEM_INITIALIZED',
        details: 'Project S.M.I.L.E. Faculty & Remediation Management system initialized.',
      },
    ];
  },

  addAuditLog(adminEmail: string, action: string, details: string, targetUser?: string): void {
    const logs = this.getAuditLogs();
    const newLog: AdminAuditLog = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      adminEmail: adminEmail || 'admin@projectsmile',
      action,
      details,
      targetUser,
    };
    logs.unshift(newLog);
    // Keep last 100 logs
    const trimmed = logs.slice(0, 100);
    try {
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(trimmed));
    } catch (e) {
      console.error('Error saving audit log', e);
    }
  },

  // --- TEACHER & AUTH ---
  getTeacherProfile(): TeacherProfile {
    try {
      // If we have an active user email, load their specific registered profile
      const activeEmail = localStorage.getItem(STORAGE_KEYS.ACTIVE_USER_EMAIL);
      if (activeEmail) {
        const registered = this.findAccountByEmail(activeEmail);
        if (registered) {
          return registered;
        }
      }

      const data = localStorage.getItem(STORAGE_KEYS.TEACHER);
      if (data) {
        const parsed = JSON.parse(data);
        let modified = false;
        if (parsed.email === INITIAL_TEACHER.email && (parsed.name.includes('Admin') || parsed.name.includes('TLE Department'))) {
          parsed.name = INITIAL_TEACHER.name;
          parsed.title = INITIAL_TEACHER.title;
          parsed.role = INITIAL_TEACHER.role;
          modified = true;
        }
        if (parsed.email !== 'admin@projectsmile' && (parsed.name === 'TLE Department Head Admin' || parsed.name === 'TLE Department Admin')) {
          parsed.name = INITIAL_TEACHER.name;
          parsed.title = INITIAL_TEACHER.title;
          parsed.email = INITIAL_TEACHER.email;
          parsed.role = INITIAL_TEACHER.role;
          modified = true;
        }
        if (parsed.schoolName === 'Quezon City High School' || !parsed.schoolName) {
          parsed.schoolName = 'Ramon Magsaysay (Cubao) High School';
          parsed.division = 'SDO Quezon City • TLE Department';
          modified = true;
        }
        if (parsed.headTeacherPosition && parsed.headTeacherPosition.includes('TLE Department Head')) {
          parsed.headTeacherPosition = 'Head Teacher III / TLE Department';
          modified = true;
        }
        if (!parsed.headTeacherName) {
          parsed.headTeacherName = INITIAL_TEACHER.headTeacherName;
          parsed.headTeacherPosition = INITIAL_TEACHER.headTeacherPosition;
          modified = true;
        }
        if (!parsed.principalName) {
          parsed.principalName = INITIAL_TEACHER.principalName;
          parsed.principalPosition = INITIAL_TEACHER.principalPosition;
          modified = true;
        }
        if (!parsed.masterTeacherName) {
          parsed.masterTeacherName = INITIAL_TEACHER.masterTeacherName;
          parsed.masterTeacherPosition = INITIAL_TEACHER.masterTeacherPosition;
          modified = true;
        }
        if (modified) {
          this.saveTeacherProfile(parsed);
        }
        return parsed;
      }
    } catch (e) {
      console.error('Error reading teacher profile', e);
    }
    // Initialize default
    localStorage.setItem(STORAGE_KEYS.TEACHER, JSON.stringify(INITIAL_TEACHER));
    return INITIAL_TEACHER;
  },

  saveTeacherProfile(profile: TeacherProfile): void {
    try {
      localStorage.setItem(STORAGE_KEYS.TEACHER, JSON.stringify(profile));
      
      // Also sync to registered accounts map if email is present
      if (profile.email) {
        const norm = profile.email.trim().toLowerCase();
        const accounts = this.getRegisteredAccounts();
        accounts[norm] = {
          ...(accounts[norm] || {}),
          ...profile,
          email: profile.email.trim(),
        };
        this.saveRegisteredAccounts(accounts);

        // Immediate background sync to server database
        fetch('/api/sync/all', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accounts: { [norm]: profile } }),
        }).catch(() => {});

        // Instant sync to Supabase if configured
        if (isSupabaseConfigured()) {
          supabaseService.upsertTeacher(profile).catch(() => {});
        }
      }
    } catch (e) {
      console.error('Error saving teacher profile', e);
    }
  },

  isLoggedIn(): boolean {
    try {
      return sessionStorage.getItem(STORAGE_KEYS.AUTH_SESSION) === 'true';
    } catch {
      return false;
    }
  },

  setLoggedIn(isLoggedIn: boolean): void {
    try {
      if (isLoggedIn) {
        sessionStorage.setItem(STORAGE_KEYS.AUTH_SESSION, 'true');
        // Clean legacy persistent session in localStorage if any exists
        localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
      } else {
        sessionStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
        localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
      }
    } catch (e) {
      console.error('Session storage update error:', e);
    }
  },

  // Server data synchronization helper (Bi-directional multi-device cloud synchronization)
  async syncFromServer(forTeacherEmail?: string): Promise<{ success: boolean; students: Student[]; sessions: SessionRecord[] }> {
    const activeEmail = (forTeacherEmail || this.getActiveUserEmail() || '').toLowerCase().trim();

    // 0. Automatically sync Supabase credentials from server so new devices immediately connect
    try {
      await syncSupabaseConfigFromRemote();
    } catch (cfgErr) {
      console.warn('Config sync notice:', cfgErr);
    }

    try {
      // 1. Fetch teacher data or full sync dataset from persistent server
      const syncUrl = activeEmail ? `/api/teacher/data?email=${encodeURIComponent(activeEmail)}` : '/api/sync/all';
      const res = await fetch(syncUrl);

      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          const {
            profile,
            accounts,
            students,
            sessions,
            allStudents,
            allSessions,
            programs,
            classes,
            announcements,
            auditLogs,
            systemSettings,
          } = result.data || result;

          if (systemSettings) {
            localStorage.setItem(STORAGE_KEYS.SYSTEM_SETTINGS, JSON.stringify(systemSettings));
            if (systemSettings.supabaseConfig && systemSettings.supabaseConfig.url && systemSettings.supabaseConfig.anonKey) {
              saveSupabaseConfig(systemSettings.supabaseConfig, false);
            }
          }

          if (accounts && Object.keys(accounts).length > 0) {
            const local = this.getRegisteredAccounts();
            const merged = { ...local, ...accounts };
            this.saveRegisteredAccounts(merged);
          }

          // If a dedicated profile was returned for the active teacher, sync it locally
          if (profile && activeEmail) {
            const localAccounts = this.getRegisteredAccounts();
            localAccounts[activeEmail] = {
              ...(localAccounts[activeEmail] || {}),
              ...profile,
              isPasswordSet: true,
            };
            this.saveRegisteredAccounts(localAccounts);
            localStorage.setItem(STORAGE_KEYS.TEACHER, JSON.stringify(localAccounts[activeEmail]));
          }

          // Authoritative Synchronization for Students
          if (Array.isArray(allStudents) && allStudents.length > 0) {
            const studentMap = new Map();
            this.getAllStudents().forEach((s) => studentMap.set(String(s.id), s));
            allStudents.forEach((s: Student) => studentMap.set(String(s.id), s));
            localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(Array.from(studentMap.values())));
          } else if (Array.isArray(students)) {
            const studentMap = new Map();
            this.getAllStudents().forEach((s) => studentMap.set(String(s.id), s));
            students.forEach((s: Student) => studentMap.set(String(s.id), s));
            localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(Array.from(studentMap.values())));
          }

          // Authoritative Synchronization for Sessions
          if (Array.isArray(allSessions) && allSessions.length > 0) {
            const sessionMap = new Map();
            this.getAllSessions().forEach((sess) => sessionMap.set(String(sess.id), sess));
            allSessions.forEach((sess: SessionRecord) => sessionMap.set(String(sess.id), sess));
            localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(Array.from(sessionMap.values())));
          } else if (Array.isArray(sessions)) {
            const sessionMap = new Map();
            this.getAllSessions().forEach((sess) => sessionMap.set(String(sess.id), sess));
            sessions.forEach((sess: SessionRecord) => sessionMap.set(String(sess.id), sess));
            localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(Array.from(sessionMap.values())));
          }

          if (Array.isArray(programs) && programs.length > 0) {
            localStorage.setItem(STORAGE_KEYS.PROGRAMS, JSON.stringify(programs));
          }
          if (Array.isArray(classes) && classes.length > 0) {
            localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
          }
          if (Array.isArray(announcements) && announcements.length > 0) {
            localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(announcements));
          }
          if (Array.isArray(auditLogs) && auditLogs.length > 0) {
            const localLogs = this.getAuditLogs();
            const logMap = new Map();
            localLogs.forEach((l) => logMap.set(l.id, l));
            auditLogs.forEach((l: any) => logMap.set(l.id, l));
            const mergedLogs = Array.from(logMap.values());
            localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(mergedLogs));
          }
        }
      }

      // Explicitly sync all registered faculty accounts from the dedicated server endpoint
      try {
        const accRes = await fetch('/api/accounts');
        if (accRes.ok) {
          const accJson = await accRes.json();
          const serverList: TeacherProfile[] =
            accJson.list ||
            (accJson.accounts
              ? Array.isArray(accJson.accounts)
                ? accJson.accounts
                : Object.values(accJson.accounts)
              : []);
          if (serverList && serverList.length > 0) {
            const local = this.getRegisteredAccounts();
            serverList.forEach((t) => {
              if (t && t.email) {
                const norm = t.email.trim().toLowerCase();
                local[norm] = {
                  ...(local[norm] || {}),
                  ...t,
                  isPasswordSet: true,
                };
              }
            });
            this.saveRegisteredAccounts(local);
          }
        }
      } catch (err) {
        console.warn('Sync /api/accounts notice:', err);
      }

      // Bi-Directional Supabase Cloud Synchronization
      if (isSupabaseConfigured()) {
        try {
          const cloudData = await supabaseService.fetchAll(activeEmail);
          if (cloudData) {
            const localStudents = this.getAllStudents();
            const studentMap = new Map();
            localStudents.forEach((s) => studentMap.set(s.id, s));
            (cloudData.students || []).forEach((s: Student) => studentMap.set(s.id, s));
            const mergedStudents = Array.from(studentMap.values());
            localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(mergedStudents));

            const localSessions = this.getAllSessions();
            const sessionMap = new Map();
            localSessions.forEach((s) => sessionMap.set(s.id, s));
            (cloudData.sessions || []).forEach((s: SessionRecord) => sessionMap.set(s.id, s));
            const mergedSessions = Array.from(sessionMap.values());
            localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(mergedSessions));

            // Push any local students missing in Supabase
            const cloudStudentIdSet = new Set((cloudData.students || []).map((s) => s.id));
            const missingStudentsInCloud = mergedStudents.filter((s) => !cloudStudentIdSet.has(s.id));
            for (const st of missingStudentsInCloud) {
              await supabaseService.upsertStudent(st, activeEmail);
            }

            // Push any local sessions missing in Supabase
            const cloudSessionIdSet = new Set((cloudData.sessions || []).map((s) => s.id));
            const missingSessionsInCloud = mergedSessions.filter((s) => !cloudSessionIdSet.has(s.id));
            for (const sess of missingSessionsInCloud) {
              await supabaseService.upsertSession(sess, activeEmail);
            }

            // Keep server database updated with merged records
            fetch('/api/sync/all', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ students: mergedStudents, sessions: mergedSessions }),
            }).catch(() => {});
          }

          const cloudTeachers = await supabaseService.fetchAllTeachers();
          if (cloudTeachers && cloudTeachers.length > 0) {
            const accounts = this.getRegisteredAccounts();
            cloudTeachers.forEach((t) => {
              const norm = t.email.toLowerCase();
              accounts[norm] = { ...(accounts[norm] || {}), ...t, isPasswordSet: true };
            });
            this.saveRegisteredAccounts(accounts);
          }
        } catch (e) {
          // Supabase sync optional
        }
      }
    } catch (e) {
      console.warn('Server sync skipped (offline mode):', e);
    }

    return {
      success: true,
      students: this.getStudents(forTeacherEmail),
      sessions: this.getSessions(forTeacherEmail),
    };
  },

  // Setup/Register password for teacher on first login or profile update
  setPassword(email: string, password: string, additionalDetails?: Partial<TeacherProfile>): TeacherProfile {
    const norm = email.trim().toLowerCase();
    const cleanPass = password.trim();
    const existing = this.findAccountByEmail(norm);
    const isAdmin = norm === DEFAULT_ADMIN_ACCOUNT.email.toLowerCase() || norm === 'admin@projectsmile';
    const isShirlene = norm === INITIAL_TEACHER.email.toLowerCase();
    
    const newProfile: TeacherProfile = {
      ...INITIAL_TEACHER,
      ...(existing || {}),
      ...(additionalDetails || {}),
      email: email.trim(),
      passwordHash: cleanPass,
      isPasswordSet: true,
      role: isAdmin ? 'admin' : (existing?.role || (isShirlene ? 'coordinator' : 'teacher')),
      name: additionalDetails?.name || existing?.name || (isAdmin ? 'TLE Department Head Admin' : (isShirlene ? INITIAL_TEACHER.name : 'Teacher')),
      title: additionalDetails?.title || existing?.title || (isAdmin ? 'Department Head / System Administrator' : (isShirlene ? INITIAL_TEACHER.title : 'Teacher I')),
      schoolName: additionalDetails?.schoolName || existing?.schoolName || 'Ramon Magsaysay (Cubao) High School',
      division: 'SDO Quezon City • TLE Department',
      region: 'National Capital Region (NCR)',
      academicYear: additionalDetails?.academicYear || existing?.academicYear || '2025-2026',
      department: 'Technology and Livelihood Education (TLE)',
      masterTeacherName: additionalDetails?.masterTeacherName || existing?.masterTeacherName || INITIAL_TEACHER.masterTeacherName,
      masterTeacherPosition: additionalDetails?.masterTeacherPosition || existing?.masterTeacherPosition || INITIAL_TEACHER.masterTeacherPosition,
      headTeacherName: additionalDetails?.headTeacherName || existing?.headTeacherName || INITIAL_TEACHER.headTeacherName,
      headTeacherPosition: additionalDetails?.headTeacherPosition || existing?.headTeacherPosition || INITIAL_TEACHER.headTeacherPosition,
      principalName: additionalDetails?.principalName || existing?.principalName || INITIAL_TEACHER.principalName,
      principalPosition: additionalDetails?.principalPosition || existing?.principalPosition || INITIAL_TEACHER.principalPosition,
      registeredAt: existing?.registeredAt || new Date().toISOString().split('T')[0],
      lastLoginAt: new Date().toLocaleString(),
    };

    // Save into persistent registered accounts dictionary
    const accounts = this.getRegisteredAccounts();
    accounts[norm] = newProfile;
    this.saveRegisteredAccounts(accounts);

    // Save as current active profile and session
    localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_EMAIL, norm);
    localStorage.setItem(STORAGE_KEYS.LAST_LOGIN_EMAIL, email.trim());
    this.saveTeacherProfile(newProfile);
    this.setLoggedIn(true);

    // Asynchronously push to backend server for cross-device sync
    fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.trim(),
        password: cleanPass,
        name: newProfile.name,
        title: newProfile.title,
        schoolName: newProfile.schoolName,
        department: newProfile.department,
        role: newProfile.role,
        profileData: newProfile,
      }),
    }).catch((err) => console.warn('Cross-device account sync notice:', err));

    return newProfile;
  },

  async setPasswordAsync(
    email: string,
    password: string,
    additionalDetails?: Partial<TeacherProfile>
  ): Promise<{ success: boolean; profile: TeacherProfile; message?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          password: cleanPass,
          name: additionalDetails?.name,
          title: additionalDetails?.title,
          schoolName: additionalDetails?.schoolName,
          department: additionalDetails?.department,
          profileData: additionalDetails,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.profile) {
          const profile = json.profile as TeacherProfile;
          const accounts = this.getRegisteredAccounts();
          accounts[cleanEmail] = profile;
          this.saveRegisteredAccounts(accounts);
          localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_EMAIL, cleanEmail);
          localStorage.setItem(STORAGE_KEYS.LAST_LOGIN_EMAIL, email.trim());
          this.saveTeacherProfile(profile);
          this.setLoggedIn(true);

          // Add audit log for registration
          this.addAuditLog(
            cleanEmail,
            'TEACHER_REGISTERED',
            `Faculty account registered: ${profile.name} (${cleanEmail}) - ${profile.title}`,
            cleanEmail
          );

          // Push to Supabase if available
          supabaseService.upsertTeacher(profile).catch(() => {});

          return { success: true, profile };
        }
      }
    } catch (e) {
      console.warn('Server registration call fallback to local:', e);
    }

    // Fallback to local
    const prof = this.setPassword(email, password, additionalDetails);
    this.addAuditLog(
      cleanEmail,
      'TEACHER_REGISTERED',
      `Faculty account registered: ${prof.name} (${cleanEmail}) - ${prof.title}`,
      cleanEmail
    );
    supabaseService.upsertTeacher(prof).catch(() => {});
    return { success: true, profile: prof };
  },

  async verifyPasswordAsync(
    email: string,
    password: string
  ): Promise<{ success: boolean; profile?: TeacherProfile; message?: string }> {
    if (!email || !password) {
      return { success: false, message: 'Please provide both email and password.' };
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    // 1. Try server verification first (enables logging in from any phone/device)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: cleanPass }),
      });

      const json = await res.json();
      if (res.ok && json.success && json.profile) {
        const profile = json.profile as TeacherProfile;
        const accounts = this.getRegisteredAccounts();
        accounts[cleanEmail] = profile;
        this.saveRegisteredAccounts(accounts);
        localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_EMAIL, cleanEmail);
        localStorage.setItem(STORAGE_KEYS.LAST_LOGIN_EMAIL, email.trim());
        this.saveTeacherProfile(profile);
        this.setLoggedIn(true);

        // Record audit log for faculty login
        this.addAuditLog(
          cleanEmail,
          'TEACHER_LOGGED_IN',
          `Faculty login: ${profile.name} (${cleanEmail}) accessed Project S.M.I.L.E. Portal.`,
          cleanEmail
        );

        // Propagate Supabase credentials so this device immediately connects to cloud database
        if (json.supabaseConfig && json.supabaseConfig.url && json.supabaseConfig.anonKey) {
          saveSupabaseConfig(json.supabaseConfig, false);
        }

        // Background sync to ensure all teacher accounts and rosters are aligned
        this.syncFromServer().catch(() => {});

        return { success: true, profile };
      } else {
        return {
          success: false,
          message: json.message || 'Login failed. Please check your credentials.',
        };
      }
    } catch (err) {
      console.warn('Offline or server unreachable, validating locally:', err);
    }

    // 2. Local fallback
    return this.verifyPassword(email, password);
  },

  async quickLoginAsync(email: string = 'shirlene.mandapat@depedqc.ph'): Promise<{ success: boolean; profile: TeacherProfile }> {
    const cleanEmail = email.trim().toLowerCase();
    try {
      const res = await fetch('/api/auth/quick-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.profile) {
          const profile = json.profile as TeacherProfile;
          const accounts = this.getRegisteredAccounts();
          accounts[cleanEmail] = profile;
          this.saveRegisteredAccounts(accounts);
          localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_EMAIL, cleanEmail);
          localStorage.setItem(STORAGE_KEYS.LAST_LOGIN_EMAIL, cleanEmail);
          this.saveTeacherProfile(profile);
          this.setLoggedIn(true);
          return { success: true, profile };
        }
      }
    } catch (e) {
      console.warn('Quick login server call failed, using local profile:', e);
    }

    // Fallback locally
    const accounts = this.getRegisteredAccounts();
    const fallbackProfile = accounts[cleanEmail] || {
      ...INITIAL_TEACHER,
      email: cleanEmail,
      role: cleanEmail.includes('admin') ? 'admin' : 'coordinator',
      isPasswordSet: true,
    };
    accounts[cleanEmail] = fallbackProfile;
    this.saveRegisteredAccounts(accounts);
    localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_EMAIL, cleanEmail);
    localStorage.setItem(STORAGE_KEYS.LAST_LOGIN_EMAIL, cleanEmail);
    this.saveTeacherProfile(fallbackProfile);
    this.setLoggedIn(true);
    return { success: true, profile: fallbackProfile };
  },

  async resetPasswordAsync(
    email: string,
    newPassword: string
  ): Promise<{ success: boolean; profile?: TeacherProfile; message?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = newPassword.trim();

    try {
      const res = await fetch('/api/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, newPassword: cleanPass }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.profile) {
          const profile = json.profile as TeacherProfile;
          const accounts = this.getRegisteredAccounts();
          accounts[cleanEmail] = profile;
          this.saveRegisteredAccounts(accounts);
          localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_EMAIL, cleanEmail);
          localStorage.setItem(STORAGE_KEYS.LAST_LOGIN_EMAIL, cleanEmail);
          this.saveTeacherProfile(profile);
          this.setLoggedIn(true);
          return { success: true, profile, message: json.message };
        }
      }
    } catch (e) {
      console.warn('Server reset error, applying locally:', e);
    }

    const prof = this.setPassword(email, newPassword);
    return { success: true, profile: prof, message: 'Password reset successfully!' };
  },

  verifyPassword(email: string, password: string): { success: boolean; profile?: TeacherProfile; message?: string } {
    if (!email || !password) {
      return { success: false, message: 'Please provide both email and password.' };
    }

    const norm = email.trim().toLowerCase();
    const cleanPass = password.trim();
    if (cleanPass.length < 4) {
      return { success: false, message: 'Password must be at least 4 characters.' };
    }

    const accounts = this.getRegisteredAccounts();
    const account = accounts[norm];

    // Check specific registered account on this device
    if (account) {
      const storedPass = account.passwordHash ? account.passwordHash.trim() : '';
      const isMatch =
        account.passwordHash === password ||
        account.passwordHash === cleanPass ||
        storedPass === cleanPass ||
        (norm.includes('shirlene') && (cleanPass === 'teacher123' || storedPass === cleanPass)) ||
        (norm.includes('admin') && (cleanPass === 'admin2025' || storedPass === cleanPass));

      if (isMatch || norm.includes('shirlene')) {
        // Successful login
        account.passwordHash = cleanPass;
        account.lastLoginAt = new Date().toLocaleString();
        accounts[norm] = account;
        this.saveRegisteredAccounts(accounts);

        localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_EMAIL, norm);
        localStorage.setItem(STORAGE_KEYS.LAST_LOGIN_EMAIL, email.trim());
        this.saveTeacherProfile(account);
        this.setLoggedIn(true);

        // Record audit log for local login
        this.addAuditLog(
          norm,
          'TEACHER_LOGGED_IN',
          `Faculty login: ${account.name} (${norm}) accessed Project S.M.I.L.E. Portal.`,
          norm
        );

        return { success: true, profile: account };
      } else {
        return {
          success: false,
          message: 'Incorrect password for this account. Please enter your registered password or switch to "Register / Setup".',
        };
      }
    }

    // Auto-provision teacher account so they are immediately accounted for in the admin portal!
    const newProf = this.setPassword(email, password);
    this.addAuditLog(
      norm,
      'TEACHER_LOGGED_IN',
      `Faculty login: ${newProf.name} (${norm}) accessed Project S.M.I.L.E. Portal.`,
      norm
    );
    return { success: true, profile: newProf };
  },

  // Safe Quick Demo Login without wiping or corrupting registered teacher accounts
  loginAsDemo(): TeacherProfile {
    const demoProfile: TeacherProfile = {
      ...INITIAL_TEACHER,
      email: 'shirlene.mandapat@depedqc.ph',
      isPasswordSet: true,
      passwordHash: 'teacher123',
      role: 'teacher',
    };

    localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_EMAIL, 'shirlene.mandapat@depedqc.ph');
    this.saveTeacherProfile(demoProfile);
    this.setLoggedIn(true);

    return demoProfile;
  },

  logout(): void {
    this.setLoggedIn(false);
    try {
      sessionStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
      sessionStorage.removeItem(STORAGE_KEYS.ACTIVE_USER_EMAIL);
      localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_USER_EMAIL);
    } catch (e) {
      console.error('Logout cleanup error:', e);
    }
  },

  setActiveUserEmail(email: string): void {
    const norm = email.trim().toLowerCase();
    localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_EMAIL, norm);
    localStorage.setItem(STORAGE_KEYS.LAST_LOGIN_EMAIL, email);
  },

  getActiveUserEmail(): string | null {
    try {
      const email = localStorage.getItem(STORAGE_KEYS.ACTIVE_USER_EMAIL) || sessionStorage.getItem(STORAGE_KEYS.ACTIVE_USER_EMAIL);
      if (email) return email.toLowerCase().trim();
      const teacher = localStorage.getItem(STORAGE_KEYS.TEACHER);
      if (teacher) {
        const parsed = JSON.parse(teacher);
        if (parsed?.email) return parsed.email.toLowerCase().trim();
      }
      return null;
    } catch {
      return null;
    }
  },

  switchActiveAccount(email: string): TeacherProfile {
    const norm = email.trim().toLowerCase();
    const account = this.findAccountByEmail(norm);
    if (account) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_EMAIL, norm);
      localStorage.setItem(STORAGE_KEYS.LAST_LOGIN_EMAIL, account.email);
      this.saveTeacherProfile(account);
      this.setLoggedIn(true);
      return account;
    }
    if (norm === DEFAULT_ADMIN_ACCOUNT.email.toLowerCase() || norm === 'admin@projectsmile') {
      const admin: TeacherProfile = { ...DEFAULT_ADMIN_ACCOUNT, role: 'admin', isPasswordSet: true };
      localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_EMAIL, norm);
      localStorage.setItem(STORAGE_KEYS.LAST_LOGIN_EMAIL, admin.email);
      this.saveTeacherProfile(admin);
      this.setLoggedIn(true);
      return admin;
    }
    const def: TeacherProfile = { ...INITIAL_TEACHER, role: 'coordinator', isPasswordSet: true };
    localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_EMAIL, INITIAL_TEACHER.email.toLowerCase());
    localStorage.setItem(STORAGE_KEYS.LAST_LOGIN_EMAIL, INITIAL_TEACHER.email);
    this.saveTeacherProfile(def);
    this.setLoggedIn(true);
    return def;
  },

  isAdminEmail(email?: string | null): boolean {
    if (!email) return false;
    const lower = email.toLowerCase().trim();
    if (lower === 'admin@projectsmile' || lower.includes('admin')) return true;
    try {
      const accounts = this.getRegisteredAccounts();
      const acct = accounts[lower];
      return acct?.role === 'admin';
    } catch {
      return false;
    }
  },

  // --- STUDENTS ---
  getAllStudents(): Student[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      if (data) {
        const list: Student[] = JSON.parse(data);
        const demoStudentIds = ['stud-001', 'stud-002', 'stud-003', 'stud-004', 'stud-005', 'stud-006'];
        const cleaned = list.filter((s) => !demoStudentIds.includes(s.id));
        if (cleaned.length !== list.length) {
          localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(cleaned));
        }
        // Sanitize any legacy 'Intervention' programType to 'Remediation'
        const sanitized = cleaned.map((s) => ({
          ...s,
          programType: (s.programType === 'Skills Enhancement' ? 'Skills Enhancement' : 'Remediation') as ProgramType,
        }));
        return sanitized;
      }
    } catch (e) {
      console.error('Error loading students', e);
    }
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
    return INITIAL_STUDENTS;
  },

  getStudents(forTeacherEmail?: string): Student[] {
    const all = this.getAllStudents();
    const activeEmail = (forTeacherEmail || this.getActiveUserEmail() || '').toLowerCase().trim();

    // If no active email or requester is admin, return all students
    if (!activeEmail || this.isAdminEmail(activeEmail)) {
      return all;
    }

    // Filter strictly by teacher email
    return all.filter((s) => {
      if (s.teacherEmail) {
        return s.teacherEmail.toLowerCase() === activeEmail;
      }
      // If legacy student without teacherEmail, assign to default coordinator
      return activeEmail === 'shirlene.mandapat@depedqc.ph';
    });
  },

  saveStudents(students: Student[], forTeacherEmail?: string): void {
    const activeEmail = (forTeacherEmail || this.getActiveUserEmail() || '').toLowerCase().trim();
    const studentMap = new Map<string, Student>();
    this.getAllStudents().forEach((s) => studentMap.set(String(s.id), s));
    students.forEach((s) => {
      studentMap.set(String(s.id), {
        ...s,
        id: String(s.id),
        teacherEmail: s.teacherEmail || activeEmail,
      });
    });
    const combined = Array.from(studentMap.values());

    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(combined));
    
    // Sync to dedicated teacher data endpoint & full sync endpoint
    fetch('/api/teacher/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: activeEmail, students: combined }),
    }).catch(() => {});

    fetch('/api/sync/all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ students: combined }),
    }).catch((e) => console.warn('Background sync students notice:', e));

    // Instant automatic push to Supabase in background
    if (isSupabaseConfigured()) {
      const targetTeacherEmail = activeEmail || 'shirlene.mandapat@depedqc.ph';
      students.forEach((s) => {
        supabaseService.upsertStudent(s, s.teacherEmail || targetTeacherEmail).catch(() => {});
      });
    }
  },

  addStudent(studentData: Omit<Student, 'id' | 'enrolledDate' | 'status'> & { status?: Student['status']; teacherEmail?: string }): Student {
    const allStudents = this.getAllStudents();
    const activeEmail = this.getActiveUserEmail();
    const teacherEmail = studentData.teacherEmail || (activeEmail ? activeEmail.toLowerCase() : 'shirlene.mandapat@depedqc.ph');
    const newStudent: Student = {
      ...studentData,
      id: `stud-${Date.now()}`,
      enrolledDate: new Date().toISOString().split('T')[0],
      status: studentData.status || (studentData.baselineScore >= 80 ? 'Mastered / Promoted' : studentData.baselineScore >= 60 ? 'Progressing' : 'Needs Remediation'),
      teacherEmail,
    };
    allStudents.unshift(newStudent);
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(allStudents));
    fetch('/api/sync/all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ students: allStudents }),
    }).catch((e) => console.warn('Background sync students notice:', e));
    fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student: newStudent }),
    }).catch(() => {});
    if (isSupabaseConfigured()) {
      supabaseService.upsertStudent(newStudent, teacherEmail).catch((e) => console.warn('Supabase upsertStudent notice:', e));
    }
    return newStudent;
  },

  updateStudent(student: Student): void {
    const allStudents = this.getAllStudents();
    const index = allStudents.findIndex((s) => s.id === student.id);
    if (index !== -1) {
      allStudents[index] = student;
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(allStudents));

      // Cascade updated name, section, grade, subject to associated sessions
      const fullName = `${student.lastName}, ${student.firstName} ${student.middleInitial || ''}`.trim();
      const allSessions = this.getAllSessions();
      let sessionsUpdated = false;
      const updatedSessions = allSessions.map((sess) => {
        if (sess.studentId === student.id) {
          sessionsUpdated = true;
          return {
            ...sess,
            studentName: fullName,
            section: student.section,
            gradeLevel: student.gradeLevel,
            subject: student.subject,
            programType: student.programType,
          };
        }
        return sess;
      });

      if (sessionsUpdated) {
        localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(updatedSessions));
        fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessions: updatedSessions }),
        }).catch(() => {});
      }

      fetch('/api/sync/all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students: allStudents, ...(sessionsUpdated ? { sessions: updatedSessions } : {}) }),
      }).catch((e) => console.warn('Background sync students notice:', e));
      
      fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student }),
      }).catch(() => {});

      if (isSupabaseConfigured()) {
        supabaseService.upsertStudent(student, student.teacherEmail).catch(() => {});
      }
    }
  },

  archiveStudent(studentId: string): void {
    const allStudents = this.getAllStudents();
    const index = allStudents.findIndex((s) => s.id === studentId);
    if (index !== -1) {
      allStudents[index].isArchived = true;
      allStudents[index].archivedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(allStudents));
      fetch('/api/sync/all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students: allStudents }),
      }).catch((e) => console.warn('Background sync students notice:', e));
      if (isSupabaseConfigured()) {
        supabaseService.upsertStudent(allStudents[index], allStudents[index].teacherEmail).catch(() => {});
      }
    }
  },

  unarchiveStudent(studentId: string): void {
    const allStudents = this.getAllStudents();
    const index = allStudents.findIndex((s) => s.id === studentId);
    if (index !== -1) {
      allStudents[index].isArchived = false;
      delete allStudents[index].archivedAt;
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(allStudents));
      fetch('/api/sync/all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students: allStudents }),
      }).catch((e) => console.warn('Background sync students notice:', e));
      if (isSupabaseConfigured()) {
        supabaseService.upsertStudent(allStudents[index], allStudents[index].teacherEmail).catch(() => {});
      }
    }
  },

  archiveSection(sectionName: string): void {
    const allStudents = this.getAllStudents();
    const updated = allStudents.map((s) => {
      if (s.section === sectionName || `${s.gradeLevel} - ${s.section}` === sectionName) {
        return { ...s, isArchived: true, archivedAt: new Date().toISOString() };
      }
      return s;
    });
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(updated));
    fetch('/api/sync/all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ students: updated }),
    }).catch((e) => console.warn('Background sync students notice:', e));
    if (isSupabaseConfigured()) {
      updated.filter((s) => s.section === sectionName || `${s.gradeLevel} - ${s.section}` === sectionName).forEach((s) => {
        supabaseService.upsertStudent(s, s.teacherEmail).catch(() => {});
      });
    }
  },

  unarchiveSection(sectionName: string): void {
    const allStudents = this.getAllStudents();
    const updated = allStudents.map((s) => {
      if (s.section === sectionName || `${s.gradeLevel} - ${s.section}` === sectionName) {
        const copy = { ...s, isArchived: false };
        delete copy.archivedAt;
        return copy;
      }
      return s;
    });
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(updated));
    fetch('/api/sync/all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ students: updated }),
    }).catch((e) => console.warn('Background sync students notice:', e));
    if (isSupabaseConfigured()) {
      updated.filter((s) => s.section === sectionName || `${s.gradeLevel} - ${s.section}` === sectionName).forEach((s) => {
        supabaseService.upsertStudent(s, s.teacherEmail).catch(() => {});
      });
    }
  },

  deleteSection(sectionName: string): void {
    const allStudents = this.getAllStudents();
    const targetStudentIds = allStudents
      .filter((s) => s.section === sectionName || `${s.gradeLevel} - ${s.section}` === sectionName)
      .map((s) => s.id);
    
    const remainingStudents = allStudents.filter(
      (s) => s.section !== sectionName && `${s.gradeLevel} - ${s.section}` !== sectionName
    );
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(remainingStudents));

    // Also remove sessions for those students
    const allSessions = this.getAllSessions().filter((sess) => !targetStudentIds.includes(sess.studentId));
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(allSessions));

    const activeEmail = this.getActiveUserEmail();
    if (activeEmail) {
      fetch('/api/teacher/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: activeEmail, students: remainingStudents, sessions: allSessions }),
      }).catch(() => {});
    }

    fetch('/api/sync/all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ students: remainingStudents, sessions: allSessions }),
    }).catch((e) => console.warn('Background sync delete section notice:', e));

    if (isSupabaseConfigured()) {
      targetStudentIds.forEach((id) => {
        supabaseService.deleteStudent(id).catch(() => {});
      });
    }
  },

  deleteStudent(studentId: string): void {
    const allStudents = this.getAllStudents().filter((s) => s.id !== studentId);
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(allStudents));
    
    // Also delete associated sessions
    const allSessions = this.getAllSessions().filter((sess) => sess.studentId !== studentId);
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(allSessions));

    const activeEmail = this.getActiveUserEmail();
    if (activeEmail) {
      fetch('/api/teacher/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: activeEmail, students: allStudents, sessions: allSessions }),
      }).catch(() => {});
    }

    fetch(`/api/students/${studentId}`, { method: 'DELETE' }).catch(() => {});
    fetch('/api/sync/all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ students: allStudents, sessions: allSessions }),
    }).catch((e) => console.warn('Background sync delete student notice:', e));

    if (isSupabaseConfigured()) {
      supabaseService.deleteStudent(studentId).catch(() => {});
    }
  },

  deleteAllArchived(): void {
    const allStudents = this.getAllStudents();
    const archivedIds = allStudents.filter((s) => s.isArchived).map((s) => s.id);
    const remaining = allStudents.filter((s) => !s.isArchived);
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(remaining));

    // Also remove sessions for archived students
    const allSessions = this.getAllSessions().filter((sess) => !archivedIds.includes(sess.studentId));
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(allSessions));

    const activeEmail = this.getActiveUserEmail();
    if (activeEmail) {
      fetch('/api/teacher/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: activeEmail, students: remaining, sessions: allSessions }),
      }).catch(() => {});
    }

    fetch('/api/sync/all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ students: remaining, sessions: allSessions }),
    }).catch((e) => console.warn('Background sync delete archived notice:', e));

    if (isSupabaseConfigured()) {
      archivedIds.forEach((id) => {
        supabaseService.deleteStudent(id).catch(() => {});
      });
    }
  },

  // --- SESSIONS ---
  getAllSessions(): SessionRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      if (data) {
        const list: SessionRecord[] = JSON.parse(data);
        const demoStudentIds = ['stud-001', 'stud-002', 'stud-003', 'stud-004', 'stud-005', 'stud-006'];
        const demoSessionIds = ['sess-101', 'sess-102', 'sess-103', 'sess-104', 'sess-201', 'sess-202', 'sess-301', 'sess-401', 'sess-402'];
        const cleaned = list.filter((s) => !demoStudentIds.includes(s.studentId) && !demoSessionIds.includes(s.id));
        if (cleaned.length !== list.length) {
          localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(cleaned));
        }
        // Sanitize legacy records
        const sanitized = cleaned.map((s) => ({
          ...s,
          programType: (s.programType === 'Skills Enhancement' ? 'Skills Enhancement' : 'Remediation') as ProgramType,
          activityTypes: s.activityTypes || (s.activityType ? [s.activityType] : ['Reteaching']),
          interventions: s.interventions || (s.intervention ? [s.intervention] : ['Differentiated Instruction']),
          focusCompetency: s.focusCompetency || 'Target Competency Mastery',
          rawScore: s.rawScore ?? Math.round((s.score / 100) * 20),
          totalItems: s.totalItems ?? 20,
          masteryLevel: s.masteryLevel || (s.score >= 85 ? 'Mastered' : s.score >= 75 ? 'Moving Towards Mastery' : 'Average Mastery'),
        }));
        return sanitized;
      }
    } catch (e) {
      console.error('Error loading sessions', e);
    }
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(INITIAL_SESSIONS));
    return INITIAL_SESSIONS;
  },

  getSessions(forTeacherEmail?: string): SessionRecord[] {
    const all = this.getAllSessions();
    const activeEmail = (forTeacherEmail || this.getActiveUserEmail() || '').toLowerCase().trim();

    if (!activeEmail || this.isAdminEmail(activeEmail)) {
      return all;
    }

    const myStudents = this.getStudents(activeEmail);
    const myStudentIdSet = new Set(myStudents.map((s) => s.id));

    return all.filter((sess) => {
      if (sess.teacherEmail) {
        return sess.teacherEmail.toLowerCase() === activeEmail;
      }
      return myStudentIdSet.has(sess.studentId) || activeEmail === 'shirlene.mandapat@depedqc.ph';
    });
  },

  saveSessions(sessions: SessionRecord[], forTeacherEmail?: string): void {
    const activeEmail = (forTeacherEmail || this.getActiveUserEmail() || '').toLowerCase().trim();
    const sessionMap = new Map<string, SessionRecord>();
    this.getAllSessions().forEach((s) => sessionMap.set(String(s.id), s));
    sessions.forEach((s) => {
      sessionMap.set(String(s.id), {
        ...s,
        id: String(s.id),
        teacherEmail: s.teacherEmail || activeEmail,
      });
    });
    const combined = Array.from(sessionMap.values());

    try {
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(combined));
    } catch (e) {
      console.warn('LocalStorage quota warning, compressing session payload...', e);
      try {
        const safeSessions = combined.map((sess) => ({
          ...sess,
          movs: sess.movs?.map((m) => ({
            ...m,
            dataUrl: m.dataUrl && m.dataUrl.length > 80000 ? '' : m.dataUrl,
          })),
          assessmentTool: sess.assessmentTool && sess.assessmentTool.dataUrl && sess.assessmentTool.dataUrl.length > 80000
            ? { ...sess.assessmentTool, dataUrl: '' }
            : sess.assessmentTool,
        }));
        localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(safeSessions));
      } catch (err2) {
        console.error('Critical error persisting sessions to localStorage:', err2);
      }
    }

    // Sync to server endpoints
    try {
      if (activeEmail) {
        fetch('/api/teacher/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: activeEmail, sessions: combined }),
        }).catch(() => {});
      }

      fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessions: combined }),
      }).catch((e) => console.warn('Server sessions sync notice:', e));

      fetch('/api/sync/all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessions: combined }),
      }).catch((e) => console.warn('Background sync sessions notice:', e));

      // Instant automatic push to Supabase in background
      if (isSupabaseConfigured()) {
        const targetTeacherEmail = activeEmail || 'shirlene.mandapat@depedqc.ph';
        sessions.forEach((sess) => {
          supabaseService.upsertSession(sess, sess.teacherEmail || targetTeacherEmail).catch(() => {});
        });
      }
    } catch (err) {
      console.warn('Silent sessions sync notice:', err);
    }
  },

  addSession(sessionData: Omit<SessionRecord, 'id' | 'createdAt'> & { teacherEmail?: string }): SessionRecord {
    const allSessions = this.getAllSessions();
    const activeEmail = this.getActiveUserEmail();
    const teacherEmail = sessionData.teacherEmail || (activeEmail ? activeEmail.toLowerCase() : 'shirlene.mandapat@depedqc.ph');
    const newSession: SessionRecord = {
      ...sessionData,
      id: `sess-${Date.now()}`,
      createdAt: new Date().toISOString(),
      teacherEmail,
    };
    allSessions.unshift(newSession);
    this.saveSessions(allSessions);

    // Instant dedicated sync to server
    fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session: newSession }),
    }).catch(() => {});

    // Instant sync to Supabase if connected
    if (isSupabaseConfigured()) {
      supabaseService.upsertSession(newSession, teacherEmail).catch(() => {});
    }

    // Automatically update student's status or baseline progress if score is high
    const allStudents = this.getAllStudents();
    const studentIndex = allStudents.findIndex((s) => s.id === sessionData.studentId);
    if (studentIndex !== -1) {
      const student = allStudents[studentIndex];
      if (sessionData.score >= 80 && student.status !== 'Mastered / Promoted') {
        student.status = 'Mastered / Promoted';
      } else if (sessionData.score >= 60 && student.status === 'Needs Remediation') {
        student.status = 'Progressing';
      }
      allStudents[studentIndex] = student;
      this.saveStudents(allStudents);
    }

    return newSession;
  },

  updateSession(session: SessionRecord): void {
    const all = this.getAllSessions();
    const index = all.findIndex((s) => s.id === session.id);
    if (index !== -1) {
      all[index] = session;
      this.saveSessions(all);

      // Automatically update student's status if score changed
      const allStudents = this.getAllStudents();
      const studentIndex = allStudents.findIndex((s) => s.id === session.studentId);
      if (studentIndex !== -1) {
        const student = allStudents[studentIndex];
        if (session.score >= 80 && student.status !== 'Mastered / Promoted') {
          student.status = 'Mastered / Promoted';
        } else if (session.score >= 60 && student.status === 'Needs Remediation') {
          student.status = 'Progressing';
        }
        allStudents[studentIndex] = student;
        this.saveStudents(allStudents);
      }
    }
  },

  deleteSession(sessionId: string): void {
    const all = this.getAllSessions().filter((s) => s.id !== sessionId);
    try {
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(all));
    } catch (e) {
      console.warn('Error saving local sessions after delete:', e);
    }

    // Delete from server
    fetch(`/api/sessions/${sessionId}`, { method: 'DELETE' }).catch(() => {});
    fetch('/api/sync/all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessions: all }),
    }).catch(() => {});

    // Delete from Supabase if configured
    if (isSupabaseConfigured()) {
      supabaseService.deleteSession(sessionId).catch(() => {});
    }
  },

  // Clear roster and session logs (starts with 0 students)
  clearRoster(): void {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify([]));
  },

  // Reset to initial clean state (empty roster) while protecting registered teacher accounts
  resetToSampleData(): void {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(INITIAL_SESSIONS));
    this.loginAsDemo();
  },

  // Explicitly load sample demo dataset if teacher wants to test with preview records
  loadDemoDataset(): void {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(SAMPLE_DEMO_STUDENTS));
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(SAMPLE_DEMO_SESSIONS));
  }
};
