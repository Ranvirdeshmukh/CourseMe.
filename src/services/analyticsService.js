// src/services/analyticsService.js
import { 
  getFirestore, 
  collection, 
  addDoc, 
  serverTimestamp, 
  doc, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs 
} from 'firebase/firestore';
import { auth } from '../firebase';

/**
 * Determines the user's device type based on user agent
 * @returns {string} The device type (mobile, tablet, desktop)
 */
const getDeviceType = () => {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  
  // Check if mobile
  if (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
    // Check if tablet
    if (/ipad/i.test(userAgent) || 
        (/android/i.test(userAgent) && !/mobile/i.test(userAgent))) {
      return 'tablet';
    }
    return 'mobile';
  }
  
  return 'desktop';
};

/**
 * Records when a user views an analytics page
 * @param {string} userId - The user's ID
 * @param {string} contentType - The type of content (professor or course)
 * @param {string} contentId - The ID of the content being viewed
 * @param {string} pagePath - The current page path
 * @returns {Promise<void>}
 */
export const recordAnalyticsView = async (userId, contentType, contentId, pagePath) => {
  if (!userId || !contentType || !contentId) return;
  
  try {
    const db = getFirestore();
    const currentUser = auth.currentUser;
    
    await addDoc(collection(db, 'analytics_views'), {
      userId: userId,
      contentType: contentType, // 'professor' or 'course'
      contentId: contentId,
      timestamp: serverTimestamp(),
      userAgent: navigator.userAgent,
      deviceType: getDeviceType(),
      pagePath: pagePath || window.location.pathname,
      // Additional user metadata
      userEmail: currentUser?.email || null,
      userName: currentUser?.displayName || null,
      sessionId: sessionStorage.getItem('session_id') || `session_${Date.now()}`
    });
  } catch (error) {
    console.error('Error recording analytics view:', error);
  }
};

/**
 * Logs the duration of an analytics session
 * @param {string} userId - The user's ID
 * @param {string} contentType - The type of content (professor or course)
 * @param {string} contentId - The ID of the content being viewed
 * @param {number} durationMs - Session duration in milliseconds
 * @returns {Promise<void>}
 */
export const logAnalyticsSession = async (userId, contentType, contentId, durationMs) => {
  if (!userId || !contentType || !contentId || !durationMs) return;
  
  try {
    const db = getFirestore();
    const currentUser = auth.currentUser;
    
    const docRef = await addDoc(collection(db, 'analytics_sessions'), {
      userId: userId,
      contentType: contentType,
      contentId: contentId,
      startTime: new Date(Date.now() - durationMs),
      endTime: new Date(),
      durationMs: durationMs,
      timestamp: serverTimestamp(), // Add server timestamp for proper indexing
      userAgent: navigator.userAgent,
      deviceType: getDeviceType(),
      userEmail: currentUser?.email || null,
      userName: currentUser?.displayName || null,
      sessionId: sessionStorage.getItem('session_id') || `session_${Date.now()}`
    });
    
    console.log('Successfully logged analytics session for:', contentType, 'with ID:', docRef.id);
  } catch (error) {
    console.error('Error logging analytics session:', error);
  }
};

/**
 * Test function to explicitly create a session entry
 * This is for debugging purposes to verify collection creation
 */
export const testCreateAnalyticsSession = async () => {
  try {
    const db = getFirestore();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      console.error('No user logged in, cannot create test entry');
      return;
    }
    
    const docRef = await addDoc(collection(db, 'analytics_sessions'), {
      userId: currentUser.uid,
      contentType: 'test_entry',
      contentId: 'debug_session',
      startTime: new Date(Date.now() - 60000), // 1 minute ago
      endTime: new Date(),
      durationMs: 60000,
      timestamp: serverTimestamp(),
      userAgent: navigator.userAgent,
      deviceType: getDeviceType(),
      userEmail: currentUser.email || null,
      userName: currentUser.displayName || null,
      sessionId: `test_session_${Date.now()}`,
      isTestEntry: true
    });
    
    console.log('✅ TEST ENTRY CREATED SUCCESSFULLY! Document ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ ERROR CREATING TEST ENTRY:', error);
    return null;
  }
};

/**
 * Checks if a user has admin privileges
 * @param {string} userId - The user's ID
 * @returns {Promise<boolean>} Whether the user is an admin
 */
export const checkUserIsAdmin = async (userId) => {
  if (!userId) return false;
  
  try {
    const db = getFirestore();
    const userDoc = await getDoc(doc(db, 'users', userId));
    return userDoc.exists() && userDoc.data()?.isAdmin === true;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

/**
 * Get recent analytics views data
 * @param {number} limit - Number of records to retrieve
 * @returns {Promise<Array>} Array of view records
 */
export const getRecentAnalyticsViews = async (limitCount = 50) => {
  try {
    const db = getFirestore();
    const analyticsRef = collection(db, 'analytics_views');
    const q = query(analyticsRef, orderBy('timestamp', 'desc'), limit(limitCount));
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      formattedTime: doc.data().timestamp?.toDate().toLocaleString()
    }));
  } catch (error) {
    console.error('Error fetching analytics views:', error);
    return [];
  }
};

/**
 * Get analytics data for a specific user
 * @param {string} userId - The user's ID
 * @returns {Promise<Array>} Array of view records for the user
 */
export const getUserAnalyticsData = async (userId) => {
  if (!userId) return [];
  
  try {
    const db = getFirestore();
    const analyticsRef = collection(db, 'analytics_views');
    const q = query(
      analyticsRef, 
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      formattedTime: doc.data().timestamp?.toDate().toLocaleString()
    }));
  } catch (error) {
    console.error('Error fetching user analytics data:', error);
    return [];
  }
};

// Initialize a session ID if not present
if (!sessionStorage.getItem('session_id')) {
  sessionStorage.setItem('session_id', `session_${Date.now()}`);
}
