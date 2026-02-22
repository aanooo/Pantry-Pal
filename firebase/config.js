import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const isConfigValid =
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.authDomain;

if (typeof window !== 'undefined' && !isConfigValid) {
  console.error(
    'Firebase config is missing. Copy .env.example to .env.local and add your Firebase project values from Firebase Console → Project settings → Your apps.'
  );
}

let app;
let db;
let storage;
let auth;

try {
  if (isConfigValid) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    storage = getStorage(app);
    auth = getAuth(app);
  }

  // Set persistence for auth and Firestore when in browser and config is valid
  if (typeof window !== 'undefined' && auth && db) {
    setPersistence(auth, browserLocalPersistence).catch((error) => {
      console.warn('Auth persistence error:', error);
    });
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('Multiple tabs open, persistence enabled in first tab only.');
      } else if (err.code === 'unimplemented') {
        console.warn('Browser does not support offline persistence');
      }
    });
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
}

export { db, storage, auth };
export default app;
