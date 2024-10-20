import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Alert,
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
  useMediaQuery,
  CircularProgress,
  Switch,
  FormControlLabel,
  Tooltip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import departmentOverview from '../classstructure/departmentOverview';
import _ from 'lodash';
import { styled, tooltipClasses } from '@mui/material/styles';
import axios from 'axios'; // Assuming you're using axios for HTTP requests
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const CACHE_KEY = 'departmentCoursesData';
const CACHE_EXPIRATION = 120 * 24 * 60 * 60 * 1000; // 90 days in milliseconds

const departmentEmojis = {
  'African and African American Studies': '🏫',
  'Asian and Middle Eastern Languages and Literatures': '🌏',
  'Asian and Middle Eastern Studies': '🌍',
  'Anthropology': '🦴',
  'Arabic': '🕌',
  'Art History': '🖼️',
  'Asian Societies, Cultures, and Languages': '🎎',
  'Astronomy': '🌠',
  'Biological Sciences': '🧬',
  'Chemistry': '⚗️',
  'Chinese': '🀄',
  'Classical Studies': '🏛️',
  'College Courses': '🎓',
  'Cognitive Science': '🧠',
  'Comparative Literature': '📚',
  'Computer Science': '💻',
  'English and Creative Writing': '✍️',
  'Earth Sciences': '🌍',
  'Economics': '📈',
  'Education': '🏫',
  'English': '📖',
  'Engineering Sciences': '🛠️',
  'Environmental Studies': '🌱',
  'Film and Media Studies': '🎬',
  'French': '🇫🇷',
  'French and Italian in Translation': '📚',
  'Geography': '🗺️',
  'German Studies': '🇩🇪',
  'Government': '🏛️',
  'Greek': '🇬🇷',
  'Master of Health Care Delivery Science': '💉',
  'Hebrew': '✡️',
  'History': '📜',
  'Humanities': '🏛️',
  'International Studies': '🌍',
  'Italian': '🇮🇹',
  'Japanese': '🎌',
  'Jewish Studies': '✡️',
  'Latin American and Caribbean Studies': '🌎',
  'Latin': '🏛️',
  'Latino Studies': '🌎',
  'Linguistics': '🗣️',
  'Mathematics': '📊',
  'Middle Eastern Studies': '🕌',
  'Music': '🎵',
  'Native American and Indigenous Studies': '🪶',
  'Native American Studies': '🦅',
  'Public Policy': '🏛️',
  'Philosophy': '💭',
  'Physics': '🔭',
  'Portuguese': '🇵🇹',
  'Psychological and Brain Sciences': '🧠',
  'Quantitative Social Science': '📊',
  'Religion': '⛪',
  'Russian Language and Literature': '🇷🇺',
  'Studio Art': '🎨',
  'Sociology': '👥',
  'Spanish': '🇪🇸',
  'Speech': '🗣️',
  'Social Science': '👥',
  'Theater': '🎭',
  'Tuck Undergraduate Courses': '💼',
  'Women\'s, Gender, and Sexuality Studies': '👩‍🔬',
  'Writing Courses': '✍️'
};

// Function to get the most popular course based on layup score
const getMostPopularCourse = (department) => {
  const cachedData = JSON.parse(localStorage.getItem(`courses_${department}`));
  if (cachedData && Array.isArray(cachedData.courses)) {
    const sortedCourses = cachedData.courses.sort((a, b) => b.layup - a.layup);
    return sortedCourses[0]?.name || 'No popular course found';
  }
  return 'No data available';
};

