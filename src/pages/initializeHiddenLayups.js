import { db } from '../firebase';
import { doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import { hiddenLayupCourseIds } from '../constants/hiddenLayupConstants';

export const initializeHiddenLayups = async () => {
  try {
    const hiddenLayupsQuery = await getDocs(collection(db, 'hidden_layups'));
    const existingLayupIds = new Set(hiddenLayupsQuery.docs.map(doc => doc.id));
    const missingCourseIds = hiddenLayupCourseIds.filter(id => !existingLayupIds.has(id));

    if (missingCourseIds.length > 0) {
      console.log('Missing courses to add:', missingCourseIds);
      
      // Fetch all courses
      const coursesSnapshot = await getDocs(collection(db, 'courses'));
      const coursesMap = new Map();
      
      // Create a map of course data
      coursesSnapshot.docs.forEach(doc => {
        coursesMap.set(doc.id, { id: doc.id, ...doc.data() });
      });

      // Add missing courses
      for (const courseId of missingCourseIds) {
        const courseData = coursesMap.get(courseId);
        
        if (courseData) {
          const courseRef = doc(db, 'hidden_layups', courseId);
          
          // Log the course data for debugging
          console.log('Course data to add:', courseData);
          
          // Convert distribs string to array if it exists
          const distribsArray = courseData.distribs 
            ? courseData.distribs.split(',').map(d => d.trim())
            : [];

          await setDoc(courseRef, {
            name: courseData.name || 'Unknown Course Name',
            department: courseData.department || 'Unknown Department',
            distribs: distribsArray,
            layup: parseFloat(courseData.layup) || 0,
            yes_count: 0,
            no_count: 0
          });
          
          console.log(`Added ${courseData.name} with:`, {
            distribs: distribsArray,
            layup: parseFloat(courseData.layup) || 0
          });
        }
      }
    }
  } catch (err) {
    console.error('Error initializing hidden layups:', err);
    throw err;
  }
};