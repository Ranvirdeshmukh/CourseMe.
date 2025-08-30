// src/services/courseService.js
import { collection, doc, getDoc, getDocs, query, updateDoc, where, setDoc } from 'firebase/firestore';
import localforage from 'localforage';
import { periodCodeToTiming } from '../pages/timetablepages/googleCalendarLogic';
import { fetchEnrollmentData, enhanceCourseDataWithEnrollment } from './enrollmentDataService';
import { fetchGCSTimetableData } from './gcsTimetableService';

const CACHE_VERSION = 'summerV9';
const CACHE_TTL = 5184000000; // 60 days in milliseconds

export const fetchCourseData = async (db, dept, course) => {

  try {
    // Query the courses collection for the matching document
    const q = query(
      collection(db, "courses"), 
      where("department", "==", dept), 
      where("course_number", "==", course)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const docRef = querySnapshot.docs[0].ref;
      const docId = querySnapshot.docs[0].id;
      
      // Create a reference to the specific document
      const specificDocRef = doc(db, "courses", docId);
      
      // Update the document with the new field
      await updateDoc(specificDocRef, {
        "25W": true
      });
      
      console.log("Updated document with 25W field: " + docId);
      return {
        id: docId,
        success: true
      };
    } else {
      console.log("No matching documents in Firebase.");
      return {
        success: false,
        message: "No matching documents found"
      };
    }
  } catch (error) {
    console.error("Error fetching/updating course data from Firebase:", error);
    return {
      success: false,
      error
    };
  }
};

export const normalizeCourseNumber = (number) => {
  if (number.includes('.')) {
    const [integerPart, decimalPart] = number.split('.');
    return `${integerPart.padStart(3, '0')}.${decimalPart}`;
  } else {
    return number.padStart(3, '0');
  }
};

export const fetchFirestoreCourses = async (db, termType = 'summer') => {
  try {
    // Use GCS timetable service instead of Firebase
    const { courses: coursesData, fromCache } = await fetchGCSTimetableData(termType);
    
    // Enhance with enrollment data only for winter/fall terms (not summer)
    let enhancedCourses = coursesData;
    if (termType !== 'summer') {
      try {
        enhancedCourses = await enhanceCourseDataWithEnrollment(coursesData);
        console.log(`Enhanced ${termType} courses with enrollment data`);
      } catch (error) {
        console.warn(`Failed to enhance ${termType} courses with enrollment data:`, error);
        // Continue with basic courses data if enrollment enhancement fails
      }
    }

    console.log(`Fetched ${termType} data from GCS`);
    return {
      courses: enhancedCourses,
      fromCache: fromCache
    };
  } catch (error) {
    console.error(`Error fetching ${termType} GCS courses:`, error);
    throw error;
  }
};

export const refreshEnrollmentData = async (db, termType = 'summer') => {
  try {
    // Summer doesn't have enrollment data, so return early
    if (termType === 'summer') {
      return {
        success: false,
        message: 'Enrollment data refresh is not available for summer courses',
        courses: []
      };
    }

    console.log(`Force refreshing enrollment data for ${termType}`);
    
    // Clear enrollment data cache to force fresh fetch
    await localforage.removeItem('enrollmentData');
    await localforage.removeItem('enrollmentDataTimestamp');
    
    // Clear course cache to force re-enhancement with fresh enrollment data
    const cacheKey = `cachedCourses_${termType}`;
    const cacheTimestampKey = `cacheTimestamp_${termType}`;
    const cacheVersionKey = `cacheVersion_${termType}`;
    
    await Promise.all([
      localforage.removeItem(cacheKey),
      localforage.removeItem(cacheTimestampKey),
      localforage.removeItem(cacheVersionKey)
    ]);

    // Fetch fresh course data from GCS
    console.log(`Fetching fresh data from GCS for ${termType} term`);
    
    const { courses: coursesData } = await fetchGCSTimetableData(termType);

    // Force fresh enrollment data fetch by calling the enrollment service
    console.log('Forcing fresh enrollment data fetch...');
    const freshEnrollmentData = await fetchEnrollmentData();
    
    // Enhance courses with fresh enrollment data
    const enhancedCourses = await enhanceCourseDataWithEnrollment(coursesData);

    // Store the refreshed data in cache
    const now = Date.now();
    await Promise.all([
      localforage.setItem(cacheKey, enhancedCourses),
      localforage.setItem(cacheTimestampKey, now),
      localforage.setItem(cacheVersionKey, CACHE_VERSION)
    ]);

    console.log(`Refreshed ${termType} enrollment data cached`);
    
    return {
      success: true,
      courses: enhancedCourses,
      message: `Successfully refreshed enrollment data for ${enhancedCourses.length} courses`
    };

  } catch (error) {
    console.error('Error refreshing enrollment data:', error);
    return {
      success: false,
      message: error.message || 'Failed to refresh enrollment data',
      courses: []
    };
  }
};

