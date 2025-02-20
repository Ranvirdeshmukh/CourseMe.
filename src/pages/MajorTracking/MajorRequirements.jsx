import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { doc, getFirestore, collection, getDocs, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import CourseDisplayPillar from './CourseDisplayPillar';
import CourseDisplayCarousel from './CourseDisplayCarousel';
import CourseCard from './CourseCard';
import RequirementManager from './RequirementManager';
import DistribsCarousel from './DistribsCarousel';

const MajorRequirements = ({
  selectedMajor,
  majorRequirements,
  completedCourses = [],
  onCoursesUpdate,
  darkMode
}) => {
  const db = getFirestore();
  const auth = getAuth();

  // State hooks at the top
  const [localCompletedCourses, setLocalCompletedCourses] = useState(completedCourses);
  const [courses, setCourses] = useState({});
  const [requirementManager, setRequirementManager] = useState(null);
  const [requirementStatus, setRequirementStatus] = useState(null);
  const [selectedDistrib, setSelectedDistrib] = useState(null);
  const [availableDistribs, setAvailableDistribs] = useState([]);

  // All callbacks defined before any conditional logic
  const handleDistribFilter = useCallback((distrib) => {
    setSelectedDistrib(distrib);
  }, []);

  const filterCoursesByDistrib = useCallback((courseList) => {
    if (!selectedDistrib) return courseList;
    return courseList.filter(course => {
      if (!course.distribs && !course.world_culture) return false;
      if (selectedDistrib === 'LAB') {
        return course.distribs && 
               (course.distribs.includes('SLA') || course.distribs.includes('TLA'));
      }
      if (course.distribs) {
        const distribs = course.distribs.split(/[/-]/).map(d => d.trim());
        const baseDistribs = distribs.map(d => d.replace('SLA', 'SCI').replace('TLA', 'TAS'));
        if (baseDistribs.includes(selectedDistrib)) return true;
      }
      if (course.world_culture && course.world_culture.includes(selectedDistrib)) {
        return true;
      }
      return false;
    });
  }, [selectedDistrib]);

  const calculatePillarCompletion = useCallback((pillar, pillarCourses = []) => {
    if (!pillar) return { completed: 0, required: 0 };
    if (pillar.type === 'prerequisites') {
      return {
        completed: pillarCourses.length,
        required: pillar.courses?.length || 0
      };
    }
    return {
      completed: Math.min(pillarCourses.length, pillar.count || 0),
      required: pillar.count || 0
    };
  }, []);

  const handleCourseStatusChange = useCallback(async (course, affectedPillars) => {
    if (!auth.currentUser || !requirementManager || !course) return;
    try {
      const courseId = `${course.department}${course.course_number}`;
      const updatedCourses = localCompletedCourses.includes(courseId)
        ? localCompletedCourses.filter(id => id !== courseId)
        : [...localCompletedCourses, courseId];

      setLocalCompletedCourses(updatedCourses);
      const newStatus = requirementManager.processCourseList(updatedCourses);
      setRequirementStatus(newStatus);

      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        completedCourses: updatedCourses
      }, { merge: true });

      if (onCoursesUpdate) {
        onCoursesUpdate(updatedCourses);
      }
    } catch (error) {
      console.error('Error updating course status:', error);
      setLocalCompletedCourses(completedCourses);
    }
  }, [auth.currentUser, requirementManager, localCompletedCourses, completedCourses, onCoursesUpdate, db]);

  // Effects
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

  useEffect(() => {
    if (!selectedMajor || !majorRequirements?.[selectedMajor]) return;
    const manager = new RequirementManager(majorRequirements[selectedMajor]);
    setRequirementManager(manager);
    if (completedCourses.length > 0) {
      const status = manager.processCourseList(completedCourses);
      setRequirementStatus(status);
    }
  }, [selectedMajor, majorRequirements, completedCourses]);

  useEffect(() => {
    setLocalCompletedCourses(completedCourses);
  }, [completedCourses]);

  // Always render the DistribsCarousel, regardless of major selection
  const carouselSection = (
    <DistribsCarousel
      selectedCourses={completedCourses}
      courseData={courses}
      darkMode={darkMode}
      onDistribFilter={handleDistribFilter}
      activeDistrib={selectedDistrib}
      availableDistribs={availableDistribs}
    />
  );

  const requirements = majorRequirements[selectedMajor];
  if (!requirements?.pillars) {
    return (
      <div className="space-y-6">
        {carouselSection}
        <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          No requirements found for this major
        </div>
      </div>
    );
  }

  // Full render with all components
  return (
    <div className="space-y-6">
      {carouselSection}
      
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