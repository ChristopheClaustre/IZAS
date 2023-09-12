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
}

// Initialize maps values
var panorama = null;
var map = null;
var pegman = dbUtils.defaultPegman;

// Manage query string (and retrieve party ID if possible)
const urlParams = new URLSearchParams(window.location.search);
var partyID = urlParams.get("partyID", "");

if ( ! urlParams.has("partyID") )
{
  if (utils.isPlayerPage()) // Not allowed, return to main page
  {
    utils.throwError("No Party ID set.");
  }
  else
  {
    var newPartyRef = dbUtils.createParty();
    set(newPartyRef, {pegman: dbUtils.defaultPegman}).then((snapshot) => {
      utils.gotoUrl(utils.constructUrl(false, newPartyRef.key));
    }).catch((error) => {
      utils.throwError("Error when creating new party (" + error + ")");
    });
  }
}
else
{
  document.getElementById("partyID").value = partyID;
  utils.bindEvent(document.getElementById("copy-partyID"), 'click', () => navigator.clipboard.writeText(utils.constructUrl(true, partyID)));
  
  if (utils.isPlayerPage())
  {
    window.initializePJ = initializePJ;
  }
  else
  {
    window.initializeMJ = initializeMJ;
  }
}