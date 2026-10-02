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
      
      // Purge legacy mock teachers
      const legacyMockEmails = ['juan.delacruz@depedqc.ph', 'maria.santos@depedqc.ph', 'eduardo.reyes@depedqc.ph'];
      legacyMockEmails.forEach((lem) => {
        delete accounts[lem];
      });

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

// Case-insensitive teacher email matching with DepEd alias support
function isSameTeacher(email1?: string | null, email2?: string | null): boolean {
  if (!email1 || !email2) return false;
  const e1 = email1.toLowerCase().trim();
  const e2 = email2.toLowerCase().trim();
  if (e1 === e2) return true;
  const isShirlene1 = e1.includes('shirlene.mandapat') || e1 === 'shirlene.mandapat@depedqc.ph' || e1 === 'shirlene.mandapat001@deped.gov.ph';
  const isShirlene2 = e2.includes('shirlene.mandapat') || e2 === 'shirlene.mandapat@depedqc.ph' || e2 === 'shirlene.mandapat001@deped.gov.ph';
  if (isShirlene1 && isShirlene2) return true;
  return false;
}

// Clean and normalize Supabase endpoint URL
function cleanSupabaseUrl(url?: string): string {
  if (!url || typeof url !== 'string') return '';
  return url.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
}

// Circuit breaker state for Supabase cloud sync to prevent hanging or log spam
let supabaseCooldownUntil = 0;
let isSupabasePulling = false;

// Server-side Supabase Relay Client Helper
function getServerSupabaseClient(db?: AppDbState): SupabaseClient | null {
  try {
    if (Date.now() < supabaseCooldownUntil) {
      return null;
    }
    const currentDb = db || readDb();
    const cfg = currentDb.systemSettings?.supabaseConfig;
    const rawUrl = (cfg?.url || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
    const key = (cfg?.anonKey || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '').trim();
    const url = cleanSupabaseUrl(rawUrl);
    if (url && key && url.startsWith('http') && key.length > 20) {
      return createClient(url, key);
    }
  } catch {
    // Supabase client initialization fallback
  }
  return null;
}

// Automatically relay single or array of students to Supabase in background
async function relayStudentsToSupabase(students: any[], defaultTeacherEmail?: string) {
  if (Date.now() < supabaseCooldownUntil) return;
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
    } catch {
      // Set cooldown on network/timeout failure
      supabaseCooldownUntil = Date.now() + 120 * 1000;
      break;
    }
  }
}

// Automatically relay teacher profile to Supabase in background
async function relayTeacherProfileToSupabase(profile: any) {
  if (Date.now() < supabaseCooldownUntil) return;
  const client = getServerSupabaseClient();
  if (!client || !profile || !profile.email) return;
  try {
    const payload = {
      email: profile.email.trim(),
      name: profile.name || 'Teacher',
      title: profile.title || 'Teacher I / TLE Faculty',
      school_name: profile.schoolName || profile.school_name || 'Ramon Magsaysay (Cubao) High School',
      division: profile.division || 'SDO Quezon City • TLE Department',
      region: profile.region || 'National Capital Region',
      academic_year: profile.academicYear || profile.academic_year || '2025-2026',
      department: profile.department || 'Technology and Livelihood Education (TLE)',
      master_teacher_name: profile.masterTeacherName || profile.master_teacher_name || null,
      master_teacher_position: profile.masterTeacherPosition || profile.master_teacher_position || null,
      head_teacher_name: profile.headTeacherName || profile.head_teacher_name || null,
      head_teacher_position: profile.headTeacherPosition || profile.head_teacher_position || null,
      principal_name: profile.principalName || profile.principal_name || null,
      principal_position: profile.principalPosition || profile.principal_position || null,
      updated_at: new Date().toISOString(),
    };
    await client.from('teacher_profiles').upsert(payload, { onConflict: 'email' });
  } catch {
    supabaseCooldownUntil = Date.now() + 120 * 1000;
  }
}

