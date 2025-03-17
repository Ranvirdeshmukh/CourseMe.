import React, { useEffect, useState, useRef } from 'react';
import { Box, Typography, Paper, Button, Container, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PrintIcon from '@mui/icons-material/Print';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, getDocs, getFirestore, doc, deleteDoc } from 'firebase/firestore';
import ScheduleVisualization from './timetablepages/ScheduleVisualization';

const WeeklySchedule = ({ darkMode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const printRef = useRef(null);

  useEffect(() => {
    // If courses were passed through navigation state, use those
    if (location.state?.selectedCourses) {
      setSelectedCourses(location.state.selectedCourses);
      setLoading(false);
      return;
    }

    // Otherwise, fetch from Firestore
    const fetchUserTimetable = async () => {
      try {
        const db = getFirestore();
        const springCoursesRef = collection(db, 'users', currentUser.uid, 'springCoursestaken');
        const snapshot = await getDocs(springCoursesRef);
        const coursesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSelectedCourses(coursesData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching user's spring courses:", error);
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchUserTimetable();
    } else {
      setLoading(false);
    }
  }, [currentUser, location.state]);

  const handlePrint = () => {
    const printContent = document.getElementById('schedule-to-print');
    const originalContents = document.body.innerHTML;
    
    // Prepare for printing
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
    
    // Print the schedule
    if (printContent) {
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
      
      // Print after a short delay to ensure content is loaded
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  const handleRemoveCourse = async (course) => {
    const updatedCourses = selectedCourses.filter(c => 
      !(c.subj === course.subj && c.num === course.num && c.sec === course.sec)
    );
    setSelectedCourses(updatedCourses);

    // If we have currentUser and course has an ID, remove from Firebase
    if (currentUser && course.id) {
      try {
        const db = getFirestore();
        const courseDocRef = doc(db, 'users', currentUser.uid, 'springCoursestaken', course.id);
        await deleteDoc(courseDocRef);
      } catch (error) {
        console.error('Error removing course from Firestore:', error);
      }
    }
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
        padding: '20px',
        fontFamily: 'SF Pro Display, sans-serif',
      }}
    >
      <Container maxWidth="xl">
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: '24px' 
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton 
              onClick={() => navigate('/timetable')}
              sx={{ 
                color: darkMode ? '#FFFFFF' : '#000000',
                marginRight: '16px',
              }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 600,
                color: darkMode ? '#FFFFFF' : '#000000',
                fontFamily: 'SF Pro Display, sans-serif',
                transition: 'color 0.3s ease',
              }}
            >
              Weekly Schedule
            </Typography>
          </Box>
          
          {selectedCourses.length > 0 && (
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={handlePrint}
              sx={{
                color: darkMode ? '#BB86FC' : '#00693E',
                borderColor: darkMode ? '#BB86FC' : '#00693E',
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

        <div id="schedule-to-print" ref={printRef}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
              <Typography>Loading your schedule...</Typography>
            </Box>
          ) : selectedCourses.length > 0 ? (
            <ScheduleVisualization 
              selectedCourses={selectedCourses} 
              darkMode={darkMode}
              onRemoveCourse={handleRemoveCourse} 
            />
          ) : (
            <Paper
              elevation={3}
              sx={{
                backgroundColor: darkMode ? '#1C1F43' : '#FFFFFF',
                borderRadius: '12px',
                padding: '32px',
                textAlign: 'center',
                marginTop: '32px',
              }}
            >
              <Typography variant="h5" sx={{ marginBottom: '16px', color: darkMode ? '#FFFFFF' : '#000000' }}>
                No courses selected
              </Typography>
              <Typography sx={{ marginBottom: '24px', color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }}>
                Return to the Timetable page to add courses to your schedule.
              </Typography>
              <Button 
                variant="contained"
                onClick={() => navigate('/timetable')}
                sx={{
                  backgroundColor: '#00693E',
                  '&:hover': {
                    backgroundColor: '#00522F',
                  },
                  padding: '10px 24px',
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 500, 
                }}
              >
                Go to Timetable
              </Button>
            </Paper>
          )}

          {selectedCourses.length > 0 && (
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
          )}
        </div>
      </Container>
    </Box>
  );
};

export default WeeklySchedule; 