import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBiOWDBs03kF4kaS9drvLoZK-EONoAC-GE",
  authDomain: "alertnest-2026.firebaseapp.com",
  projectId: "alertnest-2026",
  storageBucket: "alertnest-2026.firebasestorage.app",
  messagingSenderId: "848336898106",
  appId: "1:848336898106:web:ea5a2fe34e70df45b94d03"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
