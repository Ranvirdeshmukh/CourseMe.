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
import { useNavigate, useLocation } from 'react-router-dom'; // Make sure useLocation is imported
import { useAuth } from '../../contexts/AuthContext';
import { periodCodeToTiming, addToGoogleCalendar } from './googleCalendarLogic';
import { addToAppleCalendar } from './appleCalendarLogic';
import { ProfessorCell } from '../ProfessorCell';
import ScheduleVisualization from './ScheduleVisualization';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import Slide from '@mui/material/Slide';
import Divider from '@mui/material/Divider';
import AddIcon from '@mui/icons-material/Add';
// Add these imports for the feature notification
import ClickAwayListener from '@mui/material/ClickAwayListener';
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';
import DownloadIcon from '@mui/icons-material/Download';
import Switch from '@mui/material/Switch';


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

// Add styled components for enrollment display
const EnrollmentDisplay = styled('div')(({ theme, status, darkMode }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '4px 8px',
  borderRadius: '6px',
  backgroundColor: status === 'full' 
    ? (darkMode ? 'rgba(255, 59, 48, 0.1)' : 'rgba(255, 59, 48, 0.05)')
    : status === 'open'
      ? (darkMode ? 'rgba(52, 199, 89, 0.1)' : 'rgba(52, 199, 89, 0.05)')
      : status === 'ip'
        ? (darkMode ? 'rgba(255, 204, 0, 0.1)' : 'rgba(255, 204, 0, 0.05)')
        : 'transparent',
  fontFamily: 'SF Pro Display, sans-serif',
}));

const EnrollmentText = styled('div')(({ theme, status, darkMode }) => ({
  fontWeight: 600,
  fontSize: '0.9rem',
  color: status === 'full' 
    ? (darkMode ? '#ff6b6b' : '#ff3b30')
    : status === 'open'
      ? (darkMode ? '#40c057' : '#34c759')
      : status === 'ip'
        ? (darkMode ? '#ffd43b' : '#ffcc00')
        : (darkMode ? '#adb5bd' : '#8e8e93'),
}));

const EnrollmentProgressBar = styled('div')(({ theme, status, darkMode, percentage }) => ({
  width: '100%',
  height: '4px',
  marginTop: '6px',
  backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
  borderRadius: '2px',
  position: 'relative',
  overflow: 'hidden',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    width: `${Math.min(percentage, 100)}%`,
    backgroundColor: status === 'full' 
      ? (darkMode ? '#ff6b6b' : '#ff3b30')
      : status === 'open'
        ? (darkMode ? '#40c057' : '#34c759')
        : status === 'ip'
          ? (darkMode ? '#ffd43b' : '#ffcc00')
          : (darkMode ? '#adb5bd' : '#8e8e93'),
    transition: 'width 0.3s ease'
  }
}));

