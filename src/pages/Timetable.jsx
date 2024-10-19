import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  useMediaQuery,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Snackbar,
  Button,
  IconButton,
  ButtonBase,
  Tooltip,
} from '@mui/material';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import { getFirestore, collection, getDocs, where, query, doc, updateDoc, getDoc, setDoc, arrayUnion } from 'firebase/firestore';
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


const GoogleCalendarButton = styled(ButtonBase)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#f2f2f2',
  borderRadius: 4,
  height: 40,
  width: 'auto',
  padding: '0 12px',
  color: '#1f1f1f',
  fontFamily: 'Roboto, arial, sans-serif',
  fontSize: 14,
  letterSpacing: '0.25px',
  textTransform: 'none',
  boxShadow: '0 1px 2px 0 rgba(60, 64, 67, .30), 0 1px 3px 1px rgba(60, 64, 67, .15)',
  transition: 'background-color .218s, box-shadow .218s',
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: '#e2e2e2',
    boxShadow: '0 2px 4px rgba(60, 64, 67, .3), 0 3px 6px rgba(60, 64, 67, .15)',
  },
  '&:active': {
    backgroundColor: '#d2d2d2',
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
  },
}));

const GoogleIcon = () => (
  <svg
    width="20"
    height="20"
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
  const isFallAddDropClosed = true; // Replace with logic that checks if the fall add/drop period is over

  const isMobile = useMediaQuery('(max-width:600px)');

  const totalPages = Math.ceil(filteredCourses.length / classesPerPage); // Total number of pages
  const navigate = useNavigate();


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

  useEffect(() => {
    fetchFirestoreCourses();
    fetchUserTimetable(); 
  }, [currentUser]); 

  useEffect(() => {
    applyFilters(); 
  }, [searchTerm, selectedSubject]);

  const fetchFirestoreCourses = async () => {
    try {
      const cachedCourses = await localforage.getItem('cachedCourses');
      const cacheTimestamp = await localforage.getItem('cacheTimestamp');
      const now = Date.now();
  
      if (cachedCourses && cacheTimestamp && (now - cacheTimestamp) < 5184000000) { // 60 days
        setCourses(cachedCourses);
        setFilteredCourses(cachedCourses);
        extractSubjects(cachedCourses);
        setLoading(false);
        return;
      }
  
      await fetchAndUpdateCache();
    } catch (error) {
      console.error('Error fetching Firestore courses:', error);
      setError(error);
      setLoading(false);
    }
  };
  
  const fetchAndUpdateCache = async () => {
    try {
      const db = getFirestore();
      const coursesSnapshot = await getDocs(collection(db, 'fallTimetable'));
      const coursesData = coursesSnapshot.docs.map((doc) => {
        const periodCode = doc.data()['Period Code'];
        return {
          documentName: doc.id, // Include the document ID
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
  
      await localforage.setItem('cachedCourses', coursesData);
      await localforage.setItem('cacheTimestamp', Date.now());
  
      setCourses(coursesData);
      setFilteredCourses(coursesData);
      extractSubjects(coursesData);
      setLoading(false);
    } catch (error) {
      console.error('Error updating Firestore courses:', error);
      setError(error);
      setLoading(false);
    }
  };
  const handleCourseClick = (course) => {
    console.log('Received course object:', JSON.stringify(course, null, 2));
  
    const department = course.subj; // e.g., 'AAAS'
    
    // Handle course numbers with decimal points
    let courseNumber = course.num;
    if (courseNumber.includes('.')) {
      const [mainPart, decimalPart] = courseNumber.split('.');
      courseNumber = mainPart.padStart(3, '0') + '_' + decimalPart.padStart(2, '0');
    } else {
      courseNumber = courseNumber.padStart(3, '0');
    }
  
    console.log('Department:', department);
    console.log('Course Number:', courseNumber);
    console.log('Original Title:', course.title);
  
    // Format the course title
    const formattedTitle = course.title
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '');
  
    console.log('Formatted Title:', formattedTitle);
  
    // Construct the courseId
    const courseId = `${department}_${department}${courseNumber}__${formattedTitle}`;
  
    console.log('Course ID:', courseId);
  
    // Encode the courseId for the URL
    const encodedCourseId = encodeURIComponent(courseId);
  
    console.log('Encoded Course ID:', encodedCourseId);
  
    // Construct the navigation path
    const coursePath = `/departments/${department}/courses/${encodedCourseId}`;
    
    console.log('Navigating to:', coursePath);
    navigate(coursePath);
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
      
      if (!querySnapshot.empty) {
        // Document exists, check if user is already in the array
        const docRef = doc(db, 'timetable-requests', querySnapshot.docs[0].id);
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
          setSnackbarOpen(true);
        } else {
          // User already in array, notify them
          alert('You are already on the notification list for this course.');
        }
      } else {
        // Document doesn't exist, create a new one
        await setDoc(doc(timetableRequestsRef), {
          department: course.subj,
          number: formattedNumber,
          section: formattedSection,
          users: [{
            email: currentUser.email,
            open: false
          }]
        });
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

  const applyFilters = useCallback(() => {
    let filtered = [...courses];

    if (searchTerm) {
      filtered = filtered.filter(
        (course) =>
          course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.subj.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.instructor.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedSubject) {
      filtered = filtered.filter((course) => course.subj === selectedSubject);
    }

    setFilteredCourses(filtered);
    setCurrentPage(1); // Reset to first page on filter change
  }, [courses, searchTerm, selectedSubject]);

  const debouncedApplyFilters = useMemo(() => debounce(applyFilters, 300), [applyFilters]);

  useEffect(() => {
    debouncedApplyFilters();
    return () => {
      debouncedApplyFilters.cancel();
    };
  }, [debouncedApplyFilters]);

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

    const eventStartDate = '20240915'; 
    const eventEndDate = '20241127'; 
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
    const startIndex = (currentPage - 1) * classesPerPage;
    const endIndex = startIndex + classesPerPage;
    return filteredCourses.slice(startIndex, endIndex);
  }, [filteredCourses, currentPage]);

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
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: '#F9F9F9',
        padding: '40px',
        fontFamily: 'SF Pro Display, sans-serif',
      }}
    >
      <Container maxWidth="xl">

        {/* "Your Fall 2024 Classes" Section */}
{showSelectedCourses && (
  <Typography
    variant="h3"
    align="left"
    sx={{
      fontWeight: 600,
      fontFamily: 'SF Pro Display, sans-serif',
      color: '#571CE0',
      marginBottom: '0px',
      marginTop: '30px',
    }}
  >
    Your Fall 2024 Classes
  </Typography>
)}

{showSelectedCourses && selectedCourses.length > 0 && (
  <TableContainer
    component={Paper}
    sx={{
      backgroundColor: '#FFFFFF',
      marginTop: '10px', // Changed from marginBottom to marginTop
      boxShadow: 3,
      borderRadius: '12px',
      overflowX: 'auto',
      maxWidth: '100%',
    }}
  >
            <Table sx={{ minWidth: isMobile ? '100%' : '650px' }}>
              <TableHead sx={{ backgroundColor: '#571CE0' }}>
                <TableRow>
                  {['Subject', 'Number', 'Section', 'Title', 'Period', 'Timing', 'Room', 'Building', 'Instructor', 'Add to Calendar', 'Notify When Available', 'Remove'].map((header, index) => (
                    <TableCell
                      key={index}
                      sx={{
                        color: '#fff',
                        textAlign: 'left',
                        fontWeight: 'bold', // Unified fontWeight
                        fontSize: '1rem',
                        padding: '12px 10px',
                        borderBottom: '2px solid #E0E0E0',
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
                      backgroundColor: index % 2 === 0 ? '#fafafa' : '#f4f4f4', // Unified alternating colors
                      transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
                      '&:hover': {
                        backgroundColor: '#e0e0e0', // Unified hover color
                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
                      },
                      cursor: 'pointer',
                      textDecoration: 'none',
                      color: 'inherit',
                    }}
                  >
<TableCell
  onClick={() => handleCourseClick(course)}
  sx={{ 
    color: '#571CE0', // Optional: change text color to indicate interactivity
    padding: '10px', 
    fontWeight: 500, 
    fontSize: '0.95rem', 
    textAlign: 'left', 
    fontFamily: 'SF Pro Display, sans-serif', 
    borderBottom: '1px solid #E0E0E0',
    cursor: 'pointer',            // Show pointer cursor on hover
    textDecoration: 'underline',  // Underline text to indicate it's clickable
    '&:hover': {
      color: '#3a0fb7',           // Optional: change color on hover
    },
  }}
>
  {course.subj}
</TableCell>
                    <TableCell sx={{ color: 'black', padding: '10px', fontWeight: 500, fontSize: '0.95rem', textAlign: 'left', fontFamily: 'SF Pro Display, sans-serif', borderBottom: '1px solid #E0E0E0' }}>{course.num}</TableCell>
                    <TableCell sx={{ color: 'black', padding: '10px', fontWeight: 500, fontSize: '0.95rem', textAlign: 'left', fontFamily: 'SF Pro Display, sans-serif', borderBottom: '1px solid #E0E0E0' }}>{course.sec}</TableCell>
                    <TableCell sx={{ color: 'black', padding: '10px', fontWeight: 500, fontSize: '0.95rem', textAlign: 'left', fontFamily: 'SF Pro Display, sans-serif', borderBottom: '1px solid #E0E0E0' }}>{course.title}</TableCell>
                    <TableCell sx={{ color: 'black', padding: '10px', fontWeight: 500, fontSize: '0.95rem', textAlign: 'left', fontFamily: 'SF Pro Display, sans-serif', borderBottom: '1px solid #E0E0E0' }}>{course.period}</TableCell>
                    <TableCell sx={{ color: 'black', padding: '10px', fontWeight: 500, fontSize: '0.95rem', textAlign: 'left', fontFamily: 'SF Pro Display, sans-serif', borderBottom: '1px solid #E0E0E0' }}>{course.timing}</TableCell>
                    <TableCell sx={{ color: 'black', padding: '10px', fontWeight: 500, fontSize: '0.95rem', textAlign: 'left', fontFamily: 'SF Pro Display, sans-serif', borderBottom: '1px solid #E0E0E0' }}>{course.room}</TableCell>
                    <TableCell sx={{ color: 'black', padding: '10px', fontWeight: 500, fontSize: '0.95rem', textAlign: 'left', fontFamily: 'SF Pro Display, sans-serif', borderBottom: '1px solid #E0E0E0' }}>{course.building}</TableCell>
                    <TableCell sx={{ color: 'black', padding: '10px', fontWeight: 500, fontSize: '0.95rem', textAlign: 'left', fontFamily: 'SF Pro Display, sans-serif', borderBottom: '1px solid #E0E0E0' }}>{course.instructor}</TableCell>

                    {/* Add to Calendar Button */}
                    <TableCell
                      sx={{
                        color: 'black',
                        padding: '10px',
                        fontSize: '0.95rem',
                        textAlign: 'left',
                        fontWeight: 500,
                        fontFamily: 'SF Pro Display, sans-serif',
                        borderBottom: '1px solid #E0E0E0',
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
                        color: 'black',
                        padding: '12px',
                        fontSize: '0.95rem',
                        textAlign: 'left',
                        fontWeight: 500,
                        fontFamily: 'SF Pro Display, sans-serif',
                        borderBottom: '1px solid #E0E0E0',
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
                            <NotificationsActiveIcon color="primary" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>

                    {/* Remove Button */}
                    <TableCell
                      sx={{
                        color: 'black',
                        padding: '12px',
                        fontSize: '0.95rem',
                        textAlign: 'left',
                        fontWeight: 500,
                        fontFamily: 'SF Pro Display, sans-serif',
                        borderBottom: '1px solid #E0E0E0',
                      }}
                    >
                      <IconButton onClick={() => handleRemoveCourse(course)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {showSelectedCourses && selectedCourses.length === 0 && (
          <Typography sx={{ marginBottom: '20px' }}>Haven't added your Fall 2024 timetable on CourseMe? Add now!!</Typography>
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
              fontFamily: 'SF Pro Display, sans-serif',
              color: '#571CE0',
              marginBottom: '0px',
              marginTop: '20px',
            }}
          >
            Fall '24 Timetable
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
                  borderColor: '#571CE0',
                },
                '&:hover fieldset': {
                  borderColor: '#571CE0',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#571CE0',
                },
                borderRadius: '20px',
                height: '40px',
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#571CE0' }} />
                </InputAdornment>
              ),
            }}
          />
          <FormControl variant="outlined" sx={{ minWidth: isMobile ? '100%' : 200, marginTop: '25px' }}>
            <InputLabel
              sx={{
                color: '#571CE0',
                '&.Mui-focused': {
                  color: '#571CE0',
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
                color: '#571CE0',
                fontWeight: '600',
                fontSize: '16px',
                fontFamily: 'SF Pro Display, sans-serif',
                textTransform: 'none',
                border: '1px solid #571CE0',
                boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: '#571CE0',
                  },
                  '&:hover fieldset': {
                    borderColor: '#571CE0',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#571CE0',
                  },
                  backgroundColor: 'transparent',
                  height: '40px',
                },
                '& .MuiSelect-icon': {
                  color: '#571CE0',
                },
                '&:hover': {
                  backgroundColor: 'rgba(87, 28, 224, 0.1)',
                },
                '&:focus': {
                  outline: 'none',
                  boxShadow: '0 0 0 4px rgba(0, 122, 255, 0.5)',
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
              color: '#571CE0',
              fontWeight: '600',
              fontSize: '16px',
              fontFamily: 'SF Pro Display, sans-serif',
              textTransform: 'none',
              border: '1px solid #571CE0',
              boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
              '&:hover': {
                backgroundColor: 'rgba(87, 28, 224, 0.1)',
                borderColor: '#571CE0',
              },
              '&:focus': {
                outline: 'none',
                boxShadow: '0 0 0 4px rgba(0, 122, 255, 0.5)',
              },
            }}
            onClick={() => setShowSelectedCourses(!showSelectedCourses)}
          >
            {showSelectedCourses ? 'Hide My Courses' : 'Show My Courses'}
          </Button>
        </Box>

        <Typography
          variant="body2"
          color="textSecondary"
          sx={{
            marginBottom: '20px',
            marginTop: '20px',
            fontFamily: 'SF Pro Display, sans-serif',
            color: '#1D1D1F',
          }}
        >
          <strong>Add your Fall Timetable to your calendar in one click, and get notified if a class spot opens up!</strong> 
          Simply select your courses to add them to your profile, and use the "Add to Calendar" feature to seamlessly integrate them into your personal schedule. 
          Additionally, you can opt to be notified if someone drops a class, giving you the chance to enroll in a previously full course.
          This data will also help train the AI model we are working on, which will eventually assist with complete major planning.
        </Typography>

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
            <CircularProgress color="primary" size={60} />
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
                marginTop: '20px', 
                boxShadow: 3, 
                borderRadius: '12px', 
                maxWidth: '100%' 
              }}
            >
              <Table sx={{ minWidth: isMobile ? '100%' : '650px' }}>
                <TableHead sx={{ backgroundColor: '#571CE0' }}>
                  <TableRow>
                    {['Subject', 'Number', 'Section', 'Title', 'Period', 'Timing', 'Room', 'Building', 'Instructor', 'Add to Calendar', 'Notify When Available', 'Add Course'].map((header, index) => (
                      <TableCell
                        key={index}
                        sx={{
                          color: '#fff',
                          textAlign: 'left',
                          fontWeight: 'bold', // Unified fontWeight
                          fontSize: '1rem',
                          padding: '12px 10px',
                          borderBottom: '2px solid #E0E0E0',
                        }}
                      >
                        {header}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedCourses.map((course, index) => (
                    <TableRow
                      key={index}
                      sx={{
                        backgroundColor: index % 2 === 0 ? '#fafafa' : '#f4f4f4', // Unified alternating colors
                        transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
                        '&:hover': {
                          backgroundColor: '#e0e0e0', // Unified hover color
                          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
                        },
                        cursor: 'pointer',
                        textDecoration: 'none',
                        color: 'inherit',
                      }}
                    >
<TableCell
  onClick={() => handleCourseClick(course)}
  sx={{ 
    color: '#571CE0', // Optional: change text color to indicate interactivity
    padding: '10px', 
    fontWeight: 500, 
    fontSize: '0.95rem', 
    textAlign: 'left', 
    fontFamily: 'SF Pro Display, sans-serif', 
    borderBottom: '1px solid #E0E0E0',
    cursor: 'pointer',            // Show pointer cursor on hover
    textDecoration: 'underline',  // Underline text to indicate it's clickable
    '&:hover': {
      color: '#3a0fb7',           // Optional: change color on hover
    },
  }}
>
  {course.subj}
</TableCell>                      <TableCell sx={{ color: 'black', padding: '10px', fontWeight: 500, fontSize: '0.95rem', textAlign: 'left', fontFamily: 'SF Pro Display, sans-serif', borderBottom: '1px solid #E0E0E0' }}>{course.num}</TableCell>
                      <TableCell sx={{ color: 'black', padding: '10px', fontWeight: 500, fontSize: '0.95rem', textAlign: 'left', fontFamily: 'SF Pro Display, sans-serif', borderBottom: '1px solid #E0E0E0' }}>{course.sec}</TableCell>
                      <TableCell sx={{ color: 'black', padding: '10px', fontWeight: 500, fontSize: '0.95rem', textAlign: 'left', fontFamily: 'SF Pro Display, sans-serif', borderBottom: '1px solid #E0E0E0' }}>{course.title}</TableCell>
                      <TableCell sx={{ color: 'black', padding: '10px', fontWeight: 500, fontSize: '0.95rem', textAlign: 'left', fontFamily: 'SF Pro Display, sans-serif', borderBottom: '1px solid #E0E0E0' }}>{course.period}</TableCell>
                      <TableCell sx={{ color: 'black', padding: '10px', fontWeight: 500, fontSize: '0.95rem', textAlign: 'left', fontFamily: 'SF Pro Display, sans-serif', borderBottom: '1px solid #E0E0E0' }}>{course.timing}</TableCell>
                      <TableCell sx={{ color: 'black', padding: '10px', fontWeight: 500, fontSize: '0.95rem', textAlign: 'left', fontFamily: 'SF Pro Display, sans-serif', borderBottom: '1px solid #E0E0E0' }}>{course.room}</TableCell>
                      <TableCell sx={{ color: 'black', padding: '10px', fontWeight: 500, fontSize: '0.95rem', textAlign: 'left', fontFamily: 'SF Pro Display, sans-serif', borderBottom: '1px solid #E0E0E0' }}>{course.building}</TableCell>
                      <TableCell sx={{ color: 'black', padding: '10px', fontWeight: 500, fontSize: '0.95rem', textAlign: 'left', fontFamily: 'SF Pro Display, sans-serif', borderBottom: '1px solid #E0E0E0' }}>{course.instructor}</TableCell>

                      {/* Add to Calendar Button */}
                      <TableCell
                        sx={{
                          color: 'black',
                          padding: '10px',
                          fontSize: '0.95rem',
                          textAlign: 'left',
                          fontWeight: 500,
                          fontFamily: 'SF Pro Display, sans-serif',
                          borderBottom: '1px solid #E0E0E0',
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
                          color: 'black',
                          padding: '12px',
                          fontSize: '0.95rem',
                          textAlign: 'left',
                          fontWeight: 500,
                          fontFamily: 'SF Pro Display, sans-serif',
                          borderBottom: '1px solid #E0E0E0',
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
                              <NotificationsActiveIcon color="primary" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>

                      {/* Add Course Button */}
                      <TableCell
                        sx={{
                          color: 'black',
                          padding: '12px',
                          fontSize: '0.95rem',
                          textAlign: 'left',
                          fontWeight: 500,
                          fontFamily: 'SF Pro Display, sans-serif',
                          borderBottom: '1px solid #E0E0E0',
                        }}
                      >
                        <IconButton
                          onClick={() => handleAddCourse(course)}
                          disabled={selectedCourses.length >= 3}
                        >
                          {selectedCourses.some((c) => c.title === course.title) ? (
                            <CheckCircleIcon color="success" />
                          ) : (
                            <AddCircleOutlineIcon
                              color={selectedCourses.length >= 3 ? 'disabled' : 'primary'}
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
                sx={{ marginRight: '10px' }}
              >
                <ArrowBackIcon />
              </IconButton>
              <Typography variant="body1">
                Page {currentPage} of {totalPages}
              </Typography>
              <IconButton
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                sx={{ marginLeft: '10px' }}
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
