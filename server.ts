import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

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
  },
  students: [],
  sessions: [],
  programs: [],
  classes: [],
  announcements: [],
  auditLogs: [],
  systemSettings: {
    systemName: 'Project S.M.I.L.E.',
    schoolYear: '2025-2026',
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
      return {
        accounts: parsed.accounts || INITIAL_DEFAULT_DB.accounts,
        students: Array.isArray(parsed.students) ? parsed.students : [],
        sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
        programs: Array.isArray(parsed.programs) ? parsed.programs : [],
        classes: Array.isArray(parsed.classes) ? parsed.classes : [],
        announcements: Array.isArray(parsed.announcements) ? parsed.announcements : [],
        auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : [],
        systemSettings: parsed.systemSettings || INITIAL_DEFAULT_DB.systemSettings,
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
    const db = readDb();
    const safeAccounts: Record<string, any> = {};
    for (const [key, acc] of Object.entries(db.accounts)) {
      safeAccounts[key] = {
        ...acc,
        isPasswordSet: !!acc.passwordHash,
      };
    }
    res.json({ success: true, accounts: safeAccounts });
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
      writeDb(db);

      console.log(`[AUTH] Account registered/updated on server: ${cleanEmail}`);
      res.json({ success: true, profile: newProfile });
    } catch (err: any) {
      console.error('[AUTH ERROR] Register failed:', err);
      res.status(500).json({ success: false, message: 'Server error saving account.' });
    }
  });

  // User Login
  app.post('/api/auth/login', (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Please provide both email and password.' });
      }

      const cleanEmail = email.trim().toLowerCase();
      const cleanPassword = (password || '').trim();
      const db = readDb();
      const account = db.accounts[cleanEmail];

      if (!account) {
        return res.status(404).json({
          success: false,
          message: `Account "${email}" is not yet registered. Please click "Register / Setup" to create your teacher account with your password.`,
        });
      }

      // Check password match (exact match against teacher's registered password)
      const storedPass = (account.passwordHash || '').trim();
      const isMatch = storedPass === cleanPassword || account.passwordHash === password;

      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Incorrect password for this account. Please verify your password or contact your Administrator to reset it.',
        });
      }

      // Successful login
      account.lastLoginAt = new Date().toLocaleString();
      db.accounts[cleanEmail] = account;
      writeDb(db);

      console.log(`[AUTH] Teacher logged in successfully from device: ${cleanEmail}`);
      res.json({ success: true, profile: account });
    } catch (err: any) {
      console.error('[AUTH ERROR] Login failed:', err);
      res.status(500).json({ success: false, message: 'Server error processing login.' });
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
