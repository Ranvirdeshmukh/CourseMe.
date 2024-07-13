// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth , GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyCrTUPBmknuLkugeD8bluXITOFMnT1X_Rw",
    authDomain: "coursereview-98a89.firebaseapp.com",
    projectId: "coursereview-98a89",
    storageBucket: "coursereview-98a89.appspot.com",
    messagingSenderId: "576097966597",
    appId: "1:576097966597:web:e91bc9301826551e411a6c",
    measurementId: "G-Y8T4V63ETY"
  };

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const googleProvider = new GoogleAuthProvider();
  
  export { auth, db, googleProvider };