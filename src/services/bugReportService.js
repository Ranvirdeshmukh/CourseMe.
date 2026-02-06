// src/services/bugReportService.js
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Submit a bug report
 */
export const submitBugReport = async (userId, userEmail, page, description) => {
  try {
    const bugReportsRef = collection(db, 'bug-reports');
    
    await addDoc(bugReportsRef, {
      userId,
      userEmail,
      page,
      description,
      timestamp: new Date().toISOString(),
      status: 'open'
    });
    
    return {
      success: true,
      message: 'Bug report submitted successfully. Thank you for your feedback!'
    };
  } catch (error) {
    console.error('Error submitting bug report:', error);
    return {
      success: false,
      error: 'Failed to submit bug report. Please try again.'
    };
  }
};

const bugReportService = {
  submitBugReport
};

export default bugReportService;
