// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import NavBar from './components/NavBar';
import LandingPage from './pages/LandingPage';
import AllClassesPage from './pages/AllClassesPage';
import ProfilePage from './pages/ProfilePage';
import SignUpPage from './pages/SignUpPage';
import LoginPage from './pages/LoginPage';
import DepartmentCoursesPage from './pages/DepartmentCoursesPage';
import CourseReviewsPage from './pages/CourseReviewsPage';

const App = () => (
  <AuthProvider>
    <Router>
      <NavBar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/classes" element={<AllClassesPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/departments/:department" element={<DepartmentCoursesPage />} />
        <Route path="/departments/:department/courses/:courseId" element={<CourseReviewsPage />} />
      </Routes>
    </Router>
  </AuthProvider>
);

export default App;
