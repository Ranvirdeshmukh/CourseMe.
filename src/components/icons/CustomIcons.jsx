import React from 'react';

// Natural, photorealistic icons that look like real objects
// Using realistic colors, organic shadows, and authentic details

export const ClassesIcon = ({ size = 32, color = 'currentColor', darkMode = false }) => {
  // Real textbook colors - burgundy, navy, forest green
  const bookColors = darkMode 
    ? ['#8B4789', '#2C5F7C', '#4A7C59'] 
    : ['#8B2C4A', '#1E3A5F', '#2D5E3F'];
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ transition: 'all 0.3s ease' }}
    >
      {/* Soft shadow */}
      <ellipse cx="16" cy="25.5" rx="11" ry="1" fill="#000" opacity="0.08" />
      
      {/* Burgundy textbook (front) */}
      <g>
        <path
          d="M6 9.5C6 9.22 6.22 9 6.5 9H12.5C12.78 9 13 9.22 13 9.5V22.5C13 22.78 12.78 23 12.5 23H6.5C6.22 23 6 22.78 6 22.5V9.5Z"
          fill={bookColors[0]}
        />
        {/* Natural lighting gradient */}
        <path
          d="M6 9.5C6 9.22 6.22 9 6.5 9H12.5C12.78 9 13 9.22 13 9.5V22.5C13 22.78 12.78 23 12.5 23H6.5C6.22 23 6 22.78 6 22.5V9.5Z"
          fill="url(#natural-light-1)"
        />
        {/* Spine highlight */}
        <rect x="6" y="9" width="1.2" height="14" fill="#fff" opacity="0.12" />
        {/* Page texture */}
        <rect x="12.3" y="9.3" width="0.5" height="13.4" fill="#FFF8DC" opacity="0.7" />
        <rect x="11.9" y="9.5" width="0.3" height="13" fill="#F5E6D3" opacity="0.5" />
      </g>
      
      {/* Navy textbook (middle) - slightly taller */}
      <g>
        <path
          d="M11 7.5C11 7.22 11.22 7 11.5 7H19.5C19.78 7 20 7.22 20 7.5V22C20 22.28 19.78 22.5 19.5 22.5H11.5C11.22 22.5 11 22.28 11 22V7.5Z"
          fill={bookColors[1]}
        />
        <path
          d="M11 7.5C11 7.22 11.22 7 11.5 7H19.5C19.78 7 20 7.22 20 7.5V22C20 22.28 19.78 22.5 19.5 22.5H11.5C11.22 22.5 11 22.28 11 22V7.5Z"
          fill="url(#natural-light-2)"
        />
        <rect x="11" y="7" width="1.2" height="15.5" fill="#fff" opacity="0.15" />
        <rect x="19.3" y="7.3" width="0.5" height="14.9" fill="#FFF8DC" opacity="0.65" />
        {/* Embossed title */}
        <rect x="13" y="10" width="5" height="1" rx="0.3" fill="#000" opacity="0.15" />
        <rect x="13" y="10" width="5" height="1" rx="0.3" fill="#fff" opacity="0.08" />
      </g>
      
      {/* Forest green textbook (back) */}
      <g>
        <path
          d="M18 8C18 7.72 18.22 7.5 18.5 7.5H26.5C26.78 7.5 27 7.72 27 8V21.5C27 21.78 26.78 22 26.5 22H18.5C18.22 22 18 21.78 18 21.5V8Z"
          fill={bookColors[2]}
        />
        <path
          d="M18 8C18 7.72 18.22 7.5 18.5 7.5H26.5C26.78 7.5 27 7.72 27 8V21.5C27 21.78 26.78 22 26.5 22H18.5C18.22 22 18 21.78 18 21.5V8Z"
          fill="url(#natural-light-3)"
        />
        <rect x="18" y="7.5" width="1.2" height="14.5" fill="#fff" opacity="0.1" />
        <rect x="26.3" y="7.8" width="0.5" height="13.9" fill="#FFF8DC" opacity="0.6" />
      </g>
      
      {/* Natural worn bookmark */}
      <path 
        d="M8 9L8 17.5L9 16.5L10 17.5L10 9" 
        fill="#C19A6B"
        opacity="0.85"
      />
      
      <defs>
        <linearGradient id="natural-light-1" x1="6" y1="9" x2="13" y2="9">
          <stop offset="0%" stopColor="#000" stopOpacity="0.12" />
          <stop offset="60%" stopColor="transparent" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0.08" />
        </linearGradient>
        <linearGradient id="natural-light-2" x1="11" y1="7" x2="20" y2="7">
          <stop offset="0%" stopColor="#000" stopOpacity="0.15" />
          <stop offset="70%" stopColor="transparent" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id="natural-light-3" x1="18" y1="7.5" x2="27" y2="7.5">
          <stop offset="0%" stopColor="#000" stopOpacity="0.1" />
          <stop offset="80%" stopColor="transparent" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0.06" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export const LayupsIcon = ({ size = 32, color = 'currentColor', darkMode = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ transition: 'all 0.3s ease' }}
  >
    {/* Soft ground shadow */}
    <ellipse cx="16" cy="27" rx="10" ry="0.8" fill="#000" opacity="0.06" />
    
    {/* Classic dartboard - realistic red and cream */}
    <circle cx="16" cy="16" r="12.5" fill="#1A1A1A" opacity="0.08" />
    <circle cx="16" cy="16" r="12" fill="#B91C1C" />
    <circle cx="16" cy="16" r="12" fill="url(#dartboard-texture)" />
    
    <circle cx="16" cy="16" r="9" fill="#F5F5DC" />
    <circle cx="16" cy="16" r="9" fill="url(#cream-ring)" />
    
    <circle cx="16" cy="16" r="6" fill="#B91C1C" />
    <circle cx="16" cy="16" r="6" fill="url(#red-ring)" />
    
    <circle cx="16" cy="16" r="3" fill="#F5F5DC" />
    <circle cx="16" cy="16" r="3" fill="url(#inner-cream)" />
    
    {/* Realistic bullseye */}
    <circle cx="16" cy="16" r="1.3" fill="#7C2D12" />
    <circle cx="16" cy="16" r="0.6" fill="#991B1B" />
    
    {/* Natural wood-shaft arrow */}
    <g>
      {/* Arrow shaft - wood grain color */}
      <line 
        x1="25" y1="7" x2="16.5" y2="15.5" 
        stroke="#8B6F47" 
        strokeWidth="2.2" 
        strokeLinecap="round" 
      />
      <line 
        x1="25" y1="7" x2="16.5" y2="15.5" 
        stroke="#A0826D" 
        strokeWidth="1.6" 
        strokeLinecap="round" 
      />
      {/* Natural highlight */}
      <line 
        x1="25" y1="7" x2="19" y2="13" 
        stroke="#C4A57B" 
        strokeWidth="0.7" 
        strokeLinecap="round" 
        opacity="0.6" 
      />
      
      {/* Metal tip */}
      <circle cx="16" cy="16" r="0.7" fill="#52525B" />
      <circle cx="16" cy="16" r="0.5" fill="#71717A" />
      
      {/* Real feather fletching */}
      <path d="M24 6L25 7L23.5 8.5Z" fill="#DC2626" opacity="0.9" />
      <path d="M24.5 8L25 7L26 8Z" fill="#F5F5DC" opacity="0.9" />
      <path d="M23.5 7L25 7L24 5.5Z" fill="#1F2937" opacity="0.85" />
    </g>
    
    <defs>
      <radialGradient id="dartboard-texture">
        <stop offset="30%" stopColor="#fff" stopOpacity="0.05" />
        <stop offset="100%" stopColor="#000" stopOpacity="0.12" />
      </radialGradient>
      <radialGradient id="cream-ring">
        <stop offset="20%" stopColor="#fff" stopOpacity="0.15" />
        <stop offset="100%" stopColor="#000" stopOpacity="0.06" />
      </radialGradient>
      <radialGradient id="red-ring">
        <stop offset="30%" stopColor="#fff" stopOpacity="0.08" />
        <stop offset="100%" stopColor="#000" stopOpacity="0.1" />
      </radialGradient>
      <radialGradient id="inner-cream">
        <stop offset="10%" stopColor="#fff" stopOpacity="0.25" />
        <stop offset="100%" stopColor="#000" stopOpacity="0.08" />
      </radialGradient>
    </defs>
  </svg>
);

