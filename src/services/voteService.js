// src/services/voteService.js
import { doc, getDoc, setDoc, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Get vote counts for a course/item
 */
export const getVoteCounts = async (collectionName, itemId) => {
  try {
    const docRef = doc(db, collectionName, itemId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        success: true,
        yes_count: data.yes_count || 0,
        no_count: data.no_count || 0
      };
    } else {
      return {
        success: true,
        yes_count: 0,
        no_count: 0
      };
    }
  } catch (error) {
    console.error('Error fetching vote counts:', error);
    return {
      success: false,
      error: 'Failed to fetch vote counts'
    };
  }
};

/**
 * Get user's vote for a specific item
 */
export const getUserVote = async (userId, collectionName, itemId) => {
  try {
    const userVoteDocRef = doc(db, 'user_votes', userId, collectionName, itemId);
    const userVoteDocSnap = await getDoc(userVoteDocRef);
    
    if (userVoteDocSnap.exists()) {
      return {
        success: true,
        vote: userVoteDocSnap.data().vote // 'yes', 'no', or null
      };
    }
    
    return {
      success: true,
      vote: null
    };
  } catch (error) {
    console.error('Error fetching user vote:', error);
    return {
      success: false,
      error: 'Failed to fetch user vote',
      vote: null
    };
  }
};

/**
 * Cast or update a vote
 */
export const castVote = async (userId, collectionName, itemId, voteValue) => {
  try {
    const itemDocRef = doc(db, collectionName, itemId);
    const userVoteDocRef = doc(db, 'user_votes', userId, collectionName, itemId);
    
    await runTransaction(db, async (transaction) => {
      const itemDoc = await transaction.get(itemDocRef);
      const userVoteDoc = await transaction.get(userVoteDocRef);
      
      // Initialize counts if document doesn't exist
      let yes_count = 0;
      let no_count = 0;
      
      if (itemDoc.exists()) {
        yes_count = itemDoc.data().yes_count || 0;
        no_count = itemDoc.data().no_count || 0;
      }
      
      // Get previous vote if exists
      const previousVote = userVoteDoc.exists() ? userVoteDoc.data().vote : null;
      
      // Adjust counts based on vote change
      if (previousVote === 'yes') yes_count--;
      if (previousVote === 'no') no_count--;
      
      if (voteValue === 'yes') yes_count++;
      if (voteValue === 'no') no_count++;
      
      // Update item vote counts
      transaction.set(itemDocRef, {
        yes_count: Math.max(0, yes_count),
        no_count: Math.max(0, no_count)
      }, { merge: true });
      
      // Update user's vote
      if (voteValue === null) {
        // Remove vote if null
        if (userVoteDoc.exists()) {
          transaction.delete(userVoteDocRef);
        }
      } else {
        transaction.set(userVoteDocRef, {
          vote: voteValue,
          timestamp: new Date().toISOString()
        });
      }
    });
    
    return {
      success: true,
      message: 'Vote recorded successfully'
    };
  } catch (error) {
    console.error('Error casting vote:', error);
    return {
      success: false,
      error: 'Failed to record vote'
    };
  }
};

/**
 * Remove a vote
 */
export const removeVote = async (userId, collectionName, itemId) => {
  return castVote(userId, collectionName, itemId, null);
};

/**
 * Get multiple votes for a user (bulk operation)
 */
export const getUserVotes = async (userId, collectionName, itemIds) => {
  try {
    const votes = {};
    
    await Promise.all(
      itemIds.map(async (itemId) => {
        const result = await getUserVote(userId, collectionName, itemId);
        if (result.success) {
          votes[itemId] = result.vote;
        }
      })
    );
    
    return {
      success: true,
      votes
    };
  } catch (error) {
    console.error('Error fetching user votes:', error);
    return {
      success: false,
      error: 'Failed to fetch user votes',
      votes: {}
    };
  }
};

/**
 * Calculate approval percentage
 */
export const calculateApprovalPercentage = (yes_count, no_count) => {
  const total = yes_count + no_count;
  return total > 0 ? (yes_count / total) * 100 : 50;
};

/**
 * Ensure vote document exists (initialize with 0 counts)
 */
export const ensureVoteDocumentExists = async (collectionName, itemId) => {
  try {
    const docRef = doc(db, collectionName, itemId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      await setDoc(docRef, {
        yes_count: 0,
        no_count: 0
      });
      return {
        success: true,
        message: 'Vote document initialized'
      };
    }
    
    return {
      success: true,
      message: 'Vote document already exists'
    };
  } catch (error) {
    console.error('Error ensuring vote document:', error);
    return {
      success: false,
      error: 'Failed to initialize vote document'
    };
  }
};

const voteService = {
  getVoteCounts,
  getUserVote,
  castVote,
  removeVote,
  getUserVotes,
  calculateApprovalPercentage,
  ensureVoteDocumentExists
};

export default voteService;
