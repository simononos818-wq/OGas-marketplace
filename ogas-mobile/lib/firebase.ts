import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCZ2hG6P0G0h8X7Y9Z1Q2W3E4R5T6Y7U8I9O0P",
  authDomain: "ogasapp-5a003.firebaseapp.com",
  projectId: "ogasapp-5a003",
  storageBucket: "ogasapp-5a003.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef1234567890"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
