import { db } from '../firebase';
import { doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import { hiddenLayupCourseIds } from '../constants/hiddenLayupConstants';

export const initializeHiddenLayups = async () => {
  try {
    // First, get all existing hidden layups
    const hiddenLayupsQuery = await getDocs(collection(db, 'hidden_layups'));
    const existingLayupIds = new Set(hiddenLayupsQuery.docs.map(doc => doc.id));

    // Find which courses from our list don't exist in hidden_layups
    const missingCourseIds = hiddenLayupCourseIds.filter(id => !existingLayupIds.has(id));

    if (missingCourseIds.length > 0) {
      console.log('Missing courses to add:', missingCourseIds);
      
      // Fetch all courses that match our missing IDs
      const coursesQuery = await getDocs(collection(db, 'courses'));
      const coursesToAdd = coursesQuery.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(course => missingCourseIds.includes(course.id));

      // Add each missing course to hidden_layups
      for (const course of coursesToAdd) {
        const courseRef = doc(db, 'hidden_layups', course.id);
        const { name, department } = course;
        
        await setDoc(courseRef, {
          name: name || 'Unknown Course Name',
          department: department || 'Unknown Department',
          yes_count: 0,
          no_count: 0
        });
        
        console.log(`Added ${name} to hidden layups`);
      }

      // Log any courses that couldn't be found in the courses collection
      const addedCourseIds = new Set(coursesToAdd.map(course => course.id));
      const notFoundCourses = missingCourseIds.filter(id => !addedCourseIds.has(id));
      
      if (notFoundCourses.length > 0) {
        console.warn('Could not find these courses in the courses collection:', notFoundCourses);
      }
    } else {
      console.log('All hidden layup courses are already initialized');
    }
  } catch (err) {
    console.error('Error initializing hidden layups:', err);
    throw err;
  }
};