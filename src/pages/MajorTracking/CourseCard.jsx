import React, { useState, useEffect } from 'react';
import { Check, AlertTriangle, Lock } from 'lucide-react';

const CourseCard = ({ 
  course,
  status,
  onClick,
  viewMode = 'grid',
  displayOptions = {
    showDistributives: true,
    showTerms: true,
    showAllocation: true
  },
  darkMode  // added darkMode prop
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const {
    isCompleted,
    isUsedInOtherPillar,
    usedInPillar,
    isLocked,
    allocationInfo,
    colorStatus
  } = status;
  
  const courseId = course?.department && course?.course_number ? 
    `${course.department}${course.course_number}` : '';
  
  useEffect(() => {
    if (!courseId) return;
    console.log(`[${courseId}] Card Status:`, {
      isCompleted,
      isUsedInOtherPillar,
      usedInPillar,
      isLocked,
      colorStatus,
      allocationInfo
    });
  }, [courseId, isCompleted, isUsedInOtherPillar, usedInPillar, isLocked, colorStatus, allocationInfo]);
  
  if (!course?.department || !course?.course_number) return null;

  const getCardStyles = () => {
    let styles = 'relative rounded-xl shadow p-4 transition-all duration-200 cursor-pointer h-40 ';
    
    // Adjust width based on viewMode
    styles += viewMode === 'carousel' ? 'w-64 flex-none ' : 'w-full ';
    
    // Apply background, ring, and hover effects based on status and dark mode
    if (isLocked) {
      if (darkMode) {
        styles += 'ring-2 ring-gray-600 bg-gray-800 ';
        styles += isPressed ? 'bg-gray-700 scale-95 ' : 'hover:bg-gray-700 hover:scale-[0.98] ';
      } else {
        styles += 'ring-2 ring-gray-400 bg-gray-100 ';
        styles += isPressed ? 'bg-gray-200 scale-95 ' : 'hover:bg-gray-200 hover:scale-[0.98] ';
      }
    } else if (isCompleted) {
      switch (colorStatus) {
        case 'primary':
          if (darkMode) {
            styles += 'ring-2 ring-green-400 bg-green-900 ';
            styles += isPressed ? 'bg-green-800 scale-95 ' : 'hover:bg-green-800 hover:scale-[0.98] ';
          } else {
            styles += 'ring-2 ring-green-500 bg-green-50 ';
            styles += isPressed ? 'bg-green-200 scale-95 ' : 'hover:bg-green-100 hover:scale-[0.98] ';
          }
          break;
        case 'secondary':
          if (darkMode) {
            styles += 'ring-2 ring-yellow-400 bg-yellow-900 ';
            styles += isPressed ? 'bg-yellow-800 scale-95 ' : 'hover:bg-yellow-800 hover:scale-[0.98] ';
          } else {
            styles += 'ring-2 ring-yellow-500 bg-yellow-50 ';
            styles += isPressed ? 'bg-yellow-200 scale-95 ' : 'hover:bg-yellow-100 hover:scale-[0.98] ';
          }
          break;
        case 'overflow':
          if (darkMode) {
            styles += 'ring-2 ring-blue-400 bg-blue-900 ';
            styles += isPressed ? 'bg-blue-800 scale-95 ' : 'hover:bg-blue-800 hover:scale-[0.98] ';
          } else {
            styles += 'ring-2 ring-blue-500 bg-blue-50 ';
            styles += isPressed ? 'bg-blue-200 scale-95 ' : 'hover:bg-blue-100 hover:scale-[0.98] ';
          }
          break;
        default:
          if (darkMode) {
            styles += 'ring-2 ring-blue-400 bg-blue-900 ';
            styles += isPressed ? 'bg-blue-800 scale-95 ' : 'hover:bg-blue-800 hover:scale-[0.98] ';
          } else {
            styles += 'ring-2 ring-blue-500 bg-blue-50 ';
            styles += isPressed ? 'bg-blue-200 scale-95 ' : 'hover:bg-blue-100 hover:scale-[0.98] ';
          }
      }
    } else {
      if (darkMode) {
        styles += 'bg-gray-700 ';
        styles += isPressed ? 'bg-gray-600 scale-95 ' : 'hover:bg-gray-600 hover:scale-[0.98] hover:shadow-md ';
      } else {
        styles += 'bg-white ';
        styles += isPressed ? 'bg-gray-100 scale-95 ' : 'hover:bg-gray-50 hover:scale-[0.98] hover:shadow-md ';
      }
    }
    
    return styles.trim();
  };

  const handleCardInteraction = (e) => {
    if (isLocked) return;
    
    if (e.type === 'mousedown' || e.type === 'touchstart') {
      setIsPressed(true);
    } else if (e.type === 'mouseup' || e.type === 'mouseleave' || e.type === 'touchend') {
      setIsPressed(false);
    }
    
    if (e.type === 'mouseup' || e.type === 'touchend') {
      onClick?.(course);
    }
  };

  const renderTerms = () => {
    if (!displayOptions.showTerms) return null;
    if (!course.terms || !Array.isArray(course.terms) || course.terms.length === 0) {
      return "No recent terms available";
    }

    const sortedTerms = [...course.terms].sort((a, b) => {
      const yearA = parseInt('20' + a.slice(0, -1));
      const yearB = parseInt('20' + b.slice(0, -1));
      if (yearA !== yearB) return yearB - yearA;
      const termOrder = { 'W': 1, 'S': 2, 'X': 3, 'F': 4 };
      return termOrder[b.slice(-1)] - termOrder[a.slice(-1)];
    });

    return `Recent terms: ${sortedTerms.slice(0, 3).join(', ')}`;
  };

  const getStatusIcon = () => {
    if (isLocked)
      return <Lock className={`w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />;
    if (isCompleted && !isUsedInOtherPillar && allocationInfo?.isCurrentPillar)
      return <Check className={`w-5 h-5 ${darkMode ? 'text-green-400' : 'text-green-500'}`} />;
    if (isUsedInOtherPillar)
      return <AlertTriangle className={`w-5 h-5 ${darkMode ? 'text-yellow-400' : 'text-yellow-500'}`} />;
    return null;
  };

  const getAllocationBadge = () => {
    if (!displayOptions.showAllocation || !allocationInfo) return null;
    
    let badgeStyles = "text-xs px-2 py-1 rounded-full ";
    if (isLocked) {
      badgeStyles += darkMode ? "bg-gray-600 text-gray-300" : "bg-gray-200 text-gray-700";
    } else if (isUsedInOtherPillar) {
      badgeStyles += darkMode ? "bg-yellow-600 text-yellow-200" : "bg-yellow-100 text-yellow-800";
    } else if (allocationInfo.isCurrentPillar) {
      badgeStyles += darkMode ? "bg-green-600 text-green-200" : "bg-green-100 text-green-800";
    } else {
      badgeStyles += darkMode ? "bg-gray-600 text-gray-200" : "bg-gray-100 text-gray-800";
    }
    
    return (
      <span className={badgeStyles}>
        {allocationInfo.pillarName}
      </span>
    );
  };

  const getActionText = () => {
    if (isLocked) return `Used in ${usedInPillar}`;
    if (isUsedInOtherPillar) return `Allocated to ${usedInPillar}`;
    if (isCompleted) {
      if (allocationInfo?.isCurrentPillar) return "Click to remove";
      return allocationInfo ? `Allocated to ${allocationInfo.pillarName}` : "Click to allocate";
    }
    return "Click to add";
  };

  return (
    <div 
      className={getCardStyles()}
      onMouseDown={handleCardInteraction}
      onMouseUp={handleCardInteraction}
      onMouseLeave={handleCardInteraction}
      onTouchStart={handleCardInteraction}
      onTouchEnd={handleCardInteraction}
      role="button"
      tabIndex={0}
    >
      <div className="absolute top-2 right-2">
        {getStatusIcon()}
      </div>
      
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-start">
          <div className="overflow-hidden">
            <h4 className="font-semibold text-lg flex items-center gap-2">
              {courseId}
              {getAllocationBadge()}
            </h4>
            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} mt-1 line-clamp-2`}>
              {course.name?.split(':')[1]?.trim() || 'No title available'}
            </p>
          </div>
          {displayOptions.showDistributives && (
            <span className={`text-xs ${darkMode ? 'bg-indigo-700 text-indigo-300' : 'bg-indigo-100 text-indigo-800'} px-2 py-1 rounded flex-shrink-0`}>
              {course.distribs || 'No distrib'}
            </span>
          )}
        </div>
        
        <div className="mt-auto">
          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {renderTerms()}
          </div>
          
          <div className={`mt-2 text-xs ${
            isLocked ? (darkMode ? 'text-gray-400' : 'text-gray-600') :
            isUsedInOtherPillar ? (darkMode ? 'text-yellow-400' : 'text-yellow-600') :
            allocationInfo?.isCurrentPillar ? (darkMode ? 'text-green-400' : 'text-green-600') :
            (darkMode ? 'text-blue-400' : 'text-blue-600')
          }`}>
            {getActionText()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