const Timetable = ({darkMode}) => {
  const [courses, setCourses] = useState([]); 
  const [filteredCourses, setFilteredCourses] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false); 
  const [snackbarMessage, setSnackbarMessage] = useState("Thank you, you will be notified if someone drops the class.");
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
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'calendar'
  const [miniScheduleOpen, setMiniScheduleOpen] = useState(false);
  const [miniScheduleExpanded, setMiniScheduleExpanded] = useState(true);
  const [openPopupMessage, setOpenPopupMessage] = useState(false);
  const [popupMessage, setPopupMessage] = useState({ message: '', type: 'info' });
  // Add these new state variables for enrollment and notification features
  const [enrollmentDataReady, setEnrollmentDataReady] = useState(false);
  const [isDataProcessing, setIsDataProcessing] = useState(true);
  const [coursesInitiallyLoaded, setCoursesInitiallyLoaded] = useState(false);
  const [isPriorityEligible, setIsPriorityEligible] = useState(false);
  const [notificationPriority, setNotificationPriority] = useState('standard'); // 'standard' or 'priority'
  const [userReviews, setUserReviews] = useState([]);
  // New state for term toggle
  const [termType, setTermType] = useState('fall'); // 'summer' or 'fall'
  
  const db = getFirestore();
  const navigate = useNavigate();
  const location = useLocation(); // Add this to get location information
  
  var courseNameLong = ""
  // Add this near your other state declarations
  const CACHE_VERSION = 'summerV3';
  // Constants
  const ENROLLMENT_REFRESH_INTERVAL = 43200000; // 12 hours in milliseconds
  const MAX_COURSES = 4; // Maximum number of courses users can add

  const isMobile = useMediaQuery('(max-width:600px)');

  const totalPages = Math.ceil(filteredCourses.length / classesPerPage); // Total number of pages

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
    // Perform default sorting by department name and course number
    return [...courses].sort((a, b) => {
      // First sort by department code (AAAS, ANTH, etc.)
      if (a.subj !== b.subj) {
        return a.subj.localeCompare(b.subj);
      }
      
      // Then sort by course number numerically
      const aNumParts = a.num.toString().split('.');
      const bNumParts = b.num.toString().split('.');
      
      // Compare the integer part first
      const aInt = parseInt(aNumParts[0], 10);
      const bInt = parseInt(bNumParts[0], 10);
      
      if (aInt !== bInt) {
        return aInt - bInt;
      }
      
      // If integer parts are equal, compare decimal parts if they exist
      if (aNumParts.length > 1 && bNumParts.length > 1) {
        const aDecimal = parseInt(aNumParts[1], 10);
        const bDecimal = parseInt(bNumParts[1], 10);
        return aDecimal - bDecimal;
      } else if (aNumParts.length > 1) {
        return 1; // a has decimal, b doesn't
      } else if (bNumParts.length > 1) {
        return -1; // b has decimal, a doesn't
      }
      
      // If all number parts match, use sortConfig as a tiebreaker if configured
      if (sortConfig.key) {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
      }
      
      // If we get here, they're equal
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

    // Always apply sorting after filtering
    filtered = getSortedCourses(filtered);
    
    setFilteredCourses(filtered);
    setCurrentPage(1);
  }, [courses, searchTerm, selectedSubject, getSortedCourses]);

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
  }, [currentUser, termType]); // Add termType as a dependency

  useEffect(() => {
    applyFilters(); 
  }, [searchTerm, selectedSubject]);

  useEffect(() => {
    fetchProfessorData();

    // If user is logged in, fetch reviews to check priority eligibility
    if (currentUser) {
      fetchUserReviews();
    }
  }, [currentUser]);

  // Add the function to fetch user reviews for priority eligibility
  const fetchUserReviews = async () => {
    if (!currentUser) return;
    
    try {
      const db = getFirestore();
      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const reviews = userData.reviews || [];
        setUserReviews(reviews);
        
        // Check if user is eligible for priority notifications (3+ reviews)
        setIsPriorityEligible(reviews.length >= 3);
      }
    } catch (error) {
      console.error('Error fetching user reviews:', error);
    }
  };

  // Track when courses are initially loaded
  useEffect(() => {
    if (courses.length > 0 && !coursesInitiallyLoaded) {
      setCoursesInitiallyLoaded(true);
    }
  }, [courses]);

  // Fetch notifications after courses are loaded
  useEffect(() => {
    if (coursesInitiallyLoaded && currentUser) {
      fetchUserNotifications();
    }
  }, [coursesInitiallyLoaded, currentUser]);

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

  // Add the fetchEnrollmentData function
  const fetchEnrollmentData = async () => {
    try {
      // Check for cached data first
      const lastFetchTime = await localforage.getItem('enrollmentDataTimestamp');
      const now = Date.now();
      
      // Refresh every 12 hours
      if (lastFetchTime && (now - lastFetchTime < ENROLLMENT_REFRESH_INTERVAL)) {
        const cachedData = await localforage.getItem('enrollmentData');
        if (cachedData && Object.keys(cachedData).length > 0) {
          console.log("Using cached enrollment data with", Object.keys(cachedData).length, "entries");
          return cachedData;
        }
      }
      
      console.log("Fetching fresh enrollment data");
      
      const response = await fetch('https://storage.googleapis.com/timetable-info/winter_courses_latest.json');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch enrollment data: ${response.status}`);
      }
      
      const rawText = await response.text();
      let data;
      try {
        data = JSON.parse(rawText);
      } catch (parseError) {
        console.error("Error parsing enrollment data JSON:", parseError);
        throw new Error("Failed to parse enrollment data");
      }
      
      // Process the enrollment data
      const processedData = {};
      
      if (Array.isArray(data)) {
        data.forEach((course, index) => {
          if (Array.isArray(course) && course.length >= 6) {
            const [dept, num, sec, limit, enrolled, ip] = course;
            
            const normalizedNum = num.replace(/^0+/, '').replace(/\.(\d+)0+$/, '.$1');
            const normalizedSec = sec.replace(/^0+/, '');
            const normalizedKey = `${dept}|${normalizedNum}|${normalizedSec}`;
            
            processedData[normalizedKey] = {
              limit: limit === "&nbsp" ? null : parseInt(limit),
              enrolled: enrolled === "&nbsp" ? null : parseInt(enrolled),
              hasIP: ip === "IP"
            };
          }
        });
      }
      
      // Cache the processed data
      await localforage.setItem('enrollmentData', processedData);
      await localforage.setItem('enrollmentDataTimestamp', now);
      
      return processedData;
    } catch (error) {
      console.error('Error fetching enrollment data:', error);
      
      // Fallback to cached data if available
      const cachedData = await localforage.getItem('enrollmentData');
      if (cachedData) {
        console.log("Using fallback cached enrollment data");
        return cachedData;
      }
      
      return {};
    }
  };
  
  // Add the enhanceCourseDataWithEnrollment function
  const enhanceCourseDataWithEnrollment = async (coursesData) => {
    try {
      const enrollmentData = await fetchEnrollmentData();
      
      if (Object.keys(enrollmentData).length === 0) {
        return coursesData.map(course => ({
          ...course,
          enrollmentStatus: 'unknown',
          enrollmentLimit: null,
          enrollmentCurrent: null,
          enrollmentHasIP: false
        }));
      }
      
      return coursesData.map(course => {
        // Skip invalid courses
        if (!course.subj || !course.num || !course.sec) {
          return {
            ...course,
            enrollmentStatus: 'unknown',
            enrollmentLimit: null,
            enrollmentCurrent: null,
            enrollmentHasIP: false
          };
        }
        
        // Generate different key formats to try for matching
        const keyFormats = [
          `${course.subj}|${course.num.replace(/^0+/, '')}|${course.sec.replace(/^0+/, '')}`,
          `${course.subj}|${course.num.padStart(3, '0')}|${course.sec.padStart(2, '0')}`,
          `${course.subj}|${course.num.includes('.') ? course.num : course.num.padStart(3, '0')}|${course.sec.padStart(2, '0')}`,
          `${course.subj}|${course.num}|${course.sec}`,
        ];
        
        // Try each key format to find a match
        let enrollment = null;
        
        for (const keyFormat of keyFormats) {
          if (enrollmentData[keyFormat]) {
            enrollment = enrollmentData[keyFormat];
            break;
          }
        }
        
        // Return the course with enrollment data if found
        return {
          ...course,
          enrollmentLimit: enrollment?.limit ?? null,
          enrollmentCurrent: enrollment?.enrolled ?? null,
          enrollmentHasIP: enrollment?.hasIP ?? false,
          enrollmentStatus: !enrollment ? 'unknown' : 
                           enrollment.hasIP ? 'ip' :
                           enrollment.limit === null ? 'open' :
                           enrollment.enrolled >= enrollment.limit ? 'full' : 'open'
        };
      });
    } catch (error) {
      console.error("Error enhancing courses with enrollment data:", error);
      // Return courses with unknown enrollment status
      return coursesData.map(course => ({
        ...course,
        enrollmentStatus: 'unknown',
        enrollmentLimit: null,
        enrollmentCurrent: null,
        enrollmentHasIP: false
      }));
    }
  };

  const fetchFirestoreCourses = async () => {
    try {
      setIsDataProcessing(true);
      // First check if we have cached data
      const cacheKey = `cachedCourses_${termType}`;
      const cacheTimestampKey = `cacheTimestamp_${termType}`;
      const cacheVersionKey = `cacheVersion_${termType}`;
      
      const cachedCourses = await localforage.getItem(cacheKey);
      const cacheTimestamp = await localforage.getItem(cacheTimestampKey);
      const cachedVersion = await localforage.getItem(cacheVersionKey);
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
        // Enhance the cached courses with enrollment data
        const enhancedCourses = await enhanceCourseDataWithEnrollment(cachedCourses);
        setCourses(enhancedCourses);
        setFilteredCourses(enhancedCourses);
        extractSubjects(enhancedCourses);
        setEnrollmentDataReady(true);
        setIsDataProcessing(false);
        setLoading(false);
        return enhancedCourses;
      }
  
      console.log('Cache invalid or expired, fetching new data');
  
      // If cache version doesn't match, clear everything
      if (cachedVersion !== CACHE_VERSION) {
        console.log('Version mismatch, clearing cache');
        await localforage.removeItem(cacheKey);
        await localforage.removeItem(cacheTimestampKey);
        await localforage.removeItem(cacheVersionKey);
      }
  
      // Fetch new data - use the correct collection based on termType
      const collectionName = termType === 'summer' ? 'summerTimetable' : 'fallTimetable2';
      const coursesSnapshot = await getDocs(collection(db, collectionName));
      const coursesData = coursesSnapshot.docs.map((doc) => {
        const data = doc.data();
        const periodCode = data['Period Code'];
        return {
          documentName: doc.id,
          subj: data.Subj,
          num: data.Num,
          sec: data.Section,
          title: data.Title,
          period: periodCode,
          timing: periodCodeToTiming[periodCode] || 'Unknown Timing',
          room: data.Room,
          building: data.Building,
          instructor: data.Instructor,
          isNotified: false // Initialize notification status
        };
      });
  
      // Enhance courses with enrollment data
      const enhancedCourses = await enhanceCourseDataWithEnrollment(coursesData);

      // Store the new data in cache
      await Promise.all([
        localforage.setItem(cacheKey, enhancedCourses),
        localforage.setItem(cacheTimestampKey, now),
        localforage.setItem(cacheVersionKey, CACHE_VERSION)
      ]);
  
      console.log('New data cached');
      setCourses(enhancedCourses);
      setFilteredCourses(enhancedCourses);
      extractSubjects(enhancedCourses);
      setEnrollmentDataReady(true);
      setIsDataProcessing(false);
      setLoading(false);
      return enhancedCourses;
  
    } catch (error) {
      console.error('Error fetching Firestore courses:', error);
      setError(error);
      setIsDataProcessing(false);
      setLoading(false);
      return [];
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
          "25X": true
        });
        
        console.log("Updated document with 25X field: " + courseNameLong);
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
    if (!currentUser) {
      console.log("No user logged in, cannot fetch timetable");
      setSelectedCourses([]);
      return;
    }
    
    try {
      console.log(`Fetching ${termType} courses for user:`, currentUser.uid);
      
      // Get the user document
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        // Extract courses taken for the current term
        const userData = userDocSnap.data();
        const fieldName = termType === 'summer' ? 'summerCoursestaken' : 'fallCoursestaken';
        const termCourses = userData[fieldName] || [];
        
        console.log(`Found ${termCourses.length} courses in the user's ${termType} timetable`);
        setSelectedCourses(termCourses);
      } else {
        console.log("User document not found. Creating a new one with empty courses array.");
        // Create user document with empty courses array for the current term
        const initialData = {};
        initialData[termType === 'summer' ? 'summerCoursestaken' : 'fallCoursestaken'] = [];
        await setDoc(userDocRef, initialData);
        setSelectedCourses([]);
      }
    } catch (error) {
      console.error(`Error fetching user's ${termType} courses:`, error);
      setPopupMessage({
        message: "There was an error loading your courses. Please try refreshing the page.",
        type: 'error',
      });
      setOpenPopupMessage(true);
      setSelectedCourses([]); // Reset the state to avoid stale data
    }
  };
  
  
  const handleNotifyDrop = async (course) => {
    try {
      const db = getFirestore();
      const formattedNumber = course.num.includes('.') 
        ? course.num 
        : course.num.padStart(3, '0');
      const formattedSection = course.sec.padStart(2, '0');
      
      // If already notified, remove notification
      if (course.isNotified === true) {
        await removeNotification(course);
        return;
      }
      
      // Set priority count based on selection
      const priorityCount = notificationPriority === 'priority' ? 1 : 2;
      
      // Check if user is eligible for priority if they selected it
      if (notificationPriority === 'priority' && !isPriorityEligible) {
        alert('You need at least 3 reviews to use priority notifications.');
        return;
      }
      
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
          // User not in array, add them with priority count
          await updateDoc(docRef, {
            users: arrayUnion({
              email: currentUser.email,
              open: false,
              priorityCount: priorityCount
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
            priority: notificationPriority === 'priority'
          };

          if (!userDoc.exists()) {
            await setDoc(userRef, { notifications: [newNotification] });
          } else {
            await updateDoc(userRef, { notifications: arrayUnion(newNotification) });
          }
          
          // Update course in state
          updateCourseNotificationStatus(course, true, notificationPriority);
          setSnackbarMessage(notificationPriority === 'priority' 
            ? "Priority notification set! You'll be among the first to know when a spot opens."
            : "Thank you, you will be notified if someone drops the class.");
          setSnackbarOpen(true);
        } else {
          alert('You are already on the notification list for this course.');
        }
      } else {
        // Create new document
        const newDocRef = doc(timetableRequestsRef);
        timetableRequestId = newDocRef.id;
        
        await setDoc(newDocRef, {
          department: course.subj,
          number: formattedNumber,
          section: formattedSection,
          users: [{
            email: currentUser.email,
            open: false,
            priorityCount: priorityCount
          }]
        });

        // Add to user's notifications
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        const newNotification = {
          requestId: timetableRequestId,
          department: course.subj,
          number: formattedNumber,
          section: formattedSection,
          priority: notificationPriority === 'priority'
        };

        if (!userDoc.exists()) {
          await setDoc(userRef, { notifications: [newNotification] });
        } else {
          await updateDoc(userRef, { notifications: arrayUnion(newNotification) });
        }
        
        // Update course in state
        updateCourseNotificationStatus(course, true, notificationPriority);
        setSnackbarMessage(notificationPriority === 'priority' 
          ? "Priority notification set! You'll be among the first to know when a spot opens."
          : "Thank you, you will be notified if someone drops the class.");
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error('Error setting up drop notification:', error);
      alert('Failed to set up drop notification. Please try again.');
    }
  };

  // Helper to update course notification status in state
  const updateCourseNotificationStatus = (course, status, priority = 'standard') => {
    // Update the current course in state
    course.isNotified = status;
    course.notificationPriority = status ? priority : null;
    
    // Update the local state
    const updatedCourses = courses.map(c => {
      if (c.documentName === course.documentName) {
        return { 
          ...c, 
          isNotified: status,
          notificationPriority: status ? priority : null
        };
      }
      return c;
    });
    setCourses(updatedCourses);
    
    // Also update filtered courses
    const updatedFilteredCourses = filteredCourses.map(c => {
      if (c.documentName === course.documentName) {
        return { 
          ...c, 
          isNotified: status,
          notificationPriority: status ? priority : null 
        };
      }
      return c;
    });
    setFilteredCourses(updatedFilteredCourses);
  };

  // Remove notification
  const removeNotification = async (course) => {
    try {
      const db = getFirestore();
      const formattedNumber = course.num.includes('.') 
        ? course.num 
        : course.num.padStart(3, '0');
      const formattedSection = course.sec.padStart(2, '0');
      
      // Find the timetable request document
      const timetableRequestsRef = collection(db, 'timetable-requests');
      const q = query(
        timetableRequestsRef,
        where("department", "==", course.subj),
        where("number", "==", formattedNumber),
        where("section", "==", formattedSection)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const docRef = doc(db, 'timetable-requests', querySnapshot.docs[0].id);
        const docData = querySnapshot.docs[0].data();
        
        // Filter out this user from the users array
        const updatedUsers = (docData.users || []).filter(user => user.email !== currentUser.email);
        
        if (updatedUsers.length > 0) {
          await updateDoc(docRef, { users: updatedUsers });
        } else {
          await deleteDoc(docRef);
        }
        
        // Remove from user's notifications array
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists() && userDoc.data().notifications) {
          const notifications = userDoc.data().notifications || [];
          const updatedNotifications = notifications.filter(
            notification => 
              !(notification.department === course.subj && 
                notification.number === formattedNumber && 
                notification.section === formattedSection)
          );
          
          await updateDoc(userRef, { notifications: updatedNotifications });
        }
        
        // Update course in state
        updateCourseNotificationStatus(course, false);
        
        // Show removal confirmation
        setSnackbarMessage("Notification removed successfully");
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error('Error removing notification:', error);
      alert('Failed to remove notification. Please try again.');
    }
  };

  // Fetch user notifications
  const fetchUserNotifications = async () => {
    if (!currentUser) return;
    
    try {
      const db = getFirestore();
      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      // Create a Set of notification identifiers for faster lookups
      const notificationSet = new Set();
      const priorityNotifications = new Map();
      
      if (userDoc.exists()) {
        const notifications = userDoc.data().notifications || [];
        
        notifications.forEach(notification => {
          const key = `${notification.department}|${notification.number}|${notification.section}`;
          notificationSet.add(key);
          
          // Track if this is a priority notification
          if (notification.priority) {
            priorityNotifications.set(key, true);
          }
        });
      }
      
      // Update courses with notification status
      if (courses && courses.length > 0) {
        const updatedCourses = courses.map(course => {
          const formattedNumber = course.num?.includes('.') 
            ? course.num 
            : course.num?.padStart(3, '0');
          const formattedSection = course.sec?.padStart(2, '0');
          
          // Check if this course is in the notification set
          const courseKey = `${course.subj}|${formattedNumber}|${formattedSection}`;
          const isNotified = notificationSet.has(courseKey);
          const isPriorityNotification = priorityNotifications.has(courseKey);
          
          return { 
            ...course, 
            isNotified: Boolean(isNotified),
            notificationPriority: isNotified ? (isPriorityNotification ? 'priority' : 'standard') : null
          };
        });
        
        setCourses(updatedCourses);
        setFilteredCourses([...updatedCourses]);
      }
    } catch (error) {
      console.error('Error fetching user notifications:', error);
    }
  };

  // Toggle between standard and priority notification
  const toggleNotificationPriority = (e) => {
    e.stopPropagation();
    
    if (!isPriorityEligible) {
      alert('You need at least 3 reviews to use priority notifications.');
      return;
    }
    
    setNotificationPriority(prev => prev === 'standard' ? 'priority' : 'standard');
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
      addedAt: new Date(),  // Add timestamp for when the course was added
      term: termType === 'summer' ? "Summer 2025" : "Fall 2025",   // Explicitly set the term
      id: `${course.subj}_${course.num}_${course.sec}_${Date.now()}` // Generate a unique ID
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

    // Validate that we have the required fields before proceeding
    if (!courseToAdd.subj || !courseToAdd.num || !courseToAdd.sec) {
      console.error("Missing required course fields", courseToAdd);
      setPopupMessage({
        message: `Could not add course: missing required information.`,
        type: 'error',
      });
      setOpenPopupMessage(true);
      return;
    }

    // Add to Firestore - directly in the user document
    if (currentUser) {
      try {
        // Create a clean version of the course object with only the fields we need
        const courseData = {
          subj: courseToAdd.subj,
          num: courseToAdd.num,
          sec: courseToAdd.sec,
          title: courseToAdd.title || "",
          period: courseToAdd.period || "ARR",
          building: courseToAdd.building || "",
          room: courseToAdd.room || "",
          instructor: courseToAdd.instructor || "",
          timing: courseToAdd.timing || "",
          addedAt: courseToAdd.addedAt,
          term: courseToAdd.term,
          id: courseToAdd.id
        };

        // Get reference to user document
        const userDocRef = doc(db, 'users', currentUser.uid);
        
        // Fetch current user data
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          // User document exists, update the courses array for the current term
          const userData = userDocSnap.data();
          const fieldName = termType === 'summer' ? 'summerCoursestaken' : 'fallCoursestaken';
          const currentCourses = userData[fieldName] || [];
          
          // Add the new course
          const updateData = {};
          updateData[fieldName] = [...currentCourses, courseData];
          await updateDoc(userDocRef, updateData);
        } else {
          // User document does not exist, create it
          const initialData = {};
          initialData[termType === 'summer' ? 'summerCoursestaken' : 'fallCoursestaken'] = [courseData];
          await setDoc(userDocRef, initialData);
        }
        
        // Update the state with the new course
        setSelectedCourses(prevCourses => [...prevCourses, courseData]);
        
        setPopupMessage({
          message: `${courseToAdd.subj} ${courseToAdd.num} has been added to your timetable.`,
          type: 'success',
        });
        setOpenPopupMessage(true);
        
        // Log success
        console.log(`Successfully added ${courseToAdd.subj} ${courseToAdd.num} to ${termType} courses taken.`);
      } catch (error) {
        console.error(`Error adding course to ${termType}Coursestaken:`, error);
        setPopupMessage({
          message: `Error adding ${courseToAdd.subj} ${courseToAdd.num} to your timetable.`,
          type: 'error',
        });
        setOpenPopupMessage(true);
      }
    } else {
      // User is not logged in
      setPopupMessage({
        message: "Please log in to add courses to your timetable.",
        type: 'warning',
      });
      setOpenPopupMessage(true);
    }
  };
  

  const handleRemoveCourse = async (course) => {
    if (!currentUser) {
      setPopupMessage({
        message: "Please log in to manage your timetable.",
        type: 'warning',
      });
      setOpenPopupMessage(true);
      return;
    }

    // Create an object to identify the course if id is missing
    const courseIdentifier = course.id 
      ? { id: course.id }
      : { 
          subj: course.subj, 
          num: course.num, 
          sec: course.sec 
        };
    
    // Log to help with debugging
    console.log('Removing course:', courseIdentifier);

    try {
      // First, remove from UI for immediate feedback
      setSelectedCourses(prev => {
        if (courseIdentifier.id) {
          return prev.filter(c => c.id !== courseIdentifier.id);
        } else {
          return prev.filter(c => 
            !(c.subj === courseIdentifier.subj && 
              c.num === courseIdentifier.num && 
              c.sec === courseIdentifier.sec)
          );
        }
      });

      // Get reference to user document
      const userDocRef = doc(db, 'users', currentUser.uid);
      
      // Fetch current user data
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        // Get current courses
        const userData = userDocSnap.data();
        const fieldName = termType === 'summer' ? 'summerCoursestaken' : 'fallCoursestaken';
        const currentCourses = userData[fieldName] || [];
        
        // Filter out the course to remove
        const updatedCourses = courseIdentifier.id 
          ? currentCourses.filter(c => c.id !== courseIdentifier.id)
          : currentCourses.filter(c => 
              !(c.subj === courseIdentifier.subj && 
                c.num === courseIdentifier.num && 
                c.sec === courseIdentifier.sec)
            );
        
        // Update the document with the filtered array
        const updateData = {};
        updateData[fieldName] = updatedCourses;
        await updateDoc(userDocRef, updateData);
        
        // Show success message
        setPopupMessage({
          message: `${course.subj} ${course.num} has been removed from your timetable.`,
          type: 'success',
        });
        setOpenPopupMessage(true);

        console.log(`Successfully removed ${course.subj} ${course.num} from ${termType} courses taken.`);
      } else {
        throw new Error("User document not found");
      }
    } catch (error) {
      console.error('Error removing course:', error);
      
      // Add the course back to the state since deletion failed
      setSelectedCourses(prev => [...prev, course]);
      
      setPopupMessage({
        message: `Error removing ${course.subj} ${course.num} from your timetable.`,
        type: 'error',
      });
      setOpenPopupMessage(true);
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
          <title>Summer 2025 Schedule</title>
          ${printCSS}
        </head>
        <body>
          <div class="schedule-print-container">
            <div class="schedule-title">Summer 2025 Weekly Schedule</div>
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

  // Add new state for feature discovery tooltip
  const [showFeatureHighlight, setShowFeatureHighlight] = useState(false);

  // Add useEffect to check if user has seen the feature highlight before
  useEffect(() => {
    const checkFeatureHighlight = async () => {
      try {
        // Get current visit count
        const featureVisitCount = localStorage.getItem('weeklyScheduleFeatureVisits');
        const visitCount = featureVisitCount ? parseInt(featureVisitCount) : 0;
        
        // Show feature if we haven't reached 5 visits yet
        if (visitCount < 9) {
          // Increment and save the visit count
          localStorage.setItem('weeklyScheduleFeatureVisits', (visitCount + 1).toString());
          
          // Wait a bit before showing the highlight so other elements can load
          setTimeout(() => {
            setShowFeatureHighlight(true);
          }, 1500);
        }
      } catch (error) {
        console.error('Error checking feature highlight status:', error);
      }
    };

    checkFeatureHighlight();
  }, []);

  // Add function to dismiss feature highlight
  const handleFeatureHighlightClose = () => {
    setShowFeatureHighlight(false);
    try {
      // When user explicitly closes it, set count to 5 to stop showing it
      localStorage.setItem('weeklyScheduleFeatureVisits', '5');
    } catch (error) {
      console.error('Error saving feature highlight status:', error);
    }
  };

  // Add this effect to check for openVisualization parameter
  useEffect(() => {
    // Check if we have a state parameter to open visualization
    if (location.state?.openVisualization) {
      // Set a timeout to ensure courses are loaded first
      setTimeout(() => {
        setMiniScheduleOpen(true);
      }, 500);
      
      // Clean up the state to prevent reopening on page refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  // Add effect to apply initial sorting when courses are loaded
  useEffect(() => {
    if (courses.length > 0) {
      // Apply the default sorting when courses are initially loaded
      const sortedCourses = getSortedCourses(courses);
      setFilteredCourses(sortedCourses);
    }
  }, [courses, getSortedCourses]);

  useEffect(() => {
    fetchFirestoreCourses();
    fetchUserTimetable(); 
  }, [currentUser, termType]); // Add termType as a dependency

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

        {/* "Your Summer 2025 Classes" Section */}
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
    Your {termType === 'summer' ? 'Summer' : 'Fall'} 2025 Courses.
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
                        'Enrollment',
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
  
                          {/* Enrollment */}
                          <TableCell
                            sx={{
                              padding: '12px',
                              textAlign: 'left',
                            }}
                          >
                            {course.enrollmentStatus === 'full' ? (
                              <EnrollmentDisplay status="full" darkMode={darkMode}>
                                <EnrollmentText status="full">{course.enrollmentLimit} spots</EnrollmentText>
                                <EnrollmentProgressBar status="full" percentage={100} />
                              </EnrollmentDisplay>
                            ) : course.enrollmentStatus === 'open' ? (
                              <EnrollmentDisplay status="open" darkMode={darkMode}>
                                <EnrollmentText status="open">{course.enrollmentLimit} spots</EnrollmentText>
                                <EnrollmentProgressBar status="open" percentage={course.enrollmentCurrent / course.enrollmentLimit * 100} />
                              </EnrollmentDisplay>
                            ) : course.enrollmentStatus === 'ip' ? (
                              <EnrollmentDisplay status="ip" darkMode={darkMode}>
                                <EnrollmentText status="ip">{course.enrollmentLimit} spots</EnrollmentText>
                                <EnrollmentProgressBar status="ip" percentage={course.enrollmentCurrent / course.enrollmentLimit * 100} />
                              </EnrollmentDisplay>
                            ) : (
                              <EnrollmentDisplay status="unknown" darkMode={darkMode}>
                                <EnrollmentText status="unknown">Unknown</EnrollmentText>
                                <EnrollmentProgressBar status="unknown" percentage={0} />
                              </EnrollmentDisplay>
                            )}
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
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                              <Tooltip title={
                                isFallAddDropClosed 
                                  ? "Summer add/drop notifications will open soon" 
                                  : course.isNotified 
                                    ? "Click to remove notification" 
                                    : "Get notified if someone drops this class"
                              }>
                                <span>
                                  <IconButton 
                                    onClick={() => handleNotifyDrop(course)} 
                                    disabled={isFallAddDropClosed}
                                    sx={{ 
                                      backgroundColor: course.isNotified && course.notificationPriority === 'priority'
                                        ? (darkMode ? 'rgba(255, 59, 48, 0.2)' : 'rgba(255, 59, 48, 0.1)')
                                        : course.isNotified
                                          ? (darkMode ? 'rgba(0, 122, 255, 0.2)' : 'rgba(0, 122, 255, 0.1)')
                                          : (darkMode ? 'rgba(0, 122, 255, 0.1)' : 'rgba(0, 122, 255, 0.05)'),
                                      '&:hover': { 
                                        backgroundColor: course.isNotified && course.notificationPriority === 'priority'
                                          ? (darkMode ? 'rgba(255, 59, 48, 0.3)' : 'rgba(255, 59, 48, 0.15)')
                                          : course.isNotified
                                            ? (darkMode ? 'rgba(0, 122, 255, 0.3)' : 'rgba(0, 122, 255, 0.15)')
                                            : (darkMode ? 'rgba(0, 122, 255, 0.2)' : 'rgba(0, 122, 255, 0.1)')
                                      },
                                      '&.Mui-disabled': {
                                        backgroundColor: darkMode ? 'rgba(150, 150, 150, 0.1)' : 'rgba(150, 150, 150, 0.05)'
                                      },
                                      border: course.isNotified && course.notificationPriority === 'priority'
                                        ? '1px solid rgba(255, 59, 48, 0.5)'
                                        : 'none'
                                    }}
                                  >
                                    {isFallAddDropClosed ? (
                                      <LockIcon sx={{ color: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.3)', fontSize: '1.2rem' }} />
                                    ) : (
                                      course.isNotified === true ? (
                                        course.notificationPriority === 'priority' ? (
                                          <NotificationsActiveIcon sx={{ color: '#FF3B30', fontSize: '1.2rem' }} />
                                        ) : (
                                          <NotificationsActiveIcon sx={{ color: '#007AFF', fontSize: '1.2rem' }} />
                                        )
                                      ) : (
                                        <NotificationsActiveIcon sx={{ color: '#007AFF', fontSize: '1.2rem' }} />
                                      )
                                    )}
                                  </IconButton>
                                </span>
                              </Tooltip>
                              
                              {isPriorityEligible && !course.isNotified && !isFallAddDropClosed && (
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    backgroundColor: notificationPriority === 'priority' 
                                      ? (darkMode ? 'rgba(255, 59, 48, 0.1)' : 'rgba(255, 59, 48, 0.05)')
                                      : 'transparent',
                                    '&:hover': {
                                      backgroundColor: notificationPriority === 'priority'
                                        ? (darkMode ? 'rgba(255, 59, 48, 0.15)' : 'rgba(255, 59, 48, 0.08)')
                                        : (darkMode ? 'rgba(150, 150, 150, 0.1)' : 'rgba(150, 150, 150, 0.05)')
                                    }
                                  }}
                                  onClick={toggleNotificationPriority}
                                >
                                  <Typography
                                    sx={{
                                      fontSize: '0.7rem',
                                      color: notificationPriority === 'priority'
                                        ? '#FF3B30'
                                        : darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                                      fontWeight: 600,
                                      letterSpacing: '0.02em'
                                    }}
                                  >
                                    Priority
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </TableCell>
                          
                          {/* Add Button Cell */}
                          <TableCell
                            sx={{
                              padding: '12px',
                              textAlign: 'left',
                            }}
                          >
                            {/* Check if course is already in selectedCourses */}
                            {selectedCourses.some(
                              (c) => c.subj === course.subj && c.num === course.num && c.sec === course.sec
                            ) ? (
                              <IconButton onClick={() => handleRemoveCourse(course)}>
                                <DeleteIcon sx={{ color: '#FF3B30' }} />
                              </IconButton>
                            ) : (
                              <IconButton 
                                onClick={() => handleAddCourse(course)}
                                sx={{ 
                                  color: darkMode ? '#BB86FC' : '#00693E',
                                  backgroundColor: darkMode ? 'rgba(187, 134, 252, 0.1)' : 'rgba(0, 105, 62, 0.1)',
                                  '&:hover': {
                                    backgroundColor: darkMode ? 'rgba(187, 134, 252, 0.2)' : 'rgba(0, 105, 62, 0.2)',
                                  }
                                }}
                              >
                                <AddIcon />
                              </IconButton>
                            )}
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
            Haven&apos;t added your {termType === 'summer' ? 'Summer' : 'Fall'} 2025 timetable on CourseMe? Add now!
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
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
      {termType === 'summer' ? 'Summer' : 'Fall'} 2025 Timetable.
    </Typography>
    
    {/* Term Toggle */}
    <Box 
      sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        border: darkMode ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.1)', 
        borderRadius: '24px', 
        padding: '4px 12px',
        marginBottom: '20px',
        marginTop: '30px',
        backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)'
      }}
    >
      <Typography 
        sx={{ 
          color: termType === 'summer' ? (darkMode ? '#BB86FC' : '#00693E') : (darkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'),
          fontWeight: termType === 'summer' ? 600 : 400,
          fontSize: '0.9rem',
          transition: 'color 0.3s'
        }}
      >
        Summer
      </Typography>
      <Switch
        checked={termType === 'fall'}
        onChange={() => setTermType(termType === 'summer' ? 'fall' : 'summer')}
        sx={{
          '& .MuiSwitch-switchBase.Mui-checked': {
            color: darkMode ? '#BB86FC' : '#00693E',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
            },
          },
          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
            backgroundColor: darkMode ? '#BB86FC' : '#00693E',
          },
        }}
      />
      <Typography 
        sx={{ 
          color: termType === 'fall' ? (darkMode ? '#BB86FC' : '#00693E') : (darkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'),
          fontWeight: termType === 'fall' ? 600 : 400,
          fontSize: '0.9rem',
          transition: 'color 0.3s'
        }}
      >
        Fall
      </Typography>
    </Box>
  </Box>

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
              'Enrollment',
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

                {/* Enrollment cell */}
                <TableCell align="center" sx={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                  {!enrollmentDataReady ? (
                    <Typography 
                      sx={{ 
                        fontSize: '0.9rem', 
                        color: darkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                        fontStyle: 'italic'
                      }}
                    >
                      Loading...
                    </Typography>
                  ) : !course.enrollmentStatus && !course.enrollmentLimit && !course.enrollmentCurrent ? (
                    <Typography 
                      sx={{ 
                        fontSize: '0.9rem', 
                        color: darkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                        fontStyle: 'italic'
                      }}
                    >
                      No data
                    </Typography>
                  ) : course.enrollmentHasIP ? (
                    <EnrollmentDisplay status="ip" darkMode={darkMode}>
                      <EnrollmentText status="ip" darkMode={darkMode}>
                        IP Required
                      </EnrollmentText>
                    </EnrollmentDisplay>
                  ) : (
                    <EnrollmentDisplay status={course.enrollmentStatus} darkMode={darkMode}>
                      <EnrollmentText status={course.enrollmentStatus} darkMode={darkMode}>
                        {course.enrollmentCurrent !== null && course.enrollmentCurrent !== undefined 
                          ? course.enrollmentCurrent 
                          : '0'}/
                        {course.enrollmentLimit !== null && course.enrollmentLimit !== undefined 
                          ? course.enrollmentLimit 
                          : '0'}
                      </EnrollmentText>
                      {(course.enrollmentLimit || course.enrollmentLimit === 0) && 
                       (course.enrollmentCurrent || course.enrollmentCurrent === 0) && (
                        <EnrollmentProgressBar 
                          status={course.enrollmentStatus} 
                          darkMode={darkMode} 
                          percentage={((course.enrollmentCurrent || 0) / Math.max(1, (course.enrollmentLimit || 1))) * 100}
                        />
                      )}
                    </EnrollmentDisplay>
                  )}
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
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                    <Tooltip title={
                      isFallAddDropClosed 
                        ? "Summer add/drop notifications will open soon" 
                        : course.isNotified 
                          ? "Click to remove notification" 
                          : "Get notified if someone drops this class"
                    }>
                      <span>
                        <IconButton 
                          onClick={() => handleNotifyDrop(course)} 
                          disabled={isFallAddDropClosed}
                          sx={{ 
                            backgroundColor: course.isNotified && course.notificationPriority === 'priority'
                              ? (darkMode ? 'rgba(255, 59, 48, 0.2)' : 'rgba(255, 59, 48, 0.1)')
                              : course.isNotified
                                ? (darkMode ? 'rgba(0, 122, 255, 0.2)' : 'rgba(0, 122, 255, 0.1)')
                                : (darkMode ? 'rgba(0, 122, 255, 0.1)' : 'rgba(0, 122, 255, 0.05)'),
                            '&:hover': { 
                              backgroundColor: course.isNotified && course.notificationPriority === 'priority'
                                ? (darkMode ? 'rgba(255, 59, 48, 0.3)' : 'rgba(255, 59, 48, 0.15)')
                                : course.isNotified
                                  ? (darkMode ? 'rgba(0, 122, 255, 0.3)' : 'rgba(0, 122, 255, 0.15)')
                                  : (darkMode ? 'rgba(0, 122, 255, 0.2)' : 'rgba(0, 122, 255, 0.1)')
                            },
                            '&.Mui-disabled': {
                              backgroundColor: darkMode ? 'rgba(150, 150, 150, 0.1)' : 'rgba(150, 150, 150, 0.05)'
                            },
                            border: course.isNotified && course.notificationPriority === 'priority'
                              ? '1px solid rgba(255, 59, 48, 0.5)'
                              : 'none'
                          }}
                        >
                          {isFallAddDropClosed ? (
                            <LockIcon sx={{ color: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.3)', fontSize: '1.2rem' }} />
                          ) : (
                            course.isNotified === true ? (
                              course.notificationPriority === 'priority' ? (
                                <NotificationsActiveIcon sx={{ color: '#FF3B30', fontSize: '1.2rem' }} />
                              ) : (
                                <NotificationsActiveIcon sx={{ color: '#007AFF', fontSize: '1.2rem' }} />
                              )
                            ) : (
                              <NotificationsActiveIcon sx={{ color: '#007AFF', fontSize: '1.2rem' }} />
                            )
                          )}
                        </IconButton>
                      </span>
                    </Tooltip>
                    
                    {isPriorityEligible && !course.isNotified && !isFallAddDropClosed && (
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: notificationPriority === 'priority' 
                            ? (darkMode ? 'rgba(255, 59, 48, 0.1)' : 'rgba(255, 59, 48, 0.05)')
                            : 'transparent',
                          '&:hover': {
                            backgroundColor: notificationPriority === 'priority'
                              ? (darkMode ? 'rgba(255, 59, 48, 0.15)' : 'rgba(255, 59, 48, 0.08)')
                              : (darkMode ? 'rgba(150, 150, 150, 0.1)' : 'rgba(150, 150, 150, 0.05)')
                          }
                        }}
                        onClick={toggleNotificationPriority}
                      >
                        <Typography
                          sx={{
                            fontSize: '0.7rem',
                            color: notificationPriority === 'priority'
                              ? '#FF3B30'
                              : darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                            fontWeight: 600,
                            letterSpacing: '0.02em'
                          }}
                        >
                          Priority
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </TableCell>
                
                {/* Add Button Cell */}
                <TableCell
                  sx={{
                    padding: '12px',
                    textAlign: 'left',
                  }}
                >
                  {/* Check if course is already in selectedCourses */}
                  {selectedCourses.some(
                    (c) => c.subj === course.subj && c.num === course.num && c.sec === course.sec
                  ) ? (
                    <IconButton onClick={() => handleRemoveCourse(course)}>
                      <DeleteIcon sx={{ color: '#FF3B30' }} />
                    </IconButton>
                  ) : (
                    <IconButton 
                      onClick={() => handleAddCourse(course)}
                      sx={{ 
                        color: darkMode ? '#BB86FC' : '#00693E',
                        backgroundColor: darkMode ? 'rgba(187, 134, 252, 0.1)' : 'rgba(0, 105, 62, 0.1)',
                        '&:hover': {
                          backgroundColor: darkMode ? 'rgba(187, 134, 252, 0.2)' : 'rgba(0, 105, 62, 0.2)',
                        }
                      }}
                    >
                      <AddIcon />
                    </IconButton>
                  )}
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
          <Box sx={{ position: 'fixed', bottom: 32, right: 32, zIndex: 1000 }}>
            {/* Feature discovery tooltip */}
            {showFeatureHighlight && (
              <ClickAwayListener onClickAway={handleFeatureHighlightClose}>
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 76,
                    right: 0,
                    width: 280,
                    padding: '16px',
                    borderRadius: '14px',
                    backgroundColor: darkMode 
                      ? 'rgba(60, 60, 80, 0.95)' 
                      : 'rgba(255, 255, 255, 0.98)',
                    color: darkMode ? '#FFFFFF' : '#000000',
                    boxShadow: darkMode 
                      ? '0 10px 25px rgba(0, 0, 0, 0.5)' 
                      : '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)',
                    backdropFilter: 'blur(20px)',
                    border: darkMode 
                      ? '1px solid rgba(255, 255, 255, 0.1)' 
                      : '1px solid rgba(0, 0, 0, 0.05)',
                    zIndex: 1001,
                    display: 'flex',
                    flexDirection: 'column',
                    fontSize: '14px',
                    fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
                    transform: 'translateX(-40px)',
                    opacity: 1,
                    animation: 'fadeSlideIn 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)',
                    '@keyframes fadeSlideIn': {
                      from: {
                        opacity: 0,
                        transform: 'translateX(-20px) translateY(10px)'
                      },
                      to: {
                        opacity: 1,
                        transform: 'translateX(-40px) translateY(0)'
                      }
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CalendarMonthIcon 
                      sx={{ 
                        color: darkMode ? '#FFFFFF' : '#007AFF',
                        mr: 1.5,
                        fontSize: 22
                      }} 
                    />
                    <Typography sx={{ 
                      fontWeight: 600, 
                      fontSize: '16px',
                      color: darkMode ? '#FFFFFF' : '#000000'
                    }}>
                      New! Weekly Schedule
                    </Typography>
                    <Box sx={{ flexGrow: 1 }} />
                    <IconButton 
                      size="small" 
                      onClick={handleFeatureHighlightClose}
                      sx={{ 
                        padding: '4px',
                        color: darkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.4)'
                      }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  
                  <Typography sx={{ mb: 1.5, lineHeight: 1.4 }}>
                    Visualize your class schedule by day and time with our new weekly planner.
                  </Typography>
                  
                  <Button
                    variant="text"
                    onClick={() => {
                      handleFeatureHighlightClose();
                      handleOpenMiniSchedule();
                    }}
                    endIcon={<ArrowRightAltIcon />}
                    sx={{
                      alignSelf: 'flex-start',
                      color: darkMode ? '#BB86FC' : '#007AFF',
                      fontWeight: 500,
                      padding: '4px 8px',
                      textTransform: 'none',
                      '&:hover': {
                        backgroundColor: darkMode ? 'rgba(187, 134, 252, 0.08)' : 'rgba(0, 122, 255, 0.08)', 
                      }
                    }}
                  >
                    Try it now
                  </Button>
                  
                  <Box sx={{ 
                    position: 'absolute',
                    bottom: -10,
                    right: 30,
                    width: 0,
                    height: 0,
                    borderLeft: '10px solid transparent',
                    borderRight: '10px solid transparent',
                    borderTop: darkMode
                      ? '10px solid rgba(60, 60, 80, 0.95)'
                      : '10px solid rgba(255, 255, 255, 0.98)',
                    zIndex: 1002,
                  }} />
                </Box>
              </ClickAwayListener>
            )}
            
            <Fab
              color="primary"
              aria-label="quick schedule"
              sx={{
                backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.9)',
                color: darkMode ? '#FFFFFF' : '#000000',
                width: 64,
                height: 64,
                backdropFilter: 'blur(10px)', // Frosted glass effect for iOS feel
                border: darkMode ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.05)',
                boxShadow: darkMode 
                  ? '0 8px 32px rgba(0, 0, 0, 0.3)' 
                  : '0 10px 30px rgba(0, 0, 0, 0.1), 0 1px 1px rgba(0, 0, 0, 0.05)',
                '&:hover': {
                  backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 1)',
                  boxShadow: darkMode 
                    ? '0 12px 40px rgba(0, 0, 0, 0.5)' 
                    : '0 14px 40px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0, 0, 0, 0.08)',
                },
                transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                // Add subtle pulse animation when tooltip is visible
                animation: showFeatureHighlight 
                  ? 'pulse 2s infinite cubic-bezier(0.455, 0.03, 0.515, 0.955)'
                  : 'none',
                '@keyframes pulse': {
                  '0%': {
                    boxShadow: darkMode 
                      ? '0 0 0 0 rgba(255, 255, 255, 0.4)' 
                      : '0 0 0 0 rgba(0, 122, 255, 0.4)'
                  },
                  '70%': {
                    boxShadow: darkMode 
                      ? '0 0 0 10px rgba(255, 255, 255, 0)' 
                      : '0 0 0 10px rgba(0, 122, 255, 0)'
                  },
                  '100%': {
                    boxShadow: darkMode 
                      ? '0 0 0 0 rgba(255, 255, 255, 0)' 
                      : '0 0 0 0 rgba(0, 122, 255, 0)'
                  }
                }
              }}
              onClick={handleOpenMiniSchedule}
            >
              <CalendarMonthIcon sx={{ 
                fontSize: 28,
                color: darkMode 
                  ? '#FFFFFF' 
                  : '#000000',
                transition: 'transform 0.2s ease',
                '&:hover': {
                  transform: 'scale(1.05)',
                }
              }} />
            </Fab>
          </Box>
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
    {snackbarMessage}
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
