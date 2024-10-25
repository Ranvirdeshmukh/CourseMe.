// initializeHiddenLayups.js

import { db } from '../firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { hiddenLayupCourseIds } from '../constants/hiddenLayupConstants';

const CACHE_KEY = 'hidden_layups_course_data';
const CACHE_DURATION = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds

// Get cached course data from localStorage
const getCachedCourseData = () => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const isExpired = Date.now() - timestamp > CACHE_DURATION;
    
    if (isExpired) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Error reading cache:', err);
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
};

// Save course data to localStorage
const setCachedCourseData = (data) => {
  try {
    const cacheData = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (err) {
    console.error('Error setting cache:', err);
  }
};

// Fetch fresh course data from Firestore
const fetchCourseData = async () => {
  const coursesQuery = await getDocs(collection(db, 'courses'));
  const coursesData = {};
  
  coursesQuery.docs.forEach(doc => {
    if (hiddenLayupCourseIds.includes(doc.id)) {
      const data = doc.data();
      coursesData[doc.id] = {
        id: doc.id,
        name: data.name || 'Unknown Course Name',
        department: data.department || 'Unknown Department',
        distribs: data.distribs ? data.distribs.split(',').map(d => d.trim()) : [],
        layup: parseFloat(data.layup) || 0
      };
    }
  });

  return coursesData;
};

// Get vote counts from Firestore
const getVoteCounts = async () => {
  const voteCounts = {};
  const hiddenLayupsQuery = await getDocs(collection(db, 'hidden_layups'));
  
  hiddenLayupsQuery.docs.forEach(doc => {
    if (hiddenLayupCourseIds.includes(doc.id)) {
      voteCounts[doc.id] = {
        yes_count: doc.data().yes_count || 0,
        no_count: doc.data().no_count || 0
      };
    }
  });
  
  return voteCounts;
};

export const initializeHiddenLayups = async () => {
  try {
    let courseData = getCachedCourseData();
    
    // If no cached data, fetch from Firestore and cache it
    if (!courseData) {
      console.log('Fetching fresh course data');
      courseData = await fetchCourseData();
      setCachedCourseData(courseData);
    } else {
      console.log('Using cached course data');
    }

    // Always get fresh vote counts
    const voteCounts = await getVoteCounts();
    
    // Combine static course data with fresh vote counts
    const combinedData = {};
    for (const courseId of hiddenLayupCourseIds) {
      if (courseData[courseId]) {
        combinedData[courseId] = {
          ...courseData[courseId],
          yes_count: voteCounts[courseId]?.yes_count || 0,
          no_count: voteCounts[courseId]?.no_count || 0
        };
      }
    }

    return combinedData;
  } catch (err) {
    console.error('Error initializing hidden layups:', err);
    throw err;
  }
};

// Function to get user votes
export const getUserVotes = async (courseId, userId) => {
  if (!userId) return null;
  try {
    const voteDoc = await getDoc(doc(db, 'hidden_layups', courseId, 'votes', userId));
    return voteDoc.exists() ? voteDoc.data().vote : null;
  } catch (err) {
    console.error('Error fetching user vote:', err);
    return null;
  }
};