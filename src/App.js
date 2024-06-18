// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import NavBar from './components/NavBar';
import LandingPage from './pages/LandingPage';
import AllClassesPage from './pages/AllClassesPage';
import EasyClassesPage from './pages/EasyClassesPage';
import ProfilePage from './pages/ProfilePage';
import SignUpPage from './pages/SignUpPage';
import LoginPage from './pages/LoginPage';

const App = () => (
  <AuthProvider>
    <Router>
      <NavBar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/classes" element={<AllClassesPage />} />
        <Route path="/easy-classes" element={<EasyClassesPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </Router>
  </AuthProvider>
);

export default App;
