import React, { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, Award, Sparkles } from 'lucide-react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';

const VotingCard = ({ 
  type, 
  score, 
  onUpvote, 
  onDownvote, 
  userVote
}) => {
  return (
    <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-3 justify-center">
        {type === 'quality' ? (
          <Award className="w-5 h-5 text-indigo-600" />
        ) : (
          <Sparkles className="w-5 h-5 text-indigo-600" />
        )}
        <span className="text-sm font-medium text-gray-900">
          {type === 'quality' ? 'Course Quality' : 'Layup Rating'}
        </span>
      </div>
      
      <div className="text-2xl font-bold text-indigo-600 mb-4 text-center">
        {score}
      </div>
      
      <div className="flex justify-center gap-2">
        <button
          onClick={onUpvote}
          className={`p-2 rounded-lg transition-colors ${
            userVote === 'upvote'
              ? 'bg-green-100 text-green-700'
              : 'hover:bg-gray-100 text-gray-600'
          }`}
        >
          <ThumbsUp className="w-5 h-5" />
        </button>
        <button
          onClick={onDownvote}
          className={`p-2 rounded-lg transition-colors ${
            userVote === 'downvote'
              ? 'bg-red-100 text-red-700'
              : 'hover:bg-gray-100 text-gray-600'
          }`}
        >
          <ThumbsDown className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

const CourseVoting = ({ course, courseId, currentUser }) => {
  const [qualityVote, setQualityVote] = useState(null);
  const [layupVote, setLayupVote] = useState(null);
  const [qualityScore, setQualityScore] = useState(course?.quality || 0);
  const [layupScore, setLayupScore] = useState(course?.layup || 0);

  useEffect(() => {
    const fetchUserVotes = async () => {
      if (!currentUser) return;
      
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        setQualityVote(userData.quality?.[courseId] || null);
        setLayupVote(userData.layup?.[courseId] || null);
      }
    };

    fetchUserVotes();
  }, [currentUser, courseId]);

  const handleQualityVote = async (voteType) => {
    if (!course || !currentUser) return;

    const userDocRef = doc(db, 'users', currentUser.uid);
    const courseRef = doc(db, 'courses', courseId);
    let newQuality = qualityScore;

    try {
      const userDocSnap = await getDoc(userDocRef);
      const userData = userDocSnap.exists() ? userDocSnap.data() : {};
      const currentQualityMap = userData.quality || {};

      if (qualityVote === voteType) {
        // Removing vote
        newQuality = voteType === 'upvote' ? newQuality - 1 : newQuality + 1;
        delete currentQualityMap[courseId];
      } else {
        // Changing or adding vote
        if (qualityVote === 'upvote') {
          newQuality -= 1;
        } else if (qualityVote === 'downvote') {
          newQuality += 1;
        }
        newQuality = voteType === 'upvote' ? newQuality + 1 : newQuality - 1;
        currentQualityMap[courseId] = voteType;
      }

      // Update user's quality votes map
      await setDoc(userDocRef, { 
        quality: currentQualityMap 
      }, { merge: true });

      // Update course quality score
      await updateDoc(courseRef, { quality: newQuality });

      setQualityScore(newQuality);
      setQualityVote(qualityVote === voteType ? null : voteType);
    } catch (error) {
      console.error('Error updating quality vote:', error);
    }
  };

  const handleLayupVote = async (voteType) => {
    if (!course || !currentUser) return;

    const userDocRef = doc(db, 'users', currentUser.uid);
    const courseRef = doc(db, 'courses', courseId);
    let newLayup = layupScore;

    try {
      const userDocSnap = await getDoc(userDocRef);
      const userData = userDocSnap.exists() ? userDocSnap.data() : {};
      const currentLayupMap = userData.layup || {};

      if (layupVote === voteType) {
        // Removing vote
        newLayup = voteType === 'upvote' ? newLayup - 1 : newLayup + 1;
        delete currentLayupMap[courseId];
      } else {
        // Changing or adding vote
        if (layupVote === 'upvote') {
          newLayup -= 1;
        } else if (layupVote === 'downvote') {
          newLayup += 1;
        }
        newLayup = voteType === 'upvote' ? newLayup + 1 : newLayup - 1;
        currentLayupMap[courseId] = voteType;
      }

      // Update user's layup votes map
      await setDoc(userDocRef, { 
        layup: currentLayupMap 
      }, { merge: true });

      // Update course layup score
      await updateDoc(courseRef, { layup: newLayup });

      setLayupScore(newLayup);
      setLayupVote(layupVote === voteType ? null : voteType);
    } catch (error) {
      console.error('Error updating layup vote:', error);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <VotingCard
        type="layup"
        score={layupScore}
        onUpvote={() => handleLayupVote('upvote')}
        onDownvote={() => handleLayupVote('downvote')}
        userVote={layupVote}
      />
      <VotingCard
        type="quality"
        score={qualityScore}
        onUpvote={() => handleQualityVote('upvote')}
        onDownvote={() => handleQualityVote('downvote')}
        userVote={qualityVote}
      />
    </div>
  );
};

export default CourseVoting;