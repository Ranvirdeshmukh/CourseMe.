import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import LockIcon from '@mui/icons-material/Lock';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import SearchIcon from '@mui/icons-material/Search';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PrintIcon from '@mui/icons-material/Print';
import TableChartIcon from '@mui/icons-material/TableChart';
import CloseIcon from '@mui/icons-material/Close';
import Fab from '@mui/material/Fab';
import Modal from '@mui/material/Modal';
import Zoom from '@mui/material/Zoom';
import {
    Alert, Box, Button, ButtonBase, CircularProgress, Collapse, Container,
    FormControl, IconButton, InputAdornment, InputLabel, MenuItem, Paper,
    Select, Snackbar, Table, TableBody, TableCell, TableContainer, TableHead, 
    TableRow, TextField, Tooltip, Typography, useMediaQuery,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { addDoc, arrayUnion, collection, doc, getDoc, getDocs, getFirestore, query, setDoc, updateDoc, where, deleteDoc } from 'firebase/firestore';
import localforage from 'localforage';
import debounce from 'lodash/debounce';
import moment from 'moment-timezone';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { useAuth } from '../contexts/AuthContext';
import { periodCodeToTiming, addToGoogleCalendar } from './timetablepages/googleCalendarLogic';
import { addToAppleCalendar } from './timetablepages/appleCalendarLogic';
import { ProfessorCell } from './ProfessorCell';
import ScheduleVisualization from './timetablepages/ScheduleVisualization';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import Slide from '@mui/material/Slide';
import Divider from '@mui/material/Divider';
import AddIcon from '@mui/icons-material/Add';


const GoogleCalendarButton = styled(ButtonBase)(({ theme, darkMode }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: darkMode ? 'rgba(66, 133, 244, 0.12)' : 'rgba(255, 255, 255, 0.8)',
  borderRadius: '50%',
  height: '44px',
  width: '44px',
  padding: 0,
  color: darkMode ? '#8ab4f8' : '#4285F4',
  fontFamily: 'Google Sans, Roboto, arial, sans-serif',
  fontSize: '0.85rem',
  fontWeight: 500,
  boxShadow: darkMode 
    ? '0 1px 2px rgba(0, 0, 0, 0.2)'
    : '0 1px 2px rgba(60, 64, 67, 0.1)',
  transition: 'all 0.2s ease',
  cursor: 'pointer',
  border: darkMode ? '1px solid rgba(66, 133, 244, 0.3)' : '1px solid rgba(218, 220, 224, 0.8)',
  '&:hover': {
    backgroundColor: darkMode ? 'rgba(66, 133, 244, 0.2)' : 'rgba(66, 133, 244, 0.08)',
    boxShadow: darkMode 
      ? '0 2px 4px rgba(0, 0, 0, 0.3)'
      : '0 1px 3px rgba(60, 64, 67, 0.2)',
    transform: 'translateY(-1px)',
  },
  '&:active': {
    backgroundColor: darkMode ? 'rgba(66, 133, 244, 0.3)' : 'rgba(66, 133, 244, 0.12)',
    transform: 'translateY(0)',
  },
  '&:focus': {
    outline: 'none',
    boxShadow: darkMode 
      ? '0 0 0 2px rgba(138, 180, 248, 0.5)'
      : '0 0 0 2px rgba(66, 133, 244, 0.3)',
  },
  '& .icon': {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
}));

// Update Apple Calendar Button style to match Google's elegant styling but be more compact
const AppleCalendarButton = styled(ButtonBase)(({ theme, darkMode }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.03)',
  borderRadius: '50%',
  height: '44px',
  width: '44px',
  padding: 0,
  color: darkMode ? '#ffffff' : '#1d1d1f',
  fontFamily: 'SF Pro Text, -apple-system, BlinkMacSystemFont, sans-serif',
  fontSize: '0.85rem',
  boxShadow: 'none',
  transition: 'all 0.2s ease',
  cursor: 'pointer',
  border: darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.06)',
  backdropFilter: darkMode ? 'blur(20px)' : 'none',
  '&:hover': {
    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)',
    transform: 'scale(1.02)',
  },
  '&:active': {
    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.08)',
    transform: 'scale(0.98)',
  },
  '&:focus': {
    outline: 'none',
    boxShadow: darkMode 
      ? '0 0 0 2px rgba(255, 255, 255, 0.3)'
      : '0 0 0 2px rgba(0, 0, 0, 0.06)',
  },
  '& .icon': {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: darkMode ? 1 : 0.9,
  },
}));

