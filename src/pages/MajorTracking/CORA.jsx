import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getFirestore, collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { GraduationCap, User, Send,Loader2, Plus } from 'lucide-react';
import programData from './majors.json';
import GraduationRequirements from './GraduationRequirements';
import MajorRequirements from './MajorRequirements';
import RequirementManager from './RequirementManager';
import axios from 'axios';


const CoraChat = ({ 
  darkMode, paperBgColor, textColor, inputBgColor, borderColor,coraQuery,setCoraQuery,
  coraResponse,isLoading,error,handleCoraSubmit,conversation,handleNewChat
}) => {
  const conversationRef = useRef(null);

  // Demo questions array
  const demoQuestions = [
    "How hard is CS30?",
    "best professor in CS department?",
    "How hard is Gov5?",
    "How hard is organic chemistry?"
  ];

  // Auto-scroll the conversation container when new messages are added
  useEffect(() => {
    if (conversationRef.current) {
      conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
    }
  }, [conversation]);

  return (
    <div 
    className="flex flex-col rounded-lg shadow-xl p-8 w-full" // added w-full
    style={{ background: paperBgColor, minHeight: '600px' }} // adjust minHeight as needed
    >
      <div 
        className="flex items-center justify-between mb-6 border-b pb-3"
        style={{ borderColor: darkMode ? borderColor : '#ddd' }}
      >
        <h2 className="text-2xl font-bold" style={{ color: textColor }}>
          CORA 1.0
        </h2>
        <div className="flex items-center space-x-2">
          <GraduationCap className="w-8 h-8" style={{ color: darkMode ? '#B0B0B0' : '#6B7280' }} />
          <button 
            onClick={handleNewChat} 
            className="p-1 rounded-full hover:bg-gray-200"
          >
            <Plus className="w-6 h-6" style={{ color: darkMode ? '#B0B0B0' : '#6B7280' }} />
          </button>
        </div>
      </div>

      {/* Conversation History */}
      <div 
    ref={conversationRef}
    className="flex-1 overflow-y-auto mb-6 space-y-4 p-4 rounded-md"
    style={{ 
      background: darkMode ? paperBgColor : '#F3F4F6',
      border: darkMode ? `1px solid ${borderColor}` : '1px solid #ddd',
      maxHeight: '600px' // increased maxHeight from 500px to 600px (or remove if you want it fully fluid)
    }}
  >
  {conversation.length === 0 ? (
    <div className="text-center text-lg italic" style={{ color: textColor }}>
      Start the conversation...
    </div>
  ) : (
    conversation.map((message, index) => (
      <div 
        key={index} 
        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
      >
        {message.temporary ? (
          <div 
            className="flex items-center text-base italic"
            style={{
              color: darkMode ? '#9CA3AF' : '#6B7280',
              margin: '4px 0'
            }}
          >
            {message.text}
            <Loader2 className="w-5 h-5 ml-2 animate-spin" />
          </div>
        ) : (
          <div 
            className={`max-w-md px-6 py-3 rounded-lg shadow ${
              message.type === 'user'
                ? (darkMode ? 'bg-green-600 text-white' : 'bg-green-100 text-green-800')
                : (darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-800')
            }`}
          >
            {message.text}
          </div>
        )}
      </div>
    ))
  )}
</div>

{/* Demo Questions - only shown if no conversation has started */}
{conversation.length === 0 && (
  <div className="mb-4">
    {demoQuestions.map((question, index) => (
      <button 
        key={index}
        onClick={() => {
          // Directly feed the demo question into the chat:
          setCoraQuery(question);
          handleCoraSubmit();
        }}
        className="mr-2 mb-2 px-3 py-1 rounded-full bg-blue-500 text-white hover:bg-blue-600"
      >
        {question}
      </button>
    ))}
  </div>
)}


      
      {/* Error Message */}
      {error && (
        <div 
          className="mb-6 p-4 rounded-md text-base font-medium"
          style={{ 
            background: darkMode ? '#7F1D1D' : '#FEE2E2',
            color: darkMode ? '#FECACA' : '#991B1B'
          }}
        >
          {error}
        </div>
      )}

      {/* Input Form */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          handleCoraSubmit();
        }}
        className="relative"
      >
        <input
          type="text"
          placeholder="Ask about your degree requirements..."
          className="w-full rounded-full border px-6 py-3 pr-16 text-lg focus:outline-none focus:ring-2"
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
          className="absolute right-4 top-1/2 transform -translate-y-1/2 focus:outline-none"
          style={{ 
            color: darkMode ? '#B0B0B0' : '#6B7280',
            opacity: isLoading ? 0.5 : 1 
          }}
        >
          <Send className="w-7 h-7" />
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
  const db = getFirestore();
  const auth = getAuth();
  const [chatHistory, setChatHistory] = useState([]);

  const [chatName, setChatName] = useState("");

  const [conversation, setConversation] = useState([]);

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
const [requirementStatus, setRequirementStatus] = useState(null);
const [activeChatId, setActiveChatId] = useState("");


const [currentChatId, setCurrentChatId] = useState(() => Date.now().toString());

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://langchain-chatbot-898344091520.us-central1.run.app';


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

  // Load saved conversation on mount
useEffect(() => {
  const savedConversation = localStorage.getItem('coraConversation');
  if (savedConversation) {
    setConversation(JSON.parse(savedConversation));
  }
}, []);

// Save conversation to localStorage whenever it updates
useEffect(() => {
  localStorage.setItem('coraConversation', JSON.stringify(conversation));
}, [conversation]);
  
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

  useEffect(() => {
    if (!auth.currentUser) {
      console.log("User not logged in; conversation will not be saved.");
      return;
    }
    console.log("User is logged in:", auth.currentUser.uid);
    // Debounce saving by 500ms
    const timer = setTimeout(() => {
      const conversationDocRef = doc(db, "chatConversations", auth.currentUser.uid, "sessions", currentChatId);
      setDoc(conversationDocRef, { conversation, lastUpdated: new Date() }, { merge: true })
        .then(() => console.log("Conversation saved to Firestore"))
        .catch(err => console.error("Error saving conversation to Firestore:", err));
    }, 500);
    return () => clearTimeout(timer);
  }, [conversation, auth.currentUser, db, currentChatId]);
  
  
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

    const handleNewChat = () => {
      if (conversation.length > 0) {
        // Optionally ask for confirmation before saving the current conversation
        if (!window.confirm("Start a new chat? The current conversation will be saved.")) {
          return;
        }
        // 3. NEW: Save current conversation along with the chat name into chatHistory
    setChatHistory(prevHistory => [
      ...prevHistory,
      { sessionId: currentChatId, conversation, chatName }
    ]);
        // Save current conversation to history
        // setChatHistory(prevHistory => [
        //   ...prevHistory,
        //   { sessionId: currentChatId, conversation }
        // ]);
      }
      const newSessionId = Date.now().toString();
      setCurrentChatId(newSessionId);
      setConversation([]);
      // Optionally, do not clear localStorage so that old chats persist across refreshes.
      // localStorage.removeItem('coraConversation'); // Remove this line if you want to keep them.
      setCoraQuery("");
      setCoraResponse("");
      // 4. NEW: Reset chatName for the new chat session
      setChatName("");
    };

    
    useEffect(() => {
      const savedHistory = localStorage.getItem('chatHistory');
      if (savedHistory) {
        setChatHistory(JSON.parse(savedHistory));
      }
    }, []);

    
    useEffect(() => {
      localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
    }, [chatHistory]);
    
    
    
  
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

              const requirements = RequirementManager.parseRequirementString(
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
  if (!coraQuery.trim()) return;

  // 2. NEW: If this is the first user message, set the chat name using the current query
  if (!chatName && conversation.length === 0) {
    setChatName(coraQuery);
  }

  // Append the user's query to the conversation
  setConversation(prev => [...prev, { type: 'user', text: coraQuery }]);

  // Append a temporary "analyzing" message from CORA
  const loadingMessages = [
    "Analyzing your question...",
    "Let me think...",
    "Processing your query...",
    "Just a moment while I analyze your question..."
  ];
  const randomLoading = loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
  setConversation(prev => [...prev, { type: 'cora', text: randomLoading, temporary: true }]);

  // Start an interval to update the temporary message periodically
  const intervalId = setInterval(() => {
    setConversation(prev =>
      prev.map(msg =>
        msg.temporary
          ? { ...msg, text: loadingMessages[Math.floor(Math.random() * loadingMessages.length)] }
          : msg
      )
    );
  }, 1500);

  setIsLoading(true);
  setError("");

  try {
    const response = await axios.post(
      'https://cora-chatbot-898344091520.us-central1.run.app/api/chat',
      { query: coraQuery },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    // Clear the interval before processing the response
    clearInterval(intervalId);

    if (response.data && response.data.answer) {
      // Remove the temporary message and append the real answer
      setConversation(prev => {
        const withoutTemp = prev.filter(msg => !msg.temporary);
        return [...withoutTemp, { type: 'cora', text: response.data.answer }];
      });
      setCoraResponse(response.data.answer);
      setCoraQuery(""); // Clear input
    } else {
      throw new Error('Invalid response format from server');
    }
  } catch (error) {
    clearInterval(intervalId);
    console.error('Error details:', error);
    
    let errorMessage;
    if (error.code === 'ERR_NETWORK') {
      errorMessage = 'Unable to connect to CORA. Please try again later.';
    } else if (error.response?.status === 429) {
      errorMessage = 'Too many requests. Please wait a moment and try again.';
    } else if (error.response?.status === 500) {
      errorMessage = 'CORA is having trouble processing your request. Please try again.';
    } else {
      errorMessage = 'Something went wrong. Please try again.';
    }
    
    setError(errorMessage);
    // Remove the temporary message and append the error message
    setConversation(prev => {
      const withoutTemp = prev.filter(msg => !msg.temporary);
      return [...withoutTemp, { type: 'cora', text: errorMessage }];
    });
  } finally {
    setIsLoading(false);
  }
};



useEffect(() => {
  console.log('CORA Chat component mounted with API URL:', API_URL);
}, []);
  

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
                onCourseComplete={handleCourseComplete}
                courseData={courseData}
                darkMode={true}
                setRequirementStatus={setRequirementStatus}
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


// ... (calculateProgress remains unchanged)
const calculateProgress = useCallback(() => {
  if (!selectedMajor || !majorRequirements[selectedMajor]) return { major: 0, distributives: 0 };
  
  const requirements = majorRequirements[selectedMajor];
  const totalRequirements = requirements.pillars.reduce((total, pillar) => {
    if (pillar.type === 'prerequisites') return total + pillar.courses.length;
    if (pillar.type === 'specific') return total + (pillar.count || 1);  
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
    <option 
      key={major.code} 
      value={major.code} 
      disabled={!['CS', 'MATH'].includes(major.code)}
    >
      {major.name}{!['CS', 'MATH'].includes(major.code) ? ' - Coming Soon' : ''}
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


  <div 
  className="mb-4 p-4 rounded-lg shadow" 
  style={{ background: paperBgColor }}
>
  <h3 className="text-lg font-bold mb-2" style={{ color: textColor }}>
    Previous Chats
  </h3>
  {chatHistory.length === 0 ? (
    <p className="text-gray-400">No previous chats</p>
  ) : (
    <ul className="space-y-2">
      {chatHistory.map((chat, index) => (
        <li
          key={chat.sessionId}
          className={`cursor-pointer p-2 rounded-md transition-colors ${
            activeChatId === chat.sessionId 
              ? (darkMode ? "bg-blue-900" : "bg-blue-200")
              : "hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
          style={{ color: darkMode ? '#93C5FD' : '#2563EB' }}
          onClick={() => {
            setConversation(chat.conversation);
            setChatName(chat.chatName || "");
            setActiveChatId(chat.sessionId);
          }}
        >
          {chat.chatName
            ? chat.chatName
            : `Chat session ${index + 1} (ID: ${chat.sessionId})`}
        </li>
      ))}
    </ul>
  )}
</div>




  

  
    <CoraChat 
  darkMode={darkMode}
  paperBgColor={paperBgColor}
  textColor={textColor}
  inputBgColor={inputBgColor}
  borderColor={borderColor}
  coraQuery={coraQuery}
  setCoraQuery={setCoraQuery}
  coraResponse={coraResponse}
  isLoading={isLoading}
  error={error}
  handleCoraSubmit={handleCoraSubmit}
  conversation={conversation}
  handleNewChat={handleNewChat}   // now defined
/>


</div>

        </div>
      </main>
    </div>
  );
};

export default MajorTracker;