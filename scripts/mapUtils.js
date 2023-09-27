var mapsAlreadyInitialized = false;
function defaultInitialize()
{
  console.log("Initialize not set yet. Please wait.");
  mapsAlreadyInitialized = true;
}

function registerInitialize( initializeCallback ) {
    if (! mapsAlreadyInitialized) {
        window.initialize = initializeCallback;
    }
    else {
        // Already initialized, so let's call the callback immediatly.
        initializeCallback();
    }
}

window.initialize = defaultInitialize;
window.registerInitialize = registerInitialize;
