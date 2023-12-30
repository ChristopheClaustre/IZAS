import { Firebase, BindInputToAttribute, DiceHistoryToString } from "../scripts/dbUtils.js";
import * as utils from "../scripts/utils.js";
import { data as playerData, randomName } from "../scripts/player.js";
import { data as defaultData } from "../scripts/default.js";

function initializeMJ() {
    // Initialize maps values
    var pegman = defaultData.pegman;
    
    // Create maps objects
    var map = new google.maps.Map(document.getElementById("map"), {
        center: pegman,
        zoom: 14,
        mapTypeControl: false,
        fullscreenControl: false,
        motionTracking: false,
        motionTrackingControl: false
    });
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
            motionTrackingControl: false
        }
    );
    map.setStreetView(panorama);
    Split(
        ['#map', '#pano', '#right-panel'],
        {
            minSize: [0, 200, 0],
            snapOffset: 100,
            sizes: [30, 70, 30]
        }
    ); // create gutter
    
    // Setup specific controls
    const maps_control = document.getElementById("maps-control");
    map.controls[google.maps.ControlPosition.TOP_CENTER].push(maps_control);
    
    // Setup search box
    const placesControl = document.getElementById("places-control");
    const searchBox = new google.maps.places.SearchBox(placesControl);
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
    const recenterControl = document.getElementById("recenter-control");
    utils.bindEvent(recenterControl, "click", () => map.setCenter(panorama.position));
    
    // Synchronize position with party's pegman
    var pos_initialized = 0;
    firebase.parties[partyID].pegmanAttr.addChangedListener((_pegman) => {
        pegman = _pegman;
        panorama.setPosition(_pegman);
        map.setCenter(_pegman);
        pos_initialized++;
    });
    
    // Update party's pegman when position is changed
    panorama.addListener("position_changed", () => {
        if (pos_initialized >= 1) {
            var position = panorama.getPosition();
            pegman.lat = position.lat();
            pegman.lng = position.lng();
            firebase.parties[partyID].pegmanAttr.set(pegman);
        }
    });
    
    // display resources
    function updateSpaceCount() {
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

    // bind callback for player edition
    var selectedPlayer = "";
    var onPlayerChanged = () => {
        selectedPlayer = document.getElementById("player-name").value;
        if (selectedPlayer in firebase.parties[partyID].players) {
            document.getElementById("player-job").value = playerData.jobsList[firebase.parties[partyID].players[selectedPlayer].jobIDAttr.get()].job;
            // Resistance
            document.getElementById("player-resistance").max = firebase.parties[partyID].players[selectedPlayer].resistanceAttr.max.get();
            document.getElementById("player-resistance").value = firebase.parties[partyID].players[selectedPlayer].resistanceAttr.current.get();
            document.getElementById("player-resistance-max").value = firebase.parties[partyID].players[selectedPlayer].resistanceAttr.max.get();
            // Sanity
            document.getElementById("player-sanity").max = firebase.parties[partyID].players[selectedPlayer].sanityAttr.max.get();
            document.getElementById("player-sanity").value = firebase.parties[partyID].players[selectedPlayer].sanityAttr.current.get();
            document.getElementById("player-sanity-max").value = firebase.parties[partyID].players[selectedPlayer].sanityAttr.max.get();
            // Physical / Social / Mental
            document.getElementById("player-physical").value = firebase.parties[partyID].players[selectedPlayer].physicalAttr.get();
            document.getElementById("player-social").value = firebase.parties[partyID].players[selectedPlayer].socialAttr.get();
            document.getElementById("player-mental").value = firebase.parties[partyID].players[selectedPlayer].mentalAttr.get();
            // Map allowed
            document.getElementById("player-map-allowed").checked = firebase.parties[partyID].players[selectedPlayer].optionsAttr.get()["map_allowed"];
        }
        else {
            document.getElementById("player-job").value = "";
            // Resistance
            document.getElementById("player-resistance").max = 4;
            document.getElementById("player-resistance").value = 4;
            document.getElementById("player-resistance-max").value = 4;
            // Sanity
            document.getElementById("player-sanity").max = 4;
            document.getElementById("player-sanity").value = 4;
            document.getElementById("player-sanity-max").value = 4;
            // Physical / Social / Mental
            document.getElementById("player-physical").value = 50;
            document.getElementById("player-social").value = 50;
            document.getElementById("player-mental").value = 50;
        }
    };
    utils.bindEvent(document.getElementById("player-job"), 'change', () => {
        if (selectedPlayer) {
            // set title (tooltip)
            var elem = document.getElementById("player-job");
            var jobID = playerData.jobsList.findIndex(job => job.job == elem.value);
            var job = playerData.jobsList[jobID];
            elem.title = job.job + " :\n" + job.description;
            // update player's JobID
            firebase.parties[partyID].players[selectedPlayer].jobIDAttr.set(jobID);
        }
    });
    utils.bindEvent(document.getElementById("player-resistance"), 'change', () => {
        if (selectedPlayer) {
            firebase.parties[partyID].players[selectedPlayer].resistanceAttr.current.set(parseInt(document.getElementById("player-resistance").value));
        }
    });
    utils.bindEvent(document.getElementById("player-resistance-max"), 'change', () => {
        if (selectedPlayer) {
            const resistanceMax = parseInt(document.getElementById("player-resistance-max").value);
            if (parseInt(document.getElementById("player-resistance").value) > resistanceMax) {
                firebase.parties[partyID].players[selectedPlayer].resistanceAttr.current.set(resistanceMax);
                document.getElementById("player-resistance").value = resistanceMax;
            }
            document.getElementById("player-resistance").max = resistanceMax;
            firebase.parties[partyID].players[selectedPlayer].resistanceAttr.max.set(resistanceMax);
        }
    });
    utils.bindEvent(document.getElementById("player-sanity"), 'change', () => {
        if (selectedPlayer) {
            firebase.parties[partyID].players[selectedPlayer].sanityAttr.current.set(parseInt(document.getElementById("player-sanity").value));
        }
    });
    utils.bindEvent(document.getElementById("player-sanity-max"), 'change', () => {
        if (selectedPlayer) {
            const sanityMax = parseInt(document.getElementById("player-sanity-max").value);
            if (parseInt(document.getElementById("player-sanity").value) > sanityMax) {
                firebase.parties[partyID].players[selectedPlayer].sanityAttr.current.set(sanityMax);
                document.getElementById("player-sanity").value = sanityMax;
            }
            document.getElementById("player-sanity").max = sanityMax;
            firebase.parties[partyID].players[selectedPlayer].sanityAttr.max.set(sanityMax);
        }
    });
    utils.bindEvent(document.getElementById("player-physical"), 'change', () => {
        if (selectedPlayer) {
            firebase.parties[partyID].players[selectedPlayer].physicalAttr.set(parseInt(document.getElementById("player-physical").value));
        }
    });
    utils.bindEvent(document.getElementById("player-social"), 'change', () => {
        if (selectedPlayer) {
            firebase.parties[partyID].players[selectedPlayer].socialAttr.set(parseInt(document.getElementById("player-social").value));
        }
    });
    utils.bindEvent(document.getElementById("player-mental"), 'change', () => {
        if (selectedPlayer) {
            firebase.parties[partyID].players[selectedPlayer].mentalAttr.set(parseInt(document.getElementById("player-mental").value));
        }
    });
    utils.bindEvent(document.getElementById("player-map-allowed"), 'change', () => {
        var options = firebase.parties[partyID].players[selectedPlayer].optionsAttr.get();
        options.map_allowed = !!document.getElementById("player-map-allowed").checked;
        firebase.parties[partyID].players[selectedPlayer].optionsAttr.set(options);
    });
    utils.bindEvent(document.getElementById("player-name"), 'change', onPlayerChanged);
    
    // fill select for jobs
    var optionsForJobs = "";
    playerData.jobsList.forEach((job) => optionsForJobs += "<option>" + job.job + "</option>");
    document.getElementById("player-job").innerHTML = optionsForJobs;
    
    // fill select for players
    firebase.parties[partyID].playerNames.addChangedListener((playersNames) => {
        var options = "";
        const names = Object.keys(playersNames);
        names.forEach((playerName) => options += "<option>" + playerName + "</option>");
        document.getElementById("player-name").innerHTML = options;
        if (playersNames.length == 0)
        {
            selectedPlayer = "";
        }
        else if (!selectedPlayer || !names.includes(selectedPlayer))
        {
            selectedPlayer = names[0];
        }
        else
        {
            document.getElementById("player-name").value = selectedPlayer;
        }
        onPlayerChanged();
    });
    
    // party resume
    firebase.parties[partyID].playerNames.addChangedListener((playersNames) => {
        var resume = "";
        Object.keys(playersNames).forEach(playerID => {
            resume += "{0} (IZAS: {1}/{2}, Sanity: {3}/{4}, Physical: {5}, Social: {6}, Mental: {7}) : {8}\n".format( playerID,
                    firebase.parties[partyID].players[playerID].resistanceAttr.current.get(), firebase.parties[partyID].players[playerID].resistanceAttr.max.get(),
                    firebase.parties[partyID].players[playerID].sanityAttr.current.get(), firebase.parties[partyID].players[playerID].sanityAttr.max.get(),
                    firebase.parties[partyID].players[playerID].physicalAttr.get(), firebase.parties[partyID].players[playerID].socialAttr.get(), firebase.parties[partyID].players[playerID].mentalAttr.get(),
                    playerData.jobsList[firebase.parties[partyID].players[playerID].jobIDAttr.get()].job );
        });
        resume.trim();
        document.getElementById("players-resume").title = resume;
    });
    
    // Master Notes
    var maxLength = 2048;
	var textArea = document.getElementById("notes-input");
	textArea.maxLength = maxLength.toString();
    firebase.parties[partyID].notesAttr.addChangedListener((notes) => {
        textArea.value = notes;
        document.getElementById("notes-current-count").innerHTML = notes.length;
    });
	utils.bindEvent(textArea, "input", () => {
		document.getElementById("notes-current-count").innerHTML = textArea.value.length;
        firebase.parties[partyID].notesAttr.set( textArea.value );
	});
	document.getElementById("notes-max-count").innerHTML = maxLength;
    
    // dice history
    firebase.parties[partyID].diceAttr.addChangedListener((diceHistory) => {
        document.getElementById("dice-history").innerHTML = DiceHistoryToString(diceHistory);
    });
}

async function main() {
    // Display partyID
    document.getElementById("partyID").value = partyID;
    utils.bindEvent(document.getElementById("copy-partyID"), 'click', () => navigator.clipboard.writeText(partyID));

    // Connect to party
    await firebase.connectToParty(partyID, true);

    // Initialize for maps
    registerInitialize(initializeMJ);
}

try
{
    // Connect to firebase
    var firebase = new Firebase();

    // Manage query string (and retrieve party ID if possible)
    const urlParams = new URLSearchParams(window.location.search);
    var partyID = urlParams.get("partyID", "");

    // Check partyID
    if ( ! partyID )
    {
        firebase.createParty((newPartyID) => {
            utils.updateURL(utils.updateURLParameter(window.location.href, "partyID", newPartyID));
            partyID = newPartyID;
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
