// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const demoFirebaseConfig = {
  apiKey: "AIzaSyAe_unb-BtDm8ofGI9CtXpByyqc89m5Nw4",
  authDomain: "j-solution-demo.firebaseapp.com",
  projectId: "j-solution-demo",
  storageBucket: "j-solution-demo.firebasestorage.app",
  messagingSenderId: "52832099394",
  appId: "1:52832099394:web:71412b40f105edd614a1db",
  measurementId: "G-JDRFCZ34FB"
};

// Initialize Firebase
const demoApp = initializeApp(demoFirebaseConfig, "demoApp");

export const demoAuth = getAuth(demoApp);
export const demoDb = getFirestore(demoApp);