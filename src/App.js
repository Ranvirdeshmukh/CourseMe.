// App.js

import React, { useState } from 'react';
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
  useLocation
} from 'react-router-dom';
import { ThemeProvider, CssBaseline, createTheme, useMediaQuery } from '@mui/material';

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
import CORA from './pages/MajorTracking/CORA';
import BetaSignup from './pages/BetaSignup';

import darkTheme from './components/theme'; // Your dark theme file

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

  // Change from a boolean to a tri‑state with initial state "dark"
  const [themeMode, setThemeMode] = useState('dark');

  // Check the system preference (only used when themeMode is "system")
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  const effectiveDarkMode = themeMode === 'system' ? prefersDark : themeMode === 'dark';

  // Existing redirect logic (unchanged)
  if (
    !currentUser &&
    location.pathname !== '/' &&
    location.pathname !== '/landing' &&
    location.pathname !== '/login' &&
    location.pathname !== '/signup'
  ) {
    return <Navigate to="/" />;
  }

  if (!currentUser && location.pathname === '/') {
    return <Navigate to="/landing" />;
  }

  // Define special pages (unchanged)
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
    <ThemeProvider theme={effectiveDarkMode ? darkTheme : lightTheme}>
      <CssBaseline />
      {/* Pass the effective dark mode flag as before plus the new themeMode state */}
      <NavBar
        isSpecialPage={isSpecialPage}
        darkMode={effectiveDarkMode}
        themeMode={themeMode}
        setThemeMode={setThemeMode}
      />

      <Routes>
        <Route path="/" element={<GetStartedPage />} />
        <Route path="/landing" element={<LandingPage darkMode={effectiveDarkMode} />} />
        <Route path="/classes" element={<AllClassesPage darkMode={effectiveDarkMode} />} />
        <Route path="/profile" element={<ProfilePage darkMode={effectiveDarkMode} />} />
        <Route path="/signup" element={<SignUpPage darkMode={effectiveDarkMode} />} />
        <Route path="/login" element={<LoginPage darkMode={effectiveDarkMode} />} />
        <Route path="/departments/:department" element={<DepartmentCoursesPage darkMode={effectiveDarkMode} />} />
        <Route path="/departments/:department/courses/:courseId" element={<CourseReviewsPage darkMode={effectiveDarkMode} />} />
        <Route path="/departments/:department/courses/:documentName" element={<CourseReviewsPage darkMode={effectiveDarkMode} />} />
        <Route path="/major-tracker" element={<CORA darkMode={effectiveDarkMode} />} />
        <Route path="/beta" element={<BetaSignup darkMode={effectiveDarkMode} />} />
        <Route
          path="/departments/:department/courses/:courseId/professors/:professor"
          element={<ProfessorReviewsPage darkMode={effectiveDarkMode} />}
        />
        <Route path="/complete-profile" element={<CompleteProfilePage darkMode={effectiveDarkMode} />} />
        <Route path="/layups" element={<LayupsPage darkMode={effectiveDarkMode} />} />
        <Route path="/course-enrollment-priorities" element={<CourseEnrollmentPrioritiesPage darkMode={effectiveDarkMode} />} />
        <Route
          path="/course-enrollment-priorities/:department"
          element={<DepartmentCoursesWithPriorities darkMode={effectiveDarkMode} />}
        />
        <Route path="/departments/:department" element={<DepartmentCoursesWithPriorities darkMode={effectiveDarkMode} />} />
        <Route path="/timetable" element={<Timetable darkMode={effectiveDarkMode} />} />
        <Route path="/upload-unique-transcript" element={<TranscriptParser darkMode={effectiveDarkMode} />} />
        <Route path="/professors/:professorId" element={<ProfessorDetails darkMode={effectiveDarkMode} />} />
        <Route path="/professors" element={<ProfessorDirectory darkMode={effectiveDarkMode} />} />
      </Routes>
    </ThemeProvider>
  );
};

export default App;
