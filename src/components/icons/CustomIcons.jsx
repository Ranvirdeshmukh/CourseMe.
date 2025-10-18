import React from 'react';

// Vibrant, 3D, colorful icons that look like the real thing
// Each icon uses realistic colors, shadows, and depth to create a lively appearance

export const ClassesIcon = ({ size = 32, color = 'currentColor', darkMode = false }) => {
  const bookColors = darkMode 
    ? ['#7C3AED', '#EC4899', '#10B981'] 
    : ['#571CE0', '#F26655', '#00693e'];
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ transition: 'all 0.3s ease' }}
    >
      {/* Shadow layer */}
      <ellipse cx="16" cy="25" rx="10" ry="1.5" fill="#000" opacity="0.1" />
      
      {/* Purple Book (front) */}
      <g filter="url(#book-shadow)">
        <rect
          x="5"
          y="9"
          width="8"
          height="14"
          rx="1"
          fill={bookColors[0]}
        />
        <rect
          x="5"
          y="9"
          width="8"
          height="14"
          rx="1"
          fill="url(#book-gradient-1)"
        />
        {/* Book spine highlight */}
        <rect x="5" y="9" width="1.5" height="14" fill="#fff" opacity="0.2" />
        {/* Pages */}
        <rect x="12.5" y="9.5" width="0.3" height="13" fill="#fff" opacity="0.6" />
        <rect x="12.2" y="9.8" width="0.3" height="12.4" fill="#fff" opacity="0.4" />
        {/* Bookmark */}
        <path d="M7 9L7 16L8.5 14.5L10 16L10 9" fill="#FFD700" opacity="0.8" />
      </g>
      
      {/* Orange Book (middle) */}
      <g filter="url(#book-shadow)">
        <rect
          x="12"
          y="7"
          width="8"
          height="15"
          rx="1"
          fill={bookColors[1]}
        />
        <rect
          x="12"
          y="7"
          width="8"
          height="15"
          rx="1"
          fill="url(#book-gradient-2)"
        />
        <rect x="12" y="7" width="1.5" height="15" fill="#fff" opacity="0.3" />
        <rect x="19.5" y="7.5" width="0.3" height="14" fill="#fff" opacity="0.5" />
        {/* Title lines */}
        <rect x="14" y="10" width="4" height="0.8" rx="0.4" fill="#fff" opacity="0.6" />
        <rect x="14" y="12" width="3" height="0.6" rx="0.3" fill="#fff" opacity="0.4" />
      </g>
      
      {/* Green Book (back) */}
      <g filter="url(#book-shadow)">
        <rect
          x="19"
          y="8"
          width="8"
          height="14"
          rx="1"
          fill={bookColors[2]}
        />
        <rect
          x="19"
          y="8"
          width="8"
          height="14"
          rx="1"
          fill="url(#book-gradient-3)"
        />
        <rect x="19" y="8" width="1.5" height="14" fill="#fff" opacity="0.25" />
        <rect x="26.5" y="8.5" width="0.3" height="13" fill="#fff" opacity="0.4" />
      </g>
      
      <defs>
        <filter id="book-shadow" x="-2" y="-2" width="40" height="40">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodOpacity="0.3"/>
        </filter>
        <linearGradient id="book-gradient-1" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#000" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id="book-gradient-2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#000" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0.15" />
        </linearGradient>
        <linearGradient id="book-gradient-3" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#000" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0.1" />
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
    {/* Target board shadow */}
    <circle cx="16" cy="16.5" r="12" fill="#000" opacity="0.12" />
    
    {/* Classic red and white target */}
    <circle cx="16" cy="16" r="12" fill="#DC2626" filter="url(#target-shadow)" />
    <circle cx="16" cy="16" r="12" fill="url(#target-gradient)" />
    
    <circle cx="16" cy="16" r="9" fill="#fff" />
    <circle cx="16" cy="16" r="9" fill="url(#ring-gradient-1)" />
    
    <circle cx="16" cy="16" r="6" fill="#DC2626" />
    <circle cx="16" cy="16" r="6" fill="url(#ring-gradient-2)" />
    
    <circle cx="16" cy="16" r="3" fill="#fff" />
    <circle cx="16" cy="16" r="3" fill="url(#ring-gradient-3)" />
    
    {/* Bullseye */}
    <circle cx="16" cy="16" r="1.5" fill="#DC2626" />
    <circle cx="16" cy="16" r="0.8" fill="#B91C1C" />
    
    {/* Golden arrow with depth */}
    <g filter="url(#arrow-shadow)">
      {/* Arrow shaft */}
      <line x1="24" y1="8" x2="16" y2="16" stroke="#B8860B" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="24" y1="8" x2="16" y2="16" stroke="#FFD700" strokeWidth="1.8" strokeLinecap="round" />
      
      {/* Arrow tip */}
      <path d="M15 16L16 16L16 15Z" fill="#B8860B" />
      
      {/* Fletching */}
      <path d="M23 7L24 8L22 9Z" fill="#DC2626" />
      <path d="M23 9L24 8L25 9Z" fill="#fff" />
      
      {/* Arrow highlight */}
      <line x1="24" y1="8" x2="18" y2="14" stroke="#fff" strokeWidth="0.6" strokeLinecap="round" opacity="0.6" />
    </g>
    
    <defs>
      <filter id="target-shadow">
        <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.25"/>
      </filter>
      <filter id="arrow-shadow">
        <feDropShadow dx="0.5" dy="0.5" stdDeviation="1" floodOpacity="0.4"/>
      </filter>
      <radialGradient id="target-gradient">
        <stop offset="0%" stopColor="#fff" stopOpacity="0.1" />
        <stop offset="100%" stopColor="#000" stopOpacity="0.15" />
      </radialGradient>
      <radialGradient id="ring-gradient-1">
        <stop offset="0%" stopColor="#fff" stopOpacity="0.2" />
        <stop offset="100%" stopColor="#000" stopOpacity="0.1" />
      </radialGradient>
      <radialGradient id="ring-gradient-2">
        <stop offset="0%" stopColor="#fff" stopOpacity="0.15" />
        <stop offset="100%" stopColor="#000" stopOpacity="0.1" />
      </radialGradient>
      <radialGradient id="ring-gradient-3">
        <stop offset="0%" stopColor="#fff" stopOpacity="0.3" />
        <stop offset="100%" stopColor="#000" stopOpacity="0.05" />
      </radialGradient>
    </defs>
  </svg>
);

