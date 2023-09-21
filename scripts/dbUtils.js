import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.3.1/firebase-app.js';
import { getDatabase, ref, push, set, get, onValue, child } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-database.js";
import * as utils from "./utils.js";
import { data as player } from "./player.js";
import { data as defaultData } from "./default.js";

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

// Keys
const partiesKey = "parties";
const resourcesKey = "resources";
const pegmanKey = "pegman";
const playersKey = "players";
const resistanceKey = "resistance";
const jobIDKey = "jobID";

export class Firebase {
  
  /* Private Attributes */
  #app;
  #db;
  #partyRef;
  #partyIntegrityUnsubscriber;
  #connectingToParty = false;
  #playerRef;
  #playerIntegrityUnsubscriber;
  #connectingToPlayer = false;
  
  constructor() {
    this.app = initializeApp(firebaseConfig);
    this.db = getDatabase();
  }
  
  /* Data Creation */
  createParty(createdCallback)
  {
    push(ref(this.db, partiesKey + '/'), {pegman: defaultData.pegman, resources: defaultData.resources}).then((snapshot) => {
      createdCallback(snapshot.key);
    }).catch((error) => {
      utils.throwError("Error when creating new party (" + error + ")");
    });
  }
  createPlayer(_partyID, _playerID, createdCallback)
  {
    var playerData = defaultData.player;
    var resistance = 1 + utils.getRandomInt(3);
    playerData.resistance.current = resistance;
    playerData.resistance.max = resistance;
    playerData.jobID = utils.getRandomInt(player.jobsList.length);
    
    set(ref(this.db, partiesKey + '/' + _partyID + '/' + playersKey + '/' + _playerID), playerData).then((snapshot) => {
      createdCallback();
    }).catch((error) => {
      utils.throwError("Error when creating new player (" + error + ")");
    });
  }
  
  /* Party management */
  deconnectFromParty() {
    if (this.partyIntegrityUnsubscriber) this.partyIntegrityUnsubscriber(); // unsubscribe binded onValue (@see connectToParty)
    this.partyRef = undefined;
    this.connectingToParty = false;
  }
  isConnectedToParty() { return !!this.partyRef; } // is partyRef valid ?
  connectToParty(_partyID) {
    this.deconnectFromParty();
    this.connectingToParty = true;
    
    this.partyIntegrityUnsubscriber = onValue(
      ref(this.db, partiesKey),
      (snapshot) => {
        this.partyRef = undefined;
        if (! snapshot.exists()) { utils.throwError("Party '" + _partyID + "' doesn't exist anymore."); return; }
        var found = false;
        snapshot.forEach(child => found = found || child.key == _partyID);
        if (found) {
          this.partyRef = ref(this.db, partiesKey + '/' + _partyID);
          this.connectingToParty = false;
        }
        else {
          utils.throwError("Party '" + _partyID + "' doesn't exist anymore.");
        }
      },
      { shallow:true } // Get only children keys
    );
  }
  
  /* Player management */
  deconnectFromPlayer() {
    if (this.playerIntegrityUnsubscriber) this.playerIntegrityUnsubscriber(); // unsubscribe binded onValue (@see connectToPlayer)
    this.playerRef = undefined;
    this.connectingToPlayer = false;
  }
  isConnectedToPlayer() { return !!this.playerRef; } // is playerRef valid ?
  async connectToPlayer(_playerID, bCreate = false) {
    this.deconnectFromPlayer();
    this.connectingToPlayer = true;
    
    while (this.connectingToParty) { await new Promise(resolve => setTimeout(resolve, 500)); }
    if (! this.isConnectedToParty()) return false;
    
    var bCreated = false;
    
    this.playerIntegrityUnsubscriber = onValue(
      child(this.partyRef, playersKey),
      (snapshot) => {
        if (! snapshot.exists()) { utils.throwError("Error while retrieving players of party ID '" + _playerID + "'."); return; }
        var found = false;
        snapshot.forEach(child => found = found || child.key == _playerID);
        if (found) {
          this.playerRef = child(this.partyRef, playersKey + "/" + _playerID);
          this.connectingToPlayer = false;
        }
        else if (bCreate && ! bCreated)
        {
          this.createPlayer(this.partyRef.key, _playerID, () => {});
          bCreated = true;
        }
        else
        {
          utils.throwError("Player '" + _playerID + "' doesn't exist anymore.");
        }
      },
      { shallow:true } // Get only children keys
    );
    
    return true;
  }
  
