// src/services/authService.js
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  sendPasswordResetEmail,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

/**
 * Sign in with email and password
 */
export const signInWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return {
      success: true,
      user: userCredential.user
    };
  } catch (error) {
    console.error('Sign in error:', error);
    return {
      success: false,
      error: error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found'
        ? 'Invalid email or password'
        : 'Failed to sign in'
    };
  }
};

/**
 * Sign in with Google
 */
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return {
      success: true,
      user: result.user
    };
  } catch (error) {
    console.error('Google sign in error:', error);
    return {
      success: false,
      error: 'Failed to sign in with Google'
    };
  }
};

/**
 * Create a new user with email and password
 */
export const signUpWithEmail = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return {
      success: true,
      user: userCredential.user
    };
  } catch (error) {
    console.error('Sign up error:', error);
    let errorMessage = 'Failed to create an account';
    
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'This email is already in use. Please try logging in.';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password should be at least 6 characters.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address.';
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

/**
 * Send password reset email
 */
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return {
      success: true,
      message: 'Password reset email sent successfully'
    };
  } catch (error) {
    console.error('Password reset error:', error);
    return {
      success: false,
      error: 'Failed to send password reset email'
    };
  }
};

/**
 * Sign out the current user
 */
export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
    return {
      success: true
    };
  } catch (error) {
    console.error('Sign out error:', error);
    return {
      success: false,
      error: 'Failed to sign out'
    };
  }
};

/**
 * Validate Dartmouth email
 */
export const validateDartmouthEmail = (email) => {
  return email.endsWith('@dartmouth.edu');
};

const authService = {
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
  resetPassword,
  signOut,
  validateDartmouthEmail
};

export default authService;
