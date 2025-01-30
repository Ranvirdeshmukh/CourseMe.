// App.js

import React, { useState } from 'react';
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
  useLocation
} from 'react-router-dom';
import { ThemeProvider, CssBaseline, createTheme } from '@mui/material';

import NavBar from './components/NavBar';
import { AuthProvider, useAuth } from './contexts/AuthContext';

import AllClassesPage from './pages/AllClassesPage';
import CompleteProfilePage from './pages/CompleteProfilePage';
import CourseEnrollmentPrioritiesPage from './pages/CourseEnrollmentPriorities';
import CourseReviewsPage from './pages/CourseReviewsPage/CourseReviewsPage';
import DepartmentCoursesPage from './pages/DepartmentCoursesPage';
import DepartmentCoursesWithPriorities from './pages/DepartmentCoursesWithPriorities';
import GetStartedPage from './pages/GetStartedPage';
import LandingPage from './pages/LandingPage';
import LayupsPage from './pages/LayupsPage';
import LoginPage from './pages/LoginPage';
import ProfessorReviewsPage from './pages/ProfessorReviewsPage';
import ProfilePage from './pages/ProfilePage';
import SignUpPage from './pages/SignUpPage';
import Timetable from './pages/Timetable';
import TranscriptParser from './pages/TranscriptParser';
import ProfessorDetails from './pages/ProfessorDetails';
import ProfessorDirectory from './pages/ProfessorDirectory';
import MajorTracker from './pages/MajorTracking/MajorTracking';

import  darkTheme  from './components/theme'; // Your dark theme file

// Simple MUI default theme as our "light" mode
const lightTheme = createTheme();

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
};

const AppContent = () => {
  const location = useLocation();
  const { currentUser } = useAuth();

  // State to toggle between light & dark mode
  const [darkMode, setDarkMode] = useState(false);

  // If user is not logged in, redirect to the Landing page when accessing restricted routes
  if (
    !currentUser &&
    location.pathname !== '/' &&
    location.pathname !== '/landing' &&
    location.pathname !== '/login' &&
    location.pathname !== '/signup'
  ) {
    return <Navigate to="/" />;
  }

  // If user is not logged in and is on the Get Started page, redirect to Landing page
  if (!currentUser && location.pathname === '/') {
    return <Navigate to="/landing" />;
  }

  // Define special pages to apply different styles or logic
  const isSpecialPage = [
    '/',
    '/profile',
    '/classes',
    '/layups',
    '/course-enrollment-priorities',
    '/departments',
    '/course-review',
    '/timetable',
    '/transcript-parser',
    '/professors',
  ].includes(location.pathname);

  return (
    <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
      <CssBaseline />
      {/* Pass down darkMode & setDarkMode if you want a toggle in NavBar */}
      <NavBar isSpecialPage={isSpecialPage} darkMode={darkMode} setDarkMode={setDarkMode} />

      <Routes>
        <Route path="/" element={<GetStartedPage />} />
        <Route path="/landing" element={<LandingPage darkMode={darkMode} />} />
        <Route path="/classes" element={<AllClassesPage darkMode={darkMode} />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/departments/:department" element={<DepartmentCoursesPage />} />
        <Route path="/departments/:department/courses/:courseId" element={<CourseReviewsPage />} />
        <Route path="/departments/:department/courses/:documentName" element={<CourseReviewsPage />} />
        <Route path="/departments/:department/courses/:courseId" element={<CourseReviewsPage />} />
        <Route path="/major-tracker" element={<MajorTracker />} />
        <Route
          path="/departments/:department/courses/:courseId/professors/:professor"
          element={<ProfessorReviewsPage />}
        />
        <Route path="/complete-profile" element={<CompleteProfilePage />} />
        <Route path="/layups" element={<LayupsPage />} />
        <Route path="/course-enrollment-priorities" element={<CourseEnrollmentPrioritiesPage />} />
        <Route
          path="/course-enrollment-priorities/:department"
          element={<DepartmentCoursesWithPriorities />}
        />
        <Route path="/timetable" element={<Timetable />} />
        <Route path="/upload-unique-transcript" element={<TranscriptParser />} />
        <Route path="/professors/:professorId" element={<ProfessorDetails />} />
        <Route path="/professors" element={<ProfessorDirectory />} />
      </Routes>
    </ThemeProvider>
  );
};

export default App;
