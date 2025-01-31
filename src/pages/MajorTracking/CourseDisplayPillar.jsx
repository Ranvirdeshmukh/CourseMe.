import React, { useState, useEffect } from 'react';
import CourseTiles from './CourseTiles';

const CourseDisplayPillar = ({ pillar, majorDept, selectedCourses = [] }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [completedCourses, setCompletedCourses] = useState([]);
  const [remainingRequirements, setRemainingRequirements] = useState(null);

  const checkCourseMatch = (course, requirement) => {
    const match = course.match(/([A-Z]+)(\d+)/);
    if (!match) return false;
    const [, courseDept, courseNum] = match;

    // Handle different requirement types
    if (typeof requirement === 'string') {
      const reqMatch = requirement.match(/([A-Z]+)(\d+)/);
      if (!reqMatch) return false;
      const [, reqDept, reqNum] = reqMatch;
      return courseDept === reqDept && parseInt(courseNum) === parseInt(reqNum);
    }

    if (requirement.type === 'alternative') {
      return requirement.options.some(opt => checkCourseMatch(course, opt));
    }

    return false;
  };

  const evaluatePillarProgress = () => {
    if (!pillar || !majorDept) return;

    let completed = [];
    let remaining = null;

    switch (pillar.type) {
      case 'prerequisites':
        completed = selectedCourses.filter(course =>
          pillar.courses.some(req => checkCourseMatch(course, req))
        );
        remaining = pillar.courses.filter(req => 
          !selectedCourses.some(course => checkCourseMatch(course, req))
        );
        break;

      case 'range':
        completed = selectedCourses.filter(course => {
          const match = course.match(/([A-Z]+)(\d+)/);
          if (!match) return false;
          const [, courseDept, courseNumStr] = match;
          const courseNum = parseInt(courseNumStr);
          return courseDept === pillar.department &&
                 courseNum >= pillar.start &&
                 courseNum <= pillar.end;
        });
        remaining = {
          count: Math.max(0, pillar.count - completed.length),
          range: `${pillar.start}-${pillar.end}`
        };
        break;

      case 'specific':
        completed = selectedCourses.filter(course =>
          pillar.options.some(opt => checkCourseMatch(course, opt))
        );
        remaining = completed.length === 0 ? pillar.options : null;
        break;
    }

    setCompletedCourses(completed);
    setRemainingRequirements(remaining);
  };

  useEffect(() => {
    evaluatePillarProgress();
  }, [selectedCourses, pillar, majorDept]);

  if (!pillar || !majorDept) {
    return null;
  }

  const renderRequirementStatus = () => {
    if (completedCourses.length > 0) {
      return (
        <span className="text-green-600 ml-2">
          Completed: {completedCourses.join(', ')}
        </span>
      );
    }

    switch (pillar.type) {
      case 'prerequisites':
        return remainingRequirements?.map((req, idx) => (
          <div key={idx} className="text-red-600">
            Need: {typeof req === 'string' ? req : req.options.join(' or ')}
          </div>
        ));

      case 'range':
        return remainingRequirements?.count > 0 ? (
          <div className="text-red-600">
            Need {remainingRequirements.count} more courses from {pillar.department} {remainingRequirements.range}
          </div>
        ) : null;

      case 'specific':
        return remainingRequirements ? (
          <div className="text-red-600">
            Need one of: {remainingRequirements.join(' or ')}
          </div>
        ) : null;

      default:
        return null;
    }
  };

  return (
    <div className="mb-4 border rounded-lg overflow-hidden">
      <div 
        className="p-4 bg-gray-50 flex justify-between items-center cursor-pointer hover:bg-gray-100"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div>
          <h4 className="font-medium">{pillar.description}</h4>
          {renderRequirementStatus()}
        </div>
        <span className="text-gray-500">
          {isExpanded ? '▼' : '▶'}
        </span>
      </div>

      {isExpanded && (
        <div className="p-4">
          <CourseTiles
            pillar={pillar}
            majorDept={majorDept}
            selectedCourses={selectedCourses}
          />
        </div>
      )}
    </div>
  );
};

export default CourseDisplayPillar;