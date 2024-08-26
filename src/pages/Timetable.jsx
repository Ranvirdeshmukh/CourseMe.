import React, { useState, useEffect } from 'react';
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
  ButtonBase,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useAuth } from '../contexts/AuthContext'; // Assuming you have an Auth context
import { getFirestore, collection, getDocs } from "firebase/firestore"; // Import Firestore functions
import moment from 'moment-timezone'; // Import moment-timezone to handle time zones
import { styled } from '@mui/material/styles';

// Define the custom styled button
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

// Define the Google Icon component
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
  const [courses, setCourses] = useState([]); // State to store all courses
  const [filteredCourses, setFilteredCourses] = useState([]); // State to store filtered courses
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false); // State for Snackbar
  const { currentUser } = useAuth();
  const isMobile = useMediaQuery('(max-width:600px)');

  // Period code to timing mapping
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
    fetchFirestoreCourses(); // Fetch Firestore data when the component mounts
  }, []);

  useEffect(() => {
    applyFilters(searchTerm, selectedSubject); // Apply filters whenever searchTerm or selectedSubject changes
  }, [searchTerm, selectedSubject]);

  const fetchFirestoreCourses = async () => {
    try {
      const db = getFirestore();
      const coursesSnapshot = await getDocs(collection(db, "fallTimetable"));
      const coursesData = coursesSnapshot.docs.map((doc) => {
        const periodCode = doc.data()["Period Code"];
        return {
          subj: doc.data().Subj,
          num: doc.data().Num,
          sec: doc.data().Section,
          title: doc.data().Title,
          period: periodCode, // Store the period code as is
          timing: periodCodeToTiming[periodCode] || "Unknown Timing", // Map the period code to timing
          room: doc.data().Room,
          building: doc.data().Building,
          instructor: doc.data().Instructor,
          // lim: doc.data().Lim,
          // enrl: doc.data().Enrl,
        };
      });
      setCourses(coursesData); // Set the original courses data
      setFilteredCourses(coursesData); // Initially set filtered courses to all courses
      extractSubjects(coursesData); // Extract unique subjects
      setLoading(false);
    } catch (error) {
      console.error("Error fetching Firestore courses:", error);
      setError(error);
      setLoading(false);
    }
  };

  const extractSubjects = (courses) => {
    const subjectsSet = new Set(courses.map((course) => course.subj));
    setSubjects([...subjectsSet]);
  };

  const applyFilters = (searchTerm, selectedSubject) => {
    let filtered = [...courses]; // Work on a copy of the original courses array

    if (searchTerm) {
      filtered = filtered.filter((course) =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.subj.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.instructor.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedSubject) {
      filtered = filtered.filter((course) => course.subj === selectedSubject);
    }

    setFilteredCourses(filtered);
  };

  
  const handleSearch = (event) => {
    const term = event.target.value;
    setSearchTerm(term);
  };

  const handleSubjectChange = (event) => {
    const subject = event.target.value;
    setSelectedSubject(subject);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleAddToCalendar = (course) => {
    const baseUrl = "https://calendar.google.com/calendar/render?action=TEMPLATE";
    const details = `&details=${encodeURIComponent(`Instructor: ${course.instructor}`)}`;
    const location = `&location=${encodeURIComponent(`${course.building}, ${course.room}`)}`;

    // Get all events (one for each part of the timing string)
    const events = getEventTiming(course.period, course.title);

    events.forEach((event) => {
      const text = `&text=${encodeURIComponent(event.title)}`;
      const startDateTime = `&dates=${event.startDateTime}/${event.endDateTime}`;
      const recur = event.recurrence ? `&recur=${event.recurrence}` : '';  // Only add recurrence if it exists
      
      const url = `${baseUrl}${text}${details}${location}${startDateTime}${recur}&sf=true&output=xml`;
      
      window.open(url, "_blank");
    });
  };

  const getEventTiming = (periodCode, courseTitle) => {
    const timing = periodCodeToTiming[periodCode];

    if (!timing) return [];

    const eventStartDate = "20240915"; // Start date of the term (e.g., September 15, 2024)
    const eventEndDate = "20241127"; // End date of the term (e.g., November 27, 2024)
    const timezone = "America/New_York";

    const timingParts = timing.split(", ");
    const events = [];

    timingParts.forEach((part) => {
      const [days, times] = part.trim().split(" "); // e.g., "MWF" "11:30-12:35"
      const [startTime, endTime] = times.split("-"); // e.g., "11:30-12:35"

      const startMoment = parseTime(eventStartDate, startTime, timezone);
      const endMoment = parseTime(eventStartDate, endTime, timezone);

      const startDateTime = startMoment.format("YYYYMMDDTHHmmssZ");
      const endDateTime = endMoment.format("YYYYMMDDTHHmmssZ");

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

    // Assume times between 1:00 and 6:59 are PM
    if (hour >= 1 && hour <= 6) {
      hour += 12;
    }

    // Handle 12:00 PM separately
    if (hour === 12 && timeStr.includes('12:')) {
      hour = 12;
    }

    return moment.tz(`${date} ${hour}:${minute}`, "YYYYMMDD HH:mm", timezone);
  };

  const createRecurrenceRule = (days, endDate) => {
    const dayMap = {
      M: "MO",
      T: "TU",
      W: "WE",
      Th: "TH",
      F: "FR",
      S: "SA",
      Su: "SU",
    };

    // Match day abbreviations correctly, ensuring multi-letter ones like "Th" and "Su" are matched first
    const dayPattern = /(Th|Su|M|T|W|F|S)/g;
    const matchedDays = days.match(dayPattern);

    if (!matchedDays) {
      console.error("Invalid day format:", days);
      return '';
    }

    const dayList = matchedDays.map(day => dayMap[day]).join(',');

    return `RRULE:FREQ=WEEKLY;BYDAY=${dayList};UNTIL=${endDate}T235959Z`;
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: '#E4E2DD',
        padding: '20px',
      }}
    >
      <Container maxWidth="xl">
        <Box
          sx={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row', // Adjust layout on mobile
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            gap: '16px', // Gap between items on mobile
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
            <InputLabel>Subject</InputLabel>
            <Select
              value={selectedSubject}
              onChange={handleSubjectChange}
              label="Subject"
              sx={{
                borderRadius: '20px',
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
        </Box>

        {loading ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '60vh', // Adjust as needed
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
                padding: '0 20px', // Padding for better readability on small screens
              }}
            >
              Great things take time—please hold on while we fetch the latest data for you!
            </Typography>
          </Box>
        ) : error ? (
          <Alert severity="error">Error loading courses: {error.message}</Alert>
        ) : filteredCourses.length > 0 ? (
          <TableContainer component={Paper} sx={{ backgroundColor: '#fff', marginTop: '20px', boxShadow: 3, borderRadius: '12px', maxWidth: '100%' }}>
            <Table>
              <TableHead sx={{ backgroundColor: '#571CE0' }}>
                <TableRow>
                  <TableCell sx={{ color: '#fff', textAlign: 'left', fontWeight: 'bold', padding: '12px' }}>Subject</TableCell>
                  <TableCell sx={{ color: '#fff', textAlign: 'left', fontWeight: 'bold', padding: '12px' }}>Number</TableCell>
                  <TableCell sx={{ color: '#fff', textAlign: 'left', fontWeight: 'bold', padding: '12px' }}>Section</TableCell>
                  <TableCell sx={{ color: '#fff', textAlign: 'left', fontWeight: 'bold', padding: '12px' }}>Title</TableCell>
                  <TableCell sx={{ color: '#fff', textAlign: 'left', fontWeight: 'bold', padding: '12px' }}>Period</TableCell>
                  <TableCell sx={{ color: '#fff', textAlign: 'left', fontWeight: 'bold', padding: '12px' }}>Timing</TableCell>
                  <TableCell sx={{ color: '#fff', textAlign: 'left', fontWeight: 'bold', padding: '12px' }}>Room</TableCell>
                  <TableCell sx={{ color: '#fff', textAlign: 'left', fontWeight: 'bold', padding: '12px' }}>Building</TableCell>
                  <TableCell sx={{ color: '#fff', textAlign: 'left', fontWeight: 'bold', padding: '12px' }}>Instructor</TableCell>
                  <TableCell sx={{ color: '#fff', textAlign: 'left', fontWeight: 'bold', padding: '12px' }}>Get the schedule ready!</TableCell>
                  {/* <TableCell sx={{ color: '#fff', textAlign: 'left', fontWeight: 'bold', padding: '12px' }}>Limit</TableCell>
                  <TableCell sx={{ color: '#fff', textAlign: 'left', fontWeight: 'bold', padding: '12px' }}>Add to Calendar</TableCell> */}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCourses.map((course, index) => (
                  <TableRow
                    key={index}
                    sx={{
                      backgroundColor: index % 2 === 0 ? '#fafafa' : '#f4f4f4',
                      '&:hover': { backgroundColor: '#e0e0e0' },
                      cursor: 'pointer',
                      textDecoration: 'none',
                      color: 'inherit',
                    }}
                  >
                    <TableCell sx={{ color: 'black', padding: '12px', textAlign: 'left' }}>{course.subj}</TableCell>
                    <TableCell sx={{ color: 'black', padding: '12px', textAlign: 'left' }}>{course.num}</TableCell>
                    <TableCell sx={{ color: 'black', padding: '12px', textAlign: 'left' }}>{course.sec}</TableCell>
                    <TableCell sx={{ color: 'black', padding: '12px', textAlign: 'left' }}>{course.title}</TableCell>
                    <TableCell sx={{ color: 'black', padding: '12px', textAlign: 'left' }}>{course.period}</TableCell>
                    <TableCell sx={{ color: 'black', padding: '12px', textAlign: 'left' }}>{course.timing}</TableCell>
                    <TableCell sx={{ color: 'black', padding: '12px', textAlign: 'left' }}>{course.room}</TableCell>
                    <TableCell sx={{ color: 'black', padding: '12px', textAlign: 'left' }}>{course.building}</TableCell>
                    <TableCell sx={{ color: 'black', padding: '12px', textAlign: 'left' }}>{course.instructor}</TableCell>
                    {/* <TableCell sx={{ color: 'black', padding: '12px', textAlign: 'left' }}>{course.enrl}</TableCell>
                    <TableCell sx={{ color: 'black', padding: '12px', textAlign: 'left' }}>{course.lim}</TableCell> */}
                    <TableCell sx={{ color: 'black', padding: '12px', textAlign: 'left' }}>
                      {course.period !== 'ARR' && course.period !== 'FS' && (
                        <GoogleCalendarButton onClick={() => handleAddToCalendar(course)}>
                          <div className="icon">
                            <GoogleIcon />
                          </div>
                          <span className="text">
                            Add it to your Calendar.
                          </span>
                        </GoogleCalendarButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography>No courses available</Typography>
        )}
      </Container>

      {/* Snackbar for displaying the success message */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        message="Thank you, you will be notified if someone drops the class."
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
    
  );
};



export default Timetable;
