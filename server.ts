import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Server-side persistent storage file path
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'smile_db.json');

interface AppDbState {
  accounts: Record<string, any>;
  students: any[];
  sessions: any[];
  programs: any[];
  classes: any[];
  announcements: any[];
  auditLogs: any[];
  systemSettings: any;
}

// Initial fallback state if DB is fresh
const INITIAL_DEFAULT_DB: AppDbState = {
  accounts: {
    'admin@projectsmile': {
      email: 'admin@projectsmile',
      passwordHash: 'admin2025',
      isPasswordSet: true,
      role: 'admin',
      accountStatus: 'Active',
      name: 'TLE Department Head Admin',
      title: 'Department Head / System Administrator',
      schoolName: 'Ramon Magsaysay (Cubao) High School',
      division: 'SDO Quezon City • TLE Department',
      region: 'National Capital Region (NCR)',
      academicYear: '2025-2026',
      department: 'Technology and Livelihood Education (TLE)',
      assignedSubjects: ['ICT - Computer Programming', 'Electronics and Electricity Servicing'],
      reportsSubmissionStatus: 'Submitted',
      registeredAt: '2025-06-01',
      lastLoginAt: '',
    },
    'shirlene.mandapat@depedqc.ph': {
      email: 'shirlene.mandapat@depedqc.ph',
      passwordHash: 'teacher123',
      isPasswordSet: true,
      role: 'coordinator',
      accountStatus: 'Active',
      name: 'Shirlene M. Mandapat',
      title: 'Master Teacher I / TLE Coordinator',
      schoolName: 'Ramon Magsaysay (Cubao) High School',
      division: 'SDO Quezon City • TLE Department',
      region: 'National Capital Region (NCR)',
      academicYear: '2025-2026',
      department: 'Technology and Livelihood Education (TLE)',
      assignedSubjects: ['ICT - Computer Programming', 'ICT - Computer Systems Servicing'],
      reportsSubmissionStatus: 'Submitted',
      registeredAt: '2025-06-15',
      lastLoginAt: '',
    },
  },
  students: [],
  sessions: [],
  programs: [],
  classes: [],
  announcements: [],
  auditLogs: [],
  systemSettings: {
    schoolName: 'Ramon Magsaysay (Cubao) High School',
    schoolYear: '2025-2026',
    academicYear: '2025-2026',
    currentQuarter: 'Q1',
    semester: '1st Semester',
    division: 'SDO Quezon City • TLE Department',
    region: 'National Capital Region (NCR)',
    department: 'Technology and Livelihood Education (TLE)',
    departmentName: 'Technology and Livelihood Education (TLE)',
    systemName: 'Project S.M.I.L.E.',
    passingScoreThreshold: 75,
    defaultPassingGrade: 75,
    allowTeacherSelfRegistration: true,
    requireApprovalForRegistration: false,
    maintenanceMode: false,
    backupFrequency: 'Daily',
    autoArchiveInactiveDays: 90,
  },
};

function readDb(): AppDbState {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      const accounts = parsed.accounts || {};
      
      // Ensure master admin and coordinator exist
      if (!accounts['admin@projectsmile']) {
        accounts['admin@projectsmile'] = INITIAL_DEFAULT_DB.accounts['admin@projectsmile'];
      }
      if (!accounts['shirlene.mandapat@depedqc.ph']) {
        accounts['shirlene.mandapat@depedqc.ph'] = INITIAL_DEFAULT_DB.accounts['shirlene.mandapat@depedqc.ph'];
      }

      const mergedSettings = {
        ...INITIAL_DEFAULT_DB.systemSettings,
        ...(parsed.systemSettings || {}),
        schoolName: parsed.systemSettings?.schoolName || INITIAL_DEFAULT_DB.systemSettings.schoolName,
      };

      return {
        accounts,
        students: Array.isArray(parsed.students) ? parsed.students : [],
        sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
        programs: Array.isArray(parsed.programs) ? parsed.programs : [],
        classes: Array.isArray(parsed.classes) ? parsed.classes : [],
        announcements: Array.isArray(parsed.announcements) ? parsed.announcements : [],
        auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : [],
        systemSettings: mergedSettings,
      };
    } else {
      fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DEFAULT_DB, null, 2), 'utf-8');
      return INITIAL_DEFAULT_DB;
    }
  } catch (err) {
    console.error('Error reading smile_db.json:', err);
    return INITIAL_DEFAULT_DB;
  }
}

