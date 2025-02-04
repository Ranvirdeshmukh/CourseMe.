// MajorRequirements.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { doc, getFirestore, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import CourseDisplayPillar from './CourseDisplayPillar';
import { RequirementProcessor } from './RequirementProcessor';

const MajorRequirements = ({
  selectedMajor,
  majorRequirements,
  completedCourses = [],
  onCoursesUpdate
}) => {
  const [localCompletedCourses, setLocalCompletedCourses] = useState(completedCourses);
  const [processedRequirements, setProcessedRequirements] = useState(null);
  const db = getFirestore();
  const auth = getAuth();


  const normalizeCourseId = (courseId) => {
    if (!courseId) return null;
    const match = courseId.match(/^([A-Z]+)(\d+)$/);
    if (!match) return courseId;
    const [, dept, num] = match;
    return `${dept}${num.padStart(3, '0')}`;
  };

  // Update local state when props change
  useEffect(() => {
    setLocalCompletedCourses(completedCourses);
  }, [completedCourses]);

  // Process requirements for summary display
  useEffect(() => {
    if (!selectedMajor || !majorRequirements?.[selectedMajor]) return;

    const processor = new RequirementProcessor(
      majorRequirements[selectedMajor],
      localCompletedCourses
    );

    const evaluated = processor.evaluateRequirements();
    setProcessedRequirements(evaluated);
  }, [selectedMajor, majorRequirements, localCompletedCourses]);

  const getPillarCourses = (pillar) => {
    switch (pillar.type) {
      case 'prerequisites':
        return pillar.courses.flatMap(course => {
          if (typeof course === 'string') return [normalizeCourseId(course)];
          if (course.type === 'alternative') {
            return course.options.map(opt => normalizeCourseId(opt));
          }
          return [];
        });
      
      case 'range':
        const courses = [];
        for (let i = pillar.start; i <= pillar.end; i++) {
          courses.push(`${pillar.department}${i.toString().padStart(3, '0')}`);
        }
        return courses;
      
      case 'specific':
        return pillar.options.map(courseId => normalizeCourseId(courseId));
      
      default:
        return [];
    }
  };

  // Calculate duplicate courses map
  const duplicateCourses = useMemo(() => {
    if (!selectedMajor || !majorRequirements?.[selectedMajor]) return new Map();
  
    const courseMap = new Map();
    const requirements = majorRequirements[selectedMajor];
  
    requirements.pillars.forEach((pillar, pillarIndex) => {
      const pillarCourses = getPillarCourses(pillar);
      
      pillarCourses.forEach(courseId => {
        if (!courseMap.has(courseId)) {
          courseMap.set(courseId, []);
        }
        courseMap.get(courseId).push(pillarIndex);
      });
    });
  
    // Only keep courses that appear in multiple pillars
    return new Map([...courseMap].filter(([_, pillars]) => pillars.length > 1));
  }, [selectedMajor, majorRequirements]);

  // Calculate pillar completion status
  const calculatePillarCompletion = useCallback((pillar, completedCourseIds) => {
    switch (pillar.type) {
      case 'prerequisites':
        const requiredCourses = pillar.courses.length;
        const completedPrereqs = pillar.courses.filter(course => {
          if (typeof course === 'string') {
            return completedCourseIds.includes(normalizeCourseId(course));
          }
          if (course.type === 'alternative') {
            return course.options.some(opt => 
              completedCourseIds.includes(normalizeCourseId(opt))
            );
          }
          return false;
        }).length;
        return { completed: completedPrereqs, required: requiredCourses };

      case 'specific':
        const hasCompleted = pillar.options.some(courseId =>
          completedCourseIds.includes(normalizeCourseId(courseId))
        );
        return { completed: hasCompleted ? 1 : 0, required: 1 };

      case 'range':
        const inRangeCourses = completedCourseIds.filter(courseId => {
          const match = courseId.match(/([A-Z]+)(\d+)/);
          if (!match) return false;
          const [, dept, numStr] = match;
          const num = parseInt(numStr);
          return dept === pillar.department && num >= pillar.start && num <= pillar.end;
        }).length;
        return { completed: Math.min(inRangeCourses, pillar.count), required: pillar.count };

      default:
        return { completed: 0, required: 0 };
    }
  }, []);

  const handleCourseStatusChange = async (course, affectedPillars) => {
    if (!auth.currentUser) return;

    try {
      const courseId = `${course.department}${course.course_number}`;
      const userRef = doc(db, 'users', auth.currentUser.uid);
      
      // Update local state immediately
      const updatedCourses = localCompletedCourses.includes(courseId)
        ? localCompletedCourses.filter(id => id !== courseId)
        : [...localCompletedCourses, courseId];
      
      setLocalCompletedCourses(updatedCourses);

      // Update only the changed course in Firebase
      await setDoc(userRef, {
        [`courses.${courseId}`]: {
          completed: updatedCourses.includes(courseId),
          lastUpdated: new Date().toISOString()
        }
      }, { merge: true });

      // Notify parent component
      if (onCoursesUpdate) {
        onCoursesUpdate(updatedCourses);
      }
    } catch (error) {
      console.error('Error updating course status:', error);
      // Rollback on error
      setLocalCompletedCourses(completedCourses);
    }
  };

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
      {requirements.pillars.map((pillar, index) => (
        <CourseDisplayPillar
          key={`${selectedMajor}-${index}`}
          pillar={pillar}
          majorDept={requirements.department}
          completedCourses={localCompletedCourses}
          onCourseStatusChange={handleCourseStatusChange}
          allPillars={requirements.pillars}
          pillarIndex={index}
          duplicateCourses={duplicateCourses}
        />
      ))}
      
      {processedRequirements && processedRequirements.results && (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-medium mb-4">Major Progress Summary</h3>
          {requirements.pillars.map((pillar, index) => {
            const completion = calculatePillarCompletion(pillar, localCompletedCourses);
            return (
              <div key={index} className="mb-4">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">{pillar.description}</span>
                  <span className="text-sm text-gray-600">
                    {completion.completed}/{completion.required} completed
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${(completion.completed / completion.required) * 100}%`
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MajorRequirements;