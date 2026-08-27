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

    // Clean up any legacy prefilled demo faculty accounts from storage
    const legacyMockTeachers = [
      'eduardo.reyes@depedqc.ph',
      'maria.santos@depedqc.ph',
      'juan.delacruz@depedqc.ph',
      'corazon.santos@depedqc.ph',
    ];
    let changed = false;
    legacyMockTeachers.forEach((email) => {
      if (accounts[email.toLowerCase()]) {
        delete accounts[email.toLowerCase()];
        changed = true;
      }
    });

    if (changed || !localStorage.getItem(STORAGE_KEYS.REGISTERED_ACCOUNTS)) {
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

  adminUpdateTeacher(adminEmail: string, targetEmail: string, updates: Partial<TeacherProfile>): { success: boolean; profile?: TeacherProfile; message: string } {
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

  adminToggleAccountStatus(adminEmail: string, targetEmail: string, status: 'Active' | 'Inactive'): { success: boolean; message: string } {
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
        return JSON.parse(data);
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

  saveSystemSettings(adminEmail: string, settings: SystemSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SYSTEM_SETTINGS, JSON.stringify(settings));
      this.addAuditLog(
        adminEmail,
        'UPDATE_SETTINGS',
        `Updated school & system settings: ${settings.schoolName}, SY ${settings.schoolYear || settings.academicYear || '2025-2026'} (${settings.currentQuarter}).`
      );
    } catch (e) {
      console.error('Error saving system settings', e);
    }
  },

  saveSettings(adminEmail: string, settings: Partial<SystemSettings>): void {
    const existing = this.getSystemSettings();
    const updated: SystemSettings = { ...existing, ...settings };
    this.saveSystemSettings(adminEmail, updated);
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
      }
    } catch (e) {
      console.error('Error saving teacher profile', e);
    }
  },

  isLoggedIn(): boolean {
    return localStorage.getItem(STORAGE_KEYS.AUTH_SESSION) === 'true';
  },

  setLoggedIn(isLoggedIn: boolean): void {
    if (isLoggedIn) {
      localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, 'true');
    } else {
      localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
    }
  },

  // Setup/Register password for teacher on first login or profile update
  setPassword(email: string, password: string, additionalDetails?: Partial<TeacherProfile>): TeacherProfile {
    const norm = email.trim().toLowerCase();
    const existing = this.findAccountByEmail(norm);
    const isAdmin = norm === DEFAULT_ADMIN_ACCOUNT.email.toLowerCase() || norm === 'admin@projectsmile';
    const isShirlene = norm === INITIAL_TEACHER.email.toLowerCase();
    
    const newProfile: TeacherProfile = {
      ...INITIAL_TEACHER,
      ...(existing || {}),
      ...(additionalDetails || {}),
      email: email.trim(),
      passwordHash: password,
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

    return newProfile;
  },

  verifyPassword(email: string, password: string): { success: boolean; profile?: TeacherProfile; message?: string } {
    if (!email || !password) {
      return { success: false, message: 'Please provide both email and password.' };
    }

    const norm = email.trim().toLowerCase();
    const accounts = this.getRegisteredAccounts();
    const account = accounts[norm];

    // Check specific registered account
    if (account) {
      if (account.passwordHash === password) {
        // Successful login
        account.lastLoginAt = new Date().toLocaleString();
        accounts[norm] = account;
        this.saveRegisteredAccounts(accounts);

        localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_EMAIL, norm);
        localStorage.setItem(STORAGE_KEYS.LAST_LOGIN_EMAIL, email.trim());
        this.saveTeacherProfile(account);
        this.setLoggedIn(true);
        return { success: true, profile: account };
      } else {
        return { success: false, message: 'Incorrect password. Please re-enter or contact your Department Admin to reset your password.' };
      }
    }

    // Check Admin Account Fallback if not yet customized
    if (norm === DEFAULT_ADMIN_ACCOUNT.email.toLowerCase() && (password === 'admin2025' || password === DEFAULT_ADMIN_ACCOUNT.passwordHash)) {
      const adminProf = { ...DEFAULT_ADMIN_ACCOUNT, role: 'admin' as const, passwordHash: password, isPasswordSet: true, lastLoginAt: new Date().toLocaleString() };
      accounts[norm] = adminProf;
      this.saveRegisteredAccounts(accounts);
      localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_EMAIL, norm);
      localStorage.setItem(STORAGE_KEYS.LAST_LOGIN_EMAIL, email.trim());
      this.saveTeacherProfile(adminProf);
      this.setLoggedIn(true);
      return { success: true, profile: adminProf };
    }

    // Check default sample teacher
    if (norm === INITIAL_TEACHER.email.toLowerCase() && (password === INITIAL_TEACHER.passwordHash || password === 'teacher123')) {
      const demoProf = { ...INITIAL_TEACHER, role: 'teacher' as const, passwordHash: password, isPasswordSet: true, lastLoginAt: new Date().toLocaleString() };
      accounts[norm] = demoProf;
      this.saveRegisteredAccounts(accounts);
      localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_EMAIL, norm);
      localStorage.setItem(STORAGE_KEYS.LAST_LOGIN_EMAIL, email.trim());
      this.saveTeacherProfile(demoProf);
      this.setLoggedIn(true);
      return { success: true, profile: demoProf };
    }

    return {
      success: false,
      message: `Account "${email}" is not yet registered. Please click "Register / Setup" to create your teacher profile, or login as admin@projectsmile.`,
    };
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
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_USER_EMAIL);
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

  // --- STUDENTS ---
  getStudents(): Student[] {
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

  saveStudents(students: Student[]): void {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  },

  addStudent(studentData: Omit<Student, 'id' | 'enrolledDate' | 'status'> & { status?: Student['status'] }): Student {
    const students = this.getStudents();
    const newStudent: Student = {
      ...studentData,
      id: `stud-${Date.now()}`,
      enrolledDate: new Date().toISOString().split('T')[0],
      status: studentData.status || (studentData.baselineScore >= 80 ? 'Mastered / Promoted' : studentData.baselineScore >= 60 ? 'Progressing' : 'Needs Remediation'),
    };
    students.unshift(newStudent);
    this.saveStudents(students);
    return newStudent;
  },

  updateStudent(student: Student): void {
    const students = this.getStudents();
    const index = students.findIndex((s) => s.id === student.id);
    if (index !== -1) {
      students[index] = student;
      this.saveStudents(students);
    }
  },

  archiveStudent(studentId: string): void {
    const students = this.getStudents();
    const index = students.findIndex((s) => s.id === studentId);
    if (index !== -1) {
      students[index].isArchived = true;
      students[index].archivedAt = new Date().toISOString();
      this.saveStudents(students);
    }
  },

  unarchiveStudent(studentId: string): void {
    const students = this.getStudents();
    const index = students.findIndex((s) => s.id === studentId);
    if (index !== -1) {
      students[index].isArchived = false;
      delete students[index].archivedAt;
      this.saveStudents(students);
    }
  },

  archiveSection(sectionName: string): void {
    const students = this.getStudents();
    const updated = students.map((s) => {
      if (s.section === sectionName || `${s.gradeLevel} - ${s.section}` === sectionName) {
        return { ...s, isArchived: true, archivedAt: new Date().toISOString() };
      }
      return s;
    });
    this.saveStudents(updated);
  },

  unarchiveSection(sectionName: string): void {
    const students = this.getStudents();
    const updated = students.map((s) => {
      if (s.section === sectionName || `${s.gradeLevel} - ${s.section}` === sectionName) {
        const copy = { ...s, isArchived: false };
        delete copy.archivedAt;
        return copy;
      }
      return s;
    });
    this.saveStudents(updated);
  },

  deleteSection(sectionName: string): void {
    const students = this.getStudents();
    const targetStudentIds = students
      .filter((s) => s.section === sectionName || `${s.gradeLevel} - ${s.section}` === sectionName)
      .map((s) => s.id);
    
    const remainingStudents = students.filter(
      (s) => s.section !== sectionName && `${s.gradeLevel} - ${s.section}` !== sectionName
    );
    this.saveStudents(remainingStudents);

    // Also remove sessions for those students
    const sessions = this.getSessions().filter((sess) => !targetStudentIds.includes(sess.studentId));
    this.saveSessions(sessions);
  },

  deleteStudent(studentId: string): void {
    const students = this.getStudents().filter((s) => s.id !== studentId);
    this.saveStudents(students);
    
    // Also delete associated sessions
    const sessions = this.getSessions().filter((sess) => sess.studentId !== studentId);
    this.saveSessions(sessions);
  },

  deleteAllArchived(): void {
    const students = this.getStudents();
    const archivedIds = students.filter((s) => s.isArchived).map((s) => s.id);
    const remaining = students.filter((s) => !s.isArchived);
    this.saveStudents(remaining);

    // Also remove sessions for archived students
    const sessions = this.getSessions().filter((sess) => !archivedIds.includes(sess.studentId));
    this.saveSessions(sessions);
  },

  // --- SESSIONS ---
  getSessions(): SessionRecord[] {
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

  saveSessions(sessions: SessionRecord[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    } catch (e) {
      console.warn('LocalStorage quota warning, compressing session payload...', e);
      try {
        // Fallback: strip heavy base64 strings if storage limit is reached so session data is never lost
        const safeSessions = sessions.map((sess) => ({
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
  },

  addSession(sessionData: Omit<SessionRecord, 'id' | 'createdAt'>): SessionRecord {
    const sessions = this.getSessions();
    const newSession: SessionRecord = {
      ...sessionData,
      id: `sess-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    sessions.unshift(newSession);
    this.saveSessions(sessions);

    // Automatically update student's status or baseline progress if score is high
    const students = this.getStudents();
    const studentIndex = students.findIndex((s) => s.id === sessionData.studentId);
    if (studentIndex !== -1) {
      const student = students[studentIndex];
      if (sessionData.score >= 80 && student.status !== 'Mastered / Promoted') {
        student.status = 'Mastered / Promoted';
      } else if (sessionData.score >= 60 && student.status === 'Needs Remediation') {
        student.status = 'Progressing';
      }
      students[studentIndex] = student;
      this.saveStudents(students);
    }

    return newSession;
  },

  deleteSession(sessionId: string): void {
    const sessions = this.getSessions().filter((s) => s.id !== sessionId);
    this.saveSessions(sessions);
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