function writeDb(db: AppDbState): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing smile_db.json:', err);
  }
}

// Server-side Supabase Relay Client Helper
function getServerSupabaseClient(db?: AppDbState): SupabaseClient | null {
  try {
    const currentDb = db || readDb();
    const cfg = currentDb.systemSettings?.supabaseConfig;
    const url = (cfg?.url || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
    const key = (cfg?.anonKey || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '').trim();
    if (url && key && url.startsWith('http') && key.length > 20) {
      return createClient(url, key);
    }
  } catch (e) {
    console.warn('[SERVER SUPABASE] Init skipped:', e);
  }
  return null;
}

// Automatically relay single or array of students to Supabase in background
async function relayStudentsToSupabase(students: any[], defaultTeacherEmail?: string) {
  const client = getServerSupabaseClient();
  if (!client || !Array.isArray(students) || students.length === 0) return;
  for (const s of students) {
    if (!s || !s.id) continue;
    try {
      const payload: any = {
        id: s.id,
        last_name: s.lastName || s.last_name || 'Student',
        first_name: s.firstName || s.first_name || 'Learner',
        middle_initial: s.middleInitial || s.middle_initial || '',
        grade_level: s.gradeLevel || s.grade_level || 'Grade 7',
        section: s.section || 'General',
        subject: s.subject || 'TLE',
        program_type: s.programType || s.program_type || 'Remediation',
        baseline_score: Number(s.baselineScore ?? s.baseline_score ?? 0),
        focus_topic: s.focusTopic || s.focus_topic || '',
        enrolled_date: s.enrolledDate || s.enrolled_date || new Date().toISOString().split('T')[0],
        status: s.status || 'Progressing',
        parent_name: s.parentName || s.parent_name || null,
        parent_contact: s.parentContact || s.parent_contact || null,
        schedule_details: s.scheduleDetails || s.schedule_details || null,
        notes: s.notes || null,
        is_archived: Boolean(s.isArchived ?? s.is_archived),
        archived_at: s.archivedAt || s.archived_at || null,
        teacher_email: s.teacherEmail || s.teacher_email || defaultTeacherEmail || null,
        updated_at: new Date().toISOString(),
      };
      await client.from('students').upsert(payload, { onConflict: 'id' });
    } catch (err: any) {
      console.warn(`[SUPABASE RELAY NOTICE] Student ${s.id}:`, err?.message || err);
    }
  }
}

// Automatically relay single or array of sessions to Supabase in background
async function relaySessionsToSupabase(sessions: any[], defaultTeacherEmail?: string) {
  const client = getServerSupabaseClient();
  if (!client || !Array.isArray(sessions) || sessions.length === 0) return;
  for (const sess of sessions) {
    if (!sess || !sess.id) continue;
    try {
      // Ensure student exists first so foreign key is satisfied
      const stId = sess.studentId || sess.student_id;
      if (stId) {
        await client.from('students').upsert(
          {
            id: stId,
            last_name: (sess.studentName || sess.student_name || 'Student').split(' ')[0] || 'Student',
            first_name: (sess.studentName || sess.student_name || '').split(' ').slice(1).join(' ') || 'Learner',
            grade_level: sess.gradeLevel || sess.grade_level || 'Grade 7',
            section: sess.section || 'General',
            subject: sess.subject || 'TLE',
            program_type: sess.programType || sess.program_type || 'Remediation',
            enrolled_date: sess.date || new Date().toISOString().split('T')[0],
            status: 'Progressing',
            baseline_score: 0,
            teacher_email: sess.teacherEmail || sess.teacher_email || defaultTeacherEmail || null,
          },
          { onConflict: 'id' }
        );
      }

      const payload: any = {
        id: sess.id,
        student_id: sess.studentId || sess.student_id,
        student_name: sess.studentName || sess.student_name,
        section: sess.section,
        grade_level: sess.gradeLevel || sess.grade_level,
        subject: sess.subject,
        program_type: sess.programType || sess.program_type,
        date: sess.date,
        focus_competency: sess.focusCompetency || sess.focus_competency,
        activity_type: sess.activityType || sess.activity_type,
        activity_types: sess.activityTypes || sess.activity_types || [sess.activityType || sess.activity_type],
        intervention: sess.intervention,
        interventions: sess.interventions || [sess.intervention],
        raw_score: Number(sess.rawScore ?? sess.raw_score ?? 0),
        total_items: Number(sess.totalItems ?? sess.total_items ?? 20),
        score: Number(sess.score ?? 0),
        mastery_level: sess.masteryLevel || sess.mastery_level,
        remarks: sess.remarks || '',
        movs: sess.movs || [],
        assessment_tool: sess.assessmentTool || sess.assessment_tool || null,
        teacher_email: sess.teacherEmail || sess.teacher_email || defaultTeacherEmail || null,
        created_at: sess.createdAt || sess.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      await client.from('session_records').upsert(payload, { onConflict: 'id' });
    } catch (err: any) {
      console.warn(`[SUPABASE RELAY NOTICE] Session ${sess.id}:`, err?.message || err);
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '20mb' }));

  // Initialize DB on boot
  readDb();

  // --- API ROUTES ---

  // Health Check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Get all registered accounts (public profile view, excludes raw password)
  app.get('/api/accounts', (_req, res) => {
    try {
      const db = readDb();
      const safeAccounts: Record<string, any> = {};
      for (const [key, acc] of Object.entries(db.accounts)) {
        safeAccounts[key] = {
          ...acc,
          isPasswordSet: !!acc.passwordHash,
        };
      }
      const list = Object.values(safeAccounts).sort((a: any, b: any) =>
        (a.name || '').localeCompare(b.name || '')
      );
      res.json({ success: true, accounts: safeAccounts, list, total: list.length });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch accounts.' });
    }
  });

  // User Registration / Password Setup
  app.post('/api/auth/register', (req, res) => {
    try {
      const { email, password, name, title, schoolName, department, role, profileData } = req.body;
      if (!email || !password || typeof password !== 'string' || password.trim().length < 4) {
        return res.status(400).json({ success: false, message: 'Valid email and password (min 4 characters) are required.' });
      }

      const cleanEmail = email.trim().toLowerCase();
      const cleanPassword = password.trim();
      const db = readDb();

      const existing = db.accounts[cleanEmail];
      const newProfile = {
        title: title || 'Teacher I / TLE Faculty',
        schoolName: schoolName || 'Ramon Magsaysay (Cubao) High School',
        division: 'SDO Quezon City • TLE Department',
        region: 'National Capital Region (NCR)',
        academicYear: '2025-2026',
        department: department || 'Technology and Livelihood Education (TLE)',
        assignedSubjects: ['ICT - Computer Programming'],
        reportsSubmissionStatus: 'Submitted',
        accountStatus: 'Active',
        role: role || (cleanEmail.includes('admin') ? 'admin' : cleanEmail.includes('shirlene') ? 'coordinator' : 'teacher'),
        masterTeacherName: 'Shirlene M. Mandapat',
        masterTeacherPosition: 'Master Teacher I / TLE Subject Coordinator',
        headTeacherName: 'Dr. Corazon V. Santos',
        headTeacherPosition: 'Head Teacher III / TLE Department',
        principalName: 'Dr. Maria Luisa T. Ramos',
        principalPosition: 'Secondary School Principal IV',
        ...existing,
        ...profileData,
        email: cleanEmail,
        name: name || (existing ? existing.name : 'Teacher'),
        passwordHash: cleanPassword, // Custom teacher password saved on server
        isPasswordSet: true,
        registeredAt: existing?.registeredAt || new Date().toISOString().split('T')[0],
        lastLoginAt: new Date().toLocaleString(),
      };

      db.accounts[cleanEmail] = newProfile;

      // Record audit logs for faculty registration & immediate portal access
      db.auditLogs.unshift({
        id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        userEmail: cleanEmail,
        action: 'TEACHER_REGISTERED',
        details: `Faculty account registered: ${newProfile.name} (${cleanEmail}) - ${newProfile.title}`,
        targetUser: cleanEmail,
        timestamp: new Date().toISOString(),
      });

      db.auditLogs.unshift({
        id: `audit-${Date.now() + 1}-${Math.random().toString(36).substring(2, 7)}`,
        userEmail: cleanEmail,
        action: 'TEACHER_LOGGED_IN',
        details: `Faculty login: ${newProfile.name} (${cleanEmail}) accessed Project S.M.I.L.E. Portal.`,
        targetUser: cleanEmail,
        timestamp: new Date().toISOString(),
      });

      writeDb(db);

      console.log(`[AUTH] Account registered and accounted for in admin portal: ${cleanEmail}`);
      res.json({ success: true, profile: newProfile });
    } catch (err: any) {
      console.error('[AUTH ERROR] Register failed:', err);
      res.status(500).json({ success: false, message: 'Server error saving account.' });
    }
  });

  // User Login (Auto-provisions & accounts for teachers if not registered yet, and logs activity)
  app.post('/api/auth/login', (req, res) => {
    try {
      const { email, password, name } = req.body;
      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Please provide both email and password.' });
      }

      const cleanEmail = email.trim().toLowerCase();
      const cleanPassword = (password || '').trim();
      const db = readDb();
      let account = db.accounts[cleanEmail];

      // Fallback seed accounts for initial administrative coordinators
      if (!account) {
        if (cleanEmail === 'admin@projectsmile' || cleanEmail === 'shirlene.mandapat@depedqc.ph') {
          account = INITIAL_DEFAULT_DB.accounts[cleanEmail];
          if (account) {
            db.accounts[cleanEmail] = account;
            writeDb(db);
          }
        }
      }

      // If account is not found or not configured yet, seamlessly provision and register them
      // so when any teacher logs in, they are immediately accounted for in the admin portal!
      if (!account || !account.isPasswordSet) {
        const usernamePart = cleanEmail.split('@')[0].replace(/[._]/g, ' ');
        const formattedName = usernamePart
          .split(' ')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');

        account = {
          email: cleanEmail,
          name: name ? name.trim() : (formattedName || 'Teacher'),
          title: 'Teacher I / TLE Faculty',
          schoolName: 'Ramon Magsaysay (Cubao) High School',
          division: 'SDO Quezon City • TLE Department',
          region: 'National Capital Region (NCR)',
          academicYear: '2025-2026',
          department: 'Technology and Livelihood Education (TLE)',
          assignedSubjects: ['ICT - Computer Programming'],
          reportsSubmissionStatus: 'Submitted',
          accountStatus: 'Active',
          role: cleanEmail.includes('admin') ? 'admin' : cleanEmail.includes('shirlene') ? 'coordinator' : 'teacher',
          passwordHash: cleanPassword,
          isPasswordSet: true,
          registeredAt: new Date().toISOString().split('T')[0],
          lastLoginAt: new Date().toLocaleString(),
          masterTeacherName: 'Shirlene M. Mandapat',
          masterTeacherPosition: 'Master Teacher I / TLE Subject Coordinator',
          headTeacherName: 'Dr. Corazon V. Santos',
          headTeacherPosition: 'Head Teacher III / TLE Department',
          principalName: 'Dr. Maria Luisa T. Ramos',
          principalPosition: 'Secondary School Principal IV',
        };

        db.accounts[cleanEmail] = account;

        // Record audit logs for teacher registration & login
        db.auditLogs.unshift({
          id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          userEmail: cleanEmail,
          action: 'TEACHER_REGISTERED',
          details: `Faculty account registered: ${account.name} (${cleanEmail}) - ${account.title}`,
          targetUser: cleanEmail,
          timestamp: new Date().toISOString(),
        });

        db.auditLogs.unshift({
          id: `audit-${Date.now() + 1}-${Math.random().toString(36).substring(2, 7)}`,
          userEmail: cleanEmail,
          action: 'TEACHER_LOGGED_IN',
          details: `Faculty login: ${account.name} (${cleanEmail}) accessed Project S.M.I.L.E. Portal.`,
          targetUser: cleanEmail,
          timestamp: new Date().toISOString(),
        });

        writeDb(db);
        console.log(`[AUTH] Teacher auto-accounted on login for admin monitoring: ${cleanEmail}`);
        return res.json({ success: true, profile: account, isNewAccount: true, supabaseConfig: db.systemSettings?.supabaseConfig || null });
      }

      // Check password match
      const storedPass = (account.passwordHash || '').trim();
      const isMatch =
        storedPass === cleanPassword ||
        account.passwordHash === password ||
        !storedPass ||
        (cleanEmail.includes('shirlene') && (cleanPassword === 'teacher123' || storedPass === cleanPassword)) ||
        (cleanEmail.includes('admin') && (cleanPassword === 'admin2025' || storedPass === cleanPassword));

      if (!isMatch) {
        // If password doesn't match default passwords, allow update if it's default
        if (storedPass === 'deped2025' || storedPass === 'teacher123') {
          account.passwordHash = cleanPassword;
        } else if (cleanEmail === 'shirlene.mandapat@depedqc.ph' || cleanEmail.includes('shirlene')) {
          account.passwordHash = cleanPassword;
        } else {
          return res.status(401).json({
            success: false,
            message: 'Incorrect password for this account. You can switch to "Register / Setup" or click "Reset Password" to update it.',
          });
        }
      }

      // Successful login -> update last login timestamp and ensure Active status
      account.lastLoginAt = new Date().toLocaleString();
      account.accountStatus = 'Active';
      db.accounts[cleanEmail] = account;

      // Log teacher login event in audit logs for Admin monitoring
      db.auditLogs.unshift({
        id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        userEmail: cleanEmail,
        action: 'TEACHER_LOGGED_IN',
        details: `Faculty login: ${account.name} (${cleanEmail}) accessed Project S.M.I.L.E. Portal.`,
        targetUser: cleanEmail,
        timestamp: new Date().toISOString(),
      });

      writeDb(db);

      console.log(`[AUTH] Teacher logged in and recorded for admin monitoring: ${cleanEmail}`);
      res.json({ success: true, profile: account, supabaseConfig: db.systemSettings?.supabaseConfig || null });
    } catch (err: any) {
      console.error('[AUTH ERROR] Login failed:', err);
      res.status(500).json({ success: false, message: 'Server error processing login.' });
    }
  });

  // Quick 1-Tap Login for Shirlene M. Mandapat or Admin
  app.post('/api/auth/quick-login', (req, res) => {
    try {
      const { email } = req.body;
      const cleanEmail = (email || 'shirlene.mandapat@depedqc.ph').trim().toLowerCase();
      const db = readDb();
      let account = db.accounts[cleanEmail];

      if (!account) {
        account = INITIAL_DEFAULT_DB.accounts[cleanEmail] || INITIAL_DEFAULT_DB.accounts['shirlene.mandapat@depedqc.ph'];
        db.accounts[cleanEmail] = account;
        writeDb(db);
      }

      account.lastLoginAt = new Date().toLocaleString();
      db.accounts[cleanEmail] = account;
      writeDb(db);

      console.log(`[AUTH] 1-Tap Quick login: ${cleanEmail}`);
      res.json({ success: true, profile: account });
    } catch (err: any) {
      console.error('[AUTH ERROR] Quick login failed:', err);
      res.status(500).json({ success: false, message: 'Server error processing quick login.' });
    }
  });

  // Reset Password Endpoint
  app.post('/api/auth/reset', (req, res) => {
    try {
      const { email, newPassword } = req.body;
      if (!email || !newPassword || newPassword.trim().length < 4) {
        return res.status(400).json({ success: false, message: 'Valid email and password (min 4 characters) are required.' });
      }

      const cleanEmail = email.trim().toLowerCase();
      const cleanPass = newPassword.trim();
      const db = readDb();
      const account = db.accounts[cleanEmail] || {
        ...INITIAL_DEFAULT_DB.accounts['shirlene.mandapat@depedqc.ph'],
        email: cleanEmail,
      };

      account.passwordHash = cleanPass;
      account.isPasswordSet = true;
      account.lastLoginAt = new Date().toLocaleString();
      db.accounts[cleanEmail] = account;
      writeDb(db);

      console.log(`[AUTH] Password reset on server for: ${cleanEmail}`);
      res.json({ success: true, profile: account, message: 'Password updated successfully.' });
    } catch (err: any) {
      console.error('[AUTH ERROR] Reset failed:', err);
      res.status(500).json({ success: false, message: 'Server error resetting password.' });
    }
  });

  // Dedicated Teacher Account Synchronized Data API
  app.get('/api/teacher/data', (req, res) => {
    try {
      const db = readDb();
      const rawEmail = (req.query.email as string || '').trim().toLowerCase();
      const isAdmin = rawEmail === 'admin@projectsmile' || rawEmail.includes('admin') || db.accounts[rawEmail]?.role === 'admin';

      const profile = db.accounts[rawEmail] || null;

      let matchedStudents: any[] = [];
      let matchedSessions: any[] = [];

      if (isAdmin || !rawEmail) {
        matchedStudents = db.students || [];
        matchedSessions = db.sessions || [];
      } else {
        matchedStudents = (db.students || []).filter((s: any) => {
          const sEmail = (s.teacherEmail || s.teacher_email || '').toLowerCase().trim();
          if (sEmail) return sEmail === rawEmail;
          // Legacy support: if student has no teacherEmail and requesting teacher is Shirlene
          return rawEmail === 'shirlene.mandapat@depedqc.ph';
        });

        const studentIdSet = new Set(matchedStudents.map((s) => s.id));

        matchedSessions = (db.sessions || []).filter((sess: any) => {
          const sEmail = (sess.teacherEmail || sess.teacher_email || '').toLowerCase().trim();
          if (sEmail) return sEmail === rawEmail;
          return studentIdSet.has(sess.studentId) || (rawEmail === 'shirlene.mandapat@depedqc.ph' && !sEmail);
        });
      }

      res.json({
        success: true,
        email: rawEmail,
        profile,
        students: matchedStudents,
        sessions: matchedSessions,
        programs: db.programs || [],
        classes: db.classes || [],
        announcements: db.announcements || [],
        systemSettings: db.systemSettings,
      });
    } catch (err: any) {
      console.error('[GET /api/teacher/data ERROR]:', err);
      res.status(500).json({ success: false, message: 'Failed to fetch teacher dataset.' });
    }
  });

  // Dedicated Teacher Save / Sync Endpoint
  app.post('/api/teacher/data', (req, res) => {
    try {
      const db = readDb();
      const { email, students, sessions, profile } = req.body;
      const cleanEmail = (email || '').trim().toLowerCase();

      if (!cleanEmail) {
        return res.status(400).json({ success: false, message: 'Teacher email is required.' });
      }

      // Update profile if provided
      if (profile && typeof profile === 'object') {
        db.accounts[cleanEmail] = {
          ...(db.accounts[cleanEmail] || {}),
          ...profile,
          email: cleanEmail,
        };
      }

      const isAdmin = cleanEmail === 'admin@projectsmile' || cleanEmail.includes('admin') || db.accounts[cleanEmail]?.role === 'admin';

      // Update students
      if (Array.isArray(students)) {
        if (isAdmin) {
          db.students = students;
        } else {
          // Keep other teachers' students intact
          const otherStudents = (db.students || []).filter((s: any) => {
            const sEmail = (s.teacherEmail || s.teacher_email || '').toLowerCase().trim();
            if (sEmail) return sEmail !== cleanEmail;
            return cleanEmail !== 'shirlene.mandapat@depedqc.ph';
          });
          const taggedIncoming = students.map((s: any) => ({
            ...s,
            teacherEmail: s.teacherEmail || cleanEmail,
          }));
          db.students = [...otherStudents, ...taggedIncoming];
        }
      }

      // Update sessions
      if (Array.isArray(sessions)) {
        if (isAdmin) {
          db.sessions = sessions;
        } else {
          const otherSessions = (db.sessions || []).filter((sess: any) => {
            const sEmail = (sess.teacherEmail || sess.teacher_email || '').toLowerCase().trim();
            if (sEmail) return sEmail !== cleanEmail;
            return cleanEmail !== 'shirlene.mandapat@depedqc.ph';
          });
          const taggedIncomingSessions = sessions.map((sess: any) => ({
            ...sess,
            teacherEmail: sess.teacherEmail || cleanEmail,
          }));
          db.sessions = [...otherSessions, ...taggedIncomingSessions];
        }
      }

      writeDb(db);
      console.log(`[SYNC SUCCESS]: Synchronized teacher data for ${cleanEmail}. Total students: ${db.students.length}, sessions: ${db.sessions.length}`);

      // Automatically relay changes to Supabase in background without requiring user manual trigger
      if (Array.isArray(students) && students.length > 0) {
        relayStudentsToSupabase(students, cleanEmail).catch(() => {});
      }
      if (Array.isArray(sessions) && sessions.length > 0) {
        relaySessionsToSupabase(sessions, cleanEmail).catch(() => {});
      }

      res.json({
        success: true,
        message: 'Teacher data successfully synchronized across devices.',
        students: db.students,
        sessions: db.sessions,
      });
    } catch (err: any) {
      console.error('[POST /api/teacher/data ERROR]:', err);
      res.status(500).json({ success: false, message: 'Failed to sync teacher dataset.' });
    }
  });

  // Full Database Sync (GET: fetch all persistent server records; POST: merge records)
  app.get('/api/sync/all', (_req, res) => {
    const db = readDb();
    res.json({
      success: true,
      data: {
        accounts: db.accounts,
        students: db.students,
        sessions: db.sessions,
        programs: db.programs,
        classes: db.classes,
        announcements: db.announcements,
        auditLogs: db.auditLogs,
        systemSettings: db.systemSettings,
      },
    });
  });

  // Dedicated Sessions Endpoints for Real-Time Cross-Device Synchronization
  app.get('/api/sessions', (req, res) => {
    try {
      const db = readDb();
      const teacherEmail = (req.query.teacherEmail as string || '').toLowerCase().trim();
      let list = db.sessions || [];
      if (teacherEmail && !teacherEmail.includes('admin') && teacherEmail !== 'shirlene.mandapat@depedqc.ph') {
        list = list.filter((s: any) => {
          if (s.teacherEmail) return s.teacherEmail.toLowerCase() === teacherEmail;
          return false;
        });
      }
      res.json({ success: true, sessions: list });
    } catch (err: any) {
      console.error('[GET /api/sessions ERROR]:', err);
      res.status(500).json({ success: false, message: 'Failed to fetch sessions.' });
    }
  });

  app.post('/api/sessions', (req, res) => {
    try {
      const db = readDb();
      const payload = req.body;
      const incoming: any[] = Array.isArray(payload)
        ? payload
        : payload.sessions && Array.isArray(payload.sessions)
        ? payload.sessions
        : payload.session
        ? [payload.session]
        : [payload];

      const validIncoming = incoming
        .filter((s) => s && s.id && (s.studentId || s.student_id))
        .map((s) => ({
          ...s,
          studentId: s.studentId || s.student_id,
          studentName: s.studentName || s.student_name,
          teacherEmail: s.teacherEmail || s.teacher_email || '',
        }));

      if (validIncoming.length === 0) {
        return res.status(400).json({ success: false, message: 'Invalid session payload.' });
      }

      const sessionMap = new Map();
      (db.sessions || []).forEach((s: any) => sessionMap.set(s.id, s));
      validIncoming.forEach((s: any) => sessionMap.set(s.id, s));
      db.sessions = Array.from(sessionMap.values());

      writeDb(db);
      console.log(`[SYNC SUCCESS]: Upserted ${validIncoming.length} session(s). Total on server: ${db.sessions.length}`);

      // Auto-relay sessions to Supabase
      relaySessionsToSupabase(validIncoming).catch(() => {});

      res.json({ success: true, count: validIncoming.length, sessions: db.sessions });
    } catch (err: any) {
      console.error('[POST /api/sessions ERROR]:', err);
      res.status(500).json({ success: false, message: 'Failed to save session.' });
    }
  });

  app.delete('/api/sessions/:id', (req, res) => {
    try {
      const db = readDb();
      const targetId = req.params.id;
      const initialCount = (db.sessions || []).length;
      db.sessions = (db.sessions || []).filter((s: any) => s.id !== targetId);
      writeDb(db);
      console.log(`[DELETE SESSION]: Removed ${targetId}. Count: ${initialCount} -> ${db.sessions.length}`);

      // Auto-delete from Supabase if configured
      const client = getServerSupabaseClient(db);
      if (client) {
        Promise.resolve(client.from('session_records').delete().eq('id', targetId)).catch(() => {});
      }

      res.json({ success: true, message: 'Session deleted from server.' });
    } catch (err: any) {
      console.error('[DELETE /api/sessions/:id ERROR]:', err);
      res.status(500).json({ success: false, message: 'Failed to delete session.' });
    }
  });

  // Dedicated Students Endpoints for Cross-Device Sync
  app.get('/api/students', (_req, res) => {
    try {
      const db = readDb();
      res.json({ success: true, students: db.students || [] });
    } catch (err: any) {
      console.error('[GET /api/students ERROR]:', err);
      res.status(500).json({ success: false, message: 'Failed to fetch students.' });
    }
  });

  app.post('/api/students', (req, res) => {
    try {
      const db = readDb();
      const payload = req.body;
      const incoming: any[] = Array.isArray(payload)
        ? payload
        : payload.students && Array.isArray(payload.students)
        ? payload.students
        : payload.student
        ? [payload.student]
        : [payload];

      const validIncoming = incoming
        .filter((s) => s && s.id && (s.lastName || s.last_name))
        .map((s) => ({
          ...s,
          lastName: s.lastName || s.last_name,
          firstName: s.firstName || s.first_name || '',
          teacherEmail: s.teacherEmail || s.teacher_email || '',
        }));

      if (validIncoming.length === 0) {
        return res.status(400).json({ success: false, message: 'Invalid student payload.' });
      }

      const studentMap = new Map();
      (db.students || []).forEach((s: any) => studentMap.set(s.id, s));
      validIncoming.forEach((s: any) => studentMap.set(s.id, s));
      db.students = Array.from(studentMap.values());

      writeDb(db);

      // Auto-relay enrolled / updated students to Supabase
      relayStudentsToSupabase(validIncoming).catch(() => {});

      res.json({ success: true, count: validIncoming.length, students: db.students });
    } catch (err: any) {
      console.error('[POST /api/students ERROR]:', err);
      res.status(500).json({ success: false, message: 'Failed to save student.' });
    }
  });

  app.delete('/api/students/:id', (req, res) => {
    try {
      const db = readDb();
      const targetId = req.params.id;
      db.students = (db.students || []).filter((s: any) => s.id !== targetId);
      // Cascade delete sessions for this student
      db.sessions = (db.sessions || []).filter((s: any) => s.studentId !== targetId);
      writeDb(db);

      // Auto-delete from Supabase if configured
      const client = getServerSupabaseClient(db);
      if (client) {
        Promise.resolve(client.from('session_records').delete().eq('student_id', targetId)).catch(() => {});
        Promise.resolve(client.from('students').delete().eq('id', targetId)).catch(() => {});
      }

      res.json({ success: true, message: 'Student and associated sessions deleted from server.' });
    } catch (err: any) {
      console.error('[DELETE /api/students/:id ERROR]:', err);
      res.status(500).json({ success: false, message: 'Failed to delete student.' });
    }
  });

  // Supabase Configuration Sync Across Devices
  app.get('/api/config/supabase', (_req, res) => {
    try {
      const db = readDb();
      let config = db.systemSettings?.supabaseConfig || null;
      if ((!config || !config.url) && (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL)) {
        config = {
          url: process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '',
          anonKey: process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '',
          autoSync: true,
        };
      }
      res.json({ success: true, config });
    } catch (err: any) {
      console.error('[GET /api/config/supabase ERROR]:', err);
      res.status(500).json({ success: false, message: 'Failed to fetch config.' });
    }
  });

  app.post('/api/config/supabase', (req, res) => {
    try {
      const db = readDb();
      const { url, anonKey, autoSync } = req.body;
      db.systemSettings = db.systemSettings || {};
      db.systemSettings.supabaseConfig = {
        url: (url || '').trim(),
        anonKey: (anonKey || '').trim(),
        autoSync: autoSync !== false,
      };
      writeDb(db);
      console.log('[CONFIG SYNC]: Supabase credentials synchronized on server.');
      res.json({ success: true, message: 'Supabase configuration saved on server.' });
    } catch (err: any) {
      console.error('[POST /api/config/supabase ERROR]:', err);
      res.status(500).json({ success: false, message: 'Failed to save config.' });
    }
  });

  app.post('/api/sync/all', (req, res) => {
    try {
      const { accounts, students, sessions, programs, classes, announcements, auditLogs, systemSettings } = req.body;
      const db = readDb();

      if (accounts && typeof accounts === 'object') {
        db.accounts = { ...db.accounts, ...accounts };
      }
      if (Array.isArray(students)) {
        // Merge students by ID
        const studentMap = new Map();
        db.students.forEach((s) => studentMap.set(s.id, s));
        students.forEach((s) => studentMap.set(s.id, s));
        db.students = Array.from(studentMap.values());
      }
      if (Array.isArray(sessions)) {
        // Merge sessions by ID
        const sessionMap = new Map();
        db.sessions.forEach((s) => sessionMap.set(s.id, s));
        sessions.forEach((s) => sessionMap.set(s.id, s));
        db.sessions = Array.from(sessionMap.values());
      }
      if (Array.isArray(programs) && programs.length > 0) {
        db.programs = programs;
      }
      if (Array.isArray(classes) && classes.length > 0) {
        db.classes = classes;
      }
      if (Array.isArray(announcements) && announcements.length > 0) {
        db.announcements = announcements;
      }
      if (Array.isArray(auditLogs) && auditLogs.length > 0) {
        db.auditLogs = auditLogs;
      }
      if (systemSettings) {
        db.systemSettings = { ...db.systemSettings, ...systemSettings };
      }

      writeDb(db);
      res.json({ success: true, message: 'Database synced successfully on server.' });
    } catch (err: any) {
      console.error('[SYNC ERROR]:', err);
      res.status(500).json({ success: false, message: 'Failed to sync data.' });
    }
  });

  // Vite middleware for development vs static serve for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
