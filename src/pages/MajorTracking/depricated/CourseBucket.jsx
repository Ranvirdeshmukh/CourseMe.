// import React from 'react';
// import CourseCard from './CourseCard';
// import CourseDisplayCarousel from './CourseDisplayCarousel';

// const CourseBucket = ({ courses, onCourseComplete }) => {
//   // Group courses by department for better organization
//   const groupedCourses = courses.reduce((acc, course) => {
//     const dept = course.department;
//     if (!acc[dept]) acc[dept] = [];
//     acc[dept].push(course);
//     return acc;
//   }, {});

//   return (
//     <div className="mb-8 border-2 border-blue-400 rounded-lg p-4">
//       <h2 className="text-xl font-semibold mb-4 text-blue-600">
//         Additional Courses
//       </h2>
//       <div className="space-y-4">
//         {Object.entries(groupedCourses).map(([dept, deptCourses]) => (
//           <CourseDisplayCarousel
//             key={dept}
//             title={`${dept} Courses`}
//             pillar={{ description: `bucket-${dept}` }}
//           >
//             {deptCourses.map(course => (
//               <CourseCard
//                 key={course.id}
//                 course={course}
//                 isCompleted={true}
//                 isPillarComplete={false}
//                 onCourseClick={onCourseComplete}
//                 pillarName="Additional Courses"
//               />
//             ))}
//           </CourseDisplayCarousel>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default CourseBucket;