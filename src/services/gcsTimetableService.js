// src/services/gcsTimetableService.js
import localforage from 'localforage';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const CACHE_VERSION = 'gcsV1';
const CACHE_TTL = 3600000; // 1 hour in milliseconds
// Use proxy route to avoid CORS issues during development
const GCS_URL = process.env.NODE_ENV === 'development' 
  ? '/gcs/timetable-info/courses_detailed.json'
  : 'https://storage.googleapis.com/timetable-info/courses_detailed.json';

// Period code to timing mapping
const periodCodeToTiming = {
  "11": "MWF 11:30-12:35, Tu 12:15-1:05",
  "10": "MWF 10:10-11:15, Th 12:15-1:05",
  "2": "MWF 2:10-3:15, Th 1:20-2:10",
  "3A": "MW 3:30-5:20, M 5:30-6:20",
  "12": "MWF 12:50-1:55, Tu 1:20-2:10",
  "2A": "TuTh 2:25-4:15, W 5:30-6:20",
  "10A": "TuTh 10:10-12, F 3:30-4:20",
  "FS": "FSP; Foreign Study Program",
  "ARR": "Arrange",
  "9L": "MWF 8:50-9:55, Th 9:05-9:55",
  "9S": "MTuWThF 9:05-9:55",
  "OT": "Th 2:00 PM-4:00 PM",
  "3B": "TuTh 4:30-6:20, F 4:35-5:25",
  "6A": "MTh 6:30-8:20, Tu 6:30-7:20",
  "6B": "W 6:30-9:30, Tu 7:30-8:20",
  "8S": "MTThF 7:45-8:35, Wed 7:45-8:35",
  "LSA": "Language Study Abroad",
};

/**
 * Fetch winter timetable data from Firestore
 * @returns {Promise<Object>} Object containing courses and cache status
 */
const fetchWinterDataFromFirestore = async () => {
  try {
    console.log('Fetching winter data from Firestore collection: winterTimetable26');
    const db = getFirestore();
    const winterCollectionRef = collection(db, 'winterTimetable26');
    const snapshot = await getDocs(winterCollectionRef);
    
    // Transform the data - Handle BOTH Firestore structure AND GCS structure
    const transformedCourses = snapshot.docs.map((doc, index) => {
      const data = doc.data();
      
      // Flexible field extraction - works with any field name variation
      const subj = data.Subj || data.subj || data.subject || data.Subject || '';
      const num = data.Num || data.num || data.number || data.Number || '';
      // Section: Use provided value, or default to '01' if missing/empty
      const secRaw = data.Sec || data.sec || data.section || data.Section || '';
      const sec = secRaw || '01'; // Default to '01' if section is missing or empty
      const title = data.Title || data.title || '';
      const periodCode = data['Period Code'] || data.period || data.Period || 'ARR';
      const room = data.Room || data.room || '';
      const building = data.Building || data.building || '';
      const instructor = data.Instructor || data.instructor || '';
      const xlist = data.XList || data.xlist || data.crossList || '';
      const wc = data.WC || data.wc || data.worldCulture || '';
      const dist = data.Dist || data.dist || data.distributive || '';
      
      const timing = periodCodeToTiming[periodCode] || 'Unknown Timing';
      
      // Create consistent documentName
      const documentName = (subj && num && sec) ? `${subj}${num}_${sec}` : doc.id;
      
      if (index < 3) {
        console.log(`Winter course ${index} from Firestore:`, {
          raw: data,
          transformed: { subj, num, sec: `${sec}${secRaw ? '' : ' (defaulted to 01)'}`, title, periodCode }
        });
      }

      return {
        documentName: documentName,
        subj: subj,
        num: num,
        sec: sec,
        title: title,
        period: periodCode,
        timing: timing,
        room: room,
        building: building,
        instructor: instructor,
        xlist: xlist,
        wc: wc,
        dist: dist,
        isNotified: false
      };
    });

    console.log(`Fetched ${transformedCourses.length} winter courses from Firestore`);
    if (transformedCourses.length > 0) {
      console.log('First winter course sample:', transformedCourses[0]);
    }
    return transformedCourses;
  } catch (error) {
    console.error('Error fetching winter data from Firestore:', error);
    throw error;
  }
};

