import React from 'react';
import { SchoolLogo } from './SchoolLogo';

interface DepEdDocHeaderProps {
  department?: string;
  showBorder?: boolean;
}

export const DepEdDocHeader: React.FC<DepEdDocHeaderProps> = ({
  department = 'Technology and Livelihood Education (TLE)',
  showBorder = true,
}) => {
  return (
    <div className="w-full text-center select-none">
      {/* DepEd & RMCHS Official Top Emblem Header */}
      <div className="flex items-center justify-center mb-1">
        <SchoolLogo size="sm" showShadow={false} className="w-14 h-14" />
      </div>

      <div className="space-y-0 text-slate-800">
        <p className="text-[13px] font-serif tracking-wide text-slate-700">
          Republic of the Philippines
        </p>
        <p className="text-[17px] font-serif font-black tracking-wide text-slate-950 uppercase -mt-0.5 font-['Old_English_Text_MT',_Georgia,_serif]">
          Department of Education
        </p>
        <p className="text-[11px] font-bold tracking-wider uppercase text-slate-700">
          NATIONAL CAPITAL REGION
        </p>
        <p className="text-[11px] font-bold tracking-wider uppercase text-slate-700">
          SCHOOLS DIVISION OF QUEZON CITY
        </p>
        <p className="text-[13px] font-black tracking-wider uppercase text-emerald-950 font-serif">
          RAMON MAGSAYSAY (CUBAO) HIGH SCHOOL
        </p>
        <p className="text-[10px] text-slate-600 font-medium">
          731 Epifanio de los Santos Avenue, Quezon City
        </p>
      </div>

      {showBorder && (
        <div className="w-full mt-2.5 mb-4 border-b-2 border-slate-900" />
      )}
    </div>
  );
};

export const DepEdDocFooter: React.FC = () => {
  return (
    <div className="w-full pt-3 mt-6 border-t-2 border-slate-900 select-none">
      <div className="flex items-center justify-between gap-4">
        {/* Logos Group: DepEd MATATAG + Bagong Pilipinas + RMCHS Seal */}
        <div className="flex items-center gap-3 shrink-0">
          {/* DepEd MATATAG Stylized Badge */}
          <div className="flex flex-col items-center justify-center border-r border-slate-300 pr-2.5">
            <div className="flex items-center gap-1">
              <span className="text-[13px] font-black tracking-tighter text-blue-800">Dep</span>
              <span className="text-[13px] font-black tracking-tighter text-red-600 -ml-0.5">ED</span>
            </div>
            <span className="text-[8px] font-black tracking-wider text-blue-900 uppercase">
              MATATAG
            </span>
          </div>

          {/* Bagong Pilipinas Stylized Badge */}
          <div className="flex flex-col items-center justify-center border-r border-slate-300 pr-2.5">
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-400 via-red-500 to-blue-600 flex items-center justify-center p-0.5 shadow-2xs">
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                <span className="text-[7px] font-black text-amber-600">★</span>
              </div>
            </div>
            <span className="text-[7px] font-black tracking-tight text-slate-800 uppercase mt-0.5">
              BAGONG PILIPINAS
            </span>
          </div>

          {/* RMCHS School Circular Seal */}
          <div className="w-8 h-8 rounded-full border border-emerald-800 p-0.5 bg-emerald-50 shrink-0 flex items-center justify-center">
            <SchoolLogo size="xs" showShadow={false} className="w-7 h-7" />
          </div>
        </div>

        {/* School Info Right Block */}
        <div className="text-right text-[9px] text-slate-700 leading-tight space-y-0.5">
          <p className="font-semibold">731 Epifanio de los Santos Avenue, Quezon City</p>
          <p className="font-semibold">(8) 519-36-60</p>
          <p className="text-blue-900 font-medium">hs.ramonmagsaysaycubao@depedqc.ph</p>
          <p className="text-blue-900 text-[8px] truncate max-w-[280px] sm:max-w-none">
            https://www.facebook.com/profile.php?id=100063924610263
          </p>
        </div>
      </div>
    </div>
  );
};
