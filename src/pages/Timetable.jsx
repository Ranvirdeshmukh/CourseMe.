import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import LockIcon from '@mui/icons-material/Lock';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import SearchIcon from '@mui/icons-material/Search';
import {
    Alert, Box, Button, ButtonBase, CircularProgress, Collapse, Container,
    FormControl, IconButton, InputAdornment, InputLabel, MenuItem, Paper,
    Select, Snackbar, Table, TableBody, TableCell, TableContainer, TableHead, 
    TableRow, TextField, Tooltip, Typography, useMediaQuery,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { addDoc, arrayUnion, collection, doc, getDoc, getDocs, getFirestore, query, setDoc, updateDoc, where } from 'firebase/firestore';
import localforage from 'localforage';
import debounce from 'lodash/debounce';
import moment from 'moment-timezone';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { useAuth } from '../contexts/AuthContext';


const GoogleCalendarButton = styled(ButtonBase)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#f2f2f2',
  borderRadius: 6,
  height: '32px',
  padding: '0 12px',
  color: '#1f1f1f',
  fontFamily: 'Roboto, arial, sans-serif',
  fontSize: '0.82rem',
  letterSpacing: '0.25px',
  textTransform: 'none',
  boxShadow: '0 1px 2px 0 rgba(60, 64, 67, .30), 0 1px 3px 1px rgba(60, 64, 67, .15)',
  transition: 'all 0.2s ease',
  cursor: 'pointer',
  minWidth: '140px',
  '&:hover': {
    backgroundColor: '#e2e2e2',
    boxShadow: '0 2px 4px rgba(60, 64, 67, .3), 0 3px 6px rgba(60, 64, 67, .15)',
    transform: 'translateY(-1px)',
  },
  '&:active': {
    backgroundColor: '#d2d2d2',
    transform: 'translateY(0)',
  },
  '&:focus': {
    boxShadow: '0 0 0 3px rgba(66, 133, 244, 0.3)',
  },
  '& .icon': {
    marginRight: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  '& .text': {
    whiteSpace: 'nowrap',
    fontWeight: 500,
  },
}));

const GoogleIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 48 48"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fill="#EA4335"
      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
    />
    <path
      fill="#4285F4"
      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
    />
    <path
      fill="#FBBC05"
      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
    />
    <path
      fill="#34A853"
      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
    />
    <path fill="none" d="M0 0h48v48H0z" />
  </svg>
);

const Timetable = ({darkMode}) => {
  const [courses, setCourses] = useState([]); 
  const [filteredCourses, setFilteredCourses] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false); 
  const [popupMessageOpen, setPopupMessageOpen] = useState(false); // For pop-up blocker message
  const [showSelectedCourses, setShowSelectedCourses] = useState(false); 
  const { currentUser } = useAuth();
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [currentPage, setCurrentPage] = useState(1); // Pagination state
  const classesPerPage = 50; // Number of classes per page
  const isFallAddDropClosed = false;
  const [documentName, setDocumentName] = useState('');
  const [showFeatures, setShowFeatures] = useState(false);
  const [professorMappings, setProfessorMappings] = useState({});
  const [professorNames, setProfessorNames] = useState([]);
  const [professorMap, setProfessorMap] = useState(new Map());
  // const debouncedApplyFilters = useMemo(() => debounce(applyFilters, 300), [applyFilters]);

  var courseNameLong = ""
   // Add this near your other state declarations
   const CACHE_VERSION = 'springV1';

  const isMobile = useMediaQuery('(max-width:600px)');

  const totalPages = Math.ceil(filteredCourses.length / classesPerPage); // Total number of pages
  const navigate = useNavigate();

  const [sortConfig] = useState({ key: null, direction: 'ascending' });

  
  const mainBgColor = darkMode
  ? 'linear-gradient(90deg, #1C093F 0%, #0C0F33 100%)'
  : '#F9F9F9';

const paperBgColor = darkMode ? '#1C1F43' : '#FFFFFF';
const tableHeaderBgColor = darkMode ? '#333333' : '#f8f8f8';
const tableRowEvenBgColor = darkMode ? '#1C1F43' : '#FFFFFF';
const tableRowOddBgColor = darkMode ? '#24273c' : '#FAFBFC'; 
const textColor = darkMode ? '#FFFFFF' : '#1D1D1F';
const headerTextColor = darkMode ? '#FFFFFF' : '#000000';
const searchBgColor = darkMode ? '#0C0F33' : '#FFFFFF';
const borderColor = darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
const accentHoverBg = darkMode
  ? 'rgba(255, 255, 255, 0.08)'
  : 'rgba(0, 105, 62, 0.08)';

  const getSortedCourses = useCallback((courses) => {
    if (!sortConfig.key) return courses;

    return [...courses].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  }, [sortConfig]);

  const periodCodeToTiming = {
    "11": "MWF 11:30-12:35, Tu 12:15-1:05",
    "10": "MWF 10:10-11:15, Th 12:15-1:05",
    "2": "MWF 2:10-3:15, Th 1:20-2:10",
    "3A": "MW 3:30-5:20, M 5:30-6:20",
    "12": "MWF 12:50-1:55, Tu 1:20-2:10",
    "2A": "TuTh 2:25-4:15, W 5:30-6:20",
    "10A": "TuTh 10:10-12, F 3:30-4:20",
    "FS": "FSP; Foreign Study Program",
    "ARR": "Arrange",
    "9L": "MWF 8:50-9:55, Th 9:05-9:55",
    "9S": "MTuWThF 9:05-9:55",
    "OT": "Th 2:00 PM-4:00 PM",
    "3B": "TuTh 4:30-6:20, F 4:35-5:25",
    "6A": "MTh 6:30-8:20, Tu 6:30-7:20",
    "6B": "W 6:30-9:30, Tu 7:30-8:20",
    "8S": "MTThF 7:45-8:35, Wed 7:45-8:35",
    "LSA": "Language Study Abroad",
  };

  // Move this up before any useEffects
const applyFilters = useCallback(() => {
  let filtered = [...courses];

  if (searchTerm) {
    const searchLower = searchTerm.toLowerCase();
    filtered = filtered.filter(
      (course) =>
        (course.title?.toLowerCase()?.includes(searchLower) ?? false) ||
        (course.subj?.toLowerCase()?.includes(searchLower) ?? false) ||
        (course.instructor?.toLowerCase()?.includes(searchLower) ?? false)
    );
  }

  if (selectedSubject) {
    filtered = filtered.filter((course) => course.subj === selectedSubject);
  }

  setFilteredCourses(filtered);
  setCurrentPage(1);
}, [courses, searchTerm, selectedSubject]);

