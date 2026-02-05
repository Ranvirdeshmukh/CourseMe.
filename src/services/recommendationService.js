// src/services/recommendationService.js
import { collection, addDoc, getDocs, updateDoc, setDoc, doc, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Submit a course recommendation
 */
export const submitCourseRecommendation = async (courseName, department, userId, userName) => {
  try {
    // Create a URL-friendly ID
    const courseId = `${department.toUpperCase()}_${courseName.replace(/\s+/g, '_')}`;

    // Add to recommendations collection
    await addDoc(collection(db, 'course_recommendations'), {
      id: courseId,
      name: courseName,
      department: department.toUpperCase(),
      status: 'pending', // pending, approved, rejected
      submittedBy: {
        uid: userId,
        name: userName,
      },
      submittedAt: serverTimestamp(),
    });

    return {
      success: true,
      message: 'Course recommendation submitted successfully'
    };
  } catch (error) {
    console.error('Error submitting recommendation:', error);
    return {
      success: false,
      error: 'Failed to submit recommendation. Please try again.'
    };
  }
};

/**
 * Get course recommendations (with optional status filter)
 */
export const getCourseRecommendations = async (statusFilter = null) => {
  try {
    let recommendationsQuery;
    
    if (statusFilter) {
      recommendationsQuery = query(
        collection(db, 'course_recommendations'),
        where('status', '==', statusFilter),
        orderBy('submittedAt', 'desc')
      );
    } else {
      recommendationsQuery = query(
        collection(db, 'course_recommendations'),
        orderBy('submittedAt', 'desc')
      );
    }

    const snapshot = await getDocs(recommendationsQuery);
    const recommendations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return {
      success: true,
      recommendations
    };
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return {
      success: false,
      error: 'Failed to fetch recommendations',
      recommendations: []
    };
  }
};

/**
 * Approve a course recommendation and add it to hidden layups
 */
export const approveCourseRecommendation = async (recommendation) => {
  try {
    // Update recommendation status
    await updateDoc(doc(db, 'course_recommendations', recommendation.id), {
      status: 'approved',
      approvedAt: serverTimestamp()
    });

    // Add to hidden_layups collection
    await setDoc(doc(db, 'hidden_layups', recommendation.id), {
      yes_count: 0,
      no_count: 0
    });

    return {
      success: true,
      message: 'Course recommendation approved and added to hidden layups'
    };
  } catch (error) {
    console.error('Error approving recommendation:', error);
    return {
      success: false,
      error: 'Failed to approve recommendation'
    };
  }
};

/**
 * Reject a course recommendation
 */
export const rejectCourseRecommendation = async (recommendationId) => {
  try {
    await updateDoc(doc(db, 'course_recommendations', recommendationId), {
      status: 'rejected',
      rejectedAt: serverTimestamp()
    });

    return {
      success: true,
      message: 'Course recommendation rejected'
    };
  } catch (error) {
    console.error('Error rejecting recommendation:', error);
    return {
      success: false,
      error: 'Failed to reject recommendation'
    };
  }
};

const recommendationService = {
  submitCourseRecommendation,
  getCourseRecommendations,
  approveCourseRecommendation,
  rejectCourseRecommendation
};

export default recommendationService;
