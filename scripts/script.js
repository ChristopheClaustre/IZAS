import * as dbUtils from "./dbUtils.js";
import * as utils from "./utils.js";
import { ref, onValue, get, set, child } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-database.js";

// Initialize MJ and PJ functions
function initializeMJ() {
  const partiesRef = dbUtils.getPartiesRef(partyID);
  const latitudeRef = child(partiesRef, 'pegman/lat');
  const longitudeRef = child(partiesRef, 'pegman/lng');
  
  // Create maps objects
  map = new google.maps.Map(document.getElementById("map"), {
    center: pegman,
    zoom: 14,
    fullscreenControl: false,
    motionTracking: false,
    motionTrackingControl: false
  });
  panorama = new google.maps.StreetViewPanorama(
    document.getElementById("pano"),
    {
      position: pegman,
      pov: {
        heading: 34,
        pitch: 10,
      },
      fullscreenControl: false,
      motionTracking: false,
      motionTrackingControl: false
    }
  );

  map.setStreetView(panorama);
  
  // Setup search box
  const placesInput = document.getElementById("places-input");
  const searchBox = new google.maps.places.SearchBox(placesInput);
  map.controls[google.maps.ControlPosition.TOP_LEFT].push(placesInput);
  map.addListener("bounds_changed", () => {
    searchBox.setBounds(map.getBounds());
  });
  searchBox.addListener("places_changed", () => {
    const places = searchBox.getPlaces();

    if (places.length == 0) {
      return;
    }
    
    map.setCenter(places[0].geometry.location);
  });
  
  // Setup recenter button
  const recenterInput = document.getElementById("recenter-input");
  map.controls[google.maps.ControlPosition.TOP_RIGHT].push(recenterInput);
  utils.bindEvent(recenterInput, "click", () => map.setCenter(panorama.position));
  
  // Initialize position with firebase values
  var pos_initialized = 0;
  get(latitudeRef).then((snapshot) => {
    if (snapshot.exists()) {
      pegman.lat = snapshot.val();
      panorama.setPosition(pegman);
      map.setCenter(pegman);
      pos_initialized++;
    } else {
      utils.throwError("Party ID \"" + partyID + "\" does not exists.");
    }
  }).catch((error) => {
    console.error(error);
  });
  get(longitudeRef).then((snapshot) => {
    if (snapshot.exists()) {
      pegman.lng = snapshot.val();
      panorama.setPosition(pegman);
      map.setCenter(pegman);
      pos_initialized++;
    } else {
      utils.throwError("Party ID \"" + partyID + "\" does not exists.");
    }
  }).catch((error) => {
    console.error(error);
  });
  
  // Update firebase when position is changed
  panorama.addListener("position_changed", () => {
    if (pos_initialized >= 2) {
      var position = panorama.getPosition();
      pegman.lat = position.lat();
      pegman.lng = position.lng();
      set(latitudeRef, pegman.lat);
      set(longitudeRef, pegman.lng);
    }
  });
  
  // display resources
  dbUtils.displayResources(partyID, "heal", (data) => document.getElementById("heal-count").value = data );
  dbUtils.displayResources(partyID, "confort", (data) => document.getElementById("confort-count").value = data );
  dbUtils.displayResources(partyID, "foods", (data) => document.getElementById("foods-count").value = data );
  
  // +/- resources
  utils.bindEvent(document.getElementById("heal-count"), 'change', () => dbUtils.setResource(partyID, 'heal', parseInt(document.getElementById("heal-count").value)));
  utils.bindEvent(document.getElementById("confort-count"), 'change', () => dbUtils.setResource(partyID, 'confort', parseInt(document.getElementById("confort-count").value)));
  utils.bindEvent(document.getElementById("foods-count"), 'change', () => dbUtils.setResource(partyID, 'foods', parseInt(document.getElementById("foods-count").value)));
  
  // bind callback for player edition
  var selectedPlayer = "";
  var onPlayerChanged = () => {
    selectedPlayer = document.getElementById("player-name").value;
    if (selectedPlayer) {
      dbUtils.getPlayer(partyID, selectedPlayer, (player) => {
        document.getElementById("player-job").value = dbUtils.jobsList[player.jobID].job;
        document.getElementById("player-resistance").value = player.resistance.current;
        document.getElementById("player-resistance-max").value = player.resistance.max;
      });
    }
    else {
      document.getElementById("player-job").value = "";
      document.getElementById("player-resistance").value = 4;
      document.getElementById("player-resistance-max").value = 4;
    }
  };
  utils.bindEvent(document.getElementById("player-job"), 'change', () => {
    if (selectedPlayer) {
      // set title (tooltip)
      var elem = document.getElementById("player-job");
      var jobID = dbUtils.jobsList.findIndex(job => job.job == elem.value);
      var job = dbUtils.jobsList[jobID];
      elem.title = job.job + " :\n" + job.description;
      // update firebase
      dbUtils.setPlayerAttribute(partyID, selectedPlayer, 'jobID', jobID);
    }
  });
  utils.bindEvent(document.getElementById("player-resistance"), 'change', () => {
    if (selectedPlayer) {
      dbUtils.setPlayerAttribute(partyID, selectedPlayer, 'resistance/current', parseInt(document.getElementById("player-resistance").value));
    }
  });
  utils.bindEvent(document.getElementById("player-resistance-max"), 'change', () => {
    if (selectedPlayer) {
      dbUtils.setPlayerAttribute(partyID, selectedPlayer, 'resistance/max', parseInt(document.getElementById("player-resistance-max").value));
    }
  });
  utils.bindEvent(document.getElementById("player-name"), 'change', onPlayerChanged);
  
  // fill select for jobs
  var optionsForJobs = "";
  dbUtils.jobsList.forEach((job) => optionsForJobs += "<option>" + job.job + "</option>");
  document.getElementById("player-job").innerHTML = optionsForJobs;
  
  // fill select for players
  dbUtils.displayAllPlayersNames(partyID, (playersNames) => {
    var options = "";
    playersNames.forEach((playerName) => options += "<option>" + playerName + "</option>");
    document.getElementById("player-name").innerHTML = options;
    if (playersNames.length == 0)
    {
      selectedPlayer = "";
      onPlayerChanged();
    }
    else if (!selectedPlayer || !playersNames.includes(selectedPlayer))
    {
      selectedPlayer = playersNames[0];
      onPlayerChanged();
    }
    else
    {
      document.getElementById("player-name").value = selectedPlayer;
    }
  });
  
  // party resume
  dbUtils.displayAllPlayers(partyID, (players) => {
    var resume = "";
    Object.keys(players).forEach(playerID => resume += playerID + " (" + players[playerID].resistance.current + "/" + players[playerID].resistance.max + ") : " + dbUtils.jobsList[players[playerID].jobID].job + "\n");
    resume.trim();
    document.getElementById("players-resume").title = resume;
  });
}

