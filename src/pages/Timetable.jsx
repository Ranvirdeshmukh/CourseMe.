
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box, Container, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Typography, TextField, InputAdornment, CircularProgress,
  Alert, useMediaQuery, MenuItem, Select, FormControl, InputLabel, Snackbar, Button,
  IconButton, ButtonBase, Tooltip,
} from '@mui/material';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import { getFirestore, collection, getDocs, where, query, doc, updateDoc, getDoc, setDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useAuth } from '../contexts/AuthContext';
import moment from 'moment-timezone';
import { styled } from '@mui/material/styles';
import debounce from 'lodash/debounce';
import localforage from 'localforage';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LockIcon from '@mui/icons-material/Lock';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { Collapse } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { memo } from 'react';


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

const Timetable = () => {
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
  const isFallAddDropClosed = false; // Replace with logic that checks if the fall add/drop period is over
  const [documentName, setDocumentName] = useState('');
  const [showFeatures, setShowFeatures] = useState(false);
  const [professorMappings, setProfessorMappings] = useState({});
  const [professorNames, setProfessorNames] = useState([]);
  const [professorMap, setProfessorMap] = useState(new Map());
  // const debouncedApplyFilters = useMemo(() => debounce(applyFilters, 300), [applyFilters]);

  var courseNameLong = ""
   // Add this near your other state declarations
   const CACHE_VERSION = 'winter_2025_v1';

  const isMobile = useMediaQuery('(max-width:600px)');

  const totalPages = Math.ceil(filteredCourses.length / classesPerPage); // Total number of pages
  const navigate = useNavigate();

  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [columnWidths, setColumnWidths] = useState({});
  const [selectedRows, setSelectedRows] = useState([]);

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

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

  const handleProfessorClick = (professorName, event) => {
    event.preventDefault();
    event.stopPropagation();
    const professorId = findClosestProfessorMatch(professorName, professorNames);
    if (professorId) {
      navigate(`/professors/${professorId}`, { replace: false, state: { from: 'timetable' } });
      window.scrollTo(0, 0); // Force scroll to top
    }
  };
  const formatProfessorId = (name) => {
    if (!name) return '';
    // Split on common delimiters and clean up
    const parts = name.split(/[,;]/)[0].trim().split(' ');
    if (parts.length < 2) return name;
    return `${parts[0]}_${parts[parts.length - 1]}`;
  };
  
  // Add this function to find the closest matching professor
  const findClosestProfessorMatch = useCallback((professorName) => {
    if (!professorName) return null;
    
    const nameLower = professorName.toLowerCase();
    // Direct lookup from map
    if (professorMap.has(nameLower)) {
      return professorMap.get(nameLower);
    }
  
    // If no exact match, try formatted ID
    const formattedId = formatProfessorId(professorName);
    for (const [, id] of professorMap) {
      if (id === formattedId) return id;
    }

    return null;
  }, [professorMap]);

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
          color: professorId ? '#571ce0' : '#1D1D1F',
          padding: '8px 16px',
          fontWeight: 400,
          fontSize: '0.81rem',
          textAlign: 'left',
          cursor: professorId ? 'pointer' : 'default',
          height: '48px',
          lineHeight: '1.2',
          '&:hover': professorId ? {
            textDecoration: 'underline',
          } : {},
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
      const coursesSnapshot = await getDocs(collection(db, 'winterTimetable'));
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
    // if (courseNumber.includes('.')) {
    //   const [mainPart, decimalPart] = courseNumber.split('.');
    //   courseNumber = mainPart.padStart(3, '0') + '_' + decimalPart.padStart(2, '0');
    // } else {
    //   courseNumber = courseNumber.padStart(3, '0');
    // }
  
    // const formattedTitle = course.title
    //   .replace(/[^a-zA-Z0-9]+/g, '_')
    //   .replace(/_+/g, '_')
    //   .replace(/^_+|_+$/g, '');
  
    // const courseId = `${department}_${department}${courseNumber}__${formattedTitle}`;
    // const encodedCourseId = encodeURIComponent(courseId);
  
    // // Check if the course exists in Firestore
    // const courseRef = doc(db, 'courses', courseId);
    // const courseSnap = await getDoc(courseRef);
  
    // if (!courseSnap.exists()) {
    //   // Course doesn't exist, create it
    //   await setDoc(courseRef, {
    //     department: department,
    //     number: courseNumber,
    //     title: course.title,
    //     description: 'Course description not available',
    //     reviews: {},
    //     layup: 0,
    //     quality: 0
    //   });
    //   console.log('Created new course document in Firestore');
    // }
  
    // const coursePath = `/departments/${department}/courses/${encodedCourseId}`;
    // console.log('Navigating to:', coursePath);
    // navigate(coursePath);
  };
  
  const fetchUserTimetable = async () => {
    try {
      const db = getFirestore();
      const userRef = doc(collection(db, 'users'), currentUser.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.fallCoursestaken) {
          setSelectedCourses(userData.fallCoursestaken);
        } else {
          setSelectedCourses([]); 
        }
      }
    } catch (error) {
      console.error("Error fetching user's timetable:", error);
    }
  };


  // const handleNotifyDrop = async (course) => {
  //   try {
  //     const db = getFirestore();
  //     const formattedNumber = course.num.includes('.') 
  //       ? course.num 
  //       : course.num.padStart(3, '0');
  //     const formattedSection = course.sec.padStart(2, '0');
      
  //     console.log("department", course.subj);
  //     console.log("number", formattedNumber);
  //     console.log("section", formattedSection);
      
  //     const timetableRequestsRef = collection(db, 'timetable-requests');
  //     const q = query(
  //       timetableRequestsRef,
  //       where("department", "==", course.subj),
  //       where("number", "==", formattedNumber),
  //       where("section", "==", formattedSection)
  //     );
  
  //     const querySnapshot = await getDocs(q);
      
  //     if (!querySnapshot.empty) {
  //       // Document exists, check if user is already in the array
  //       const docRef = doc(db, 'timetable-requests', querySnapshot.docs[0].id);
  //       const docData = querySnapshot.docs[0].data();
  //       const users = docData.users || [];
        
  //       const userExists = users.some(user => user.email === currentUser.email);
        
  //       if (!userExists) {
  //         // User not in array, add them
  //         await updateDoc(docRef, {
  //           users: arrayUnion({
  //             email: currentUser.email,
  //             open: false
  //           })
  //         });
  //         setSnackbarOpen(true);
  //       } else {
  //         // User already in array, notify them
  //         alert('You are already on the notification list for this course.');
  //       }
  //     } else {
  //       // Document doesn't exist, create a new one
  //       await setDoc(doc(timetableRequestsRef), {
  //         department: course.subj,
  //         number: formattedNumber,
  //         section: formattedSection,
  //         users: [{
  //           email: currentUser.email,
  //           open: false
  //         }]
  //       });
  //       setSnackbarOpen(true);
  //     }
  //   } catch (error) {
  //     console.error('Error setting up drop notification:', error);
  //     alert('Failed to set up drop notification. Please try again.');
  //   }
  // };

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

    if (selectedCourses.length < 3 && !selectedCourses.some((c) => c.title === course.title)) {
      const updatedCourses = [...selectedCourses, course];
      setSelectedCourses(updatedCourses);

      try {
        const db = getFirestore();
        const userRef = doc(collection(db, 'users'), currentUser.uid);
        await updateDoc(userRef, { fallCoursestaken: updatedCourses }); 
      } catch (error) {
        console.error('Error saving courses:', error);
      }
    } else if (selectedCourses.some((c) => c.title === course.title)) {
      alert('This course is already added.');
    } else {
      alert('You can only select up to 3 courses.');
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

    const eventStartDate = '20250105'; 
    const eventEndDate = '20250314'; 
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
        backgroundColor: '#F9F9F9',
        padding: '40px 20px', // 40px top/bottom, 20px left/right
        fontFamily: 'SF Pro Display, sans-serif',
      }}
    >
      <Container maxWidth={false} sx={{ 
  padding: '0 20px',
  margin: '0 auto',  // This centers the container
  maxWidth: '1600px' // Optional: adds a max-width to prevent too wide layouts
}}>
        {/* "Your Fall 2024 Classes" Section */}
        {showSelectedCourses && (
          <Typography
            variant="h3"
            align="left"
            sx={{
              fontWeight: 700,
              fontSize: '2.5rem',
              color: '#000000',
              marginBottom: '8px', // Reduced margin
              marginTop: '10px',
              fontFamily: 'SF Pro Display, sans-serif',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
            }}
          >
            Your Winter 2025 Classes
          </Typography>
        )}
  
        {showSelectedCourses && selectedCourses.length > 0 && (
          <TableContainer
            component={Paper}
            sx={{
              backgroundColor: '#FFFFFF',
              marginTop: '10px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              borderRadius: '12px',
              overflowX: 'auto',
              maxWidth: '100%',
            }}
          >
            <Table sx={{ minWidth: isMobile ? '100%' : '650px' }}>
            <TableHead sx={{ backgroundColor: '#F8F8F8', position: 'sticky', top: 0, zIndex: 1 }}>
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
          color: '#333333',
          textAlign: 'left',
          fontWeight: 700, // Increased font weight for emphasis
          fontSize: '1rem', // Slightly larger font size for clarity
          padding: '16px 12px', // Increased padding for better spacing
          borderBottom: '2px solid #E0E0E0', // Thicker bottom border for distinction
          backgroundColor: '#F8F8F8', // Consistent background color for the header
          // Optional: Add a subtle box-shadow for depth
          boxShadow: index === 0 ? '0 2px 4px rgba(0, 0, 0, 0.05)' : 'none',
          fontFamily: 'SF Pro Display, sans-serif',

        }}
      >
        {header}
      </TableCell>
    ))}
  </TableRow>
