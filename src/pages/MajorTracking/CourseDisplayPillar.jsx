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
  activeDistrib,
  completedCourses,
  setRequirementStatus
}) => {
  // All state hooks at the top level
  const [selectedSequence, setSelectedSequence] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const db = getFirestore();

  // All callback hooks next
  const formatSequenceName = useCallback((sequence) => {
    if (!sequence) return '';
    const finalCourse = sequence.final;
    const prereqsStr = sequence.prereqs.map(prereq => {
      if (typeof prereq === 'string') return prereq;
      if (prereq.type === 'alternative') return `(${prereq.options.join(' or ')})`;
      return prereq;
    }).join(' and ');
    return `${finalCourse} with ${prereqsStr}`;
  }, []);

  const parseOption = useCallback((option) => {
    if (!option) return null;
    
    if (option.startsWith('[') && option.endsWith(']')) {
      const rangeStr = option.slice(1, -1);
      const [start, end] = rangeStr.split('-');
      const startDept = start.match(/([A-Z]+)/)?.[1];
      const startNum = start.match(/(\d+)/)?.[1];
      const endDept = end.match(/([A-Z]+)/)?.[1];
      const endNum = end.match(/(\d+)/)?.[1];
      if (!startDept || !startNum || !endDept || !endNum) return null;
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
      if (!dept || !minNum) return null;
      return {
        type: 'min',
        dept,
        minNum: minNum.padStart(3, '0')
      };
    }
    
    const match = option.match(/([A-Z]+)?(\d+)/);
    if (match) {
      const [, dept = pillar?.department || majorDept, num] = match;
      if (!dept || !num) return null;
      return {
        type: 'direct',
        dept,
        num: num.padStart(3, '0')
      };
    }
    
    return null;
  }, [pillar, majorDept]);

  const filterByDistrib = useCallback((courseList) => {
    if (!activeDistrib || !courseList) return courseList;
    return courseList.filter(course => {
      if (!course.distribs && !course.world_culture) return false;
      if (activeDistrib === 'LAB') {
        return course.distribs && 
               (course.distribs.includes('SLA') || 
                course.distribs.includes('TLA'));
      }
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
      if (course.world_culture && 
          Array.isArray(course.world_culture) && 
          course.world_culture.includes(activeDistrib)) {
        return true;
      }
      return false;
    });
  }, [activeDistrib]);

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

  const areArraysEqual = (arr1, arr2) => {
    if (arr1.length !== arr2.length) return false;
    return arr1.every((item, index) => {
      const course1 = `${item.department}${item.course_number}`;
      const course2 = `${arr2[index].department}${arr2[index].course_number}`;
      return course1 === course2;
    });
  };

  const getPillarCompletion = useCallback(() => {
    if (!requirementStatus || !pillar) return { completed: 0, required: 0 };
    
    const pillarCourses = requirementStatus.pillarFills[pillarIndex] || [];
    return {
      completed: pillarCourses.length,
      required: pillar.count || (pillar.type === 'prerequisites' ? pillar.courses?.length : 1)
    };
  }, [requirementStatus, pillar, pillarIndex]);

  const handleCourseClick = useCallback((course) => {
    if (!requirementManager || !course) return;
    
    const courseId = `${course.department}${course.course_number}`;
    const isCurrentlyCompleted = requirementStatus?.courseStatuses?.[courseId];
    onCourseStatusChange(course, !isCurrentlyCompleted);
  }, [requirementManager, requirementStatus, onCourseStatusChange]);

  const fetchSequenceCourses = useCallback(async (sequence) => {
    if (!sequence) return [];
    const courseIds = [sequence.final];
    sequence.prereqs.forEach(prereq => {
      if (typeof prereq === 'string') {
        courseIds.push(prereq);
      } else if (prereq.type === 'alternative') {
        courseIds.push(...prereq.options);
      }
    });

    const uniqueCourseIds = [...new Set(courseIds)];
    const coursesRef = collection(db, 'courses');
    const fetchedCourses = [];

    for (const courseId of uniqueCourseIds) {
      const [dept, num] = [courseId.match(/[A-Z]+/)[0], courseId.match(/\d+/)[0].padStart(3, '0')];
      const courseQuery = query(
        coursesRef,
        where('department', '==', dept),
        where('course_number', '==', num)
      );
      const snapshot = await getDocs(courseQuery);
      fetchedCourses.push(...snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })));
    }

    return fetchedCourses;
  }, [db]);

