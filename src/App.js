// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import NavBar from './components/NavBar';
import LandingPage from './pages/LandingPage';
import ProfilePage from './pages/ProfilePage';
import AllClassesPage from './pages/AllClassesPage';
import EasyClassesPage from './pages/EasyClassesPage';

function App() {
  return (
    <Router>
      <NavBar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/classes" element={<AllClassesPage />} />
        <Route path="/easy-classes" element={<EasyClassesPage />} />
      </Routes>
    </Router>
  );
}

export default App;