// Then create debouncedApplyFilters after applyFilters is defined
const debouncedApplyFilters = useMemo(
  () => debounce(applyFilters, 300),
  [applyFilters]
);

// Now your useEffects can use these functions
useEffect(() => {
  debouncedApplyFilters();
  return () => {
    debouncedApplyFilters.cancel();
  };
}, [debouncedApplyFilters]);

  useEffect(() => {
    fetchFirestoreCourses();
    fetchUserTimetable(); 
  }, [currentUser]); 

  useEffect(() => {
    applyFilters(); 
  }, [searchTerm, selectedSubject]);

  useEffect(() => {
    fetchProfessorData();
  }, []);

  const ProfessorCell = memo(({ instructor }) => {
    const navigate = useNavigate();
    const professorId = instructor ? instructor.split(',')[0].trim().replace(/\s+/g, '_') : null;
  
    const handleClick = useCallback((e) => {
      e.preventDefault();
      e.stopPropagation();
      if (professorId) {
        navigate(`/professors/${professorId}`);
        window.scrollTo(0, 0);
      }
    }, [professorId, navigate]);
  
    return (
        <TableCell
          onClick={handleClick}
          sx={{
            // Always remove underline by default
            textDecoration: 'none',
            // If clickable, use brand color; otherwise normal text
            color: professorId
              ? (darkMode ? '#007AFF' : '#571ce0')
              : (darkMode ? '#FFFFFF' : '#1D1D1F'),
            padding: '8px 16px',
            fontWeight: 400,
            fontSize: '0.81rem',
            textAlign: 'left',
            cursor: professorId ? 'pointer' : 'default',
            height: '48px',
            lineHeight: '1.2',
            transition: 'color 0.3s ease, text-decoration 0.3s ease',
            // Only underline on hover if there's a valid professorId
            '&:hover': professorId
              ? { textDecoration: 'underline' }
              : {},
          }}
        
      >
        {instructor}
      </TableCell>
    );
    
  });

  const fetchProfessorData = async () => {
    try {
      // Check cache first
      const cachedProfessors = await localforage.getItem('cachedProfessors');
      const cacheTimestamp = await localforage.getItem('professorsCacheTimestamp');
      const now = Date.now();
  
      if (cachedProfessors && cacheTimestamp && (now - cacheTimestamp) < 5184000000) {
        setProfessorNames(cachedProfessors);
        // Create mapping for faster lookups
        const mapping = new Map(
          cachedProfessors.map(prof => [
            prof.displayName.toLowerCase(),
            prof.id
          ])
        );
        setProfessorMap(mapping);
        return;
      }
  
      const db = getFirestore();
      const professorsSnapshot = await getDocs(collection(db, 'professor'));
      const professorsData = professorsSnapshot.docs.map(doc => ({
        id: doc.id,
        displayName: doc.data().name || doc.id.replace('_', ' ')
      }));
  
      // Update cache
      await localforage.setItem('cachedProfessors', professorsData);
      await localforage.setItem('professorsCacheTimestamp', now);
  
      setProfessorNames(professorsData);
      // Create mapping for faster lookups
      const mapping = new Map(
        professorsData.map(prof => [
          prof.displayName.toLowerCase(),
          prof.id
        ])
      );
      setProfessorMap(mapping);
    } catch (error) {
      console.error('Error fetching professor data:', error);
    }
  };

  // Replace your existing fetchFirestoreCourses function with this updated version
  const fetchFirestoreCourses = async () => {
    try {
      // First check if we have cached data
      const cachedCourses = await localforage.getItem('cachedCourses');
      const cacheTimestamp = await localforage.getItem('cacheTimestamp');
      const cachedVersion = await localforage.getItem('cacheVersion');
      const now = Date.now();
  
      console.log('Cache status:', {
        hasCachedCourses: !!cachedCourses,
        cacheTimestamp,
        cachedVersion,
        currentVersion: CACHE_VERSION
      });
  
      // Check if cache is valid
      const isCacheValid = 
        cachedCourses && 
        cacheTimestamp && 
        cachedVersion === CACHE_VERSION && 
        (now - cacheTimestamp) < 5184000000;
  
      if (isCacheValid) {
        console.log('Using cached data');
        setCourses(cachedCourses);
        setFilteredCourses(cachedCourses);
        extractSubjects(cachedCourses);
        setLoading(false);
        return;
      }
  
      console.log('Cache invalid or expired, fetching new data');
  
      // If cache version doesn't match, clear everything
      if (cachedVersion !== CACHE_VERSION) {
        console.log('Version mismatch, clearing cache');
        await localforage.clear();
      }
  
      // Fetch new data
      const db = getFirestore();
      const coursesSnapshot = await getDocs(collection(db, 'springTimetable'));
      const coursesData = coursesSnapshot.docs.map((doc) => {
        const periodCode = doc.data()['Period Code'];
        return {
          documentName: doc.id,
          subj: doc.data().Subj,
          num: doc.data().Num,
          sec: doc.data().Section,
          title: doc.data().Title,
          period: periodCode,
          timing: periodCodeToTiming[periodCode] || 'Unknown Timing',
          room: doc.data().Room,
          building: doc.data().Building,
          instructor: doc.data().Instructor,
        };
      });
  
      // Store the new data in cache
      await Promise.all([
        localforage.setItem('cachedCourses', coursesData),
        localforage.setItem('cacheTimestamp', now),
        localforage.setItem('cacheVersion', CACHE_VERSION)
      ]);
  
      console.log('New data cached');
      setCourses(coursesData);
      setFilteredCourses(coursesData);
      extractSubjects(coursesData);
      setLoading(false);
  
    } catch (error) {
      console.error('Error fetching Firestore courses:', error);
      setError(error);
      setLoading(false);
    }
  };

  const fetchCourseData = async (dept, course) => {
    const db = getFirestore();
    try {
      // Query the courses collection for the matching document
      const q = query(
        collection(db, "courses"), 
        where("department", "==", dept), 
        where("course_number", "==", course)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const docRef = querySnapshot.docs[0].ref;
        const docId = querySnapshot.docs[0].id;
        courseNameLong = docId;
  
        // Create a reference to the specific document
        const specificDocRef = doc(db, "courses", docId);
        
        // Update the document with the new field
        await updateDoc(specificDocRef, {
          "25W": true
        });
        
        console.log("Updated document with 25W field: " + courseNameLong);
      } else {
        console.log("No matching documents in Firebase.");
      }
    } catch (error) {
      console.error("Error fetching/updating course data from Firebase:", error);
    }
  };

  const normalizeCourseNumber = (number) => {
    if (number.includes('.')) {
      const [integerPart, decimalPart] = number.split('.');
      return `${integerPart.padStart(3, '0')}.${decimalPart}`;
    } else {
      return number.padStart(3, '0');
    }
  };

  const handleCourseClick = async (course) => {
    console.log('Received course object:', JSON.stringify(course, null, 2));
    const department = course.subj;
    let courseNumber = normalizeCourseNumber(course.num);
    console.log(department + " department")
    console.log("department number " + courseNumber);
    await fetchCourseData(department, courseNumber);
    console.log("course name" + courseNameLong)
    navigate(`/departments/${department}/courses/${courseNameLong}`);
  };
  
  const fetchUserTimetable = async () => {
    try {
      const db = getFirestore();
      // Query the subcollection "springCoursestaken" under the current user
      const springCoursesRef = collection(db, 'users', currentUser.uid, 'springCoursestaken');
      const snapshot = await getDocs(springCoursesRef);
      // Map each document to an object that includes its document id (so you can remove it later)
      const coursesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSelectedCourses(coursesData);
    } catch (error) {
      console.error("Error fetching user's spring courses:", error);
    }
  };
  
  
  const handleNotifyDrop = async (course) => {
    try {
      const db = getFirestore();
      const formattedNumber = course.num.includes('.') 
        ? course.num 
        : course.num.padStart(3, '0');
      const formattedSection = course.sec.padStart(2, '0');
      
      console.log("department", course.subj);
      console.log("number", formattedNumber);
      console.log("section", formattedSection);
      
      const timetableRequestsRef = collection(db, 'timetable-requests');
      const q = query(
        timetableRequestsRef,
        where("department", "==", course.subj),
        where("number", "==", formattedNumber),
        where("section", "==", formattedSection)
      );
  
      const querySnapshot = await getDocs(q);
      let timetableRequestId;
      
      if (!querySnapshot.empty) {
        // Document exists, check if user is already in the array
        const docRef = doc(db, 'timetable-requests', querySnapshot.docs[0].id);
        timetableRequestId = querySnapshot.docs[0].id;
        const docData = querySnapshot.docs[0].data();
        const users = docData.users || [];
        
        const userExists = users.some(user => user.email === currentUser.email);
        
        if (!userExists) {
          // User not in array, add them
          await updateDoc(docRef, {
            users: arrayUnion({
              email: currentUser.email,
              open: false
            })
          });
          
          // Add to user's notifications array
          const userRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userRef);
          
          const newNotification = {
            requestId: timetableRequestId,
            department: course.subj,
            number: formattedNumber,
            section: formattedSection,
            // timestamp: serverTimestamp()
          };
  
          if (!userDoc.exists()) {
            // Create new user document with notifications array
            await setDoc(userRef, {
              notifications: [newNotification]
            });
          } else {
            // User document exists, use arrayUnion to add to existing array
            // or create new array if it doesn't exist
            await updateDoc(userRef, {
              notifications: arrayUnion(newNotification)
            });
          }
          
          setSnackbarOpen(true);
        } else {
          // User already in array, notify them
          alert('You are already on the notification list for this course.');
          return;
        }
      } else {
        // Document doesn't exist, create a new one
        const newDocRef = doc(timetableRequestsRef);
        timetableRequestId = newDocRef.id;
        
        await setDoc(newDocRef, {
          department: course.subj,
          number: formattedNumber,
          section: formattedSection,
          users: [{
            email: currentUser.email,
            open: false
          }]
        });
  
        // Add to user's notifications array
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        const newNotification = {
          requestId: timetableRequestId,
          department: course.subj,
          number: formattedNumber,
          section: formattedSection,
          // timestamp: serverTimestamp()
        };
  
        if (!userDoc.exists()) {
          // Create new user document with notifications array
          await setDoc(userRef, {
            notifications: [newNotification]
          });
        } else {
          // User document exists, use arrayUnion to add to existing array
          // or create new array if it doesn't exist
          await updateDoc(userRef, {
            notifications: arrayUnion(newNotification)
          });
        }
        
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error('Error setting up drop notification:', error);
      alert('Failed to set up drop notification. Please try again.');
    }
  };
  
  // // Helper function to remove notification (can be used when needed)
  // const removeNotification = async (requestId) => {
  //   try {
  //     const userRef = doc(db, 'users', currentUser.uid);
  //     const userDoc = await getDoc(userRef);
      
  //     if (userDoc.exists()) {
  //       const notifications = userDoc.data().notifications || [];
  //       const updatedNotifications = notifications.filter(
  //         notification => notification.requestId !== requestId
  //       );
        
  //       await updateDoc(userRef, {
  //         notifications: updatedNotifications
  //       });
  //     }
  //   } catch (error) {
  //     console.error('Error removing notification:', error);
  //     throw error;
  //   }
  // };


  const extractSubjects = (courses) => {
    const subjectsSet = new Set(courses.map((course) => course.subj));
    setSubjects([...subjectsSet]);
  };



  const handleSearch = (event) => {
    const term = event.target.value;
    setSearchTerm(term);
  };

  const handleSubjectChange = (event) => {
    const subject = event.target.value;
    setSelectedSubject(subject);
  };

  const handleAddCourse = async (course) => {
    if (navigator.vibrate) {
      navigator.vibrate(200);
    }
  
    // Check if the course is already added (using a unique property such as title)
    if (selectedCourses.some((c) => c.title === course.title)) {
      alert('This course is already added.');
      return;
    }
  
    if (selectedCourses.length >= 3) {
      alert('You can only select up to 3 courses.');
      return;
    }
  
    try {
      const db = getFirestore();
      // Get a reference to the subcollection "springCoursestaken" under the current user
      const springCoursesRef = collection(db, 'users', currentUser.uid, 'springCoursestaken');
      // Add the new course to the subcollection
      const docRef = await addDoc(springCoursesRef, course);
      // Update the state to include the newly added course (with its new document id)
      setSelectedCourses([...selectedCourses, { id: docRef.id, ...course }]);
    } catch (error) {
      console.error('Error saving spring course:', error);
    }
  };
  

  const handleRemoveCourse = async (course) => {
    const updatedCourses = selectedCourses.filter((c) => c.title !== course.title);
    setSelectedCourses(updatedCourses);

    try {
      const db = getFirestore();
      const userRef = doc(collection(db, 'users'), currentUser.uid);
      await updateDoc(userRef, { fallCoursestaken: updatedCourses });
    } catch (error) {
      console.error('Error removing course:', error);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handlePopupMessageClose = () => {
    setPopupMessageOpen(false);
  };

  const handleAddToCalendar = (course) => {
    const baseUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
    const details = `&details=${encodeURIComponent(`Instructor: ${course.instructor}`)}`;
    const location = `&location=${encodeURIComponent(`${course.building}, ${course.room}`)}`;

    const events = getEventTiming(course.period, course.title);

    let popupBlocked = false;

    events.forEach((event) => {
      const text = `&text=${encodeURIComponent(event.title)}`;
      const startDateTime = `&dates=${event.startDateTime}/${event.endDateTime}`;
      const recur = event.recurrence ? `&recur=${event.recurrence}` : ''; 

      const url = `${baseUrl}${text}${details}${location}${startDateTime}${recur}&sf=true&output=xml`;

      const newWindow = window.open(url, '_blank');

      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        popupBlocked = true;
      }
    });

    if (popupBlocked) {
      setPopupMessageOpen(true);
    }
  };

  const getEventTiming = (periodCode, courseTitle) => {
    const timing = periodCodeToTiming[periodCode];

    if (!timing) return [];

    const eventStartDate = '20250331'; 
    const eventEndDate = '20250609'; 
    const timezone = 'America/New_York';

    const timingParts = timing.split(', ');
    const events = [];

    timingParts.forEach((part) => {
      const [days, times] = part.trim().split(' '); 
      const [startTime, endTime] = times.split('-'); 

      const startMoment = parseTime(eventStartDate, startTime, timezone);
      const endMoment = parseTime(eventStartDate, endTime, timezone);

      const startDateTime = startMoment.format('YYYYMMDDTHHmmssZ');
      const endDateTime = endMoment.format('YYYYMMDDTHHmmssZ');

      const recurrence = createRecurrenceRule(days, eventEndDate);

      const eventTitle = `${courseTitle} (${days} ${startTime}-${endTime})`;

      events.push({
        startDateTime,
        endDateTime,
        recurrence,
        title: eventTitle,
      });
    });

    return events;
  };
  
  const parseTime = (date, timeStr, timezone) => {
    let [hour, minute] = timeStr.split(':').map(Number);

    if (hour >= 1 && hour <= 6) {
      hour += 12;
    }

    if (hour === 12 && timeStr.includes('12:')) {
      hour = 12;
    }

    return moment.tz(`${date} ${hour}:${minute}`, 'YYYYMMDD HH:mm', timezone);
  };

  const createRecurrenceRule = (days, endDate) => {
    const dayMap = {
      M: 'MO',
      T: 'TU',
      W: 'WE',
      Th: 'TH',
      F: 'FR',
      S: 'SA',
      Su: 'SU',
    };

    const dayPattern = /(Th|Su|M|T|W|F|S)/g;
    const matchedDays = days.match(dayPattern);

    if (!matchedDays) {
      console.error('Invalid day format:', days);
      return '';
    }

    const dayList = matchedDays.map((day) => dayMap[day]).join(',');

    return `RRULE:FREQ=WEEKLY;BYDAY=${dayList};UNTIL=${endDate}T235959Z`;
  };

  const paginatedCourses = useMemo(() => {
    const sortedCourses = getSortedCourses(filteredCourses);
    const startIndex = (currentPage - 1) * classesPerPage;
    const endIndex = startIndex + classesPerPage;
    return sortedCourses.slice(startIndex, endIndex);
  }, [filteredCourses, currentPage, getSortedCourses]);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prevPage) => prevPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prevPage) => prevPage - 1);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        // Use the same gradient or background color logic as AllClassesPage
        backgroundColor: darkMode
          ? 'linear-gradient(90deg, #1C093F 0%, #0C0F33 100%)'
          : '#F9F9F9',
        color: darkMode ? '#FFFFFF' : '#333333', // A global text color
        transition: 'background-color 0.3s ease, color 0.3s ease',
        padding: '40px 20px',
        fontFamily: 'SF Pro Display, sans-serif',
      }}
    >
      <Container
        maxWidth={false}
        sx={{
          padding: '0 20px',
          margin: '0 auto',
          maxWidth: '1600px',
        }}
      >
        {/* "Your Winter 2025 Classes" Section */}
        {showSelectedCourses && (
          <Typography
            variant="h2"
            align="left"
            sx={{
              fontWeight: 700,
              fontSize: '2.5rem',
              // Header text can conditionally be your "headerTextColor"
              color: darkMode ? '#FFFFFF' : '#34495e',
              marginBottom: '8px',
              marginTop: '10px',
              fontFamily: 'SF Pro Display, sans-serif',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
              transition: 'color 0.3s ease',
            }}
          >
    Your Spring 2025 Courses.
    </Typography>
        )}
  
        {showSelectedCourses && selectedCourses.length > 0 && (
          <TableContainer
            component={Paper}
            sx={{
              // Paper background
              backgroundColor: darkMode ? '#1C1F43' : '#FFFFFF',
              marginTop: '10px',
              boxShadow: darkMode
                ? '0 6px 16px rgba(255, 255, 255, 0.1)'
                : '0 4px 12px rgba(0, 0, 0, 0.1)',
              borderRadius: '12px',
              overflowX: 'auto',
              maxWidth: '100%',
              transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
            }}
          >
            <Table sx={{ minWidth: isMobile ? '100%' : '650px' }}>
              <TableHead
                sx={{
                  backgroundColor: darkMode ? '#333333' : '#F8F8F8',
                  position: 'sticky',
                  top: 0,
                  zIndex: 1,
                  transition: 'background-color 0.3s ease',
                }}
              >
                <TableRow>
                  {[
                    'Subject',
                    'Number',
                    'Title',
                    'Section',
                    'Timing',
                    'Room',
                    'Building',
                    'Instructor',
                    'Add to Calendar',
                    'Notify When Available',
                    'Remove',
                  ].map((header, index) => (
                    <TableCell
                      key={index}
                      sx={{
                        color: darkMode ? '#FFFFFF' : '#333333',
                        textAlign: 'left',
                        fontWeight: 700,
                        fontSize: '1rem',
                        padding: '16px 12px',
                        borderBottom: '2px solid #E0E0E0',
                        // If you want a different border color in dark mode:
                        borderColor: darkMode ? '#444444' : '#E0E0E0',
                        backgroundColor: darkMode ? '#333333' : '#F8F8F8',
                        boxShadow:
                          index === 0
                            ? darkMode
                              ? '0 2px 4px rgba(255, 255, 255, 0.05)'
                              : '0 2px 4px rgba(0, 0, 0, 0.05)'
                            : 'none',
                        fontFamily: 'SF Pro Display, sans-serif',
                        transition: 'background-color 0.3s ease, color 0.3s ease',
                      }}
                    >
                      {header}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
  
              <TableBody>
                {selectedCourses.map((course, index) => {
                  const rowBackground =
                    index % 2 === 0
                      ? darkMode
                        ? '#1C1F43'
                        : '#FFFFFF'
                      : darkMode
                      ? '#24273c'
                      : '#F9F9F9';
  
                  return (
                    <TableRow
                      key={index}
                      sx={{
                        backgroundColor: rowBackground,
                        transition: 'background-color 0.3s ease',
                        '&:hover': {
                          backgroundColor: darkMode ? '#2a2a2a' : '#E5E5EA',
                        },
                        cursor: 'default',
                      }}
                    >
                      {/* Subject */}
                      <TableCell
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCourseClick(course);
                        }}
                        sx={{
                          color: darkMode ? '#BB86FC' : '#571ce0', // or keep your custom highlight
                          padding: '10px',
                          fontWeight: 500,
                          fontSize: '0.95rem',
                          textAlign: 'left',
                          cursor: 'pointer',
                          textDecoration: 'none',
                          transition: 'color 0.3s ease',
                          '&:hover': {
                            textDecoration: 'underline',
                          },
                          fontFamily: 'SF Pro Display, sans-serif',
                        }}
                      >
                        {course.subj}
                      </TableCell>
  
                      {/* Number */}
                      <TableCell
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCourseClick(course);
                        }}
                        sx={{
                          color: darkMode ? '#BB86FC' : '#571ce0',
                          padding: '10px',
                          fontWeight: 500,
                          fontSize: '0.95rem',
                          textAlign: 'left',
                          cursor: 'pointer',
                          textDecoration: 'none',
                          transition: 'color 0.3s ease',
                          '&:hover': {
                            textDecoration: 'underline',
                          },
                          fontFamily: 'SF Pro Display, sans-serif',
                        }}
                      >
                        {course.num}
                      </TableCell>
  
                      {/* Title */}
                      <TableCell
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCourseClick(course);
                        }}
                        sx={{
                          color: darkMode ? '#BB86FC' : '#571ce0',
                          padding: '10px',
                          fontWeight: 500,
                          fontSize: '0.95rem',
                          textAlign: 'left',
                          cursor: 'pointer',
                          textDecoration: 'none',
                          transition: 'color 0.3s ease',
                          '&:hover': {
                            textDecoration: 'underline',
                          },
                          fontFamily: 'SF Pro Display, sans-serif',
                        }}
                      >
                        {course.title}
                      </TableCell>
  
                      {/* Section */}
                      <TableCell
                        sx={{
                          color: darkMode ? '#FFFFFF' : '#1D1D1F',
                          padding: '10px',
                          fontWeight: 400,
                          fontSize: '0.95rem',
                          textAlign: 'left',
                          transition: 'color 0.3s ease',
                          fontFamily: 'SF Pro Display, sans-serif',
                        }}
                      >
                        {course.sec}
                      </TableCell>
  
                      {/* Timing */}
                      <TableCell
                        sx={{
                          color: darkMode ? '#FFFFFF' : '#1D1D1F',
                          padding: '10px',
                          fontWeight: 400,
                          fontSize: '0.95rem',
                          textAlign: 'left',
                          transition: 'color 0.3s ease',
                          fontFamily: 'SF Pro Display, sans-serif',
                        }}
                      >
                        {course.timing}
                      </TableCell>
  
                      {/* Room */}
                      <TableCell
                        sx={{
                          color: darkMode ? '#FFFFFF' : '#1D1D1F',
                          padding: '10px',
                          fontWeight: 400,
                          fontSize: '0.95rem',
                          textAlign: 'left',
                          transition: 'color 0.3s ease',
                          fontFamily: 'SF Pro Display, sans-serif',
                        }}
                      >
                        {course.room}
                      </TableCell>
  
                      {/* Building */}
                      <TableCell
                        sx={{
                          color: darkMode ? '#FFFFFF' : '#1D1D1F',
                          padding: '10px',
                          fontWeight: 400,
                          fontSize: '0.95rem',
                          textAlign: 'left',
                          transition: 'color 0.3s ease',
                          fontFamily: 'SF Pro Display, sans-serif',
                        }}
                      >
                        {course.building}
                      </TableCell>
  
                      {/* Instructor */}
                      <TableCell
                        sx={{
                          color: darkMode ? '#FFFFFF' : '#1D1D1F',
                          padding: '10px',
                          fontWeight: 400,
                          fontSize: '0.95rem',
                          textAlign: 'left',
                          transition: 'color 0.3s ease',
                          fontFamily: 'SF Pro Display, sans-serif',
                        }}
                      >
                        {course.instructor}
                      </TableCell>
  
                      {/* Add to Calendar Button */}
                      <TableCell
                        sx={{
                          padding: '8px 12px',
                          textAlign: 'left',
                          height: '48px',
                          verticalAlign: 'middle',
                        }}
                      >
                        {course.period !== 'ARR' && course.period !== 'FS' && (
                          <GoogleCalendarButton onClick={() => handleAddToCalendar(course)}>
                            <div className="icon">
                              <GoogleIcon />
                            </div>
                            <span className="text">Add to Calendar</span>
                          </GoogleCalendarButton>
                        )}
                      </TableCell>
  
                      {/* Notify when Available Button */}
                      <TableCell
                        sx={{
                          padding: '12px',
                          textAlign: 'left',
                        }}
                      >
                        {isFallAddDropClosed ? (
                          <Tooltip title="Winter add/drop is closed. Notifications will be available during Spring 25 add/drop.">
                            <IconButton>
                              <LockIcon color="disabled" />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Tooltip title="Notify me if someone drops this class. Spring notifications will start from tomorrow morning 8am">
                            <IconButton onClick={() => handleNotifyDrop(course)}>
                              <NotificationsActiveIcon sx={{ color: '#007AFF' }} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
  
                      {/* Remove Button */}
                      <TableCell
                        sx={{
                          padding: '12px',
                          textAlign: 'left',
                        }}
                      >
                        <IconButton onClick={() => handleRemoveCourse(course)}>
                          <DeleteIcon sx={{ color: '#FF3B30' }} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
  
        {showSelectedCourses && selectedCourses.length === 0 && (
          <Typography sx={{ marginBottom: '20px', color: darkMode ? '#FFFFFF' : '#1D1D1F' }}>
            Haven&apos;t added your Spring 2025 timetable on CourseMe? Add now!
          </Typography>
        )}
     
  
       {/* Filters and Controls */}
<Box
  sx={{
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    gap: '16px',
  }}
>
  <Typography
    variant="h3"
    align="left"
    sx={{
      fontWeight: 600,
      // Conditionally set text color
      color: darkMode ? '#FFFFFF' : '#000000',
      marginBottom: '20px',
      marginTop: '30px',
      fontFamily: 'SF Pro Display, sans-serif',
      transition: 'color 0.3s ease',
    }}
  >
    Spring 2025 Timetable.
  </Typography>

  <TextField
    variant="outlined"
    placeholder="Search Courses"
    value={searchTerm}
    onChange={handleSearch}
    sx={{
      width: isMobile ? '100%' : '300px',
      height: '40px',
      borderRadius: '20px',
      // Adjust shadow for dark/light if desired
      boxShadow: darkMode
        ? '0px 4px 12px rgba(255, 255, 255, 0.1)'
        : '0px 4px 10px rgba(0, 0, 0, 0.1)',
      marginTop: '25px',
      transition: 'box-shadow 0.3s ease, background-color 0.3s ease',
      '& .MuiOutlinedInput-root': {
        '& fieldset': {
          // Keep brand color for focus ring or adjust if desired
          borderColor: '#00693E',
        },
        '&:hover fieldset': {
          borderColor: '#00693E',
        },
        '&.Mui-focused fieldset': {
          borderColor: '#00693E',
        },
        borderRadius: '20px',
        height: '40px',
        backgroundColor: darkMode ? '#0C0F33' : '#FFFFFF',
        transition: 'background-color 0.3s ease',
      },
    }}
    InputProps={{
      startAdornment: (
        <InputAdornment position="start">
          <SearchIcon sx={{ color: '#00693E' }} />
        </InputAdornment>
      ),
      style: {
        color: darkMode ? '#FFFFFF' : '#000000', // Text color inside the input
      },
    }}
  />

  <FormControl
    variant="outlined"
    sx={{
      minWidth: isMobile ? '100%' : 200,
      marginTop: '25px',
    }}
  >
    <InputLabel
      sx={{
        // Label color (dark/light)
        color: darkMode ? '#FFFFFF' : '#000000',
        '&.Mui-focused': {
          color: '#00693E', 
        },
        transform: 'translate(14px, 8px) scale(1)',
        '&[data-shrink="true"]': {
          transform: 'translate(14px, -9px) scale(0.75)',
        },
        transition: 'color 0.3s ease',
      }}
    >
      Subject
    </InputLabel>
    <Select
      value={selectedSubject}
      onChange={handleSubjectChange}
      label="Subject"
      sx={{
        borderRadius: '20px',
        height: '40px',
        backgroundColor: darkMode ? '#0C0F33' : 'transparent',
        // Keep brand or adjust for dark mode
        color: darkMode ? '#FFFFFF' : '#000000',
        fontWeight: '600',
        fontSize: '16px',
        fontFamily: 'SF Pro Display, sans-serif',
        textTransform: 'none',
        border: '1px solid #00693E',
        boxShadow: darkMode
          ? '0px 4px 12px rgba(255, 255, 255, 0.1)'
          : '0px 4px 10px rgba(0, 0, 0, 0.1)',
        transition: 'background-color 0.3s ease, color 0.3s ease',
        '& .MuiOutlinedInput-root': {
          '& fieldset': {
            // If you want the border color to remain brand or adapt to dark mode, adjust here
            borderColor: darkMode ? '#FFFFFF' : '#000000',
          },
          '&:hover fieldset': {
            borderColor: darkMode ? '#FFFFFF' : '#000000',
          },
          '&.Mui-focused fieldset': {
            borderColor: darkMode ? '#FFFFFF' : '#000000',
          },
          backgroundColor: 'transparent',
          height: '40px',
        },
        '& .MuiSelect-select': {
          paddingTop: '8px',
          paddingBottom: '8px',
          display: 'flex',
          alignItems: 'center',
        },
        '& .MuiSelect-icon': {
          color: '#00693E', // Keep brand color for dropdown icon
        },
        '&:hover': {
          backgroundColor: darkMode
            ? 'rgba(255, 255, 255, 0.1)'
            : 'rgba(0, 105, 62, 0.1)',
        },
        '&:focus': {
          outline: 'none',
          boxShadow: darkMode
            ? '0 0 0 4px rgba(255, 255, 255, 0.2)'
            : '0 0 0 4px rgba(0, 105, 62, 0.5)',
        },
      }}
    >
      <MenuItem value="">
        <em>All Subjects</em>
      </MenuItem>
      {subjects.map((subject, index) => (
        <MenuItem key={index} value={subject}>
          {subject}
        </MenuItem>
      ))}
    </Select>
  </FormControl>

  <Button
    variant="contained"
    sx={{
      marginTop: isMobile ? '20px' : '25px',
      padding: '10px 20px',
      borderRadius: '20px',
      height: '40px',
      // Keep brand color usage or adapt if needed
      backgroundColor: darkMode ? 'transparent' : 'transparent',
      color: '#00693E',
      fontWeight: '600',
      fontSize: '16px',
      fontFamily: 'SF Pro Display, sans-serif',
      textTransform: 'none',
      border: '1px solid #00693E',
      boxShadow: darkMode
        ? '0px 4px 12px rgba(255, 255, 255, 0.1)'
        : '0px 4px 10px rgba(0, 0, 0, 0.1)',
      transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
      '&:hover': {
        backgroundColor: darkMode
          ? 'rgba(255, 255, 255, 0.1)'
          : 'rgba(0, 105, 62, 0.1)',
        borderColor: '#00693E',
      },
      '&:focus': {
        outline: 'none',
        boxShadow: darkMode
          ? '0 0 0 4px rgba(255, 255, 255, 0.2)'
          : '0 0 0 4px rgba(0, 105, 62, 0.5)',
      },
    }}
    onClick={() => setShowSelectedCourses(!showSelectedCourses)}
  >
    {showSelectedCourses ? 'Hide My Courses' : 'Show My Courses'}
  </Button>
</Box>

<Box sx={{ position: 'relative' }}>
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      cursor: 'pointer',
      marginBottom: '16px',
      marginTop: '24px',
      padding: '12px 16px',
      // Background for dark/light
      backgroundColor: darkMode
        ? 'rgba(255, 255, 255, 0.06)'
        : 'rgba(0, 105, 62, 0.04)',
      borderRadius: '8px',
      // Border can remain brand or adapt
      border: darkMode
        ? '1px solid rgba(255, 255, 255, 0.2)'
        : '1px solid rgba(0, 105, 62, 0.1)',
      transition: 'all 0.2s ease',
      '&:hover': {
        backgroundColor: darkMode
          ? 'rgba(255, 255, 255, 0.1)'
          : 'rgba(0, 105, 62, 0.08)',
      },
    }}
    onClick={() => setShowFeatures(!showFeatures)}
  >
    <Typography
      variant="h6"
      sx={{
        fontFamily: 'SF Pro Display, sans-serif',
        // Keep brand color #00693E or adapt if you prefer a different color in dark mode
        color: '#00693E',
        fontWeight: 600,
        fontSize: '1.1rem',
        flex: 1,
      }}
    >
      AI-Powered Course Planning
    </Typography>
    <KeyboardArrowDownIcon
      sx={{
        color: '#00693E',
        transform: showFeatures ? 'rotate(180deg)' : 'none',
        transition: 'transform 0.3s ease',
      }}
    />
  </Box>

  <Collapse in={showFeatures}>
    <Box
      component="ul"
      sx={{
        margin: '0',
        paddingLeft: '20px',
        marginBottom: '20px',
        // Ternary text color
        color: darkMode ? '#FFFFFF' : '#1D1D1F',
        fontFamily: 'SF Pro Display, sans-serif',
        transition: 'color 0.3s ease',
      }}
    >
      <li>Sync your timetable to Google Calendar in one click</li>
      <li>Get instant notifications when a course spot opens up</li>
      <li>Send templated emails to professors in one click.</li>
      <li>Navigate to the course reviews in one click.</li>
    </Box>
  </Collapse>
</Box>

{/* Main "Fall '24 Timetable" Table */}
{loading ? (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '60vh',
    }}
  >
    <CircularProgress sx={{ color: '#007AFF' }} size={60} />
    <Typography
      variant="h6"
      sx={{
        marginTop: '20px',
        fontFamily: 'SF Pro Display, sans-serif',
        color: darkMode ? '#FFFFFF' : 'black',
        textAlign: 'center',
        padding: '0 20px',
        transition: 'color 0.3s ease',
      }}
    >
      Great things take time—please hold on while we fetch the latest data for you!
    </Typography>
  </Box>
) : error ? (
  <Alert severity="error">Error loading courses: {error.message}</Alert>
) : filteredCourses.length > 0 ? (
  <>
    <TableContainer
      component={Paper}
      sx={{
        // Match the design you liked
        backgroundColor: darkMode ? '#1C1F43' : '#FFFFFF',
        marginTop: '10px',
        boxShadow: darkMode
          ? '0 6px 16px rgba(255, 255, 255, 0.1)'
          : '0 2px 8px rgba(0, 0, 0, 0.06)',
        borderRadius: '12px',
        overflowX: 'auto',
        maxWidth: '100%',
        transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
        border: darkMode
          ? '1px solid rgba(187, 134, 252, 0.2)'
          : '1px solid rgba(0, 105, 62, 0.1)',
        '&:hover': {
          boxShadow: darkMode
            ? '0 3px 10px rgba(255, 255, 255, 0.2)'
            : '0 3px 10px rgba(0, 0, 0, 0.08)',
        },
      }}
    >
      <Table sx={{ minWidth: isMobile ? '100%' : '650px' }}>
        <TableHead
          sx={{
            backgroundColor: darkMode ? '#333333' : '#F8F8F8',
            position: 'sticky',
            top: 0,
            zIndex: 1,
            transition: 'background-color 0.3s ease',
          }}
        >
          <TableRow>
            {[
              'Subject',
              'Number',
              'Title',
              'Section',
              // Removed "Period"
              'Timing',
              'Room',
              'Building',
              'Instructor',
              'Add to Calendar',
              'Notify When Available',
              'Add',
            ].map((header, index) => (
              <TableCell
                key={index}
                sx={{
                  color: darkMode ? '#FFFFFF' : '#333333',
                  textAlign: 'left',
                  fontWeight: 700,
                  fontSize: '1rem',
                  padding: '16px 12px',
                  borderBottom: '2px solid #E0E0E0',
                  borderColor: darkMode ? '#444444' : '#E0E0E0',
                  backgroundColor: darkMode ? '#333333' : '#F8F8F8',
                  // Box shadow for the first header cell, if desired
                  boxShadow:
                    index === 0
                      ? darkMode
                        ? '0 2px 4px rgba(255, 255, 255, 0.05)'
                        : '0 2px 4px rgba(0, 0, 0, 0.05)'
                      : 'none',
                  fontFamily: 'SF Pro Display, sans-serif',
                  transition: 'background-color 0.3s ease, color 0.3s ease',
                }}
              >
                {header}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>

        <TableBody>
          {paginatedCourses.map((course, index) => {
            // Even/odd row background
            const rowBackground =
              index % 2 === 0
                ? darkMode
                  ? '#1C1F43'
                  : '#FFFFFF'
                : darkMode
                ? '#24273c'
                : '#F9F9F9';

            return (
              <TableRow
                key={index}
                sx={{
                  backgroundColor: rowBackground,
                  transition: 'background-color 0.3s ease',
                  '&:hover': {
                    backgroundColor: darkMode ? '#2a2a2a' : '#E5E5EA',
                  },
                  cursor: 'default',
                }}
              >
                {/* Subject */}
                <TableCell
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCourseClick(course);
                  }}
                  sx={{
                    color: darkMode ? '#BB86FC' : '#571ce0',
                    padding: '10px',
                    fontWeight: 500,
                    fontSize: '0.95rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    transition: 'color 0.3s ease',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                    fontFamily: 'SF Pro Display, sans-serif',
                  }}
                >
                  {course.subj}
                </TableCell>

                {/* Number */}
                <TableCell
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCourseClick(course);
                  }}
                  sx={{
                    color: darkMode ? '#BB86FC' : '#571ce0',
                    padding: '10px',
                    fontWeight: 500,
                    fontSize: '0.95rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    transition: 'color 0.3s ease',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                    fontFamily: 'SF Pro Display, sans-serif',
                  }}
                >
                  {course.num}
                </TableCell>

                {/* Title */}
                <TableCell
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCourseClick(course);
                  }}
                  sx={{
                    color: darkMode ? '#BB86FC' : '#571ce0',
                    padding: '10px',
                    fontWeight: 500,
                    fontSize: '0.95rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    transition: 'color 0.3s ease',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                    fontFamily: 'SF Pro Display, sans-serif',
                  }}
                >
                  {course.title}
                </TableCell>

                {/* Section */}
                <TableCell
                  sx={{
                    color: darkMode ? '#FFFFFF' : '#1D1D1F',
                    padding: '10px',
                    fontWeight: 400,
                    fontSize: '0.95rem',
                    textAlign: 'left',
                    transition: 'color 0.3s ease',
                    fontFamily: 'SF Pro Display, sans-serif',
                  }}
                >
                  {course.sec}
                </TableCell>

                {/* Timing */}
                <TableCell
                  sx={{
                    color: darkMode ? '#FFFFFF' : '#1D1D1F',
                    padding: '10px',
                    fontWeight: 400,
                    fontSize: '0.95rem',
                    textAlign: 'left',
                    transition: 'color 0.3s ease',
                    fontFamily: 'SF Pro Display, sans-serif',
                  }}
                >
                  {course.timing}
                </TableCell>

                {/* Room */}
<TableCell
  sx={{
    color: darkMode ? '#FFFFFF' : '#1D1D1F',
    padding: '10px',
    fontWeight: 400,
     // Adds ellipsis (...) if text is too long
    fontSize: '0.95rem',
    textAlign: 'left',
    transition: 'color 0.3s ease',
    fontFamily: 'SF Pro Display, sans-serif',
  }}
>
  {course.room || 'N/A'}
</TableCell>

{/* Building */}
<TableCell
  sx={{
    color: darkMode ? '#FFFFFF' : '#1D1D1F',
    padding: '10px',
    fontWeight: 400,
      // Adds ellipsis (...) if text is too long
    fontSize: '0.95rem',
    textAlign: 'left',
    transition: 'color 0.3s ease',
    fontFamily: 'SF Pro Display, sans-serif',
  }}
>
  {course.building || 'N/A'}
</TableCell>


                {/* Instructor */}
                <TableCell
                  sx={{
                    color: darkMode ? '#FFFFFF' : '#1D1D1F',
                    padding: '10px',
                    fontWeight: 400,
                     
                    fontSize: '0.95rem',
                    textAlign: 'left',
                    transition: 'color 0.3s ease',
                    fontFamily: 'SF Pro Display, sans-serif',
                  }}
                >
                  
                   <ProfessorCell instructor={course.instructor} />
                </TableCell>
                {/* ProfessorCell for Instructor (existing logic intact) */}
               

                {/* Add to Calendar Button */}
                <TableCell
                  sx={{
                    padding: '8px 12px',
                    textAlign: 'left',
                    height: '48px',
                    verticalAlign: 'middle',
                  }}
                >
                  {course.period !== 'ARR' && course.period !== 'FS' && (
                    <GoogleCalendarButton onClick={() => handleAddToCalendar(course)}>
                      <div className="icon">
                        <GoogleIcon />
                      </div>
                      <span className="text">Add to Calendar</span>
                    </GoogleCalendarButton>
                  )}
                </TableCell>

                {/* Notify When Available Button */}
                <TableCell
                  sx={{
                    padding: '12px',
                    textAlign: 'left',
                  }}
                >
                  {isFallAddDropClosed ? (
                    <Tooltip title="Spring add/drop notifications will open on  8:00 AM Mon, Mar 31">
                      <IconButton>
                        <LockIcon color="disabled" />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <Tooltip title="Notify me if someone drops this class">
                      <IconButton onClick={() => handleNotifyDrop(course)}>
                        <NotificationsActiveIcon sx={{ color: '#007AFF' }} />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>

                {/* Add Course Button */}
                <TableCell
                  sx={{
                    padding: '12px',
                    textAlign: 'left',
                  }}
                >
                  <IconButton
                    onClick={() => handleAddCourse(course)}
                    disabled={selectedCourses.length >= 3}
                  >
                    {selectedCourses.some((c) => c.title === course.title) ? (
                      <CheckCircleIcon sx={{ color: '#34C759' }} />
                    ) : (
                      <AddCircleOutlineIcon
                        sx={{
                          color: selectedCourses.length >= 3 ? '#999999' : '#007AFF',
                        }}
                      />
                    )}
                  </IconButton>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>

    {/* Pagination Controls */}
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: '20px',
      }}
    >
      <IconButton
        onClick={handlePreviousPage}
        disabled={currentPage === 1}
        sx={{
          marginRight: '10px',
          color: '#007AFF',
          '&.Mui-disabled': {
            color: darkMode ? '#555555' : '#999999',
          },
        }}
      >
        <ArrowBackIcon />
      </IconButton>

      <Typography
        variant="body1"
        sx={{
          color: darkMode ? '#FFFFFF' : '#1D1D1F',
          transition: 'color 0.3s ease',
        }}
      >
        Page {currentPage} of {totalPages}
      </Typography>

      <IconButton
        onClick={handleNextPage}
        disabled={currentPage === totalPages}
        sx={{
          marginLeft: '10px',
          color: '#007AFF',
          '&.Mui-disabled': {
            color: darkMode ? '#555555' : '#999999',
          },
        }}
      >
        <ArrowForwardIcon />
      </IconButton>
    </Box>
  </>
) : (
  <Typography sx={{ color: darkMode ? '#FFFFFF' : '#1D1D1F' }}>
    No courses available
  </Typography>
)}

      </Container>

      {/* Snackbars */}
{/* Notification Snackbar */}
<Snackbar
  open={snackbarOpen}
  autoHideDuration={6000}
  onClose={handleSnackbarClose}
  anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
>
  <Alert 
    onClose={handleSnackbarClose} 
    severity="success"
    sx={{
      width: '100%',
      backgroundColor: darkMode ? '#1C1F43' : '#E6F4EA',
      color: darkMode ? '#FFFFFF' : '#1D1D1F',
      '& .MuiAlert-icon': {
        color: '#34C759'
      }
    }}
  >
    Thank you, you will be notified if someone drops the class.
  </Alert>
</Snackbar>

{/* Pop-up Blocked Snackbar */}
      <Snackbar
        open={popupMessageOpen}
        autoHideDuration={8000}
        onClose={handlePopupMessageClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handlePopupMessageClose} 
          severity="warning"
          sx={{
            width: '100%',
            backgroundColor: darkMode ? '#332D41' : '#FFF4E5',
            color: darkMode ? '#FFFFFF' : '#1D1D1F',
            '& .MuiAlert-icon': {
              color: '#FF9500'
            }
          }}
        >
          Pop-up blocked! Please click on the blocked content icon in your browser's address bar to allow pop-ups.
        </Alert>
      </Snackbar>

      <Snackbar
        open={popupMessageOpen}
        autoHideDuration={8000}
        onClose={handlePopupMessageClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handlePopupMessageClose} severity="warning">
          Pop-up blocked! Please click on the blocked content icon in your browser's address bar to allow pop-ups.
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Timetable;
