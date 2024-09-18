import React from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import NavBar from './components/NavBar';
import GetStartedPage from './pages/GetStartedPage'; // Import the GetStartedPage
import LandingPage from './pages/LandingPage';
import AllClassesPage from './pages/AllClassesPage';
import ProfilePage from './pages/ProfilePage';
import SignUpPage from './pages/SignUpPage';
import LoginPage from './pages/LoginPage';
import DepartmentCoursesPage from './pages/DepartmentCoursesPage';
import CourseReviewsPage from './pages/CourseReviewsPage';
import ProfessorReviewsPage from './pages/ProfessorReviewsPage';
import CompleteProfilePage from './pages/CompleteProfilePage';
import LayupsPage from './pages/LayupsPage';
import CourseEnrollmentPrioritiesPage from './pages/CourseEnrollmentPriorities';
import DepartmentCoursesWithPriorities from './pages/DepartmentCoursesWithPriorities';
import Timetable from './pages/Timetable'; // Import the Timetable component
import TranscriptParser from './TranscriptParser';

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

  // Check if the current route is the Get Started page
  const isSpecialPage = [
    '/',
    '/profile',
    '/classes',
    '/layups',
    '/course-enrollment-priorities',
    '/departments',
    '/course-review',
    '/timetable'
  ].includes(location.pathname);

  return (
    <>
      <NavBar isSpecialPage={isSpecialPage} /> {/* Always render NavBar, pass down isSpecialPage prop */}
      <Routes>
        <Route path="/" element={<GetStartedPage />} /> {/* Set the GetStartedPage as the root route */}
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/classes" element={<AllClassesPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/departments/:department" element={<DepartmentCoursesPage />} />
        <Route path="/departments/:department/courses/:courseId" element={<CourseReviewsPage />} />
        <Route path="/departments/:department/courses/:courseId/professors/:professor" element={<ProfessorReviewsPage />} />
        <Route path="/complete-profile" element={<CompleteProfilePage />} />
        <Route path="/layups" element={<LayupsPage />} />
        <Route path="/course-enrollment-priorities" element={<CourseEnrollmentPrioritiesPage />} />
        <Route path="/course-enrollment-priorities/:department" element={<DepartmentCoursesWithPriorities />} />
        <Route path="/timetable" element={<Timetable />} />
        {/* <Route path="/upload-transcript" element={<TranscriptParser />} /> */}
      </Routes>
    </>
  );
};


export default App;
