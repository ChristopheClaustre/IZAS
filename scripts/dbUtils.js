import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.3.1/firebase-app.js';
import { getDatabase, ref, push, set, get, onValue, child, query, orderByChild, remove, increment } from 'https://www.gstatic.com/firebasejs/10.3.1/firebase-database.js';
import * as utils from "./utils.js";
import { data as playerData } from "./player.js";
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
const cPartiesKey = "parties";
const cResourcesKey = "resources";
const cOptionsKey = "options";
const cPegmanKey = "pegman";
const cNotesKey = "notes";
const cDiceKey = "diceHistory";
const cTimestampKey = "timestamp";
const cPlayersKey = "players";
const cResistanceKey = "resistance";
const cSanityKey = "sanity";
const cJobIDKey = "jobID";

export class Firebase {
    _app;
    _db;
    
    parties = {};
    
    constructor() {
        this._app = initializeApp(firebaseConfig);
        this._db = getDatabase();
    }
    
    #internalCreateParty(createdCallback)
    {
        push(ref(this._db, cPartiesKey + '/'), {pegman: defaultData.pegman, resources: defaultData.resources, timestamp: Date.now(), notes: "", players: {}}).then((snapshot) => {
            createdCallback(snapshot.key);
        }).catch((error) => {
            throw new Error("Error when creating new party ({0})".format(error));
        });
    }
    createParty(createdCallback)
    {
        var q = query(ref(this._db, cPartiesKey), orderByChild(cTimestampKey));
        get(q).then((snapshot) => {
            if (! snapshot.exists()) { console.log("Error when retrieving parties."); return; }
            // Retrieve parties
            const partiesData = snapshot.val();
            var cPartiesKeys = Object.keys(partiesData);
            var partiesCount = cPartiesKeys.length;
            var i = 0;
            while (i < partiesCount && partiesCount - i > 9) { // We preserve the last 10 parties
                var removedKey = cPartiesKeys[i];
                var removedTimestamp = new Date(partiesData[removedKey].timestamp);
                if (Date.now() - removedTimestamp < (1000 * 60 * 60 * 1))
                { // We preserve the parties last updated earlier than 1 hour ago
                    throw new Error("Too much parties at the same time.");
                };
                console.log("Remove party: '{0}'.".format(removedKey));
                remove(ref(this._db, cPartiesKey + "/" + removedKey));
                i++;
            }
            // Create effectively the party
            this._internalCreateParty(createdCallback);
        }).catch((error) => { throw new Error("Error when retrieving parties ({0})".format(error)); });
    }
    
    async connectToParty(partyID, _bRetrieveAllPlayers = false) {
        if (Object.keys(this.parties).includes(partyID)) return;
        this.parties[partyID] = new Party(this, partyID, _bRetrieveAllPlayers);
        await this.parties[partyID].connect();
    }
}

class FirebaseElement {
    #changedListeners;
    
    _parentElement;
    _reference;

    constructor(_parentElement) {
        if (this.constructor == FirebaseElement) {
            throw new Error("Abstract classes can't be instantiated.");
        }
        this._parentElement = _parentElement;
        this.#changedListeners = [];
    }

    name() { return this._reference.key; }
    
    // changed listener management
    addChangedListener(_changedCallback) {
        this.#changedListeners.push(_changedCallback);
    }
    callChangedListeners(param) {
        this.#changedListeners.forEach(elem => { elem(param); });
    }
}

class FirebaseConnectable extends FirebaseElement {
    _connecting = 0;
    
    constructor(_parentElement) {
        super(_parentElement);
        if (this.constructor == FirebaseConnectable) {
            throw new Error("Abstract classes can't be instantiated.");
        }
    }
    
    // Connection management
    isConnected() { return !!this._reference; }; // Is reference valid ?
    async waitWhileConnecting() { while (this._connecting) { await new Promise(resolve => setTimeout(resolve, 500)); } }
    async _internalConnect() { throw new Error("internalConnect not implemented yet."); }
    async connect() {
        if (this._connecting) { throw new Error("Already connecting."); }
        this._connecting = 1;
        console.log("Connecting {0}...".format(this.constructor.name));
        
        this._internalConnect();
        await this.waitWhileConnecting();
        
        console.log("{0} connected!".format(this.constructor.name));
    }
    
    _oneMoreChildConnection() { this._connecting++; }
    _oneLessChildConnection() {
        this._connecting--;
        if (this._connecting<0)
            throw new Error("Error: Negative count of connection in progress.");
    }
}

export class Party extends FirebaseConnectable {
    _firebase;
    _partyID;
    _bRetrieveAllPlayers = false;
    
