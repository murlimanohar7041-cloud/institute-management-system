import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyCd4GS5C80w0ePQLPRSzlEmELFNStB0nZM",
  authDomain: "j-solution-classes.firebaseapp.com",
  projectId: "j-solution-classes",
  storageBucket: "j-solution-classes.firebasestorage.app",
  messagingSenderId: "254892807462",
  appId: "1:254892807462:web:41ea0f492cf1e4aa8fdde7",
  measurementId: "G-GRD2SYNYV9"
};

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)