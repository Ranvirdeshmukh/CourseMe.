import React, { useState, useEffect } from 'react';
import programData from './programData.json';

// Function to normalize course numbers to padded format
const normalizeCourseNumber = (course) => {
  const match = course.match(/^([A-Z]+)(\d+)(\.?\d*)?$/);
  if (!match) return null;
  
  const [, dept, num, decimal] = match;
  const paddedNum = num.padStart(3, '0');
  return `${dept}${paddedNum}${decimal || ''}`;
};

// Function to parse course into components
const parseCourse = (course) => {
  const match = course.match(/^([A-Z]+)(\d+)(\.?\d*)?$/);
  return match ? {
    dept: match[1],
    num: parseInt(match[2]),
    decimal: match[3] || ''
  } : null;
};

const parsePrereqString = (prereqStr) => {
  // Remove @ and brackets
  const inner = prereqStr.slice(2, -1);
  
  // Split by comma unless inside curly braces
  const prereqs = [];
  let currentItem = "";
  let braceDepth = 0;
  
  for (let char of inner) {
    if (char === '{') braceDepth++;
    if (char === '}') braceDepth--;
    
    if (char === ',' && braceDepth === 0) {
      prereqs.push(currentItem.trim());
      currentItem = "";
    } else {
      currentItem += char;
    }
  }
  if (currentItem) prereqs.push(currentItem.trim());

  return prereqs.map(req => {
    if (req.startsWith('{')) {
      // Handle alternatives
      const options = req.slice(1, -1).split('|').map(opt => opt.trim());
      return `One from: ${options.join(', ')}`;
    }
    return req;
  });
};

const isMathPrereq = (course) => {
  const mathPrereqs = parsePrereqString(programData.programs.MATH.types.major.prereqs);
  const courseParsed = parseCourse(course);
  return mathPrereqs.some(prereq => {
    if (prereq.startsWith('One from:')) {
      const options = prereq.slice(10).split(',').map(opt => opt.trim());
      return options.some(opt => {
        const prereqParsed = parseCourse(opt);
        return prereqParsed && courseParsed &&
               prereqParsed.dept === courseParsed.dept &&
               prereqParsed.num === courseParsed.num;
      });
    }
    const prereqParsed = parseCourse(prereq);
    return prereqParsed && courseParsed &&
           prereqParsed.dept === courseParsed.dept &&
           prereqParsed.num === courseParsed.num;
  });
};

const checkSpecificCourseRequirement = (requirement, course) => {
  const courseParsed = parseCourse(course);
  if (!courseParsed) return false;

  // Handle range within specific department (e.g., COSC[30-89])
  const deptRangeMatch = requirement.match(/([A-Z]+)\[(\d+)-(\d+)\]/);
  if (deptRangeMatch) {
    const [, dept, start, end] = deptRangeMatch;
    return courseParsed.dept === dept && 
           courseParsed.num >= parseInt(start) && 
           courseParsed.num <= parseInt(end);
  }

  // Handle greater than or equal requirement with exclusions (e.g., MATH≥20!MATH_PREREQS)
  const greaterEqualMatch = requirement.match(/([A-Z]+)≥(\d+)(!MATH_PREREQS)?/);
  if (greaterEqualMatch) {
    const [, dept, minNum, excludePrereqs] = greaterEqualMatch;
    const meetsBasicRequirement = courseParsed.dept === dept && 
                                 courseParsed.num >= parseInt(minNum);
    
    if (!meetsBasicRequirement) return false;
    if (excludePrereqs && isMathPrereq(course)) return false;
    return true;
  }

  // Handle exact course match (e.g., COSC094)
  const reqParsed = parseCourse(requirement);
  return reqParsed && 
         courseParsed.dept === reqParsed.dept && 
         courseParsed.num === reqParsed.num;
};

const MajorTracker = () => {
  const [courseInput, setCourseInput] = useState("");
  const [courses, setCourses] = useState([]);
  const [matchingMajors, setMatchingMajors] = useState({});

  const evaluateRequirements = (major, courseList) => {
    if (!major || !programData.programs[major]) return {};
    
    const majorData = programData.programs[major].types.major;
    const reqs = {
      hasMatchingCourses: false,
      prerequisites: {
        needed: [],
        completed: [],
        remaining: []
      },
      courseRanges: [],
      specificRequirements: []
    };

    // Check prerequisites
    const prereqs = parsePrereqString(majorData.prereqs);
    reqs.prerequisites.needed = prereqs;
    reqs.prerequisites.completed = courseList.filter(course => 
      prereqs.some(prereq => {
        if (prereq.includes('One from:')) {
          const options = prereq.slice(10).split(',').map(opt => opt.trim());
          return options.some(opt => {
            const reqParsed = parseCourse(opt);
            const courseParsed = parseCourse(course);
            return reqParsed && courseParsed &&
                   reqParsed.dept === courseParsed.dept &&
                   reqParsed.num === courseParsed.num;
          });
        }
        const reqParsed = parseCourse(prereq);
        const courseParsed = parseCourse(course);
        return reqParsed && courseParsed &&
               reqParsed.dept === courseParsed.dept &&
               reqParsed.num === courseParsed.num;
      })
    );

    reqs.prerequisites.remaining = prereqs.filter(prereq => {
      if (prereq.includes('One from:')) {
        const options = prereq.slice(10).split(',').map(opt => opt.trim());
        return !options.some(opt => 
          courseList.some(course => {
            const reqParsed = parseCourse(opt);
            const courseParsed = parseCourse(course);
            return reqParsed && courseParsed &&
                   reqParsed.dept === courseParsed.dept &&
                   reqParsed.num === courseParsed.num;
          })
        );
      }
      return !courseList.some(course => {
        const reqParsed = parseCourse(prereq);
        const courseParsed = parseCourse(course);
        return reqParsed && courseParsed &&
               reqParsed.dept === courseParsed.dept &&
               reqParsed.num === courseParsed.num;
      });
    });

    // Parse and check course ranges
    const reqString = majorData.requirements;
    
    // Handle specific course requirements (e.g., #{COSC94|MATH≥20|COSC[30-89]})
    const specificReqMatches = reqString.match(/#{([^}]+)}/g) || [];
    specificReqMatches.forEach(match => {
      const options = match.slice(2, -1).split('|');
      const matchingCourses = courseList.filter(course =>
        options.some(option => checkSpecificCourseRequirement(option, course))
      );

      if (matchingCourses.length > 0) {
        reqs.specificRequirements.push({
          requirement: match.slice(2, -1),
          completed: matchingCourses,
          satisfied: true
        });
      } else {
        reqs.specificRequirements.push({
          requirement: match.slice(2, -1),
          completed: [],
          satisfied: false
        });
      }
    });

    const parseRangeRequirement = (range) => {
      if (range.includes('-')) {
        const [start, end] = range.split('-').map(num => parseInt(num.padStart(3, '0')));
        return { start, end };
      }
      if (range.includes('≥')) {
        const num = parseInt(range.replace('≥', '').padStart(3, '0'));
        return { start: num, end: 999 };
      }
      return { 
        start: parseInt(range.padStart(3, '0')), 
        end: parseInt(range.padStart(3, '0')) 
      };
    };

    const checkCourseInRange = (course, range) => {
      const baseNum = getCourseBaseNumber(course);
      if (baseNum === null) return false;
      
      const { start, end } = parseRangeRequirement(range);
      return baseNum >= start && baseNum <= end;
    };

    const getCourseBaseNumber = (course) => {
      const match = course.match(/^[A-Z]+(\d+)/);
      return match ? parseInt(match[1]) : null;
    };

    // Handle standard range requirements
    const rangeMatches = reqString.match(/#\d+\[\d+-\d+\]/g) || [];
    rangeMatches.forEach(match => {
      const count = parseInt(match.match(/#(\d+)/)[1]);
      const range = match.match(/\[(.+?)\]/)[1];
      const matchingCourses = courseList.filter(course => 
        checkCourseInRange(course, range)
      );

      reqs.courseRanges.push({
        range,
        required: count,
        completed: matchingCourses,
        remaining: Math.max(0, count - matchingCourses.length)
      });
    });

    // Set hasMatchingCourses if any requirements are met
    reqs.hasMatchingCourses = reqs.prerequisites.completed.length > 0 || 
      reqs.courseRanges.some(range => range.completed.length > 0) ||
      reqs.specificRequirements.some(req => req.satisfied);

    return reqs;
  };

  const findMatchingMajors = (courseList) => {
    const matches = {};
    
    Object.entries(programData.programs).forEach(([majorCode, majorData]) => {
      const requirements = evaluateRequirements(majorCode, courseList);
      if (requirements.hasMatchingCourses) {
        matches[majorCode] = {
          name: majorData.name,
          requirements
        };
      }
    });
    
    return matches;
  };

  useEffect(() => {
    const matches = findMatchingMajors(courses);
    setMatchingMajors(matches);
  }, [courses]);

  const handleCourseSubmit = (e) => {
    e.preventDefault();
    
    // Validate course format (including decimal courses)
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
    <div className="p-6 max-w-4xl mx-auto">
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

          {/* Courses List */}
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

          {/* Matching Majors */}
          {Object.keys(matchingMajors).length > 0 ? (
            <div className="space-y-6">
              <h3 className="text-xl font-bold">Matching Majors</h3>
              {Object.entries(matchingMajors).map(([majorCode, data]) => (
                <div key={majorCode} className="border rounded-lg p-4 space-y-4">
                  <h4 className="text-lg font-bold">{data.name}</h4>
                  
                  {/* Prerequisites */}
                  <div className="space-y-2">
                    <h5 className="font-medium">Prerequisites</h5>
                    <div className="space-y-1">
                      {data.requirements.prerequisites.completed.length > 0 && (
                        <div>
                          <p className="text-green-600">Completed:</p>
                          <ul className="list-disc ml-6">
                            {data.requirements.prerequisites.completed.map((course, idx) => (
                              <li key={idx}>{course}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {data.requirements.prerequisites.remaining.length > 0 && (
                        <div>
                          <p className="text-red-600">Still Needed:</p>
                          <ul className="list-disc ml-6">
                            {data.requirements.prerequisites.remaining.map((req, idx) => (
                              <li key={idx}>{req}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Specific Course Requirements */}
                  {data.requirements.specificRequirements.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="font-medium">Specific Requirements</h5>
                      {data.requirements.specificRequirements.map((req, idx) => (
                        <div key={idx} className="border-l-4 border-blue-500 pl-4 py-2">
                          <p className="font-medium">
                            Requirement: {req.requirement}
                          </p>
                          {req.satisfied ? (
                            <p className="text-sm text-green-600">
                              Satisfied with: {req.completed.join(', ')}
                            </p>
                          ) : (
                            <p className="text-sm text-red-600">
                              Need one of these options
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Course Range Requirements */}
                  {data.requirements.courseRanges.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="font-medium">Course Requirements</h5>
                      {data.requirements.courseRanges.map((range, idx) => (
                        <div key={idx} className="border-l-4 border-blue-500 pl-4 py-2">
                          <p className="font-medium">
                            Courses {range.range}: {range.completed.length}/{range.required} completed
                          </p>
                          {range.completed.length > 0 && (
                            <div className="mt-1">
                              <p className="text-sm text-green-600">
                                Completed: {range.completed.join(', ')}
                              </p>
                            </div>
                          )}
                          {range.remaining > 0 && (
                            <p className="text-sm text-red-600">
                              Still need {range.remaining} more course(s) in this range
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : courses.length > 0 ? (
            <p className="text-gray-600">No matching majors found for your courses.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default MajorTracker;