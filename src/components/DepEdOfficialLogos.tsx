import React from 'react';

/**
 * Official Seal of the Department of Education (DepEd - Kagawaran ng Edukasyon)
 * Vector-crisp, high-fidelity official emblem
 */
export const DepEdOfficialSeal: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 54,
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={`inline-block select-none ${className}`}
      title="Department of Education Official Seal"
    >
      <defs>
        <linearGradient id="depedGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="50%" stopColor="#EAB308" />
          <stop offset="100%" stopColor="#CA8A04" />
        </linearGradient>
        <linearGradient id="depedFlame" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#DC2626" />
          <stop offset="40%" stopColor="#EA580C" />
          <stop offset="80%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#FEF08A" />
        </linearGradient>
        <linearGradient id="depedShieldBlue" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1E40AF" />
          <stop offset="100%" stopColor="#172554" />
        </linearGradient>
        <path id="topTextArc" d="M 28,100 A 72,72 0 1,1 172,100" />
        <path id="bottomTextArc" d="M 172,100 A 72,72 0 0,1 28,100" />
      </defs>

      {/* Outer Ring */}
      <circle cx="100" cy="100" r="96" fill="#0F172A" stroke="url(#depedGold)" strokeWidth="3" />
      <circle cx="100" cy="100" r="91" fill="#FFFFFF" stroke="#1E293B" strokeWidth="1.5" />
      <circle cx="100" cy="100" r="70" fill="url(#depedShieldBlue)" stroke="url(#depedGold)" strokeWidth="2.5" />

      {/* Arc Text: KAGAWARAN NG EDUKASYON */}
      <text font-family="'Times New Roman', Georgia, serif" font-size="11" font-weight="900" fill="#0F172A" letter-spacing="1.5">
        <textPath href="#topTextArc" startOffset="50%" text-anchor="middle">
          KAGAWARAN NG EDUKASYON
        </textPath>
      </text>

      {/* Arc Text: REPUBLIKA NG PILIPINAS */}
      <text font-family="'Times New Roman', Georgia, serif" font-size="10.5" font-weight="900" fill="#0F172A" letter-spacing="1.2">
        <textPath href="#bottomTextArc" startOffset="50%" text-anchor="middle">
          REPUBLIKA NG PILIPINAS
        </textPath>
      </text>

      {/* Side Stars */}
      <polygon points="23,98 25,102 30,102 26,105 28,110 23,107 18,110 20,105 16,102 21,102" fill="#EAB308" />
      <polygon points="177,98 179,102 184,102 180,105 182,110 177,107 172,110 174,105 170,102 175,102" fill="#EAB308" />

      {/* Sunburst background rays inside blue circle */}
      <g stroke="url(#depedGold)" strokeWidth="1" opacity="0.4">
        <line x1="100" y1="100" x2="100" y2="35" />
        <line x1="100" y1="100" x2="145" y2="45" />
        <line x1="100" y1="100" x2="165" y2="100" />
        <line x1="100" y1="100" x2="145" y2="155" />
        <line x1="100" y1="100" x2="100" y2="165" />
        <line x1="100" y1="100" x2="55" y2="155" />
        <line x1="100" y1="100" x2="35" y2="100" />
        <line x1="100" y1="100" x2="55" y2="45" />
      </g>

      {/* Open Book of Knowledge */}
      <g transform="translate(0, -8)">
        {/* Book pages */}
        <path
          d="M 64,120 Q 82,112 100,118 Q 118,112 136,120 L 134,136 Q 118,128 100,134 Q 82,128 66,136 Z"
          fill="#FFFFFF"
          stroke="#0F172A"
          strokeWidth="1.2"
        />
        {/* Book spine line */}
        <line x1="100" y1="118" x2="100" y2="134" stroke="#0F172A" strokeWidth="1.5" />
        {/* Page text lines */}
        <line x1="72" y1="123" x2="94" y2="122" stroke="#64748B" strokeWidth="1" />
        <line x1="72" y1="127" x2="94" y2="126" stroke="#64748B" strokeWidth="1" />
        <line x1="72" y1="131" x2="90" y2="130" stroke="#64748B" strokeWidth="1" />
        <line x1="106" y1="122" x2="128" y2="123" stroke="#64748B" strokeWidth="1" />
        <line x1="106" y1="126" x2="128" y2="127" stroke="#64748B" strokeWidth="1" />
        <line x1="110" y1="130" x2="128" y2="131" stroke="#64748B" strokeWidth="1" />
      </g>

      {/* Central Torch / Sulo */}
      {/* Torch Handle */}
      <path d="M 97,130 L 103,130 L 101,154 L 99,154 Z" fill="url(#depedGold)" stroke="#78350F" strokeWidth="0.8" />
      {/* Torch Bowl */}
      <path d="M 92,124 Q 100,127 108,124 L 105,130 Q 100,132 95,130 Z" fill="url(#depedGold)" stroke="#78350F" strokeWidth="0.8" />

      {/* Torch Flame with multiple layers */}
      <path
        d="M 100,68 C 93,82 86,96 88,108 C 90,120 100,124 100,124 C 100,124 110,120 112,108 C 114,96 107,82 100,68 Z"
        fill="url(#depedFlame)"
      />
      {/* Inner Bright Flame */}
      <path
        d="M 100,78 C 96,88 92,98 94,106 C 96,114 100,118 100,118 C 100,118 104,114 106,106 C 108,98 104,88 100,78 Z"
        fill="#FEF08A"
      />
      {/* Core White Flame */}
      <path
        d="M 100,88 C 98,94 96,100 97,105 C 98,110 100,112 100,112 C 100,112 102,110 103,105 C 104,100 102,94 100,88 Z"
        fill="#FFFFFF"
      />
    </svg>
  );
};

