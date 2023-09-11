// constant

const homepage = window.location.protocol + "//" + window.location.host + (window.location.host.startsWith("127.0.0.1") ? "/" : "/IZAS/" );

// Utils function

function gotoHomepage() { window.open(homepage, "_self"); }

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
