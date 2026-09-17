import React, { useState } from 'react';
import rmchsSvgLogo from '../assets/images/rmchs_logo.svg';
import officialLogoImg from '../assets/images/rmchs_tle_official_logo.png';
import webpLogoImg from '../assets/images/rmchs_tle_logo.webp';

interface SchoolLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showShadow?: boolean;
}

export const SchoolLogo: React.FC<SchoolLogoProps> = ({
  className = '',
  size = 'md',
  showShadow = true,
}) => {
  const [currentSrcIndex, setCurrentSrcIndex] = useState(0);

  // Official Ramon Magsaysay (Cubao) High School Seal (Wikipedia File:Ramon Magsaysay (Cubao) High School.svg)
  const fallbackList = [
    rmchsSvgLogo,
    '/rmchs_logo.svg',
    '/rmchs_official_seal.png',
    officialLogoImg,
    webpLogoImg,
    '/rmchs_logo_512.png',
    '/rmchs_tle_official_logo.png',
    'https://upload.wikimedia.org/wikipedia/commons/8/88/Ramon_Magsaysay_%28Cubao%29_High_School.svg',
  ];

  const sizeMap = {
    xs: 'w-10 h-10',
    sm: 'w-14 h-14',
    md: 'w-20 h-20',
    lg: 'w-32 h-32',
    xl: 'w-48 h-48',
    '2xl': 'w-64 h-64',
  };

  const dim = sizeMap[size] || sizeMap.md;

  const handleError = () => {
    if (currentSrcIndex < fallbackList.length - 1) {
      setCurrentSrcIndex((prev) => prev + 1);
    }
  };

  const isAllFailed = currentSrcIndex >= fallbackList.length - 1;

  return (
    <div
      className={`relative inline-block select-none shrink-0 ${dim} ${
        showShadow ? 'drop-shadow-md' : ''
      } ${className}`}
      title="Ramon Magsaysay (Cubao) High School Official Seal"
    >
      <img
        src={fallbackList[currentSrcIndex]}
        alt="Ramon Magsaysay (Cubao) High School Official Seal"
        className="w-full h-full object-contain aspect-square select-none block"
        loading="eager"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={handleError}
      />
      {isAllFailed && (
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-800 to-emerald-950 border-2 border-amber-400 flex flex-col items-center justify-center text-center p-1 text-white shadow-inner pointer-events-none">
          <span className="text-[9px] font-black text-amber-300 tracking-tighter uppercase leading-none">
            RMCHS
          </span>
          <span className="text-[7px] font-bold text-emerald-200 uppercase leading-none mt-0.5">
            CUBAO HS
          </span>
        </div>
      )}
    </div>
  );
};

