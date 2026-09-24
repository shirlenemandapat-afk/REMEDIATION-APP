import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { TeacherProfile, Student, SessionRecord } from '../types';

const SUPABASE_CONFIG_KEY = 'rmchs_supabase_credentials';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  autoSync: boolean;
}

// Check if a URL is a syntactically and structurally valid Supabase endpoint
export function isValidSupabaseUrl(url?: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed.startsWith('https://') && !trimmed.startsWith('http://')) return false;
  if (trimmed.includes('eyJhbGciOi')) return false; // Accidentally pasted JWT key
  try {
    const parsed = new URL(trimmed);
    return Boolean(parsed.hostname && parsed.hostname.length > 3 && parsed.hostname.includes('.'));
  } catch {
    return false;
  }
}

export function isValidSupabaseKey(key?: string): boolean {
  if (!key || typeof key !== 'string') return false;
  const trimmed = key.trim();
  return trimmed.length > 20 && !trimmed.startsWith('http://') && !trimmed.startsWith('https://');
}

// Sync Supabase configuration from Server database across all devices
export async function syncSupabaseConfigFromRemote(): Promise<boolean> {
  try {
    const res = await fetch('/api/config/supabase');
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.config) {
        const { url, anonKey, autoSync } = data.config;
        if (isValidSupabaseUrl(url) && isValidSupabaseKey(anonKey)) {
          saveSupabaseConfig({ url, anonKey, autoSync: autoSync !== false }, false);
          return true;
        }
      }
    }
  } catch (e) {
    console.warn('Sync Supabase config from server skipped:', e);
  }
  return false;
}

// 1. Get Stored / Environment Credentials
export function getSupabaseConfig(): SupabaseConfig {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

  try {
    const stored = localStorage.getItem(SUPABASE_CONFIG_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const url = (parsed.url || '').trim();
      const anonKey = (parsed.anonKey || '').trim();

      // If stored value is corrupted or invalid, clear it and fall back to env
      if (url && !isValidSupabaseUrl(url)) {
        localStorage.removeItem(SUPABASE_CONFIG_KEY);
      } else if (url && anonKey) {
        return {
          url: isValidSupabaseUrl(url) ? url : envUrl,
          anonKey: isValidSupabaseKey(anonKey) ? anonKey : envKey,
          autoSync: parsed.autoSync !== false,
        };
      }
    }
  } catch (e) {
    console.warn('Error reading Supabase config from storage', e);
  }

  return {
    url: isValidSupabaseUrl(envUrl) ? envUrl : '',
    anonKey: isValidSupabaseKey(envKey) ? envKey : '',
    autoSync: true,
  };
}

export function saveSupabaseConfig(config: SupabaseConfig, syncToServer: boolean = true): void {
  localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(config));
  _supabaseClient = null; // Reset singleton
  if (syncToServer) {
    fetch('/api/config/supabase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    }).catch((e) => console.warn('Supabase config server sync notice:', e));
  }
}

export function clearSupabaseConfig(syncToServer: boolean = true): void {
  localStorage.removeItem(SUPABASE_CONFIG_KEY);
  _supabaseClient = null;
  if (syncToServer) {
    fetch('/api/config/supabase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: '', anonKey: '', autoSync: false }),
    }).catch(() => {});
  }
}

let _supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (_supabaseClient) return _supabaseClient;
  const config = getSupabaseConfig();
  if (isValidSupabaseUrl(config.url) && isValidSupabaseKey(config.anonKey)) {
    try {
      _supabaseClient = createClient(config.url, config.anonKey, {
        auth: { persistSession: true },
      });
      return _supabaseClient;
    } catch (e) {
      console.warn('Failed to initialize Supabase client:', e);
    }
  }
  return null;
}

export const isSupabaseConfigured = (): boolean => {
  const cfg = getSupabaseConfig();
  return isValidSupabaseUrl(cfg.url) && isValidSupabaseKey(cfg.anonKey);
};

