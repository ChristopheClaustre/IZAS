import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.3.1/firebase-app.js';
import { getDatabase, ref, push, set, get, onValue } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-database.js";
import * as utils from "./utils.js";
import { data as player } from "./player.js";
import { data as dbDefault } from "./dbDefault.js";

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

// Default values
export const defaultPegman = dbDefault.pegman;

// Keys
const partiesKey = "parties";
const resourcesKey = "resources";
const playersKey = "players";
const resistanceKey = "resistance";
const jobIDKey = "jobID";

// function utils
export function getPartiesRef(partyID)
{
  return ref(db, partiesKey + '/' + partyID);
}

export function createParty(createdCallback)
{
  push(ref(db, partiesKey + '/'), {pegman: defaultPegman, resources: dbDefault.resources}).then((snapshot) => {
    createdCallback(snapshot.key);
  }).catch((error) => {
    utils.throwError("Error when creating new party (" + error + ")");
  });
}

export function createPlayer(partyID, playerID, createdCallback)
{
  var playerData = dbDefault.player;
  var resistance = 1 + utils.getRandomInt(3);
  playerData.resistance.current = resistance;
  playerData.resistance.max = resistance;
  playerData.jobID = utils.getRandomInt(player.jobsList.length);
  
  set(ref(db, partiesKey + '/' + partyID + '/' + playersKey + '/' + playerID), playerData).then((snapshot) => {
    createdCallback();
  }).catch((error) => {
    utils.throwError("Error when creating new player (" + error + ")");
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

export function setResource(partyID, resource, newValue)
{
  var resourceRef = ref(db, partiesKey + '/' + partyID + '/' + resourcesKey + '/' + resource)
  set(resourceRef, newValue).catch((error) => {
    utils.throwError("Error when updating " + resource + " (" + error + ")");
  });
}

// @return { current, max }
export function displayResistance(partyID, playerID, changedCallback)
{
  onValue(ref(db, partiesKey + '/' + partyID + '/' + playersKey + '/' + playerID + '/' + resistanceKey ), (snapshot) => {
    if (! snapshot.exists()) utils.throwError("Party ID \"" + partyID + "\" or Player ID \"" + playerID + "\" does not exist.");
    const data = snapshot.val();
    changedCallback(data);
  });
}

// @return { job, description }
export function displayJob(partyID, playerID, changedCallback)
{
  onValue(ref(db, partiesKey + '/' + partyID + '/' + playersKey + '/' + playerID + '/' + jobIDKey), (snapshot) => {
    if (! snapshot.exists()) utils.throwError("Party ID \"" + partyID + "\" or Player ID \"" + playerID + "\" does not exist.");
    const data = player.jobsList[snapshot.val()];
    changedCallback(data);
  });
}

export function randomName()
{
  const id = utils.getRandomInt(player.namesList.length);
  return player.namesList[id];
}
