import { db } from '../firebase';
import { 
  collection, 
  query, 
  getDocs, 
  where, 
  limit, 
  doc, 
  getDoc,
  onSnapshot
} from 'firebase/firestore';
import localforage from 'localforage';

// Cache configuration
const CACHE_CONFIG = {
  COURSE_DATA: {
    KEY: 'course_data_cache',
    VERSION: 'v2',
    DURATION: 24 * 60 * 60 * 1000, // 24 hours
    REFRESH_THRESHOLD: 60 * 60 * 1000 // 1 hour
  },
  PERIOD_DATA: {
    KEY: 'period_data_cache',
    VERSION: 'v2',
    DURATION: 24 * 60 * 60 * 1000,
    REFRESH_THRESHOLD: 60 * 60 * 1000
  },
  HIDDEN_LAYUPS: {
    KEY: 'hidden_layups_static_data',
    VERSION: 'v2',
    DURATION: 3 * 24 * 60 * 60 * 1000, // 3 days
  },
  MAX_RETRY_ATTEMPTS: 3
};

// Helper function to normalize course numbers
const normalizeCourseNumber = (number) => {
  if (typeof number === 'string' && number.includes('.')) {
    const [integerPart, decimalPart] = number.split('.');
    return `${integerPart.padStart(3, '0')}.${decimalPart}`;
  }
  return typeof number === 'string' ? number.padStart(3, '0') : String(number).padStart(3, '0');
};

// Cache operation helpers
async function cacheRead(key, defaultValue = null) {
  let attempts = 0;
  while (attempts < CACHE_CONFIG.MAX_RETRY_ATTEMPTS) {
    try {
      const value = await localforage.getItem(key);
      return value !== null ? value : defaultValue;
    } catch (err) {
      attempts++;
      if (attempts >= CACHE_CONFIG.MAX_RETRY_ATTEMPTS) {
        console.error(`Cache read failed after ${CACHE_CONFIG.MAX_RETRY_ATTEMPTS} attempts:`, err);
        return defaultValue;
      }
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempts)));
    }
  }
  return defaultValue;
}

async function cacheWrite(key, value) {
  let attempts = 0;
  while (attempts < CACHE_CONFIG.MAX_RETRY_ATTEMPTS) {
    try {
      await localforage.setItem(key, value);
      return true;
    } catch (err) {
      attempts++;
      if (attempts >= CACHE_CONFIG.MAX_RETRY_ATTEMPTS) {
        console.error(`Cache write failed after ${CACHE_CONFIG.MAX_RETRY_ATTEMPTS} attempts:`, err);
        return false;
      }
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempts)));
    }
  }
  return false;
}

// Check if cache needs refresh
function shouldRefreshCache(timestamp, threshold) {
  if (!timestamp) return true;
  const age = Date.now() - timestamp;
  return age > threshold;
}

// Fetch and cache course index (used by multiple components)
async function fetchAndCacheCourseIndex() {
  try {
    console.log('Fetching fresh course index from Firestore');
    const coursesIndex = new Map();
    const coursesSnapshot = await getDocs(collection(db, 'courses'));
    
    coursesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.department && data.course_number) {
        const key = `${data.department}_${normalizeCourseNumber(data.course_number)}`;
        coursesIndex.set(key, {
          layup: data.layup || 0,
          id: doc.id,
          name: data.name || '',
          numOfReviews: data.numOfReviews || 0,
          department: data.department,
          distribs: data.distribs ? data.distribs.split(',').map(d => d.trim()) : []
        });
      }
    });
    
    // Cache the index
    await Promise.all([
      cacheWrite('course_index_cache', coursesIndex),
      cacheWrite('course_index_timestamp', Date.now()),
      cacheWrite('course_index_version', CACHE_CONFIG.COURSE_DATA.VERSION)
    ]);
    
    return coursesIndex;
  } catch (err) {
    console.error('Error fetching course index:', err);
    throw err;
  }
}

