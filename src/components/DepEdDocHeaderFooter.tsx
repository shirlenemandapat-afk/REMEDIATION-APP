import React from 'react';
import { DepEdOfficialSeal } from './DepEdOfficialLogos';
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
      <div className="flex items-center justify-between gap-3 sm:gap-6">
        {/* Official DepEd Seal Left */}
        <div className="shrink-0 flex items-center justify-center">
          <DepEdOfficialSeal size={62} className="w-14 h-14 sm:w-16 sm:h-16" />
        </div>

        {/* Official Institutional Typography Center */}
        <div className="flex-1 space-y-0 text-slate-900 leading-tight">
          <p className="text-[12px] sm:text-[13px] font-serif tracking-wide text-slate-800">
            Republic of the Philippines
          </p>
          <p className="text-[17px] sm:text-[20px] font-serif font-black tracking-normal text-slate-950 -mt-0.5 font-['Old_English_Text_MT',_'UnifrakturMaguntia',_Georgia,_serif]">
            Department of Education
          </p>
          <p className="text-[10px] sm:text-[11.5px] font-bold tracking-wider uppercase text-slate-800 font-sans pt-0.5">
            NATIONAL CAPITAL REGION
          </p>
          <p className="text-[10px] sm:text-[11.5px] font-bold tracking-wider uppercase text-slate-800 font-sans">
            SCHOOLS DIVISION OF QUEZON CITY
          </p>
          <p className="text-[12px] sm:text-[13.5px] font-extrabold tracking-wide uppercase text-slate-950 font-sans">
            RAMON MAGSAYSAY (CUBAO) HIGH SCHOOL
          </p>
          {department && (
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-800 uppercase tracking-wide pt-0.5">
              {department}
            </p>
          )}
        </div>

        {/* Official RMCHS Seal Right */}
        <div className="shrink-0 flex items-center justify-center">
          <SchoolLogo size="sm" showShadow={false} className="w-14 h-14 sm:w-16 sm:h-16" />
        </div>
      </div>

      {showBorder && (
        <div className="w-full mt-2.5 mb-3 border-b-2 border-slate-900" />
      )}
    </div>
  );
};

export const DepEdDocFooter: React.FC = () => {
  return (
    <div className="w-full pt-2.5 mt-5 border-t border-slate-900 select-none">
      <div className="text-left text-[10.5px] sm:text-[11px] text-slate-900 leading-snug font-serif space-y-0.5">
        <p className="font-normal text-slate-800">
          731 Epifanio de los Santos Avenue, Quezon City
        </p>
        <p className="font-normal text-slate-800">
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
  );
};


