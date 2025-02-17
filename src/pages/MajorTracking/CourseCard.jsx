import React, { useState, useEffect } from 'react';
import { Check, AlertTriangle } from 'lucide-react';

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
  darkMode
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const {
    isCompleted,
    colorStatus = 'none'
  } = status;
  
  const courseId = course?.department && course?.course_number ? 
    `${course.department}${course.course_number}` : '';
  
  useEffect(() => {
    if (!courseId) return;
    console.log(`[${courseId}] Card Status:`, {
      isCompleted,
      colorStatus
    });
  }, [courseId, isCompleted, colorStatus]);
  
  if (!course?.department || !course?.course_number) return null;

  const getCardStyles = () => {
    let styles = 'relative rounded-xl shadow p-4 transition-all duration-200 cursor-pointer h-40 ';
    
    // Adjust width based on viewMode
    styles += viewMode === 'carousel' ? 'w-56 flex-none ' : 'w-full ';
    
    // Apply background, ring, and hover effects based on status
    if (isCompleted) {
      // If course is in overflow, always use blue regardless of other statuses
      if (colorStatus === 'overflow') {
        if (darkMode) {
          styles += 'ring-2 ring-blue-400 bg-blue-900 ';
          styles += isPressed ? 'bg-blue-800 scale-95 ' : 'hover:bg-blue-800 hover:scale-[0.98] ';
        } else {
          styles += 'ring-2 ring-blue-500 bg-blue-50 ';
          styles += isPressed ? 'bg-blue-200 scale-95 ' : 'hover:bg-blue-100 hover:scale-[0.98] ';
        }
      } else {
        // If not overflow, use normal status colors
        switch (colorStatus) {
          case 'primary': // Green - Used in current pillar
            if (darkMode) {
              styles += 'ring-2 ring-green-400 bg-green-900 ';
              styles += isPressed ? 'bg-green-800 scale-95 ' : 'hover:bg-green-800 hover:scale-[0.98] ';
            } else {
              styles += 'ring-2 ring-green-500 bg-green-50 ';
              styles += isPressed ? 'bg-green-200 scale-95 ' : 'hover:bg-green-100 hover:scale-[0.98] ';
            }
            break;
          case 'secondary': // Yellow - Used in another pillar
            if (darkMode) {
              styles += 'ring-2 ring-yellow-400 bg-yellow-900 ';
              styles += isPressed ? 'bg-yellow-800 scale-95 ' : 'hover:bg-yellow-800 hover:scale-[0.98] ';
            } else {
              styles += 'ring-2 ring-yellow-500 bg-yellow-50 ';
              styles += isPressed ? 'bg-yellow-200 scale-95 ' : 'hover:bg-yellow-100 hover:scale-[0.98] ';
            }
            break;
          default:
            if (darkMode) {
              styles += 'ring-2 ring-gray-400 bg-gray-900 ';
              styles += isPressed ? 'bg-gray-800 scale-95 ' : 'hover:bg-gray-800 hover:scale-[0.98] ';
            } else {
              styles += 'ring-2 ring-gray-300 bg-gray-50 ';
              styles += isPressed ? 'bg-gray-200 scale-95 ' : 'hover:bg-gray-100 hover:scale-[0.98] ';
            }
        }
      }
    } else {
      // Not completed
      if (darkMode) {
        styles += 'bg-gray-800 hover:bg-gray-700 ';
        styles += isPressed ? 'bg-gray-700 scale-95 ' : 'hover:scale-[0.98] hover:shadow-md ';
      } else {
        styles += 'bg-white hover:bg-gray-50 ';
        styles += isPressed ? 'bg-gray-100 scale-95 ' : 'hover:scale-[0.98] hover:shadow-md ';
      }
    }
    
    return styles.trim();
  };

  const handleCardInteraction = (e) => {
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
    if (isCompleted) {
      // Always show blue check for overflow courses
      if (colorStatus === 'overflow') {
        return <Check className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-500'}`} />;
      }
      
      switch (colorStatus) {
        case 'primary':
          return <Check className={`w-5 h-5 ${darkMode ? 'text-green-400' : 'text-green-500'}`} />;
        case 'secondary':
          return <AlertTriangle className={`w-5 h-5 ${darkMode ? 'text-yellow-400' : 'text-yellow-500'}`} />;
        default:
          return <Check className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />;
      }
    }
    return null;
  };

  const getActionText = () => {
    if (isCompleted) {
      // Always show overflow text for overflow courses
      if (colorStatus === 'overflow') {
        return "Exceeds requirements";
      }
      
      switch (colorStatus) {
        case 'primary':
          return "Click to remove from requirements";
        case 'secondary':
          return "Used in another requirement group";
        default:
          return "Click to remove";
      }
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
            </h4>
            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} mt-1 line-clamp-2`}>
              {course.name?.split(':')[1]?.trim() || course.name || 'No title available'}
            </p>
          </div>
          {displayOptions.showDistributives && course.distribs && (
            <span className={`text-xs ${
              darkMode ? 'bg-indigo-900 text-indigo-300' : 'bg-indigo-100 text-indigo-800'
            } px-2 py-1 rounded flex-shrink-0`}>
              {course.distribs}
            </span>
          )}
        </div>
        
        <div className="mt-auto">
          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {renderTerms()}
          </div>
          
          <div className={`mt-2 text-xs ${
            colorStatus === 'overflow' ? (darkMode ? 'text-blue-400' : 'text-blue-600') :
            colorStatus === 'primary' ? (darkMode ? 'text-green-400' : 'text-green-600') :
            colorStatus === 'secondary' ? (darkMode ? 'text-yellow-400' : 'text-yellow-600') :
            (darkMode ? 'text-gray-400' : 'text-gray-600')
          }`}>
            {getActionText()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;