export const ProfessorsIcon = ({ size = 32, color = 'currentColor', darkMode = false }) => {
  const capColor = darkMode ? '#1F2937' : '#111827';
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ transition: 'all 0.3s ease' }}
    >
      {/* Natural shadow */}
      <ellipse cx="16" cy="25" rx="13" ry="1" fill="#000" opacity="0.08" />
      
      {/* Mortarboard top - matte black fabric */}
      <g>
        <path
          d="M16 4.5L2.5 10.5L16 16.5L29.5 10.5L16 4.5Z"
          fill={capColor}
        />
        <path
          d="M16 4.5L2.5 10.5L16 16.5L29.5 10.5L16 4.5Z"
          fill="url(#fabric-texture)"
        />
        {/* Natural fabric fold */}
        <path
          d="M16 4.5L9 7.5L16 10.5L23 7.5L16 4.5Z"
          fill="#fff"
          opacity="0.04"
        />
      </g>
      
      {/* Cap body - natural drape */}
      <g>
        <path
          d="M4.5 11V18.5C4.5 18.5 7.5 22.5 16 22.5C24.5 22.5 27.5 18.5 27.5 18.5V11"
          fill={capColor}
        />
        <path
          d="M4.5 11V18.5C4.5 18.5 7.5 22.5 16 22.5C24.5 22.5 27.5 18.5 27.5 18.5V11"
          fill="url(#cap-drape)"
        />
        {/* Natural fabric highlights */}
        <path
          d="M7 12.5C7 12.5 10 17.5 16 17.5C22 17.5 25 12.5 25 12.5"
          stroke="#fff"
          strokeWidth="0.4"
          opacity="0.06"
        />
      </g>
      
      {/* Center button - realistic metal */}
      <circle cx="16" cy="10.5" r="1.1" fill="#B8860B" />
      <circle cx="16" cy="10.5" r="1.1" fill="url(#metal-button)" />
      <circle cx="15.6" cy="10.2" r="0.3" fill="#FFD700" opacity="0.4" />
      
      {/* Real silk tassel - natural gold */}
      <g>
        {/* Tassel cord with natural curve */}
        <path
          d="M16 11.5 Q17.5 13 18.5 15.5 Q19 17 19.5 19"
          stroke="#B8860B"
          strokeWidth="1.3"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M16 11.5 Q17.5 13 18.5 15.5 Q19 17 19.5 19"
          stroke="#D4AF37"
          strokeWidth="0.9"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* Knot */}
        <ellipse cx="18.5" cy="15.5" rx="1.1" ry="0.9" fill="#B8860B" />
        <ellipse cx="18.5" cy="15.5" rx="1.1" ry="0.9" fill="url(#knot-texture)" />
        
        {/* Individual silk threads */}
        <g opacity="0.95">
          <line x1="19.5" y1="19" x2="18.5" y2="21.5" stroke="#B8860B" strokeWidth="0.9" strokeLinecap="round" />
          <line x1="19.5" y1="19" x2="19.5" y2="22" stroke="#D4AF37" strokeWidth="0.9" strokeLinecap="round" />
          <line x1="19.5" y1="19" x2="20.5" y2="21.5" stroke="#B8860B" strokeWidth="0.9" strokeLinecap="round" />
          <line x1="19.5" y1="19" x2="17.8" y2="21.2" stroke="#C5A033" strokeWidth="0.75" strokeLinecap="round" opacity="0.8" />
          <line x1="19.5" y1="19" x2="21.2" y2="21.2" stroke="#C5A033" strokeWidth="0.75" strokeLinecap="round" opacity="0.8" />
        </g>
        
        {/* Natural highlight on cord */}
        <path
          d="M16 11.5 Q17.5 13 18.5 15.5"
          stroke="#F0E68C"
          strokeWidth="0.4"
          strokeLinecap="round"
          fill="none"
          opacity="0.5"
        />
      </g>
      
      <defs>
        <linearGradient id="fabric-texture" x1="16" y1="4.5" x2="16" y2="16.5">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.06" />
          <stop offset="50%" stopColor="transparent" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.15" />
        </linearGradient>
        <linearGradient id="cap-drape" x1="16" y1="11" x2="16" y2="22.5">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.12" />
        </linearGradient>
        <radialGradient id="metal-button">
          <stop offset="20%" stopColor="#FFD700" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.2" />
        </radialGradient>
        <radialGradient id="knot-texture">
          <stop offset="30%" stopColor="#D4AF37" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.15" />
        </radialGradient>
      </defs>
    </svg>
  );
};