// Custom Tooltip with styling
const CustomTooltip = styled(({ className, ...props }) => (
  <Tooltip {...props} classes={{ popper: className }} />
))({
  '& .MuiTooltip-tooltip': {
    backgroundColor: '#f5f5f9',
    color: 'rgba(0, 0, 0, 0.87)',
    maxWidth: 300,
    fontSize: '14px',
    border: '1px solid #dadde9',
    borderRadius: '10px',
    boxShadow: '0px 6px 20px rgba(0, 0, 0, 0.15)',
    padding: '15px',
    transition: 'all 0.3s ease',
    fontFamily: 'SF Pro Display, sans-serif',  // Apple-like typography
  },
  '& .MuiTooltip-arrow': {
    color: '#f5f5f9',
  },
});

// // Tooltip content can also be improved by adding emojis or icons
// const getMostPopularCourseTooltip = (department) => {
//   const courseName = getMostPopularCourse(department);
//   return (
//     <React.Fragment>
//       <Typography sx={{ fontWeight: 600, color: '#571CE0', fontSize: '1.1rem' }}>
//         📘 Most Popular Course
//       </Typography>
//       <Typography sx={{ fontWeight: 400, color: '#333', fontSize: '1rem' }}>
//         {courseName !== 'No data available' ? courseName : 'No popular course found'}
//       </Typography>
//     </React.Fragment>
//   );
// };

