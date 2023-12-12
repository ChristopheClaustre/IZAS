import { Firebase } from "../scripts/dbUtils.js";
import * as mapUtils from "../scripts/mapUtils.js";
import * as utils from "../scripts/utils.js";
import { data as playerData, randomName } from "../scripts/player.js";
import { data as defaultData } from "../scripts/default.js";

var split_obj = undefined;
var notesPercent = 30;
function showMaps(mapEnabled)
{
    if (split_obj) split_obj.destroy();
    
    document.getElementById("map").style.width = "0px"; // reset maps
    
    if (!mapEnabled) {
        split_obj = Split(
            ['#pano', '#notes'],
            {
                minSize: [200, 0],
                snapOffset: 100,
                sizes: [100 - notesPercent, notesPercent],
                onDragEnd: function (sizes) { notesPercent = sizes[1] }
            }
        ); // create new gutter
    }
    else {
        split_obj = Split(
            ['#map', '#pano', '#notes'],
            {
                minSize: [0, 200, 0],
                snapOffset: 100,
                sizes: [30, 100 - notesPercent, notesPercent],
                onDragEnd: function (sizes) { notesPercent = sizes[2] }
            }
        ); // create new gutter
    }
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
    showMaps(false, 20); // by default, map is hidden
    
    // Disable movement with keyboard
    window.addEventListener(
        'keydown',
        (event) => {
            if (
                (
                    // Change or remove this condition depending on your requirements.
                       event.key === 'ArrowUp' // Move forward
                    || event.key === 'ArrowDown' // Move forward
                    /*||     event.key === 'ArrowLeft' // Pan left
                    ||     event.key === 'ArrowRight' // Pan right
                    ||     event.key === '+' // Zoom in
                    ||     event.key === '=' // Zoom in
                    ||     event.key === '_' // Zoom out
                    ||     event.key === '-' // Zoom out*/
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
    firebase.parties[partyID].pegmanAttr.addChangedListener((pegman) => panorama.setPosition(pegman));
    
    // Setup specific controls
    const dice_control = document.getElementById("dice-control");
    panorama.controls[google.maps.ControlPosition.TOP_RIGHT].push(dice_control);
    
    // display resources
    function updateSpaceCount() {
        // Update count
        document.getElementById("space-count").value =
            parseInt(document.getElementById("heal-count").value)
            + parseInt(document.getElementById("confort-count").value)
            + parseInt(document.getElementById("foods-count").value);
        // update class
        var max = document.getElementById("space-max").value;
        var count = document.getElementById("space-count").value;
        var ratio = max > 0 ? parseFloat(count) / max : 0;
        if (ratio > 1) {
            document.getElementById("space-count").className = "error";
        } else if (ratio >= 0.7) {
            document.getElementById("space-count").className = "warning";
        } else {
            document.getElementById("space-count").className = "";
        }
    }
    firebase.parties[partyID].healAttr.addChangedListener(    (data) => { document.getElementById("heal-count").value = data;     updateSpaceCount(); } );
    firebase.parties[partyID].confortAttr.addChangedListener( (data) => { document.getElementById("confort-count").value = data;  updateSpaceCount(); } );
    firebase.parties[partyID].foodsAttr.addChangedListener(   (data) => { document.getElementById("foods-count").value = data;    updateSpaceCount(); } );
    firebase.parties[partyID].spaceAttr.addChangedListener(   (data) => { document.getElementById("space-max").value = data;      updateSpaceCount(); } );

    // display resistance
    firebase.parties[partyID].players[playerID].resistanceAttr.current.addChangedListener((data) => { document.getElementById("player-resistance").value = data; });
    firebase.parties[partyID].players[playerID].resistanceAttr.max.addChangedListener((data) => { document.getElementById("player-resistance-max").value = data; });

    // display sanity
    firebase.parties[partyID].players[playerID].sanityAttr.current.addChangedListener((data) => { document.getElementById("player-sanity").value = data; });
    firebase.parties[partyID].players[playerID].sanityAttr.max.addChangedListener((data) => { document.getElementById("player-sanity-max").value = data; });

    // display job
    firebase.parties[partyID].players[playerID].jobIDAttr.addChangedListener((jobID) => {
        document.getElementById("player-job").innerHTML = "<option>" + playerData.jobsList[jobID].job + "</option>";
        document.getElementById("player-job").title = playerData.jobsList[jobID].job + " :\n" + playerData.jobsList[jobID].description;
    });
    
    // display notes
    var maxLength = 2048;
	var textArea = document.getElementById("notes-input");
	textArea.maxLength = maxLength.toString();
    firebase.parties[partyID].players[playerID].notesAttr.addChangedListener((notes) => {
        textArea.value = notes;
        document.getElementById("notes-current-count").innerHTML = notes.length;
    });
	utils.bindEvent(textArea, "input", () => {
        document.getElementById("notes-current-count").innerHTML = textArea.value.length;
        firebase.parties[partyID].players[playerID].notesAttr.set( textArea.value );
	});
	document.getElementById("notes-max-count").innerHTML = maxLength;
    
    // display options
    firebase.parties[partyID].players[playerID].optionsAttr.addChangedListener((options) => { showMaps(options["map_allowed"]); });
}

async function main() {
    // Display partyID
    document.getElementById("partyID").value = partyID;
    utils.bindEvent(document.getElementById("copy-partyID"), 'click', () => navigator.clipboard.writeText(partyID));
    
    // Connect as player
    await firebase.parties[partyID].connectToPlayer(playerID);
    
    // Initialize for maps
    registerInitialize(initializePJ);
}

try
{
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

    // Connect to party
    await firebase.connectToParty(partyID);

    // Check player's name
    if ( ! playerID )
    {
        while(!playerID) {
            playerID = window.prompt("Entrez le nom de votre personage (press cancel for another randomn name) :", randomName());
        }
        console.log("Selected playerID: " + playerID)
        firebase.parties[partyID].createPlayer(playerID, () => {
            utils.updateURL(utils.updateURLParameter(window.location.href, "playerID", playerID));
            main();
        });
    }
    else
    {
        main();
    }
}
catch (error)
{
    utils.throwError("Error when creating new party (" + error + ")");
}