export const TimetableIcon = ({ size = 32, color = 'currentColor', darkMode = false }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ transition: 'all 0.3s ease' }}
    >
      {/* Natural shadow */}
      <rect x="5.5" y="7" width="21" height="19" rx="2" fill="#000" opacity="0.06" />
      
      {/* Paper calendar body */}
      <rect
        x="5"
        y="6"
        width="21"
        height="19"
        rx="2"
        fill={darkMode ? '#F8F9FA' : '#FFFFFF'}
        stroke="#D1D5DB"
        strokeWidth="1"
      />
      
      {/* Natural paper texture */}
      <rect
        x="5"
        y="6"
        width="21"
        height="19"
        rx="2"
        fill="url(#paper-texture)"
      />
      
      {/* Header - muted blue like real calendars */}
      <rect
        x="5"
        y="6"
        width="21"
        height="5.5"
        fill="#4B5563"
      />
      <rect
        x="5"
        y="6"
        width="21"
        height="5.5"
        fill="url(#header-shine)"
      />
      
      {/* Realistic metal spiral binding */}
      <g>
        <ellipse cx="9.5" cy="6" rx="1.6" ry="1.3" fill="#6B7280" />
        <ellipse cx="9.5" cy="6" rx="1.6" ry="1.3" fill="url(#metal-gradient)" />
        <ellipse cx="9.5" cy="6" rx="0.9" ry="0.7" fill="none" stroke="#E5E7EB" strokeWidth="0.6" />
        
        <ellipse cx="22.5" cy="6" rx="1.6" ry="1.3" fill="#6B7280" />
        <ellipse cx="22.5" cy="6" rx="1.6" ry="1.3" fill="url(#metal-gradient)" />
        <ellipse cx="22.5" cy="6" rx="0.9" ry="0.7" fill="none" stroke="#E5E7EB" strokeWidth="0.6" />
      </g>
      
      {/* Ring tops */}
      <rect x="8.6" y="3.5" width="1.8" height="2.8" rx="0.9" fill="#6B7280" />
      <rect x="8.6" y="3.5" width="1.8" height="2.8" rx="0.9" fill="url(#ring-shine)" />
      <rect x="21.6" y="3.5" width="1.8" height="2.8" rx="0.9" fill="#6B7280" />
      <rect x="21.6" y="3.5" width="1.8" height="2.8" rx="0.9" fill="url(#ring-shine)" />
      
      {/* Grid separator */}
      <path d="M5 11.5H26" stroke="#E5E7EB" strokeWidth="1" />
      
      {/* Green check - like real pen mark */}
      <path
        d="M9 16L11.3 18.3L14.5 15.1"
        stroke="#059669"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Realistic ink dots - different colors like real markers */}
      <circle cx="19" cy="17" r="1.3" fill="#F59E0B" opacity="0.85" />
      <circle cx="23" cy="17" r="1.3" fill="#3B82F6" opacity="0.85" />
      <circle cx="19" cy="21.5" r="1.3" fill="#EC4899" opacity="0.8" />
      <circle cx="23" cy="21.5" r="1.3" fill="#8B5CF6" opacity="0.8" />
      
      <defs>
        <linearGradient id="paper-texture" x1="16" y1="6" x2="16" y2="25">
          <stop offset="0%" stopColor="#F9FAFB" stopOpacity="0.3" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
        <linearGradient id="header-shine" x1="16" y1="6" x2="16" y2="11.5">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.08" />
        </linearGradient>
        <radialGradient id="metal-gradient">
          <stop offset="20%" stopColor="#D1D5DB" stopOpacity="0.6" />
          <stop offset="80%" stopColor="#000" stopOpacity="0.2" />
        </radialGradient>
        <linearGradient id="ring-shine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#9CA3AF" stopOpacity="0.4" />
          <stop offset="50%" stopColor="#D1D5DB" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.2" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export const ScheduleVisualizerIcon = ({ size = 32, color = 'currentColor', darkMode = false }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ transition: 'all 0.3s ease' }}
    >
      {/* Subtle shadow */}
      <rect x="4.5" y="7" width="23" height="19" rx="2" fill="#000" opacity="0.05" />
      
      {/* Planner paper */}
      <rect
        x="4"
        y="6"
        width="23"
        height="19"
        rx="2"
        fill="#FEFEFE"
        stroke="#D1D5DB"
        strokeWidth="0.8"
      />
      
      {/* Natural header */}
      <rect x="4" y="6" width="23" height="3.8" fill="#F3F4F6" />
      <path d="M4 9.8H27" stroke="#D1D5DB" strokeWidth="0.8" />
      
      {/* Day columns - subtle like real planner */}
      <path d="M10.3 6V25" stroke="#E5E7EB" strokeWidth="0.5" />
      <path d="M16.3 6V25" stroke="#E5E7EB" strokeWidth="0.5" />
      <path d="M22.3 6V25" stroke="#E5E7EB" strokeWidth="0.5" />
      
      {/* Time blocks - realistic highlighter colors */}
      <g opacity="0.85">
        {/* Monday - soft purple highlighter */}
        <rect x="5.2" y="12" width="4.5" height="4.8" rx="0.6" fill="#C084FC" opacity="0.35" />
        <rect x="5.2" y="12" width="4.5" height="4.8" rx="0.6" stroke="#A855F7" strokeWidth="0.3" opacity="0.5" />
        
        {/* Tuesday - soft orange highlighter */}
        <rect x="11.2" y="11" width="4.5" height="6.5" rx="0.6" fill="#FDBA74" opacity="0.35" />
        <rect x="11.2" y="11" width="4.5" height="6.5" rx="0.6" stroke="#F97316" strokeWidth="0.3" opacity="0.5" />
        
        {/* Wednesday - soft blue highlighter */}
        <rect x="17.2" y="13" width="4.5" height="3.8" rx="0.6" fill="#93C5FD" opacity="0.35" />
        <rect x="17.2" y="13" width="4.5" height="3.8" rx="0.6" stroke="#3B82F6" strokeWidth="0.3" opacity="0.5" />
        
        {/* Thursday - soft pink highlighter */}
        <rect x="23.2" y="12" width="3.3" height="5.5" rx="0.6" fill="#F9A8D4" opacity="0.35" />
        <rect x="23.2" y="12" width="3.3" height="5.5" rx="0.6" stroke="#EC4899" strokeWidth="0.3" opacity="0.5" />
        
        {/* Afternoon classes */}
        <rect x="5.2" y="18" width="4.5" height="3.2" rx="0.6" fill="#86EFAC" opacity="0.35" />
        <rect x="5.2" y="18" width="4.5" height="3.2" rx="0.6" stroke="#22C55E" strokeWidth="0.3" opacity="0.5" />
        
        <rect x="17.2" y="18.5" width="4.5" height="3.8" rx="0.6" fill="#D8B4FE" opacity="0.35" />
        <rect x="17.2" y="18.5" width="4.5" height="3.8" rx="0.6" stroke="#A855F7" strokeWidth="0.3" opacity="0.5" />
      </g>
      
      {/* Subtle time grid lines like ruled paper */}
      <path d="M4 14H27" stroke="#E5E7EB" strokeWidth="0.3" opacity="0.5" />
      <path d="M4 18H27" stroke="#E5E7EB" strokeWidth="0.3" opacity="0.5" />
      <path d="M4 22H27" stroke="#E5E7EB" strokeWidth="0.3" opacity="0.5" />
    </svg>
  );
};

