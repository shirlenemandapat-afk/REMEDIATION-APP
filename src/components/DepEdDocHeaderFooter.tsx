import React from 'react';
import { SchoolLogo } from './SchoolLogo';
import { DepEdOfficialSeal, BagongPilipinasLogo } from './DepEdOfficialLogos';

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
      {/* Official DepEd (Kagawaran ng Edukasyon) Seal Centered */}
      <div className="flex items-center justify-center mb-1.5">
        <DepEdOfficialSeal size={56} className="drop-shadow-xs" />
      </div>

      <div className="space-y-0 text-slate-900 leading-tight">
        <p className="text-[13px] sm:text-[14px] font-serif tracking-wide text-slate-800">
          Republic of the Philippines
        </p>
        <p className="text-[18px] sm:text-[21px] font-serif font-black tracking-normal text-slate-950 -mt-0.5 font-['Old_English_Text_MT',_'UnifrakturMaguntia',_Georgia,_serif]">
          Department of Education
        </p>
        <p className="text-[11px] sm:text-[12px] font-bold tracking-wider uppercase text-slate-800 font-sans pt-0.5">
          NATIONAL CAPITAL REGION
        </p>
        <p className="text-[11px] sm:text-[12px] font-bold tracking-wider uppercase text-slate-800 font-sans">
          SCHOOLS DIVISION OF QUEZON CITY
        </p>
        <p className="text-[12.5px] sm:text-[14px] font-extrabold tracking-wide uppercase text-slate-950 font-sans">
          RAMON MAGSAYSAY (CUBAO) HIGH SCHOOL
        </p>
        {department && (
          <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wide pt-0.5">
            {department}
          </p>
        )}
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
      <div className="flex items-center justify-start gap-4">
        {/* Left Logos: Bagong Pilipinas + RMCHS Official Seal */}
        <div className="flex items-center gap-3 shrink-0">
          <BagongPilipinasLogo size={46} />
          <div className="w-10 h-10 shrink-0 flex items-center justify-center">
            <SchoolLogo size="xs" showShadow={false} className="w-9 h-9" />
          </div>
        </div>

        {/* Contact Info: 3 Left-Aligned Clean Lines matching DepEd official letterhead */}
        <div className="text-left text-[10.5px] sm:text-[11px] text-slate-900 leading-snug font-serif space-y-0.5 border-l border-slate-300 pl-3">
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
    </div>
  );
};

