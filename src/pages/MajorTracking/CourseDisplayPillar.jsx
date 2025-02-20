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
  darkMode,
  activeDistrib
}) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const db = getFirestore();

  // Filter courses by distribs
  const filterByDistrib = useCallback((courseList) => {
    if (!activeDistrib || !courseList) return courseList;
  
    return courseList.filter(course => {
      // Early return if course has no distribs or world culture
      if (!course.distribs && !course.world_culture) return false;
  
      // Special handling for LAB requirement
      if (activeDistrib === 'LAB') {
        return course.distribs && 
               (course.distribs.includes('SLA') || 
                course.distribs.includes('TLA'));
      }
  
      // Check distribs with normalized values
      if (course.distribs) {
        const distribs = course.distribs
          .split(/[/-]/)
          .map(d => d.trim())
          .map(d => {
            switch(d) {
              case 'SLA': return 'SCI';
              case 'TLA': return 'TAS';
              default: return d;
            }
          });
        if (distribs.includes(activeDistrib)) return true;
      }
  
      // Check world culture
      if (course.world_culture && 
          Array.isArray(course.world_culture) && 
          course.world_culture.includes(activeDistrib)) {
        return true;
      }
  
      return false;
    });
  }, [activeDistrib]);

  const parseOption = (option) => {
    if (option.startsWith('[') && option.endsWith(']')) {
      const rangeStr = option.slice(1, -1);
      const [start, end] = rangeStr.split('-');
      const startDept = start.match(/([A-Z]+)/)[1];
      const startNum = start.match(/(\d+)/)[1];
      const endDept = end.match(/([A-Z]+)/)[1];
      const endNum = end.match(/(\d+)/)[1];
      return {
        type: 'range',
        startDept,
        startNum: startNum.padStart(3, '0'),
        endDept,
        endNum: endNum.padStart(3, '0')
      };
    }
    
    if (option.includes('≥')) {
      const [dept, minNum] = option.split('≥');
      return {
        type: 'min',
        dept,
        minNum: minNum.padStart(3, '0')
      };
    }
    
    const match = option.match(/([A-Z]+)?(\d+)/);
    if (match) {
      const [, dept = pillar.department || majorDept, num] = match;
      return {
        type: 'direct',
        dept,
        num: num.padStart(3, '0')
      };
    }
    
    return null;
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
      const cachedCourses = window.courseCache.get(cacheKey);
      return filterByDistrib(cachedCourses);
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
            const parsedOption = parseOption(option);
            if (!parsedOption) continue;

            switch (parsedOption.type) {
              case 'range': {
                if (parsedOption.startDept === parsedOption.endDept) {
                  queries.push(
                    query(
                      coursesRef,
                      where('department', '==', parsedOption.startDept),
                      where('course_number', '>=', parsedOption.startNum),
                      where('course_number', '<=', parsedOption.endNum)
                    )
                  );
                }
                break;
              }
              case 'min': {
                queries.push(
                  query(
                    coursesRef,
                    where('department', '==', parsedOption.dept),
                    where('course_number', '>=', parsedOption.minNum)
                  )
                );
                break;
              }
              case 'direct': {
                queries.push(
                  query(
                    coursesRef,
                    where('department', '==', parsedOption.dept),
                    where('course_number', '==', parsedOption.num)
                  )
                );
                break;
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
      return filterByDistrib(uniqueCourses);

    } catch (error) {
      console.error('Error fetching courses for pillar:', error);
      throw error;
    }
  }, [pillar, majorDept, db, filterByDistrib]);

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
  }, [getCachedCourses, pillar, sortCoursesByStatus, activeDistrib]);

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
        const colorStatus = requirementManager?.getCourseStatus(courseId, pillarIndex) || 'none';

        return (
          <CourseCard
            key={courseId}
            course={course}
            status={{
              isCompleted: !!courseStatus,
              colorStatus: courseStatus ? colorStatus : 'none',
              isLocked: false
            }}
            onClick={() => handleCourseClick(course)}
            darkMode={darkMode}
          />
        );
      })}
    </CourseDisplayCarousel>
  );
};

export default CourseDisplayPillar;