export const ProfileIcon = ({ size = 32, color = 'currentColor', darkMode = false }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ transition: 'all 0.3s ease' }}
    >
      {/* Natural shadow */}
      <ellipse cx="16" cy="27.5" rx="11" ry="0.8" fill="#000" opacity="0.06" />
      
      {/* Head - natural skin tone */}
      <circle cx="16" cy="11" r="5.5" fill="#E0A899" />
      <circle cx="16" cy="11" r="5.5" fill="url(#skin-tone)" />
      {/* Natural highlight */}
      <ellipse cx="13.5" cy="9.5" rx="1.8" ry="2.2" fill="#fff" opacity="0.15" />
      
      {/* Shoulders/Shirt - soft natural colors */}
      <path
        d="M6 27.5C6 22.8 9.8 19 14.5 19H17.5C22.2 19 26 22.8 26 27.5"
        fill="#4B5563"
      />
      <path
        d="M6 27.5C6 22.8 9.8 19 14.5 19H17.5C22.2 19 26 22.8 26 27.5"
        fill="url(#shirt-fabric)"
      />
      {/* Natural shirt collar */}
      <path
        d="M14 19C14 19 15 20 16 20C17 20 18 19 18 19"
        stroke="#E5E7EB"
        strokeWidth="0.4"
        opacity="0.3"
      />
      
      {/* Excellence badge - realistic gold medal */}
      <g>
        {/* Medal circle */}
        <circle cx="23.5" cy="7.5" r="3.8" fill="#B8860B" />
        <circle cx="23.5" cy="7.5" r="3.8" fill="url(#gold-medal)" />
        
        {/* Medal border */}
        <circle cx="23.5" cy="7.5" r="3.8" stroke="#8B6914" strokeWidth="0.4" />
        <circle cx="23.5" cy="7.5" r="3" stroke="#D4AF37" strokeWidth="0.3" opacity="0.5" />
        
        {/* Star engraving */}
        <path
          d="M23.5 5L24.2 6.7L26 7L24.7 8.3L25 10L23.5 9.2L22 10L22.3 8.3L21 7L22.8 6.7L23.5 5Z"
          fill="#8B6914"
          opacity="0.3"
        />
        <path
          d="M23.5 5L24.2 6.7L26 7L24.7 8.3L25 10L23.5 9.2L22 10L22.3 8.3L21 7L22.8 6.7L23.5 5Z"
          fill="#F9E076"
          opacity="0.4"
        />
      </g>
      
      <defs>
        <radialGradient id="skin-tone">
          <stop offset="20%" stopColor="#F7D4C8" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#C17A6D" stopOpacity="0.15" />
        </radialGradient>
        <linearGradient id="shirt-fabric" x1="16" y1="19" x2="16" y2="27.5">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.12" />
        </linearGradient>
        <radialGradient id="gold-medal">
          <stop offset="20%" stopColor="#F9E076" stopOpacity="0.5" />
          <stop offset="60%" stopColor="#D4AF37" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#8B6914" stopOpacity="0.25" />
        </radialGradient>
      </defs>
    </svg>
  );
};

