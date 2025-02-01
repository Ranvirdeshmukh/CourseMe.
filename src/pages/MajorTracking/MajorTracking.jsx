import React, { useState, useEffect } from 'react';
import programData from './programData.json';
import CourseDisplayPillar from './CourseDisplayPillar';

const MajorTracker = () => {
  const [courseInput, setCourseInput] = useState("");
  const [courses, setCourses] = useState([]);
  const [majorRequirements, setMajorRequirements] = useState({});

  const parseCourse = (course) => {
    if (!course || typeof course !== 'string') return null;
    const match = course.match(/^([A-Z]+)(\d+)(\.?\d*)?$/);
    return match ? {
      dept: match[1],
      num: parseInt(match[2]),
      decimal: match[3] || ''
    } : null;
  };

  const normalizeCourseNumber = (course) => {
    if (!course || typeof course !== 'string') return null;
    const match = course.match(/^([A-Z]+)(\d+)(\.?\d*)?$/);
    if (!match) return null;
    const [, dept, num, decimal] = match;
    const paddedNum = num.padStart(3, '0');
    return `${dept}${paddedNum}${decimal || ''}`;
  };

  const parseCourseList = (courseStr) => {
    if (!courseStr || typeof courseStr !== 'string') return [];
    
    const courses = [];
    let current = '';
    let braceDepth = 0;

    for (let char of courseStr) {
      if (char === '{') braceDepth++;
      if (char === '}') braceDepth--;
      
      if (char === ',' && braceDepth === 0) {
        const trimmed = current.trim();
        if (trimmed) courses.push(trimmed);
        current = '';
      } else {
        current += char;
      }
    }
    
    const trimmed = current.trim();
    if (trimmed) courses.push(trimmed);

    return courses.map(course => {
      if (course.startsWith('{') && course.endsWith('}')) {
        return {
          type: 'alternative',
          options: course.slice(1, -1).split('|').map(opt => opt.trim())
        };
      }
      return course;
    });
  };

  const parseRequirementString = (reqStr, majorDept) => {
    if (!reqStr || typeof reqStr !== 'string') return [];

    try {
      // Remove outer parentheses and trim
      const cleanStr = reqStr.replace(/^\(|\)$/g, '').trim();
      if (!cleanStr) return [];

      // Split by & and filter out empty strings
      const groups = cleanStr.split('&')
        .map(r => r.trim())
        .filter(Boolean);

      // Parse each requirement group
      return groups.map(group => {
        // Prerequisites/Required courses
        if (group.startsWith('@[')) {
          const inner = group.slice(2, -1).trim();
          return {
            type: 'prerequisites',
            courses: parseCourseList(inner),
            description: 'Required foundation courses'
          };
        }

        // Course count requirements with range
        const rangeMatch = group.match(/#(\d+)\[(.+?)\]/);
        if (rangeMatch) {
          const [, count, range] = rangeMatch;
          const deptMatch = range.match(/^([A-Z]+)/);
          const targetDept = deptMatch ? deptMatch[1] : majorDept;
          const [start, end] = range.match(/\d+/g)?.map(num => parseInt(num)) || [0, 0];
          
          return {
            type: 'range',
            count: parseInt(count),
            department: targetDept,
            start,
            end,
            description: `${count} courses from ${targetDept} ${start}-${end}`
          };
        }

        // Specific course requirements
        if (group.startsWith('#{')) {
          const options = group.slice(2, -1).split('|').map(o => o.trim());
          return {
            type: 'specific',
            options,
            description: 'One of the following courses'
          };
        }

        return null;
      }).filter(Boolean);
    } catch (error) {
      console.error('Error parsing requirements:', error);
      return [];
    }
  };

  useEffect(() => {
    try {
      const processedRequirements = {};

      if (!programData?.programs) {
        console.error('No program data available');
        return;
      }

      Object.entries(programData.programs).forEach(([majorCode, majorData]) => {
        try {
          if (!majorData?.types?.major?.code) {
            console.error(`Invalid major data for ${majorCode}`);
            return;
          }

          const majorDept = majorData.types.major.code.split('.')[1];
          if (!majorDept) {
            console.error(`Could not determine department for ${majorCode}`);
            return;
          }

          const requirements = parseRequirementString(
            majorData.types.major.requirements,
            majorDept
          );

          if (requirements.length > 0) {
            processedRequirements[majorCode] = {
              name: majorData.name || majorCode,
              department: majorDept,
              pillars: requirements
            };
          }
        } catch (error) {
          console.error(`Error processing major ${majorCode}:`, error);
        }
      });

      setMajorRequirements(processedRequirements);
    } catch (error) {
      console.error('Error processing program data:', error);
    }
  }, []);

  const handleCourseSubmit = (e) => {
    e.preventDefault();
    
    const courseRegex = /^[A-Z]{4}\d{1,3}(?:\.\d{2})?$/;
    if (!courseRegex.test(courseInput)) {
      alert("Please enter a valid course code (e.g., COSC001 or COSC001.01)");
      return;
    }

    const normalizedCourse = normalizeCourseNumber(courseInput);
    if (!normalizedCourse) {
      alert("Invalid course format");
      return;
    }

    setCourses(prev => [...prev, normalizedCourse]);
    setCourseInput("");
  };

  const handleCourseRemove = (index) => {
    setCourses(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6">Major Progress Tracker</h2>

        <div className="space-y-6">
          {/* Course Input */}
          <div className="space-y-2">
            <label className="block font-medium">Add Course</label>
            <form onSubmit={handleCourseSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="Enter course code (e.g., COSC001 or COSC001.01)"
                value={courseInput}
                onChange={(e) => setCourseInput(e.target.value.toUpperCase())}
                className="flex-1 p-2 border rounded"
              />
              <button 
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Add Course
              </button>
            </form>
          </div>

          {/* Added Courses */}
          <div className="space-y-2">
            <h3 className="font-medium">Added Courses</h3>
            <div className="flex flex-wrap gap-2">
              {courses.map((course, index) => (
                <span 
                  key={index} 
                  className="px-3 py-1 bg-gray-100 rounded-full flex items-center gap-2 cursor-pointer hover:bg-gray-200"
                  onClick={() => handleCourseRemove(index)}
                >
                  {course}
                  <span className="text-gray-500">×</span>
                </span>
              ))}
            </div>
          </div>

          {/* Major Requirements */}
          {Object.entries(majorRequirements).map(([majorCode, major]) => (
            <div key={majorCode} className="mt-8">
              <h3 className="text-xl font-bold mb-4">{major.name}</h3>
              {major.pillars.map((pillar, index) => (
                <CourseDisplayPillar
                  key={`${majorCode}-${index}`}
                  pillar={pillar}
                  majorDept={major.department}
                  selectedCourses={courses}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MajorTracker;