  /* Bound - party */
  // @return int
  async bindToResource(resourceName, changedCallback)
  {
    while (this.connectingToParty) { await new Promise(resolve => setTimeout(resolve, 500)); }
    if (! this.isConnectedToParty()) return undefined;
    
    return onValue(child(this.partyRef, resourcesKey + '/' + resourceName), (snapshot) => {
      if (! snapshot.exists()) console.log("Error while retrieving resource '" + resourceName + "'.");
      const data = snapshot.val();
      changedCallback(data);
    });
  }
  // @return { lat:number, lng:number }
  async bindToPegman(changedCallback)
  {
    while (this.connectingToParty) { await new Promise(resolve => setTimeout(resolve, 500)); }
    if (! this.isConnectedToParty()) return undefined;
    
    onValue(child(this.partyRef, pegmanKey), (snapshot) => {
      if (! snapshot.exists()) { console.log("Error while retrieving pegman from party '" + this.partyRef.key + "'."); return; }
      const data = snapshot.val();
      changedCallback(data);
    });
  }
  // @return list of all players names
  async bindToPlayerNames(changedCallback)
  {
    while (this.connectingToParty) { await new Promise(resolve => setTimeout(resolve, 500)); }
    if (! this.isConnectedToParty()) return undefined;
    
    onValue(child(this.partyRef, playersKey), (snapshot) => {
        if (! snapshot.exists()) { changedCallback([]); return; }
        var players = [];
        snapshot.forEach(child => { players.push(child.key) });
        changedCallback(players);
      },
      { shallow:true }
    );
  }
  // @return list of all players
  async bindToPlayers(changedCallback)
  {
    while (this.connectingToParty) { await new Promise(resolve => setTimeout(resolve, 500)); }
    if (! this.isConnectedToParty()) return undefined;
    
    onValue(child(this.partyRef, playersKey), (snapshot) => {
      if (! snapshot.exists()) { changedCallback({}); return; }
      changedCallback(snapshot.val());
    });
  }
  
  /* Bound - player */
  // @return { current:int, max:int }
  async bindToResistance(changedCallback)
  {
    while (this.connectingToPlayer) { await new Promise(resolve => setTimeout(resolve, 500)); }
    if (! this.isConnectedToPlayer()) return undefined;

    return onValue(child(this.playerRef, resistanceKey), (snapshot) => {
      if (! snapshot.exists()) { console.log("Error while retrieving resistance from player '" + this.playerRef.key + "'."); return; }
      const data = snapshot.val();
      changedCallback(data);
    });
  }
  // @return { job:string, description:string }
  async bindToJob(changedCallback)
  {
    while (this.connectingToPlayer) { await new Promise(resolve => setTimeout(resolve, 500)); }
    if (! this.isConnectedToPlayer()) return undefined;

    return onValue(child(this.playerRef, jobIDKey), (snapshot) => {
      if (! snapshot.exists()) { console.log("Error while retrieving jobID from player '" + this.playerRef.key + "'."); return; }
      const data = player.jobsList[snapshot.val()];
      changedCallback(data);
    });
  }

  /* Getter - party */
  getPlayer(playerID, getCallback)
  {
    get(child(this.partyRef, playersKey + '/' + playerID)).then((snapshot) => {
      if (! snapshot.exists()) { console.log("Error when retrieving player \"" + playerID + "\"."); return; }
      const data = snapshot.val();
      getCallback(data);
    }).catch((error) => {
      utils.throwError("Error when retrieving player '" + playerID + "' from party '" + partyID + "' (" + error + ")");
    });
  }
  
  /* Setter - party */
  setResource(resourceName, newValue)
  {
    if (! this.isConnectedToParty()) return;
    set(child(this.partyRef, resourcesKey + '/' + resourceName), newValue).catch((error) => {
      utils.throwError("Error when updating " + resourceName + " (" + error + ")");
    });
  }
  setPegman(newValue)
  {
    if (! this.isConnectedToParty()) return;
    set(child(this.partyRef, pegmanKey), newValue).catch((error) => {
      utils.throwError("Error when updating pegman (" + error + ")");
    });
  }
  setPlayerAttribute(playerID, attributeName, newValue)
  {
    if (! this.isConnectedToParty()) return;
    set(child(this.partyRef, playersKey + '/' + playerID + '/' + attributeName), newValue).catch((error) => {
      utils.throwError("Error when updating " + attributeName + " for player \"" + playerID + "\" (" + error + ")");
    });
  }
}
