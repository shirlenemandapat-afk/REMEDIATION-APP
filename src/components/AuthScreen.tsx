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
      {/* Split Screen Container */}
      <div className="w-full max-w-5xl bg-white sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-700/40 flex flex-col md:flex-row min-h-[600px] relative">
        
        {/* ============================================================== */}
        {/* LEFT PANEL: Project S.M.I.L.E. Branding & Emblem (Forest Green) */}
        {/* ============================================================== */}
        <div className="w-full md:w-1/2 bg-[#0b4628] text-white relative flex flex-col justify-between p-8 sm:p-12 overflow-hidden">
          
          {/* Dot Matrix Grid Accents Top Left & Top Right */}
          <div className="absolute top-6 left-6 grid grid-cols-6 gap-2 opacity-15 pointer-events-none">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-white" />
            ))}
          </div>
          <div className="absolute top-6 right-6 grid grid-cols-6 gap-2 opacity-15 pointer-events-none">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-white" />
            ))}
          </div>

          {/* Golden Wave Flowing Across Bottom */}
          <div className="absolute bottom-0 left-0 right-0 pointer-events-none z-0">
            <svg
              viewBox="0 0 500 130"
              preserveAspectRatio="none"
              className="w-full h-28 sm:h-32 md:h-36 text-[#F6B819] fill-current"
            >
              <path d="M0,25 C140,90 320,-10 500,45 L500,130 L0,130 Z" />
            </svg>
          </div>

          {/* Top spacer */}
          <div className="relative z-10"></div>

          {/* Center Brand Identity with Ramon Magsaysay Seal */}
          <div className="relative z-10 flex flex-col items-center text-center my-auto py-4">
            
            {/* Ramon Magsaysay (Cubao) High School Official Seal (Reduced Balanced Size) */}
            <div className="w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-full border-4 border-[#F6B819] bg-white flex items-center justify-center p-2.5 shadow-xl mb-4 relative overflow-hidden shrink-0">
              <SchoolLogo size="xl" showShadow={false} className="w-full h-full object-contain" />
            </div>

            {/* "Project" Text */}
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-wide">
              Project
            </h1>

            {/* "S.M.I.L.E." Bold Golden Title */}
            <div className="text-5xl sm:text-6xl font-black text-[#F6B819] tracking-wider leading-none mt-1">
              S.M.I.L.E.
            </div>

            {/* Iconic Curved Golden Smile Arc under S.M.I.L.E. */}
            <div className="w-full flex justify-center -mt-1 mb-3">
              <svg
                viewBox="0 0 160 26"
                className="w-44 sm:w-52 h-6 text-[#F6B819]"
                fill="none"
                stroke="currentColor"
                strokeWidth="5.5"
                strokeLinecap="round"
              >
                <path d="M 12 5 Q 80 27 148 5" />
              </svg>
            </div>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm font-medium text-white/95 max-w-xs leading-relaxed px-2">
              Student Monitoring and Intervention for Learning Enhancement
            </p>
          </div>

          {/* Bottom Quote placed in the lower part inside the yellow wave with white font color */}
          <div className="absolute bottom-3 sm:bottom-4.5 left-6 sm:left-10 z-10 text-[11px] sm:text-xs leading-snug font-bold text-white drop-shadow-[0_1.5px_2.5px_rgba(0,0,0,0.65)]">
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
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full bg-[#0b4628] flex items-center justify-center text-white shadow-sm shrink-0">
                {authMode === 'signin' ? (
                  <User className="w-6 h-6 text-white" />
                ) : (
                  <UserPlus className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0b4628] tracking-tight">
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
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-start gap-2 shadow-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                <div>{error}</div>
              </div>
            )}
            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <div>{successMsg}</div>
              </div>
            )}

            {/* Main Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Username Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  {authMode === 'signin' ? 'Username' : 'Username / DepEd Email'}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
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
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0b4628] focus:border-transparent transition shadow-xs font-medium"
                  />
                </div>
              </div>

              {/* Extra registration fields when in register mode */}
              {authMode === 'register' && (
                <>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800">
                      Full Name
                    </label>
                    <div className="relative">
                      <UserCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Shirlene M. Mandapat"
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0b4628]"
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
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#0b4628]"
                      >
                        <option value="teacher">TEACHER</option>
                        <option value="head_teacher">HEAD TEACHER</option>
                        <option value="school_head">SCHOOL HEAD</option>
                        <option value="coordinator">COORDINATOR</option>
                        <option value="admin">ADMIN</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
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
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0b4628] focus:border-transparent transition shadow-xs font-medium"
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

              {/* Confirm Password for Register Mode */}
              {authMode === 'register' && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-type your password"
                      className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0b4628]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Remember Me & Forgot Password Row (Shown in Sign In mode) */}
              {authMode === 'signin' && (
                <div className="flex items-center justify-between text-xs pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 font-medium">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded text-[#0b4628] accent-[#0b4628] cursor-pointer"
                    />
                    <span>Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotPasswordModal(true)}
                    className="font-semibold text-[#0b4628] hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}

              {/* Primary Action Button: Solid Forest Green "SIGN IN" */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-[#0b4628] hover:bg-[#07301b] disabled:opacity-60 text-white font-extrabold text-xs sm:text-sm tracking-wider uppercase rounded-xl transition-all shadow-md active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : null}
                <span>
                  {isLoading
                    ? 'VERIFYING...'
                    : authMode === 'register'
                    ? 'REGISTER ACCOUNT'
                    : 'SIGN IN'}
                </span>
              </button>

              {/* OR Divider */}
              <div className="relative flex items-center justify-center my-3">
                <div className="border-t border-slate-300 w-full" />
                <span className="bg-[#F8FAF5] px-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest absolute">
                  OR
                </span>
              </div>

              {/* Secondary Action Button: Outline "REGISTER AN ACCOUNT" / "BACK TO SIGN IN" */}
              {authMode === 'signin' ? (
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setError('');
                    setSuccessMsg('');
                  }}
                  className="w-full py-2.5 px-4 bg-white hover:bg-emerald-50/50 text-[#0b4628] border-2 border-[#0b4628] font-extrabold text-xs sm:text-sm tracking-wider uppercase rounded-xl transition-all shadow-xs active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4 text-[#0b4628]" />
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
                  className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 border-2 border-slate-300 font-extrabold text-xs sm:text-sm tracking-wider uppercase rounded-xl transition-all shadow-xs active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4 text-slate-600" />
                  <span>BACK TO SIGN IN</span>
                </button>
              )}
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