// Get course index with caching
export async function getCourseIndex() {
  try {
    // Check if we have a cached index
    const cachedIndex = await cacheRead('course_index_cache');
    const cacheTimestamp = await cacheRead('course_index_timestamp', 0);
    const cacheVersion = await cacheRead('course_index_version', '');
    
    // Use valid cache but refresh in background if stale
    if (cachedIndex && 
        cacheVersion === CACHE_CONFIG.COURSE_DATA.VERSION && 
        Date.now() - cacheTimestamp < CACHE_CONFIG.COURSE_DATA.DURATION) {
      
      // If cache is older than refresh threshold, refresh in background
      if (shouldRefreshCache(cacheTimestamp, CACHE_CONFIG.COURSE_DATA.REFRESH_THRESHOLD)) {
        console.log('Refreshing course index in background');
        fetchAndCacheCourseIndex().catch(err => 
          console.error('Background refresh of course index failed:', err)
        );
      }
      
      return cachedIndex;
    }
    
    // No valid cache, fetch fresh data
    return await fetchAndCacheCourseIndex();
  } catch (err) {
    console.error('Error in getCourseIndex:', err);
    throw err;
  }
}

// Fetch courses by period with caching
export async function getCoursesByPeriod(periodCode, periodCodeToTiming, term = 'spring') {
  try {
    const courseIndex = await getCourseIndex();
    
    // Generate cache keys - include term in cache key
    const cacheKey = `${CACHE_CONFIG.PERIOD_DATA.KEY}_${term}_${periodCode}`;
    const timestampKey = `${cacheKey}_timestamp`;
    const versionKey = `${cacheKey}_version`;
    
    // Check cache first
    const cachedData = await cacheRead(cacheKey);
    const cacheTimestamp = await cacheRead(timestampKey, 0);
    const cacheVersion = await cacheRead(versionKey, '');

    // Use cache if valid and not expired
    const isCacheValid = cachedData && 
                       cacheVersion === CACHE_CONFIG.PERIOD_DATA.VERSION && 
                       Date.now() - cacheTimestamp < CACHE_CONFIG.PERIOD_DATA.DURATION;
                       
    if (isCacheValid) {
      // If cache is stale but not expired, refresh in background
      if (shouldRefreshCache(cacheTimestamp, CACHE_CONFIG.PERIOD_DATA.REFRESH_THRESHOLD)) {
        console.log(`Background refreshing data for period ${periodCode} (${term})`);
        fetchPeriodCoursesFromFirestore(periodCode, courseIndex, periodCodeToTiming, term)
          .then(freshData => {
            Promise.all([
              cacheWrite(cacheKey, freshData),
              cacheWrite(timestampKey, Date.now()),
              cacheWrite(versionKey, CACHE_CONFIG.PERIOD_DATA.VERSION)
            ]).catch(err => console.error('Failed to update period cache:', err));
          })
          .catch(err => console.error('Background refresh failed:', err));
      }
      
      return cachedData;
    }

    // Cache miss or invalid - fetch fresh data
    const data = await fetchPeriodCoursesFromFirestore(periodCode, courseIndex, periodCodeToTiming, term);
    
    // Cache the results
    await Promise.all([
      cacheWrite(cacheKey, data),
      cacheWrite(timestampKey, Date.now()),
      cacheWrite(versionKey, CACHE_CONFIG.PERIOD_DATA.VERSION)
    ]);

    return data;
  } catch (error) {
    console.error('Error fetching courses by period:', error);
    
    // Try to recover from cache in case of network failure
    try {
      const fallbackData = await cacheRead(`${CACHE_CONFIG.PERIOD_DATA.KEY}_${term}_${periodCode}`);
      if (fallbackData) {
        console.log('Recovered period data from cache after fetch failure');
        return fallbackData;
      }
    } catch (cacheError) {
      console.error('Cache recovery also failed:', cacheError);
    }
    
    throw error;
  }
}

