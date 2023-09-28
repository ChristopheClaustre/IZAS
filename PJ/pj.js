import { Firebase } from "../scripts/dbUtils.js";
import * as mapUtils from "../scripts/mapUtils.js";
import * as utils from "../scripts/utils.js";
import { data as playerData, randomName } from "../scripts/player.js";
import { data as defaultData } from "../scripts/default.js";

function allowMaps()
{
  var gutter = document.querySelector(".gutter");
  if (gutter) gutter.remove(); // remove root div for gutter
  Split(['#map', '#pano'], { sizes: [40, 60] }); // create new gutter
}

function forbidMaps()
{
  var gutter = document.querySelector(".gutter");
  if (gutter) gutter.remove(); // remove root div for gutter
  document.getElementById("map").style.width = "0px"; // hide maps
  Split(['#pano'], { sizes: [100] }); // create new gutter
}

function initializePJ() {
  // Initialize maps values
  var pegman = defaultData.pegman;
  
  // Create maps objects
  var panorama = new google.maps.StreetViewPanorama(
    document.getElementById("pano"),
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
  var map = new google.maps.Map(document.getElementById("map"), {
    center: pegman,
    zoom: 14,
    mapTypeControl: false,
    fullscreenControl: false,
    streetViewControl: false,
    motionTracking: false,
    motionTrackingControl: false
  });
  forbidMaps(); // by default, hidden
  
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
  document.getElementById("player-name").innerHTML = "<option>" + playerID + "</option>";
  
  // Synchronize position with firebase
  firebase.bindToPegman((pegman) => panorama.setPosition(pegman));
  
  // Setup specific controls
  const dice_control = document.getElementById("dice-control");
  panorama.controls[google.maps.ControlPosition.TOP_RIGHT].push(dice_control);
  
  // display options
  firebase.bindToOption("map_allowed", (allowed) => { if (allowed) allowMaps(); else forbidMaps(); });
  
  // display resources
  function updateSpaceCount() { document.getElementById("space-count").value = parseInt(document.getElementById("heal-count").value) + parseInt(document.getElementById("confort-count").value) + parseInt(document.getElementById("foods-count").value); }
  firebase.bindToResource("heal",    (data) => { document.getElementById("heal-count").value = data;    updateSpaceCount(); } );
  firebase.bindToResource("confort", (data) => { document.getElementById("confort-count").value = data; updateSpaceCount(); } );
  firebase.bindToResource("foods",   (data) => { document.getElementById("foods-count").value = data;   updateSpaceCount(); } );
  firebase.bindToResource("space",   (data) => { document.getElementById("space-max").value = data;     updateSpaceCount(); } );
  
  // display resistance
  firebase.bindToResistance((data) => {
    document.getElementById("player-resistance").value = data.current;
    document.getElementById("player-resistance-max").value = data.max;
  });
  
  // display sanity
  firebase.bindToSanity((data) => {
    document.getElementById("player-sanity").value = data.current;
    document.getElementById("player-sanity-max").value = data.max;
  });
  
  // display job
  firebase.bindToJob((data) => {
    document.getElementById("player-job").innerHTML = "<option>" + data.job + "</option>";
    document.getElementById("player-job").title = data.job + " :\n" + data.description;
  });
}

function main(partyID, playerID) {
  // Display partyID
  document.getElementById("partyID").value = partyID;
  utils.bindEvent(document.getElementById("copy-partyID"), 'click', () => navigator.clipboard.writeText(partyID));
  
  // Connect to party
  firebase.connectToParty(partyID);
  // Connect as player
  firebase.connectToPlayer(playerID, true);

  // Initialize for maps
  registerInitialize(initializePJ);
}

// Connect to firebase
var firebase = new Firebase();

// Manage query string (and retrieve party ID if possible)
const urlParams = new URLSearchParams(window.location.search);
var partyID = urlParams.get("partyID", "");
var playerID = urlParams.get("playerID", "");

// Check partyID
if ( ! partyID )
{
  utils.throwError("No Party ID set.");
}

// Check player's name
if ( ! playerID )
{
  while(!playerID) {
    playerID = window.prompt("Entrez le nom de votre personage (press cancel for another randomn name) :", randomName());
  }
  console.log("Selected playerID: " + playerID)
  await firebase.createPlayer(partyID, playerID, () => {
    utils.updateURL(utils.updateURLParameter(window.location.href, "playerID", playerID));
    main(partyID, playerID);
  });
}
else
{
  main(partyID, playerID);
}
