// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from 'firebase/auth';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDI90tI7b1kbqtFlijuUUR4kCNWhL07wTM",
  authDomain: "bankiq-8c76a.firebaseapp.com",
  projectId: "bankiq-8c76a",
  storageBucket: "bankiq-8c76a.firebasestorage.app",
  messagingSenderId: "567466155004",
  appId: "1:567466155004:web:a1d3fa4bcc38a643687079",
  measurementId: "G-8HECWPVHPY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export default app;