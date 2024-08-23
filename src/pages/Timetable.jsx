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
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useAuth } from '../contexts/AuthContext'; // Assuming you have an Auth context
import { getFirestore, collection, getDocs } from "firebase/firestore"; // Import Firestore functions

const Timetable = () => {
  const [filteredCourses, setFilteredCourses] = useState([]);
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
    "LSA": "Language Study Abroad"
  };

  useEffect(() => {
    fetchFirestoreCourses(); // Fetch Firestore data when the component mounts
  }, []);

  useEffect(() => {
    applyFilters(filteredCourses, searchTerm, selectedSubject);
  }, [searchTerm, selectedSubject, filteredCourses]);

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
          lim: doc.data().Lim,
          enrl: doc.data().Enrl,
          // status: doc.data().Enrl >= doc.data().Lim ? 'Full' : 'Open', // Assuming status based on enrollment
        };
      });
      setFilteredCourses(coursesData); // Set initially to Firestore data
      extractSubjects(coursesData);
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

  const applyFilters = (courses, searchTerm, selectedSubject) => {
    let filtered = courses;

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
                  <TableCell sx={{ color: '#fff', textAlign: 'left', fontWeight: 'bold', padding: '12px' }}>Enrollment</TableCell>
                  <TableCell sx={{ color: '#fff', textAlign: 'left', fontWeight: 'bold', padding: '12px' }}>Limit</TableCell>
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
                    <TableCell sx={{ color: 'black', padding: '12px', textAlign: 'left' }}>{course.enrl}</TableCell>
                    <TableCell sx={{ color: 'black', padding: '12px', textAlign: 'left' }}>{course.lim}</TableCell>
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





/**
 * Below is the code with implementing the feature of fetching the courses from the live timetable
 * 
 * 
 * 
 */

// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import {
//   Box,
//   Container,
//   Paper,
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   Typography,
//   Button,
//   TextField,
//   InputAdornment,
//   CircularProgress,
//   Alert,
//   useMediaQuery,
//   MenuItem,
//   Select,
//   FormControl,
//   InputLabel,
//   Snackbar,
// } from '@mui/material';
// import SearchIcon from '@mui/icons-material/Search';
// import { useAuth } from '../contexts/AuthContext'; // Assuming you have an Auth context
// import { getFirestore, collection, getDocs } from "firebase/firestore"; // Import Firestore functions

// const Timetable = () => {
//   const [courses, setCourses] = useState([]);
//   const [filteredCourses, setFilteredCourses] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [selectedSubject, setSelectedSubject] = useState('');
//   const [subjects, setSubjects] = useState([]);
//   const [snackbarOpen, setSnackbarOpen] = useState(false); // State for Snackbar
//   const [useLiveData, setUseLiveData] = useState(true); // State to toggle between live data and Firestore data
//   const [firestoreCourses, setFirestoreCourses] = useState([]); // State to hold Firestore data
//   const { currentUser } = useAuth();
//   const isMobile = useMediaQuery('(max-width:600px)');

//   const API_BASE_URL = 'https://courseme-734e28b3fc3d.herokuapp.com';

//   useEffect(() => {

//     if (useLiveData) {
//       fetchCourses();
//       const intervalId = setInterval(() => {
//         fetchCourses();
//       }, 60000); // Polling every minute for live data

//       return () => clearInterval(intervalId); // Cleanup interval on component unmount
//     } else {
//       fetchFirestoreCourses(); // Fetch Firestore data
//     }
//   }, [useLiveData]);

//   useEffect(() => {
//     applyFilters(useLiveData ? courses : firestoreCourses, searchTerm, selectedSubject);
//   }, [searchTerm, selectedSubject, courses, firestoreCourses, useLiveData]);

//   const fetchCourses = async () => {
//     try {
//       const response = await axios.get(`${API_BASE_URL}/api/courses`);
//       console.log('Fetched Courses:', response.data);
//       if (Array.isArray(response.data)) {
//         setCourses(response.data);
//         setFilteredCourses(response.data); // Initialize with all courses
//         extractSubjects(response.data);
//       } else {
//         console.error('Unexpected API response:', response.data);
//         setError(new Error('Unexpected API response format'));
//       }
//       setLoading(false);
//     } catch (error) {
//       console.error('Error fetching courses:', error);
//       setError(error);
//       setLoading(false);
//     }
//   };

//   const fetchFirestoreCourses = async () => {
//     try {
//       const db = getFirestore();
//       const coursesSnapshot = await getDocs(collection(db, "fallTimetable"));
//       const coursesData = coursesSnapshot.docs.map((doc) => ({
//         subj: doc.data().Subj,
//         num: doc.data().Num,
//         sec: doc.data().Section,
//         title: doc.data().Title,
//         period: doc.data()["Period Code"], // Handling the space in "Period Code"
//         room: doc.data().Room,
//         building: doc.data().Building,
//         instructor: doc.data().Instructor,
//         lim: doc.data().Lim,
//         enrl: doc.data().Enrl,
//         status: doc.data().Enrl >= doc.data().Lim ? 'Full' : 'Open', // Assuming status based on enrollment
//       }));
//       setFirestoreCourses(coursesData);
//       setFilteredCourses(coursesData); // Set initially to Firestore data
//       extractSubjects(coursesData);
//       setLoading(false);
//     } catch (error) {
//       console.error("Error fetching Firestore courses:", error);
//       setError(error);
//       setLoading(false);
//     }
//   };

//   const extractSubjects = (courses) => {
//     const subjectsSet = new Set(courses.map((course) => course.subj));
//     setSubjects([...subjectsSet]);
//   };

//   const applyFilters = (courses, searchTerm, selectedSubject) => {
//     let filtered = courses;

//     if (searchTerm) {
//       filtered = filtered.filter((course) =>
//         course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         course.subj.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         course.instructor.toLowerCase().includes(searchTerm.toLowerCase())
//       );
//     }

//     if (selectedSubject) {
//       filtered = filtered.filter((course) => course.subj === selectedSubject);
//     }

//     setFilteredCourses(filtered);
//   };

//   const handleSearch = (event) => {
//     const term = event.target.value;
//     setSearchTerm(term);
//   };

//   const handleSubjectChange = (event) => {
//     const subject = event.target.value;
//     setSelectedSubject(subject);
//   };

//   const handleSubscribe = async (course) => {
//     if (!currentUser) {
//       alert('Please log in to subscribe.');
//       return;
//     }

//     if (course.status.includes('IP')) {
//       alert('This course requires instructor permission and cannot be subscribed to for notifications.');
//       return;
//     }

//     try {
//       const response = await axios.post(`${API_BASE_URL}/api/subscribe`, {
//         userId: currentUser.uid,
//         courseId: course.crn,
//         email: currentUser.email,
//         courseName: course.title,
//         courseNum: course.num,
//       });
//       console.log('Subscription response:', response);
//       alert(response.data.message);
//       setSnackbarOpen(true);
//     } catch (error) {
//       console.error('Error subscribing to notifications:', error);
//       if (error.response) {
//         console.error('Response data:', error.response.data);
//         console.error('Response status:', error.response.status);
//         console.error('Response headers:', error.response.headers);
//       }
//       alert(`Failed to subscribe: ${error.message}`);
//     }
//   };

//   const handleSnackbarClose = () => {
//     setSnackbarOpen(false);
//   };

//   return (
//     <Box
//       sx={{
//         minHeight: '100vh',
//         display: 'flex',
//         flexDirection: 'column',
//         alignItems: 'center',
//         backgroundColor: '#E4E2DD',
//         padding: '20px',
//       }}
//     >
//       <Box
//         sx={{
//           position: 'fixed',
//           top: 80,
//           right: 35,
//           display: 'flex',
//           alignItems: 'center',
//           zIndex: 1000,
//         }}
//       >
//         <Box
//           sx={{
//             width: 10,
//             height: 10,
//             backgroundColor: '#F26655', // Purple color for the dot
//             borderRadius: '50%',
//             marginRight: '8px',
//             animation: 'blinker 1.5s linear infinite',
//             '@keyframes blinker': {
//               '50%': { opacity: 0 },
//             },
//           }}
//         />
//         <Typography variant="body2" sx={{ fontWeight: 'semi-bold', fontFamily: 'SF Pro Display, sans-serif', color: 'black' }}>
//           Fetching Live Courses
//         </Typography>
//       </Box>
//       <Container maxWidth="xl">
//         <Box
//           sx={{
//             display: 'flex',
//             flexDirection: isMobile ? 'column' : 'row', // Adjust layout on mobile
//             justifyContent: 'space-between',
//             alignItems: 'center',
//             width: '100%',
//             gap: '16px', // Gap between items on mobile
//           }}
//         >
//           <Typography
//             variant="h3"
//             align="left"
//             sx={{
//               fontWeight: 600,
//               fontFamily: 'SF Pro Display, sans-serif',
//               color: '#571CE0',
//               marginBottom: '0px',
//               marginTop: '20px',
//             }}
//           >
//             Fall '24 Timetable
//           </Typography>
//           <TextField
//             variant="outlined"
//             placeholder="Search Courses"
//             value={searchTerm}
//             onChange={handleSearch}
//             sx={{
//               width: isMobile ? '100%' : '300px',
//               height: '40px',
//               borderRadius: '20px',
//               boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
//               marginTop: '25px',
//               '& .MuiOutlinedInput-root': {
//                 '& fieldset': {
//                   borderColor: '#571CE0',
//                 },
//                 '&:hover fieldset': {
//                   borderColor: '#571CE0',
//                 },
//                 '&.Mui-focused fieldset': {
//                   borderColor: '#571CE0',
//                 },
//                 borderRadius: '20px',
//                 height: '40px',
//               },
//             }}
//             InputProps={{
//               startAdornment: (
//                 <InputAdornment position="start">
//                   <SearchIcon sx={{ color: '#571CE0' }} />
//                 </InputAdornment>
//               ),
//             }}
//           />
//           <FormControl variant="outlined" sx={{ minWidth: isMobile ? '100%' : 200, marginTop: '25px' }}>
//             <InputLabel>Subject</InputLabel>
//             <Select
//               value={selectedSubject}
//               onChange={handleSubjectChange}
//               label="Subject"
//               sx={{
//                 borderRadius: '20px',
//                 '& .MuiOutlinedInput-root': {
//                   '& fieldset': {
//                     borderColor: '#571CE0',
//                   },
//                   '&:hover fieldset': {
//                     borderColor: '#571CE0',
//                   },
//                   '&.Mui-focused fieldset': {
//                     borderColor: '#571CE0',
//                   },
//                   borderRadius: '20px',
//                 },
//               }}
//             >
//               <MenuItem value="">
//                 <em>All Subjects</em>
//               </MenuItem>
//               {subjects.map((subject, index) => (
//                 <MenuItem key={index} value={subject}>
//                   {subject}
//                 </MenuItem>
//               ))}
//             </Select>
//           </FormControl>
//           <Button
//             variant="contained"
//             color={useLiveData ? "primary" : "secondary"}
//             onClick={() => {
//               setUseLiveData(!useLiveData);
//               if (!useLiveData) {
//                 fetchCourses(); // Fetch live data
//               } else {
//                 fetchFirestoreCourses(); // Fetch Firestore data
//               }
//             }}
//             sx={{ marginTop: '20px', borderRadius: '20px' }}
//           >
//             {useLiveData ? "Switch to Firestore Data" : "Switch to Live Data"}
//           </Button>
//         </Box>

//         {loading ? (
//           <Box
//             sx={{
//               display: 'flex',
//               flexDirection: 'column',
//               alignItems: 'center',
//               justifyContent: 'center',
//               height: '60vh', // Adjust as needed
//             }}
//           >
//             <CircularProgress color="primary" size={60} />
//             <Typography
//               variant="h6"
//               sx={{
//                 marginTop: '20px',
//                 fontFamily: 'SF Pro Display, sans-serif',
//                 color: 'black',
//                 textAlign: 'center',
//                 padding: '0 20px', // Padding for better readability on small screens
//               }}
//             >
//               Great things take time—please hold on while we fetch the latest data for you!
//             </Typography>
//           </Box>
//         ) : error ? (
//           <Alert severity="error">Error loading courses: {error.message}</Alert>
//         ) : filteredCourses.length > 0 ? (
//           <TableContainer component={Paper} sx={{ backgroundColor: '#fff', marginTop: '20px', boxShadow: 3, borderRadius: '12px', maxWidth: '100%' }}>
//             <Table>
//               <TableHead sx={{ backgroundColor: '#571CE0' }}>
//                 <TableRow>
//                   <TableCell sx={{ color: '#fff', textAlign: 'left', fontWeight: 'bold', padding: '12px' }}>Subject</TableCell>
//                   <TableCell sx={{ color: '#fff', textAlign: 'left', fontWeight: 'bold', padding: '12px' }}>Number</TableCell>
//                   <TableCell sx={{ color: '#fff', textAlign: 'left', fontWeight: 'bold', padding: '12px' }}>Section</TableCell>
//                   <TableCell sx={{ color: '#fff', textAlign: 'left', fontWeight: 'bold', padding: '12px' }}>Title</TableCell>
//                   <TableCell sx={{ color: '#fff', textAlign: 'left', fontWeight: 'bold', padding: '12px' }}>Period</TableCell>
//                   <TableCell sx={{ color: '#fff', textAlign: 'left', fontWeight: 'bold', padding: '12px' }}>Room</TableCell>
//                   <TableCell sx={{ color: '#fff', textAlign: 'left', fontWeight: 'bold', padding: '12px' }}>Building</TableCell>
//                   <TableCell sx={{ color: '#fff', textAlign: 'left', fontWeight: 'bold', padding: '12px' }}>Instructor</TableCell>
//                   <TableCell sx={{ color: '#fff', textAlign: 'left', fontWeight: 'bold', padding: '12px' }}>Enrollment</TableCell>
//                   <TableCell sx={{ color: '#fff', textAlign: 'left', fontWeight: 'bold', padding: '12px' }}>Limit</TableCell>
//                   <TableCell sx={{ color: '#fff', textAlign: 'left', fontWeight: 'bold', padding: '12px' }}>Status</TableCell> {/* Added Status column */}
//                   <TableCell sx={{ color: '#fff', textAlign: 'left', fontWeight: 'bold', padding: '12px' }}>Actions</TableCell>
//                 </TableRow>
//               </TableHead>
//               <TableBody>
//                 {filteredCourses.map((course, index) => (
//                   <TableRow
//                     key={index}
//                     sx={{
//                       backgroundColor: index % 2 === 0 ? '#fafafa' : '#f4f4f4',
//                       '&:hover': { backgroundColor: '#e0e0e0' },
//                       cursor: 'pointer',
//                       textDecoration: 'none',
//                       color: 'inherit',
//                     }}
//                   >
//                     <TableCell sx={{ color: 'black', padding: '12px', textAlign: 'left' }}>{course.subj}</TableCell>
//                     <TableCell sx={{ color: 'black', padding: '12px', textAlign: 'left' }}>{course.num}</TableCell>
//                     <TableCell sx={{ color: 'black', padding: '12px', textAlign: 'left' }}>{course.sec}</TableCell>
//                     <TableCell sx={{ color: 'black', padding: '12px', textAlign: 'left' }}>{course.title}</TableCell>
//                     <TableCell sx={{ color: 'black', padding: '12px', textAlign: 'left' }}>{course.period}</TableCell>
//                     <TableCell sx={{ color: 'black', padding: '12px', textAlign: 'left' }}>{course.room}</TableCell>
//                     <TableCell sx={{ color: 'black', padding: '12px', textAlign: 'left' }}>{course.building}</TableCell>
//                     <TableCell sx={{ color: 'black', padding: '12px', textAlign: 'left' }}>{course.instructor}</TableCell>
//                     <TableCell sx={{ color: 'black', padding: '12px', textAlign: 'left' }}>{course.enrl}</TableCell>
//                     <TableCell sx={{ color: 'black', padding: '12px', textAlign: 'left' }}>{course.lim}</TableCell>
//                     <TableCell sx={{ color: 'black', padding: '12px', textAlign: 'left' }}>{course.status}</TableCell> {/* Display the Status here */}
//                     <TableCell sx={{ color: 'black', padding: '12px', textAlign: 'left' }}>
//                       {/* Conditionally render the button based on the enrollment status */}
//                       {course.enrl >= course.lim ? (
//                         <Button variant="contained" color="primary" onClick={() => handleSubscribe(course)}>
//                           Notify Me
//                         </Button>
//                       ) : (
//                         <Typography variant="body2" color="error">
//                           Not eligible for notifications
//                         </Typography>
//                       )}
//                     </TableCell>
//                   </TableRow>
//                 ))}
//               </TableBody>
//             </Table>
//           </TableContainer>
//         ) : (
//           <Typography>No courses available</Typography>
//         )}
//       </Container>

//       {/* Snackbar for displaying the success message */}
//       <Snackbar
//         open={snackbarOpen}
//         autoHideDuration={6000}
//         onClose={handleSnackbarClose}
//         message="Thank you, you will be notified if someone drops the class."
//         anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
//       />
//     </Box>
//   );
// };

// export default Timetable;
