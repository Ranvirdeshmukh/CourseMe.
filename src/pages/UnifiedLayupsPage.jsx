import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  useMediaQuery,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Button,
  Chip,
} from '@mui/material';
import { collection, query, orderBy, getDocs, where, limit, startAfter } from 'firebase/firestore';
import { db } from '../firebase';
import LayupsByTiming from './LayupsByTiming';
import HiddenLayups from './HiddenLayups';

// Constants
const CACHE_VERSION = '2.2';
const MAX_COURSES = 40;
const ITEMS_PER_PAGE = 20;

const UnifiedLayupsPage = ({ darkMode }) => {
  // Tab state
  const [activeTab, setActiveTab] = useState(0);

  // All Layups tab state
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastVisible, setLastVisible] = useState(null);

  // Filter state
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedDistribs, setSelectedDistribs] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [distribs, setDistribs] = useState([]);

  // UI state
  const isMobile = useMediaQuery('(max-width:600px)');
  const scrollContainerRef = useRef(null);

  // Fetch departments and distribs for filters
  const fetchFilters = useCallback(async () => {
    try {
      const q = query(collection(db, 'courses'));
      const querySnapshot = await getDocs(q);

      // Extract departments
      const departmentsData = querySnapshot.docs.map((doc) => doc.data().department);
      const uniqueDepartments = [...new Set(departmentsData)].filter(Boolean).sort();
      setDepartments(uniqueDepartments);

      // Extract distribs
      const distribsData = querySnapshot.docs.flatMap((doc) => {
        const distribField = doc.data().distribs;
        if (typeof distribField === 'string') {
          return distribField.split(',').map((distrib) => distrib.trim());
        }
        return [];
      });
      const uniqueDistribs = [...new Set(distribsData)].filter(Boolean).sort();
      setDistribs(uniqueDistribs);
    } catch (error) {
      console.error('Error fetching filters:', error);
    }
  }, []);

  // Fetch courses with filters and pagination
  const fetchCourses = useCallback(
    async (isInitial = false, isFiltered = false) => {
      if (loading || (!hasMore && !isInitial && !isFiltered)) return;

      try {
        setLoading(true);
        setError(null);

        let q;

        // If filters are applied
        if (selectedDepartment || selectedDistribs.length > 0) {
          // Build query with department filter if selected
          if (selectedDepartment) {
            // Department filter query
            if (!isInitial && lastVisible) {
              // Paginated query with startAfter
              q = query(
                collection(db, 'courses'),
                where('department', '==', selectedDepartment),
                orderBy('layup', 'desc'),
                startAfter(lastVisible),
                limit(ITEMS_PER_PAGE)
              );
            } else {
              // Initial query
              q = query(
                collection(db, 'courses'),
                where('department', '==', selectedDepartment),
                orderBy('layup', 'desc'),
                limit(ITEMS_PER_PAGE)
              );
            }
          } else {
            // Distrib-only filter (no department filter)
            if (!isInitial && lastVisible) {
              // Paginated query with startAfter
              q = query(
                collection(db, 'courses'),
                orderBy('layup', 'desc'),
                startAfter(lastVisible),
                limit(ITEMS_PER_PAGE * 3) // Fetch more for distrib filtering
              );
            } else {
              // Initial query
              q = query(
                collection(db, 'courses'),
                orderBy('layup', 'desc'),
                limit(ITEMS_PER_PAGE * 3) // Fetch more for distrib filtering
              );
            }
          }

          const querySnapshot = await getDocs(q);
          let coursesData = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            name: doc.data().name,
            department: doc.data().department,
            distribs: doc.data().distribs,
            numOfReviews: doc.data().numOfReviews,
            layup: doc.data().layup,
          }));

          // Filter by distribs if selected
          if (selectedDistribs.length > 0) {
            coursesData = coursesData.filter((course) => {
              if (typeof course.distribs === 'string') {
                const courseDistribsList = course.distribs.split(',').map((d) => d.trim());
                return selectedDistribs.some((d) => courseDistribsList.includes(d));
              }
              return false;
            });
          }

          if (isInitial || isFiltered) {
            setCourses(coursesData);
          } else {
            setCourses((prev) => [...prev, ...coursesData]);
          }

          setHasMore(querySnapshot.docs.length >= ITEMS_PER_PAGE);
          if (querySnapshot.docs.length > 0) {
            setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
          }
        } else {
          // No filters - use cache or fetch initial data
          if (isInitial) {
            const cachedData = JSON.parse(localStorage.getItem('topCoursesCache'));
            const now = new Date().getTime();

            if (
              cachedData &&
              cachedData.version === CACHE_VERSION &&
              now - cachedData.timestamp < 24 * 60 * 60 * 1000
            ) {
              setCourses(cachedData.courses);
              setLoading(false);
              setHasMore(false); // Cache has all top courses
              return;
            }

            // Fetch from Firestore
            q = query(
              collection(db, 'courses'),
              orderBy('layup', 'desc'),
              orderBy('name', 'asc'),
              orderBy('__name__', 'asc'),
              limit(MAX_COURSES * 2)
            );

            const querySnapshot = await getDocs(q);
            const coursesData = querySnapshot.docs.map((doc) => ({
              id: doc.id,
              name: doc.data().name,
              department: doc.data().department,
              distribs: doc.data().distribs,
              numOfReviews: doc.data().numOfReviews,
              layup: doc.data().layup,
            }));

            // Remove duplicates
            const uniqueCoursesSet = new Set();
            const uniqueCourses = [];

            coursesData.forEach((course) => {
              const normalizedCourseName = course.name.trim().toLowerCase();
              if (!uniqueCoursesSet.has(normalizedCourseName) && uniqueCourses.length < MAX_COURSES) {
                uniqueCoursesSet.add(normalizedCourseName);
                uniqueCourses.push(course);
              }
            });

            // Cache the results
            localStorage.setItem(
              'topCoursesCache',
              JSON.stringify({
                courses: uniqueCourses,
                timestamp: now,
                version: CACHE_VERSION,
              })
            );

            setCourses(uniqueCourses);
            setHasMore(false); // We have all top courses
          } else {
            // Pagination without filters
            q = query(
              collection(db, 'courses'),
              orderBy('layup', 'desc'),
              orderBy('name', 'asc'),
              orderBy('__name__', 'asc'),
              limit(ITEMS_PER_PAGE)
            );

            if (lastVisible) {
              // This would need startAfter, but for simplicity we'll just stop paginating
              // when we have the top courses cached
              setHasMore(false);
              setLoading(false);
              return;
            }

            const querySnapshot = await getDocs(q);
            const coursesData = querySnapshot.docs.map((doc) => ({
              id: doc.id,
              name: doc.data().name,
              department: doc.data().department,
              distribs: doc.data().distribs,
              numOfReviews: doc.data().numOfReviews,
              layup: doc.data().layup,
            }));

            setCourses((prev) => [...prev, ...coursesData]);
            setHasMore(querySnapshot.docs.length >= ITEMS_PER_PAGE);
            if (querySnapshot.docs.length > 0) {
              setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
            }
          }
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching courses:', error);
        setError('Failed to fetch courses.');
        setLoading(false);
      }
    },
    [loading, hasMore, selectedDepartment, selectedDistribs, lastVisible]
  );

  // Initialize
  useEffect(() => {
    if (activeTab === 0) {
      fetchFilters();
      fetchCourses(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Handle filter changes
  useEffect(() => {
    if (activeTab === 0 && (selectedDepartment || selectedDistribs.length > 0)) {
      setLastVisible(null);
      setHasMore(true);
      fetchCourses(true, true);
    } else if (activeTab === 0 && !selectedDepartment && selectedDistribs.length === 0) {
      // Reset to initial state
      setLastVisible(null);
      setHasMore(true);
      fetchCourses(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDepartment, selectedDistribs, activeTab]);

  // Infinite scroll observer
  useEffect(() => {
    if (activeTab !== 0) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;

      if (scrollHeight - scrollTop - clientHeight < 200 && hasMore && !loading) {
        fetchCourses(false, false);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [activeTab, hasMore, loading, fetchCourses]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    // Reset filters when leaving the All Layups tab
    if (newValue !== 0 && (selectedDepartment || selectedDistribs.length > 0)) {
      setSelectedDepartment('');
      setSelectedDistribs([]);
    }
  };

  const handleDepartmentChange = (event) => {
    setSelectedDepartment(event.target.value);
  };

  const handleDistribChange = (event) => {
    setSelectedDistribs(event.target.value);
  };

  const handleResetFilters = () => {
    setSelectedDepartment('');
    setSelectedDistribs([]);
  };

  const renderLayupsTab = () => (
    <Box>
      {/* Filters */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          mb: 3,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="department-label" sx={{ color: darkMode ? '#fff' : '#571CE0' }}>
            Department
          </InputLabel>
          <Select
            labelId="department-label"
            value={selectedDepartment}
            label="Department"
            onChange={handleDepartmentChange}
            sx={{
              backgroundColor: darkMode ? '#1C1F43' : '#F0F4FF',
              borderRadius: '8px',
              color: darkMode ? '#fff' : 'inherit',
              '&:hover': { backgroundColor: darkMode ? '#24273c' : '#E0E7FF' },
            }}
            MenuProps={{
              PaperProps: {
                style: {
                  maxHeight: 300,
                  backgroundColor: darkMode ? '#1C1F43' : undefined,
                  color: darkMode ? '#fff' : undefined,
                },
              },
            }}
          >
            <MenuItem value="">
              <em>All Departments</em>
            </MenuItem>
            {departments.map((dept, index) => (
              <MenuItem key={index} value={dept} sx={{ color: darkMode ? '#fff' : undefined }}>
                {dept}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="distrib-label" sx={{ color: darkMode ? '#fff' : '#571CE0' }}>
            Distribs
          </InputLabel>
          <Select
            labelId="distrib-label"
            value={selectedDistribs}
            label="Distribs"
            onChange={handleDistribChange}
            multiple
            sx={{
              backgroundColor: darkMode ? '#1C1F43' : '#F0F4FF',
              borderRadius: '8px',
              color: darkMode ? '#fff' : 'inherit',
              '&:hover': { backgroundColor: darkMode ? '#24273c' : '#E0E7FF' },
            }}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => (
                  <Chip key={value} label={value} size="small" />
                ))}
              </Box>
            )}
            MenuProps={{
              PaperProps: {
                style: {
                  maxHeight: 300,
                  backgroundColor: darkMode ? '#1C1F43' : undefined,
                  color: darkMode ? '#fff' : undefined,
                },
              },
            }}
          >
            {distribs.map((dist, index) => (
              <MenuItem key={index} value={dist} sx={{ color: darkMode ? '#fff' : undefined }}>
                {dist}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {(selectedDepartment || selectedDistribs.length > 0) && (
          <Button
            variant="outlined"
            onClick={handleResetFilters}
            sx={{
              borderColor: darkMode ? '#82e1d9' : '#571CE0',
              color: darkMode ? '#82e1d9' : '#571CE0',
              '&:hover': {
                borderColor: darkMode ? '#6bc7bf' : '#4515b0',
                backgroundColor: darkMode ? 'rgba(130, 225, 217, 0.1)' : 'rgba(87, 28, 224, 0.1)',
              },
            }}
          >
            Reset Filters
          </Button>
        )}
      </Box>

      {/* Courses Table with Infinite Scroll */}
      <Box
        ref={scrollContainerRef}
        sx={{
          maxHeight: '600px',
          overflowY: 'auto',
          borderRadius: '10px',
          boxShadow: darkMode
            ? '0 2px 8px rgba(255, 255, 255, 0.1)'
            : '0 2px 8px rgba(0, 0, 0, 0.1)',
          backgroundColor: darkMode ? '#1C1F43' : '#FFFFFF',
        }}
      >
        <TableContainer component={Paper} sx={{ backgroundColor: darkMode ? '#1C1F43' : '#FFFFFF' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    backgroundColor: darkMode ? '#1C1F43' : '#FFFFFF',
                    color: darkMode ? '#fff' : 'black',
                    fontWeight: 600,
                    fontSize: '1rem',
                    borderBottom: darkMode ? '2px solid #444444' : '2px solid #E0E0E0',
                  }}
                >
                  #
                </TableCell>
                <TableCell
                  sx={{
                    backgroundColor: darkMode ? '#1C1F43' : '#FFFFFF',
                    color: darkMode ? '#fff' : 'black',
                    fontWeight: 600,
                    fontSize: '1rem',
                    borderBottom: darkMode ? '2px solid #444444' : '2px solid #E0E0E0',
                  }}
                >
                  Course Name
                </TableCell>
                {!isMobile && (
                  <>
                    <TableCell
                      sx={{
                        backgroundColor: darkMode ? '#1C1F43' : '#FFFFFF',
                        color: darkMode ? '#fff' : 'black',
                        fontWeight: 600,
                        fontSize: '1rem',
                        textAlign: 'center',
                        borderBottom: darkMode ? '2px solid #444444' : '2px solid #E0E0E0',
                      }}
                    >
                      Department
                    </TableCell>
                    <TableCell
                      sx={{
                        backgroundColor: darkMode ? '#1C1F43' : '#FFFFFF',
                        color: darkMode ? '#fff' : 'black',
                        fontWeight: 600,
                        fontSize: '1rem',
                        textAlign: 'center',
                        borderBottom: darkMode ? '2px solid #444444' : '2px solid #E0E0E0',
                      }}
                    >
                      Distribs
                    </TableCell>
                  </>
                )}
                <TableCell
                  sx={{
                    backgroundColor: darkMode ? '#1C1F43' : '#FFFFFF',
                    color: darkMode ? '#fff' : 'black',
                    fontWeight: 600,
                    fontSize: '1rem',
                    textAlign: 'center',
                    borderBottom: darkMode ? '2px solid #444444' : '2px solid #E0E0E0',
                  }}
                >
                  Reviews
                </TableCell>
                <TableCell
                  sx={{
                    backgroundColor: darkMode ? '#1C1F43' : '#FFFFFF',
                    color: darkMode ? '#fff' : 'black',
                    fontWeight: 600,
                    fontSize: '1rem',
                    textAlign: 'center',
                    borderBottom: darkMode ? '2px solid #444444' : '2px solid #E0E0E0',
                  }}
                >
                  Layup Score
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {courses.map((course, index) => (
                <TableRow
                  key={course.id}
                  component={Link}
                  to={`/departments/${course.department}/courses/${course.id}`}
                  sx={{
                    backgroundColor:
                      index % 2 === 0
                        ? darkMode
                          ? '#1C1F43'
                          : '#F8F8F8'
                        : darkMode
                        ? '#24273c'
                        : '#FFFFFF',
                    transition: 'background-color 0.3s ease',
                    '&:hover': {
                      backgroundColor: darkMode ? '#2a2a2a' : '#E9E9E9',
                    },
                    cursor: 'pointer',
                    textDecoration: 'none',
                    color: 'inherit',
                  }}
                >
                  <TableCell
                    sx={{
                      color: darkMode ? '#fff' : 'black',
                      fontWeight: 600,
                      borderBottom: darkMode ? '1px solid #444444' : '1px solid #E0E0E0',
                    }}
                  >
                    {index + 1}
                  </TableCell>
                  <TableCell
                    sx={{
                      color: darkMode ? '#ccc' : '#333',
                      borderBottom: darkMode ? '1px solid #444444' : '1px solid #E0E0E0',
                    }}
                  >
                    {course.name}
                  </TableCell>
                  {!isMobile && (
                    <>
                      <TableCell
                        sx={{
                          color: darkMode ? '#ccc' : '#333',
                          textAlign: 'center',
                          borderBottom: darkMode ? '1px solid #444444' : '1px solid #E0E0E0',
                        }}
                      >
                        {course.department}
                      </TableCell>
                      <TableCell
                        sx={{
                          color: darkMode ? '#ccc' : '#333',
                          textAlign: 'center',
                          borderBottom: darkMode ? '1px solid #444444' : '1px solid #E0E0E0',
                        }}
                      >
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', flexWrap: 'wrap' }}>
                          {typeof course.distribs === 'string' &&
                            course.distribs.split(',').slice(0, 3).map((distrib, idx) => (
                              <Box
                                key={idx}
                                sx={{
                                  backgroundColor: darkMode ? '#333' : '#F0F0F0',
                                  color: darkMode ? '#fff' : '#333',
                                  padding: '2px 8px',
                                  borderRadius: '12px',
                                  fontSize: '0.75rem',
                                  fontWeight: 500,
                                }}
                              >
                                {distrib.trim()}
                              </Box>
                            ))}
                        </Box>
                      </TableCell>
                    </>
                  )}
                  <TableCell
                    sx={{
                      color: darkMode ? '#ccc' : '#333',
                      textAlign: 'center',
                      borderBottom: darkMode ? '1px solid #444444' : '1px solid #E0E0E0',
                    }}
                  >
                    {course.numOfReviews}
                  </TableCell>
                  <TableCell
                    sx={{
                      color: darkMode ? '#ccc' : '#333',
                      textAlign: 'center',
                      fontWeight: 600,
                      borderBottom: darkMode ? '1px solid #444444' : '1px solid #E0E0E0',
                    }}
                  >
                    <Box
                      sx={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        backgroundColor:
                          course.layup >= 80
                            ? darkMode
                              ? '#2ecc71'
                              : '#D1FAE5'
                            : course.layup >= 60
                            ? darkMode
                              ? '#f39c12'
                              : '#FEF3C7'
                            : darkMode
                            ? '#e74c3c'
                            : '#FEE2E2',
                        color:
                          course.layup >= 80
                            ? darkMode
                              ? '#fff'
                              : '#065F46'
                            : course.layup >= 60
                            ? darkMode
                              ? '#fff'
                              : '#92400E'
                            : darkMode
                            ? '#fff'
                            : '#991B1B',
                      }}
                    >
                      {course.layup.toFixed(1)}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Loading indicator */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        )}

        {/* End of results */}
        {!loading && !hasMore && courses.length > 0 && (
          <Box sx={{ textAlign: 'center', p: 2, color: darkMode ? '#ccc' : '#666' }}>
            <Typography variant="body2">End of results</Typography>
          </Box>
        )}
      </Box>

      {error && (
        <Box sx={{ mt: 2 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}
    </Box>
  );

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: darkMode ? '#0C0F33' : '#F9F9F9',
        padding: '40px 20px',
        transition: 'background-color 0.3s ease',
      }}
    >
      <Container maxWidth="lg">
        {/* Header */}
        <Typography
          variant="h2"
          align="center"
          gutterBottom
          sx={{
            fontWeight: 700,
            marginBottom: '20px',
            color: darkMode ? '#fff' : '#2c3e50',
            textShadow: darkMode ? '1px 1px 2px rgba(0, 0, 0, 0.2)' : '1px 1px 2px rgba(0, 0, 0, 0.1)',
          }}
        >
          Dartmouth Layups
        </Typography>

        <Typography
          variant="body2"
          align="center"
          sx={{
            marginBottom: '30px',
            color: darkMode ? '#fff' : '#333',
            backgroundColor: darkMode ? '#333' : '#E0E7FF',
            padding: '10px',
            borderRadius: '8px',
            boxShadow: darkMode
              ? '0 2px 4px rgba(0, 0, 0, 0.5)'
              : '0 2px 4px rgba(0, 0, 0, 0.1)',
          }}
        >
          <strong>Note:</strong> Explore the easiest courses at Dartmouth. Filter by department, distribs, or browse by term.
        </Typography>

        {/* Tabs */}
        <Box
          sx={{
            borderBottom: darkMode ? '1px solid #444' : '1px solid #E0E0E0',
            marginBottom: '30px',
          }}
        >
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{
              '& .MuiTab-root': {
                color: darkMode ? '#ccc' : '#666',
                fontWeight: 600,
                fontSize: '1rem',
                textTransform: 'none',
              },
              '& .Mui-selected': {
                color: darkMode ? '#82e1d9' : '#571CE0',
              },
              '& .MuiTabs-indicator': {
                backgroundColor: darkMode ? '#82e1d9' : '#571CE0',
              },
            }}
          >
            <Tab label="All Layups" />
            <Tab label="Winter 2026 Layups" />
            <Tab label="Hidden Layups" />
          </Tabs>
        </Box>

        {/* Tab Content */}
        <Box>
          {activeTab === 0 && renderLayupsTab()}
          {activeTab === 1 && <LayupsByTiming darkMode={darkMode} />}
          {activeTab === 2 && <HiddenLayups darkMode={darkMode} />}
        </Box>
      </Container>
    </Box>
  );
};

export default UnifiedLayupsPage;