// Automatically pull all latest records from Supabase into server state
async function pullLatestFromSupabase(db: AppDbState): Promise<boolean> {
  if (Date.now() < supabaseCooldownUntil || isSupabasePulling) {
    return false;
  }
  const client = getServerSupabaseClient(db);
  if (!client) return false;

  isSupabasePulling = true;
  try {
    const timeoutPromise = new Promise<{ isTimeout: true }>((resolve) =>
      setTimeout(() => resolve({ isTimeout: true }), 2500)
    );

    const fetchPromise = Promise.allSettled([
      client.from('students').select('*'),
      client.from('session_records').select('*'),
      client.from('sessions').select('*'),
      client.from('teacher_profiles').select('*'),
    ]);

    const result = await Promise.race([fetchPromise, timeoutPromise]);
    if ('isTimeout' in result) {
      // Supabase host is unresponsive; silence and back off for 2 minutes
      supabaseCooldownUntil = Date.now() + 120 * 1000;
      isSupabasePulling = false;
      return false;
    }

    const [studentsResult, sessionsResult, altSessionsResult, teachersResult] = result;

    if (studentsResult.status === 'rejected' && teachersResult.status === 'rejected') {
      supabaseCooldownUntil = Date.now() + 120 * 1000;
      isSupabasePulling = false;
      return false;
    }

    const studentsRes: any = studentsResult.status === 'fulfilled' ? studentsResult.value : { data: null };
    const sessionsRes: any = sessionsResult.status === 'fulfilled' ? sessionsResult.value : { data: null };
    const altSessionsRes: any = altSessionsResult.status === 'fulfilled' ? altSessionsResult.value : { data: null };
    const teachersRes: any = teachersResult.status === 'fulfilled' ? teachersResult.value : { data: null };

    let changed = false;

    if (Array.isArray(teachersRes?.data) && teachersRes.data.length > 0) {
      teachersRes.data.forEach((t: any) => {
        if (t && t.email) {
          const norm = t.email.toLowerCase().trim();
          db.accounts[norm] = {
            ...(db.accounts[norm] || {}),
            email: t.email,
            name: t.name || db.accounts[norm]?.name,
            title: t.title || db.accounts[norm]?.title,
            schoolName: t.school_name || db.accounts[norm]?.schoolName,
            division: t.division || db.accounts[norm]?.division,
            region: t.region || db.accounts[norm]?.region,
            academicYear: t.academic_year || db.accounts[norm]?.academicYear,
            department: t.department || db.accounts[norm]?.department,
            masterTeacherName: t.master_teacher_name || db.accounts[norm]?.masterTeacherName,
            masterTeacherPosition: t.master_teacher_position || db.accounts[norm]?.masterTeacherPosition,
            headTeacherName: t.head_teacher_name || db.accounts[norm]?.headTeacherName,
            headTeacherPosition: t.head_teacher_position || db.accounts[norm]?.headTeacherPosition,
            principalName: t.principal_name || db.accounts[norm]?.principalName,
            principalPosition: t.principal_position || db.accounts[norm]?.principalPosition,
            isPasswordSet: true,
          };
          changed = true;
        }
      });
    }

    if (Array.isArray(studentsRes?.data) && studentsRes.data.length > 0) {
      const studentMap = new Map();
      (db.students || []).forEach((s: any) => studentMap.set(String(s.id), s));
      studentsRes.data.forEach((s: any) => {
        const sid = String(s.id);
        const existing = studentMap.get(sid);
        const tEmail = (s.teacher_email || s.teacherEmail || (existing ? existing.teacherEmail : '') || '').toLowerCase().trim();
        studentMap.set(sid, {
          id: sid,
          lastName: s.last_name || 'Student',
          firstName: s.first_name || 'Learner',
          middleInitial: s.middle_initial || '',
          gradeLevel: s.grade_level || 'Grade 7',
          section: s.section || 'General',
          subject: s.subject || 'TLE',
          programType: s.program_type || 'Remediation',
          baselineScore: Number(s.baseline_score) || 0,
          focusTopic: s.focus_topic || '',
          enrolledDate: s.enrolled_date || new Date().toISOString().split('T')[0],
          status: s.status || 'Progressing',
          parentName: s.parent_name || undefined,
          parentContact: s.parent_contact || undefined,
          scheduleDetails: s.schedule_details || undefined,
          notes: s.notes || undefined,
          isArchived: Boolean(s.is_archived),
          archivedAt: s.archived_at || undefined,
          teacherEmail: tEmail,
        });
      });
      db.students = Array.from(studentMap.values());
      changed = true;
    }

    // Merge sessions from session_records AND sessions tables
    const rawSessionsData: any[] = [];
    if (Array.isArray(sessionsRes?.data) && sessionsRes.data.length > 0) {
      rawSessionsData.push(...sessionsRes.data);
    }
    if (Array.isArray(altSessionsRes?.data) && altSessionsRes.data.length > 0) {
      rawSessionsData.push(...altSessionsRes.data);
    }

    if (rawSessionsData.length > 0) {
      const sessionMap = new Map();
      (db.sessions || []).forEach((sess: any) => sessionMap.set(String(sess.id), sess));
      rawSessionsData.forEach((sess: any) => {
        const sessId = String(sess.id);
        sessionMap.set(sessId, {
          id: sessId,
          studentId: String(sess.student_id || sess.studentId || ''),
          studentName: sess.student_name || sess.studentName || 'Student',
          section: sess.section || 'General',
          gradeLevel: sess.grade_level || sess.gradeLevel || 'Grade 7',
          subject: sess.subject || sess.subject || 'TLE',
          programType: sess.program_type || sess.programType || 'Remediation',
          date: sess.date || new Date().toISOString().split('T')[0],
          focusCompetency: sess.focus_competency || sess.focusCompetency || 'Fundamental Competency Drill',
          activityType: sess.activity_type || sess.activityType || 'Remedial Hands-on Practice',
          activityTypes: Array.isArray(sess.activity_types) ? sess.activity_types : [sess.activity_type || sess.activityType || 'Remedial Hands-on Practice'],
          intervention: sess.intervention || sess.intervention || 'Task Simplification',
          interventions: Array.isArray(sess.interventions) ? sess.interventions : [sess.intervention || sess.intervention || 'Task Simplification'],
          rawScore: Number(sess.raw_score ?? sess.rawScore ?? sess.score ?? 0),
          totalItems: Number(sess.total_items ?? sess.totalItems ?? 20) || 20,
          score: Number(sess.score ?? 0),
          masteryLevel: sess.mastery_level || sess.masteryLevel || (Number(sess.score) >= 85 ? 'Mastered' : Number(sess.score) >= 75 ? 'Moving Towards Mastery' : 'Average Mastery'),
          remarks: sess.remarks || '',
          movs: Array.isArray(sess.movs) ? sess.movs : [],
          assessmentTool: sess.assessment_tool || sess.assessmentTool || undefined,
          createdAt: sess.created_at || sess.createdAt || new Date().toISOString(),
          teacherEmail: sess.teacher_email || sess.teacherEmail || '',
        });
      });
      db.sessions = Array.from(sessionMap.values());
      changed = true;

      // Auto-synthesize any missing student records referenced by sessions so they always appear in admin view
      const studentMap = new Map();
      (db.students || []).forEach((s: any) => studentMap.set(String(s.id), s));
      db.sessions.forEach((sess: any) => {
        if (sess.studentId && !studentMap.has(sess.studentId)) {
          const parts = (sess.studentName || 'Student Learner').split(',');
          const lName = parts[0]?.trim() || 'Student';
          const fName = parts[1]?.trim() || 'Learner';
          studentMap.set(sess.studentId, {
            id: sess.studentId,
            lastName: lName,
            firstName: fName,
            middleInitial: '',
            gradeLevel: sess.gradeLevel || 'Grade 7',
            section: sess.section || 'General',
            subject: sess.subject || 'TLE',
            programType: sess.programType || 'Remediation',
            baselineScore: 0,
            focusTopic: sess.focusCompetency || '',
            enrolledDate: sess.date || new Date().toISOString().split('T')[0],
            status: 'Progressing',
            teacherEmail: sess.teacherEmail || 'shirlene.mandapat@depedqc.ph',
          });
          changed = true;
        }
      });
      db.students = Array.from(studentMap.values());
    }

    if (changed) {
      writeDb(db);
    }
    isSupabasePulling = false;
    return true;
  } catch {
    supabaseCooldownUntil = Date.now() + 120 * 1000;
    isSupabasePulling = false;
    return false;
  }
}

