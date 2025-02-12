// CourseDisplayPillar.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import CourseDisplayCarousel from './CourseDisplayCarousel';
import CourseCard from './CourseCard';

const CourseDisplayPillar = ({
  pillar,
  majorDept,
  completedCourses = [],
  onCourseStatusChange,
  allPillars = [],
  pillarIndex,
  duplicateCourses = new Map() // Map of courseId -> array of pillarIndices where it appears
}) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [localCompletedCourses, setLocalCompletedCourses] = useState(completedCourses);
  const [localCourseStatuses, setLocalCourseStatuses] = useState(new Map());
  
  const db = getFirestore();

  // Update local state when props change
  useEffect(() => {
    setLocalCompletedCourses(completedCourses);
  }, [completedCourses]);

  // Calculate course color based on completion and pillar allocation
  const calculateCourseColor = useCallback((courseId, isCompleted) => {
    if (!isCompleted) return 'none';
  
    // Get all pillars that could include this course
    const pillarsWithCourse = duplicateCourses.get(courseId);
    if (!pillarsWithCourse) return 'primary';
  
    // Get completed courses that could satisfy this pillar
    const coursesInPillar = courses.map(course => 
      `${course.department}${course.course_number}`
    ).filter(id => localCompletedCourses.includes(id));
  
    // For range pillars
    if (pillar.type === 'range') {
      // For COSC 30-49 pillar (which comes first)
      if (pillar.end === 49) {
        const pillarRequiredCount = pillar.count;
        const courseIndex = coursesInPillar.indexOf(courseId);
        
        // If not used in this pillar, it's overflow
        if (courseIndex >= pillarRequiredCount) {
          return 'overflow';
        }
        return 'primary';
      }
      
      // For COSC 30-89 pillar
      if (pillar.end === 89) {
        // Check if this course is already allocated to the 30-49 pillar
        const isAllocatedToEarlierPillar = coursesInPillar.indexOf(courseId) < 2;
        
        if (!isAllocatedToEarlierPillar) {
          // If not used in earlier pillar, show as primary
          return 'primary';
        }
        // If used in earlier pillar, mark as secondary
        return 'secondary';
      }
  
      // For other range pillars, if the course isn't counted in the requirement
      const pillarRequiredCount = pillar.count;
      const courseIndex = coursesInPillar.indexOf(courseId);
      if (courseIndex >= pillarRequiredCount) {
        return 'overflow';
      }
      return 'primary';
    }
  
    // Default to secondary color for other cases
    return 'secondary';
  }, [duplicateCourses, pillarIndex, courses, localCompletedCourses, pillar]);

  const getCachedCourses = useCallback(async () => {
    if (!pillar) return [];
    
    if (!window.courseCache) {
      window.courseCache = new Map();
    }
    
    const cacheKey = `${pillar.type}-${JSON.stringify({
      department: pillar.department,
      start: pillar.start,
      end: pillar.end,
      options: pillar.options,
      courses: pillar.courses
    })}`;
    
    if (window.courseCache.has(cacheKey)) {
      return window.courseCache.get(cacheKey);
    }
    
    const coursesRef = collection(db, 'courses');
    let q;

    try {
      switch (pillar.type) {
        case 'prerequisites':
          const courseIds = pillar.courses.flatMap(course => {
            if (typeof course === 'string') return [course];
            if (course.type === 'alternative') return course.options;
            return [];
          });
          q = query(coursesRef, where('course_id', 'in', courseIds));
          break;

        case 'range':
          q = query(
            coursesRef,
            where('department', '==', pillar.department),
            where('course_number', '>=', pillar.start.toString().padStart(3, '0')),
            where('course_number', '<=', pillar.end.toString().padStart(3, '0'))
          );
          break;

        case 'specific':
          q = query(coursesRef, where('course_id', 'in', pillar.options));
          break;

        default:
          return [];
      }

      const snapshot = await getDocs(q);
      const fetchedCourses = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      window.courseCache.set(cacheKey, fetchedCourses);
      return fetchedCourses;
    } catch (error) {
      console.error('Error fetching courses:', error);
      return [];
    }
  }, [pillar, db]);

  // Load initial courses and set up statuses
  useEffect(() => {
    const loadCourses = async () => {
      if (!pillar) return;
      
      setLoading(true);
      
      try {
        const fetchedCourses = await getCachedCourses();
        setCourses(fetchedCourses);
        
        // Pre-compute initial course statuses
        const newStatuses = new Map();
        fetchedCourses.forEach(course => {
          const courseId = `${course.department}${course.course_number}`;
          const isCompleted = localCompletedCourses.includes(courseId);
          newStatuses.set(courseId, {
            isCompleted,
            isUsedInOtherPillar: false,
            isLocked: false,
            colorStatus: calculateCourseColor(courseId, isCompleted)
          });
        });
        setLocalCourseStatuses(newStatuses);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadCourses();
  }, [getCachedCourses, pillar, calculateCourseColor, localCompletedCourses]);

  // Update course statuses when completion status changes
  useEffect(() => {
    setLocalCourseStatuses(prev => {
      const newStatuses = new Map(prev);
      courses.forEach(course => {
        const courseId = `${course.department}${course.course_number}`;
        const isCompleted = localCompletedCourses.includes(courseId);
        const currentStatus = newStatuses.get(courseId) || {};
        newStatuses.set(courseId, {
          ...currentStatus,
          isCompleted,
          colorStatus: calculateCourseColor(courseId, isCompleted)
        });
      });
      return newStatuses;
    });
  }, [localCompletedCourses, courses, calculateCourseColor]);

  const handleCourseClick = async (course) => {
    const courseId = `${course.department}${course.course_number}`;
    
    // Update local state immediately for instant feedback
    const isCompleted = localCompletedCourses.includes(courseId);
    const newCompletedCourses = isCompleted
      ? localCompletedCourses.filter(id => id !== courseId)
      : [...localCompletedCourses, courseId];
    
    setLocalCompletedCourses(newCompletedCourses);
    
    // Update this course's status
    setLocalCourseStatuses(prev => {
      const newStatuses = new Map(prev);
      newStatuses.set(courseId, {
        isCompleted: !isCompleted,
        isUsedInOtherPillar: false,
        isLocked: false,
        colorStatus: calculateCourseColor(courseId, !isCompleted)
      });
      return newStatuses;
    });

    // Get the list of pillars where this course appears
    const affectedPillars = duplicateCourses.get(courseId) || [pillarIndex];
    
    // Trigger parent update with affected pillars
    await onCourseStatusChange(course, affectedPillars);
  };

  // Calculate pillar completion for subtitle
  const getPillarCompletion = useCallback(() => {
    let required = 0;
    let completed = 0;

    switch (pillar.type) {
      case 'prerequisites':
        required = pillar.courses.length;
        completed = pillar.courses.filter(course => {
          if (typeof course === 'string') {
            return localCompletedCourses.includes(course);
          }
          if (course.type === 'alternative') {
            return course.options.some(opt => localCompletedCourses.includes(opt));
          }
          return false;
        }).length;
        break;

      case 'specific':
        required = 1;
        completed = pillar.options.some(course => 
          localCompletedCourses.includes(course)
        ) ? 1 : 0;
        break;

      case 'range':
        required = pillar.count;
        completed = localCompletedCourses.filter(courseId => {
          const match = courseId.match(/([A-Z]+)(\d+)/);
          if (!match) return false;
          const [, dept, numStr] = match;
          const num = parseInt(numStr);
          return dept === pillar.department && 
                 num >= pillar.start && 
                 num <= pillar.end;
        }).length;
        completed = Math.min(completed, required);
        break;
    }

    return { completed, required };
  }, [pillar, localCompletedCourses]);

  

  // Memoized content rendering
  const content = useMemo(() => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-red-600 py-4">
          Error loading courses: {error}
        </div>
      );
    }

    if (!courses.length) {
      return (
        <div className="text-gray-500 py-4">
          No courses available for this requirement
        </div>
      );
    }

    return courses.map(course => {
      const courseId = `${course.department}${course.course_number}`;
      const status = localCourseStatuses.get(courseId) || {
        isCompleted: localCompletedCourses.includes(courseId),
        isUsedInOtherPillar: false,
        isLocked: false,
        colorStatus: calculateCourseColor(courseId, localCompletedCourses.includes(courseId))
      };

      return (
        <CourseCard
          key={`${courseId}-${status.isCompleted}`}
          course={course}
          status={status}
          onClick={handleCourseClick}
        />
      );
    });
  }, [courses, loading, error, localCourseStatuses, localCompletedCourses, calculateCourseColor]);

  const completion = getPillarCompletion();

  return (
    <CourseDisplayCarousel
      title={pillar.description}
      subtitle={`${completion.completed}/${completion.required} completed`}
    >
      {content}
    </CourseDisplayCarousel>
  );
};

export default CourseDisplayPillar;