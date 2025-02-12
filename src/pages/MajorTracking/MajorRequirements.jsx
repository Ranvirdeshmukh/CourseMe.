import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { doc, getFirestore, collection, getDocs, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import CourseDisplayPillar from './CourseDisplayPillar';
import CourseDisplayCarousel from './CourseDisplayCarousel';
import CourseCard from './CourseCard';
import { RequirementProcessor } from './RequirementProcessor'; 

const MajorRequirements = ({
  selectedMajor,
  majorRequirements,
  completedCourses = [],
  onCoursesUpdate ,
  darkMode

}) => {
  const [localCompletedCourses, setLocalCompletedCourses] = useState(completedCourses);
  const [processedRequirements, setProcessedRequirements] = useState(null);
  const [courses, setCourses] = useState({});
  const db = getFirestore();
  const auth = getAuth();

  // Add the handler functions
  const handleCourseClick = async (course) => {
    if (!auth.currentUser) return;
    await handleCourseStatusChange(course, []);
  };
  
  useEffect(() => {
    const fetchCourses = async () => {
      const coursesRef = collection(db, 'courses');
      const snapshot = await getDocs(coursesRef);
      const courseData = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        courseData[`${data.department}${data.course_number}`] = data;
      });
      setCourses(courseData);
    };
  
    fetchCourses();
  }, [db]);

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


const overflowCourses = useMemo(() => {
  if (!selectedMajor || !majorRequirements?.[selectedMajor]) return [];
  
  const requirements = majorRequirements[selectedMajor];
  const allocatedCourses = new Set();

  // Track which courses are needed for each pillar
  requirements.pillars.forEach(pillar => {
    // Get completion info for this pillar
    const completion = calculatePillarCompletion(pillar, localCompletedCourses);
    const pillarCourses = getPillarCourses(pillar);
    
    // Get valid courses for this pillar that aren't already allocated
    const validCourses = localCompletedCourses
      .filter(courseId => {
        // For range pillars, check if course is in range
        if (pillar.type === 'range') {
          const match = courseId.match(/([A-Z]+)(\d+)/);
          if (!match) return false;
          const [, dept, numStr] = match;
          const num = parseInt(numStr);
          return dept === pillar.department && 
                 num >= pillar.start && 
                 num <= pillar.end;
        }
        // For other pillar types, check if course is in pillar's course list
        return pillarCourses.includes(courseId);
      })
      .filter(courseId => !allocatedCourses.has(courseId));

    // Allocate only the required number of courses
    validCourses.slice(0, completion.required).forEach(courseId => {
      allocatedCourses.add(courseId);
    });
  });

  // Any completed courses not allocated are overflow
  return localCompletedCourses.filter(courseId => !allocatedCourses.has(courseId));
}, [selectedMajor, majorRequirements, localCompletedCourses, calculatePillarCompletion, getPillarCourses]);

// Add a debug log to check overflow courses
useEffect(() => {
  console.log('Overflow courses:', overflowCourses);
}, [overflowCourses]);


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
      {overflowCourses.length > 0 && (
        <div className="mb-6">
          <CourseDisplayCarousel
            title="Additional Courses"
            subtitle={`${overflowCourses.length} course${overflowCourses.length !== 1 ? 's' : ''} exceeding requirements`}
          >
            {overflowCourses.map(courseId => {
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
                  darkMode={darkMode}  // ✅ Ensure darkMode is passed
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
          majorDept={requirements.department}
          completedCourses={localCompletedCourses}
          onCourseStatusChange={handleCourseStatusChange}
          allPillars={requirements.pillars}
          pillarIndex={index}
          duplicateCourses={duplicateCourses}
          darkMode={darkMode}  // ✅ Ensure darkMode is passed
        />
      ))}
  
      {processedRequirements && processedRequirements.results && (
        <div className={`rounded-lg shadow-md p-4 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
          <h3 className={`text-lg font-medium mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Major Progress Summary
          </h3>
          {requirements.pillars.map((pillar, index) => {
            const completion = calculatePillarCompletion(pillar, localCompletedCourses);
            return (
              <div key={index} className="mb-4">
                <div className="flex justify-between mb-1">
                  <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-800'}`}>
                    {pillar.description}
                  </span>
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {completion.completed}/{completion.required} completed
                  </span>
                </div>
                <div className={`w-full rounded-full h-2 ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                  <div
                    className="rounded-full h-2 transition-all duration-300"
                    style={{
                      background: darkMode ? '#38bdf8' : '#3B82F6', // Light blue for dark mode, normal blue for light mode
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