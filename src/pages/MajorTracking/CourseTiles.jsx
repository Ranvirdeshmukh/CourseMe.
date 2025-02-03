import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, getDocs, where } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import CourseCard from './CourseCard';
import { evaluateRequirements, getRangeSize } from './CourseAllocation';

// CourseTiles.jsx
const CourseTiles = ({
    pillar,
    majorDept,
    selectedCourses = [],
    onCourseComplete,
    isPillarComplete,
    pillarIndex,
    allPillars = [],
    matchingCourses = [],
    isExpanded = false  // Add this prop
  }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const db = getFirestore();

  // Get the latest course allocations
  const { allocatedCourses, isUsedInMoreSpecificRange } = 
    evaluateRequirements(selectedCourses, allPillars);

  // Function to check course status
  const getCourseStatus = (course) => {
    const courseId = `${course.department}${course.course_number}`;
    const isSelected = selectedCourses.includes(courseId);
    const allocation = allocatedCourses.get(courseId);
    
    return {
      isCompleted: isSelected,
      isUsedInOtherPillar: isSelected && allocation && allocation.pillarIndex !== pillarIndex &&
                          getRangeSize(allPillars[allocation.pillarIndex]) < getRangeSize(pillar),
      usedInPillar: allocation?.pillarName,
      isUsedInMoreSpecificRange: isSelected && allocation && allocation.pillarIndex !== pillarIndex &&
                                getRangeSize(allPillars[allocation.pillarIndex]) > getRangeSize(pillar)
    };
  };

  // Fetch courses based on pillar type
  useEffect(() => {
    const fetchCourses = async () => {
      if (!pillar) return;

      setLoading(true);
      setError(null);
      
      try {
        const coursesRef = collection(db, 'courses');
        let q;

        switch (pillar.type) {
          case 'prerequisites':
            // Handle prerequisites query
            const courseIds = pillar.courses.flatMap(course => {
              if (typeof course === 'string') {
                return [course];
              } else if (course.type === 'alternative') {
                return course.options;
              }
              return [];
            });
            
            q = query(
              coursesRef,
              where('course_id', 'in', courseIds)
            );
            break;

          case 'range':
            // Handle range query
            q = query(
              coursesRef,
              where('department', '==', pillar.department),
              where('course_number', '>=', pillar.start.toString().padStart(3, '0')),
              where('course_number', '<=', pillar.end.toString().padStart(3, '0'))
            );
            break;

          case 'specific':
            // Handle specific course query
            q = query(
              coursesRef,
              where('course_id', 'in', pillar.options)
            );
            break;

          default:
            return;
        }

        const snapshot = await getDocs(q);
        const fetchedCourses = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setCourses(fetchedCourses);
      } catch (err) {
        console.error('Error fetching courses:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [pillar, db]);

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

  if (courses.length === 0) {
    return (
      <div className="text-gray-500 py-4">
        No available courses for this requirement
      </div>
    );
  }

  return (
    <>
      {courses.map(course => {
        const courseStatus = getCourseStatus(course);
        return (
          <div
            key={course.id}
            className={`
              ${isExpanded 
                ? ''  // No additional styling needed for expanded view
                : 'flex-none w-[calc(30%-12px)] first:ml-0 ml-4'} // Carousel view styling
            `}
          >
            <CourseCard
              course={course}
              isCompleted={courseStatus.isCompleted}
              isPillarComplete={isPillarComplete}
              isUsedInOtherPillar={courseStatus.isUsedInOtherPillar}
              usedInPillar={courseStatus.usedInPillar}
              isUsedInMoreSpecificRange={courseStatus.isUsedInMoreSpecificRange}
              onCourseClick={onCourseComplete}
              pillarName={pillar.description}
            />
          </div>
        );
      })}
    </>
  );
};
export default CourseTiles;