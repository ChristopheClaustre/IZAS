import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.3.1/firebase-app.js';

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

// Initialize MJ page
function initializeMJ() {
  const fenway = { lat: 42.345573, lng: -71.098326 };
  const map = new google.maps.Map(document.getElementById("map"), {
    center: fenway,
    zoom: 14,
    fullscreenControl: false,
    motionTracking: false,
    motionTrackingControl: false
  });
  const panorama = new google.maps.StreetViewPanorama(
    document.getElementById("pano"),
    {
      position: fenway,
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
}

window.initializeMJ = initializeMJ;

// Initialize PJ page
function initializePJ() {
  const fenway = { lat: 42.345573, lng: -71.098326 };
  const panorama = new google.maps.StreetViewPanorama(
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
  
  // To disable movement with keyboard
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
}

window.initializePJ = initializePJ;