const GoogleIcon = () => (
  <svg
    width="24"
    height="24"
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

// Add Apple icon component
const AppleIcon = () => (
  <svg 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
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
  const isFallAddDropClosed = true;
  const [documentName, setDocumentName] = useState('');
  const [showFeatures, setShowFeatures] = useState(false);
  const [professorMappings, setProfessorMappings] = useState({});
  const [professorNames, setProfessorNames] = useState([]);
  const [professorMap, setProfessorMap] = useState(new Map());
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'calendar'
  const [miniScheduleOpen, setMiniScheduleOpen] = useState(false);
  const [miniScheduleExpanded, setMiniScheduleExpanded] = useState(true);
  const [openPopupMessage, setOpenPopupMessage] = useState(false);
  const [popupMessage, setPopupMessage] = useState({ message: '', type: 'info' });
  const db = getFirestore();
  
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

  const debouncedApplyFilters = useMemo(
    () => debounce(applyFilters, 300),
    [applyFilters]
  );

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
    // Check if the course is already in the timetable
    const alreadyAdded = selectedCourses.some(
      (c) => c.subj === course.subj && c.num === course.num && c.sec === course.sec
    );

    if (alreadyAdded) {
      setPopupMessage({
        message: `${course.subj} ${course.num} is already in your timetable.`,
        type: 'warning',
      });
      setOpenPopupMessage(true);
      return;
    }

    // Ensure we have the period and location information
    const courseToAdd = { 
      ...course,
      period: course.period || "ARR",  // Default to "ARR" if period is missing
    };

    // If period is missing, try to fetch it from the database
    if (!course.period) {
      try {
        const courseDoc = await getDoc(doc(db, 'courses', `${course.subj}${course.num}`));
        if (courseDoc.exists()) {
          const courseData = courseDoc.data();
          // Find the section data for this specific section
          const sectionData = courseData.sections?.find(s => s.sec === course.sec);
          if (sectionData?.period) {
            courseToAdd.period = sectionData.period;
          }
          if (sectionData?.building) {
            courseToAdd.building = sectionData.building;
          }
          if (sectionData?.room) {
            courseToAdd.room = sectionData.room;
          }
        }
      } catch (error) {
        console.error("Error fetching course period:", error);
      }
    }

    setSelectedCourses([...selectedCourses, courseToAdd]);

    // Add to Firestore
    const userEmail = localStorage.getItem('userEmail');
    if (userEmail) {
      try {
        await updateDoc(doc(db, 'users', userEmail), {
          selectedCourses: arrayUnion(courseToAdd),
        });
      } catch (error) {
        console.error('Error updating Firestore:', error);
      }
    }
    
    setPopupMessage({
      message: `${course.subj} ${course.num} has been added to your timetable.`,
      type: 'success',
    });
    setOpenPopupMessage(true);
  };
  

  const handleRemoveCourse = async (course) => {
    const updatedCourses = selectedCourses.filter((c) => c.title !== course.title);
    setSelectedCourses(updatedCourses);

    try {
      const db = getFirestore();
      // Delete the document from the springCoursestaken subcollection
      if (course.id) {
        const courseDocRef = doc(db, 'users', currentUser.uid, 'springCoursestaken', course.id);
        await deleteDoc(courseDocRef);
      } else {
        console.error('Course ID not found, cannot remove from database');
      }
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
    // Use the imported function
    addToGoogleCalendar(
      course, 
      () => setSnackbarOpen(true),
      () => setPopupMessageOpen(true),
      setTimeout
    );
  };

  // Add handler for Apple Calendar
  const handleAddToAppleCalendar = (course) => {
    addToAppleCalendar(course);
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

  // Add print handler for weekly schedule
  const handlePrint = () => {
    const printContent = document.getElementById('schedule-to-print');
    if (!printContent) return;
    
    const printCSS = `
      <style>
        @media print {
          body { background-color: white; }
          .schedule-print-container { padding: 20px; }
          .schedule-title { 
            font-size: 24px; 
            font-weight: bold; 
            margin-bottom: 20px;
            text-align: center;
          }
          .schedule-subtitle {
            font-size: 16px;
            margin-bottom: 10px;
            text-align: center;
          }
        }
      </style>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Spring 2025 Schedule</title>
          ${printCSS}
        </head>
        <body>
          <div class="schedule-print-container">
            <div class="schedule-title">Spring 2025 Weekly Schedule</div>
            <div class="schedule-subtitle">Dartmouth College</div>
            ${printContent.innerHTML}
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const handleOpenMiniSchedule = () => {
    setMiniScheduleOpen(true);
  };
  
  const handleCloseMiniSchedule = () => {
    setMiniScheduleOpen(false);
  };
  
  const toggleMiniScheduleSize = () => {
    setMiniScheduleExpanded(!miniScheduleExpanded);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: darkMode
          ? 'linear-gradient(90deg, #1C093F 0%, #0C0F33 100%)'
          : '#F9F9F9',
        color: darkMode ? '#FFFFFF' : '#333333',
        transition: 'background-color 0.3s ease, color 0.3s ease',
        padding: '40px 20px',
        fontFamily: 'SF Pro Display, sans-serif',
        position: 'relative', // For floating button positioning
      }}
    >
      <Container
        maxWidth={false}
        sx={{
          padding: '0 20px',
          margin: '0 auto',
          maxWidth: '1600px',
          transition: 'all 0.3s ease',
          paddingRight: miniScheduleOpen ? {xs: '20px', md: miniScheduleExpanded ? '52%' : '370px'} : '20px',
        }}
      >
        {/* Add more visual help text when panel is open */}
        {miniScheduleOpen && courses.length > 0 && (
          <Alert
            severity="info"
            sx={{
              mb: 2,
              backgroundColor: darkMode ? 'rgba(187, 134, 252, 0.1)' : 'rgba(33, 150, 243, 0.1)',
              color: darkMode ? '#BB86FC' : '#1976d2'
            }}
          >
            Click "Add" next to courses to see them appear in your weekly schedule →
          </Alert>
        )}

        {/* "Your Spring 2025 Classes" Section */}
        {showSelectedCourses && (
          <Typography
            variant="h2"
            align="left"
            sx={{
              fontWeight: 700,
              fontSize: '2.5rem',
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
          <>
            {/* View Toggle */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2
            }}>
              <Box sx={{
                display: 'flex',
                bgcolor: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                borderRadius: '12px',
                p: '4px',
                mb: 2,
              }}>
                <Button
                  startIcon={<TableChartIcon />}
                  onClick={() => setViewMode('table')}
                  sx={{
                    backgroundColor: viewMode === 'table' 
                      ? (darkMode ? '#BB86FC' : '#00693E') 
                      : 'transparent',
                    color: viewMode === 'table'
                      ? (darkMode ? '#000000' : '#FFFFFF')
                      : (darkMode ? '#FFFFFF' : '#000000'),
                    fontWeight: 600,
                    mr: 1,
                    p: '8px 16px',
                    borderRadius: '8px',
                    '&:hover': {
                      backgroundColor: viewMode === 'table'
                        ? (darkMode ? '#9A66EA' : '#00522F')
                        : (darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)')
                    }
                  }}
                >
                  List View
                </Button>
                <Button
                  startIcon={<CalendarMonthIcon />}
                  onClick={() => setViewMode('calendar')}
                  sx={{
                    backgroundColor: viewMode === 'calendar' 
                      ? (darkMode ? '#BB86FC' : '#00693E') 
                      : 'transparent',
                    color: viewMode === 'calendar'
                      ? (darkMode ? '#000000' : '#FFFFFF')
                      : (darkMode ? '#FFFFFF' : '#000000'),
                    fontWeight: 600,
                    p: '8px 16px',
                    borderRadius: '8px',
                    '&:hover': {
                      backgroundColor: viewMode === 'calendar'
                        ? (darkMode ? '#9A66EA' : '#00522F')
                        : (darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)')
                    }
                  }}
                >
                  Calendar View
                </Button>
              </Box>
              
              {viewMode === 'calendar' && (
                <Button
                  variant="outlined"
                  startIcon={<PrintIcon />}
                  onClick={handlePrint}
                  sx={{
                    color: darkMode ? '#BB86FC' : '#00693E',
                    borderColor: darkMode ? '#BB86FC' : '#00693E',
                    mb: 2,
                    '&:hover': {
                      backgroundColor: darkMode ? 'rgba(187, 134, 252, 0.08)' : 'rgba(0, 105, 62, 0.08)',
                      borderColor: darkMode ? '#9A66EA' : '#00522F',
                    },
                  }}
                >
                  Print Schedule
                </Button>
              )}
            </Box>

            {/* Table View */}
            {viewMode === 'table' && (
              <TableContainer
                component={Paper}
                sx={{
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
                        'Notifications',
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
                              width: '150px', // Add fixed width
                              maxWidth: '150px', // Add max width
                              whiteSpace: 'normal', // Allow text wrapping
                            }}
                          >
                            <ProfessorCell instructor={course.instructor} darkMode={darkMode} />
                          </TableCell>
  
                          {/* Add to Calendar Button */}
                          <TableCell
                            sx={{
                              padding: '8px 12px',
                              textAlign: 'left',
                              height: '48px',
                              verticalAlign: 'middle',
                              width: '160px',
                            }}
                          >
                            {course.period !== 'ARR' && course.period !== 'FS' && (
                              <Box sx={{ 
                                display: 'flex', 
                                gap: '12px',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}>
                                <Tooltip title="Add to Google Calendar" arrow placement="top">
                                  <GoogleCalendarButton darkMode={darkMode} onClick={() => handleAddToCalendar(course)}>
                                    <div className="icon">
                                      <GoogleIcon />
                                    </div>
                                  </GoogleCalendarButton>
                                </Tooltip>
                                
                                <Tooltip title="Add to Apple Calendar" arrow placement="top">
                                  <AppleCalendarButton darkMode={darkMode} onClick={() => handleAddToAppleCalendar(course)}>
                                    <div className="icon">
                                      <AppleIcon />
                                    </div>
                                  </AppleCalendarButton>
                                </Tooltip>
                              </Box>
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
            
            {/* Calendar View */}
            {viewMode === 'calendar' && (
              <Box id="schedule-to-print">
                <ScheduleVisualization 
                  selectedCourses={selectedCourses} 
                  darkMode={darkMode} 
                  onRemoveCourse={handleRemoveCourse}
                />
                
                <Box sx={{ marginTop: '32px' }}>
                  <Typography variant="h6" sx={{ color: darkMode ? '#FFFFFF' : '#000000', marginBottom: '16px' }}>
                    Understanding Your Schedule
                  </Typography>
                  <Paper
                    sx={{
                      backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                      padding: '16px',
                      borderRadius: '8px',
                    }}
                  >
                    <Typography variant="body1" sx={{ marginBottom: '8px', color: darkMode ? '#FFFFFF' : '#000000' }}>
                      • Regular class meetings are shown in solid colors
                    </Typography>
                    <Typography variant="body1" sx={{ marginBottom: '8px', color: darkMode ? '#FFFFFF' : '#000000' }}>
                      • X-Hours are displayed with reduced opacity
                    </Typography>
                    <Typography variant="body1" sx={{ marginBottom: '8px', color: darkMode ? '#FFFFFF' : '#000000' }}>
                      • Time conflicts are highlighted with red borders
                    </Typography>
                    <Typography variant="body1" sx={{ color: darkMode ? '#FFFFFF' : '#000000' }}>
                      • Hover over any course block to see detailed information
                    </Typography>
                  </Paper>
                </Box>
              </Box>
            )}
          </>
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
      boxShadow: darkMode
        ? '0px 4px 12px rgba(255, 255, 255, 0.1)'
        : '0px 4px 10px rgba(0, 0, 0, 0.1)',
      marginTop: '25px',
      transition: 'box-shadow 0.3s ease, background-color 0.3s ease',
      '& .MuiOutlinedInput-root': {
        '& fieldset': {
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
        color: darkMode ? '#FFFFFF' : '#000000',
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
          color: '#00693E',
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
      backgroundColor: darkMode
        ? 'rgba(255, 255, 255, 0.06)'
        : 'rgba(0, 105, 62, 0.04)',
      borderRadius: '8px',
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
              'Timing',
              'Room',
              'Building',
              'Instructor',
              'Add to Calendar',
              'Notifications',
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
                    width: '150px', // Add fixed width
                    maxWidth: '150px', // Add max width
                    whiteSpace: 'normal', // Allow text wrapping
                  }}
                >
                  <ProfessorCell instructor={course.instructor} darkMode={darkMode} />
                </TableCell>
               

                {/* Add to Calendar Button */}
                <TableCell
                  sx={{
                    padding: '8px 12px',
                    textAlign: 'left',
                    height: '48px',
                    verticalAlign: 'middle',
                    width: '160px',
                  }}
                >
                  {course.period !== 'ARR' && course.period !== 'FS' && (
                    <Box sx={{ 
                      display: 'flex', 
                      gap: '12px',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Tooltip title="Add to Google Calendar" arrow placement="top">
                        <GoogleCalendarButton darkMode={darkMode} onClick={() => handleAddToCalendar(course)}>
                          <div className="icon">
                            <GoogleIcon />
                          </div>
                        </GoogleCalendarButton>
                      </Tooltip>
                      
                      <Tooltip title="Add to Apple Calendar" arrow placement="top">
                        <AppleCalendarButton darkMode={darkMode} onClick={() => handleAddToAppleCalendar(course)}>
                          <div className="icon">
                            <AppleIcon />
                          </div>
                        </AppleCalendarButton>
                      </Tooltip>
                    </Box>
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
                    onClick={() => {
                      const isAlreadyAdded = selectedCourses.some((c) => c.title === course.title);
                      if (isAlreadyAdded) {
                        handleRemoveCourse(course);
                      } else {
                        handleAddCourse(course);
                      }
                    }}
                    disabled={selectedCourses.length >= 3 && !selectedCourses.some((c) => c.title === course.title)}
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

        {/* Add this note near the top when there are no courses selected */}
        {!showSelectedCourses || selectedCourses.length === 0 ? (
          <Alert 
            severity="info" 
            sx={{ 
              marginBottom: '20px', 
              backgroundColor: darkMode ? 'rgba(187, 134, 252, 0.1)' : 'rgba(33, 150, 243, 0.1)',
              color: darkMode ? '#BB86FC' : '#1976d2',
              '& .MuiAlert-icon': {
                color: darkMode ? '#BB86FC' : '#1976d2',
              }
            }}
          >
            Press the <strong>Add</strong> button next to courses to build your schedule. Use the Quick Calendar Preview in the bottom right to check for time conflicts.
          </Alert>
        ) : null}
      </Container>

      {/* Floating Action Button for Mini Schedule */}
      {!miniScheduleOpen && (
        <Zoom in={true}>
          <Fab
            color="primary"
            aria-label="quick schedule"
            sx={{
              position: 'fixed',
              bottom: 32,
              right: 32,
              backgroundColor: darkMode ? '#BB86FC' : '#00693E',
              color: darkMode ? '#000000' : '#FFFFFF',
              '&:hover': {
                backgroundColor: darkMode ? '#9A66EA' : '#00522F',
              },
              zIndex: 1000,
            }}
            onClick={handleOpenMiniSchedule}
          >
            <CalendarMonthIcon />
          </Fab>
        </Zoom>
      )}
      
      {/* Mini Schedule Overlay (replaces Modal) */}
      <Slide direction="left" in={miniScheduleOpen} mountOnEnter unmountOnExit>
        <Paper
          elevation={6}
          sx={{
            position: 'fixed',
            top: 0,
            right: 0,
            height: '100vh',
            width: miniScheduleExpanded ? '50%' : '320px', // Slightly narrower
            bgcolor: darkMode ? 'rgba(28, 31, 67, 0.97)' : 'rgba(255, 255, 255, 0.97)',
            backdropFilter: 'blur(10px)',
            borderLeft: darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
            zIndex: 1200,
            display: 'flex',
            flexDirection: 'column',
            transition: 'width 0.3s ease',
            overflow: 'hidden',
            boxShadow: '-5px 0px 25px rgba(0, 0, 0, 0.15)',
          }}
        >
          <Box sx={{ 
            p: 2, 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
          }}>
            <Typography 
              variant="h6" 
              sx={{ 
                color: darkMode ? '#FFFFFF' : '#000000',
                fontWeight: 600,
                fontSize: '1rem',
              }}
            >
              Weekly Schedule Planner
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {selectedCourses.length > 0 && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setViewMode('calendar');
                    handleCloseMiniSchedule();
                  }}
                  startIcon={<FullscreenIcon />}
                  sx={{
                    color: darkMode ? '#BB86FC' : '#00693E',
                    borderColor: darkMode ? '#BB86FC' : '#00693E',
                    '&:hover': {
                      borderColor: darkMode ? '#9A66EA' : '#00522F',
                      backgroundColor: darkMode ? 'rgba(187, 134, 252, 0.08)' : 'rgba(0, 105, 62, 0.08)',
                    },
                    fontSize: '0.8rem',
                    py: 0.5,
                  }}
                >
                  Full View
                </Button>
              )}
              <IconButton 
                onClick={toggleMiniScheduleSize} 
                size="small"
                sx={{ color: darkMode ? '#FFFFFF' : '#000000' }}
              >
                {miniScheduleExpanded ? <CloseFullscreenIcon /> : <OpenInFullIcon />}
              </IconButton>
              <IconButton 
                onClick={handleCloseMiniSchedule} 
                size="small"
                sx={{ color: darkMode ? '#FFFFFF' : '#000000' }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
          
          <Box sx={{ 
            flexGrow: 1, 
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {selectedCourses.length > 0 ? (
              <Box sx={{ p: 2, flexGrow: 1 }}>
                <ScheduleVisualization 
                  selectedCourses={selectedCourses} 
                  darkMode={darkMode} 
                  onRemoveCourse={handleRemoveCourse}
                />
              </Box>
            ) : (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                p: 4,
                flexGrow: 1,
              }}>
                <CalendarMonthIcon sx={{ fontSize: 60, color: darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)', mb: 2 }} />
                <Typography sx={{ color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)', textAlign: 'center' }}>
                  No courses added yet
                </Typography>
                <Typography sx={{ color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)', textAlign: 'center', mt: 1 }}>
                  Press the "Add" button next to courses in the table
                </Typography>
              </Box>
            )}
          </Box>
          
          {selectedCourses.length > 0 && (
            <>
              <Divider sx={{ borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
              <Box sx={{ p: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: darkMode ? '#BB86FC' : '#00693E', fontWeight: 600 }}>
                  Your Selected Courses:
                </Typography>
                <Box sx={{ maxHeight: '180px', overflowY: 'auto' }}>
                  {selectedCourses.map((course, index) => (
                    <Box 
                      key={`${course.subj}${course.num}-${index}`}
                      sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        py: 0.5,
                        borderBottom: index < selectedCourses.length - 1 ? 
                          (darkMode ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)') : 'none'
                      }}
                    >
                      <Typography variant="body2" sx={{ color: darkMode ? '#FFFFFF' : '#000000' }}>
                        {course.subj} {course.num}: {course.title.length > 20 ? `${course.title.substring(0, 20)}...` : course.title}
                      </Typography>
                      <IconButton 
                        size="small" 
                        onClick={() => handleRemoveCourse(course)}
                        sx={{ color: darkMode ? '#FF5252' : '#D32F2F' }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              </Box>
            </>
          )}
          
          {/* Quick Add Section */}
          <Divider sx={{ borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, color: darkMode ? '#BB86FC' : '#00693E', fontWeight: 600 }}>
              Quick Add Courses:
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <TextField
                size="small"
                placeholder="Course Code (e.g., COSC 1)"
                variant="outlined"
                fullWidth
                value={searchTerm}
                onChange={handleSearch}
                InputProps={{
                  sx: {
                    bgcolor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                    color: darkMode ? '#FFFFFF' : '#000000',
                    fontSize: '0.9rem',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: darkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: darkMode ? '#BB86FC' : '#00693E',
                    },
                  }
                }}
              />
            </Box>
            
            <Box sx={{ maxHeight: '150px', overflowY: 'auto' }}>
              {courses.slice(0, 5).map((course, index) => (
                <Box 
                  key={`quick-${course.subj}${course.num}-${index}`}
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 0.5,
                    borderBottom: index < Math.min(courses.length, 5) - 1 ? 
                      (darkMode ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)') : 'none'
                  }}
                >
                  <Typography variant="body2" sx={{ color: darkMode ? '#FFFFFF' : '#000000', fontSize: '0.85rem' }}>
                    {course.subj} {course.num}: {course.title?.length > 15 ? `${course.title.substring(0, 15)}...` : course.title}
                  </Typography>
                  <IconButton 
                    size="small" 
                    onClick={() => handleAddCourse(course)}
                    sx={{ 
                      color: darkMode ? '#BB86FC' : '#00693E',
                      backgroundColor: darkMode ? 'rgba(187, 134, 252, 0.1)' : 'rgba(0, 105, 62, 0.1)',
                      '&:hover': {
                        backgroundColor: darkMode ? 'rgba(187, 134, 252, 0.2)' : 'rgba(0, 105, 62, 0.2)',
                      }
                    }}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
              {courses.length > 5 && (
                <Typography 
                  variant="caption" 
                  sx={{ 
                    display: 'block', 
                    textAlign: 'center', 
                    mt: 1, 
                    color: darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                    fontStyle: 'italic'
                  }}
                >
                  + {courses.length - 5} more courses available
                </Typography>
              )}
              {courses.length === 0 && (
                <Typography 
                  variant="body2" 
                  sx={{ 
                    py: 2,
                    color: darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                    textAlign: 'center',
                    fontStyle: 'italic'
                  }}
                >
                  Type to search for courses
                </Typography>
              )}
            </Box>
          </Box>
        </Paper>
      </Slide>

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