// Extract the Firestore query logic for period courses
async function fetchPeriodCoursesFromFirestore(periodCode, courseIndex, periodCodeToTiming, term = 'spring') {
  let collectionName;
  if (term === 'summer') {
    collectionName = 'summerTimetable';
  } else if (term === 'fall') {
    collectionName = 'fallTimetable2';
  } else {
    collectionName = 'springTimetable';
  }
  
  console.log(`Fetching from collection: ${collectionName} for period ${periodCode}`);
  
  // Fetch timetable data with limit to improve performance
  const timetableQuery = query(
    collection(db, collectionName),
    where('Period Code', '==', periodCode),
    limit(100) // Add reasonable limit to query
  );
  const timetableSnapshot = await getDocs(timetableQuery);
  
  if (timetableSnapshot.empty) {
    console.log(`No courses found for period ${periodCode} in ${term} term`);
    return [];
  }
  
  // Process data efficiently
  const courses = timetableSnapshot.docs.map(doc => {
    const data = doc.data();
    const lookupKey = `${data.Subj}_${normalizeCourseNumber(data.Num)}`;
    const courseInfo = courseIndex.get(lookupKey) || { 
      layup: 0, 
      id: null,
      name: '',
      numOfReviews: 0,
      distribs: ''
    };

    return {
      id: doc.id,
      subj: data.Subj,
      num: data.Num,
      title: data.Title,
      section: data.Section,
      period: data['Period Code'],
      instructor: data.Instructor,
      timing: periodCodeToTiming[data['Period Code']] || 'Unknown Timing',
      layup: courseInfo.layup,
      courseId: courseInfo.id,
      numOfReviews: courseInfo.numOfReviews,
      distribs: courseInfo.distribs // Make sure distribs are included
    };
  });

  // Return all courses that have a layup score, sorted by score
  // Don't limit to only 15 courses so that department filtering works properly
  return courses
    .filter(course => course.layup > 0)
    .sort((a, b) => b.layup - a.layup);
}

// Get Hidden Layups static data with caching
export async function getHiddenLayupsStaticData(hiddenLayupCourseIds) {
  try {
    // Check cache first
    const cachedData = await cacheRead(CACHE_CONFIG.HIDDEN_LAYUPS.KEY);
    const cacheTimestamp = await cacheRead(`${CACHE_CONFIG.HIDDEN_LAYUPS.KEY}_timestamp`, 0);
    const cacheVersion = await cacheRead(`${CACHE_CONFIG.HIDDEN_LAYUPS.KEY}_version`, '');
    
    // Use cache if valid and not expired
    if (cachedData && 
        cacheVersion === CACHE_CONFIG.HIDDEN_LAYUPS.VERSION && 
        Date.now() - cacheTimestamp < CACHE_CONFIG.HIDDEN_LAYUPS.DURATION) {
      return cachedData;
    }
    
    // Cache miss or expired - fetch fresh data
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
    
    // Cache the results
    await Promise.all([
      cacheWrite(CACHE_CONFIG.HIDDEN_LAYUPS.KEY, coursesData),
      cacheWrite(`${CACHE_CONFIG.HIDDEN_LAYUPS.KEY}_timestamp`, Date.now()),
      cacheWrite(`${CACHE_CONFIG.HIDDEN_LAYUPS.KEY}_version`, CACHE_CONFIG.HIDDEN_LAYUPS.VERSION)
    ]);
    
    return coursesData;
  } catch (err) {
    console.error('Error fetching hidden layups static data:', err);
    throw err;
  }
}

// Set up real-time listener for hidden layups vote data
export function subscribeToHiddenLayupsVotes(hiddenLayupCourseIds, callback) {
  console.log('[Service Debug] Setting up vote subscription for:', hiddenLayupCourseIds);
  
  // This returns real-time data, so we don't cache it
  try {
    return onSnapshot(
      collection(db, 'hidden_layups'),
      (snapshot) => {
        const voteCounts = {};
        snapshot.docs.forEach(doc => {
          console.log(`[Service Debug] Processing vote doc: ${doc.id}, exists in hidden layups: ${hiddenLayupCourseIds.includes(doc.id)}`);
          if (hiddenLayupCourseIds.includes(doc.id)) {
            voteCounts[doc.id] = {
              yes_count: doc.data().yes_count || 0,
              no_count: doc.data().no_count || 0
            };
          }
        });
        console.log('[Service Debug] Vote counts collected:', voteCounts);
        callback(voteCounts);
      },
      (error) => {
        console.error('[Service Debug] Error in vote subscription:', error);
        // Don't throw here, just log it - throwing in onSnapshot callbacks can cause issues
        callback({}); // Call with empty data instead of throwing
      }
    );
  } catch (error) {
    console.error('[Service Debug] Failed to set up vote subscription:', error);
    // Return a dummy unsubscribe function to prevent crashes
    return () => {};
  }
}