// Automatically relay single or array of sessions to Supabase in background
async function relaySessionsToSupabase(sessions: any[], defaultTeacherEmail?: string) {
  if (Date.now() < supabaseCooldownUntil) return;
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
        id: String(sess.id),
        student_id: String(sess.studentId || sess.student_id),
        student_name: sess.studentName || sess.student_name,
        section: sess.section || 'General',
        grade_level: sess.gradeLevel || sess.grade_level || 'Grade 7',
        subject: sess.subject || sess.subject || 'TLE',
        program_type: sess.programType || sess.program_type || 'Remediation',
        date: sess.date || new Date().toISOString().split('T')[0],
        focus_competency: sess.focusCompetency || sess.focus_competency || 'Competency Drill',
        activity_type: sess.activityType || sess.activity_type || 'Remedial Practice',
        activity_types: sess.activityTypes || sess.activity_types || [sess.activityType || sess.activity_type || 'Remedial Practice'],
        intervention: sess.intervention || 'Task Simplification',
        interventions: sess.interventions || [sess.intervention || 'Task Simplification'],
        raw_score: Number(sess.rawScore ?? sess.raw_score ?? 0),
        total_items: Number(sess.totalItems ?? sess.total_items ?? 20),
        score: Number(sess.score ?? 0),
        mastery_level: sess.masteryLevel || sess.mastery_level || (Number(sess.score) >= 85 ? 'Mastered' : 'Progressing'),
        remarks: sess.remarks || '',
        movs: sess.movs || [],
        assessment_tool: sess.assessmentTool || sess.assessment_tool || null,
        teacher_email: sess.teacherEmail || sess.teacher_email || defaultTeacherEmail || null,
        created_at: sess.createdAt || sess.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      try {
        await client.from('session_records').upsert(payload, { onConflict: 'id' });
      } catch {}
      try {
        await client.from('sessions').upsert(payload, { onConflict: 'id' });
      } catch {}
    } catch {
      supabaseCooldownUntil = Date.now() + 120 * 1000;
      break;
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '20mb' }));

  // Initialize DB on boot and auto-relay all historical students/sessions to Supabase
  const initialDb = readDb();
  setTimeout(() => {
    if (initialDb.students && initialDb.students.length > 0) {
      relayStudentsToSupabase(initialDb.students).catch(() => {});
    }
    if (initialDb.sessions && initialDb.sessions.length > 0) {
      relaySessionsToSupabase(initialDb.sessions).catch(() => {});
    }
  }, 1500);

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

  // Permanently delete a teacher account
  app.delete('/api/accounts/:email', (req, res) => {
    try {
      const db = readDb();
      const targetEmail = (req.params.email || '').trim().toLowerCase();
      if (!targetEmail) {
        return res.status(400).json({ success: false, message: 'Email is required.' });
      }
      if (targetEmail === 'admin@projectsmile') {
        return res.status(403).json({ success: false, message: 'Cannot delete primary System Administrator account.' });
      }
      if (!db.accounts[targetEmail]) {
        return res.status(404).json({ success: false, message: `Account ${targetEmail} not found on server.` });
      }

      const teacherName = db.accounts[targetEmail].name || targetEmail;
      delete db.accounts[targetEmail];

      // Add audit log
      db.auditLogs.unshift({
        id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        userEmail: 'admin@projectsmile',
        action: 'DELETE_TEACHER',
        details: `Administrator permanently deleted account: ${teacherName} (${targetEmail}).`,
        targetUser: targetEmail,
        timestamp: new Date().toISOString(),
      });
      db.auditLogs = (db.auditLogs || []).slice(0, 300);

      writeDb(db);
      console.log(`[DELETE ACCOUNT]: Successfully deleted account ${targetEmail} from server.`);

      // Also delete from Supabase if connected
      const client = getServerSupabaseClient(db);
      if (client) {
        Promise.resolve(client.from('teacher_profiles').delete().eq('email', targetEmail)).catch(() => {});
      }

      res.json({ success: true, message: `Account for ${teacherName} was deleted permanently from server.` });
    } catch (err: any) {
      console.error('[DELETE /api/accounts/:email ERROR]:', err);
      res.status(500).json({ success: false, message: 'Failed to delete account from server.' });
    }
  });

  // Update a teacher account profile (name, title, role, assignedSubjects)
  app.put('/api/accounts/:email', (req, res) => {
    try {
      const db = readDb();
      const targetEmail = (req.params.email || '').trim().toLowerCase();
      if (!targetEmail) {
        return res.status(400).json({ success: false, message: 'Email is required.' });
      }
      if (!db.accounts[targetEmail]) {
        return res.status(404).json({ success: false, message: `Account ${targetEmail} not found on server.` });
      }

      const updates = req.body.profile || req.body.updates || req.body;
      const existing = db.accounts[targetEmail];
      const effectiveRole = updates.role || existing.role || 'teacher';
      const isTeachingRole = !['admin', 'school_head', 'coordinator'].includes(effectiveRole);

      db.accounts[targetEmail] = {
        ...existing,
        ...updates,
        role: effectiveRole,
        assignedSubjects: isTeachingRole ? (updates.assignedSubjects ?? existing.assignedSubjects ?? []) : [],
        email: existing.email, // preserve canonical email
      };

      // Add audit log
      db.auditLogs.unshift({
        id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        userEmail: 'admin@projectsmile',
        action: 'UPDATE_TEACHER',
        details: `Administrator updated profile for ${db.accounts[targetEmail].name} (${targetEmail}).`,
        targetUser: targetEmail,
        timestamp: new Date().toISOString(),
      });
      db.auditLogs = (db.auditLogs || []).slice(0, 300);

      writeDb(db);
      console.log(`[UPDATE ACCOUNT]: Successfully updated account ${targetEmail} on server.`);

      res.json({
        success: true,
        profile: db.accounts[targetEmail],
        message: `Account for ${db.accounts[targetEmail].name} was updated successfully on server.`,
      });
    } catch (err: any) {
      console.error('[PUT /api/accounts/:email ERROR]:', err);
      res.status(500).json({ success: false, message: 'Failed to update account on server.' });
    }
  });

  // Toggle account status (Active / Inactive)
  app.post('/api/accounts/:email/status', (req, res) => {
    try {
      const db = readDb();
      const targetEmail = (req.params.email || '').trim().toLowerCase();
      if (!targetEmail) {
        return res.status(400).json({ success: false, message: 'Email is required.' });
      }
      if (!db.accounts[targetEmail]) {
        return res.status(404).json({ success: false, message: `Account ${targetEmail} not found on server.` });
      }
      if (targetEmail === 'admin@projectsmile' && req.body.status === 'Inactive') {
        return res.status(403).json({ success: false, message: 'Cannot deactivate primary System Administrator account.' });
      }

      const status = req.body.status === 'Inactive' ? 'Inactive' : 'Active';
      db.accounts[targetEmail].accountStatus = status;

      // Add audit log
      db.auditLogs.unshift({
        id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        userEmail: 'admin@projectsmile',
        action: 'TOGGLE_STATUS',
        details: `Administrator set account status for ${db.accounts[targetEmail].name} (${targetEmail}) to ${status}.`,
        targetUser: targetEmail,
        timestamp: new Date().toISOString(),
      });
      db.auditLogs = (db.auditLogs || []).slice(0, 300);

      writeDb(db);
      console.log(`[STATUS ACCOUNT]: Successfully set account ${targetEmail} status to ${status} on server.`);

      res.json({
        success: true,
        status,
        message: `Account status for ${db.accounts[targetEmail].name} was set to ${status}.`,
      });
    } catch (err: any) {
      console.error('[POST /api/accounts/:email/status ERROR]:', err);
      res.status(500).json({ success: false, message: 'Failed to update account status on server.' });
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

  // User Login (Strict credential verification)
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Please provide both email and password.' });
      }

      const cleanEmail = email.trim().toLowerCase();
      const cleanPassword = (password || '').trim();
      const db = readDb();
      let account = db.accounts[cleanEmail];

      if (!account) {
        const foundKey = Object.keys(db.accounts).find((k) => k.trim().toLowerCase() === cleanEmail);
        if (foundKey) {
          account = db.accounts[foundKey];
        }
      }

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

      // Check if account exists
      if (!account || (!account.isPasswordSet && !account.passwordHash)) {
        return res.status(401).json({
          success: false,
          message: 'Account not found on this server. Please check the email spelling or register your account.',
        });
      }

      // Strict password match verification
      const storedPass = (account.passwordHash || '').trim();
      const isMatch = storedPass === cleanPassword;

      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Incorrect password for this account. Please enter your valid registered password.',
        });
      }

      // Successful login -> update last login timestamp and ensure Active status
      account.lastLoginAt = new Date().toLocaleString();
      account.accountStatus = 'Active';
      account.isPasswordSet = true;
      db.accounts[cleanEmail] = account;

      // Log teacher login event in audit logs for Admin monitoring
      db.auditLogs.unshift({
        id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        userEmail: cleanEmail,
        action: 'TEACHER_LOGGED_IN',
        details: `Faculty login: ${account.name} (${cleanEmail}) accessed Project S.M.I.L.E. Portal from device.`,
        targetUser: cleanEmail,
        timestamp: new Date().toISOString(),
      });

      writeDb(db);

      console.log(`[AUTH] Teacher logged in successfully across device: ${cleanEmail}`);
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
  app.get('/api/teacher/data', async (req, res) => {
    try {
      const db = readDb();
      // Background synchronization with Supabase without blocking HTTP response
      if (Date.now() >= supabaseCooldownUntil && !isSupabasePulling) {
        pullLatestFromSupabase(db).catch(() => {});
      }

      const rawEmail = (req.query.email as string || '').trim().toLowerCase();
      const profile = db.accounts[rawEmail] || null;
      const isAdmin =
        !rawEmail ||
        rawEmail === 'admin@projectsmile' ||
        (profile && profile.role === 'admin');

      // Build a studentId -> teacherEmail lookup map from db.students for fallback resolution
      const studentTeacherMap = new Map<string, string>();
      (db.students || []).forEach((st: any) => {
        const t = (st.teacherEmail || st.teacher_email || '').toLowerCase().trim();
        if (t) studentTeacherMap.set(String(st.id), t);
      });

      // Ensure all sessions have teacherEmail resolved
      const allResolvedSessions = (db.sessions || []).map((sess: any) => {
        const currentTeacher = (sess.teacherEmail || sess.teacher_email || '').toLowerCase().trim();
        const fallbackTeacher = studentTeacherMap.get(String(sess.studentId || sess.student_id || '')) || '';
        return {
          ...sess,
          teacherEmail: currentTeacher || fallbackTeacher,
        };
      });

      let matchedStudents: any[] = [];
      let matchedSessions: any[] = [];

      if (rawEmail && !isAdmin) {
        matchedStudents = (db.students || []).filter((s: any) => {
          const sEmail = (s.teacherEmail || s.teacher_email || '').toLowerCase().trim();
          return isSameTeacher(sEmail, rawEmail);
        });

        const studentIdSet = new Set(matchedStudents.map((s) => String(s.id)));

        matchedSessions = allResolvedSessions.filter((sess: any) => {
          const sEmail = (sess.teacherEmail || '').toLowerCase().trim();
          const stId = String(sess.studentId || sess.student_id || '');
          const studentEmail = studentTeacherMap.get(stId) || '';
          return isSameTeacher(sEmail, rawEmail) || isSameTeacher(studentEmail, rawEmail) || studentIdSet.has(stId);
        });
      } else {
        matchedStudents = db.students || [];
        matchedSessions = allResolvedSessions;
      }

      res.json({
        success: true,
        email: rawEmail,
        isAdmin,
        profile,
        students: matchedStudents,
        sessions: matchedSessions,
        allStudents: db.students || [],
        allSessions: allResolvedSessions,
        programs: db.programs || [],
        classes: db.classes || [],
        announcements: db.announcements || [],
        auditLogs: db.auditLogs || [],
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

      // Update students by map merge to never drop other teachers' students and preserve owner emails
      if (Array.isArray(students)) {
        const studentMap = new Map();
        (db.students || []).forEach((s: any) => studentMap.set(String(s.id), s));
        students.forEach((s: any) => {
          const sid = String(s.id);
          const existing = studentMap.get(sid);
          const existingEmail = existing ? (existing.teacherEmail || existing.teacher_email || '') : '';
          const currentEmail = (s.teacherEmail || s.teacher_email || '').toLowerCase().trim();
          const ownerEmail = (currentEmail || existingEmail || cleanEmail).toLowerCase().trim();
          studentMap.set(sid, {
            ...(existing || {}),
            ...s,
            id: sid,
            teacherEmail: ownerEmail,
          });
        });
        db.students = Array.from(studentMap.values());
      }

      // Update sessions by map merge to never drop other teachers' sessions and preserve owner emails
      if (Array.isArray(sessions)) {
        const sessionMap = new Map();
        (db.sessions || []).forEach((sess: any) => sessionMap.set(String(sess.id), sess));
        sessions.forEach((sess: any) => {
          const sessId = String(sess.id);
          const existing = sessionMap.get(sessId);
          const existingEmail = existing ? (existing.teacherEmail || existing.teacher_email || '') : '';
          const currentEmail = (sess.teacherEmail || sess.teacher_email || '').toLowerCase().trim();
          const targetStudent = (db.students || []).find((std: any) => String(std.id) === String(sess.studentId || sess.student_id || ''));
          const studentOwner = targetStudent ? (targetStudent.teacherEmail || targetStudent.teacher_email || '') : '';
          const ownerEmail = (currentEmail || existingEmail || studentOwner || (cleanEmail === 'admin@projectsmile' ? '' : cleanEmail)).toLowerCase().trim();
          sessionMap.set(sessId, {
            ...(existing || {}),
            ...sess,
            id: sessId,
            teacherEmail: ownerEmail,
          });
        });
        db.sessions = Array.from(sessionMap.values());
      }

      writeDb(db);
      console.log(`[SYNC SUCCESS]: Synchronized teacher data for ${cleanEmail}. Total students: ${db.students.length}, sessions: ${db.sessions.length}`);

      // Automatically relay changes to Supabase in background without requiring user manual trigger
      if (profile && typeof profile === 'object') {
        relayTeacherProfileToSupabase(db.accounts[cleanEmail]).catch(() => {});
      }
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
  app.get('/api/sync/all', async (_req, res) => {
    const db = readDb();
    if (Date.now() >= supabaseCooldownUntil && !isSupabasePulling) {
      pullLatestFromSupabase(db).catch(() => {});
    }
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
  app.get('/api/sessions', async (req, res) => {
    try {
      const db = readDb();
      if (Date.now() >= supabaseCooldownUntil && !isSupabasePulling) {
        pullLatestFromSupabase(db).catch(() => {});
      }
      const teacherEmail = (req.query.teacherEmail as string || '').toLowerCase().trim();
      
      const studentTeacherMap = new Map<string, string>();
      (db.students || []).forEach((st: any) => {
        const t = (st.teacherEmail || st.teacher_email || '').toLowerCase().trim();
        if (t) studentTeacherMap.set(String(st.id), t);
      });

      let list = (db.sessions || []).map((sess: any) => {
        const currentTeacher = (sess.teacherEmail || sess.teacher_email || '').toLowerCase().trim();
        const fallbackTeacher = studentTeacherMap.get(String(sess.studentId || sess.student_id || '')) || '';
        return {
          ...sess,
          teacherEmail: currentTeacher || fallbackTeacher,
        };
      });

      if (teacherEmail) {
        list = list.filter((s: any) => {
          const sTeacher = (s.teacherEmail || '').toLowerCase().trim();
          const stId = String(s.studentId || s.student_id || '');
          const studentOwner = studentTeacherMap.get(stId) || '';
          return isSameTeacher(sTeacher, teacherEmail) || isSameTeacher(studentOwner, teacherEmail);
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
      (db.sessions || []).forEach((s: any) => sessionMap.set(String(s.id), s));
      validIncoming.forEach((s: any) => {
        const sessId = String(s.id);
        const existing = sessionMap.get(sessId);
        const stId = String(s.studentId || s.student_id || '');
        const targetStudent = (db.students || []).find((std: any) => String(std.id) === stId);
        const studentOwner = targetStudent ? (targetStudent.teacherEmail || targetStudent.teacher_email || '') : '';
        const resolvedEmail = (s.teacherEmail || s.teacher_email || (existing ? existing.teacherEmail : '') || studentOwner || '').toLowerCase().trim();
        sessionMap.set(sessId, {
          ...(existing || {}),
          ...s,
          id: sessId,
          teacherEmail: resolvedEmail,
        });
      });
      db.sessions = Array.from(sessionMap.values());

      // Record session activity in server audit log for Admin monitoring
      validIncoming.forEach((sess: any) => {
        const tEmail = (sess.teacherEmail || sess.teacher_email || '').toLowerCase().trim();
        const account = db.accounts[tEmail];
        const teacherName = account?.name || tEmail || 'Teacher';
        db.auditLogs.unshift({
          id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          userEmail: tEmail || 'teacher',
          action: 'LOG_SESSION',
          details: `Teacher ${teacherName} logged daily remediation session for ${sess.studentName || 'Student'} (${sess.score || 0}% score - ${sess.masteryLevel || 'Evaluated'}).`,
          targetUser: tEmail,
          timestamp: new Date().toISOString(),
        });
      });
      db.auditLogs = (db.auditLogs || []).slice(0, 300);

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
      (db.students || []).forEach((s: any) => studentMap.set(String(s.id), s));
      validIncoming.forEach((s: any) => {
        const sid = String(s.id);
        const existing = studentMap.get(sid);
        studentMap.set(sid, {
          ...(existing || {}),
          ...s,
          id: sid,
          teacherEmail: (s.teacherEmail || s.teacher_email || (existing ? existing.teacherEmail : '') || '').toLowerCase().trim(),
        });
      });
      db.students = Array.from(studentMap.values());

      // Record student enrollment in server audit log for Admin monitoring
      validIncoming.forEach((s: any) => {
        const tEmail = (s.teacherEmail || s.teacher_email || '').toLowerCase().trim();
        const account = db.accounts[tEmail];
        const teacherName = account?.name || tEmail || 'Teacher';
        db.auditLogs.unshift({
          id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          userEmail: tEmail || 'teacher',
          action: 'ENROLL_STUDENT',
          details: `Teacher ${teacherName} enrolled learner: ${s.lastName}, ${s.firstName} (${s.gradeLevel || 'Grade 7'} - ${s.section || ''}) in ${s.programType || 'Remediation'}.`,
          targetUser: tEmail,
          timestamp: new Date().toISOString(),
        });
      });
      db.auditLogs = (db.auditLogs || []).slice(0, 300);

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

      if (accounts && typeof accounts === 'object' && Object.keys(accounts).length > 0) {
        // Authoritative update of accounts from admin sync
        const legacyMockEmails = ['juan.delacruz@depedqc.ph', 'maria.santos@depedqc.ph', 'eduardo.reyes@depedqc.ph'];
        const cleanAccounts: Record<string, any> = {};
        for (const [k, v] of Object.entries(accounts)) {
          if (!legacyMockEmails.includes(k.toLowerCase())) {
            cleanAccounts[k.toLowerCase()] = v;
          }
        }
        if (!cleanAccounts['admin@projectsmile'] && db.accounts['admin@projectsmile']) {
          cleanAccounts['admin@projectsmile'] = db.accounts['admin@projectsmile'];
        }
        db.accounts = cleanAccounts;
      }
      if (Array.isArray(students)) {
        // Merge students by ID
        const studentMap = new Map();
        (db.students || []).forEach((s: any) => studentMap.set(String(s.id), s));
        students.forEach((s: any) => {
          const sid = String(s.id);
          const existing = studentMap.get(sid);
          studentMap.set(sid, {
            ...(existing || {}),
            ...s,
            id: sid,
            teacherEmail: (s.teacherEmail || s.teacher_email || (existing ? existing.teacherEmail : '') || '').toLowerCase().trim(),
          });
        });
        db.students = Array.from(studentMap.values());
      }
      if (Array.isArray(sessions)) {
        // Merge sessions by ID
        const sessionMap = new Map();
        (db.sessions || []).forEach((s: any) => sessionMap.set(String(s.id), s));
        sessions.forEach((s: any) => {
          const sessId = String(s.id);
          const existing = sessionMap.get(sessId);
          sessionMap.set(sessId, {
            ...(existing || {}),
            ...s,
            id: sessId,
            teacherEmail: (s.teacherEmail || s.teacher_email || (existing ? existing.teacherEmail : '') || '').toLowerCase().trim(),
          });
        });
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
        const logMap = new Map();
        (db.auditLogs || []).forEach((l: any) => logMap.set(String(l.id), l));
        auditLogs.forEach((l: any) => logMap.set(String(l.id), l));
        db.auditLogs = Array.from(logMap.values()).slice(0, 200);
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
    const distPath = fs.existsSync(path.join(process.cwd(), 'dist', 'index.html'))
      ? path.join(process.cwd(), 'dist')
      : path.join(__dirname);

    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      const htmlPath = path.join(distPath, 'index.html');
      if (fs.existsSync(htmlPath)) {
        res.sendFile(htmlPath);
      } else {
        res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
      }
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SERVER] Running successfully on port ${PORT}`);
  });

  const handleShutdown = () => {
    console.log('[SERVER] Shutting down gracefully...');
    server.close(() => {
      process.exit(0);
    });
  };

  process.on('SIGTERM', handleShutdown);
  process.on('SIGINT', handleShutdown);
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
