// src/hooks/useCourses.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import CourseService from '../services/courseService';
import EnrollmentService from '../services/enrollmentService';
import { useAuth } from '../contexts/AuthContext';

// Helper function to parse course numbers for proper numerical sorting
const parseCourseNumber = (courseNum) => {
  if (!courseNum) return { numeric: 0, suffix: '' };
  
  // Handle course numbers like "10", "10A", "101.5", "10.01", etc.
  const match = courseNum.toString().match(/^(\d+(?:\.\d+)?)\s*([A-Z]*)/i);
  
  if (match) {
    const numeric = parseFloat(match[1]);
    const suffix = match[2] || '';
    return { numeric, suffix };
  }
  
  // Fallback for non-standard formats
  return { numeric: 0, suffix: courseNum.toString() };
};

// Filter out courses with missing essential data
const filterValidCourses = (courses) => {
  return courses.filter(course => 
    course.subj && 
    course.subj.trim() !== '' && 
    course.num && 
    course.num.toString().trim() !== ''
  );
};

// Enhanced sorting function for courses
const sortCourses = (courses) => {
  // First filter out invalid courses, then sort
  const validCourses = filterValidCourses(courses);
  
  return validCourses.sort((a, b) => {
    // First sort by subject (department)
    const subjComparison = a.subj.localeCompare(b.subj);
    if (subjComparison !== 0) return subjComparison;
    
    // Then sort by course number (numeric)
    const aParsed = parseCourseNumber(a.num);
    const bParsed = parseCourseNumber(b.num);
    
    // Compare numeric parts first
    if (aParsed.numeric !== bParsed.numeric) {
      return aParsed.numeric - bParsed.numeric;
    }
    
    // If numeric parts are equal, compare suffix (A, B, etc.)
    const suffixComparison = aParsed.suffix.localeCompare(bParsed.suffix);
    if (suffixComparison !== 0) return suffixComparison;
    
    // Finally sort by section
    const aSec = parseInt(a.sec) || 0;
    const bSec = parseInt(b.sec) || 0;
    return aSec - bSec;
  });
};

const useCourses = (termType = 'winter') => {
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
      
      // Sort the courses before setting them
      const sortedCourses = sortCourses(enhancedCourses);
      
      // Extract subjects
      const extractedSubjects = CourseService.extractSubjects(sortedCourses);
      
      setCourses(sortedCourses);
      setFilteredCourses(sortedCourses);
      setSubjects(extractedSubjects.sort()); // Sort subjects alphabetically too
      setEnrollmentDataReady(true);
      setLoading(false);
      
      return sortedCourses;
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
        const fieldName = termType === 'summer' ? 'summerCoursestaken' : termType === 'spring' ? 'springCoursestaken' : termType === 'winter' ? 'winterCoursestaken' : 'fallCoursestaken';
        const termCourses = userData[fieldName] || [];
        
        // Sort user's selected courses too
        const sortedSelectedCourses = sortCourses(termCourses);
        setSelectedCourses(sortedSelectedCourses);
      } else {
        // Create user document with empty courses array
        const initialData = {};
        initialData[termType === 'summer' ? 'summerCoursestaken' : termType === 'spring' ? 'springCoursestaken' : termType === 'winter' ? 'winterCoursestaken' : 'fallCoursestaken'] = [];
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

    // Sort the filtered courses
    const sortedFiltered = sortCourses(filtered);
    setFilteredCourses(sortedFiltered);
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
    // Normalize section comparison (empty section defaults to '01')
    const alreadyAdded = selectedCourses.some(
      (c) => c.subj === course.subj && c.num === course.num && (c.sec || '01') === (course.sec || '01')
    );

    if (alreadyAdded) {
      return {
        success: false,
        message: `${course.subj} ${course.num} is already in your timetable.`
      };
    }

    const result = await CourseService.addCourseToTimetable(db, currentUser, course, termType);
    
    if (result.success) {
      // Sort the updated selected courses
      const updatedCourses = [...selectedCourses, result.course];
      const sortedSelectedCourses = sortCourses(updatedCourses);
      setSelectedCourses(sortedSelectedCourses);
    }
    
    return result;
  }, [currentUser, db, selectedCourses, termType]);

  // Remove a course from the user's timetable
  const removeCourse = useCallback(async (course) => {
    // Remove from UI immediately for better UX
    // Use a more robust comparison since courses might not have consistent ID fields
    // Normalize section comparison (empty section defaults to '01')
    const updatedCourses = selectedCourses.filter(c => 
      !(c.subj === course.subj && 
        c.num === course.num && 
        (c.sec || '01') === (course.sec || '01'))
    );
    const sortedSelectedCourses = sortCourses(updatedCourses);
    setSelectedCourses(sortedSelectedCourses);
    
    const result = await CourseService.removeCourseFromTimetable(db, currentUser, course, termType);
    
    if (!result.success) {
      // Add it back if there was an error (and re-sort)
      const restoredCourses = [...selectedCourses, course];
      const sortedRestoredCourses = sortCourses(restoredCourses);
      setSelectedCourses(sortedRestoredCourses);
    }
    
    return result;
  }, [currentUser, db, selectedCourses, termType]);

  // Custom setCourses that maintains sorting
  const setSortedCourses = useCallback((newCourses) => {
    if (Array.isArray(newCourses)) {
      const sorted = sortCourses(newCourses);
      setCourses(sorted);
      // If no filters are applied, update filtered courses too
      if (!searchTerm && !selectedSubject) {
        setFilteredCourses(sorted);
      } else {
        // Re-apply filters to the new sorted courses
        applyFilters();
      }
    } else if (typeof newCourses === 'function') {
      setCourses(prevCourses => {
        const updated = newCourses(prevCourses);
        const sorted = sortCourses(updated);
        // If no filters are applied, update filtered courses too
        if (!searchTerm && !selectedSubject) {
          setFilteredCourses(sorted);
        }
        return sorted;
      });
    }
  }, [searchTerm, selectedSubject, applyFilters]);

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
    setCourses: setSortedCourses // Use the sorting version
  };
};

export default useCourses;