    // party attributes
    pegmanAttr;
    confortAttr;
    foodsAttr;
    healAttr;
    spaceAttr;
    diceAttr;
    notesAttr;
    
    playerNames;
    players = {};
    
    constructor(_firebase, _partyID, _bRetrieveAllPlayers = false) {
        super(undefined);
        this._firebase = _firebase;
        this._partyID = _partyID;
        this._bRetrieveAllPlayers = _bRetrieveAllPlayers;
    }
    
    // Connection management
    async _internalConnect() {
        onValue(
            ref(this._firebase._db, cPartiesKey),
            (snapshot) => {
                if (! snapshot.exists()) { throw new Error("{0} '{1}' doesn't exist anymore.".format(this.constructor.name, this._partyID)); }
                var found = false;
                snapshot.forEach(child => found = found || child.key == this._partyID);
                if (found) {
                    if (! this.isConnected()) {
                        this._reference = ref(this._firebase._db, cPartiesKey + '/' + this._partyID);
                        this.#internalBinding();
                        this._connecting--;
                    }
                }
                else {
                    throw new Error("{0} '{1}' doesn't exist anymore.".format(this.constructor.name, this._partyID));
                }
            },
            { shallow:true } // Get only children keys
        );
    }
    async #internalBinding() {
        // Create FirebaseAttribute
        this.pegmanAttr = new FirebaseAttribute(this, defaultData.pegman);
        this.confortAttr = new FirebaseAttribute(this, 0);
        this.foodsAttr = new FirebaseAttribute(this, 0);
        this.healAttr = new FirebaseAttribute(this, 0);
        this.spaceAttr = new FirebaseAttribute(this, 0);
        this.diceAttr = new FirebaseAttribute(this, []);
        this.notesAttr = new FirebaseAttribute(this, "");
        this.playerNames = new FirebaseAttribute(this, {});
        
        // bind to database
        this.pegmanAttr._bindToReference(child(this._reference, cPegmanKey));
        this.confortAttr._bindToReference(child(this._reference, cResourcesKey + "/confort"));
        this.foodsAttr._bindToReference(child(this._reference, cResourcesKey + "/foods"));
        this.healAttr._bindToReference(child(this._reference, cResourcesKey + "/heal"));
        this.spaceAttr._bindToReference(child(this._reference, cResourcesKey + "/space"));
        this.diceAttr._bindToReference(child(this._reference, cDiceKey), false, false);
        this.notesAttr._bindToReference(child(this._reference, cNotesKey));
        this.playerNames._bindToReference(child(this._reference, cPlayersKey), true, false);
        
        // connect all players
        if (this._bRetrieveAllPlayers) {
            this.playerNames.addChangedListener( (value) => {
                if (this._bRetrieveAllPlayers) {
                    const names = Object.keys(value);
                    names.forEach((playerID) => {
                        if (! Object.keys(this.players).includes(playerID)) {
                            this.connectToPlayer(playerID);
                        }
                    });
                }
            });
        }
    }
    
    createPlayer(_playerID, createdCallback)
    {
        var player = defaultData.player;
        var resistance = 1 + utils.getRandomInt(3);
        var sanity = 1 + utils.getRandomInt(3);
        player.resistance.current = resistance;
        player.resistance.max = resistance;
        player.sanity.current = sanity;
        player.sanity.max = sanity;
        player.jobID = utils.getRandomInt(playerData.jobsList.length);
        
        // Create player
        set(child(this._reference, cPlayersKey + '/' + _playerID), player).then((snapshot) => {
            createdCallback();
            this._internalUpdateTimestamp();
        }).catch((error) => { throw new Error("Error when creating new player ({0}).".format(error)); });
        
        // Increment party's space by 3
        set(ref(this._firebase._db, cPartiesKey + '/' + this._partyID + '/' + cResourcesKey + '/' + 'space'), increment(3)).catch((error) => {
            throw new Error("Error when updating space from {0} '{1}' ({2})".format(this.constructor.name, this.name(), error));
        });
    }
    
    async connectToPlayer(playerID) {
        if (Object.keys(this.players).includes(playerID)) return;
        this.players[playerID] = new Player(this, playerID);
        await this.players[playerID].connect();
    }
    
    /* private function */
    _internalUpdateTimestamp()
    {
        if (! this.isConnected()) return;
        set(child(this._reference, cTimestampKey), Date.now()).catch((error) => { console.log("Error when updating timestamp ({0})".format(error)); });
    }
}

export class Player extends FirebaseConnectable {
    _playerID;
    