/**
 * Fetch timetable data from Google Cloud Storage or Firestore (for winter)
 * @param {string} termType - The term type (summer, fall, winter)
 * @returns {Promise<Object>} Object containing courses and cache status
 */
export const fetchGCSTimetableData = async (termType = 'winter') => {
  try {
    // For winter term, fetch from Firestore instead of GCS
    if (termType === 'winter') {
      // Check cache first
      const cacheKey = `winterCachedCourses`;
      const cacheTimestampKey = `winterCacheTimestamp`;
      const cacheVersionKey = `winterCacheVersion`;
      
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
        console.log('Using cached winter data');
        return {
          courses: cachedCourses,
          fromCache: true
        };
      }

      console.log('Cache invalid or expired, fetching new winter data from Firestore');

      // Fetch from Firestore
      const winterCourses = await fetchWinterDataFromFirestore();

      // Store in cache
      await Promise.all([
        localforage.setItem(cacheKey, winterCourses),
        localforage.setItem(cacheTimestampKey, now),
        localforage.setItem(cacheVersionKey, CACHE_VERSION)
      ]);

      console.log('Winter data cached');
      return {
        courses: winterCourses,
        fromCache: false
      };
    }

    // For fall/summer, use GCS
    // First check if we have cached data
    const cacheKey = `gcsCachedCourses_${termType}`;
    const cacheTimestampKey = `gcsCacheTimestamp_${termType}`;
    const cacheVersionKey = `gcsCacheVersion_${termType}`;
    
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
      console.log(`Using cached GCS ${termType} data`);
      return {
        courses: cachedCourses,
        fromCache: true
      };
    }

    console.log(`Cache invalid or expired, fetching new GCS ${termType} data`);

    // If cache version doesn't match, clear the specific cache entries
    if (cachedVersion !== CACHE_VERSION) {
      console.log('GCS Version mismatch, clearing cache');
      await localforage.removeItem(cacheKey);
      await localforage.removeItem(cacheTimestampKey);
      await localforage.removeItem(cacheVersionKey);
    }

    // Fetch new data from GCS
    const response = await fetch(GCS_URL);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch timetable data: ${response.status}`);
    }

    const rawData = await response.json();
    
    if (!Array.isArray(rawData)) {
      throw new Error('Invalid data format: expected array');
    }

    // Transform the data to match the expected format
    const transformedCourses = rawData.map((course, index) => {
      const periodCode = course['Period Code'];
      const timing = periodCodeToTiming[periodCode] || 'Unknown Timing';

      return {
        documentName: `${course.Subj}${course.Num}_${course.Sec}`,
        subj: course.Subj,
        num: course.Num,
        sec: course.Sec,
        title: course.Title,
        period: periodCode,
        timing: timing,
        room: course.Room,
        building: course.Building,
        instructor: course.Instructor,
        xlist: course.XList,
        wc: course.WC,
        dist: course.Dist,
        isNotified: false
      };
    });

    // Store the new data in cache
    await Promise.all([
      localforage.setItem(cacheKey, transformedCourses),
      localforage.setItem(cacheTimestampKey, now),
      localforage.setItem(cacheVersionKey, CACHE_VERSION)
    ]);

    console.log(`New GCS ${termType} data cached`);
    return {
      courses: transformedCourses,
      fromCache: false
    };
  } catch (error) {
    console.error(`Error fetching GCS timetable data:`, error);
    throw error;
  }
};

/**
 * Clear GCS timetable cache
 * @param {string} termType - The term type to clear cache for
 */
export const clearGCSCache = async (termType = 'winter') => {
  try {
    const cacheKey = `gcsCachedCourses_${termType}`;
    const cacheTimestampKey = `gcsCacheTimestamp_${termType}`;
    const cacheVersionKey = `gcsCacheVersion_${termType}`;
    
    await Promise.all([
      localforage.removeItem(cacheKey),
      localforage.removeItem(cacheTimestampKey),
      localforage.removeItem(cacheVersionKey)
    ]);
    
    console.log(`GCS cache cleared for ${termType}`);
  } catch (error) {
    console.error(`Error clearing GCS cache:`, error);
  }
};
