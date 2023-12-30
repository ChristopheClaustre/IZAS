import { Firebase, BindInputToAttribute } from "../scripts/dbUtils.js";
import * as mapUtils from "../scripts/mapUtils.js";
import * as utils from "../scripts/utils.js";
import { data as playerData, randomName } from "../scripts/player.js";
import { data as defaultData } from "../scripts/default.js";
import { Die, RollDie } from "../scripts/die.js";

var split_obj = undefined;
var notesPercent = 30;
function showMaps(mapEnabled)
{
    if (split_obj) split_obj.destroy();
    
    document.getElementById("map").style.width = "0px"; // reset maps
    
    if (!mapEnabled) {
        split_obj = Split(
            ['#pano', '#right-panel'],
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
            ['#map', '#pano', '#right-panel'],
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
    BindInputToAttribute(document.getElementById("heal-count"), firebase.parties[partyID].healAttr, updateSpaceCount);
    BindInputToAttribute(document.getElementById("confort-count"), firebase.parties[partyID].confortAttr, updateSpaceCount);
    BindInputToAttribute(document.getElementById("foods-count"), firebase.parties[partyID].foodsAttr, updateSpaceCount);
    BindInputToAttribute(document.getElementById("space-max"), firebase.parties[partyID].spaceAttr, updateSpaceCount);

    // display resistance
    BindInputToAttribute(document.getElementById("player-resistance"), firebase.parties[partyID].players[playerID].resistanceAttr.current);
    BindInputToAttribute(document.getElementById("player-resistance-max"), firebase.parties[partyID].players[playerID].resistanceAttr.max);
    
    // display sanity
    BindInputToAttribute(document.getElementById("player-sanity"), firebase.parties[partyID].players[playerID].sanityAttr.current);
    BindInputToAttribute(document.getElementById("player-sanity-max"), firebase.parties[partyID].players[playerID].sanityAttr.max);
    
    // display Physical / Social / Mental
    BindInputToAttribute(document.getElementById("player-physical"), firebase.parties[partyID].players[playerID].physicalAttr);
    BindInputToAttribute(document.getElementById("player-social"), firebase.parties[partyID].players[playerID].socialAttr);
    BindInputToAttribute(document.getElementById("player-mental"), firebase.parties[partyID].players[playerID].mentalAttr);
    
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
    
    // dice history
    document.getElementById("current-die").innerHTML = Die(1);
    utils.bindEvent(document.getElementById("roll-die"), "click", async () => {
        // roll die
        let max = document.getElementById("die-max").value;
        let value = await RollDie(document.getElementById("current-die"), max, 1500, 100);
        
        // add to history
        let diceHistory = firebase.parties[partyID].diceAttr.get();
        diceHistory.unshift({ playerID:playerID, result:value, max:max, timestamp:Date.now() });
        firebase.parties[partyID].diceAttr.set(diceHistory);
    });
    firebase.parties[partyID].diceAttr.addChangedListener((diceHistory) => {
        var diceHistoryStr = "";
        diceHistory.forEach(history => {
            const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' };
            const date = new Date(history.timestamp);
            if (history.playerID == playerID)
                diceHistoryStr += history.playerID + " " + history.result + "/" + history.max + " " + date.toLocaleDateString("fr-FR", options) + "\n";
            else
                diceHistoryStr += history.playerID + " " + history.result + "/? " + date.toLocaleDateString("fr-FR", options) + "\n";
        });
        document.getElementById("dice-history").value = diceHistoryStr;
    });
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
