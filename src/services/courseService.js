// src/services/courseService.js
import { collection, doc, getDoc, getDocs, query, updateDoc, where, setDoc } from 'firebase/firestore';
import localforage from 'localforage';
import { periodCodeToTiming } from '../pages/timetablepages/googleCalendarLogic';

const CACHE_VERSION = 'summerV5';
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
  // src/services/courseService.js (continued)
} else {
    return number.padStart(3, '0');
  }
};

export const fetchFirestoreCourses = async (db, termType = 'summer') => {
  try {
    // First check if we have cached data
    const cacheKey = `cachedCourses_${termType}`;
    const cacheTimestampKey = `cacheTimestamp_${termType}`;
    const cacheVersionKey = `cacheVersion_${termType}`;
    
    const cachedCourses = await localforage.getItem(cacheKey);
    const cacheTimestamp = await localforage.getItem(cacheTimestampKey);
    const cachedVersion = await localforage.getItem(cacheVersionKey);
    const now = Date.now();

    // Check if cache is valid
    const isCacheValid = 
      cachedCourses && 
      cacheTimestamp && 
      cachedVersion === CACHE_VERSION && 
      (now - cacheTimestamp) < CACHE_TTL;

    if (isCacheValid) {
      console.log(`Using cached ${termType} data`);
      return {
        courses: cachedCourses,
        fromCache: true
      };
    }

    console.log(`Cache invalid or expired, fetching new ${termType} data`);

    // If cache version doesn't match, clear the specific cache entries
    if (cachedVersion !== CACHE_VERSION) {
      console.log('Version mismatch, clearing cache');
      await localforage.removeItem(cacheKey);
      await localforage.removeItem(cacheTimestampKey);
      await localforage.removeItem(cacheVersionKey);
    }

    // Fetch new data - use the correct collection based on termType
    const collectionName = termType === 'summer' ? 'summerTimetable' : 'fallTimetable2';
    const coursesSnapshot = await getDocs(collection(db, collectionName));
    const coursesData = coursesSnapshot.docs.map((doc) => {
      const data = doc.data();
      const periodCode = data['Period Code'];

      // Use the period code to get the timing information
      const timing = periodCodeToTiming[periodCode] || 'Unknown Timing';

      return {
        documentName: doc.id,
        subj: data.Subj,
        num: data.Num,
        sec: data.Section,
        title: data.Title,
        period: periodCode,
        timing: timing, // This now correctly uses the mapping
        room: data.Room,
        building: data.Building,
        instructor: data.Instructor,
        isNotified: false // Initialize notification status
      };
    });

    // Store the new data in cache
    await Promise.all([
      localforage.setItem(cacheKey, coursesData),
      localforage.setItem(cacheTimestampKey, now),
      localforage.setItem(cacheVersionKey, CACHE_VERSION)
    ]);

    console.log(`New ${termType} data cached`);
    return {
      courses: coursesData,
      fromCache: false
    };
  } catch (error) {
    console.error(`Error fetching ${termType} Firestore courses:`, error);
    throw error;
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

  // Check if we have the course ID (needed for deletion)
  if (!course.id) {
    console.error('Course ID not found, cannot remove from database', course);
    return {
      success: false,
      message: `Error removing ${course.subj} ${course.num}: Course ID not found.`
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
      
      // Filter out the course to remove
      const updatedCourses = currentCourses.filter(c => c.id !== course.id);
      
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
  extractSubjects,
  addCourseToTimetable,
  removeCourseFromTimetable
};