// src/services/enrollmentDataService.js
import localforage from 'localforage';

// Constants
const ENROLLMENT_REFRESH_INTERVAL = 43200000; // 12 hours in milliseconds

/**
 * Fetches enrollment data from the server or cache
 * @returns {Promise<Object>} Object containing enrollment data indexed by course key
 */
export const fetchEnrollmentData = async () => {
  try {
    // Check for cached data first
    const lastFetchTime = await localforage.getItem('enrollmentDataTimestamp');
    const now = Date.now();
    
    // Refresh every 12 hours
    if (lastFetchTime && (now - lastFetchTime < ENROLLMENT_REFRESH_INTERVAL)) {
      const cachedData = await localforage.getItem('enrollmentData');
      if (cachedData && Object.keys(cachedData).length > 0) {
        console.log("Using cached enrollment data with", Object.keys(cachedData).length, "entries");
        return cachedData;
      }
    }
    
    console.log("Fetching fresh enrollment data");
    
    const response = await fetch('https://storage.googleapis.com/timetable-info/winter_courses_latest.json');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch enrollment data: ${response.status}`);
    }
    
    const rawText = await response.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (parseError) {
      console.error("Error parsing enrollment data JSON:", parseError);
      throw new Error("Failed to parse enrollment data");
    }
    
    // Process the enrollment data
    const processedData = {};
    
    if (Array.isArray(data)) {
      data.forEach((course) => {
        if (Array.isArray(course) && course.length >= 6) {
          const [dept, num, sec, limit, enrolled, ip] = course;
          
          const normalizedNum = num.replace(/^0+/, '').replace(/\.(\d+)0+$/, '.$1');
          const normalizedSec = sec.replace(/^0+/, '');
          const normalizedKey = `${dept}|${normalizedNum}|${normalizedSec}`;
          
          processedData[normalizedKey] = {
            limit: limit === "&nbsp" ? null : parseInt(limit),
            enrolled: enrolled === "&nbsp" ? null : parseInt(enrolled),
            hasIP: ip === "IP"
          };
        }
      });
    }
    
    // Cache the processed data
    await localforage.setItem('enrollmentData', processedData);
    await localforage.setItem('enrollmentDataTimestamp', now);
    
    return processedData;
  } catch (error) {
    console.error('Error fetching enrollment data:', error);
    
    // Fallback to cached data if available
    const cachedData = await localforage.getItem('enrollmentData');
    if (cachedData) {
      console.log("Using fallback cached enrollment data");
      return cachedData;
    }
    
    return {};
  }
};

/**
 * Enhances course data with enrollment information
 * @param {Array} coursesData Array of course objects
 * @returns {Promise<Array>} Enhanced course objects with enrollment data
 */
export const enhanceCourseDataWithEnrollment = async (coursesData) => {
  try {
    const enrollmentData = await fetchEnrollmentData();
    
    if (Object.keys(enrollmentData).length === 0) {
      return coursesData.map(course => ({
        ...course,
        enrollmentStatus: 'unknown',
        enrollmentLimit: null,
        enrollmentCurrent: null,
        enrollmentHasIP: false
      }));
    }
    
    return coursesData.map(course => {
      // Skip invalid courses
      if (!course.subj || !course.num || !course.sec) {
        return {
          ...course,
          enrollmentStatus: 'unknown',
          enrollmentLimit: null,
          enrollmentCurrent: null,
          enrollmentHasIP: false
        };
      }
      
      // Generate different key formats to try for matching
      const keyFormats = [
        `${course.subj}|${course.num.replace(/^0+/, '')}|${course.sec.replace(/^0+/, '')}`,
        `${course.subj}|${course.num.padStart(3, '0')}|${course.sec.padStart(2, '0')}`,
        `${course.subj}|${course.num.includes('.') ? course.num : course.num.padStart(3, '0')}|${course.sec.padStart(2, '0')}`,
        `${course.subj}|${course.num}|${course.sec}`,
      ];
      
      // Try each key format to find a match
      let enrollment = null;
      
      for (const keyFormat of keyFormats) {
        if (enrollmentData[keyFormat]) {
          enrollment = enrollmentData[keyFormat];
          break;
        }
      }
      
      // Return the course with enrollment data if found
      return {
        ...course,
        enrollmentLimit: enrollment?.limit ?? null,
        enrollmentCurrent: enrollment?.enrolled ?? null,
        enrollmentHasIP: enrollment?.hasIP ?? false,
        enrollmentStatus: !enrollment ? 'unknown' : 
                         enrollment.hasIP ? 'ip' :
                         enrollment.limit === null ? 'open' :
                         enrollment.enrolled >= enrollment.limit ? 'full' : 'open'
      };
    });
  } catch (error) {
    console.error("Error enhancing courses with enrollment data:", error);
    // Return courses with unknown enrollment status
    return coursesData.map(course => ({
      ...course,
      enrollmentStatus: 'unknown',
      enrollmentLimit: null,
      enrollmentCurrent: null,
      enrollmentHasIP: false
    }));
  }
};