const AllClassesPage = () => {
  const [departments, setDepartments] = useState([]);
  const [filteredDepartments, setFilteredDepartments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEmojis, setShowEmojis] = useState(true);
  const exampleIndexRef = useRef(0);
  const charIndexRef = useRef(0);
  const forwardRef = useRef(true);
  const [placeholder, setPlaceholder] = useState('');
  const [popularCourses, setPopularCourses] = useState({});
  const [popularLoading, setPopularLoading] = useState(true);

  const isMobile = useMediaQuery('(max-width:600px)');

  const departmentExamples = useMemo(() => ['Search Departments', 'Computer Science', 'Biology', 'Chemistry', 'History', 'Mathematics'], []);

  // Function to toggle the emoji display state
  const toggleEmojiDisplay = () => {
    setShowEmojis(!showEmojis);
  };

  // Function to check if the cache is valid
  const isCacheValid = (cachedData) => {
    return cachedData && (Date.now() - cachedData.timestamp) < CACHE_EXPIRATION;
  };

  // Fetch and cache the most popular course for each department
  const fetchAndCachePopularCourses = async () => {
    setPopularLoading(true);
    const popularCoursesData = {};
  
    for (const department of Object.keys(departmentOverview)) {
      try {
        // Query Firestore for courses in the department
        const q = query(collection(db, 'courses'), where('department', '==', department));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const courses = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          const sortedCourses = courses.sort((a, b) => b.layup - a.layup);
          popularCoursesData[department] = sortedCourses[0]?.name || 'No popular course found';
        } else {
          popularCoursesData[department] = 'No data available';
        }
      } catch (error) {
        console.error(`Error fetching data for ${department}:`, error);
        popularCoursesData[department] = 'Error fetching data';
      }
    }
  
    // Cache the data with a timestamp
    const cacheData = {
      data: popularCoursesData,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));

    setPopularCourses(popularCoursesData);
    setPopularLoading(false);
  };

  // Pre-fetch department data and dynamically fetch or load cached popular courses
  useEffect(() => {
    const fetchDepartments = () => {
      try {
        const departmentCodes = Object.keys(departmentOverview);
        setDepartments(departmentCodes);
        setFilteredDepartments(departmentCodes);

        // Check for cached data
        const cachedData = JSON.parse(localStorage.getItem(CACHE_KEY));
        if (isCacheValid(cachedData)) {
          setPopularCourses(cachedData.data);
          setPopularLoading(false);
        } else {
          fetchAndCachePopularCourses();
        }
      } catch (error) {
        setError('Failed to fetch departments.');
        console.error('Error fetching departments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  useEffect(() => {
    let timeout;

    const type = () => {
      if (forwardRef.current) {
        if (charIndexRef.current < departmentExamples[exampleIndexRef.current].length) {
          setPlaceholder((prev) => prev + departmentExamples[exampleIndexRef.current].charAt(charIndexRef.current));
          charIndexRef.current++;
          timeout = setTimeout(type, 100);
        } else {
          forwardRef.current = false;
          timeout = setTimeout(type, 1000);
        }
      } else {
        if (charIndexRef.current > 0) {
          setPlaceholder((prev) => prev.slice(0, -1));
          charIndexRef.current--;
          timeout = setTimeout(type, 50);
        } else {
          forwardRef.current = true;
          exampleIndexRef.current = (exampleIndexRef.current + 1) % departmentExamples.length;
          timeout = setTimeout(type, 500);
        }
      }
    };

    timeout = setTimeout(type, 500);

    return () => clearTimeout(timeout);
  }, [departmentExamples]);

  const handleSearch = (event) => {
    const term = event.target.value.toLowerCase();
    setSearchTerm(term);

    const filtered = departments.filter((department) =>
      department.toLowerCase().includes(term) ||
      departmentOverview[department]?.name.toLowerCase().includes(term)
    );

    setFilteredDepartments(filtered);
  };

  const getEmoji = (departmentName) => {
    return showEmojis ? (departmentEmojis[departmentName] || '🏫') : ''; // Conditionally show emoji
  };

  const getMostPopularCourseTooltip = (department) => {
    if (popularLoading) {
      return (
        <React.Fragment>
          <Typography sx={{ fontWeight: 600, color: '#571CE0', fontSize: '1.1rem' }}>
            📘 Most Popular Course
          </Typography>
          <Typography sx={{ fontWeight: 400, color: '#333', fontSize: '1rem' }}>
            Loading...
          </Typography>
        </React.Fragment>
      );
    }

    const courseName = popularCourses[department] || 'No data available';
    return (
      <React.Fragment>
        <Typography sx={{ fontWeight: 600, color: '#571CE0', fontSize: '1.1rem' }}>
          📘 Most Popular Course
        </Typography>
        <Typography sx={{ fontWeight: 400, color: '#333', fontSize: '1rem' }}>
          {courseName}
        </Typography>
      </React.Fragment>
    );
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: '#F9F9F9',
        padding: '30px',
        fontFamily: 'SF Pro Display, sans-serif',
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <Typography
            variant="h3"
            align="left"
            sx={{
              fontWeight: 600,
              fontFamily: 'SF Pro Display, sans-serif',
              color: '#571CE0',
              marginBottom: '0px',
              marginTop: '0px',  // Adjust margin to align with the search bar
            }}
          >
            All Departments at <span style={{ color: '#349966' }}>Dartmouth</span>
          </Typography>

          <TextField
            variant="outlined"
            placeholder={placeholder}
            value={searchTerm}
            onChange={handleSearch}
            sx={{
              width: isMobile ? '100%' : '350px',
              height: '45px', // Consistent height
              borderRadius: '25px',
              backgroundColor: '#FFFFFF',
              boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
              marginTop: '0px',  // Align with Typography
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: '#571CE0',
                  borderWidth: '2px',
                },
                '&:hover fieldset': {
                  borderColor: '#571CE0',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#571CE0',
                },
                paddingLeft: '10px',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                borderRadius: '25px',
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#571CE0', marginRight: '5px' }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>

       {/* Switch to toggle emoji display */}
       <Box sx={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000 }}>
          <FormControlLabel
            control={
              <Switch checked={showEmojis} onChange={toggleEmojiDisplay} color="primary" />
            }
            label="Show Emojis"
          />
        </Box>

        {loading ? (
          <CircularProgress color="primary" />
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : filteredDepartments.length > 0 ? (
          <TableContainer
            component={Paper}
            sx={{
              backgroundColor: '#FFFFFF',
              marginTop: '20px',
              borderRadius: '15px',
              boxShadow: '0 6px 16px rgba(0, 0, 0, 0.08)',
              padding: '20px',
              overflow: 'hidden',
            }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      color: 'black',
                      textAlign: 'left',
                      fontWeight: 'bold',
                      fontSize: '1rem',
                      paddingBottom: '15px',
                      borderBottom: 'none',
                    }}
                  >
                    Code
                  </TableCell>
                  <TableCell
                    sx={{
                      color: 'black',
                      textAlign: 'left',
                      fontWeight: 'bold',
                      fontSize: '1rem',
                      paddingBottom: '15px',
                      borderBottom: 'none',
                    }}
                  >
                    Department Name
                  </TableCell>
                  {!isMobile && (
                    <TableCell
                      sx={{
                        color: 'black',
                        textAlign: 'left',
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        paddingBottom: '15px',
                        borderBottom: 'none',
                      }}
                    >
                      Total Courses
                    </TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredDepartments.map((department, index) => (
                  <CustomTooltip 
                    key={index} 
                    title={getMostPopularCourseTooltip(department)}
                    placement="top" 
                    arrow
                  >
                    <TableRow
                      component={Link}
                      to={`/departments/${department}`}
                      sx={{
                        backgroundColor: index % 2 === 0 ? '#F8F8F8' : '#FFFFFF',
                        transition: 'transform 0.4s ease, background-color 0.4s ease, box-shadow 0.4s ease',
                        '&:hover': {
                          backgroundColor: '#E9E9E9',
                          transform: 'scale(1.03)',
                          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.12)',
                          border: '1px solid rgba(87, 28, 224, 0.1)',
                        },
                        cursor: 'pointer',
                        textDecoration: 'none',
                        color: 'inherit',
                        borderRadius: '10px',
                      }}
                    >
                      <TableCell
                        sx={{
                          color: '#333',
                          padding: '15px',
                          fontSize: '1rem',
                          borderBottom: 'none',
                        }}
                      >
                        {department} {getEmoji(departmentOverview[department]?.name || department)}
                      </TableCell>
                      <TableCell
                        sx={{
                          color: '#333',
                          padding: '15px',
                          fontSize: '1rem',
                          borderBottom: 'none',
                        }}
                      >
                        {departmentOverview[department]?.name || department}
                      </TableCell>
                      {!isMobile && (
                        <TableCell
                          sx={{
                            color: '#333',
                            padding: '15px',
                            fontSize: '1rem',
                            borderBottom: 'none',
                          }}
                        >
                          {departmentOverview[department]?.courses || 'N/A'}
                        </TableCell>
                      )}
                    </TableRow>
                  </CustomTooltip>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography>No departments available</Typography>
        )}
      </Container>
    </Box>
  );
};

export default AllClassesPage;

{/* <TableRow
  component={Link}
  to={`/departments/${department}`}
  sx={{
    backgroundColor: index % 2 === 0 ? '#F8F8F8' : '#FFFFFF',
    transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
    '&:hover': {
      backgroundColor: '#E9E9E9',  // Subtle background color change
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',  // Softer shadow effect for elevation
    },
    cursor: 'pointer',
    textDecoration: 'none',
    color: 'inherit',
    borderRadius: '8px',  // Slightly softer rounding for a modern feel
  }}
>
  <TableCell
    sx={{
      color: '#333',
      padding: '15px',
      fontSize: '1rem',
      borderBottom: 'none',
    }}
  >
    {department} {getEmoji(departmentOverview[department]?.name || department)}
  </TableCell>
  <TableCell
    sx={{
      color: '#333',
      padding: '15px',
      fontSize: '1rem',
      borderBottom: 'none',
    }}
  >
    {departmentOverview[department]?.name || department}
  </TableCell>
  {!isMobile && (
    <TableCell
      sx={{
        color: '#333',
        padding: '15px',
        fontSize: '1rem',
        borderBottom: 'none',
      }}
    >
      {departmentOverview[department]?.courses || 'N/A'}
    </TableCell>
  )}
</TableRow> */}