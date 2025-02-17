import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { doc, getFirestore, collection, getDocs, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import CourseDisplayPillar from './CourseDisplayPillar';
import CourseDisplayCarousel from './CourseDisplayCarousel';
import CourseCard from './CourseCard';
import RequirementManager from './RequirementManager';

const MajorRequirements = ({
  selectedMajor,
  majorRequirements,
  completedCourses = [],
  onCoursesUpdate,
  darkMode
}) => {
  const [localCompletedCourses, setLocalCompletedCourses] = useState(completedCourses);
  const [courses, setCourses] = useState({});
  const [requirementManager, setRequirementManager] = useState(null);
  const [requirementStatus, setRequirementStatus] = useState(null);
  const db = getFirestore();
  const auth = getAuth();

  // Initialize requirement manager when major changes
  useEffect(() => {
    if (!selectedMajor || !majorRequirements?.[selectedMajor]) return;
    
    const manager = new RequirementManager(majorRequirements[selectedMajor]);
    setRequirementManager(manager);
    
    // Process existing completed courses
    if (completedCourses.length > 0) {
      const status = manager.processCourseList(completedCourses);
      setRequirementStatus(status);
    }
  }, [selectedMajor, majorRequirements, completedCourses]);

  // Update local state when props change
  useEffect(() => {
    setLocalCompletedCourses(completedCourses);
  }, [completedCourses]);

  // Fetch course data
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const coursesRef = collection(db, 'courses');
        const snapshot = await getDocs(coursesRef);
        const courseData = {};
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          const courseId = `${data.department}${data.course_number}`;
          courseData[courseId] = data;
        });
        setCourses(courseData);
      } catch (error) {
        console.error('Error fetching courses:', error);
      }
    };

    fetchCourses();
  }, [db]);

  const handleCourseStatusChange = async (course, affectedPillars) => {
    if (!auth.currentUser || !requirementManager) return;

    try {
      const courseId = `${course.department}${course.course_number}`;
      let updatedCourses;

      if (localCompletedCourses.includes(courseId)) {
        // Remove course
        updatedCourses = localCompletedCourses.filter(id => id !== courseId);
      } else {
        // Add course
        updatedCourses = [...localCompletedCourses, courseId];
      }

      // Update local state immediately
      setLocalCompletedCourses(updatedCourses);

      // Reallocate all courses with the RequirementManager
      const newStatus = requirementManager.processCourseList(updatedCourses);
      setRequirementStatus(newStatus);

      // Update Firebase
      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        completedCourses: updatedCourses
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

  // Calculate PillarSummary stats
  const calculatePillarCompletion = useCallback((pillar, pillarCourses = []) => {
    // For prerequisites, count number of groups that need to be completed
    if (pillar.type === 'prerequisites') {
      return {
        completed: pillarCourses.length,
        required: pillar.courses.length // Each prerequisite group counts as one requirement
      };
    }
    
    // For other pillar types, use the count field
    return {
      completed: Math.min(pillarCourses.length, pillar.count),
      required: pillar.count
    };
  }, []);

  if (!selectedMajor || !majorRequirements?.[selectedMajor]) {
    return (
      <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        Please select a major to view requirements
      </div>
    );
  }

  const requirements = majorRequirements[selectedMajor];
  if (!requirements?.pillars) {
    return (
      <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        No requirements found for this major
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overflow Courses Display */}
      {requirementStatus?.overflowCourses?.length > 0 && (
        <div className="mb-6">
          <CourseDisplayCarousel
            title="Additional Courses"
            subtitle={`${requirementStatus.overflowCourses.length} course${
              requirementStatus.overflowCourses.length !== 1 ? 's' : ''
            } exceeding requirements`}
            darkMode={darkMode}
          >
            {requirementStatus.overflowCourses.map(courseId => {
              const course = courses[courseId];
              if (!course) return null;

              return (
                <CourseCard
                  key={courseId}
                  course={course}
                  status={{
                    isCompleted: true,
                    isUsedInOtherPillar: false,
                    isLocked: false,
                    colorStatus: 'overflow'
                  }}
                  onClick={handleCourseStatusChange}
                  darkMode={darkMode}
                />
              );
            })}
          </CourseDisplayCarousel>
        </div>
      )}

      {/* Main Requirements Display */}
      {requirements.pillars.map((pillar, index) => (
        <CourseDisplayPillar
          key={`${selectedMajor}-${index}`}
          pillar={pillar}
          pillarIndex={index}
          majorDept={requirements.department}
          requirementManager={requirementManager}
          requirementStatus={requirementStatus}
          onCourseStatusChange={handleCourseStatusChange}
          darkMode={darkMode}
        />
      ))}

      {/* Progress Summary */}
      {requirementStatus && (
        <div className={`rounded-lg shadow-md p-4 ${
          darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
        }`}>
          <h3 className={`text-lg font-medium mb-4 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Major Progress Summary
          </h3>
          {requirements.pillars.map((pillar, index) => {
            const pillarCourses = requirementStatus.pillarFills[index] || [];
            const completion = calculatePillarCompletion(pillar, pillarCourses);
            
            return (
              <div key={index} className="mb-4">
                <div className="flex justify-between mb-1">
                  <span className={`text-sm font-medium ${
                    darkMode ? 'text-gray-300' : 'text-gray-800'
                  }`}>
                    {pillar.description || `${pillar.type} Requirements`}
                  </span>
                  <span className={`text-sm ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {completion.completed}/{completion.required} completed
                  </span>
                </div>
                <div className={`w-full rounded-full h-2 ${
                  darkMode ? 'bg-gray-600' : 'bg-gray-200'
                }`}>
                  <div
                    className="rounded-full h-2 transition-all duration-300"
                    style={{
                      background: darkMode ? '#38bdf8' : '#3B82F6',
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