</TableHead>

              <TableBody>
                {selectedCourses.map((course, index) => (
                  <TableRow
                    key={index}
                    sx={{
                      backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#F9F9F9',
                      transition: 'background-color 0.3s ease',
                      '&:hover': {
                        backgroundColor: '#E5E5EA',
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
                        color: '#571ce0',
                        padding: '10px',
                        fontWeight: 500,
                        fontSize: '0.95rem',
                        textAlign: 'left',
                        cursor: 'pointer',
                        textDecoration: 'none',
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
                        color: '#571ce0',
                        padding: '10px',
                        fontWeight: 500,
                        fontSize: '0.95rem',
                        textAlign: 'left',
                        cursor: 'pointer',
                        textDecoration: 'none',
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
                        color: '#571ce0',
                        padding: '10px',
                        fontWeight: 500,
                        fontSize: '0.95rem',
                        textAlign: 'left',
                        cursor: 'pointer',
                        textDecoration: 'none',
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
                        color: '#1D1D1F',
                        padding: '10px',
                        fontWeight: 400,
                        fontSize: '0.95rem',
                        textAlign: 'left',
                        fontFamily: 'SF Pro Display, sans-serif',

                      }}
                      
                    >
                      {course.sec}
                    </TableCell>
  
                    {/* Timing */}
                    <TableCell
                      sx={{
                        color: '#1D1D1F',
                        padding: '10px',
                        fontWeight: 400,
                        fontSize: '0.95rem',
                        textAlign: 'left',
                        fontFamily: 'SF Pro Display, sans-serif',

                      }}
                    >
                      {course.timing}
                    </TableCell>
  
                    {/* Room */}
                    <TableCell
                      sx={{
                        color: '#1D1D1F',
                        padding: '10px',
                        fontWeight: 400,
                        fontSize: '0.95rem',
                        textAlign: 'left',
                        fontFamily: 'SF Pro Display, sans-serif',

                      }}
                    >
                      {course.room}
                    </TableCell>
  
                    {/* Building */}
                    <TableCell
                      sx={{
                        color: '#1D1D1F',
                        padding: '10px',
                        fontWeight: 400,
                        fontSize: '0.95rem',
                        textAlign: 'left',
                        fontFamily: 'SF Pro Display, sans-serif',

                      }}
                    >
                      {course.building}
                    </TableCell>
  
                    {/* Instructor */}
                    <TableCell
                      sx={{
                        color: '#1D1D1F',
                        padding: '10px',
                        fontWeight: 400,
                        fontSize: '0.95rem',
                        textAlign: 'left',
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
                        <Tooltip title="Fall add/drop is closed. Notifications will be available during Winter add/drop.">
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
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
  
        {showSelectedCourses && selectedCourses.length === 0 && (
          <Typography sx={{ marginBottom: '20px', color: '#1D1D1F' }}>
            Haven't added your Winter 2024 timetable on CourseMe? Add now!
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
      color: '#000000',
      marginBottom: '20px',
      marginTop: '30px',
      fontFamily: 'SF Pro Display, sans-serif',
    }}
  >
    Winter 2025 Timetable.
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
    boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
    marginTop: '25px',
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
    },
  }}
  InputProps={{
    startAdornment: (
      <InputAdornment position="start">
        <SearchIcon sx={{ color: '#00693E' }} />
      </InputAdornment>
    ),
  }}
/>
<FormControl variant="outlined" sx={{ minWidth: isMobile ? '100%' : 200, marginTop: '25px' }}>
  <InputLabel
    sx={{
      color: '#000000',
      '&.Mui-focused': {
        color: '#00693E',
      },
      // Add these properties to center the label
      transform: 'translate(14px, 8px) scale(1)',
      '&[data-shrink="true"]': {
        transform: 'translate(14px, -9px) scale(0.75)',
      },
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
      backgroundColor: 'transparent',
      color: '#000000',
      fontWeight: '600',
      fontSize: '16px',
      fontFamily: 'SF Pro Display, sans-serif',
      textTransform: 'none',
      border: '1px solid #00693E',
      boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
      '& .MuiOutlinedInput-root': {
        '& fieldset': {
          borderColor: '#000000',
        },
        '&:hover fieldset': {
          borderColor: '#000000',
        },
        '&.Mui-focused fieldset': {
          borderColor: '#000000',
        },
        backgroundColor: 'transparent',
        height: '40px',
      },
      '& .MuiSelect-select': {  // Add this to center the selected text
        paddingTop: '8px',
        paddingBottom: '8px',
        display: 'flex',
        alignItems: 'center',
      },
      '& .MuiSelect-icon': {
        color: '#00693E',
      },
      '&:hover': {
        backgroundColor: 'rgba(0, 105, 62, 0.1)',
      },
      '&:focus': {
        outline: 'none',
        boxShadow: '0 0 0 4px rgba(0, 105, 62, 0.5)',
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
    backgroundColor: 'transparent',
    color: '#00693E',
    fontWeight: '600',
    fontSize: '16px',
    fontFamily: 'SF Pro Display, sans-serif',
    textTransform: 'none',
    border: '1px solid #00693E',
    boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
    '&:hover': {
      backgroundColor: 'rgba(0, 105, 62, 0.1)', // Adjusted for Dartmouth Green
      borderColor: '#00693E',
    },
    '&:focus': {
      outline: 'none',
      boxShadow: '0 0 0 4px rgba(0, 105, 62, 0.5)', // Adjusted for Dartmouth Green
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
      backgroundColor: 'rgba(0, 105, 62, 0.04)',
      borderRadius: '8px',
      border: '1px solid rgba(0, 105, 62, 0.1)',
      transition: 'all 0.2s ease',
      '&:hover': {
        backgroundColor: 'rgba(0, 105, 62, 0.08)',
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
        color: '#1D1D1F',
        fontFamily: 'SF Pro Display, sans-serif',
      }}
    >
      <li>Sync your timetable to Google Calendar in one click</li>
      <li>Get instant notifications when a course spot opens up</li>
      <li>Send templated emails to professors in one click.</li>
      <li> Navigate to the course reviews in one click.</li>

      
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
        color: 'black',
        textAlign: 'center',
        padding: '0 20px',
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
        backgroundColor: '#FFFFFF',
        marginTop: '10px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
        borderRadius: '12px',
        width: '100%',
        border: '1px solid rgba(0, 105, 62, 0.1)',
        '&:hover': {
          boxShadow: '0 3px 10px rgba(0, 0, 0, 0.08)',
        },
      }}
    >
      <Table size="small">
        <TableHead 
          sx={{ 
            backgroundColor: '#F8F9FA',
            position: 'sticky', 
            top: 0, 
            zIndex: 1,
          }}
        >
          <TableRow>
            {[
              { key: 'subj', label: 'Subject', width: '80px' },
              { key: 'num', label: 'Number', width: '60px' },
              { key: 'title', label: 'Title', width: '200px' },
              { key: 'sec', label: 'Section', width: '70px' },
              { key: 'period', label: 'Period', width: '70px' },
              { key: 'timing', label: 'Timing', width: '140px' },
              { key: 'room', label: 'Room', width: '60px' },
              { key: 'building', label: 'Building', width: '80px' },
              { key: 'instructor', label: 'Instructor', width: '120px' },
              { key: null, label: 'Calendar', width: '120px' },
              { key: null, label: 'Notify', width: '60px' },
              { key: null, label: 'Add', width: '60px' }
            ].map(({ key, label, width }, index) => (
              <TableCell
                key={index}
                onClick={() => key && handleSort(key)}
                sx={{
                  width: width,
                  minWidth: width,
                  maxWidth: width,
                  padding: '14px 8px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#1D1D1F',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  backgroundColor: '#F8F9FA',
                  whiteSpace: 'nowrap',
                  cursor: key ? 'pointer' : 'default',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  borderBottom: '1px solid #E0E0E0',
                  borderRight: index !== 11 ? '1px solid #E0E0E0' : 'none',
                  textAlign: 'left',
                  '&:hover': key ? {
                    backgroundColor: 'rgba(0, 105, 62, 0.08)',
                    color: '#00693E',
                  } : {},
                  '&::after': key ? {
                    content: sortConfig.key === key ? 
                      `"${sortConfig.direction === 'ascending' ? ' ▲' : ' ▼'}"` : '""',
                    position: 'absolute',
                    right: '4px',
                    opacity: sortConfig.key === key ? 1 : 0.3,
                    fontSize: '0.7rem',
                    marginLeft: '4px',
                  } : {},
                  // Bottom border highlight for active sort
                  borderBottom: sortConfig.key === key ? 
                    '2px solid #00693E' : 
                    '1px solid #E0E0E0',
                  // Gradient background for header cells
                  background: 'linear-gradient(180deg, #FFFFFF 0%, #F8F9FA 100%)',
                  // Box shadow for depth
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '4px',
                  }}
                >
                  {label}
                  {key && (
                    <Box 
                      sx={{ 
                        opacity: 0.3,
                        transition: 'opacity 0.2s',
                        '&:hover': {
                          opacity: 1
                        }
                      }}
                    >
                      {sortConfig.key === key ? 
                        (sortConfig.direction === 'ascending' ? '▲' : '▼') : 
                        '▼'}
                    </Box>
                  )}
                </Box>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
      {paginatedCourses.map((course, index) => (
        <TableRow
          key={index}
          sx={{
            backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#FAFBFC',
            transition: 'all 0.2s ease',
            height: '48px', // Fixed height for rows
            '&:hover': {
              backgroundColor: 'rgba(0, 105, 62, 0.04)',
              transform: 'translateY(-1px)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
            },
            cursor: 'default',
            borderLeft: '2px solid transparent',
            '&:hover': {
              borderLeft: '2px solid #00693E',
            }
          }}
        >
              {/* Interactive cells (Subject, Number, Title) */}
              <TableCell
                onClick={(e) => {
                  e.stopPropagation();
                  handleCourseClick(course);
                }}
                sx={{
                  color: '#571ce0',
                  padding: '8px 16px', // Reduced padding
                  fontWeight: 500,
                  fontSize: '0.875rem', // Slightly smaller font
                  textAlign: 'left',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  height: '48px', // Fixed height
                  lineHeight: '1.2', // Reduced line height
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                {course.subj}
              </TableCell>
              <TableCell
                onClick={(e) => {
                  e.stopPropagation();
                  handleCourseClick(course);
                }}
                sx={{
                  color: '#571ce0',
                  padding: '8px 16px', // Reduced padding
                  fontWeight: 500,
                  fontSize: '0.875rem', // Slightly smaller font
                  textAlign: 'left',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  height: '48px', // Fixed height
                  lineHeight: '1.2', // Reduced line height
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                {course.num}
              </TableCell>
              <TableCell
                onClick={(e) => {
                  e.stopPropagation();
                  handleCourseClick(course);
                }}
                sx={{
                  color: '#571ce0',
                  padding: '8px 16px', // Reduced padding
                  fontWeight: 500,
                  fontSize: '0.875rem', // Slightly smaller font
                  textAlign: 'left',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  height: '48px', // Fixed height
                  lineHeight: '1.2', // Reduced line height
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                {course.title}
              </TableCell>

              {/* Regular cells */}
              {['sec', 'period', 'timing', 'room', 'building'].map((field) => (
                <TableCell
                  key={field}
                  sx={{
                    color: '#1D1D1F',
                    padding: '8px 16px', // Reduced padding
                    fontSize: '0.875rem', // Slightly smaller font
                    fontWeight: 400,
                    height: '48px', // Fixed height
                    borderBottom: '1px solid rgba(0, 0, 0, 0.04)', // Lighter border
                    fontFamily: 'SF Pro Display, sans-serif',
                    transition: 'all 0.2s ease',
                    lineHeight: '1.2', // Reduced line height
                    '&:hover::after': {
                      opacity: 1,
                    }
                  }}
                >
                  {course[field]}
                </TableCell>
              ))}
             <ProfessorCell instructor={course.instructor} />

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
                  <Tooltip title="Winter add/drop notifications will open at 5pm on November 14.">
                    <IconButton>
                      <LockIcon sx={{ color: '#999999' }} />
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
                      sx={{ color: selectedCourses.length >= 3 ? '#999999' : '#007AFF' }}
                    />
                  )}
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>

    {/* Pagination Controls */}
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '20px' }}>
      <IconButton
        onClick={handlePreviousPage}
        disabled={currentPage === 1}
        sx={{ 
          marginRight: '10px',
          color: '#007AFF',
          '&.Mui-disabled': {
            color: '#999999'
          }
        }}
      >
        <ArrowBackIcon />
      </IconButton>
      <Typography variant="body1">
        Page {currentPage} of {totalPages}
      </Typography>
      <IconButton
        onClick={handleNextPage}
        disabled={currentPage === totalPages}
        sx={{ 
          marginLeft: '10px',
          color: '#007AFF',
          '&.Mui-disabled': {
            color: '#999999'
          }
        }}
      >
        <ArrowForwardIcon />
      </IconButton>
    </Box>
  </>
) : (
  <Typography>No courses available</Typography>
)}
      </Container>

      {/* Snackbars */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        message="Thank you, you will be notified if someone drops the class."
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />

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
