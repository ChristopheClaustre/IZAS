import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.3.1/firebase-app.js';
import { getDatabase, ref, push } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-database.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAPa6Nd30O1YrC8K1HIB052dZ6KCkyUFcA",
  authDomain: "izas-398321.firebaseapp.com",
  databaseURL: "https://izas-398321-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "izas-398321",
  storageBucket: "izas-398321.appspot.com",
  messagingSenderId: "119715811198",
  appId: "1:119715811198:web:a187efcf590e6f62f8ed2f"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getDatabase();

// const value
export const defaultPegman = { lat: 43.604579144543436, lng : 1.443364389561114 }; // Toulouse, place du capitole
const partiesKey = "parties"

// function utils
export function getPartiesRef(partyID)
{
  return ref(db, partiesKey + '/' + partyID);
}

export function createParty()
{
  return push(ref(db, partiesKey + '/'));
}