/**
 * Official Bagong Pilipinas Emblem Logo
 * Features the signature Philippine sun, vibrant colors (blue, red, yellow) and clean bold typography
 */
export const BagongPilipinasLogo: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 46,
}) => {
  return (
    <div className={`inline-flex flex-col items-center select-none shrink-0 ${className}`}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 160 110"
        width={size}
        height={Math.round((size * 110) / 160)}
        className="block"
      >
        <defs>
          <linearGradient id="bpSunGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FACC15" />
            <stop offset="100%" stopColor="#EA580C" />
          </linearGradient>
          <linearGradient id="bpBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#1E3A8A" />
          </linearGradient>
          <linearGradient id="bpRedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="100%" stopColor="#991B1B" />
          </linearGradient>
        </defs>

        {/* Yellow Sunburst on Left */}
        <g transform="translate(38, 48)">
          <circle cx="0" cy="0" r="14" fill="url(#bpSunGrad)" />
          {/* 8 Sun Rays */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <path
              key={angle}
              d="M 0,-16 L 3,-25 L -3,-25 Z"
              fill="#F59E0B"
              transform={`rotate(${angle})`}
            />
          ))}
          {/* 3 Golden Stars */}
          <polygon points="0,-7 2,-2 7,-2 3,1 5,6 0,3 -5,6 -3,1 -7,-2 -2,-2" fill="#FFFFFF" />
          <polygon points="-12,-16 -11,-13 -8,-13 -10,-11 -9,-8 -12,-10 -15,-8 -14,-11 -16,-13 -13,-13" fill="#FFFFFF" />
          <polygon points="12,-16 13,-13 16,-13 14,-11 15,-8 12,-10 9,-8 10,-11 8,-13 11,-13" fill="#FFFFFF" />
        </g>

        {/* Dynamic Blue Ribbon Wing (Right / Top) */}
        <path
          d="M 46,28 C 75,18 118,22 146,45 C 132,49 104,44 76,46 C 60,47 48,43 46,28 Z"
          fill="url(#bpBlueGrad)"
        />
        <path
          d="M 58,40 C 85,34 122,38 152,58 C 138,60 110,54 84,56 C 70,57 60,52 58,40 Z"
          fill="#3B82F6"
        />

        {/* Dynamic Red Ribbon Wing (Bottom) */}
        <path
          d="M 38,58 C 55,75 88,88 132,80 C 114,88 78,88 52,78 C 42,74 37,66 38,58 Z"
          fill="url(#bpRedGrad)"
        />
        <path
          d="M 44,66 C 60,82 92,94 138,88 C 120,95 82,95 56,86 C 46,82 43,74 44,66 Z"
          fill="#DC2626"
        />
      </svg>

      <span className="text-[7.5px] font-black tracking-tighter text-[#1E3A8A] uppercase font-sans mt-0.5 whitespace-nowrap">
        BAGONG PILIPINAS
      </span>
    </div>
  );
};
