import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { TeacherProfile } from '../types';
import { SchoolLogo } from './SchoolLogo';
import { TeacherPositionSelect } from './BookingSchedulePicker';
import {
  ShieldCheck,
  KeyRound,
  Mail,
  UserCheck,
  School,
  CheckCircle2,
  UserPlus,
  LogIn,
  AlertCircle,
  BookOpen,
  Eye,
  EyeOff,
  Sparkles,
  Smartphone,
} from 'lucide-react';

interface AuthScreenProps {
  onLoginSuccess: (profile: TeacherProfile) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const initialEmail = storage.getLastLoginEmail();
  const isInitialRegistered = storage.isAccountRegistered(initialEmail);

  const [authMode, setAuthMode] = useState<'signin' | 'register'>(
    isInitialRegistered ? 'signin' : 'signin'
  );
  
  const [email, setEmail] = useState<string>(initialEmail);
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [name, setName] = useState<string>('Shirlene M. Mandapat');
  const [title, setTitle] = useState<string>('Master Teacher I / TLE Coordinator');
  const [schoolName, setSchoolName] = useState<string>('Ramon Magsaysay (Cubao) High School');
  const [department, setDepartment] = useState<string>('Technology and Livelihood Education (TLE)');
  const [error, setError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Check if current typed email is already registered
  const registeredAccount = storage.findAccountByEmail(email);
  const isCurrentEmailRegistered = !!(registeredAccount && registeredAccount.isPasswordSet);

  // Sync profile details if registered account exists
  useEffect(() => {
    if (registeredAccount) {
      if (registeredAccount.name) setName(registeredAccount.name);
      if (registeredAccount.title) setTitle(registeredAccount.title);
      if (registeredAccount.schoolName) setSchoolName(registeredAccount.schoolName);
      if (registeredAccount.department) setDepartment(registeredAccount.department);
    }
  }, [email]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid school email address (e.g., shirlene.mandapat@depedqc.ph).');
      return;
    }

    if (authMode === 'register') {
      // Register or Reset Password flow
      if (!cleanPassword || cleanPassword.length < 4) {
        setError('Please set a password with at least 4 characters.');
        return;
      }
      if (cleanPassword !== confirmPassword.trim()) {
        setError('Passwords do not match. Please re-enter both fields.');
        return;
      }

      const updatedProfile = storage.setPassword(cleanEmail, cleanPassword, {
        name: name.trim() || 'Shirlene M. Mandapat',
        title: title.trim() || 'Master Teacher I / TLE Coordinator',
        schoolName: schoolName.trim() || 'Ramon Magsaysay (Cubao) High School',
        department: department.trim() || 'Technology and Livelihood Education (TLE)',
      });

      setSuccessMsg(`Account for ${cleanEmail} saved successfully! Loading your RMCHS TLE dashboard...`);
      setTimeout(() => {
        onLoginSuccess(updatedProfile);
      }, 500);
    } else {
      // Sign in flow for registered account
      if (!cleanPassword) {
        setError('Please enter your password.');
        return;
      }

      const result = storage.verifyPassword(cleanEmail, cleanPassword);
      if (result.success && result.profile) {
        setSuccessMsg(`Welcome back, ${result.profile.name}!`);
        setTimeout(() => {
          onLoginSuccess(result.profile!);
        }, 400);
      } else {
        setError(result.message || 'Incorrect password or email. If you haven\'t set up a password yet, switch to the "Register / Setup" tab.');
      }
    }
  };

  const handleQuickFillTeacher = () => {
    setEmail('shirlene.mandapat@depedqc.ph');
    setPassword('teacher123');
    setError('');
  };

