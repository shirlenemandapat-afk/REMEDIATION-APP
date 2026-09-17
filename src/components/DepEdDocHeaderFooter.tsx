import React from 'react';
import { KagawaranNgEdukasyonLogo, BagongPilipinasLogo } from './DepEdOfficialLogos';
import { SchoolLogo } from './SchoolLogo';

interface DepEdDocHeaderProps {
  department?: string;
  showBorder?: boolean;
}

export const DepEdDocHeader: React.FC<DepEdDocHeaderProps> = ({
  department,
  showBorder = true,
}) => {
  return (
    <div className="w-full text-center select-none">
      {/* Official Edukasyon ng Pilipinas Logo - MIDDLE TOP PORTION */}
      <div className="flex justify-center items-center mb-1.5 sm:mb-2">
        <KagawaranNgEdukasyonLogo
          size={74}
          showShadow={false}
          className="w-16 h-16 sm:w-18 sm:h-18"
        />
      </div>

      {/* Official Institutional Typography - CENTER */}
      <div className="space-y-0.5 text-slate-900 leading-tight">
        <p className="text-[12px] sm:text-[13px] font-serif tracking-wide text-slate-800">
          Republic of the Philippines
        </p>
        <p className="text-[17px] sm:text-[21px] font-serif font-black tracking-normal text-slate-950 -mt-0.5 font-['Old_English_Text_MT',_'UnifrakturMaguntia',_Georgia,_serif]">
          Department of Education
        </p>
        <p className="text-[10px] sm:text-[11.5px] font-bold tracking-wider uppercase text-slate-800 font-sans pt-0.5">
          NATIONAL CAPITAL REGION
        </p>
        <p className="text-[10px] sm:text-[11.5px] font-bold tracking-wider uppercase text-slate-800 font-sans">
          SCHOOLS DIVISION OF QUEZON CITY
        </p>
        <p className="text-[12.5px] sm:text-[14px] font-extrabold tracking-wide uppercase text-slate-950 font-sans">
          RAMON MAGSAYSAY (CUBAO) HIGH SCHOOL
        </p>
        {department && (
          <p className="text-[10px] sm:text-[11.5px] font-bold text-slate-800 uppercase tracking-wide pt-0.5">
            {department}
          </p>
        )}
      </div>

      {showBorder && (
        <div className="w-full mt-2.5 mb-3.5 border-b-2 border-slate-900" />
      )}
    </div>
  );
};

export const DepEdDocFooter: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`w-full pt-3 mt-6 border-t border-slate-900 select-none print:mt-4 print:pt-2.5 ${className}`}>
      {/* Logos and School Details positioned on the LEFT SIDE */}
      <div className="flex items-center justify-start gap-3 sm:gap-4 flex-wrap text-left">
        {/* Logos from Left to Right: 1. BAGONG PILIPINAS, followed by 2. RMCHS LOGO */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* 1. BAGONG PILIPINAS Logo */}
          <div className="flex items-center justify-center">
            <BagongPilipinasLogo
              size={50}
              showShadow={false}
              className="w-12 h-11 sm:w-13 sm:h-12"
            />
          </div>

          {/* 2. Followed by RMCHS Logo */}
          <div className="flex items-center justify-center border-l border-slate-300 pl-2 sm:pl-2.5">
            <SchoolLogo
              size="sm"
              showShadow={false}
              className="w-11 h-11 sm:w-12 sm:h-12"
            />
          </div>
        </div>

        {/* Hairline vertical divider between logos and school details */}
        <div className="hidden sm:block h-12 w-px bg-slate-300 shrink-0 self-center" />

        {/* Details (School name, address, contact number, email) on the LEFT SIDE following the logos */}
        <div className="text-left text-[9.5px] sm:text-[10.5px] text-slate-800 leading-tight font-serif space-y-0.5">
          <p className="font-bold text-slate-950 uppercase tracking-wide font-sans text-[10.5px] sm:text-[11.5px]">
            Ramon Magsaysay (Cubao) High School
          </p>
          <p className="font-normal text-slate-700">
            731 Epifanio de los Santos Avenue, Quezon City
          </p>
          <p className="font-normal text-slate-700">
            (8) 519-36-60
          </p>
          <p>
            <a
              href="mailto:hs.ramonmagsaysaycubao@depedqc.ph"
              className="text-[#1e40af] underline hover:text-[#172554]"
            >
              hs.ramonmagsaysaycubao@depedqc.ph
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};