export const extractSubjects = (courses) => {
  if (!courses || !Array.isArray(courses)) return [];
  const subjectsSet = new Set(courses.filter(course => course.subj).map((course) => course.subj));
  return [...subjectsSet];
};

export const addCourseToTimetable = async (db, currentUser, course, termType = 'summer') => {
  if (!currentUser) {
    return {
      success: false,
      message: "Please log in to add courses to your timetable."
    };
  }

  // Ensure we have the period and location information
  const courseToAdd = { 
    ...course,
    period: course.period || "ARR",  // Default to "ARR" if period is missing
    addedAt: new Date(),  // Add timestamp for when the course was added
    term: termType === 'summer' ? "Summer 2025" : "Fall 2025",   // Explicitly set the term
    id: `${course.subj}_${course.num}_${course.sec}_${Date.now()}` // Generate a unique ID
  };

  // Validate that we have the required fields before proceeding
  if (!courseToAdd.subj || !courseToAdd.num || !courseToAdd.sec) {
    return {
      success: false,
      message: "Could not add course: missing required information."
    };
  }

  try {
    // Create a clean version of the course object with only the fields we need
    const courseData = {
      subj: courseToAdd.subj,
      num: courseToAdd.num,
      sec: courseToAdd.sec,
      title: courseToAdd.title || "",
      period: courseToAdd.period || "ARR",
      building: courseToAdd.building || "",
      room: courseToAdd.room || "",
      instructor: courseToAdd.instructor || "",
      timing: courseToAdd.timing || "",
      addedAt: courseToAdd.addedAt,
      term: courseToAdd.term,
      id: courseToAdd.id
    };

    // Get reference to user document
    const userDocRef = doc(db, 'users', currentUser.uid);
    
    // Fetch current user data
    const userDocSnap = await getDoc(userDocRef);
    
    if (userDocSnap.exists()) {
      // User document exists, update the courses array for the current term
      const userData = userDocSnap.data();
      const fieldName = termType === 'summer' ? 'summerCoursestaken' : 'fallCoursestaken';
      const currentCourses = userData[fieldName] || [];
      
      // Add the new course
      const updateData = {};
      updateData[fieldName] = [...currentCourses, courseData];
      await updateDoc(userDocRef, updateData);
    } else {
      // User document does not exist, create it
      const initialData = {};
      initialData[termType === 'summer' ? 'summerCoursestaken' : 'fallCoursestaken'] = [courseData];
      await setDoc(userDocRef, initialData);
    }
    
    return {
      success: true,
      message: `${courseToAdd.subj} ${courseToAdd.num} has been added to your timetable.`,
      course: courseData
    };
  } catch (error) {
    console.error(`Error adding course to ${termType}Coursestaken:`, error);
    return {
      success: false,
      message: `Error adding ${courseToAdd.subj} ${courseToAdd.num} to your timetable.`,
      error
    };
  }
};

export const removeCourseFromTimetable = async (db, currentUser, course, termType = 'summer') => {
  if (!currentUser) {
    return {
      success: false,
      message: "Please log in to manage your timetable."
    };
  }

  try {
    // Get reference to user document
    const userDocRef = doc(db, 'users', currentUser.uid);
    
    // Fetch current user data
    const userDocSnap = await getDoc(userDocRef);
    
    if (userDocSnap.exists()) {
      // Get current courses
      const userData = userDocSnap.data();
      const fieldName = termType === 'summer' ? 'summerCoursestaken' : 'fallCoursestaken';
      const currentCourses = userData[fieldName] || [];
      
      // Filter out the course to remove using multiple possible identifiers
      const updatedCourses = currentCourses.filter(c => {
        // If both courses have IDs, use ID comparison
        if (c.id && course.id) {
          return c.id !== course.id;
        }
        
        // Otherwise, use subject, number, and section combination
        return !(c.subj === course.subj && 
                c.num === course.num && 
                c.sec === course.sec);
      });
      
      // Check if any course was actually removed
      if (updatedCourses.length === currentCourses.length) {
        return {
          success: false,
          message: `${course.subj} ${course.num} was not found in your timetable.`
        };
      }
      
      // Update the document with the filtered array
      const updateData = {};
      updateData[fieldName] = updatedCourses;
      await updateDoc(userDocRef, updateData);
      
      return {
        success: true,
        message: `${course.subj} ${course.num} has been removed from your timetable.`
      };
    } else {
      return {
        success: false,
        message: "User document not found"
      };
    }
  } catch (error) {
    console.error('Error removing course:', error);
    return {
      success: false,
      message: `Error removing ${course.subj} ${course.num} from your timetable.`,
      error
    };
  }
};

export default {
  fetchCourseData,
  normalizeCourseNumber,
  fetchFirestoreCourses,
  refreshEnrollmentData,
  extractSubjects,
  addCourseToTimetable,
  removeCourseFromTimetable
};