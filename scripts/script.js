import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.3.1/firebase-app.js';
import { getDatabase, ref, onValue, get, set } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-database.js";

// Your web app's Firebase configuration
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
const app = initializeApp(firebaseConfig);
const db = getDatabase();
const latitudeRef = ref(db, 'pegman/lat');
const longitudeRef = ref(db, 'pegman/lng');
var panorama = null;
var map = null;
var pegman = { lat: 42.345573, lng: -71.098326 };

// Initialize MJ page
function initializeMJ() {
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
  
  // Initialize position with firebase values
  var pos_initialized = 0;
  get(latitudeRef).then((snapshot) => {
    if (snapshot.exists()) {
      pegman.lat = snapshot.val();
      panorama.setPosition(pegman);
      map.setCenter(pegman);
      pos_initialized++;
    } else {
      console.log("No latitude data available");
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
      console.log("No longitude data available");
    }
  }).catch((error) => {
    console.error(error);
  });
  
  // Update firebase when position is changed
  panorama.addListener("position_changed", () => {
    if (pos_initialized >= 2) {
      var position = panorama.getPosition();
      console.log(position);
      pegman.lat = position.lat();
      pegman.lng = position.lng();
      set(latitudeRef, pegman.lat);
      set(longitudeRef, pegman.lng);
    }
  });
}

window.initializeMJ = initializeMJ;

// Initialize PJ page
function initializePJ() {
  // Create maps objects
  const fenway = { lat: 42.345573, lng: -71.098326 };
  panorama = new google.maps.StreetViewPanorama(
    document.getElementById("pano-pj"),
    {
      position: fenway,
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
    const data = snapshot.val();
    pegman.lat = data;
    panorama.setPosition(pegman);
  });
  onValue(longitudeRef, (snapshot) => {
    const data = snapshot.val();
    pegman.lng = data;
    panorama.setPosition(pegman);
  });
}

window.initializePJ = initializePJ;
