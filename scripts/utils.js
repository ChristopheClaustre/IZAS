// constant

const homepage = window.location.protocol + "//" + window.location.host + (window.location.host.startsWith("127.0.0.1") ? "/" : "/IZAS/" );

// Utils function

function gotoUrl(url) { window.open(url, "_self"); }

function gotoHomepage() { gotoUrl(homepage); }

function constructUrl(player, partyID) { return homepage + (player ? "PJ" : "MJ") + "/?partyID=" + partyID; } 

function throwError(msg)
{
    alert("Error: " + msg + "\nYou will be redirected to home page.");
    gotoHomepage();
}

function bindEvent(element, type, handler) {
    if (element.addEventListener) {
        element.addEventListener(type, handler, false);
    } else {
        element.attachEvent('on'+type, handler);
    }
}
