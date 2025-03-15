import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyDeBAqbYbQSoDYruvYZ_cVdJ8dbfOTGRRE",
  authDomain: "vatelanka-e6828.firebaseapp.com",
  projectId: "vatelanka-e6828",
  storageBucket: "vatelanka-e6828.firebasestorage.app",
  messagingSenderId: "444350594980",
  appId: "1:444350594980:web:38660abe178b78750b4b31",
  measurementId: "G-0C4KQG6Q61",
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const firestore = getFirestore(app);

let initialized = false;

export const ensureInitialized = async () => {
  if (initialized) return true;

  try {
    await new Promise((resolve) => setTimeout(resolve, 300));
    initialized = true;
    return true;
  } catch (error) {
    console.error("Firebase initialization error:", error);
    return false;
  }
};
