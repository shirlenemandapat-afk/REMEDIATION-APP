import React from 'react';
import { SchoolLogo } from './SchoolLogo';
import { Award } from 'lucide-react';

interface RMCHSHeaderBannerProps {
  className?: string;
  showSubtitle?: boolean;
}

export const RMCHSHeaderBanner: React.FC<RMCHSHeaderBannerProps> = ({
  className = '',
  showSubtitle = true,
}) => {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border-2 border-amber-500/80 shadow-2xl bg-gradient-to-r from-[#0a2717] via-[#103e26] to-[#0a2717] ${className}`}
    >
      {/* Dynamic Gold Accent Borders Top & Bottom */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-600 via-yellow-300 to-amber-600 z-20" />
      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-600 via-yellow-300 to-amber-600 z-20" />

      {/* Decorative Gold Radial Glow behind Logo */}
      <div className="absolute left-1/2 md:left-24 top-1/2 -translate-x-1/2 md:translate-x-0 -translate-y-1/2 w-64 h-64 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />

      {/* Background Graphic Lines */}
      <svg
        viewBox="0 0 1000 240"
        className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <path d="M 0,40 Q 500,120 1000,40" stroke="#fef08a" strokeWidth="2" fill="none" />
        <path d="M 0,200 Q 500,140 1000,200" stroke="#fef08a" strokeWidth="2" fill="none" />
        <circle cx="500" cy="120" r="100" stroke="#fef08a" strokeWidth="1" fill="none" strokeDasharray="6 4" />
      </svg>

      {/* Content Layout: Exact Logo on Left/Center + Prominent Typography */}
      <div className="relative z-10 px-5 py-6 sm:px-8 sm:py-7 flex flex-col md:flex-row items-center gap-6 md:gap-8 text-center md:text-left">
        
        {/* Exact School & Department Logo */}
        <div className="shrink-0 flex items-center justify-center">
          <div className="p-1 rounded-full bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 shadow-2xl">
            <SchoolLogo
              size="xl"
              className="w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 hover:scale-105 transition-transform duration-300"
            />
          </div>
        </div>

        {/* Text Section */}
        <div className="flex-1 space-y-2">
          {/* Top DepEd Tag */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider bg-amber-400/20 text-yellow-300 border border-amber-400/50 shadow-xs">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              DEPARTMENT OF EDUCATION
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-emerald-900/90 text-emerald-200 border border-emerald-700">
              EST. 1957
            </span>
          </div>

          {/* School Name */}
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-wide uppercase text-yellow-300 font-serif drop-shadow-md">
            RAMON MAGSAYSAY (CUBAO) HIGH SCHOOL
          </h1>

          {/* Department Name */}
          <div className="text-sm sm:text-base font-bold text-white tracking-wide">
            Technology and Livelihood Education (TLE) Department
          </div>

          {/* Project S.M.I.L.E. Feature Banner with Acronym Meaning directly underneath */}
          <div className="pt-2 flex flex-col items-center md:items-start gap-1">
            <div className="inline-flex items-center px-4 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-emerald-950 font-black text-sm sm:text-base tracking-wider shadow-md">
              PROJECT S.M.I.L.E.
            </div>
            <div className="text-xs sm:text-sm font-bold text-amber-200 tracking-wide mt-0.5">
              (Student Monitoring and Intervention for Learning Enhancement)
            </div>
          </div>
        </div>
      </div>

      {/* Subtitle bottom banner if requested */}
      {showSubtitle && (
        <div className="relative z-10 bg-emerald-950/80 border-t border-amber-400/30 px-4 py-1.5 text-center">
          <p className="text-[11px] sm:text-xs text-amber-200/90 font-medium tracking-wide">
            Daily Anecdotal Records &bull; Quarterly Remediation Tracking &bull; Skills Enhancement in ICT, AFA, FCS & IA
          </p>
        </div>
      )}
    </div>
  );
};