export const ProfessorsIcon = ({ size = 32, color = 'currentColor', darkMode = false }) => {
  const capColor = darkMode ? '#1E293B' : '#0F172A';
  const tassleColor = '#FFD700';
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ transition: 'all 0.3s ease' }}
    >
      {/* Shadow */}
      <ellipse cx="16" cy="24" rx="12" ry="1.5" fill="#000" opacity="0.15" />
      
      {/* Mortarboard top (black) */}
      <g filter="url(#cap-shadow)">
        <path
          d="M16 5L3 10.5L16 16L29 10.5L16 5Z"
          fill={capColor}
        />
        <path
          d="M16 5L3 10.5L16 16L29 10.5L16 5Z"
          fill="url(#cap-top-gradient)"
        />
        {/* Top highlight */}
        <path
          d="M16 5L10 7.75L16 10.5L22 7.75L16 5Z"
          fill="#fff"
          opacity="0.15"
        />
      </g>
      
      {/* Cap body/rim */}
      <g filter="url(#cap-shadow)">
        <path
          d="M5 11.5V18C5 18 7.5 22 16 22C24.5 22 27 18 27 18V11.5"
          fill={capColor}
          opacity="0.9"
        />
        <path
          d="M5 11.5V18C5 18 7.5 22 16 22C24.5 22 27 18 27 18V11.5"
          fill="url(#cap-body-gradient)"
        />
        {/* Front highlight */}
        <path
          d="M8 13C8 13 10 17 16 17C22 17 24 13 24 13"
          stroke="#fff"
          strokeWidth="0.5"
          opacity="0.2"
        />
      </g>
      
      {/* Center button */}
      <circle cx="16" cy="10.5" r="1.2" fill={tassleColor} filter="url(#button-glow)" />
      
      {/* Gold tassel */}
      <g filter="url(#tassel-shadow)">
        {/* Tassel cord */}
        <path
          d="M16 11.5 Q18 13 19 16 L19 19"
          stroke={tassleColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Tassel top knot */}
        <circle cx="19" cy="16" r="1" fill={tassleColor} />
        {/* Tassel threads */}
        <g opacity="0.9">
          <line x1="19" y1="19" x2="18" y2="21" stroke={tassleColor} strokeWidth="1" strokeLinecap="round" />
          <line x1="19" y1="19" x2="19" y2="21.5" stroke={tassleColor} strokeWidth="1" strokeLinecap="round" />
          <line x1="19" y1="19" x2="20" y2="21" stroke={tassleColor} strokeWidth="1" strokeLinecap="round" />
        </g>
        {/* Tassel highlight */}
        <path
          d="M16 11.5 Q18 13 19 16"
          stroke="#FFF8DC"
          strokeWidth="0.6"
          strokeLinecap="round"
          fill="none"
          opacity="0.6"
        />
      </g>
      
      <defs>
        <filter id="cap-shadow">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodOpacity="0.3"/>
        </filter>
        <filter id="tassel-shadow">
          <feDropShadow dx="0.5" dy="0.5" stdDeviation="0.8" floodOpacity="0.3"/>
        </filter>
        <filter id="button-glow">
          <feGaussianBlur stdDeviation="1" />
          <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.3 0"/>
        </filter>
        <linearGradient id="cap-top-gradient" x1="16" y1="5" x2="16" y2="16">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id="cap-body-gradient" x1="16" y1="11" x2="16" y2="22">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.1" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export const TimetableIcon = ({ size = 32, color = 'currentColor', darkMode = false }) => {
  const calendarBg = darkMode ? '#1E293B' : '#fff';
  const headerColor = darkMode ? '#7C3AED' : '#571CE0';
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ transition: 'all 0.3s ease' }}
    >
      {/* Shadow */}
      <rect x="5" y="6.5" width="22" height="20" rx="2.5" fill="#000" opacity="0.1" />
      
      {/* Calendar body */}
      <rect
        x="5"
        y="6"
        width="22"
        height="20"
        rx="2.5"
        fill={calendarBg}
        stroke="#E5E7EB"
        strokeWidth="1.5"
        filter="url(#calendar-shadow)"
      />
      
      {/* Header bar with gradient */}
      <rect
        x="5"
        y="6"
        width="22"
        height="6"
        fill={headerColor}
      />
      <rect
        x="5"
        y="6"
        width="22"
        height="6"
        fill="url(#header-gradient)"
      />
      
      {/* Binding spirals */}
      <g filter="url(#ring-shadow)">
        <circle cx="10" cy="6" r="1.8" fill="#64748B" />
        <circle cx="10" cy="6" r="1.2" fill="none" stroke={calendarBg} strokeWidth="0.8" />
        <circle cx="22" cy="6" r="1.8" fill="#64748B" />
        <circle cx="22" cy="6" r="1.2" fill="none" stroke={calendarBg} strokeWidth="0.8" />
      </g>
      
      {/* Ring stems */}
      <rect x="9.2" y="3" width="1.6" height="3" rx="0.8" fill="#64748B" />
      <rect x="21.2" y="3" width="1.6" height="3" rx="0.8" fill="#64748B" />
      
      {/* Date grid */}
      <path d="M5 12H27" stroke="#E5E7EB" strokeWidth="1" />
      
      {/* Checkmark (completed task) */}
      <g filter="url(#check-glow)">
        <path
          d="M9 16L11.5 18.5L15 15"
          stroke="#10B981"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      
      {/* Event dots (different colors) */}
      <circle cx="19" cy="17" r="1.5" fill="#F59E0B" filter="url(#dot-shadow)" />
      <circle cx="23" cy="17" r="1.5" fill="#3B82F6" filter="url(#dot-shadow)" />
      <circle cx="19" cy="22" r="1.5" fill="#EC4899" filter="url(#dot-shadow)" />
      <circle cx="23" cy="22" r="1.5" fill="#8B5CF6" filter="url(#dot-shadow)" />
      
      <defs>
        <filter id="calendar-shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.15"/>
        </filter>
        <filter id="ring-shadow">
          <feDropShadow dx="0" dy="0.5" stdDeviation="0.5" floodOpacity="0.3"/>
        </filter>
        <filter id="check-glow">
          <feDropShadow dx="0" dy="0" stdDeviation="1" floodColor="#10B981" floodOpacity="0.3"/>
        </filter>
        <filter id="dot-shadow">
          <feDropShadow dx="0" dy="0.5" stdDeviation="0.8" floodOpacity="0.25"/>
        </filter>
        <linearGradient id="header-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.1" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export const ScheduleVisualizerIcon = ({ size = 32, color = 'currentColor', darkMode = false }) => {
  const bgColor = darkMode ? '#1E293B' : '#fff';
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ transition: 'all 0.3s ease' }}
    >
      {/* Shadow */}
      <rect x="4" y="6.5" width="24" height="20" rx="2.5" fill="#000" opacity="0.1" />
      
      {/* Calendar frame */}
      <rect
        x="4"
        y="6"
        width="24"
        height="20"
        rx="2.5"
        fill={bgColor}
        stroke="#E5E7EB"
        strokeWidth="1.5"
        filter="url(#schedule-shadow)"
      />
      
      {/* Header with days */}
      <rect x="4" y="6" width="24" height="4" fill="#F3F4F6" />
      <path d="M4 10H28" stroke="#E5E7EB" strokeWidth="1.5" />
      
      {/* Day dividers */}
      <path d="M10 6V26" stroke="#E5E7EB" strokeWidth="0.8" opacity="0.5" />
      <path d="M16 6V26" stroke="#E5E7EB" strokeWidth="0.8" opacity="0.5" />
      <path d="M22 6V26" stroke="#E5E7EB" strokeWidth="0.8" opacity="0.5" />
      
      {/* Colorful time blocks (like real classes) */}
      <g filter="url(#block-shadow)">
        {/* Monday - Purple class */}
        <rect x="5.5" y="12" width="4" height="5" rx="1" fill="#7C3AED" />
        <rect x="5.5" y="12" width="4" height="5" rx="1" fill="url(#block-grad-1)" />
        
        {/* Tuesday - Orange class */}
        <rect x="11.5" y="11" width="4" height="7" rx="1" fill="#F59E0B" />
        <rect x="11.5" y="11" width="4" height="7" rx="1" fill="url(#block-grad-2)" />
        
        {/* Wednesday - Blue class */}
        <rect x="17.5" y="13" width="4" height="4" rx="1" fill="#3B82F6" />
        <rect x="17.5" y="13" width="4" height="4" rx="1" fill="url(#block-grad-3)" />
        
        {/* Thursday - Pink class */}
        <rect x="23.5" y="12" width="3.5" height="6" rx="1" fill="#EC4899" />
        <rect x="23.5" y="12" width="3.5" height="6" rx="1" fill="url(#block-grad-4)" />
        
        {/* More afternoon classes */}
        <rect x="5.5" y="18" width="4" height="3.5" rx="1" fill="#10B981" />
        <rect x="5.5" y="18" width="4" height="3.5" rx="1" fill="url(#block-grad-5)" />
        
        <rect x="17.5" y="18.5" width="4" height="4" rx="1" fill="#8B5CF6" />
        <rect x="17.5" y="18.5" width="4" height="4" rx="1" fill="url(#block-grad-6)" />
      </g>
      
      {/* Time grid lines */}
      <path d="M4 14H28" stroke="#E5E7EB" strokeWidth="0.5" opacity="0.3" />
      <path d="M4 18H28" stroke="#E5E7EB" strokeWidth="0.5" opacity="0.3" />
      <path d="M4 22H28" stroke="#E5E7EB" strokeWidth="0.5" opacity="0.3" />
      
      <defs>
        <filter id="schedule-shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.15"/>
        </filter>
        <filter id="block-shadow">
          <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.2"/>
        </filter>
        <linearGradient id="block-grad-1" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id="block-grad-2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id="block-grad-3" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id="block-grad-4" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id="block-grad-5" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id="block-grad-6" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.1" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export const ProfileIcon = ({ size = 32, color = 'currentColor', darkMode = false }) => {
  const skinTone = darkMode ? '#FBBF24' : '#FCA5A5';
  const shirtColor = darkMode ? '#7C3AED' : '#571CE0';
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ transition: 'all 0.3s ease' }}
    >
      {/* Shadow */}
      <ellipse cx="16" cy="27" rx="10" ry="1.5" fill="#000" opacity="0.15" />
      
      {/* Head */}
      <g filter="url(#head-shadow)">
        <circle cx="16" cy="11" r="6" fill={skinTone} />
        <circle cx="16" cy="11" r="6" fill="url(#head-gradient)" />
        {/* Face highlight */}
        <ellipse cx="13" cy="9" rx="1.5" ry="2" fill="#fff" opacity="0.3" />
      </g>
      
      {/* Body/Shoulders */}
      <g filter="url(#body-shadow)">
        <path
          d="M6 27C6 22 9.5 18 14 18H18C22.5 18 26 22 26 27"
          fill={shirtColor}
        />
        <path
          d="M6 27C6 22 9.5 18 14 18H18C22.5 18 26 22 26 27"
          fill="url(#body-gradient)"
        />
        {/* Collar */}
        <path
          d="M13 18C13 18 14 19 16 19C18 19 19 18 19 18"
          stroke="#fff"
          strokeWidth="0.5"
          opacity="0.3"
        />
      </g>
      
      {/* Academic achievement badge */}
      <g filter="url(#badge-glow)">
        {/* Badge circle background */}
        <circle cx="23" cy="7" r="4" fill="#FFD700" />
        <circle cx="23" cy="7" r="4" fill="url(#badge-gradient)" />
        
        {/* Star */}
        <path
          d="M23 4.5L23.8 6.3L25.8 6.5L24.4 7.9L24.7 9.9L23 8.9L21.3 9.9L21.6 7.9L20.2 6.5L22.2 6.3L23 4.5Z"
          fill="#FFF8DC"
        />
        <path
          d="M23 4.5L23.8 6.3L25.8 6.5L24.4 7.9L24.7 9.9L23 8.9L21.3 9.9L21.6 7.9L20.2 6.5L22.2 6.3L23 4.5Z"
          stroke="#B8860B"
          strokeWidth="0.5"
        />
      </g>
      
      <defs>
        <filter id="head-shadow">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodOpacity="0.2"/>
        </filter>
        <filter id="body-shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.15"/>
        </filter>
        <filter id="badge-glow">
          <feGaussianBlur stdDeviation="1.5" />
          <feColorMatrix values="1 0 0 0 0  0 0.84 0 0 0  0 0 1 0 0  0 0 0 0.4 0"/>
        </filter>
        <radialGradient id="head-gradient">
          <stop offset="30%" stopColor="#fff" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.1" />
        </radialGradient>
        <linearGradient id="body-gradient" x1="16" y1="18" x2="16" y2="27">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.15" />
        </linearGradient>
        <radialGradient id="badge-gradient">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.1" />
        </radialGradient>
      </defs>
    </svg>
  );
};