    // player attributes
    sanityAttr;
    resistanceAttr;
    jobIDAttr;
    notesAttr;
    optionsAttr;
    
    constructor(_party, _playerID) {
        super(_party);
        this._playerID = _playerID;
    }
    
    // Connection management
    async _internalConnect() {
        onValue(
            child(this._parentElement._reference, cPlayersKey),
            (snapshot) => {
                if (! snapshot.exists()) { throw new Error("Error while retrieving {0} of {1} '{2}'.".format(cPlayersKey, this.constructor.name, this._parentElement.name())); }
                var found = false;
                snapshot.forEach(child => found = found || child.key == this._playerID);
                if (found) {
                    if (! this.isConnected()) {
                        this._reference = child(this._parentElement._reference, cPlayersKey + "/" + this._playerID);
                        this.#internalBinding();
                        this._connecting--;
                    }
                }
                else
                {
                    throw new Error("{0} '{1}' doesn't exist anymore.".format(this.constructor.name, this._playerID));
                }
            },
            { shallow:true } // Get only children keys
        );
        
        return true;
    }
    async #internalBinding() {
        // Create FirebaseAttribute
        this.sanityAttr = new FirebaseMaxedAttribute(this, 4, 4);
        this.resistanceAttr = new FirebaseMaxedAttribute(this, 4, 4);
        this.jobIDAttr = new FirebaseAttribute(this, 1);
        this.notesAttr = new FirebaseAttribute(this, "");
        this.optionsAttr = new FirebaseAttribute(this, { "map_allowed" : false });
        
        // Bind to database
        this.sanityAttr._bindToReference(child(this._reference, cSanityKey));
        this.resistanceAttr._bindToReference(child(this._reference, cResistanceKey));
        this.jobIDAttr._bindToReference(child(this._reference, cJobIDKey));
        this.notesAttr._bindToReference(child(this._reference, cNotesKey));
        this.optionsAttr._bindToReference(child(this._reference, cOptionsKey));
    }
}

export class FirebaseAttribute extends FirebaseElement {
    _value;
    _bound;
    
    constructor(_parentElement, defaultValue) {
        super(_parentElement);
        this._value = defaultValue;
        
        this._parentElement._oneMoreChildConnection();
        this._bound = false;
    }

    // Listener management
    async _bindToReference(_reference, _shallow = false, _mustExists = true) {
        this._reference = _reference;
        
        onValue(this._reference, (snapshot) => {
                if (! snapshot.exists()) {
                    if (_mustExists) { console.log("Error while retrieving '{0}' from '{1}'.".format(this.name(), this._parentElement.name())); }
                    else if (! this._bound) { this._bound = true; this._parentElement._oneLessChildConnection(); }
                    return;
                }
                if (! this._bound) { this._bound = true; this._parentElement._oneLessChildConnection(); }
                this._value = snapshot.val();
                this.callChangedListeners(this._value);
            }, { shallow:_shallow } // Get only children keys
        );
    }
    addChangedListener(_changedCallback) {
        _changedCallback(this._value);
        super.addChangedListener(_changedCallback);
    }
    
    // Getter/Setter
    get() { return this._value; }
    set(newValue) {
        if (! this._parentElement.isConnected()) return;
        set(this._reference, newValue).catch((error) => { throw new Error("Error when updating '{0}' for '{1}' ({2})".format(this.name(), this._parentElement.name(), error)); });
        
        // update timestamp
        var parentElem = this._parentElement;
        while (parentElem) {
            if (typeof parentElem._internalUpdateTimestamp === "function") {
                parentElem._internalUpdateTimestamp();
                break;
            }
            parentElem = parentElem._parentElement;
        }
    }
}

export class FirebaseMaxedAttribute extends FirebaseElement {
    current;
    max;
    
    constructor(_parentElement, _defaultCurrent, _defaultMax) {
        super(_parentElement);
        this.current = new FirebaseAttribute(this, _defaultCurrent);
        this.max = new FirebaseAttribute(this, _defaultMax);
    }
    
    async _bindToReference(_reference) {
        this._reference = _reference;
        await this.current._bindToReference(child(_reference, "current"));
        await this.max._bindToReference(child(_reference, "max"));
    }
    
    name() { return this._reference.parent.key + "/" + this._reference.key; }
    
    async waitWhileConnecting() { await this._parentElement.waitWhileConnecting(); }
    isConnected() { return this._parentElement.isConnected(); }
    _oneMoreChildConnection() { this._parentElement._oneMoreChildConnection(); }
    _oneLessChildConnection() { this._parentElement._oneLessChildConnection(); }
}
