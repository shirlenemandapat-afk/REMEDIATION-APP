import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { TeacherProfile, UserRole, getRoleDefinition } from '../types';
import { SchoolLogo } from './SchoolLogo';
import { TeacherPositionSelect } from './BookingSchedulePicker';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  X,
  School,
  BookOpen,
  UserCheck,
  Mail,
  ArrowLeft,
} from 'lucide-react';

interface AuthScreenProps {
  onLoginSuccess: (profile: TeacherProfile) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const savedRemembered = localStorage.getItem('projectsmile_remember_username') || '';
  const initialUsername = savedRemembered || storage.getLastLoginEmail() || 'shirlene.mandapat@depedqc.ph';

  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');
  const [username, setUsername] = useState<string>(initialUsername);
  const [password, setPassword] = useState<string>('');
  const [rememberMe, setRememberMe] = useState<boolean>(!!savedRemembered);
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  // Registration profile fields
  const [name, setName] = useState<string>('Shirlene M. Mandapat');
  const [title, setTitle] = useState<string>('Master Teacher I / TLE Coordinator');
  const [schoolName, setSchoolName] = useState<string>('Ramon Magsaysay (Cubao) High School');
  const [department, setDepartment] = useState<string>('Technology and Livelihood Education (TLE)');
  const [selectedRole, setSelectedRole] = useState<UserRole>('teacher');

