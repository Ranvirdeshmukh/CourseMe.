import React from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext'; // Import useAuth
import NavBar from './components/NavBar';
import GetStartedPage from './pages/GetStartedPage';
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
import Timetable from './pages/Timetable';

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
  const { currentUser } = useAuth(); // Get currentUser from AuthContext

  // If user is not logged in, redirect to the Landing page when accessing restricted routes
  if (!currentUser && location.pathname !== '/' && location.pathname !== '/landing' && location.pathname !== '/login' && location.pathname !== '/signup') {
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
    '/timetable'
  ].includes(location.pathname);

  return (
    <>
      <NavBar isSpecialPage={isSpecialPage} />
      <Routes>
        <Route path="/" element={<GetStartedPage />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/classes" element={<AllClassesPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/departments/:department" element={<DepartmentCoursesPage />} />
        <Route path="/departments/:department/courses/:courseId" element={<CourseReviewsPage />} />
        <Route path="/departments/:department/courses/:documentName" element={<CourseReviewsPage />} />
        <Route path="/departments/:department/courses/:courseId" element={<CourseReviewsPage />} />
        <Route path="/departments/:department/courses/:courseId/professors/:professor" element={<ProfessorReviewsPage />} />
        <Route path="/complete-profile" element={<CompleteProfilePage />} />
        <Route path="/layups" element={<LayupsPage />} />
        <Route path="/course-enrollment-priorities" element={<CourseEnrollmentPrioritiesPage />} />
        <Route path="/course-enrollment-priorities/:department" element={<DepartmentCoursesWithPriorities />} />
        <Route path="/timetable" element={<Timetable />} />
      </Routes>
    </>
  );

};


export default App;
