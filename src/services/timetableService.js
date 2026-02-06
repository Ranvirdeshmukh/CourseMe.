// src/services/timetableService.js
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Get timetable request by ID
 */
export const getTimetableRequest = async (requestId) => {
  try {
    const timetableRequestRef = doc(db, 'timetable-requests', requestId);
    const timetableRequestDoc = await getDoc(timetableRequestRef);
    
    if (timetableRequestDoc.exists()) {
      return {
        success: true,
        data: timetableRequestDoc.data()
      };
    }
    
    return {
      success: false,
      error: 'Timetable request not found'
    };
  } catch (error) {
    console.error('Error fetching timetable request:', error);
    return {
      success: false,
      error: 'Failed to fetch timetable request'
    };
  }
};

/**
 * Remove user from timetable request
 */
export const removeUserFromTimetableRequest = async (requestId, userEmail) => {
  try {
    const timetableRequestRef = doc(db, 'timetable-requests', requestId);
    const timetableRequestDoc = await getDoc(timetableRequestRef);
    
    if (timetableRequestDoc.exists()) {
      const users = timetableRequestDoc.data().users || [];
      const updatedUsers = users.filter(user => user.email !== userEmail);
      
      if (updatedUsers.length === 0) {
        // If no users left, delete the document
        await deleteDoc(timetableRequestRef);
        return {
          success: true,
          message: 'Timetable request deleted (no users remaining)'
        };
      } else {
        // Update the users array
        await updateDoc(timetableRequestRef, {
          users: updatedUsers
        });
        return {
          success: true,
          message: 'User removed from timetable request'
        };
      }
    }
    
    return {
      success: false,
      error: 'Timetable request not found'
    };
  } catch (error) {
    console.error('Error removing user from timetable request:', error);
    return {
      success: false,
      error: 'Failed to remove user from timetable request'
    };
  }
};

/**
 * Get user's timetable notifications
 */
export const getUserTimetableNotifications = async (userId) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);
    
    if (userDocSnap.exists()) {
      return {
        success: true,
        notifications: userDocSnap.data().notifications || []
      };
    }
    
    return {
      success: true,
      notifications: []
    };
  } catch (error) {
    console.error('Error fetching timetable notifications:', error);
    return {
      success: false,
      error: 'Failed to fetch notifications',
      notifications: []
    };
  }
};

const timetableService = {
  getTimetableRequest,
  removeUserFromTimetableRequest,
  getUserTimetableNotifications
};

export default timetableService;
