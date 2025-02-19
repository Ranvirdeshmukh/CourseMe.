import React, { useState, useEffect, useCallback } from 'react';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import CourseDisplayCarousel from './CourseDisplayCarousel';
import CourseCard from './CourseCard';

const CourseDisplayPillar = ({
  pillar,
  pillarIndex,
  majorDept,
  requirementManager,
  requirementStatus,
  onCourseStatusChange,
  darkMode
}) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const db = getFirestore();

  const parseComplexRequirement = (reqStr) => {
    // First, split into main requirements and department limits
    const [mainReq, deptLimit] = reqStr.split(':').map(part => part?.trim());
    
    const parts = mainReq.match(/[{]([^}]+)[}]]/);
    if (!parts) return null;

    const conditions = parts[1].split(',').map(cond => cond.trim());
    const result = {
      departments: new Set(),
      minNumbers: new Map(),
      excludedCourses: new Set(),
      departmentLimits: new Map()
    };

    // Parse main requirements
    conditions.forEach(cond => {
      if (cond.includes('≥')) {
        const [dept, num] = cond.split('≥');
        result.departments.add(dept);
        result.minNumbers.set(dept, parseInt(num));
      } else if (cond.startsWith('!')) {
        result.excludedCourses.add(cond.slice(1));
      }
    });

    // Parse department limits if they exist
    if (deptLimit) {
      const limitMatch = deptLimit.match(/#(\d+)\[([A-Z]+)\]/);
      if (limitMatch) {
        const [, limit, dept] = limitMatch;
        result.departmentLimits.set(dept, parseInt(limit));
      }
    }

    return result;
  };

  const sortCoursesByStatus = useCallback((coursesToSort) => {
    const getStatusPriority = (courseId) => {
      const status = requirementManager?.getCourseStatus(courseId, pillarIndex);
      switch (status) {
        case 'primary': return 0;
        case 'secondary': return 1;
        case 'overflow': return 2;
        default: return 3;
      }
    };
  
    return [...coursesToSort].sort((a, b) => {
      const courseIdA = `${a.department}${a.course_number}`;
      const courseIdB = `${b.department}${b.course_number}`;
      const priorityA = getStatusPriority(courseIdA);
      const priorityB = getStatusPriority(courseIdB);
      
      if (priorityA !== priorityB) return priorityA - priorityB;
      
      // Secondary sort by department and course number
      if (a.department !== b.department) return a.department.localeCompare(b.department);
      return a.course_number.localeCompare(b.course_number);
    });
  }, [requirementManager, pillarIndex]);

  

  const getCachedCourses = useCallback(async () => {
    if (!pillar) return [];
    
    console.log('Fetching courses for pillar:', pillar);
    
    if (!window.courseCache) {
      window.courseCache = new Map();
    }
    
    const cacheKey = `${pillar.type}-${JSON.stringify({
      department: pillar.department || majorDept,
      start: pillar.start,
      end: pillar.end,
      options: pillar.options,
      courses: pillar.courses
    })}`;
    
    if (window.courseCache.has(cacheKey)) {
      return window.courseCache.get(cacheKey);
    }

    const coursesRef = collection(db, 'courses');
    let fetchedCourses = [];

    try {
      switch (pillar.type) {
        case 'prerequisites': {
          for (const prereq of pillar.courses) {
            if (typeof prereq === 'string') {
              const match = prereq.match(/([A-Z]+)(\d+)/);
              if (match) {
                const [, dept, num] = match;
                const courseQuery = query(
                  coursesRef,
                  where('department', '==', dept),
                  where('course_number', '==', num.padStart(3, '0'))
                );
                const snapshot = await getDocs(courseQuery);
                fetchedCourses.push(...snapshot.docs.map(doc => ({
                  id: doc.id,
                  ...doc.data()
                })));
              }
            } else if (prereq.type === 'alternative') {
              for (const option of prereq.options) {
                const match = option.match(/([A-Z]+)(\d+)/);
                if (match) {
                  const [, dept, num] = match;
                  const courseQuery = query(
                    coursesRef,
                    where('department', '==', dept),
                    where('course_number', '==', num.padStart(3, '0'))
                  );
                  const snapshot = await getDocs(courseQuery);
                  fetchedCourses.push(...snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                  })));
                }
              }
            }
          }
          break;
        }

        case 'specific': {
          const queries = [];
          
          for (const option of pillar.options) {
            if (option.startsWith('[') && option.endsWith(']')) {
              const [start, end] = option.slice(1, -1).split('-')
                .map(num => num.padStart(3, '0'));
              queries.push(
                query(
                  coursesRef,
                  where('department', '==', pillar.department || majorDept),
                  where('course_number', '>=', start),
                  where('course_number', '<=', end)
                )
              );
            } else if (option.includes('≥')) {
              const [dept, minNum] = option.split('≥');
              queries.push(
                query(
                  coursesRef,
                  where('department', '==', dept),
                  where('course_number', '>=', minNum.padStart(3, '0'))
                )
              );
            } else {
              const courseMatch = option.match(/([A-Z]+)?(\d+)/);
              if (courseMatch) {
                const dept = courseMatch[1] || pillar.department || majorDept;
                const num = courseMatch[2].padStart(3, '0');
                queries.push(
                  query(
                    coursesRef,
                    where('department', '==', dept),
                    where('course_number', '==', num)
                  )
                );
              }
            }
          }

          const results = await Promise.all(queries.map(q => getDocs(q)));
          fetchedCourses = results.flatMap(snapshot =>
            snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }))
          );
          break;
        }

        case 'complex': {
          const requirements = pillar.options.map(opt => parseComplexRequirement(opt))
            .filter(Boolean);
          
          for (const req of requirements) {
            // Fetch courses for each department with minimum number requirement
            const departmentQueries = Array.from(req.departments).map(async dept => {
              const minNum = req.minNumbers.get(dept);
              const courseQuery = query(
                coursesRef,
                where('department', '==', dept),
                where('course_number', '>=', minNum.toString().padStart(3, '0'))
              );
              
              const snapshot = await getDocs(courseQuery);
              return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              }));
            });

            const departmentResults = await Promise.all(departmentQueries);
            const allCourses = departmentResults.flat();

            // Filter out excluded courses
            const filteredCourses = allCourses.filter(course => {
              const courseId = `${course.department}${course.course_number}`;
              return !req.excludedCourses.has(courseId);
            });

            fetchedCourses.push(...filteredCourses);
          }
          break;
        }

        case 'range': {
          if (typeof pillar.start === 'number' && typeof pillar.end === 'number') {
            const dept = pillar.department || majorDept;
            const startNum = pillar.start.toString().padStart(3, '0');
            const endNum = pillar.end.toString().padStart(3, '0');
            
            const rangeQuery = query(
              coursesRef,
              where('department', '==', dept),
              where('course_number', '>=', startNum),
              where('course_number', '<=', endNum)
            );
            
            const snapshot = await getDocs(rangeQuery);
            fetchedCourses = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
          }
          break;
        }
      }

      // Remove duplicates while preserving course order
      const uniqueCourses = Array.from(
        new Map(
          fetchedCourses.map(course => [
            `${course.department}${course.course_number}`,
            course
          ])
        ).values()
      );

      window.courseCache.set(cacheKey, uniqueCourses);
      return uniqueCourses;

    } catch (error) {
      console.error('Error fetching courses for pillar:', error);
      throw error;
    }
  }, [pillar, majorDept, db]);

  useEffect(() => {
    const loadCourses = async () => {
      if (!pillar) return;
      
      setLoading(true);
      try {
        const fetchedCourses = await getCachedCourses();
        if (fetchedCourses.length > 0) {
          const sortedCourses = sortCoursesByStatus(fetchedCourses);
          setCourses(sortedCourses);
        }
      } catch (err) {
        setError(err.message);
        console.error('Error loading courses:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadCourses();
  }, [getCachedCourses, pillar, sortCoursesByStatus]);

  useEffect(() => {
    if (courses.length > 0) {
      const sortedCourses = sortCoursesByStatus(courses);
      setCourses(sortedCourses);
    }
  }, [requirementStatus, sortCoursesByStatus]); 

  const handleCourseClick = useCallback((course) => {
    if (!requirementManager) return;
    
    const courseId = `${course.department}${course.course_number}`;
    const isCurrentlyCompleted = requirementStatus?.courseStatuses?.[courseId];
    onCourseStatusChange(course, !isCurrentlyCompleted);
  }, [requirementManager, requirementStatus, onCourseStatusChange]);

  const getPillarCompletion = useCallback(() => {
    if (!requirementStatus || !pillar) return { completed: 0, required: pillar.count || 0 };
    
    const pillarCourses = requirementStatus.pillarFills[pillarIndex] || [];
    return {
      completed: pillarCourses.length,
      required: pillar.count || (pillar.type === 'prerequisites' ? pillar.courses.length : 1)
    };
  }, [requirementStatus, pillar, pillarIndex]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className={`w-8 h-8 animate-spin ${
          darkMode ? 'text-blue-400' : 'text-blue-500'
        }`} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`py-4 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
        Error loading courses: {error}
      </div>
    );
  }

  const completion = getPillarCompletion();
  const pillarTitle = pillar.description || `${pillar.type} Requirements`;
  const subtitle = `${completion.completed}/${completion.required} completed`;

  return (
    <CourseDisplayCarousel
      title={pillarTitle}
      subtitle={subtitle}
      darkMode={darkMode}
    >
      {courses.map(course => {
        const courseId = `${course.department}${course.course_number}`;
        const courseStatus = requirementStatus?.courseStatuses?.[courseId];
        const colorStatus = requirementManager?.getCourseStatus(courseId, pillarIndex);

        return (
          <CourseCard
            key={courseId}
            course={course}
            status={{
              isCompleted: !!courseStatus,
              colorStatus: colorStatus || 'none',
              isLocked: false
            }}
            onClick={handleCourseClick}
            darkMode={darkMode}
          />
        );
      })}
    </CourseDisplayCarousel>
  );
};

export default CourseDisplayPillar;