// SQL Schema for the user to easily create in Supabase SQL Editor
export const SUPABASE_SQL_SCHEMA = `-- =======================================================
-- PROJECT S.M.I.L.E. (DepEd TLE Department Database Schema)
-- Ramon Magsaysay (Cubao) High School
-- =======================================================

-- 1. Teacher Profile Table
CREATE TABLE IF NOT EXISTS teacher_profiles (
  email TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT DEFAULT 'Master Teacher I / Teacher III',
  school_name TEXT DEFAULT 'Ramon Magsaysay (Cubao) High School',
  division TEXT DEFAULT 'SDO Quezon City • TLE Department',
  region TEXT DEFAULT 'National Capital Region (NCR)',
  academic_year TEXT DEFAULT '2025-2026',
  department TEXT DEFAULT 'Technology and Livelihood Education (TLE)',
  master_teacher_name TEXT,
  master_teacher_position TEXT,
  head_teacher_name TEXT DEFAULT 'Dr. Corazon V. Santos',
  head_teacher_position TEXT DEFAULT 'Head Teacher III / TLE Department',
  principal_name TEXT DEFAULT 'Dr. Maria Luisa T. Ramos',
  principal_position TEXT DEFAULT 'Secondary School Principal IV',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Students Table
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  last_name TEXT NOT NULL,
  first_name TEXT NOT NULL,
  middle_initial TEXT DEFAULT '',
  grade_level TEXT NOT NULL,
  section TEXT NOT NULL,
  subject TEXT NOT NULL,
  program_type TEXT NOT NULL,
  baseline_score NUMERIC DEFAULT 0,
  focus_topic TEXT DEFAULT '',
  enrolled_date TEXT NOT NULL,
  status TEXT NOT NULL,
  parent_name TEXT,
  parent_contact TEXT,
  schedule_details TEXT,
  notes TEXT,
  teacher_email TEXT,
  is_archived BOOLEAN DEFAULT FALSE,
  archived_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Daily Anecdotal Session Records Table
CREATE TABLE IF NOT EXISTS session_records (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  section TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  subject TEXT NOT NULL,
  program_type TEXT NOT NULL,
  date TEXT NOT NULL,
  focus_competency TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  activity_types JSONB DEFAULT '[]'::jsonb,
  intervention TEXT NOT NULL,
  interventions JSONB DEFAULT '[]'::jsonb,
  raw_score NUMERIC DEFAULT 0,
  total_items NUMERIC DEFAULT 20,
  score NUMERIC NOT NULL,
  mastery_level TEXT NOT NULL,
  remarks TEXT DEFAULT '',
  movs JSONB DEFAULT '[]'::jsonb,
  assessment_tool JSONB,
  teacher_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Idempotent column additions for existing Supabase databases
ALTER TABLE students ADD COLUMN IF NOT EXISTS middle_initial TEXT DEFAULT '';
ALTER TABLE students ADD COLUMN IF NOT EXISTS parent_name TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS parent_contact TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS schedule_details TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS teacher_email TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

ALTER TABLE session_records ADD COLUMN IF NOT EXISTS teacher_email TEXT;
ALTER TABLE session_records ADD COLUMN IF NOT EXISTS activity_types JSONB DEFAULT '[]'::jsonb;
ALTER TABLE session_records ADD COLUMN IF NOT EXISTS interventions JSONB DEFAULT '[]'::jsonb;
ALTER TABLE session_records ADD COLUMN IF NOT EXISTS movs JSONB DEFAULT '[]'::jsonb;
ALTER TABLE session_records ADD COLUMN IF NOT EXISTS assessment_tool JSONB;
ALTER TABLE session_records ADD COLUMN IF NOT EXISTS raw_score NUMERIC DEFAULT 0;
ALTER TABLE session_records ADD COLUMN IF NOT EXISTS total_items NUMERIC DEFAULT 20;

-- Enable Row Level Security (RLS)
ALTER TABLE teacher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_records ENABLE ROW LEVEL SECURITY;

-- Allow read/write for anon API key (Idempotent: drop old policies first if they exist)
DROP POLICY IF EXISTS "Allow public read-write for teacher_profiles" ON teacher_profiles;
CREATE POLICY "Allow public read-write for teacher_profiles" ON teacher_profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read-write for students" ON students;
CREATE POLICY "Allow public read-write for students" ON students FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read-write for session_records" ON session_records;
CREATE POLICY "Allow public read-write for session_records" ON session_records FOR ALL USING (true) WITH CHECK (true);
`;

