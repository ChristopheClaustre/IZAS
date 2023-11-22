import { Firebase } from "../scripts/dbUtils.js";
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
        ['#map', '#pano', '#notes'],
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
    
    // Synchronize position with firebase
    var pos_initialized = 0;
    firebase.bindToPegman((_pegman) => {
        pegman = _pegman;
        panorama.setPosition(_pegman);
        map.setCenter(_pegman);
        pos_initialized++;
    });
    
    // Update firebase when position is changed
    panorama.addListener("position_changed", () => {
        if (pos_initialized >= 1) {
            var position = panorama.getPosition();
            pegman.lat = position.lat();
            pegman.lng = position.lng();
            firebase.setPegman(pegman);
        }
    });
    
    // display options
    firebase.bindToOption("map_allowed", (allowed) => document.getElementById("player-map-allowed").checked = allowed);
    
    // check/uncheck options
    utils.bindEvent(document.getElementById("player-map-allowed"), 'change', () => firebase.setOption('map_allowed', !!document.getElementById("player-map-allowed").checked));
    
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
        if (ratio >= 1) {
            document.getElementById("space-count").className = "error";
        } else if (ratio >= 0.7) {
            document.getElementById("space-count").className = "warning";
        } else {
            document.getElementById("space-count").className = "";
        }
    }
    firebase.bindToResource("heal",     (data) => { document.getElementById("heal-count").value = data;     updateSpaceCount(); } );
    firebase.bindToResource("confort",  (data) => { document.getElementById("confort-count").value = data;  updateSpaceCount(); } );
    firebase.bindToResource("foods",    (data) => { document.getElementById("foods-count").value = data;    updateSpaceCount(); } );
    firebase.bindToResource("space",    (data) => { document.getElementById("space-max").value = data;      updateSpaceCount(); } );

    // +/- resources
    utils.bindEvent(document.getElementById("heal-count"), 'change', () => firebase.setResource('heal', parseInt(document.getElementById("heal-count").value)));
    utils.bindEvent(document.getElementById("confort-count"), 'change', () => firebase.setResource('confort', parseInt(document.getElementById("confort-count").value)));
    utils.bindEvent(document.getElementById("foods-count"), 'change', () => firebase.setResource('foods', parseInt(document.getElementById("foods-count").value)));
    utils.bindEvent(document.getElementById("space-max"), 'change', () => firebase.setResource('space', parseInt(document.getElementById("space-max").value)));
    
    // bind callback for player edition
    var selectedPlayer = "";
    var onPlayerChanged = () => {
        selectedPlayer = document.getElementById("player-name").value;
        if (selectedPlayer) {
            firebase.getPlayer(selectedPlayer, (player) => {
                document.getElementById("player-job").value = playerData.jobsList[player.jobID].job;
                // Resistance
                document.getElementById("player-resistance").max = player.resistance.max;
                document.getElementById("player-resistance").value = player.resistance.current;
                document.getElementById("player-resistance-max").value = player.resistance.max;
                // Sanity
                document.getElementById("player-sanity").max = player.sanity.max;
                document.getElementById("player-sanity").value = player.sanity.current;
                document.getElementById("player-sanity-max").value = player.sanity.max;
            });
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
        }
    };
    utils.bindEvent(document.getElementById("player-job"), 'change', () => {
        if (selectedPlayer) {
            // set title (tooltip)
            var elem = document.getElementById("player-job");
            var jobID = playerData.jobsList.findIndex(job => job.job == elem.value);
            var job = playerData.jobsList[jobID];
            elem.title = job.job + " :\n" + job.description;
            // update firebase
            firebase.setPlayerAttribute(selectedPlayer, 'jobID', jobID);
        }
    });
    utils.bindEvent(document.getElementById("player-resistance"), 'change', () => {
        if (selectedPlayer) {
            firebase.setPlayerAttribute(selectedPlayer, 'resistance/current', parseInt(document.getElementById("player-resistance").value));
        }
    });
    utils.bindEvent(document.getElementById("player-resistance-max"), 'change', () => {
        if (selectedPlayer) {
            const resistanceMax = parseInt(document.getElementById("player-resistance-max").value);
            if (parseInt(document.getElementById("player-resistance").value) > resistanceMax) {
                firebase.setPlayerAttribute(selectedPlayer, 'resistance/current', resistanceMax);
                document.getElementById("player-resistance").value = resistanceMax;
            }
            document.getElementById("player-resistance").max = resistanceMax;
            firebase.setPlayerAttribute(selectedPlayer, 'resistance/max', resistanceMax);
        }
    });
    utils.bindEvent(document.getElementById("player-sanity"), 'change', () => {
        if (selectedPlayer) {
            firebase.setPlayerAttribute(selectedPlayer, 'sanity/current', parseInt(document.getElementById("player-sanity").value));
        }
    });
    utils.bindEvent(document.getElementById("player-sanity-max"), 'change', () => {
        if (selectedPlayer) {
            const sanityMax = parseInt(document.getElementById("player-sanity-max").value);
            if (parseInt(document.getElementById("player-sanity").value) > sanityMax) {
                firebase.setPlayerAttribute(selectedPlayer, 'sanity/current', sanityMax);
                document.getElementById("player-sanity").value = sanityMax;
            }
            document.getElementById("player-sanity").max = sanityMax;
            firebase.setPlayerAttribute(selectedPlayer, 'sanity/max', sanityMax);
        }
    });
    utils.bindEvent(document.getElementById("player-name"), 'change', onPlayerChanged);
    
    // fill select for jobs
    var optionsForJobs = "";
    playerData.jobsList.forEach((job) => optionsForJobs += "<option>" + job.job + "</option>");
    document.getElementById("player-job").innerHTML = optionsForJobs;
    
    // fill select for players
    firebase.bindToPlayerNames((playersNames) => {
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
    firebase.bindToPlayers((players) => {
        var resume = "";
        Object.keys(players).forEach(playerID => resume += playerID + " (IZAS: " + players[playerID].resistance.current + "/" + players[playerID].resistance.max + ", Sanity: " + players[playerID].sanity.current + "/" + players[playerID].sanity.max + ") : " + playerData.jobsList[players[playerID].jobID].job + "\n");
        resume.trim();
        document.getElementById("players-resume").title = resume;
    });
    
    // Master Notes
    var maxLength = 2048;
	var textArea = document.getElementById("notes-input");
	textArea.maxLength = maxLength.toString();
    firebase.bindToMasterNotes((notes) => {
        textArea.value = notes;
        document.getElementById("notes-current-count").innerHTML = notes.length;
    });
	utils.bindEvent(textArea, "input", () => {
		document.getElementById("notes-current-count").innerHTML = textArea.value.length;
        firebase.setMasterNotes( textArea.value );
	});
	document.getElementById("notes-max-count").innerHTML = maxLength;
}

function main(partyID) {
    // Display partyID
    document.getElementById("partyID").value = partyID;
    utils.bindEvent(document.getElementById("copy-partyID"), 'click', () => navigator.clipboard.writeText(partyID));

    // Connect to party
    firebase.connectToParty(partyID);

    // Initialize for maps
    registerInitialize(initializeMJ);
}

// Connect to firebase
var firebase = new Firebase();

// Manage query string (and retrieve party ID if possible)
const urlParams = new URLSearchParams(window.location.search);
var partyID = urlParams.get("partyID", "");

// Check partyID
if ( ! partyID )
{
    await firebase.createParty((newPartyID) => {
        utils.updateURL(utils.updateURLParameter(window.location.href, "partyID", newPartyID));
        main(newPartyID);
    });
}
else
{
    main(partyID);
}
