// src/services/notificationService.js
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  arrayUnion, 
  setDoc,
  deleteDoc
} from 'firebase/firestore';

export const setNotification = async (db, course, currentUser, priority = 'standard', isPriorityEligible = false) => {
  if (!currentUser || !course) {
    return {
      success: false,
      message: 'Missing required information'
    };
  }
  
  try {
    const formattedNumber = course.num.includes('.') 
      ? course.num 
      : course.num.padStart(3, '0');
    const formattedSection = course.sec.padStart(2, '0');
    
    // Set priority count based on selection
    const isPriority = priority === 'priority';
    
    // Check if user is eligible for priority if they selected it
    if (isPriority && !isPriorityEligible) {
      return {
        success: false,
        message: 'You need at least 3 reviews to use priority notifications.'
      };
    }
    
    const priorityCount = isPriority ? 1 : 2;
    
    const timetableRequestsRef = collection(db, 'timetable-requests');
    const q = query(
      timetableRequestsRef,
      where("department", "==", course.subj),
      where("number", "==", formattedNumber),
      where("section", "==", formattedSection)
    );

    const querySnapshot = await getDocs(q);
    let timetableRequestId;
    
    if (!querySnapshot.empty) {
      // Document exists, check if user is already in the array
      const docRef = doc(db, 'timetable-requests', querySnapshot.docs[0].id);
      timetableRequestId = querySnapshot.docs[0].id;
      const docData = querySnapshot.docs[0].data();
      const users = docData.users || [];
      
      const userExists = users.some(user => user.email === currentUser.email);
      
      if (!userExists) {
        // User not in array, add them with priority count
        await updateDoc(docRef, {
          users: arrayUnion({
            email: currentUser.email,
            open: false,
            priorityCount: priorityCount
          })
        });
        
        // Add to user's notifications array
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        const newNotification = {
          requestId: timetableRequestId,
          department: course.subj,
          number: formattedNumber,
          section: formattedSection,
          priority: isPriority
        };

        if (!userDoc.exists()) {
          await setDoc(userRef, { notifications: [newNotification] });
        } else {
          await updateDoc(userRef, { notifications: arrayUnion(newNotification) });
        }
        
        return {
          success: true,
          message: isPriority
            ? "Priority notification set! You'll be among the first to know when a spot opens."
            : "Thank you, you will be notified if someone drops the class."
        };
      } else {
        return {
          success: false,
          message: 'You are already on the notification list for this course.'
        };
      }
    } else {
      // Create new document
      const newDocRef = doc(timetableRequestsRef);
      timetableRequestId = newDocRef.id;
      
      await setDoc(newDocRef, {
        department: course.subj,
        number: formattedNumber,
        section: formattedSection,
        users: [{
          email: currentUser.email,
          open: false,
          priorityCount: priorityCount
        }]
      });

      // Add to user's notifications
      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      const newNotification = {
        requestId: timetableRequestId,
        department: course.subj,
        number: formattedNumber,
        section: formattedSection,
        priority: isPriority
      };

      if (!userDoc.exists()) {
        await setDoc(userRef, { notifications: [newNotification] });
      } else {
        await updateDoc(userRef, { notifications: arrayUnion(newNotification) });
      }
      
      return {
        success: true,
        message: isPriority
          ? "Priority notification set! You'll be among the first to know when a spot opens."
          : "Thank you, you will be notified if someone drops the class."
      };
    }
  } catch (error) {
    console.error('Error setting up drop notification:', error);
    return {
      success: false,
      message: 'Failed to set up drop notification. Please try again.',
      error
    };
  }
};

export const removeNotification = async (db, course, currentUser) => {
  if (!currentUser || !course) {
    return {
      success: false,
      message: 'Missing required information'
    };
  }
  
  try {
    const formattedNumber = course.num.includes('.') 
      ? course.num 
      : course.num.padStart(3, '0');
    const formattedSection = course.sec.padStart(2, '0');
    
    // Find the timetable request document
    const timetableRequestsRef = collection(db, 'timetable-requests');
    const q = query(
      timetableRequestsRef,
      where("department", "==", course.subj),
      where("number", "==", formattedNumber),
      where("section", "==", formattedSection)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const docRef = doc(db, 'timetable-requests', querySnapshot.docs[0].id);
      const docData = querySnapshot.docs[0].data();
      
      // Filter out this user from the users array
      const updatedUsers = (docData.users || []).filter(user => user.email !== currentUser.email);
      
      if (updatedUsers.length > 0) {
        await updateDoc(docRef, { users: updatedUsers });
      } else {
        await deleteDoc(docRef);
      }
      
      // Remove from user's notifications array
      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists() && userDoc.data().notifications) {
        const notifications = userDoc.data().notifications || [];
        const updatedNotifications = notifications.filter(
          notification => 
            !(notification.department === course.subj && 
              notification.number === formattedNumber && 
              notification.section === formattedSection)
        );
        
        await updateDoc(userRef, { notifications: updatedNotifications });
      }
      
      return {
        success: true,
        message: "Notification removed successfully"
      };
    } else {
      return {
        success: false,
        message: "Could not find notification to remove"
      };
    }
  } catch (error) {
    console.error('Error removing notification:', error);
    return {
      success: false,
      message: 'Failed to remove notification. Please try again.',
      error
    };
  }
};

// src/services/notificationService.js (continued)
export const fetchUserNotificationsAndUpdateCourses = async (db, currentUser, courses) => {
  if (!currentUser || !courses || courses.length === 0) {
    return null;
  }
  
  try {
    const userRef = doc(db, 'users', currentUser.uid);
    const userDoc = await getDoc(userRef);
    
    // Create a Set of notification identifiers for faster lookups
    const notificationSet = new Set();
    const priorityNotifications = new Map();
    
    if (userDoc.exists()) {
      const notifications = userDoc.data().notifications || [];
      
      notifications.forEach(notification => {
        const key = `${notification.department}|${notification.number}|${notification.section}`;
        notificationSet.add(key);
        
        // Track if this is a priority notification
        if (notification.priority) {
          priorityNotifications.set(key, true);
        }
      });
    }
    
    // Update courses with notification status
    if (courses && courses.length > 0) {
      const updatedCourses = courses.map(course => {
        const formattedNumber = course.num?.includes('.') 
          ? course.num 
          : course.num?.padStart(3, '0');
        const formattedSection = course.sec?.padStart(2, '0');
        
        // Check if this course is in the notification set
        const courseKey = `${course.subj}|${formattedNumber}|${formattedSection}`;
        const isNotified = notificationSet.has(courseKey);
        const isPriorityNotification = priorityNotifications.has(courseKey);
        
        return { 
          ...course, 
          isNotified: Boolean(isNotified),
          notificationPriority: isNotified ? (isPriorityNotification ? 'priority' : 'standard') : null
        };
      });
      
      return updatedCourses;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching user notifications:', error);
    return null;
  }
};

export const checkPriorityEligibility = async (db, currentUser) => {
  if (!currentUser) return false;
  
  try {
    const userRef = doc(db, 'users', currentUser.uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const reviews = userData.reviews || [];
      
      // Check if user is eligible for priority notifications (3+ reviews)
      return reviews.length >= 3;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking priority eligibility:', error);
    return false;
  }
};

export default {
  setNotification,
  removeNotification,
  fetchUserNotificationsAndUpdateCourses,
  checkPriorityEligibility
};