  const handleQuickFillAdmin = () => {
    setEmail('admin@projectsmile');
    setPassword('admin2025');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-green-950 flex items-center justify-center p-3 sm:p-6 md:p-8 selection:bg-amber-400 selection:text-emerald-950">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-emerald-800/40 overflow-hidden">
        
        {/* Header decoration with RMCHS Seal */}
        <div className="bg-gradient-to-b from-emerald-900 to-emerald-950 p-5 sm:p-6 text-white text-center relative border-b-4 border-amber-400">
          
          {/* Logo */}
          <div className="flex justify-center mb-2.5">
            <SchoolLogo size="lg" />
          </div>

          {/* Project S.M.I.L.E. Tag with meaning placed directly underneath */}
          <div className="flex flex-col items-center gap-1 mb-2">
            <div className="inline-flex items-center px-3 py-0.5 rounded-full text-[11px] sm:text-xs font-black uppercase tracking-wider bg-amber-400/25 text-yellow-300 border border-amber-400/40 shadow-xs">
              PROJECT S.M.I.L.E.
            </div>
            <p className="text-[10.5px] sm:text-[11px] text-amber-200 font-semibold tracking-wide px-2">
              Student Monitoring and Intervention for Learning Enhancement
            </p>
          </div>

          <h1 className="text-base sm:text-lg font-black tracking-wide uppercase text-yellow-300 font-serif">
            RAMON MAGSAYSAY (CUBAO) HIGH SCHOOL
          </h1>
          <p className="text-[11px] sm:text-xs font-bold text-white mt-0.5">
            Technology and Livelihood Education (TLE)
          </p>
        </div>

        {/* Auth Mode Switcher Tabs */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-100 border-b border-slate-200">
          <button
            type="button"
            onClick={() => {
              setAuthMode('signin');
              setError('');
              setPassword('');
              setConfirmPassword('');
            }}
            className={`min-h-[44px] py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              authMode === 'signin'
                ? 'bg-white text-emerald-950 shadow-xs border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LogIn className="w-4 h-4 text-emerald-700" />
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('register');
              setError('');
              setPassword('');
              setConfirmPassword('');
            }}
            className={`min-h-[44px] py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              authMode === 'register'
                ? 'bg-white text-emerald-950 shadow-xs border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserPlus className="w-4 h-4 text-amber-600" />
            Register / Setup
          </button>
        </div>

        {/* Content Form */}
        <div className="p-5 sm:p-8 space-y-4 bg-white">
          <div className="text-center">
            <h2 className="text-base sm:text-lg font-extrabold text-slate-800">
              {authMode === 'signin' ? 'DepEd Faculty & Administrator Sign In' : 'Register / Reset Teacher Account'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {authMode === 'signin'
                ? 'Enter your registered DepEd credentials to access your student records.'
                : 'Set up your credentials and DepEd details for personal classroom records.'}
            </p>
          </div>

          {/* Quick autofill helper chips for mobile phone users */}
          {authMode === 'signin' && (
            <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-900 mb-2">
                <Smartphone className="w-3.5 h-3.5 text-emerald-700" />
                <span>Quick Fill for Mobile:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleQuickFillTeacher}
                  className="min-h-[40px] px-2.5 py-1.5 bg-white hover:bg-emerald-100/60 border border-emerald-300/80 rounded-xl text-left transition text-xs cursor-pointer shadow-2xs flex items-center justify-between"
                >
                  <div>
                    <p className="font-bold text-slate-800 text-[11px]">Teacher Account</p>
                    <p className="text-[10px] text-slate-500 truncate max-w-[140px]">shirlene.mandapat</p>
                  </div>
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                </button>
                <button
                  type="button"
                  onClick={handleQuickFillAdmin}
                  className="min-h-[40px] px-2.5 py-1.5 bg-white hover:bg-purple-50 border border-purple-300/80 rounded-xl text-left transition text-xs cursor-pointer shadow-2xs flex items-center justify-between"
                >
                  <div>
                    <p className="font-bold text-slate-800 text-[11px]">Admin Console</p>
                    <p className="text-[10px] text-slate-500">admin@projectsmile</p>
                  </div>
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold leading-relaxed flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold leading-relaxed flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <div>{successMsg}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  DepEd Teacher Email <span className="text-red-500">*</span>
                </label>
                {isCurrentEmailRegistered && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Registered
                  </span>
                )}
              </div>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  inputMode="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. shirlene.mandapat@depedqc.ph"
                  className="w-full pl-9 pr-3 min-h-[44px] py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
                />
              </div>
            </div>

            {/* Extra Teacher Info on Register Mode */}
            {authMode === 'register' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <UserCheck className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        autoComplete="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Shirlene M. Mandapat"
                        className="w-full pl-9 pr-3 min-h-[44px] py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                      />
                    </div>
                  </div>
                  <div>
                    <TeacherPositionSelect
                      label="Position / Title"
                      value={title}
                      onChange={(val) => setTitle(val)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      School Name
                    </label>
                    <div className="relative">
                      <School className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={schoolName}
                        onChange={(e) => setSchoolName(e.target.value)}
                        placeholder="e.g. Ramon Magsaysay (Cubao) High School"
                        className="w-full pl-9 pr-3 min-h-[44px] py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Department
                    </label>
                    <div className="relative">
                      <BookOpen className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder="e.g. Technology and Livelihood Education (TLE)"
                        className="w-full pl-9 pr-3 min-h-[44px] py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  {authMode === 'register' ? 'Create Password (min 4 chars)' : 'Password'}{' '}
                  <span className="text-red-500">*</span>
                </label>
                {authMode === 'signin' && (
                  <span className="text-[10px] text-slate-400 font-medium">Default: teacher123</span>
                )}
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  autoComplete={authMode === 'register' ? 'new-password' : 'current-password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={authMode === 'register' ? 'Create a secure password' : 'Enter your password'}
                  className="w-full pl-9 pr-10 min-h-[44px] py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password Field for register */}
            {authMode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type your password"
                    className="w-full pl-9 pr-10 min-h-[44px] py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full min-h-[46px] py-3 px-4 bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-700 hover:to-emerald-600 text-yellow-300 font-extrabold text-sm rounded-xl shadow-lg transition-all transform active:scale-[0.99] flex items-center justify-center gap-2 mt-2 border border-amber-400/40 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-amber-300" />
              {authMode === 'register' ? 'SAVE ACCOUNT & SIGN IN' : 'SIGN IN TO PORTAL'}
            </button>
          </form>

          {/* Switch mode helper */}
          <div className="pt-2 text-center border-t border-slate-100">
            {authMode === 'signin' ? (
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setError('');
                }}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer py-1.5 inline-block"
              >
                Need to register a new email or reset password? Click here
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signin');
                  setError('');
                }}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer py-1.5 inline-block"
              >
                Already registered? Click here to Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

