import React, { useState, useEffect } from 'react';
import CourseDisplayCarousel from './CourseDisplayCarousel';
import CourseBucket from './CourseBucket';
import { evaluateRequirements, getRangeSize } from './CourseAllocation';
import CourseTiles from './CourseTiles';

const MajorRequirements = ({
  selectedMajor,
  majorRequirements,
  completedCourses = [],
  onCourseComplete,
  courseData = {}
}) => {
  const [bucketCourses, setBucketCourses] = useState([]);
  const [requirementStatuses, setRequirementStatuses] = useState([]);

  useEffect(() => {
    if (!selectedMajor || !majorRequirements?.[selectedMajor]) {
      setBucketCourses([]);
      setRequirementStatuses([]);
      return;
    }

    const requirements = majorRequirements[selectedMajor];
    if (!requirements?.pillars) return;

    const { 
      allocatedCourses, 
      unallocatedCourses = [], 
      pillarCompletions = [] 
    } = evaluateRequirements(completedCourses, requirements.pillars);

    setBucketCourses(unallocatedCourses);
    setRequirementStatuses(pillarCompletions);
  }, [selectedMajor, majorRequirements, completedCourses]);

  if (!selectedMajor || !majorRequirements?.[selectedMajor]) {
    return (
      <div className="text-center py-8 text-gray-500">
        Please select a major to view requirements
      </div>
    );
  }

  const requirements = majorRequirements[selectedMajor];
  if (!requirements?.pillars) {
    return (
      <div className="text-center py-8 text-gray-500">
        No requirements found for this major
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bucket courses displayed at the top */}
      {bucketCourses?.length > 0 && (
        <CourseBucket
          courses={bucketCourses}
          onCourseComplete={onCourseComplete}
          courseData={courseData}
        />
      )}

      {/* Major requirements in carousel format */}
      {requirements.pillars.map((pillar, index) => {
  const status = requirementStatuses[index] || {
    isComplete: false,
    matchingCourses: []
  };
  
  return (
    <CourseDisplayCarousel
      key={`${selectedMajor}-${index}`}
      pillar={pillar}
      title={pillar.description}
      isComplete={status.isComplete}
      matchingCourses={status.matchingCourses}
    >
      <CourseTiles
        pillar={pillar}
        majorDept={requirements.department}
        selectedCourses={completedCourses}
        onCourseComplete={onCourseComplete}
        isPillarComplete={status.isComplete}
        pillarIndex={index}
        allPillars={requirements.pillars}
        matchingCourses={status.matchingCourses}
      />
    </CourseDisplayCarousel>
  );
})}
    </div>
  );
};

export default MajorRequirements;