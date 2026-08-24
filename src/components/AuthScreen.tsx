import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { TeacherProfile } from '../types';
import { SchoolLogo } from './SchoolLogo';
import { ShieldCheck, KeyRound, Mail, UserCheck, School, CheckCircle2, UserPlus, LogIn, AlertCircle } from 'lucide-react';

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
  const [name, setName] = useState<string>('Shirlene M. Mandapat');
  const [title, setTitle] = useState<string>('Master Teacher I / TLE Head');
  const [schoolName, setSchoolName] = useState<string>('Ramon Magsaysay (Cubao) High School');
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
    }
  }, [email]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanEmail = email.trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid school email address (e.g., teacher@depedqc.ph).');
      return;
    }

    if (authMode === 'register') {
      // Register or Reset Password flow
      if (!password || password.length < 4) {
        setError('Please set a password with at least 4 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please re-enter both fields.');
        return;
      }

      const updatedProfile = storage.setPassword(cleanEmail, password, {
        name: name.trim() || 'Teacher',
        title: title.trim() || 'Master Teacher I',
        schoolName: schoolName.trim() || 'Ramon Magsaysay (Cubao) High School',
      });

      setSuccessMsg(`Account for ${cleanEmail} saved successfully! Loading your RMCHS TLE dashboard...`);
      setTimeout(() => {
        onLoginSuccess(updatedProfile);
      }, 500);
    } else {
      // Sign in flow for registered account
      if (!password) {
        setError('Please enter your password.');
        return;
      }

      const result = storage.verifyPassword(cleanEmail, password);
      if (result.success && result.profile) {
        setSuccessMsg(`Welcome back, ${result.profile.name}!`);
        setTimeout(() => {
          onLoginSuccess(result.profile!);
        }, 400);
      } else {
        setError(result.message || 'Incorrect password or email. If you haven\'t created an account yet, switch to "Register New Teacher" tab.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-green-950 flex items-center justify-center p-4 sm:p-6 md:p-8 selection:bg-amber-400 selection:text-emerald-950">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-emerald-800/40 overflow-hidden">
        
        {/* Header decoration with RMCHS Seal */}
        <div className="bg-gradient-to-b from-emerald-900 to-emerald-950 p-6 text-white text-center relative border-b-4 border-amber-400">
          
          {/* Logo */}
          <div className="flex justify-center mb-3">
            <SchoolLogo size="lg" />
          </div>

          {/* Project S.M.I.L.E. Tag with meaning placed directly underneath */}
          <div className="flex flex-col items-center gap-1 mb-2">
            <div className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-400/25 text-yellow-300 border border-amber-400/40 shadow-xs">
              PROJECT S.M.I.L.E.
            </div>
            <p className="text-[11px] text-amber-200 font-semibold tracking-wide">
              Student Monitoring and Intervention for Learning Enhancement
            </p>
          </div>

          <h1 className="text-lg sm:text-xl font-black tracking-wide uppercase text-yellow-300 font-serif">
            RAMON MAGSAYSAY (CUBAO) HIGH SCHOOL
          </h1>
          <p className="text-xs font-bold text-white mt-0.5">
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
            className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              authMode === 'signin'
                ? 'bg-white text-emerald-950 shadow-xs border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LogIn className="w-3.5 h-3.5 text-emerald-700" />
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
            className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              authMode === 'register'
                ? 'bg-white text-emerald-950 shadow-xs border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 text-amber-600" />
            Register / Setup
          </button>
        </div>

        {/* Content Form */}
        <div className="p-6 sm:p-8 space-y-4 bg-white">
          <div className="text-center">
            <h2 className="text-base sm:text-lg font-extrabold text-slate-800">
              {authMode === 'signin' ? 'DepEd Faculty & Administrator Sign In' : 'Register Teacher Account'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {authMode === 'signin'
                ? 'Enter your registered DepEd or Administrator credentials to access your dashboard.'
                : 'Set up your credentials and DepEd details for personal classroom records.'}
            </p>
          </div>

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
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. shirlene.mandapat@depedqc.ph"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
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
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Shirlene M. Mandapat"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Position / Title
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Master Teacher I / TLE Head"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    School & Department
                  </label>
                  <div className="relative">
                    <School className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      placeholder="e.g. Ramon Magsaysay (Cubao) High School"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    />
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
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={authMode === 'register' ? 'Create a secure password' : 'Enter your password'}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
                />
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
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type your password"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 px-4 bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-700 hover:to-emerald-600 text-yellow-300 font-extrabold text-sm rounded-xl shadow-lg transition-all transform active:scale-[0.99] flex items-center justify-center gap-2 mt-2 border border-amber-400/40 cursor-pointer"
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
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer"
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
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer"
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
