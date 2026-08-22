import { TeacherProfile, Student, SessionRecord, ProgramType } from '../types';
import { INITIAL_TEACHER, INITIAL_STUDENTS, INITIAL_SESSIONS, SAMPLE_DEMO_STUDENTS, SAMPLE_DEMO_SESSIONS } from '../data/mockData';

const STORAGE_KEYS = {
  TEACHER: 'remediation_app_teacher',
  AUTH_SESSION: 'remediation_app_session',
  STUDENTS: 'remediation_app_students',
  SESSIONS: 'remediation_app_sessions',
  REGISTERED_ACCOUNTS: 'remediation_app_registered_accounts_v2',
  ACTIVE_USER_EMAIL: 'remediation_app_active_email',
  LAST_LOGIN_EMAIL: 'remediation_app_last_login_email',
};

export const storage = {
  // --- MULTI-ACCOUNT MANAGEMENT ---
  getRegisteredAccounts(): Record<string, TeacherProfile> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.REGISTERED_ACCOUNTS);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Error reading registered accounts', e);
    }
    
    // Auto-migrate any existing single teacher profile into registered accounts
    const accounts: Record<string, TeacherProfile> = {};
    try {
      const singleTeacherData = localStorage.getItem(STORAGE_KEYS.TEACHER);
      if (singleTeacherData) {
        const parsed: TeacherProfile = JSON.parse(singleTeacherData);
        if (parsed.email && parsed.isPasswordSet && parsed.passwordHash) {
          const norm = parsed.email.trim().toLowerCase();
          accounts[norm] = { ...parsed };
        }
      }
    } catch {
      // ignore migration error
    }

    // Also register default master teacher
    const defaultNorm = INITIAL_TEACHER.email.trim().toLowerCase();
    if (!accounts[defaultNorm]) {
      accounts[defaultNorm] = {
        ...INITIAL_TEACHER,
        passwordHash: INITIAL_TEACHER.passwordHash || 'teacher123',
        isPasswordSet: true,
      };
    }

    localStorage.setItem(STORAGE_KEYS.REGISTERED_ACCOUNTS, JSON.stringify(accounts));
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
    
    const newProfile: TeacherProfile = {
      ...INITIAL_TEACHER,
      ...(existing || {}),
      ...(additionalDetails || {}),
      email: email.trim(),
      passwordHash: password,
      isPasswordSet: true,
      name: additionalDetails?.name || existing?.name || INITIAL_TEACHER.name,
      title: additionalDetails?.title || existing?.title || INITIAL_TEACHER.title,
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

    if (account) {
      if (account.passwordHash === password) {
        // Successful login
        localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_EMAIL, norm);
        localStorage.setItem(STORAGE_KEYS.LAST_LOGIN_EMAIL, email.trim());
        this.saveTeacherProfile(account);
        this.setLoggedIn(true);
        return { success: true, profile: account };
      } else {
        return { success: false, message: 'Incorrect password for this account. Please verify or reset your password.' };
      }
    }

    // If email is not in registered dictionary, check fallback demo/sample account
    if (norm === INITIAL_TEACHER.email.toLowerCase() && (password === INITIAL_TEACHER.passwordHash || password === 'teacher123')) {
      const demoProf = { ...INITIAL_TEACHER, passwordHash: password, isPasswordSet: true };
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
      message: `Account "${email}" is not yet registered. Please click "Register / First Time Setup" to create your password.`,
    };
  },

  // Safe Quick Demo Login without wiping or corrupting registered teacher accounts
  loginAsDemo(): TeacherProfile {
    const demoProfile: TeacherProfile = {
      ...INITIAL_TEACHER,
      email: 'shirlene.mandapat@depedqc.ph',
      isPasswordSet: true,
      passwordHash: 'teacher123',
    };

    localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_EMAIL, 'shirlene.mandapat@depedqc.ph');
    this.saveTeacherProfile(demoProfile);
    this.setLoggedIn(true);

    // If students roster is completely empty, populate demo dataset for realistic preview
    try {
      const currentStudents = this.getStudents();
      if (!currentStudents || currentStudents.length === 0) {
        this.loadDemoDataset();
      }
    } catch {
      // ignore
    }

    return demoProfile;
  },

  logout(): void {
    this.setLoggedIn(false);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_USER_EMAIL);
  },

  // --- STUDENTS ---
  getStudents(): Student[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      if (data) {
        const list: Student[] = JSON.parse(data);
        // Sanitize any legacy 'Intervention' programType to 'Remediation'
        const sanitized = list.map((s) => ({
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
        // Sanitize legacy records
        const sanitized = list.map((s) => ({
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
