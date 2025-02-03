import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import CourseTiles from './CourseTiles';
import { evaluateRequirements } from './CourseAllocation';
import CourseDisplayCarousel from './CourseDisplayCarousel';

const CourseDisplayPillar = ({ 
  pillar, 
  majorDept, 
  selectedCourses = [], 
  onCourseComplete,
  allPillars = [],
  pillarIndex = 0
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [requirementStatus, setRequirementStatus] = useState({
    isComplete: false,
    matchingCourses: [],
    neededCount: 0
  });

  // Evaluate requirements whenever selected courses change
  useEffect(() => {
    const { pillarCompletions, allocatedCourses } = evaluateRequirements(selectedCourses, allPillars);
    const status = pillarCompletions[pillarIndex] || {
      isComplete: false,
      matchingCourses: [],
      neededCount: 0
    };
    setRequirementStatus(status);
  }, [selectedCourses, allPillars, pillarIndex]);

  const renderRequirementStatus = () => {
    const { isComplete, matchingCourses, neededCount } = requirementStatus;

    if (isComplete) {
      return (
        <div className="flex items-center text-green-600 ml-2">
          <span>Completed using: {matchingCourses.join(', ')}</span>
        </div>
      );
    }

    switch (pillar.type) {
      case 'prerequisites':
        return (
          <div className="text-red-600 ml-2">
            Need: {pillar.courses.map(course => 
              typeof course === 'string' ? course : course.options.join(' or ')
            ).filter(course => !matchingCourses.includes(course)).join(', ')}
          </div>
        );

      case 'range':
        const remaining = neededCount - matchingCourses.length;
        return remaining > 0 ? (
          <div className="text-red-600 ml-2">
            Need {remaining} more {pillar.department} {pillar.start}-{pillar.end}
          </div>
        ) : null;

      case 'specific':
        return !isComplete ? (
          <div className="text-red-600 ml-2">
            Need one of: {pillar.options.join(', ')}
          </div>
        ) : null;

      default:
        return null;
    }
  };

  return (
    <div className={`mb-4 border rounded-lg overflow-hidden transition-all duration-300 
      ${requirementStatus.isComplete ? 'bg-green-50 border-green-200' : ''}`}
    >
      <div 
        className="p-4 bg-gray-50 flex justify-between items-center cursor-pointer hover:bg-gray-100"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center">
          {isExpanded ? 
            <ChevronDown className="w-5 h-5 mr-2" /> : 
            <ChevronRight className="w-5 h-5 mr-2" />
          }
          <div>
            <h4 className="font-medium">{pillar.description}</h4>
            {renderRequirementStatus()}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4">
<CourseDisplayCarousel
  pillar={pillar}
  title={pillar.description}
  isComplete={requirementStatus.isComplete}
  matchingCourses={requirementStatus.matchingCourses}
>
  <CourseTiles
    pillar={pillar}
    majorDept={majorDept}
    selectedCourses={selectedCourses}
    onCourseComplete={onCourseComplete}
    isPillarComplete={requirementStatus.isComplete}
    pillarIndex={pillarIndex}
    allPillars={allPillars}
    matchingCourses={requirementStatus.matchingCourses}
  />
</CourseDisplayCarousel>
        </div>
      )}
    </div>
  );
};

export default CourseDisplayPillar;