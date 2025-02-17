import React, { useState, useEffect, useCallback } from 'react';
import { getFirestore, collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { GraduationCap, User, Send } from 'lucide-react';
import programData from './majors.json';
import CourseDisplayPillar from './CourseDisplayPillar';
import GraduationRequirements from './GraduationRequirements';
import MajorRequirements from './MajorRequirements';
import CourseDisplayCarousel from './CourseDisplayCarousel';
import axios from 'axios';


// First, define CoraChat as a separate component outside of MajorTracker
const CoraChat = ({ 
  darkMode, 
  paperBgColor, 
  textColor, 
  inputBgColor, 
  borderColor,
  coraQuery,
  setCoraQuery,
  coraResponse,
  isLoading,
  error,
  handleCoraSubmit 
}) => {
  return (
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

      {/* Display CORA's response */}
      {coraResponse && (
        <div 
          className="rounded-lg p-4 mb-4 text-sm" 
          style={{ background: darkMode ? '#333333' : '#E5E7EB', color: textColor }}
        >
          {coraResponse}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div 
          className="rounded-lg p-4 mb-4 text-sm text-red-500"
          style={{ background: darkMode ? '#331111' : '#FEE2E2' }}
        >
          {error}
        </div>
      )}

      {/* Input form */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          handleCoraSubmit();
        }}
        className="mt-4 relative"
      >
        <input
          type="text"
          placeholder="Ask about your degree requirements..."
          className="w-full p-3 pr-10 border rounded-lg"
          value={coraQuery}
          onChange={(e) => setCoraQuery(e.target.value)}
          disabled={isLoading}
          style={{
            background: inputBgColor,
            color: textColor,
            borderColor: borderColor,
          }}
        />
        <button
          type="submit"
          disabled={isLoading}
          className="absolute right-3 top-1/2 transform -translate-y-1/2"
          style={{ 
            color: darkMode ? '#B0B0B0' : '#6B7280',
            opacity: isLoading ? 0.5 : 1 
          }}
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

const MajorTracker = ({darkMode}) => {
  const [courseInput, setCourseInput] = useState("");
  const [completedCourses, setCompletedCourses] = useState([]);
  const [majorRequirements, setMajorRequirements] = useState({});
  const [courseData, setCourseData] = useState({});
  const [showGradReqs, setShowGradReqs] = useState(false);
  const [selectedMajor, setSelectedMajor] = useState("");
  const [availableMajors, setAvailableMajors] = useState([]);
  // Add this near your other state declarations at the top of MajorTracker
  const [chatHistory, setChatHistory] = useState([]);

  const db = getFirestore();
  const auth = getAuth();

  const [coraQuery, setCoraQuery] = useState("");
  const [coraResponse, setCoraResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
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


const [loading, setLoading] = useState(false);
const [answer, setAnswer] = useState('');
const [snackbarOpen, setSnackbarOpen] = useState(false);
const [question, setQuestion] = useState('');

const API_URL = 'https://cors-proxy.fringe.zone/https://langchain-chatbot-898344091520.us-central1.run.app/chat';


const handleCourseComplete = async (course) => {
  if (!auth.currentUser) return;
  
  const courseId = `${course.department}${course.course_number}`;
  
  try {
    // Update local state
    const updatedCourses = completedCourses.includes(courseId)
      ? completedCourses.filter(id => id !== courseId)
      : [...completedCourses, courseId];
    
    setCompletedCourses(updatedCourses);
    
    // Update Firebase with the new array
    await setDoc(doc(db, 'users', auth.currentUser.uid), {
      completedCourses: updatedCourses
    }, { merge: true });
    
  } catch (error) {
    console.error('Error saving course completion:', error);
    // Rollback on error
    setCompletedCourses(completedCourses);
  }
};
  
  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setAnswer('');
    
    try {
      const response = await axios.post(API_URL, 
        { query: question },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-requested-with': 'XMLHttpRequest'
          },
        }
      );
  
      console.log('API Response:', response.data);
      
      if (response.data && response.data.answer) {
        setAnswer(response.data.answer);
      } else {
        throw new Error('Unexpected response format');
      }
  
    } catch (error) {
      console.error('Error fetching answer:', error);
      setError('An error occurred while fetching the answer. Please try again.');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
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
  // parseRequirementString function for CORA
const parseRequirementString = (reqStr, majorDept) => {
  if (!reqStr || typeof reqStr !== 'string') return [];

  try {
      // Remove outer parentheses and trim
      const cleanStr = reqStr.replace(/^\(|\)$/g, '').trim();
      if (!cleanStr) return [];

      // Split & to extract pillars
      const groups = cleanStr.split('&')
          .map(r => r.trim())
          .filter(Boolean);

      // Parse each requirement group
      return groups.map(group => {
          // Prerequisites
          if (group.startsWith('@[')) {
              const prereqStr = group.slice(2, -1);
              const prereqs = prereqStr.split(',').map(p => {
                  if (p.includes('{')) {
                      return {
                          type: 'alternative',
                          options: p.slice(1, -1).split('|').map(o => o.trim())
                      };
                  }
                  return p.trim();
              });
              return {
                  type: 'prerequisites',
                  courses: prereqs,
                  description: 'Required foundation courses'
              };
          }

          // Specific courses with options (like #1{[030-089]|094|MATH≥020})
          if (group.includes('{')) {
              const match = group.match(/#(\d+){([^}]+)}/);
              if (match) {
                  const [, count, optionsStr] = match;
                  return {
                      type: 'specific',
                      count: parseInt(count),
                      department: majorDept,
                      options: optionsStr.split('|').map(o => o.trim()),
                      description: `${count} course from advanced options`
                  };
              }
          }

          // Course count requirements with range
          const rangeMatch = group.match(/#(\d+)\[(.+?)\]/);
          if (rangeMatch) {
              const [, count, range] = rangeMatch;
              const [start, end] = range.split('-').map(n => parseInt(n));
              
              return {
                  type: 'range',
                  count: parseInt(count),
                  department: majorDept,
                  start,
                  end,
                  description: `${count} courses from ${majorDept} ${start}-${end}`
              };
          }

          return null;
      }).filter(Boolean);
  } catch (error) {
      console.error('Error parsing requirements:', error);
      return [];
  }
};

// Inside CORA.jsx, this should be part of the useEffect that processes major requirements
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

              console.log(`Parsed requirements for ${majorCode}:`, requirements);

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

const handleCoraSubmit = async () => {
  // Don't do anything if the query is empty
  if (!coraQuery.trim()) return;
  
  setIsLoading(true);
  setError("");
  
  try {
    const response = await axios.post(
      API_URL,
      { query: coraQuery },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-requested-with': 'XMLHttpRequest'
        }
      }
    );
  
    console.log('API Response:', response.data);
  
    if (response.data && response.data.answer) {
      // Append the user's query and CORA's answer to chatHistory
      setChatHistory(prevHistory => [
        ...prevHistory,
        { role: 'user', text: coraQuery },
        { role: 'assistant', text: response.data.answer }
      ]);
      setCoraResponse(response.data.answer);
      setCoraQuery(""); // Clear the input after successful submission
    } else {
      throw new Error('Unexpected response format');
    }
  } catch (error) {
    console.error('Error:', error);
    setError('Failed to get a response. Please try again.');
  } finally {
    setIsLoading(false);
  }
};

const ChatHistorySidebar = ({ chatHistory, darkMode, textColor }) => {
  return (
    <div
      style={{
        height: '400px',
        overflowY: 'auto',
        padding: '1rem'
      }}
    >
      {chatHistory.map((msg, index) => (
        <div key={index} style={{ display: 'flex', marginBottom: '1rem' }}>
          {msg.role === 'user' ? (
            // User message (question) appears on the right
            <div
              style={{
                marginLeft: 'auto',
                background: darkMode ? '#2563EB' : '#D1E9FF',
                color: darkMode ? '#fff' : '#000',
                padding: '0.75rem 1rem',
                borderRadius: '1.25rem',
                maxWidth: '70%',
                textAlign: 'right'
              }}
            >
              {msg.text}
            </div>
          ) : (
            // Assistant message appears on the left
            <div
              style={{
                marginRight: 'auto',
                background: darkMode ? '#4B5563' : '#F3F4F6',
                color: textColor,
                padding: '0.75rem 1rem',
                borderRadius: '1.25rem',
                maxWidth: '70%',
                textAlign: 'left'
              }}
            >
              {msg.text}
            </div>
          )}
        </div>
      ))}
    </div>
  );
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
          <h1 className="text-xl font-semibold">CORA 1.0 (Course Recommendation Advisor)</h1>
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

            <div className="lg:col-span-1">
  <div className="rounded-lg shadow p-6" style={{ background: paperBgColor }}>
    {/* Conversation History & Chat Input in one container */}
    <div 
      style={{ 
        height: '400px', 
        overflowY: 'auto', 
        marginBottom: '1rem', 
        padding: '0.5rem',
        border: `1px solid ${borderColor}`,
        borderRadius: '0.5rem'
      }}
    >
      {chatHistory.map((msg, index) => (
        <div key={index} style={{ marginBottom: '1rem' }}>
          <strong>{msg.role === 'user' ? 'You' : 'CORA'}:</strong>
          <p style={{ margin: '0.5rem 0 0 0' }}>{msg.text}</p>
        </div>
      ))}
    </div>

    {/* Input form (placed below the conversation history) */}
    <form 
      onSubmit={(e) => {
        e.preventDefault();
        handleCoraSubmit();
      }}
      className="mt-4 relative"
    >
      <input
        type="text"
        placeholder="Ask about your degree requirements..."
        className="w-full p-3 pr-10 border rounded-lg"
        value={coraQuery}
        onChange={(e) => setCoraQuery(e.target.value)}
        disabled={isLoading}
        style={{
          background: inputBgColor,
          color: textColor,
          borderColor: borderColor,
        }}
      />
      <button
        type="submit"
        disabled={isLoading}
        className="absolute right-3 top-1/2 transform -translate-y-1/2"
        style={{ 
          color: darkMode ? '#B0B0B0' : '#6B7280',
          opacity: isLoading ? 0.5 : 1 
        }}
      >
        <Send className="w-5 h-5" />
      </button>
    </form>
  </div>
</div>



          </div>
        </div>
      </main>
    </div>
  );
};

export default MajorTracker;