// Search suggestion icons - colorful mini versions
export const RecentIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="8" fill="#3B82F6" opacity="0.15" />
    <circle cx="10" cy="10" r="8" stroke="#3B82F6" strokeWidth="1.5" />
    <path d="M10 5V10L14 12" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const PopularIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <path
      d="M10 2L11.5 7L16.5 7.5L12.5 11L13.5 16L10 13L6.5 16L7.5 11L3.5 7.5L8.5 7L10 2Z"
      fill="#F59E0B"
      opacity="0.2"
    />
    <path
      d="M10 2L11.5 7L16.5 7.5L12.5 11L13.5 16L10 13L6.5 16L7.5 11L3.5 7.5L8.5 7L10 2Z"
      stroke="#F59E0B"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);

export const CourseIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <rect x="3" y="4" width="14" height="12" rx="1.5" fill="#10B981" opacity="0.15" />
    <rect x="3" y="4" width="14" height="12" rx="1.5" stroke="#10B981" strokeWidth="1.5" />
    <path d="M6 8H14M6 11H11" stroke="#10B981" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

export const QuestionIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="8" fill="#8B5CF6" opacity="0.15" />
    <circle cx="10" cy="10" r="8" stroke="#8B5CF6" strokeWidth="1.5" />
    <circle cx="10" cy="14.5" r="1" fill="#8B5CF6" />
    <path
      d="M10 12V11.5C10 11.5 10 11 10.5 10.5C11 10 12 9.5 12 8.5C12 7.395 11.105 6.5 10 6.5C8.895 6.5 8 7.395 8 8.5"
      stroke="#8B5CF6"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);
