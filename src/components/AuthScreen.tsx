import React, { useState } from 'react';
import { storage } from '../services/storage';
import { TeacherProfile } from '../types';
import { SchoolLogo } from './SchoolLogo';
import { ShieldCheck, KeyRound, Mail, UserCheck, Sparkles, School, Flame, Award } from 'lucide-react';

interface AuthScreenProps {
  onLoginSuccess: (profile: TeacherProfile) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const currentProfile = storage.getTeacherProfile();
  
  const [isFirstTime, setIsFirstTime] = useState<boolean>(!currentProfile.isPasswordSet);
  const [email, setEmail] = useState<string>(currentProfile.email || 'shirlene.mandapat@depedqc.ph');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [name, setName] = useState<string>(currentProfile.name || 'Shirlene M. Mandapat');
  const [title, setTitle] = useState<string>(currentProfile.title || 'Master Teacher I / TLE Head');
  const [schoolName, setSchoolName] = useState<string>(currentProfile.schoolName || 'Ramon Magsaysay (Cubao) High School');
  const [error, setError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email || !email.includes('@')) {
      setError('Please enter a valid school email address.');
      return;
    }

    if (isFirstTime) {
      // First time password setup flow
      if (!password || password.length < 4) {
        setError('Please set a password with at least 4 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please verify.');
        return;
      }

      const updatedProfile = storage.setPassword(email, password);
      updatedProfile.name = name || 'Teacher';
      updatedProfile.title = title || 'Master Teacher I';
      updatedProfile.schoolName = schoolName || 'Ramon Magsaysay (Cubao) High School';
      updatedProfile.division = 'SDO Quezon City • TLE Department';
      storage.saveTeacherProfile(updatedProfile);

      setSuccessMsg('Account and password set successfully! Welcome to your RMCHS TLE dashboard.');
      setTimeout(() => {
        onLoginSuccess(updatedProfile);
      }, 500);
    } else {
      // Returning teacher login flow
      if (!password) {
        setError('Please enter your password.');
        return;
      }

      const isValid = storage.verifyPassword(email, password);
      if (isValid) {
        const profile = storage.getTeacherProfile();
        onLoginSuccess(profile);
      } else {
        setError('Incorrect password or email. If you are logging in for the first time, switch to "First Time Setup" below.');
      }
    }
  };

  const handleDemoLogin = () => {
    storage.resetToSampleData();
    const profile = storage.getTeacherProfile();
    onLoginSuccess(profile);
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

        {/* Content Form */}
        <div className="p-6 sm:p-8 space-y-5 bg-white">
          <div className="text-center">
            <h2 className="text-base sm:text-lg font-extrabold text-slate-800">
              {isFirstTime ? 'Set Up Your Teacher Account' : 'Teacher Portal Sign In'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {isFirstTime
                ? 'Enter your email and set a secure password for your first time logging in.'
                : 'Sign in to access your student roster and intervention records.'}
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold leading-relaxed">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold leading-relaxed">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                DepEd Teacher Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. teacher.name@depedqc.ph"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
                />
              </div>
            </div>

            {/* Extra Teacher Info on First Time Setup */}
            {isFirstTime && (
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
                      placeholder="e.g. Master Teacher I"
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
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isFirstTime ? 'Create New Password' : 'Password'}{' '}
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isFirstTime ? 'Set password (min 4 characters)' : 'Enter password'}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
                />
              </div>
            </div>

            {/* Confirm Password Field for first time */}
            {isFirstTime && (
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
                    placeholder="Re-enter password"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 px-4 bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-700 hover:to-emerald-600 text-yellow-300 font-extrabold text-sm rounded-xl shadow-lg transition-all transform active:scale-[0.99] flex items-center justify-center gap-2 mt-2 border border-amber-400/40"
            >
              <ShieldCheck className="w-4 h-4 text-amber-300" />
              {isFirstTime ? 'Save Account & Sign In' : 'SIGN IN TO PORTAL'}
            </button>
          </form>

          {/* Toggle between first time & returning */}
          <div className="pt-2 text-center border-t border-slate-100 space-y-3">
            <button
              type="button"
              onClick={() => {
                setIsFirstTime(!isFirstTime);
                setError('');
                setPassword('');
                setConfirmPassword('');
              }}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 hover:underline"
            >
              {isFirstTime
                ? 'Already set up your password? Click here to Sign In'
                : 'First time logging in? Click here to set your password'}
            </button>

            <div>
              <button
                type="button"
                onClick={handleDemoLogin}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold transition border border-amber-300/80 shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                Quick Demo Login (RMCHS Master Teacher)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
