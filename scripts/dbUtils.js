import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.3.1/firebase-app.js';
import { getDatabase, ref, push, set, get, onValue } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-database.js";
import * as utils from "./utils.js"

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
export var app;
export var db;

export function connectToDB()
{
  app = initializeApp(firebaseConfig);
  db = getDatabase();
}

// const value
export const defaultPegman = { lat: 43.604579144543436, lng : 1.443364389561114 }; // Toulouse, place du capitole
export const defaultResources = { confort : 0, foods : 0, heal : 0 };
const partiesKey = "parties"
const resourcesKey = "resources"

// function utils
export function getPartiesRef(partyID)
{
  return ref(db, partiesKey + '/' + partyID);
}

export function createParty(createdCallback)
{
  push(ref(db, partiesKey + '/'), {pegman: defaultPegman, resources: defaultResources}).then((snapshot) => {
    createdCallback(snapshot.key);
  }).catch((error) => {
    utils.throwError("Error when creating new party (" + error + ")");
  });
}

export function displayResources(partyID, resource, changedCallback)
{
  onValue(ref(db, partiesKey + '/' + partyID + '/' + resourcesKey + '/' + resource), (snapshot) => {
    if (! snapshot.exists()) utils.throwError("Party ID \"" + partyID + "\" does not exist.");
    const data = snapshot.val();
    changedCallback(data);
  });
}

export function incrResources(partyID, resource, add = +1)
{
  var resourceRef = ref(db, partiesKey + '/' + partyID + '/' + resourcesKey + '/' + resource)
  
  get(resourceRef).then((snapshot) => {
    if (! snapshot.exists()) utils.throwError("Error when updating " + resource + " (" + error + ")");
    const data = snapshot.val();
    set(resourceRef, data+add).catch((error) => {
      utils.throwError("Error when updating " + resource + " (" + error + ")");
    });
  }).catch((error) => {
    utils.throwError("Error when updating " + resource + " (" + error + ")");
  });
}