// Supabase API Operations with Cloud & Offline-First local fallback
export const supabaseService = {
  // Test connection across all required tables
  async testConnection(url: string, anonKey: string): Promise<{ success: boolean; message: string }> {
    try {
      const client = createClient(url, anonKey);
      
      // Test teacher_profiles
      const { error: tErr } = await client.from('teacher_profiles').select('email').limit(1);
      if (tErr) {
        if (tErr.message && tErr.message.includes('relation "teacher_profiles" does not exist')) {
          return {
            success: false,
            message: 'Connected to Supabase, but the "teacher_profiles" table does not exist. Please copy the SQL from Step 2 and run it in the Supabase SQL Editor.',
          };
        }
        if (tErr.code === '42501' || tErr.message.includes('permission denied') || tErr.message.includes('row-level security')) {
          return {
            success: false,
            message: `RLS Security restriction: ${tErr.message}. Make sure to run the SQL Script in Step 2 to enable public read/write policies.`,
          };
        }
        return { success: false, message: `Database error on teacher_profiles: ${tErr.message}` };
      }

      // Test students table
      const { error: sErr } = await client.from('students').select('id').limit(1);
      if (sErr) {
        if (sErr.message && sErr.message.includes('relation "students" does not exist')) {
          return {
            success: false,
            message: 'Connected to Supabase, but the "students" table does not exist! Please run the SQL schema in Step 2.',
          };
        }
        return { success: false, message: `Database error on students table: ${sErr.message}` };
      }

      // Test session_records table
      const { error: sessErr } = await client.from('session_records').select('id').limit(1);
      if (sessErr) {
        if (sessErr.message && sessErr.message.includes('relation "session_records" does not exist')) {
          return {
            success: false,
            message: 'Connected to Supabase, but the "session_records" table does not exist! Please run the SQL schema in Step 2.',
          };
        }
        return { success: false, message: `Database error on session_records table: ${sessErr.message}` };
      }

      return { success: true, message: 'Connected successfully to your Supabase database! All 3 tables (teacher_profiles, students, session_records) are active and ready.' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Connection test failed. Please check your URL and Anon Key.' };
    }
  },

  // Pull All Data from Supabase
  async fetchAll(targetUserEmail?: string): Promise<{
    teacher?: TeacherProfile;
    students: Student[];
    sessions: SessionRecord[];
  } | null> {
    const client = getSupabaseClient();
    if (!client) return null;

    try {
      const teacherQuery = targetUserEmail
        ? client.from('teacher_profiles').select('*').eq('email', targetUserEmail).maybeSingle()
        : client.from('teacher_profiles').select('*').limit(1).maybeSingle();

      const [teacherRes, studentsRes, sessionsRes, altSessionsRes] = await Promise.all([
        teacherQuery,
        client.from('students').select('*').order('last_name', { ascending: true }),
        client.from('session_records').select('*').order('date', { ascending: false }),
        client.from('sessions').select('*').order('date', { ascending: false }),
      ]);

      let teacher: TeacherProfile | undefined;
      if (teacherRes.data) {
        const t = teacherRes.data;
        teacher = {
          email: t.email,
          name: t.name,
          title: t.title,
          schoolName: t.school_name,
          division: t.division,
          region: t.region,
          academicYear: t.academic_year,
          department: t.department,
          masterTeacherName: t.master_teacher_name,
          masterTeacherPosition: t.master_teacher_position,
          headTeacherName: t.head_teacher_name,
          headTeacherPosition: t.head_teacher_position,
          principalName: t.principal_name,
          principalPosition: t.principal_position,
          isPasswordSet: true,
        };
      }

      const rawStudents = studentsRes.data || [];
      const studentMap = new Map<string, Student>();

      rawStudents.forEach((s: any) => {
        const sid = String(s.id);
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
          teacherEmail: s.teacher_email || '',
        });
      });

      // Combine session_records and sessions data
      const rawSessions: any[] = [];
      if (Array.isArray(sessionsRes.data) && sessionsRes.data.length > 0) {
        rawSessions.push(...sessionsRes.data);
      }
      if (Array.isArray(altSessionsRes.data) && altSessionsRes.data.length > 0) {
        rawSessions.push(...altSessionsRes.data);
      }

      const sessionMap = new Map<string, SessionRecord>();

      rawSessions.forEach((sess: any) => {
        const sessId = String(sess.id);
        const stId = String(sess.student_id || sess.studentId || '');
        const sessObj: SessionRecord = {
          id: sessId,
          studentId: stId,
          studentName: sess.student_name || sess.studentName || 'Student',
          section: sess.section || 'General',
          gradeLevel: sess.grade_level || sess.gradeLevel || 'Grade 7',
          subject: sess.subject || sess.subject || 'TLE',
          programType: sess.program_type || sess.programType || 'Remediation',
          date: sess.date || new Date().toISOString().split('T')[0],
          focusCompetency: sess.focus_competency || sess.focusCompetency || 'Competency Practice',
          activityType: sess.activity_type || sess.activityType || 'Remedial Practice',
          activityTypes: Array.isArray(sess.activity_types)
            ? sess.activity_types
            : Array.isArray(sess.activityTypes)
            ? sess.activityTypes
            : [sess.activity_type || sess.activityType || 'Remedial Practice'],
          intervention: sess.intervention || 'Task Simplification',
          interventions: Array.isArray(sess.interventions)
            ? sess.interventions
            : Array.isArray(sess.interventions)
            ? sess.interventions
            : [sess.intervention || 'Task Simplification'],
          rawScore: Number(sess.raw_score ?? sess.rawScore ?? sess.score ?? 0),
          totalItems: Number(sess.total_items ?? sess.totalItems ?? 20) || 20,
          score: Number(sess.score ?? 0),
          masteryLevel:
            sess.mastery_level ||
            sess.masteryLevel ||
            (Number(sess.score) >= 85 ? 'Mastered' : Number(sess.score) >= 75 ? 'Moving Towards Mastery' : 'Average Mastery'),
          remarks: sess.remarks || '',
          movs: Array.isArray(sess.movs) ? sess.movs : [],
          assessmentTool: sess.assessment_tool || sess.assessmentTool || undefined,
          createdAt: sess.created_at || sess.createdAt || new Date().toISOString(),
          teacherEmail: sess.teacher_email || sess.teacherEmail || '',
        };

        sessionMap.set(sessId, sessObj);

        // Auto-synthesize student if not in students table so that student view and monitoring can find them
        if (stId && !studentMap.has(stId)) {
          const parts = (sessObj.studentName || 'Student Learner').split(',');
          const lName = parts[0]?.trim() || 'Student';
          const fName = parts[1]?.trim() || 'Learner';
          studentMap.set(stId, {
            id: stId,
            lastName: lName,
            firstName: fName,
            middleInitial: '',
            gradeLevel: sessObj.gradeLevel,
            section: sessObj.section,
            subject: sessObj.subject,
            programType: sessObj.programType,
            baselineScore: 0,
            focusTopic: sessObj.focusCompetency,
            enrolledDate: sessObj.date,
            status: 'Progressing',
            teacherEmail: sessObj.teacherEmail || targetUserEmail || '',
          });
        }
      });

      const students = Array.from(studentMap.values());
      const sessions = Array.from(sessionMap.values());

      return { teacher, students, sessions };
    } catch (e: any) {
      console.warn('Unable to reach Supabase during fetch (offline/network fallback active):', e?.message || e);
      return null;
    }
  },

  // Push / Sync Local Database into Supabase
  async pushAll(teacher: TeacherProfile, students: Student[], sessions: SessionRecord[]): Promise<{ success: boolean; error?: string }> {
    const client = getSupabaseClient();
    if (!client) {
      return { success: false, error: 'Supabase client is not connected. Please enter and save your URL and Anon Key.' };
    }

    try {
      // 1. Sync Teacher Profile
      if (teacher && teacher.email) {
        const { error: tErr } = await client.from('teacher_profiles').upsert(
          {
            email: teacher.email,
            name: teacher.name,
            title: teacher.title,
            school_name: teacher.schoolName,
            division: teacher.division,
            region: teacher.region,
            academic_year: teacher.academicYear,
            department: teacher.department,
            master_teacher_name: teacher.masterTeacherName,
            master_teacher_position: teacher.masterTeacherPosition,
            head_teacher_name: teacher.headTeacherName,
            head_teacher_position: teacher.headTeacherPosition,
            principal_name: teacher.principalName,
            principal_position: teacher.principalPosition,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'email' }
        );
        if (tErr) {
          console.warn('Supabase teacher sync notice:', tErr.message || tErr);
          return { success: false, error: `Teacher profile upload failed: ${tErr.message}` };
        }
      }

      // 2. Sync Students
      if (students.length > 0) {
        for (const s of students) {
          await this.upsertStudent(s, teacher.email.toLowerCase());
        }
      }

      // 3. Sync Sessions (guaranteed students are in DB first)
      if (sessions.length > 0) {
        for (const sess of sessions) {
          await this.upsertSession(sess, teacher.email.toLowerCase());
        }
      }

      return { success: true };
    } catch (e: any) {
      console.warn('Supabase background push skipped (offline/unreachable):', e?.message || e);
      return { success: false, error: e?.message || 'Network error during sync' };
    }
  },

  // Save / update teacher profile to Supabase
  async upsertTeacher(teacher: TeacherProfile): Promise<void> {
    const client = getSupabaseClient();
    if (!client || !teacher.email) return;
    try {
      const { error } = await client.from('teacher_profiles').upsert(
        {
          email: teacher.email,
          name: teacher.name,
          title: teacher.title,
          school_name: teacher.schoolName,
          division: teacher.division,
          region: teacher.region,
          academic_year: teacher.academicYear,
          department: teacher.department,
          master_teacher_name: teacher.masterTeacherName,
          master_teacher_position: teacher.masterTeacherPosition,
          head_teacher_name: teacher.headTeacherName,
          head_teacher_position: teacher.headTeacherPosition,
          principal_name: teacher.principalName,
          principal_position: teacher.principalPosition,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'email' }
      );
      if (error) console.warn('Supabase upsertTeacher notice:', error.message || error);
    } catch (e: any) {
      console.warn('Supabase upsertTeacher skipped:', e?.message || e);
    }
  },

  // Save single student to Supabase with schema resilience
  async upsertStudent(student: Student, teacherEmail?: string): Promise<{ success: boolean; error?: string }> {
    const client = getSupabaseClient();
    if (!client) return { success: false, error: 'Supabase client is not connected' };
    try {
      const payload: any = {
        id: student.id,
        last_name: student.lastName,
        first_name: student.firstName,
        middle_initial: student.middleInitial || '',
        grade_level: student.gradeLevel,
        section: student.section,
        subject: student.subject,
        program_type: student.programType,
        baseline_score: student.baselineScore,
        focus_topic: student.focusTopic || '',
        enrolled_date: student.enrolledDate,
        status: student.status,
        parent_name: student.parentName || null,
        parent_contact: student.parentContact || null,
        schedule_details: student.scheduleDetails || null,
        notes: student.notes || null,
        is_archived: Boolean(student.isArchived),
        archived_at: student.archivedAt || null,
        teacher_email: student.teacherEmail || teacherEmail || null,
        updated_at: new Date().toISOString(),
      };

      let { error } = await client.from('students').upsert(payload, { onConflict: 'id' });
      if (error) {
        // If specific non-essential column doesn't exist, strip and retry
        const nonEssentialCols = ['parent_name', 'parent_contact', 'schedule_details', 'notes', 'teacher_email', 'middle_initial', 'is_archived', 'archived_at'];
        for (const col of nonEssentialCols) {
          if (error && error.message && error.message.toLowerCase().includes(col.toLowerCase())) {
            delete payload[col];
          }
        }
        const retry1 = await client.from('students').upsert(payload, { onConflict: 'id' });
        error = retry1.error;

        if (error) {
          // Fall back to guaranteed minimal core columns
          const minimal = {
            id: student.id,
            last_name: student.lastName,
            first_name: student.firstName,
            grade_level: student.gradeLevel,
            section: student.section,
            subject: student.subject,
            program_type: student.programType,
            enrolled_date: student.enrolledDate,
            status: student.status,
            baseline_score: student.baselineScore,
          };
          const retry2 = await client.from('students').upsert(minimal, { onConflict: 'id' });
          error = retry2.error;
        }
      }

      if (error) {
        console.warn('Supabase upsertStudent notice:', error.message);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (e: any) {
      console.warn('Supabase upsertStudent skipped:', e?.message || e);
      return { success: false, error: e?.message || 'Network exception' };
    }
  },

  // Delete student from Supabase
  async deleteStudent(studentId: string): Promise<void> {
    const client = getSupabaseClient();
    if (!client) return;
    try {
      await client.from('session_records').delete().eq('student_id', studentId);
      const { error } = await client.from('students').delete().eq('id', studentId);
      if (error) console.warn('Supabase deleteStudent notice:', error.message || error);
    } catch (e: any) {
      console.warn('Supabase deleteStudent skipped:', e?.message || e);
    }
  },

  // Save session record to Supabase with automatic foreign-key student resolution and schema resilience
  async upsertSession(session: SessionRecord, teacherEmail?: string): Promise<{ success: boolean; error?: string }> {
    const client = getSupabaseClient();
    if (!client) return { success: false, error: 'Supabase client is not connected' };
    try {
      // 1. Ensure student exists in Supabase first so the FOREIGN KEY constraint passes
      try {
        let existingStudentPayload: any = null;
        try {
          const rawStudents = typeof localStorage !== 'undefined' ? localStorage.getItem('remediation_app_students') : null;
          if (rawStudents) {
            const parsed = JSON.parse(rawStudents);
            const found = parsed.find((s: any) => s.id === session.studentId);
            if (found) {
              existingStudentPayload = {
                id: found.id,
                last_name: found.lastName || (session.studentName || 'Student').split(' ')[0] || 'Student',
                first_name: found.firstName || (session.studentName || '').split(' ').slice(1).join(' ') || 'Learner',
                middle_initial: found.middleInitial || '',
                grade_level: found.gradeLevel || session.gradeLevel || 'Grade 7',
                section: found.section || session.section || 'General',
                subject: found.subject || session.subject || 'TLE',
                program_type: found.programType || session.programType || 'Remediation',
                enrolled_date: found.enrolledDate || session.date || new Date().toISOString().split('T')[0],
                status: found.status || 'Progressing',
                baseline_score: found.baselineScore ?? 0,
                focus_topic: found.focusTopic || '',
                parent_name: found.parentName || null,
                parent_contact: found.parentContact || null,
                teacher_email: found.teacherEmail || session.teacherEmail || teacherEmail || null,
              };
            }
          }
        } catch {}

        if (!existingStudentPayload) {
          existingStudentPayload = {
            id: session.studentId,
            last_name: (session.studentName || 'Student').split(' ')[0] || 'Student',
            first_name: (session.studentName || '').split(' ').slice(1).join(' ') || 'Learner',
            grade_level: session.gradeLevel || 'Grade 7',
            section: session.section || 'General',
            subject: session.subject || 'TLE',
            program_type: session.programType || 'Remediation',
            enrolled_date: session.date || new Date().toISOString().split('T')[0],
            status: 'Progressing',
            baseline_score: 0,
            teacher_email: session.teacherEmail || teacherEmail || null,
          };
        }

        await client.from('students').upsert(existingStudentPayload, { onConflict: 'id' });
      } catch (stErr) {
        console.warn('Supabase student pre-check notice:', stErr);
      }

      const payload: any = {
        id: session.id,
        student_id: session.studentId,
        student_name: session.studentName,
        section: session.section,
        grade_level: session.gradeLevel,
        subject: session.subject,
        program_type: session.programType,
        date: session.date,
        focus_competency: session.focusCompetency,
        activity_type: session.activityType,
        activity_types: session.activityTypes || [session.activityType],
        intervention: session.intervention,
        interventions: session.interventions || [session.intervention],
        raw_score: session.rawScore ?? 0,
        total_items: session.totalItems ?? 20,
        score: session.score,
        mastery_level: session.masteryLevel,
        remarks: session.remarks || '',
        movs: session.movs || [],
        assessment_tool: session.assessmentTool || null,
        teacher_email: session.teacherEmail || teacherEmail || null,
        created_at: session.createdAt || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      let { error } = await client.from('session_records').upsert(payload, { onConflict: 'id' });
      if (error) {
        // Strip non-core columns if schema does not have them
        const nonCoreSessionCols = ['activity_types', 'interventions', 'movs', 'assessment_tool', 'teacher_email', 'raw_score', 'total_items'];
        for (const col of nonCoreSessionCols) {
          if (error && error.message && error.message.toLowerCase().includes(col.toLowerCase())) {
            delete payload[col];
          }
        }
        let retry1 = await client.from('session_records').upsert(payload, { onConflict: 'id' });
        error = retry1.error;

        // If foreign key constraint failed, ensure student row and retry
        if (error && error.message && (error.message.includes('foreign key') || error.message.includes('student_id_fkey'))) {
          await client.from('students').upsert({
            id: session.studentId,
            last_name: (session.studentName || 'Student').split(' ')[0] || 'Student',
            first_name: (session.studentName || '').split(' ').slice(1).join(' ') || 'Learner',
            grade_level: session.gradeLevel || 'Grade 7',
            section: session.section || 'General',
            subject: session.subject || 'TLE',
            program_type: session.programType || 'Remediation',
            enrolled_date: session.date || new Date().toISOString().split('T')[0],
            status: 'Progressing',
            baseline_score: 0,
          }, { onConflict: 'id' });
          const retry2 = await client.from('session_records').upsert(payload, { onConflict: 'id' });
          error = retry2.error;
        }

        // If still error, fall back to core standard columns
        if (error) {
          const corePayload = {
            id: session.id,
            student_id: session.studentId,
            student_name: session.studentName,
            section: session.section,
            grade_level: session.gradeLevel,
            subject: session.subject,
            program_type: session.programType,
            date: session.date,
            focus_competency: session.focusCompetency,
            activity_type: session.activityType,
            intervention: session.intervention,
            score: session.score,
            mastery_level: session.masteryLevel,
            remarks: session.remarks || '',
          };
          const retry3 = await client.from('session_records').upsert(corePayload, { onConflict: 'id' });
          error = retry3.error;
        }
      }

      if (error) {
        console.warn('Supabase upsertSession notice:', error.message);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (e: any) {
      console.warn('Supabase upsertSession skipped:', e?.message || e);
      return { success: false, error: e?.message || 'Network exception' };
    }
  },

  // Fetch all teacher profiles from Supabase for Admin management
  async fetchAllTeachers(): Promise<TeacherProfile[]> {
    const client = getSupabaseClient();
    if (!client) return [];
    try {
      const { data, error } = await client.from('teacher_profiles').select('*');
      if (error || !data) return [];
      return data.map((t: any) => ({
        email: t.email,
        name: t.name,
        title: t.title,
        schoolName: t.school_name,
        division: t.division,
        region: t.region,
        academicYear: t.academic_year,
        department: t.department,
        masterTeacherName: t.master_teacher_name,
        masterTeacherPosition: t.master_teacher_position,
        headTeacherName: t.head_teacher_name,
        headTeacherPosition: t.head_teacher_position,
        principalName: t.principal_name,
        principalPosition: t.principal_position,
        role: t.role || (t.email?.toLowerCase().includes('admin') ? 'admin' : 'teacher'),
        accountStatus: t.account_status || 'Active',
        assignedSubjects: t.assigned_subjects || ['ICT - Computer Programming'],
        isPasswordSet: true,
      }));
    } catch (e) {
      console.warn('Supabase fetchAllTeachers error:', e);
      return [];
    }
  },

  // Delete session from Supabase
  async deleteSession(sessionId: string): Promise<void> {
    const client = getSupabaseClient();
    if (!client) return;
    try {
      const { error } = await client.from('session_records').delete().eq('id', sessionId);
      if (error) console.warn('Supabase deleteSession notice:', error.message || error);
    } catch (e: any) {
      console.warn('Supabase deleteSession skipped:', e?.message || e);
    }
  },
};
