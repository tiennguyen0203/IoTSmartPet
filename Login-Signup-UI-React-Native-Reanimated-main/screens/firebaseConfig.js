// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth, createUserWithEmailAndPassword, getReactNativePersistence } from "firebase/auth";
import { getDatabase, ref, onValue } from "firebase/database";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyAsZdBjJGYXvPgo2SRFEaUweYMvU7GdZ4g",
  authDomain: "iotpet-abc5e.firebaseapp.com",
  databaseURL: "https://iotpet-abc5e-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "iotpet-abc5e",
  storageBucket: "iotpet-abc5e.appspot.com",
  messagingSenderId: "15030841240",
  appId: "1:15030841240:web:c6f45aa847d845501345ed",
  measurementId: "G-YSFFMJ3T3T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

const auth = getAuth(app);
const database = getDatabase(app);

export { auth, database }

// // Your signup function
// const handleSignUp = async (email, password) => {
//   try {
//     const userCredential = await createUserWithEmailAndPassword(auth, email, password);
//     const user = userCredential.user;

//     // Additional data to store in the Firestore users collection
//     const userData = {
//       id: user.uid,
//       email,
//     };

//     // Access the 'users' collection in Firestore
//     const usersCollection = collection(database, 'users');
    
//     // Create a new document with the user's UID as the document ID
//     const userDoc = doc(usersCollection, user.uid);

//     // Set the user data in the Firestore document
//     await set(userDoc, userData);

//     // Additional actions after successful signup
//     console.log("User signed up successfully:", user);
//   } catch (error) {
//     // Handle signup error
//     console.error("Error signing up:", error.code, error.message);
//   }
// };