// Search suggestion icons - natural colorful versions
export const RecentIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="8" fill="#DBEAFE" />
    <circle cx="10" cy="10" r="8" stroke="#3B82F6" strokeWidth="1.3" />
    <path d="M10 5V10L13.5 11.5" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const PopularIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <path
      d="M10 2L11.5 7L16.5 7.5L12.5 11L13.5 16L10 13L6.5 16L7.5 11L3.5 7.5L8.5 7L10 2Z"
      fill="#FED7AA"
    />
    <path
      d="M10 2L11.5 7L16.5 7.5L12.5 11L13.5 16L10 13L6.5 16L7.5 11L3.5 7.5L8.5 7L10 2Z"
      stroke="#F59E0B"
      strokeWidth="1.3"
      strokeLinejoin="round"
    />
  </svg>
);

export const CourseIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <rect x="3" y="4" width="14" height="12" rx="1.3" fill="#D1FAE5" />
    <rect x="3" y="4" width="14" height="12" rx="1.3" stroke="#10B981" strokeWidth="1.3" />
    <path d="M6 8H14M6 11H11" stroke="#059669" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

export const QuestionIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="8" fill="#EDE9FE" />
    <circle cx="10" cy="10" r="8" stroke="#8B5CF6" strokeWidth="1.3" />
    <circle cx="10" cy="14.5" r="0.9" fill="#7C3AED" />
    <path
      d="M10 12V11.5C10 11.5 10 11 10.5 10.5C11 10 12 9.5 12 8.5C12 7.395 11.105 6.5 10 6.5C8.895 6.5 8 7.395 8 8.5"
      stroke="#7C3AED"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
  </svg>
);
