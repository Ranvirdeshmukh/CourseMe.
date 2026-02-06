// src/services/reviewService.js
import { doc, getDoc, updateDoc, setDoc, arrayUnion, arrayRemove, collection, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Get course reviews
 */
export const getCourseReviews = async (courseId) => {
  try {
    const reviewDocRef = doc(db, 'reviews', courseId);
    const reviewDocSnap = await getDoc(reviewDocRef);
    
    if (reviewDocSnap.exists()) {
      return {
        success: true,
        reviews: reviewDocSnap.data()
      };
    } else {
      return {
        success: true,
        reviews: {}
      };
    }
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return {
      success: false,
      error: 'Failed to fetch reviews'
    };
  }
};

/**
 * Add a review to a course
 */
export const addReview = async (courseId, professor, review, userId, term) => {
  try {
    const reviewDocRef = doc(db, 'reviews', courseId);
    const reviewText = `review: "${term} with ${professor}: ${review}"`;
    
    // Add to course reviews
    await setDoc(reviewDocRef, {
      [professor]: arrayUnion(reviewText)
    }, { merge: true });
    
    // Add to user's reviews
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      reviews: arrayUnion({
        courseId,
        professor,
        review,
        term,
        timestamp: new Date().toISOString()
      })
    });
    
    return {
      success: true,
      message: 'Review added successfully'
    };
  } catch (error) {
    console.error('Error adding review:', error);
    return {
      success: false,
      error: 'Failed to add review'
    };
  }
};

/**
 * Delete a review
 */
export const deleteReview = async (courseId, professor, review, userId, term, timestamp) => {
  try {
    const reviewDocRef = doc(db, 'reviews', courseId);
    const reviewText = `review: "${term} with ${professor}: ${review}"`;
    
    // Get current course reviews
    const courseDocSnap = await getDoc(reviewDocRef);
    if (courseDocSnap.exists()) {
      const courseData = { ...courseDocSnap.data() };
      const updatedReviews = courseData[professor]?.filter(r => r !== reviewText) || [];
      
      if (updatedReviews.length === 0) {
        delete courseData[professor];
      } else {
        courseData[professor] = updatedReviews;
      }
      
      await setDoc(reviewDocRef, courseData);
    }
    
    // Remove from user's reviews - must match the exact object shape from addReview
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      reviews: arrayRemove({
        courseId,
        professor,
        review,
        term,
        timestamp // Include timestamp for exact match
      })
    });
    
    return {
      success: true,
      message: 'Review deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting review:', error);
    return {
      success: false,
      error: 'Failed to delete review'
    };
  }
};

/**
 * Add a reply to a review
 */
export const addReply = async (courseId, reviewId, replyText, userId) => {
  try {
    const repliesCollectionRef = collection(db, 'reviews', courseId, 'replies');
    const replyDocRef = doc(repliesCollectionRef, reviewId);
    
    await setDoc(replyDocRef, {
      replies: arrayUnion({
        text: replyText,
        userId,
        timestamp: new Date().toISOString()
      })
    }, { merge: true });
    
    // Add to user's replies
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      replies: arrayUnion({
        courseId,
        reviewId,
        reply: replyText,
        timestamp: new Date().toISOString()
      })
    });
    
    return {
      success: true,
      message: 'Reply added successfully'
    };
  } catch (error) {
    console.error('Error adding reply:', error);
    return {
      success: false,
      error: 'Failed to add reply'
    };
  }
};

/**
 * Delete a reply
 */
export const deleteReply = async (reply, userId) => {
  try {
    const { courseId, reviewData, timestamp } = reply;
    const sanitizedCourseId = courseId.split('_')[1];
    const sanitizedInstructor = reviewData.instructor.replace(/\./g, '_');
    
    const replyDocRef = doc(
      db,
      'reviews',
      sanitizedCourseId,
      `${sanitizedInstructor}_${reviewData.reviewIndex}_replies`,
      timestamp
    );

    // Delete the reply document
    await deleteDoc(replyDocRef);

    // Remove from user's replies
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      replies: arrayRemove(reply)
    });
    
    return {
      success: true,
      message: 'Reply deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting reply:', error);
    return {
      success: false,
      error: 'Failed to delete reply'
    };
  }
};

/**
 * Get user's reviews
 */
export const getUserReviews = async (userId) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);
    
    if (userDocSnap.exists()) {
      return {
        success: true,
        reviews: userDocSnap.data().reviews || []
      };
    }
    
    return {
      success: true,
      reviews: []
    };
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    return {
      success: false,
      error: 'Failed to fetch user reviews',
      reviews: []
    };
  }
};

/**
 * Get user's replies
 */
export const getUserReplies = async (userId) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);
    
    if (userDocSnap.exists()) {
      return {
        success: true,
        replies: userDocSnap.data().replies || []
      };
    }
    
    return {
      success: true,
      replies: []
    };
  } catch (error) {
    console.error('Error fetching user replies:', error);
    return {
      success: false,
      error: 'Failed to fetch user replies',
      replies: []
    };
  }
};

const reviewService = {
  getCourseReviews,
  addReview,
  deleteReview,
  addReply,
  deleteReply,
  getUserReviews,
  getUserReplies
};

export default reviewService;
