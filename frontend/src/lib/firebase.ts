import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAkduX39dqwJ3wEAvChpeOIeVf9CB7yJu4",
  authDomain: "cricket-turf-booking-537ca.firebaseapp.com",
  projectId: "cricket-turf-booking-537ca",
  storageBucket: "cricket-turf-booking-537ca.firebasestorage.app",
  messagingSenderId: "1098045260872",
  appId: "1:1098045260872:web:dfbf1765cb4ff675f1c47d",
  measurementId: "G-61GF9X079Q"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth };