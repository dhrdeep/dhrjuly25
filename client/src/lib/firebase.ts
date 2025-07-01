import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, OAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Providers
const googleProvider = new GoogleAuthProvider();
const appleProvider = new OAuthProvider('apple.com');

// Enhanced Google provider with additional scopes
googleProvider.addScope('email');
googleProvider.addScope('profile');

// Apple provider configuration
appleProvider.addScope('email');
appleProvider.addScope('name');

export const authMethods = {
  // Google Sign In
  signInWithGoogle: () => signInWithPopup(auth, googleProvider),
  
  // Apple Sign In
  signInWithApple: () => signInWithPopup(auth, appleProvider),
  
  // Email/Password Sign In
  signInWithEmail: (email: string, password: string) => 
    signInWithEmailAndPassword(auth, email, password),
  
  // Email/Password Sign Up
  signUpWithEmail: (email: string, password: string) => 
    createUserWithEmailAndPassword(auth, email, password),
  
  // Sign Out
  signOut: () => signOut(auth),
  
  // Auth State Observer
  onAuthStateChanged: (callback: (user: User | null) => void) => 
    onAuthStateChanged(auth, callback)
};

export default auth;