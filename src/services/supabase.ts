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

export function saveSupabaseConfig(config: SupabaseConfig): void {
  localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(config));
  _supabaseClient = null; // Reset singleton
}

export function clearSupabaseConfig(): void {
  localStorage.removeItem(SUPABASE_CONFIG_KEY);
  _supabaseClient = null;
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) or public access according to your project policy
ALTER TABLE teacher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_records ENABLE ROW LEVEL SECURITY;

-- Allow read/write for anon API key
CREATE POLICY "Allow public read-write for teacher_profiles" ON teacher_profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for students" ON students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for session_records" ON session_records FOR ALL USING (true) WITH CHECK (true);
`;

// Supabase API Operations with Cloud & Offline-First local fallback
export const supabaseService = {
  // Test connection
  async testConnection(url: string, anonKey: string): Promise<{ success: boolean; message: string }> {
    try {
      const client = createClient(url, anonKey);
      const { error } = await client.from('teacher_profiles').select('email').limit(1);
      if (error && error.code !== 'PGRST116') {
        // Table might not exist yet, check general connection
        if (error.message.includes('relation "teacher_profiles" does not exist')) {
          return {
            success: true,
            message: 'Connected to Supabase successfully! (Tables need to be created using the SQL script provided below)',
          };
        }
        return { success: false, message: error.message };
      }
      return { success: true, message: 'Connected successfully to Supabase database!' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Connection test failed.' };
    }
  },

  // Pull All Data from Supabase
  async fetchAll(): Promise<{
    teacher?: TeacherProfile;
    students: Student[];
    sessions: SessionRecord[];
  } | null> {
    const client = getSupabaseClient();
    if (!client) return null;

    try {
      const [teacherRes, studentsRes, sessionsRes] = await Promise.all([
        client.from('teacher_profiles').select('*').limit(1).maybeSingle(),
        client.from('students').select('*').order('last_name', { ascending: true }),
        client.from('session_records').select('*').order('date', { ascending: false }),
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

      const students: Student[] = (studentsRes.data || []).map((s: any) => ({
        id: s.id,
        lastName: s.last_name,
        firstName: s.first_name,
        middleInitial: s.middle_initial || '',
        gradeLevel: s.grade_level,
        section: s.section,
        subject: s.subject,
        programType: s.program_type,
        baselineScore: Number(s.baseline_score) || 0,
        focusTopic: s.focus_topic || '',
        enrolledDate: s.enrolled_date,
        status: s.status,
        parentName: s.parent_name,
        parentContact: s.parent_contact,
        scheduleDetails: s.schedule_details,
        notes: s.notes,
        isArchived: Boolean(s.is_archived),
        archivedAt: s.archived_at,
      }));

      const sessions: SessionRecord[] = (sessionsRes.data || []).map((sess: any) => ({
        id: sess.id,
        studentId: sess.student_id,
        studentName: sess.student_name,
        section: sess.section,
        gradeLevel: sess.grade_level,
        subject: sess.subject,
        programType: sess.program_type,
        date: sess.date,
        focusCompetency: sess.focus_competency,
        activityType: sess.activity_type,
        activityTypes: Array.isArray(sess.activity_types) ? sess.activity_types : [sess.activity_type],
        intervention: sess.intervention,
        interventions: Array.isArray(sess.interventions) ? sess.interventions : [sess.intervention],
        rawScore: Number(sess.raw_score) || 0,
        totalItems: Number(sess.total_items) || 20,
        score: Number(sess.score) || 0,
        masteryLevel: sess.mastery_level,
        remarks: sess.remarks || '',
        movs: Array.isArray(sess.movs) ? sess.movs : [],
        assessmentTool: sess.assessment_tool || undefined,
        createdAt: sess.created_at,
      }));

      return { teacher, students, sessions };
    } catch (e: any) {
      console.warn('Unable to reach Supabase during fetch (offline/network fallback active):', e?.message || e);
      return null;
    }
  },

  // Push / Sync Local Database into Supabase
  async pushAll(teacher: TeacherProfile, students: Student[], sessions: SessionRecord[]): Promise<boolean> {
    const client = getSupabaseClient();
    if (!client) {
      return false;
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
        if (tErr) console.warn('Supabase teacher sync notice:', tErr.message || tErr);
      }

      // 2. Sync Students
      if (students.length > 0) {
        const studentPayloads = students.map((s) => ({
          id: s.id,
          last_name: s.lastName,
          first_name: s.firstName,
          middle_initial: s.middleInitial || '',
          grade_level: s.gradeLevel,
          section: s.section,
          subject: s.subject,
          program_type: s.programType,
          baseline_score: s.baselineScore,
          focus_topic: s.focusTopic || '',
          enrolled_date: s.enrolledDate,
          status: s.status,
          parent_name: s.parentName || null,
          parent_contact: s.parentContact || null,
          schedule_details: s.scheduleDetails || null,
          notes: s.notes || null,
          is_archived: Boolean(s.isArchived),
          archived_at: s.archivedAt || null,
          updated_at: new Date().toISOString(),
        }));

        const { error: sErr } = await client.from('students').upsert(studentPayloads, { onConflict: 'id' });
        if (sErr) console.warn('Supabase students sync notice:', sErr.message || sErr);
      }

      // 3. Sync Sessions
      if (sessions.length > 0) {
        const sessionPayloads = sessions.map((sess) => ({
          id: sess.id,
          student_id: sess.studentId,
          student_name: sess.studentName,
          section: sess.section,
          grade_level: sess.gradeLevel,
          subject: sess.subject,
          program_type: sess.programType,
          date: sess.date,
          focus_competency: sess.focusCompetency,
          activity_type: sess.activityType,
          activity_types: sess.activityTypes || [sess.activityType],
          intervention: sess.intervention,
          interventions: sess.interventions || [sess.intervention],
          raw_score: sess.rawScore,
          total_items: sess.totalItems,
          score: sess.score,
          mastery_level: sess.masteryLevel,
          remarks: sess.remarks || '',
          movs: sess.movs || [],
          assessment_tool: sess.assessmentTool || null,
          created_at: sess.createdAt,
          updated_at: new Date().toISOString(),
        }));

        const { error: sessErr } = await client.from('session_records').upsert(sessionPayloads, { onConflict: 'id' });
        if (sessErr) console.warn('Supabase sessions sync notice:', sessErr.message || sessErr);
      }

      return true;
    } catch (e: any) {
      console.warn('Supabase background push skipped (offline/unreachable):', e?.message || e);
      return false;
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

  // Save single student to Supabase
  async upsertStudent(student: Student): Promise<void> {
    const client = getSupabaseClient();
    if (!client) return;
    try {
      const { error } = await client.from('students').upsert({
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
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
      if (error) console.warn('Supabase upsertStudent notice:', error.message || error);
    } catch (e: any) {
      console.warn('Supabase upsertStudent skipped:', e?.message || e);
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

  // Save session record to Supabase
  async upsertSession(session: SessionRecord): Promise<void> {
    const client = getSupabaseClient();
    if (!client) return;
    try {
      const { error } = await client.from('session_records').upsert({
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
        raw_score: session.rawScore,
        total_items: session.totalItems,
        score: session.score,
        mastery_level: session.masteryLevel,
        remarks: session.remarks || '',
        movs: session.movs || [],
        assessment_tool: session.assessmentTool || null,
        created_at: session.createdAt,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
      if (error) console.warn('Supabase upsertSession notice:', error.message || error);
    } catch (e: any) {
      console.warn('Supabase upsertSession skipped:', e?.message || e);
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