// Get user votes for hidden layups
export async function getUserVotesForHiddenLayups(courseIds, userId) {
  if (!userId) return {};
  
  try {
    const userVotesPromises = courseIds.map(async courseId => {
      const voteDoc = await getDoc(doc(db, 'hidden_layups', courseId, 'votes', userId));
      return [courseId, voteDoc.exists() ? voteDoc.data().vote : null];
    });
    
    const userVotes = await Promise.all(userVotesPromises);
    return Object.fromEntries(userVotes);
  } catch (err) {
    console.error('Error fetching user votes:', err);
    return {};
  }
}

// Get Top Layups data with caching
export async function getTopLayups(limit = 15) {
  try {
    const cacheKey = `top_layups_cache_${limit}`;
    const timestampKey = `${cacheKey}_timestamp`;
    const versionKey = `${cacheKey}_version`;
    
    // Check cache first
    const cachedData = await cacheRead(cacheKey);
    const cacheTimestamp = await cacheRead(timestampKey, 0);
    const cacheVersion = await cacheRead(versionKey, '');
    
    // Use cache if valid
    if (cachedData && 
        cacheVersion === CACHE_CONFIG.COURSE_DATA.VERSION && 
        Date.now() - cacheTimestamp < CACHE_CONFIG.COURSE_DATA.DURATION) {
      
      // If cache is stale but not expired, refresh in background
      if (shouldRefreshCache(cacheTimestamp, CACHE_CONFIG.COURSE_DATA.REFRESH_THRESHOLD)) {
        console.log('Refreshing top layups in background');
        fetchTopLayupsFromFirestore(limit)
          .then(freshData => {
            Promise.all([
              cacheWrite(cacheKey, freshData),
              cacheWrite(timestampKey, Date.now()),
              cacheWrite(versionKey, CACHE_CONFIG.COURSE_DATA.VERSION)
            ]).catch(err => console.error('Failed to update top layups cache:', err));
          })
          .catch(err => console.error('Background refresh failed:', err));
      }
      
      return cachedData;
    }
    
    // Cache miss or invalid - fetch fresh data
    const data = await fetchTopLayupsFromFirestore(limit);
    
    // Cache the results
    await Promise.all([
      cacheWrite(cacheKey, data),
      cacheWrite(timestampKey, Date.now()),
      cacheWrite(versionKey, CACHE_CONFIG.COURSE_DATA.VERSION)
    ]);
    
    return data;
  } catch (err) {
    console.error('Error getting top layups:', err);
    
    // Try to recover from cache in case of network failure
    try {
      const fallbackData = await cacheRead(`top_layups_cache_${limit}`);
      if (fallbackData) {
        console.log('Recovered top layups from cache after fetch failure');
        return fallbackData;
      }
    } catch (cacheError) {
      console.error('Cache recovery also failed:', cacheError);
    }
    
    throw err;
  }
}

// Fetch top layups from Firestore
async function fetchTopLayupsFromFirestore(limit) {
  const q = query(
    collection(db, 'courses'),
    where('layup', '>', 0),
    limit(limit)
  );
  
  const snap = await getDocs(q);
  return snap.docs.map(doc => {
    const docData = doc.data();
    return {
      id: doc.id,
      name: docData.name || 'Untitled',
      distribs: docData.distribs
        ? docData.distribs.split(',').map((d) => d.trim())
        : [],
      layup: docData.layup ?? 0,
      numOfReviews: docData.numOfReviews ?? 0,
      department: docData.department
    };
  }).sort((a, b) => b.layup - a.layup);
} 