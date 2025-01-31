import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, getDocs, where } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

const CourseCard = ({ course }) => {
  const renderTerms = () => {
    if (!course.terms || !Array.isArray(course.terms) || course.terms.length === 0) {
      return "No recent terms available";
    }

    // Sort terms in descending order
    const sortedTerms = [...course.terms].sort((a, b) => {
      // Assuming terms are in format like "23F" or "24W"
      const yearA = parseInt('20' + a.slice(0, -1));
      const yearB = parseInt('20' + b.slice(0, -1));
      if (yearA !== yearB) return yearB - yearA;

      // Sort by term if years are equal
      const termOrder = { 'W': 1, 'S': 2, 'X': 3, 'F': 4 };
      return termOrder[b.slice(-1)] - termOrder[a.slice(-1)];
    });

    return `Recent terms: ${sortedTerms.slice(0, 3).join(', ')}`;
  };

  return (
    <div className="bg-white rounded-xl shadow p-4 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-semibold text-lg">
            {course.department}{course.course_number}
          </h4>
          <p className="text-sm text-gray-600 mt-1">
            {course.name?.split(':')[1]?.trim() || 'No title available'}
          </p>
        </div>
        <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
          {course.distribs || 'No distrib'}
        </span>
      </div>
      <div className="mt-4 text-sm text-gray-500">
        {renderTerms()}
      </div>
    </div>
  );
};

const CourseTiles = ({ pillar, majorDept, selectedCourses }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const db = getFirestore();

  // Function to filter courses based on terms
  const filterCourses = (coursesArray) => {
    return coursesArray.filter(course => {
      // Filter out courses with no terms
      if (!course.terms || !Array.isArray(course.terms) || course.terms.length === 0) {
        return false;
      }

      // Check if any term is from 23 or higher
      return course.terms.some(term => {
        const year = parseInt(term.slice(0, -1));
        return year >= 23;
      });
    });
  };

  // Get query parameters based on pillar type
  const getQueryParams = () => {
    switch (pillar.type) {
      case 'prerequisites':
        return pillar.courses.map(course => {
          if (typeof course === 'string') {
            const [dept, num] = course.match(/([A-Z]+)(\d+)/).slice(1);
            return { department: dept, number: parseInt(num) };
          } else if (course.type === 'alternative') {
            return course.options.map(opt => {
              const [dept, num] = opt.match(/([A-Z]+)(\d+)/).slice(1);
              return { department: dept, number: parseInt(num) };
            });
          }
          return null;
        }).flat().filter(Boolean);

      case 'range':
        return [{
          department: pillar.department,
          rangeStart: pillar.start,
          rangeEnd: pillar.end
        }];

      case 'specific':
        return pillar.options.map(opt => {
          if (opt.includes('≥')) {
            const [dept, num] = opt.match(/([A-Z]+)≥(\d+)/).slice(1);
            return { department: dept, minNumber: parseInt(num) };
          } else {
            const [dept, num] = opt.match(/([A-Z]+)(\d+)/).slice(1);
            return { department: dept, number: parseInt(num) };
          }
        });

      default:
        return [];
    }
  };

  // Fetch courses from Firestore
  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const coursesRef = collection(db, 'courses');
      const queryParams = getQueryParams();
      const fetchedCourses = new Set();

      for (const param of queryParams) {
        let q;
        if (param.number !== undefined) {
          // Exact number match
          q = query(
            coursesRef,
            where('department', '==', param.department),
            where('course_number', '==', param.number.toString().padStart(3, '0'))
          );
        } else if (param.minNumber !== undefined) {
          // Greater than or equal to
          q = query(
            coursesRef,
            where('department', '==', param.department),
            where('course_number', '>=', param.minNumber.toString().padStart(3, '0'))
          );
        } else if (param.rangeStart !== undefined) {
          // Range query
          q = query(
            coursesRef,
            where('department', '==', param.department),
            where('course_number', '>=', param.rangeStart.toString().padStart(3, '0')),
            where('course_number', '<=', param.rangeEnd.toString().padStart(3, '0'))
          );
        }

        if (q) {
          const snapshot = await getDocs(q);
          snapshot.docs.forEach(doc => {
            const courseData = { id: doc.id, ...doc.data() };
            const courseId = `${courseData.department}${courseData.course_number}`;
            if (!selectedCourses.includes(courseId)) {
              fetchedCourses.add(courseData);
            }
          });
        }
      }

      // Apply the term filtering before setting the courses
      const filteredCourses = filterCourses(Array.from(fetchedCourses));
      setCourses(filteredCourses);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [pillar, selectedCourses]);

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {courses.map(course => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
};

export default CourseTiles;