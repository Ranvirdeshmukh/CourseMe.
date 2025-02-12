import React from 'react';
import CourseCard from './CourseCard';
import CourseDisplayCarousel from './CourseDisplayCarousel';

const CourseBucket = ({ courses, onCourseComplete, darkMode }) => {
  // Group courses by department for better organization
  const groupedCourses = courses.reduce((acc, course) => {
    const dept = course.department;
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(course);
    return acc;
  }, {});

  return (
    <div className={`mb-8 border-2 ${darkMode ? 'border-blue-700' : 'border-blue-400'} rounded-lg p-4 ${darkMode ? 'bg-gray-800' : ''}`}>
      <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>
        Additional Courses
      </h2>
      <div className="space-y-4">
        {Object.entries(groupedCourses).map(([dept, deptCourses]) => (
          <CourseDisplayCarousel
            key={dept}
            title={`${dept} Courses`}
            pillar={{ description: `bucket-${dept}` }}
            darkMode={darkMode}
          >
            {deptCourses.map(course => (
              <CourseCard
                key={course.id}
                course={course}
                isCompleted={true}
                isPillarComplete={false}
                onCourseClick={onCourseComplete}
                pillarName="Additional Courses"
                darkMode={darkMode}  // ✅ Ensure darkMode is passed
                />
            ))}
          </CourseDisplayCarousel>
        ))}
      </div>
    </div>
  );
};

export default CourseBucket;
