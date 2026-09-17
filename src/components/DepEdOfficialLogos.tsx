import React, { useState } from 'react';
import depedSvgLogo from '../assets/images/deped_kagawaran_logo.svg';
import depedPngLogo from '../assets/images/deped_kagawaran_logo.png';
import bagongPilipinasSvg from '../assets/images/bagong_pilipinas_logo.svg';
import bagongPilipinasPng from '../assets/images/bagong_pilipinas_logo.png';

/**
 * Official Seal of the Department of Education (DepEd - Kagawaran ng Edukasyon)
 * Source: https://en.wikipedia.org/wiki/Department_of_Education_(Philippines)
 * Vector-crisp official emblem with high-res PNG and Wikipedia fallbacks.
 */
export const KagawaranNgEdukasyonLogo: React.FC<{
  className?: string;
  size?: number | string;
  showShadow?: boolean;
}> = ({ className = '', size = 58, showShadow = false }) => {
  const [currentSrcIndex, setCurrentSrcIndex] = useState(0);

  const fallbackList = [
    depedSvgLogo,
    '/deped_kagawaran_logo.svg',
    depedPngLogo,
    '/deped_kagawaran_logo.png',
    'https://upload.wikimedia.org/wikipedia/commons/2/20/Department_of_Education.svg',
  ];

  const handleError = () => {
    if (currentSrcIndex < fallbackList.length - 1) {
      setCurrentSrcIndex((prev) => prev + 1);
    }
  };

  const isAllFailed = currentSrcIndex >= fallbackList.length - 1;

  const styleDim =
    typeof size === 'number'
      ? { width: `${size}px`, height: `${size}px` }
      : undefined;

  return (
    <div
      style={styleDim}
      className={`relative inline-block select-none shrink-0 ${
        showShadow ? 'drop-shadow-md' : ''
      } ${className}`}
      title="Kagawaran ng Edukasyon (Department of Education) Official Seal"
    >
      <img
        src={fallbackList[currentSrcIndex]}
        alt="Kagawaran ng Edukasyon (Department of Education) Official Seal"
        className="w-full h-full object-contain aspect-square select-none block"
        loading="eager"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={handleError}
      />
      {isAllFailed && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 200 200"
          className="w-full h-full"
        >
          <circle cx="100" cy="100" r="96" fill="#0F172A" stroke="#EAB308" strokeWidth="4" />
          <circle cx="100" cy="100" r="90" fill="#FFFFFF" />
          <circle cx="100" cy="100" r="70" fill="#1E40AF" stroke="#EAB308" strokeWidth="3" />
          <text x="100" y="50" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#0F172A">
            KAGAWARAN NG EDUKASYON
          </text>
          <text x="100" y="160" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#0F172A">
            REPUBLIKA NG PILIPINAS
          </text>
        </svg>
      )}
    </div>
  );
};

// Backward-compatible alias for existing imports
export const DepEdOfficialSeal = KagawaranNgEdukasyonLogo;

/**
 * Official Bagong Pilipinas Emblem Logo
 * Source: https://en.wikipedia.org/wiki/Bagong_Pilipinas_(campaign)
 * Vector-crisp official emblem with high-res PNG and Wikipedia fallbacks.
 */
export const BagongPilipinasLogo: React.FC<{
  className?: string;
  size?: number;
  showShadow?: boolean;
}> = ({ className = '', size = 52, showShadow = false }) => {
  const [currentSrcIndex, setCurrentSrcIndex] = useState(0);

  const fallbackList = [
    bagongPilipinasSvg,
    '/bagong_pilipinas_logo.svg',
    bagongPilipinasPng,
    '/bagong_pilipinas_logo.png',
    'https://upload.wikimedia.org/wikipedia/commons/c/ce/Bagong_Pilipinas_Logo.svg',
  ];

  const handleError = () => {
    if (currentSrcIndex < fallbackList.length - 1) {
      setCurrentSrcIndex((prev) => prev + 1);
    }
  };

  const isAllFailed = currentSrcIndex >= fallbackList.length - 1;
  const widthPx = size;
  const heightPx = Math.round((size * 576) / 618);

  return (
    <div
      style={{ width: `${widthPx}px`, height: `${heightPx}px` }}
      className={`relative inline-flex items-center justify-center select-none shrink-0 ${
        showShadow ? 'drop-shadow-md' : ''
      } ${className}`}
      title="Bagong Pilipinas Official Logo"
    >
      <img
        src={fallbackList[currentSrcIndex]}
        alt="Bagong Pilipinas Official Logo"
        className="w-full h-full object-contain select-none block"
        loading="eager"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={handleError}
      />
      {isAllFailed && (
        <span className="text-[9px] font-black tracking-tighter text-[#1E3A8A] uppercase font-sans whitespace-nowrap">
          BAGONG PILIPINAS
        </span>
      )}
    </div>
  );
};