// Update handleSequenceSelect to prevent unnecessary updates
const handleSequenceSelect = useCallback(async (sequence) => {
  if (!sequence || (selectedSequence === sequence)) return;
    
  console.log('Selecting new sequence:', sequence);
  setLoading(true);
  setError(null);
  
  try {
    const sequenceCourses = await fetchSequenceCourses(sequence);
    console.log('Fetched sequence courses:', sequenceCourses);

    if (!sequenceCourses || sequenceCourses.length === 0) {
      throw new Error('No courses found for this sequence');
    }

    setSelectedSequence(sequence);
    setCourses(sequenceCourses);

    if (requirementManager) {
      const updatedPillar = {
        ...pillar,
        selectedSequence: sequence
      };
      requirementManager.pillars[pillarIndex] = updatedPillar;
      const newStatus = requirementManager.processCourseList(completedCourses);
      setRequirementStatus(newStatus);
    }
  } catch (error) {
    console.error('Error handling sequence selection:', error);
    setError(error.message);
    setCourses([]);
  } finally {
    setLoading(false);
  }
}, [
  selectedSequence,
  fetchSequenceCourses,
  pillar,
  pillarIndex,
  requirementManager,
  completedCourses,
  setRequirementStatus
]);

  const getCachedCourses = useCallback(async () => {
    if (!pillar) return [];
    
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
          
          for (const option of pillar.options || []) {
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
  }, [pillar, majorDept, db, filterByDistrib, parseOption]);

  // Effects
  useEffect(() => {
    if (pillar?.type === 'culminating' && pillar.sequences?.length > 0 && !selectedSequence) {
      handleSequenceSelect(pillar.sequences[0]);
    }
  }, [pillar, selectedSequence, handleSequenceSelect]);

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
    
    if (pillar?.type !== 'culminating') {
      loadCourses();
    }
  }, [pillar, getCachedCourses, sortCoursesByStatus]);

  useEffect(() => {
    if (courses.length > 0 && requirementStatus) {
      const sortedCourses = sortCoursesByStatus(courses);
      // Only update if the sorted order is different
      if (!areArraysEqual(courses, sortedCourses)) {
        setCourses(sortedCourses);
      }
    }
  }, [requirementStatus, sortCoursesByStatus]);

  // Render functions
  const renderLoadingState = () => (
    <div className="flex justify-center items-center py-8">
      <Loader2 className={`w-8 h-8 animate-spin ${
        darkMode ? 'text-blue-400' : 'text-blue-500'
      }`} />
    </div>
  );

  const renderErrorState = () => (
    <div className={`py-4 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
      Error loading courses: {error}
    </div>
  );

  const renderSequenceButtons = () => {
    if (pillar.type !== 'culminating' || !pillar.sequences) return null;

    const currentIndex = requirementManager ? 
    requirementManager.getSelectedSequence(majorDept) : 0;
    
    return (
      <div className="flex flex-wrap gap-2 mb-4">
        {pillar.sequences.map((sequence, idx) => (
          <button
            key={idx}
            onClick={() => handleSequenceSelect(sequence)}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              selectedSequence === sequence
                ? darkMode 
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-100 text-blue-800'
                : darkMode
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            {formatSequenceName(sequence)}
          </button>
        ))}
      </div>
    );
  };

  const renderCourseCards = () => {
    return courses.map(course => {
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
    });
  };

  // Main render
  if (!pillar) return null;
  if (loading) return renderLoadingState();
  if (error) return renderErrorState();

  const completion = getPillarCompletion();
  const pillarTitle = pillar.description || `${pillar.type} Requirements`;
  const subtitle = pillar.type === 'culminating' && selectedSequence
    ? `Selected: ${formatSequenceName(selectedSequence)}`
    : `${completion.completed}/${completion.required} completed`;

  return (
    <div>
      {pillar.type === 'culminating' && renderSequenceButtons()}
      <CourseDisplayCarousel
        title={pillarTitle}
        subtitle={subtitle}
        darkMode={darkMode}
      >
        {renderCourseCards()}
      </CourseDisplayCarousel>
    </div>
  );
};

export default CourseDisplayPillar;