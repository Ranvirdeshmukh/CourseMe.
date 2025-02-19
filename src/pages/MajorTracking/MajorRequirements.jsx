import React, { useState, useEffect, useCallback } from 'react';
import { doc, getFirestore, collection, getDocs, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import CourseDisplayPillar from './CourseDisplayPillar';
import CourseDisplayCarousel from './CourseDisplayCarousel';
import DistribsCarousel from './DistribsCarousel';
import CourseCard from './CourseCard';
import RequirementManager from './RequirementManager';

const MajorRequirements = ({
  selectedMajor,
  majorRequirements,
  completedCourses = [],
  onCoursesUpdate,
  darkMode
}) => {
  const db = getFirestore();
  const auth = getAuth();
  
  const [localCompletedCourses, setLocalCompletedCourses] = useState(completedCourses);
  const [courses, setCourses] = useState({});
  const [requirementManager, setRequirementManager] = useState(null);
  const [requirementStatus, setRequirementStatus] = useState(null);
  const [selectedDistrib, setSelectedDistrib] = useState(null);
  const [availableDistribs, setAvailableDistribs] = useState([]);

  const requirements = majorRequirements?.[selectedMajor];

  // Helper function to check if a course matches any pillar
  const courseMatchesPillar = useCallback((course) => {
    if (!requirements?.pillars || !requirementManager) return false;
    
    const courseId = `${course.department}${course.course_number}`;
    return requirements.pillars.some(pillar => 
      requirementManager.courseMatchesPillar(courseId, pillar)
    );
  }, [requirements, requirementManager]);

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

  // Calculate available distribs from pillar courses
  useEffect(() => {
    if (!courses || !requirements?.pillars) return;

    const distribSet = new Set();
    Object.values(courses).forEach(course => {
      if (courseMatchesPillar(course)) {
        if (course.distribs) {
          const distribs = course.distribs.split(/[/-]/).map(d => d.trim());
          distribs.forEach(distrib => {
            const baseDistrib = distrib.replace('SLA', 'SCI').replace('TLA', 'TAS');
            distribSet.add(baseDistrib);
          });
        }
        if (course.world_culture) {
          course.world_culture.forEach(culture => {
            distribSet.add(culture);
          });
        }
      }
    });

    setAvailableDistribs(Array.from(distribSet));
  }, [courses, requirements, courseMatchesPillar]);

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

  const handleDistribFilter = useCallback((distrib) => {
    setSelectedDistrib(distrib);
  }, []);

  const handleCourseStatusChange = async (course, affectedPillars) => {
    if (!auth.currentUser || !requirementManager) return;

    try {
      const courseId = `${course.department}${course.course_number}`;
      let updatedCourses;

      if (localCompletedCourses.includes(courseId)) {
        updatedCourses = localCompletedCourses.filter(id => id !== courseId);
      } else {
        updatedCourses = [...localCompletedCourses, courseId];
      }

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
  };

  // Filter courses based on selected distrib
  const filterCoursesByDistrib = useCallback((courses) => {
    if (!selectedDistrib) return courses;

    return courses.filter(course => {
      if (!course.distribs && !course.world_culture) return false;

      if (selectedDistrib === 'LAB') {
        return course.distribs && 
               (course.distribs.includes('SLA') || course.distribs.includes('TLA'));
      }

      // Check distribs
      if (course.distribs) {
        const distribs = course.distribs.split(/[/-]/).map(d => d.trim());
        const baseDistribs = distribs.map(d => d.replace('SLA', 'SCI').replace('TLA', 'TAS'));
        if (baseDistribs.includes(selectedDistrib)) return true;
      }

      // Check world culture
      if (course.world_culture && course.world_culture.includes(selectedDistrib)) {
        return true;
      }

      return false;
    });
  }, [selectedDistrib]);

  if (!selectedMajor || !majorRequirements?.[selectedMajor]) {
    return (
      <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        Please select a major to view requirements
      </div>
    );
  }

  if (!requirements?.pillars) {
    return (
      <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        No requirements found for this major
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DistribsCarousel
        selectedCourses={completedCourses}
        courseData={courses}
        darkMode={darkMode}
        onDistribFilter={handleDistribFilter}
        activeDistrib={selectedDistrib}
        availableDistribs={availableDistribs}
      />

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
          filterCourses={filterCoursesByDistrib}
        />
      ))}
    </div>
  );
};

export default MajorRequirements;