function initializePJ() {
  const partiesRef = dbUtils.getPartiesRef(partyID);
  const latitudeRef = child(partiesRef, 'pegman/lat');
  const longitudeRef = child(partiesRef, 'pegman/lng');
  
  // Create maps objects
  panorama = new google.maps.StreetViewPanorama(
    document.getElementById("pano-pj"),
    {
      position: pegman,
      pov: {
        heading: 34,
        pitch: 10,
      },
      fullscreenControl: false,
      motionTracking: false,
      motionTrackingControl: false,
      addressControl: false,
      linksControl: false,
      enableCloseButton: false,
      clickToGo: false
    }
  );
  
  // Disable movement with keyboard
  window.addEventListener(
    'keydown',
    (event) => {
      if (
        (
          // Change or remove this condition depending on your requirements.
             event.key === 'ArrowUp' // Move forward
          || event.key === 'ArrowDown' // Move forward
          /*||   event.key === 'ArrowLeft' // Pan left
          ||   event.key === 'ArrowRight' // Pan right
          ||   event.key === '+' // Zoom in
          ||   event.key === '=' // Zoom in
          ||   event.key === '_' // Zoom out
          ||   event.key === '-' // Zoom out*/
        ) &&
        !event.metaKey &&
        !event.altKey &&
        !event.ctrlKey
      ) {
        event.stopPropagation()
      };
    },
    { capture: true },
  );
  
  // Display player's name
  document.getElementById("player-name").innerHTML = "<option>" + name + "</option>";

  // Synchronize position with firebase
  onValue(latitudeRef, (snapshot) => {
    if (! snapshot.exists()) utils.throwError("Party ID \"" + partyID + "\" does not exists.");
    const data = snapshot.val();
    pegman.lat = data;
    panorama.setPosition(pegman);
  });
  onValue(longitudeRef, (snapshot) => {
    if (! snapshot.exists()) utils.throwError("Party ID \"" + partyID + "\" does not exists.");
    const data = snapshot.val();
    pegman.lng = data;
    panorama.setPosition(pegman);
  });
  
  // display resources
  dbUtils.displayResources(partyID, "heal", (data) => document.getElementById("heal-count").value = data );
  dbUtils.displayResources(partyID, "confort", (data) => document.getElementById("confort-count").value = data );
  dbUtils.displayResources(partyID, "foods", (data) => document.getElementById("foods-count").value = data );
  
  // display resistance
  dbUtils.displayResistance(partyID, name, (data) => {
    document.getElementById("player-resistance").value = data.current;
    document.getElementById("player-resistance-max").value = data.max;
  });
  
  // display job
  dbUtils.displayJob(partyID, name, (data) => {
    document.getElementById("player-job").innerHTML = "<option>" + data.job + "</option>";
    document.getElementById("player-job").title = data.job + " :\n" + data.description;
  });
}

// Connect to firebase
dbUtils.connectToDB();

// Initialize maps values
var panorama = null;
var map = null;
var pegman = dbUtils.defaultPegman;

// Manage query string (and retrieve party ID if possible)
const urlParams = new URLSearchParams(window.location.search);
var partyID = urlParams.get("partyID", "");
var name = urlParams.get("name", "");

// Check partyID
if ( ! partyID )
{
  if (utils.isPlayerPage()) // Not allowed, return to main page
  {
    utils.throwError("No Party ID set.");
  }
  else
  {
    dbUtils.createParty((newPartyID) => utils.gotoUrl(utils.constructMasterUrl(newPartyID)));
  }
}
// Check player's name
else if (utils.isPlayerPage() && ! name)
{
  while(!name) {
    name = window.prompt("Entrez le nom de votre personage :", "");
  }
  dbUtils.createPlayer(partyID, name, (newPlayerID) => utils.gotoUrl(utils.constructPlayerUrl(partyID, name)));
}
else
{
  // Display partyID
  document.getElementById("partyID").value = partyID;
  utils.bindEvent(document.getElementById("copy-partyID"), 'click', () => navigator.clipboard.writeText(utils.constructUrl(true, partyID)));

  // Initialize for maps
  if (utils.isPlayerPage())
  {
    window.initializePJ = initializePJ;
  }
  else
  {
    window.initializeMJ = initializeMJ;
  }
}
