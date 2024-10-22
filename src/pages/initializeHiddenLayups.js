import { db } from '../firebase';
import { doc, setDoc, getDoc, collection, getDocs, writeBatch } from 'firebase/firestore';
import { hiddenLayupCourseIds } from '../constants/hiddenLayupConstants';

export const initializeHiddenLayups = async () => {
  try {
    // Get current hidden layups data to preserve vote counts
    const hiddenLayupsQuery = await getDocs(collection(db, 'hidden_layups'));
    const existingLayups = {};
    hiddenLayupsQuery.docs.forEach(doc => {
      existingLayups[doc.id] = doc.data();
    });

    // Fetch all courses in a single query
    const coursesQuery = await getDocs(collection(db, 'courses'));
    const coursesData = {};
    coursesQuery.docs.forEach(doc => {
      if (hiddenLayupCourseIds.includes(doc.id)) {
        coursesData[doc.id] = doc.data();
      }
    });

    // Prepare batch updates for all courses
    const batch = writeBatch(db);
    
    // Update or create documents for all hidden layup courses
    for (const courseId of hiddenLayupCourseIds) {
      const courseData = coursesData[courseId];
      if (courseData) {
        const courseRef = doc(db, 'hidden_layups', courseId);
        
        // Prepare course data, preserving existing vote counts
        batch.set(courseRef, {
          name: courseData.name || 'Unknown Course Name',
          department: courseData.department || 'Unknown Department',
          distribs: courseData.distribs ? courseData.distribs.split(',').map(d => d.trim()) : [],
          layup: parseFloat(courseData.layup) || 0,
          yes_count: existingLayups[courseId]?.yes_count || 0,
          no_count: existingLayups[courseId]?.no_count || 0,
          lastUpdated: new Date()
        });
      }
    }

    // Execute all updates in a single batch
    await batch.commit();
    console.log('Successfully initialized/updated all hidden layups');

  } catch (err) {
    console.error('Error initializing hidden layups:', err);
    throw err;
  }
};