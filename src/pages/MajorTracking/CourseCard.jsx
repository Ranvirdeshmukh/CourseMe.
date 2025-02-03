import React from 'react';
import { Check, AlertTriangle } from 'lucide-react';

const CourseCard = ({ 
  course, 
  isCompleted,
  isPillarComplete,
  isUsedInOtherPillar,
  onCourseClick,
  pillarName,
  usedInPillar,
  isUsedInMoreSpecificRange
}) => {
  const courseId = `${course.department}${course.course_number}`;

  const renderTerms = () => {
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

  const getCardStyles = () => {
    let styles = 'relative rounded-xl shadow p-4 transition-all duration-200 cursor-pointer hover:shadow-lg h-40 w-full ';
    
    if (isCompleted && !isUsedInOtherPillar) {
      styles += 'ring-2 ring-green-500 bg-green-50 hover:bg-green-100 ';
    } else if (isUsedInMoreSpecificRange) {
      styles += 'ring-2 ring-gray-400 bg-gray-100 hover:bg-gray-200 text-gray-500 ';
    } else if (!isPillarComplete) {
      styles += 'bg-white hover:bg-gray-50 ';
    } else {
      styles += 'bg-gray-100 hover:bg-gray-200 ';
    }
    
    return styles.trim();
  };
  
  const getActionText = () => {
    if (isUsedInMoreSpecificRange) {
      return "This course is being used in a more specific requirement";
    }
    if (isUsedInOtherPillar) {
      return "Click to move to this requirement";
    }
    if (isCompleted) {
      return "Click to remove";
    }
    return "";
  };

  return (
    <div 
      className={getCardStyles()}
      onClick={() => onCourseClick(course)}
      role="button"
      tabIndex={0}
    >
      <div className="absolute top-2 right-2 flex items-center space-x-2">
        {isCompleted && !isUsedInMoreSpecificRange && 
          <Check className="w-5 h-5 text-green-500" />
        }
        {isUsedInMoreSpecificRange && 
          <AlertTriangle className="w-5 h-5 text-gray-400" />
        }
      </div>
      
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-start">
          <div className="overflow-hidden">
            <h4 className="font-semibold text-lg flex items-center gap-2">
              {courseId}
              <span className="text-xs font-normal truncate">
                {isUsedInMoreSpecificRange && usedInPillar && 
                  <span className="text-gray-600">Used in {usedInPillar}</span>
                }
              </span>
            </h4>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {course.name?.split(':')[1]?.trim() || 'No title available'}
            </p>
          </div>
          <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded flex-shrink-0">
            {course.distribs || 'No distrib'}
          </span>
        </div>
        
        <div className="mt-auto">
          <div className="text-sm text-gray-500">
            {renderTerms()}
          </div>
          
          {getActionText() && (
            <div className={`mt-2 text-xs ${
              isUsedInMoreSpecificRange ? 'text-gray-600' :
              isUsedInOtherPillar ? 'text-red-600' :
              'text-green-600'
            }`}>
              {getActionText()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseCard;