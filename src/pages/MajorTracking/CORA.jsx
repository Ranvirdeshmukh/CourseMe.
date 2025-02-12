import React, { useState, useEffect, useCallback } from 'react';
import { getFirestore, collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { GraduationCap, User, Send } from 'lucide-react';
import programData from './programData.json';
import CourseDisplayPillar from './CourseDisplayPillar';
import GraduationRequirements from './GraduationRequirements';
import MajorRequirements from './MajorRequirements';
import CourseDisplayCarousel from './CourseDisplayCarousel';
import CourseBucket from './CourseBucket';

const MajorTracker = ({darkMode}) => {
  const [courseInput, setCourseInput] = useState("");
  const [completedCourses, setCompletedCourses] = useState([]);
  const [majorRequirements, setMajorRequirements] = useState({});
  const [courseData, setCourseData] = useState({});
  const [showGradReqs, setShowGradReqs] = useState(false);
  const [selectedMajor, setSelectedMajor] = useState("");
  const [availableMajors, setAvailableMajors] = useState([]);
  const db = getFirestore();
  const auth = getAuth();

  const [coraQuery, setCoraQuery] = useState("");
const [coraResponse, setCoraResponse] = useState("");
const mainBgColor = darkMode 
  ? 'linear-gradient(90deg, #1C093F 0%, #0C0F33 100%)'
  : '#F9F9F9';
const paperBgColor = darkMode ? '#1C1F43' : '#FFFFFF';
const textColor = darkMode ? '#FFFFFF' : '#333333';
const headerTextColor = darkMode ? '#FFFFFF' : '#571CE0';
const progressBgColor = darkMode ? '#333333' : '#E5E7EB'; // outer bar background
const progressFillColor = darkMode ? '#349966' : '#3B82F6'; // inner fill color
const borderColor = darkMode ? '#4B5563' : '#D1D5DB';
const inputBgColor = darkMode ? '#0C0F33' : '#F3F4F6';


  const handleCourseComplete = async (course) => {
    const courseId = `${course.department}${course.course_number}`;
    let updatedCourses;
  
    if (completedCourses.includes(courseId)) {
      updatedCourses = completedCourses.filter(id => id !== courseId);
    } else {
      updatedCourses = [...completedCourses, courseId];
    }
  
    setCompletedCourses(updatedCourses);
  
    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'users', auth.currentUser.uid), {
          completedCourses: updatedCourses
        }, { merge: true });
      } catch (error) {
        console.error('Error saving course completion:', error);
      }
    }
  };
  
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
    setCompletedCourses(prev => {
      const newCourses = [...prev, normalizedCourse];
      if (auth.currentUser) {
        setDoc(doc(db, 'users', auth.currentUser.uid), {
          completedCourses: newCourses
        }, { merge: true });
      }
      return newCourses;
    });
    setCourseInput("");
  };
  
  const handleCourseRemove = (index) => {
    setCompletedCourses(prev => {
      const newCourses = prev.filter((_, i) => i !== index);
      if (auth.currentUser) {
        setDoc(doc(db, 'users', auth.currentUser.uid), {
          completedCourses: newCourses
        }, { merge: true });
      }
      return newCourses;
    });
  };

    // Fetch available majors from programData
    useEffect(() => {
      if (programData?.programs) {
        const majors = Object.entries(programData.programs).map(([code, data]) => ({
          code,
          name: data.name || code
        }));
        setAvailableMajors(majors);
      }
    }, []);
  
    // Fetch user data and selected major from Firebase
    const fetchUserData = useCallback(async () => {
      if (!auth.currentUser) return;
  
      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setSelectedMajor(userData.major || "");
          setCompletedCourses(userData.completedCourses || []);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    }, [auth.currentUser, db]);
  
    useEffect(() => {
      fetchUserData();
    }, [fetchUserData]);
  
    // Fetch user data and selected major from Firebase
    useEffect(() => {
      const fetchUserData = async () => {
        if (!auth.currentUser) return;
  
        try {
          const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setSelectedMajor(userData.major || "");
            setCompletedCourses(userData.completedCourses || []);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      };
  
      fetchUserData();
    }, [auth.currentUser]);
  
    const saveProgress = async () => {
      if (!auth.currentUser) return;
  
      try {
        await setDoc(doc(db, 'users', auth.currentUser.uid), {
          major: selectedMajor,
          completedCourses,
          lastUpdated: new Date()
        }, { merge: true });
        
        alert('Progress saved successfully!');
      } catch (error) {
        console.error('Error saving progress:', error);
        alert('Error saving progress. Please try again.');
      }
    };
  
    // Handle major selection
    const handleMajorChange = async (majorCode) => {
      setSelectedMajor(majorCode);
      if (auth.currentUser) {
        try {
          await setDoc(doc(db, 'users', auth.currentUser.uid), {
            major: majorCode
          }, { merge: true });
        } catch (error) {
          console.error('Error saving major selection:', error);
        }
      }
    };
  
    // Fetch course data from Firebase
    const fetchCourseData = useCallback(async () => {
      try {
        const coursesRef = collection(db, 'courses');
        const snapshot = await getDocs(coursesRef);
        const courseDataMap = {};
        
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          const courseId = `${data.department}${data.course_number}`;
          courseDataMap[courseId] = data;
        });
        
        setCourseData(courseDataMap);
      } catch (error) {
        console.error('Error fetching course data:', error);
      }
    }, [db]);
  
    useEffect(() => {
      fetchCourseData();
    }, [fetchCourseData]);

  // parses the list and structures into alternatives and such
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

  // Separates into pillars
  const parseRequirementString = (reqStr, majorDept) => {
    if (!reqStr || typeof reqStr !== 'string') return [];

    try {
      // Remove outer parentheses and trim
      const cleanStr = reqStr.replace(/^\(|\)$/g, '').trim();
      if (!cleanStr) return [];

      // split & to extra pillar
      const groups = cleanStr.split('&')
        .map(r => r.trim())
        .filter(Boolean);

      // oarse each requirement group
      return groups.map(group => {
        // prereq
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
          console.log(requirements);

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

   // ----- CORA: Chat handler -----
   const handleCoraSubmit = async () => {
    if (!coraQuery.trim()) return;

    try {
      const response = await fetch("https://langchain-chatbot-898344091520.us-central1.run.app/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: coraQuery }),
      });

      // Assuming the endpoint returns JSON with shape: { answer: "...", ... }
      const data = await response.json();
      // Adjust the key based on your actual API response
      setCoraResponse(data.answer || "No answer returned from the chatbot.");
    } catch (error) {
      console.error("Error calling CORA chatbot: ", error);
      setCoraResponse("There was an error retrieving the answer.");
    }
  };

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

  {showGradReqs ? (
    <GraduationRequirements 
      selectedCourses={completedCourses}
      courseData={courseData}
    />
  ) : (
    selectedMajor && majorRequirements[selectedMajor] ? (
      <MajorRequirements
        selectedMajor={selectedMajor}
        majorRequirements={majorRequirements}
        completedCourses={completedCourses}
        onCoursesUpdate={(updatedCourses) => {
          setCompletedCourses(updatedCourses);
        }}
      />
    ) : (
      <div className="text-center py-8 text-gray-500">
        Please select a major to view requirements
      </div>
    )
  )}
  // ProgressBar Component
const ProgressBar = ({ completed, total, label, darkMode }) => {
  const progressPercentage = (completed / total) * 100;
  return (
    <div className="mb-4">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium" style={{ color: textColor }}>{label}</span>
        <span className="text-sm" style={{ color: darkMode ? "#B0B0B0" : "#6B7280" }}>
          {completed}/{total} completed
        </span>
      </div>
      <div 
        className="w-full rounded-full h-2" 
        style={{ background: progressBgColor }}
      >
        <div 
          className="rounded-full h-2" 
          style={{ background: progressFillColor, width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  );
};

// CourseSection Component
const CourseSection = ({ title, courses, isRequired, darkMode }) => (
  <div className="mb-8">
    <h3 className="font-medium mb-4" style={{ color: textColor }}>
      {title} {isRequired && "(Required)"}
    </h3>
    <div className="space-y-2">
      {courses.map((course, index) => (
        <div 
          key={index} 
          className="flex items-center justify-between p-4 rounded-lg shadow"
          style={{ background: paperBgColor }}
        >
          <div>
            <h4 className="font-medium" style={{ color: textColor }}>
              {course.code}: {course.title}
            </h4>
          </div>
          <div 
            className="h-5 w-5 rounded-full flex items-center justify-center" 
            style={{ border: `2px solid ${borderColor}` }}
          >
            {course.completed && (
              <div className="h-3 w-3 rounded-full bg-green-500" />
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ... (calculateProgress remains unchanged)
const calculateProgress = useCallback(() => {
  if (!selectedMajor || !majorRequirements[selectedMajor]) return { major: 0, distributives: 0 };
  
  const requirements = majorRequirements[selectedMajor];
  const totalRequirements = requirements.pillars.reduce((total, pillar) => {
    if (pillar.type === 'prerequisites') return total + pillar.courses.length;
    if (pillar.type === 'specific') return total + 1;
    if (pillar.type === 'range') return total + pillar.count || 1;
    return total;
  }, 0);

  const completedCount = completedCourses.length;

  return {
    major: Math.round((completedCount / totalRequirements) * 100),
    distributives: Math.round((completedCourses.filter(course => 
      courseData[course]?.distribs
    ).length / 9) * 100)
  };
}, [selectedMajor, majorRequirements, completedCourses, courseData]);

const progress = calculateProgress();

// Main Return (header and content)
return (
  <div 
    className="min-h-screen" 
    style={{ background: mainBgColor, color: textColor }}
  >
    <header 
      className="shadow" 
      style={{ background: paperBgColor }}
    >
      <div 
        className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center"
        style={{ color: headerTextColor }}
      >
        <div className="flex items-center space-x-2">
          <GraduationCap className="w-6 h-6" />
          <h1 className="text-xl font-semibold">CORA 1.0 (COurse Recommendation Advisor)</h1>
        </div>
        <div className="flex items-center space-x-4">
          <select 
            value={selectedMajor}
            onChange={(e) => handleMajorChange(e.target.value)}
            className="border rounded-md px-3 py-2"
            style={{ background: paperBgColor, color: textColor, borderColor: headerTextColor }}
          >
            <option value="">Select Major</option>
            {availableMajors.map(major => (
              <option key={major.code} value={major.code}>
                {major.name}
              </option>
            ))}
          </select>
          <button 
            onClick={saveProgress}
            className="px-4 py-2 rounded-md hover:bg-blue-700"
            style={{ background: darkMode ? '#349966' : '#3B82F6', color: '#FFFFFF' }}
          >
            Save Progress
          </button>
          <User className="w-6 h-6" style={{ color: textColor }} />
        </div>
      </div>
    </header>

    <main className="max-w-7xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div 
            className="rounded-lg shadow p-6"
            style={{ background: paperBgColor, color: textColor }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">
                {showGradReqs ? "Graduation Requirements" : "Major Requirements"}
              </h2>
              <button
                onClick={() => setShowGradReqs(!showGradReqs)}
                className="px-4 py-2 rounded-md hover:bg-blue-700"
                style={{ background: darkMode ? '#349966' : '#3B82F6', color: '#FFFFFF' }}
              >
                Show {showGradReqs ? "Major" : "Graduation"} Requirements
              </button>
            </div>

            {showGradReqs ? (
              <GraduationRequirements 
                selectedCourses={completedCourses}
                courseData={courseData}
                darkMode={true}
              />
            ) : (
              <MajorRequirements
                selectedMajor={selectedMajor}
                majorRequirements={majorRequirements}
                completedCourses={completedCourses}
                onCourseComplete={handleCourseComplete}
                courseData={courseData}
                darkMode={true}
              />
            )}
          </div>
        </div>
        

        <div className="lg:col-span-1">
            <div 
              className="rounded-lg shadow p-6 mb-6" 
              style={{ background: paperBgColor }}
            >
              <h2 
                className="text-lg font-semibold mb-4" 
                style={{ color: textColor }}
              >
                Progress Summary
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span style={{ color: textColor }}>Major Requirements</span>
                  <span className="font-medium" style={{ color: textColor }}>
                    {progress.major}% completed
                  </span>
                </div>
                <div 
                  className="w-full rounded-full h-2" 
                  style={{ background: progressBgColor }}
                >
                  <div 
                    className="rounded-full h-2" 
                    style={{ background: progressFillColor, width: `${progress.major}%` }}
                  />
                </div>

                <div className="flex justify-between items-center">
                  <span style={{ color: textColor }}>Distributives</span>
                  <span className="font-medium" style={{ color: textColor }}>
                    {progress.distributives}% completed
                  </span>
                </div>
                <div 
                  className="w-full rounded-full h-2" 
                  style={{ background: progressBgColor }}
                >
                  <div 
                    className="rounded-full h-2" 
                    style={{ background: progressFillColor, width: `${progress.distributives}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Degree Assistant */}
            <div 
              className="rounded-lg shadow p-6" 
              style={{ background: paperBgColor }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 
                  className="text-lg font-semibold" 
                  style={{ color: textColor }}
                >
                  CORA
                </h2>
                <GraduationCap 
                  className="w-5 h-5" 
                  style={{ color: darkMode ? '#B0B0B0' : '#6B7280' }}
                />
              </div>

              {/* Optional sample user prompt */}
              <div 
                className="rounded-lg p-4 mb-4" 
                style={{ background: darkMode ? '#0C0F33' : '#F3F4F6' }}
              >
                <p style={{ color: darkMode ? '#FFFFFF' : '#374151' }}>
                  Show me minor paths that fulfill my remaining distributives
                </p>
              </div>

              {/* Display CORA's response (if any) */}
              {coraResponse && (
                <div 
                  className="rounded-lg p-4 mb-4 text-sm" 
                  style={{ background: darkMode ? '#333333' : '#E5E7EB', color: textColor }}
                >
                  {coraResponse}
                </div>
              )}

              {/* CORA Input Box + Send Button */}
              <div className="mt-4 relative">
                <input
                  type="text"
                  placeholder="Ask about your degree requirements..."
                  className="w-full p-3 pr-10 border rounded-lg"
                  value={coraQuery}
                  onChange={(e) => setCoraQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCoraSubmit();
                  }}
                  style={{
                    background: inputBgColor,
                    color: textColor,
                    borderColor: borderColor,
                  }}
                />
                <button
                  onClick={handleCoraSubmit}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  style={{ color: darkMode ? '#B0B0B0' : '#6B7280' }}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default MajorTracker;