  const [error, setError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState<boolean>(false);

  // Sync latest accounts from server on component mount
  useEffect(() => {
    storage.syncFromServer().then(() => {
      const found = storage.findAccountByEmail(username);
      if (found) {
        if (found.name) setName(found.name);
        if (found.title) setTitle(found.title);
        if (found.schoolName) setSchoolName(found.schoolName);
        if (found.department) setDepartment(found.department);
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanInput = username.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanInput) {
      setError('Please enter your username or email.');
      return;
    }

    // Resolve email from username or direct email
    let resolvedEmail = cleanInput;
    if (!resolvedEmail.includes('@')) {
      const allAccounts = storage.getRegisteredAccounts();
      const match = Object.keys(allAccounts).find((em) => {
        const u = em.split('@')[0].toLowerCase();
        return u === cleanInput;
      });
      if (match) {
        resolvedEmail = match;
      } else if (cleanInput === 'admin') {
        resolvedEmail = 'admin@projectsmile';
      } else if (cleanInput.includes('shirlene') || cleanInput.includes('mandapat')) {
        resolvedEmail = 'shirlene.mandapat@depedqc.ph';
      } else {
        resolvedEmail = `${cleanInput}@depedqc.ph`;
      }
    }

    if (rememberMe) {
      localStorage.setItem('projectsmile_remember_username', username.trim());
    } else {
      localStorage.removeItem('projectsmile_remember_username');
    }

    setIsLoading(true);

    try {
      if (authMode === 'register') {
        if (!cleanPassword || cleanPassword.length < 4) {
          setError('Please create a password with at least 4 characters.');
          setIsLoading(false);
          return;
        }
        if (cleanPassword !== confirmPassword.trim()) {
          setError('Passwords do not match. Please re-enter both fields.');
          setIsLoading(false);
          return;
        }

        const result = await storage.setPasswordAsync(resolvedEmail, cleanPassword, {
          name: name.trim() || 'Teacher',
          title: title.trim() || 'Teacher I / TLE Faculty',
          schoolName: schoolName.trim() || 'Ramon Magsaysay (Cubao) High School',
          department: department.trim() || 'Technology and Livelihood Education (TLE)',
          role: selectedRole,
        });

        if (result.success && result.profile) {
          setSuccessMsg(`Account for ${resolvedEmail} registered successfully! Loading your portal...`);
          setTimeout(() => {
            onLoginSuccess(result.profile);
          }, 350);
        } else {
          setError(result.message || 'Failed to save account credentials.');
          setIsLoading(false);
        }
      } else {
        if (!cleanPassword) {
          setError('Please enter your password.');
          setIsLoading(false);
          return;
        }

        const result = await storage.verifyPasswordAsync(resolvedEmail, cleanPassword);
        if (result.success && result.profile) {
          setSuccessMsg(`Welcome back, ${result.profile.name}! Logging you in...`);
          setTimeout(() => {
            onLoginSuccess(result.profile!);
          }, 350);
        } else {
          setError(
            result.message ||
              'Incorrect username or password. Please verify your credentials.'
          );
          setIsLoading(false);
        }
      }
    } catch (err: any) {
      setError('Authentication error. Please check your connection and try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-0 sm:p-4 md:p-6 lg:p-8 selection:bg-amber-400 selection:text-emerald-950">
      {/* Split Screen Container with Smooth Entrance Animation */}
      <div className="w-full max-w-5xl bg-white sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-700/40 flex flex-col md:flex-row min-h-[600px] relative animate-card-entrance">
        
        {/* ============================================================== */}
        {/* LEFT PANEL: Project S.M.I.L.E. Branding & Emblem (Dark Glossy Green) */}
        {/* ============================================================== */}
        <div className="w-full md:w-1/2 bg-gradient-to-br from-[#06321a] via-[#031d0e] to-[#010b05] text-white relative flex flex-col justify-between p-8 sm:p-12 overflow-hidden shadow-[inset_0_2px_3px_rgba(255,255,255,0.35),inset_0_-10px_24px_rgba(0,0,0,0.75)]">
          
          {/* Crisp Curved Glass Specular Reflection at Top */}
          <div
            className="absolute -top-16 -left-20 -right-20 h-[48%] rounded-b-[100%] bg-gradient-to-b from-white/[0.22] via-white/[0.05] to-transparent pointer-events-none z-0"
            style={{ transform: 'rotate(-5deg)' }}
          />

          {/* Sharp Diagonal Glossy Window Sheen */}
          <div
            className="absolute inset-0 bg-[linear-gradient(125deg,transparent_28%,rgba(255,255,255,0.12)_43%,rgba(255,255,255,0.03)_50%,transparent_62%)] pointer-events-none z-0"
          />

          {/* Deep Emerald Spotlight Behind Official Seal */}
          <div
            className="absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,rgba(16,185,129,0.22)_0%,rgba(6,78,59,0.1)_42%,transparent_70%)] pointer-events-none z-0"
          />

          {/* Top & Left Glossy Bevel Rim */}
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/55 to-transparent pointer-events-none z-10" />
          <div className="absolute top-0 bottom-0 left-0 w-[1.5px] bg-gradient-to-b from-white/40 via-white/10 to-transparent pointer-events-none z-10" />

          {/* Golden Wave Flowing Across Bottom */}
          <div className="absolute bottom-0 left-0 right-0 pointer-events-none z-0">
            <svg
              viewBox="0 0 500 130"
              preserveAspectRatio="none"
              className="w-full h-28 sm:h-32 md:h-36 text-[#F6B819] fill-current drop-shadow-[0_-4px_12px_rgba(0,0,0,0.45)]"
            >
              <path d="M0,25 C140,90 320,-10 500,45 L500,130 L0,130 Z" />
            </svg>
          </div>

          {/* Center Brand Identity positioned higher on the panel */}
          <div className="relative z-10 flex flex-col items-center text-center my-auto pt-0 pb-24 sm:pb-28 -mt-4 sm:-mt-6">
            
            {/* Ramon Magsaysay (Cubao) High School Official Seal with Subtle Glow & Gentle Float */}
            <div className="animate-fade-in-up delay-75">
              <div className="relative mb-4 flex items-center justify-center animate-logo-float group">
                {/* Subtle Breathing Golden/Emerald Glow Halo */}
                <div className="absolute -inset-2.5 rounded-full bg-gradient-to-tr from-[#F6B819]/35 via-emerald-400/20 to-[#F6B819]/35 blur-md animate-logo-glow pointer-events-none" />
                
                {/* Crisp Outer Golden Ring */}
                <div className="absolute -inset-1.5 rounded-full border border-[#F6B819]/45 pointer-events-none transition-transform duration-500 group-hover:scale-105" />

                {/* Main Circular Seal Container */}
                <div className="w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-full border-4 border-[#F6B819] bg-white flex items-center justify-center p-2 shadow-[0_14px_32px_rgba(0,0,0,0.65),0_0_24px_rgba(246,184,25,0.35)] relative overflow-hidden shrink-0 transition-transform duration-500 group-hover:scale-[1.03]">
                  <SchoolLogo size="xl" showShadow={false} className="w-full h-full object-contain relative z-10 transition-transform duration-500 group-hover:scale-105" />
                  
                  {/* Subtle Stationary Glass Gloss & Interactive Hover Sheen */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/10 to-white/30 pointer-events-none z-20" />
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-12 pointer-events-none z-20" />
                </div>
              </div>
            </div>

            {/* "Project" Text */}
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] animate-fade-in-up delay-150">
              Project
            </h1>

            {/* "S.M.I.L.E." Bold Golden Title */}
            <div className="text-5xl sm:text-6xl font-black text-[#F6B819] tracking-wider leading-none mt-1 drop-shadow-[0_3px_8px_rgba(0,0,0,0.55)] animate-fade-in-up delay-225">
              S.M.I.L.E.
            </div>

            {/* Iconic Curved Golden Smiley with Cheek Bars under S.M.I.L.E. */}
            <div className="w-full flex justify-center mt-2 sm:mt-2.5 mb-2 animate-fade-in-up delay-225">
              <svg
                viewBox="0 0 200 66"
                className="w-40 sm:w-48 h-11 sm:h-13 text-[#F6B819] drop-shadow-[0_2px_4px_rgba(0,0,0,0.45)]"
                fill="none"
                stroke="currentColor"
                strokeWidth="9.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {/* Main Smile Curve */}
                <path d="M 25 18 C 62 68, 138 68, 175 18" />
                {/* Left Cheek Bar */}
                <path d="M 13.5 27.5 L 36.5 8.5" />
                {/* Right Cheek Bar */}
                <path d="M 163.5 8.5 L 186.5 27.5" />
              </svg>
            </div>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm font-medium text-white/95 max-w-xs leading-relaxed px-2 drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)] animate-fade-in-up delay-300">
              Student Monitoring and Intervention for Learning Enhancement
            </p>
          </div>

          {/* Bottom Quote placed in the lower part inside the yellow wave with white font color */}
          <div className="absolute bottom-3 sm:bottom-4.5 left-6 sm:left-10 z-10 text-[11px] sm:text-xs leading-snug font-bold text-white drop-shadow-[0_1.5px_2.5px_rgba(0,0,0,0.65)] animate-fade-in-up delay-375">
            <p>Empowering Students. Supporting Learning.</p>
            <p>Building Brighter Futures.</p>
          </div>
        </div>

        {/* ============================================================== */}
        {/* RIGHT PANEL: Sign In / Registration Form (Clean Off-White)     */}
        {/* ============================================================== */}
        <div className="w-full md:w-1/2 bg-[#F8FAF5] relative flex flex-col justify-center p-8 sm:p-12 overflow-hidden">
          
          {/* Corner Wave Continuation in Right Panel */}
          <div className="absolute bottom-0 left-0 right-0 pointer-events-none z-0">
            <svg
              viewBox="0 0 500 80"
              preserveAspectRatio="none"
              className="w-full h-16 text-[#F6B819] fill-current opacity-90"
            >
              <path d="M0,0 C120,60 300,10 500,40 L500,80 L0,80 Z" />
            </svg>
          </div>

          <div className="relative z-10 max-w-md w-full mx-auto space-y-6">
            
            {/* Header: User Icon + "Welcome Back!" */}
            <div className="flex items-center gap-3.5 animate-fade-in-up delay-75">
              <div className="relative overflow-hidden w-12 h-12 rounded-full bg-gradient-to-b from-[#0b4826] via-[#042412] to-[#011108] flex items-center justify-center text-white shadow-[0_4px_12px_rgba(3,29,14,0.45),inset_0_2px_2px_rgba(255,255,255,0.45)] border border-emerald-700/50 shrink-0 transition-transform duration-300 hover:scale-105">
                <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                {authMode === 'signin' ? (
                  <User className="w-6 h-6 text-white drop-shadow-xs relative z-10" />
                ) : (
                  <UserPlus className="w-6 h-6 text-white drop-shadow-xs relative z-10" />
                )}
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#042412] tracking-tight">
                  {authMode === 'signin' ? 'Welcome Back!' : 'Create Account'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                  {authMode === 'signin'
                    ? 'Sign in to continue to Project S.M.I.L.E.'
                    : 'Register your faculty credentials for Project S.M.I.L.E.'}
                </p>
              </div>
            </div>

            {/* Error & Success Alerts */}
            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-start gap-2 shadow-xs animate-fade-in-up">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                <div>{error}</div>
              </div>
            )}
            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-xs animate-fade-in-up">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <div>{successMsg}</div>
              </div>
            )}

            {/* Main Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Username Input */}
              <div className="space-y-1.5 animate-fade-in-up delay-150">
                <label className="block text-xs font-bold text-slate-800">
                  {authMode === 'signin' ? 'Username' : 'Username / DepEd Email'}
                </label>
                <div className="relative group">
                  <User className="w-4 h-4 text-slate-400 group-focus-within:text-[#0b4628] group-focus-within:scale-110 transition-all duration-300 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 hover:border-emerald-700/40 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0b4628] focus:border-transparent focus:shadow-[0_4px_14px_rgba(11,70,40,0.12)] transition-all duration-300 shadow-xs font-medium"
                  />
                </div>
              </div>

              {/* Extra registration fields when in register mode */}
              {authMode === 'register' && (
                <div className="space-y-4 animate-fade-in-up">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800">
                      Full Name
                    </label>
                    <div className="relative group">
                      <UserCheck className="w-4 h-4 text-slate-400 group-focus-within:text-[#0b4628] group-focus-within:scale-110 transition-all duration-300 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Shirlene M. Mandapat"
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 hover:border-emerald-700/40 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0b4628] focus:shadow-[0_4px_14px_rgba(11,70,40,0.12)] transition-all duration-300"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <TeacherPositionSelect
                      label="Position / Title"
                      value={title}
                      onChange={(val) => setTitle(val)}
                    />
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        System Role
                      </label>
                      <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 hover:border-emerald-700/40 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#0b4628] transition-all duration-300"
                      >
                        <option value="teacher">TEACHER</option>
                        <option value="head_teacher">HEAD TEACHER</option>
                        <option value="school_head">SCHOOL HEAD</option>
                        <option value="coordinator">COORDINATOR</option>
                        <option value="admin">ADMIN</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Password Input */}
              <div className="space-y-1.5 animate-fade-in-up delay-225">
                <label className="block text-xs font-bold text-slate-800">
                  Password
                </label>
                <div className="relative group">
                  <Lock className="w-4 h-4 text-slate-400 group-focus-within:text-[#0b4628] group-focus-within:scale-110 transition-all duration-300 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    autoComplete={authMode === 'register' ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 hover:border-emerald-700/40 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0b4628] focus:border-transparent focus:shadow-[0_4px_14px_rgba(11,70,40,0.12)] transition-all duration-300 shadow-xs font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0b4628] transition-colors duration-200 p-1 cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password for Register Mode */}
              {authMode === 'register' && (
                <div className="space-y-1.5 animate-fade-in-up">
                  <label className="block text-xs font-bold text-slate-800">
                    Confirm Password
                  </label>
                  <div className="relative group">
                    <ShieldCheck className="w-4 h-4 text-slate-400 group-focus-within:text-[#0b4628] group-focus-within:scale-110 transition-all duration-300 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-type your password"
                      className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 hover:border-emerald-700/40 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0b4628] focus:shadow-[0_4px_14px_rgba(11,70,40,0.12)] transition-all duration-300"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0b4628] transition-colors duration-200 p-1 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Remember Me & Forgot Password Row (Shown in Sign In mode) */}
              {authMode === 'signin' && (
                <div className="flex items-center justify-between text-xs pt-0.5 animate-fade-in-up delay-225">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 hover:text-slate-900 transition-colors font-medium">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded text-[#0b4628] accent-[#0b4628] cursor-pointer transition-transform duration-200 hover:scale-105"
                    />
                    <span>Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotPasswordModal(true)}
                    className="font-semibold text-[#0b4628] hover:text-[#06321a] hover:underline transition-colors cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}

              {/* Primary Action Button: Dark Glossy Forest Green "SIGN IN" with Interactive Hover Lift & Sheen */}
              <div className="animate-fade-in-up delay-300">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative overflow-hidden w-full py-3 px-4 bg-gradient-to-b from-[#0b4826] via-[#042412] to-[#011108] hover:from-[#0f5c31] hover:via-[#06321a] hover:to-[#02190c] disabled:opacity-60 text-white font-extrabold text-xs sm:text-sm tracking-wider uppercase rounded-xl transition-all duration-300 shadow-[0_6px_16px_rgba(3,29,14,0.45),inset_0_1.5px_1.5px_rgba(255,255,255,0.45)] hover:shadow-[0_10px_24px_-4px_rgba(6,50,26,0.65),inset_0_1.5px_2px_rgba(255,255,255,0.55)] hover:-translate-y-0.5 border border-emerald-800/60 active:translate-y-0 active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
                >
                  <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                  <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-12 pointer-events-none" />
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin relative z-10" />
                  ) : null}
                  <span className="relative z-10 drop-shadow-xs">
                    {isLoading
                      ? 'VERIFYING...'
                      : authMode === 'register'
                      ? 'REGISTER ACCOUNT'
                      : 'SIGN IN'}
                  </span>
                </button>
              </div>

              {/* OR Divider */}
              <div className="relative flex items-center justify-center my-3 animate-fade-in-up delay-300">
                <div className="border-t border-slate-300 w-full" />
                <span className="bg-[#F8FAF5] px-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest absolute">
                  OR
                </span>
              </div>

              {/* Secondary Action Button: Outline "REGISTER AN ACCOUNT" / "BACK TO SIGN IN" with Interactive Hover */}
              <div className="animate-fade-in-up delay-375">
                {authMode === 'signin' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('register');
                      setError('');
                      setSuccessMsg('');
                    }}
                    className="group w-full py-2.5 px-4 bg-white hover:bg-emerald-50/70 text-[#0b4628] border-2 border-[#0b4628] font-extrabold text-xs sm:text-sm tracking-wider uppercase rounded-xl transition-all duration-300 shadow-xs hover:shadow-[0_6px_16px_rgba(11,70,40,0.14)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-4 h-4 text-[#0b4628] transition-transform duration-300 group-hover:scale-110" />
                    <span>REGISTER AN ACCOUNT</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signin');
                      setError('');
                      setSuccessMsg('');
                    }}
                    className="group w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 border-2 border-slate-300 hover:border-slate-400 font-extrabold text-xs sm:text-sm tracking-wider uppercase rounded-xl transition-all duration-300 shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4 text-slate-600 transition-transform duration-300 group-hover:-translate-x-1" />
                    <span>BACK TO SIGN IN</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-emerald-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#0b4628]">
                <HelpCircle className="w-5 h-5 text-[#0b4628]" />
                <h3 className="font-extrabold text-base">Account Password Assistance</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotPasswordModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
              <p>
                To reset your <strong>Project S.M.I.L.E.</strong> faculty password:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  Contact your Department Head or ICT Administrator (<strong>admin@projectsmile</strong>).
                </li>
                <li>
                  If you have not set a custom password yet, you can click <strong>Register an Account</strong> to initialize your credentials.
                </li>
                <li>
                  Default administrator credentials remain active for authorized DepEd supervisors.
                </li>
              </ul>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForgotPasswordModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForgotPasswordModal(false);
                  setAuthMode('register');
                }}
                className="px-4 py-2 bg-[#0b4628] hover:bg-[#07301b] text-white text-xs font-bold rounded-xl"
              >
                Go to Register
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
