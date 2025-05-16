// src/hooks/useCourses.js
import { useState, useEffect, useCallback, useRef, doc, setDoc, getDoc } from 'react';
import { getFirestore } from 'firebase/firestore';
import CourseService from '../services/courseService';
import EnrollmentService from '../services/enrollmentService';
import { useAuth } from '../contexts/AuthContext';

const useCourses = (termType = 'summer') => {
  // State
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enrollmentDataReady, setEnrollmentDataReady] = useState(false);
  
  const db = getFirestore();
  const { currentUser } = useAuth();
  const initialFetchRef = useRef(false);

  // Reset state when term changes
  useEffect(() => {
    // Reset search and filter
    setSearchTerm('');
    setSelectedSubject('');
    
    // Reset loading state
    setLoading(true);
    setError(null);
    
    // Reset course data
    setCourses([]);
    setFilteredCourses([]);
    
    // Reset enrollment data flag
    setEnrollmentDataReady(false);
    
    // Reset initialFetchRef to trigger new fetch
    initialFetchRef.current = false;
  }, [termType]);

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch courses from Firestore or cache
      const { courses: coursesData, fromCache } = await CourseService.fetchFirestoreCourses(db, termType);
      
      // Enhance with enrollment data
      const enhancedCourses = await EnrollmentService.enhanceCourseDataWithEnrollment(coursesData);
      
      // Extract subjects
      const extractedSubjects = CourseService.extractSubjects(enhancedCourses);
      
      setCourses(enhancedCourses);
      setFilteredCourses(enhancedCourses);
      setSubjects(extractedSubjects);
      setEnrollmentDataReady(true);
      setLoading(false);
      
      return enhancedCourses;
    } catch (error) {
      console.error('Error in fetchCourses:', error);
      setError(error);
      setLoading(false);
      return [];
    }
  }, [db, termType]);

  const fetchUserCourses = useCallback(async () => {
    if (!currentUser) {
      setSelectedCourses([]);
      return;
    }

    try {
      // Get the user document
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        // Extract courses for the selected term
        const userData = userDocSnap.data();
        const fieldName = termType === 'summer' ? 'summerCoursestaken' : 'fallCoursestaken';
        const termCourses = userData[fieldName] || [];
        
        setSelectedCourses(termCourses);
      } else {
        // Create user document with empty courses array
        const initialData = {};
        initialData[termType === 'summer' ? 'summerCoursestaken' : 'fallCoursestaken'] = [];
        await setDoc(userDocRef, initialData);
        setSelectedCourses([]);
      }
    } catch (error) {
      console.error(`Error fetching user's ${termType} courses:`, error);
      setSelectedCourses([]);
    }
  }, [currentUser, db, termType]);

  // Apply search and subject filters to courses
  const applyFilters = useCallback(() => {
    let filtered = [...courses];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (course) =>
          (course.title?.toLowerCase()?.includes(searchLower) ?? false) ||
          (course.subj?.toLowerCase()?.includes(searchLower) ?? false) ||
          (course.instructor?.toLowerCase()?.includes(searchLower) ?? false)
      );
    }

    if (selectedSubject) {
      filtered = filtered.filter((course) => course.subj === selectedSubject);
    }

    setFilteredCourses(filtered);
  }, [courses, searchTerm, selectedSubject]);

  // Initial fetch of courses
  useEffect(() => {
    if (!initialFetchRef.current) {
      initialFetchRef.current = true;
      fetchCourses();
      fetchUserCourses();
    }
  }, [fetchCourses, fetchUserCourses, termType]);

  // Apply filters when dependencies change
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Add a course to the user's timetable
  const addCourse = useCallback(async (course) => {
    // Check if the course is already in the timetable
    const alreadyAdded = selectedCourses.some(
      (c) => c.subj === course.subj && c.num === course.num && c.sec === course.sec
    );

    if (alreadyAdded) {
      return {
        success: false,
        message: `${course.subj} ${course.num} is already in your timetable.`
      };
    }

    const result = await CourseService.addCourseToTimetable(db, currentUser, course, termType);
    
    if (result.success) {
      setSelectedCourses(prev => [...prev, result.course]);
    }
    
    return result;
  }, [currentUser, db, selectedCourses, termType]);

  // Remove a course from the user's timetable
  const removeCourse = useCallback(async (course) => {
    // Remove from UI immediately for better UX
    setSelectedCourses(prev => prev.filter(c => c.id !== course.id));
    
    const result = await CourseService.removeCourseFromTimetable(db, currentUser, course, termType);
    
    if (!result.success) {
      // Add it back if there was an error
      setSelectedCourses(prev => [...prev, course]);
    }
    
    return result;
  }, [currentUser, db, termType]);

  return {
    courses,
    filteredCourses,
    selectedCourses,
    subjects,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    selectedSubject,
    setSelectedSubject,
    fetchCourses,
    fetchUserCourses,
    addCourse,
    removeCourse,
    enrollmentDataReady,
    setCourses
  };
};

export default useCourses;