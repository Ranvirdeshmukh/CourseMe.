// src/services/majorCacheService.js
import localforage from 'localforage';

const MAJOR_CACHE_KEY = 'cachedMajors';
const MAJOR_CACHE_TIMESTAMP_KEY = 'cachedMajorsTimestamp';
const MAJOR_CACHE_DURATION = 365 * 24 * 60 * 60 * 1000; // 1 year in milliseconds

/**
 * Get cached majors data
 * @returns {Promise<Array|null>} Array of majors or null if not cached/expired
 */
export const getCachedMajors = async () => {
  try {
    const cachedMajors = await localforage.getItem(MAJOR_CACHE_KEY);
    const cacheTimestamp = await localforage.getItem(MAJOR_CACHE_TIMESTAMP_KEY);
    
    if (!cachedMajors || !cacheTimestamp) {
      return null;
    }
    
    const now = Date.now();
    const isExpired = (now - cacheTimestamp) > MAJOR_CACHE_DURATION;
    
    if (isExpired) {
      // Clear expired cache
      await localforage.removeItem(MAJOR_CACHE_KEY);
      await localforage.removeItem(MAJOR_CACHE_TIMESTAMP_KEY);
      return null;
    }
    
    return cachedMajors;
  } catch (error) {
    console.error('Error getting cached majors:', error);
    return null;
  }
};

/**
 * Cache majors data
 * @param {Array} majors - Array of major strings
 * @returns {Promise<boolean>} Success status
 */
export const cacheMajors = async (majors) => {
  try {
    const now = Date.now();
    await Promise.all([
      localforage.setItem(MAJOR_CACHE_KEY, majors),
      localforage.setItem(MAJOR_CACHE_TIMESTAMP_KEY, now)
    ]);
    
    console.log(`Majors cached successfully. Expires in ${MAJOR_CACHE_DURATION / (24 * 60 * 60 * 1000)} days`);
    return true;
  } catch (error) {
    console.error('Error caching majors:', error);
    return false;
  }
};

/**
 * Clear majors cache
 * @returns {Promise<boolean>} Success status
 */
export const clearMajorsCache = async () => {
  try {
    await Promise.all([
      localforage.removeItem(MAJOR_CACHE_KEY),
      localforage.removeItem(MAJOR_CACHE_TIMESTAMP_KEY)
    ]);
    
    console.log('Majors cache cleared');
    return true;
  } catch (error) {
    console.error('Error clearing majors cache:', error);
    return false;
  }
};

/**
 * Get cache status information
 * @returns {Promise<Object>} Cache status object
 */
export const getMajorsCacheStatus = async () => {
  try {
    const cachedMajors = await localforage.getItem(MAJOR_CACHE_KEY);
    const cacheTimestamp = await localforage.getItem(MAJOR_CACHE_TIMESTAMP_KEY);
    
    if (!cachedMajors || !cacheTimestamp) {
      return {
        hasCache: false,
        expiresAt: null,
        daysRemaining: null,
        majorCount: 0
      };
    }
    
    const now = Date.now();
    const expiresAt = new Date(cacheTimestamp + MAJOR_CACHE_DURATION);
    const daysRemaining = Math.ceil((cacheTimestamp + MAJOR_CACHE_DURATION - now) / (24 * 60 * 60 * 1000));
    
    return {
      hasCache: true,
      expiresAt,
      daysRemaining: Math.max(0, daysRemaining),
      majorCount: cachedMajors.length
    };
  } catch (error) {
    console.error('Error getting majors cache status:', error);
    return {
      hasCache: false,
      expiresAt: null,
      daysRemaining: null,
      majorCount: 0
    };
  }
};
