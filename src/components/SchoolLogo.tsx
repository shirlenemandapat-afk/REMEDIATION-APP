import React, { useState } from 'react';
import officialLogoImg from '../assets/images/rmchs_tle_official_logo.png';

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
  const [imgError, setImgError] = useState(false);
  const [fallbackSrc, setFallbackSrc] = useState<string | null>(null);

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
    if (!fallbackSrc) {
      // Try public root absolute path as first fallback
      setFallbackSrc('/rmchs_tle_official_logo.png');
    } else if (fallbackSrc === '/rmchs_tle_official_logo.png') {
      // Try secondary public path
      setFallbackSrc('/rmchs_logo_512.png');
    } else {
      setImgError(true);
    }
  };

  return (
    <div
      className={`relative inline-block select-none shrink-0 ${dim} ${
        showShadow ? 'drop-shadow-md' : ''
      } ${className}`}
      title="Ramon Magsaysay (Cubao) High School - TLE Department Official Logo"
    >
      {!imgError ? (
        <img
          src={fallbackSrc || officialLogoImg}
          alt="Ramon Magsaysay (Cubao) High School - TLE Department Official Logo"
          className="w-full h-full object-contain aspect-square select-none"
          referrerPolicy="no-referrer"
          loading="eager"
          onError={handleError}
        />
      ) : (
        /* Crisp Vector Fallback Emblem in case of extreme browser image blocking */
        <div className="w-full h-full rounded-full bg-gradient-to-br from-emerald-800 to-emerald-950 border-2 border-amber-400 flex flex-col items-center justify-center text-center p-1 text-white shadow-inner">
          <span className="text-[9px] font-black text-amber-300 tracking-tighter uppercase leading-none">
            RMCHS
          </span>
          <span className="text-[7px] font-bold text-emerald-200 uppercase leading-none mt-0.5">
            TLE DEPT
          </span>
        </div>
      )}
    </div>
  );
};
