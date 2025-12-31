// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

// Detect if we're using test environment
const isTestEnvironment = 
    process.env.REACT_APP_FIREBASE_ENV === 'test' || 
    process.env.REACT_APP_FIREBASE_PROJECT_ID === 'courseme-test';

// Log environment info in development
if (process.env.NODE_ENV === 'development') {
    const envLabel = isTestEnvironment ? '🧪 TEST' : '🔴 PRODUCTION';
    console.log(`%c Firebase Environment: ${envLabel}`, 
        `color: ${isTestEnvironment ? 'green' : 'red'}; font-weight: bold; font-size: 14px;`);
    console.log(`   Project ID: ${firebaseConfig.projectId}`);
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { auth, db, googleProvider, isTestEnvironment };
