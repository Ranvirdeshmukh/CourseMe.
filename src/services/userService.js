// src/services/userService.js
import { doc, getDoc, setDoc, updateDoc, arrayRemove, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Get user profile data
 */
export const getUserProfile = async (userId) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);
    
    if (userDocSnap.exists()) {
      return {
        success: true,
        data: userDocSnap.data()
      };
    } else {
      return {
        success: false,
        error: 'User profile not found'
      };
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return {
      success: false,
      error: 'Failed to fetch user profile'
    };
  }
};

/**
 * Create or update user profile
 */
export const createUserProfile = async (userId, profileData) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, {
      ...profileData,
      createdAt: profileData.createdAt || new Date()
    }, { merge: true });
    
    return {
      success: true,
      message: 'Profile created successfully'
    };
  } catch (error) {
    console.error('Error creating user profile:', error);
    return {
      success: false,
      error: 'Failed to create user profile'
    };
  }
};

/**
 * Update user profile fields
 */
export const updateUserProfile = async (userId, updates) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, updates);
    
    return {
      success: true,
      message: 'Profile updated successfully'
    };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return {
      success: false,
      error: 'Failed to update user profile'
    };
  }
};

/**
 * Check if user needs to complete profile
 */
export const needsProfileCompletion = (userData) => {
  return !userData.major || !userData.classYear;
};

/**
 * Add notification to user
 */
export const addNotification = async (userId, notification) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      notifications: arrayUnion(notification)
    });
    
    return {
      success: true,
      message: 'Notification added'
    };
  } catch (error) {
    console.error('Error adding notification:', error);
    return {
      success: false,
      error: 'Failed to add notification'
    };
  }
};

/**
 * Remove notification from user
 */
export const removeNotification = async (userId, notification) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      notifications: arrayRemove(notification)
    });
    
    return {
      success: true,
      message: 'Notification removed'
    };
  } catch (error) {
    console.error('Error removing notification:', error);
    return {
      success: false,
      error: 'Failed to remove notification'
    };
  }
};

/**
 * Get user's pinned courses
 */
export const getPinnedCourses = async (userId) => {
  try {
    const result = await getUserProfile(userId);
    if (result.success) {
      return {
        success: true,
        pinnedCourses: result.data.pinnedCourses || []
      };
    }
    return result;
  } catch (error) {
    console.error('Error fetching pinned courses:', error);
    return {
      success: false,
      error: 'Failed to fetch pinned courses'
    };
  }
};

/**
 * Pin a course
 */
export const pinCourse = async (userId, courseId) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      pinnedCourses: arrayUnion(courseId)
    });
    
    return {
      success: true,
      message: 'Course pinned successfully'
    };
  } catch (error) {
    console.error('Error pinning course:', error);
    return {
      success: false,
      error: 'Failed to pin course'
    };
  }
};

/**
 * Unpin a course
 */
export const unpinCourse = async (userId, courseId) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      pinnedCourses: arrayRemove(courseId)
    });
    
    return {
      success: true,
      message: 'Course unpinned successfully'
    };
  } catch (error) {
    console.error('Error unpinning course:', error);
    return {
      success: false,
      error: 'Failed to unpin course'
    };
  }
};

/**
 * Check if user is a beta user
 */
export const isBetaUser = async (userId) => {
  try {
    const result = await getUserProfile(userId);
    if (result.success) {
      return {
        success: true,
        isBeta: result.data.beta === true
      };
    }
    return result;
  } catch (error) {
    console.error('Error checking beta status:', error);
    return {
      success: false,
      error: 'Failed to check beta status',
      isBeta: false
    };
  }
};

/**
 * Get user's first name
 */
export const getUserFirstName = async (userId) => {
  try {
    const result = await getUserProfile(userId);
    if (result.success) {
      return {
        success: true,
        firstName: result.data.firstName || null
      };
    }
    return result;
  } catch (error) {
    console.error('Error fetching user first name:', error);
    return {
      success: false,
      error: 'Failed to fetch user first name',
      firstName: null
    };
  }
};

/**
 * Save search to user's search history
 */
export const saveSearchToHistory = async (userId, searchQuery) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const searchEntry = {
      id: Date.now().toString(),
      query: searchQuery,
      timestamp: new Date().toISOString()
    };
    
    await updateDoc(userDocRef, {
      searchHistory: arrayUnion(searchEntry)
    });
    
    return {
      success: true,
      searchEntry
    };
  } catch (error) {
    console.error('Error saving search to history:', error);
    return {
      success: false,
      error: 'Failed to save search'
    };
  }
};

/**
 * Get user's search history
 */
export const getSearchHistory = async (userId, limit = 5) => {
  try {
    const result = await getUserProfile(userId);
    if (result.success) {
      const searchHistory = result.data.searchHistory || [];
      return {
        success: true,
        searches: searchHistory.slice(-limit).reverse()
      };
    }
    return result;
  } catch (error) {
    console.error('Error fetching search history:', error);
    return {
      success: false,
      error: 'Failed to fetch search history',
      searches: []
    };
  }
};

const userService = {
  getUserProfile,
  createUserProfile,
  updateUserProfile,
  needsProfileCompletion,
  addNotification,
  removeNotification,
  getPinnedCourses,
  pinCourse,
  unpinCourse,
  isBetaUser,
  getUserFirstName,
  saveSearchToHistory,
  getSearchHistory
};

export default userService;
