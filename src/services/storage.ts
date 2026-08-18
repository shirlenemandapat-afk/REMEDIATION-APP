import { TeacherProfile, Student, SessionRecord, ProgramType } from '../types';
import { INITIAL_TEACHER, INITIAL_STUDENTS, INITIAL_SESSIONS, SAMPLE_DEMO_STUDENTS, SAMPLE_DEMO_SESSIONS } from '../data/mockData';

const STORAGE_KEYS = {
  TEACHER: 'remediation_app_teacher',
  AUTH_SESSION: 'remediation_app_session',
  STUDENTS: 'remediation_app_students',
  SESSIONS: 'remediation_app_sessions',
};

export const storage = {
  // --- TEACHER & AUTH ---
  getTeacherProfile(): TeacherProfile {
    try {
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
    localStorage.setItem(STORAGE_KEYS.TEACHER, JSON.stringify(profile));
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

  // Setup password for teacher on first login or reset
  setPassword(email: string, password: string): TeacherProfile {
    const profile = this.getTeacherProfile();
    profile.email = email;
    profile.passwordHash = password; // In production this would be hashed
    profile.isPasswordSet = true;
    this.saveTeacherProfile(profile);
    this.setLoggedIn(true);
    return profile;
  },

  verifyPassword(email: string, password: string): boolean {
    const profile = this.getTeacherProfile();
    if (profile.email.toLowerCase() === email.toLowerCase() && profile.passwordHash === password) {
      this.setLoggedIn(true);
      return true;
    }
    return false;
  },

  logout(): void {
    this.setLoggedIn(false);
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

  // Reset to initial clean state (empty roster)
  resetToSampleData(): void {
    localStorage.setItem(STORAGE_KEYS.TEACHER, JSON.stringify(INITIAL_TEACHER));
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(INITIAL_SESSIONS));
    this.setLoggedIn(true);
  },

  // Explicitly load sample demo dataset if teacher wants to test with preview records
  loadDemoDataset(): void {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(SAMPLE_DEMO_STUDENTS));
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(SAMPLE_DEMO_SESSIONS));
  }
};
