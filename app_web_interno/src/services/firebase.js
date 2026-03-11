import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
import { getAnalytics } from "firebase/analytics";
// https://firebase.google.com/docs/web/setup#available-libraries
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBlmQn2whfdRNFBv98h6vp0Qu_F_d2uscg",
    authDomain: "gestao-de-visitas-1.firebaseapp.com",
    projectId: "gestao-de-visitas-1",
    storageBucket: "gestao-de-visitas-1.firebasestorage.app",
    messagingSenderId: "226324484263",
    appId: "1:226324484263:web:bfee74daf1caa953428b82",
    measurementId: "G-9PEZW8HGGD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const auth = getAuth(app);
