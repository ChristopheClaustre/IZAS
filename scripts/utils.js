// constant

export const homepage = window.location.protocol + "//" + window.location.host + (window.location.host.startsWith("127.0.0.1") ? "/" : "/IZAS/" );

// Utils function

export function gotoUrl(url) { window.open(url, "_self"); }

export function gotoHomepage() { gotoUrl(homepage); }

export function throwError(msg)
{
    alert("Error: " + msg + "\nYou will be redirected to home page.");
    gotoHomepage();
}

export function updateURL(newURL) {
    window.history.replaceState('', '', newURL);
}

export function updateURLParameter(url, param, paramVal)
{
    var TheAnchor = null;
    var newAdditionalURL = "";
    var tempArray = url.split("?");
    var baseURL = tempArray[0];
    var additionalURL = tempArray[1];
    var temp = "";

    if (additionalURL) 
    {
        var tmpAnchor = additionalURL.split("#");
        var TheParams = tmpAnchor[0];
            TheAnchor = tmpAnchor[1];
        if(TheAnchor)
            additionalURL = TheParams;

        tempArray = additionalURL.split("&");

        for (var i=0; i<tempArray.length; i++)
        {
            if(tempArray[i].split('=')[0] != param)
            {
                newAdditionalURL += temp + tempArray[i];
                temp = "&";
            }
        }        
    }
    else
    {
        var tmpAnchor = baseURL.split("#");
        var TheParams = tmpAnchor[0];
            TheAnchor  = tmpAnchor[1];

        if(TheParams)
            baseURL = TheParams;
    }

    if(TheAnchor)
        paramVal += "#" + TheAnchor;

    var rows_txt = temp + "" + param + "=" + paramVal;
    return baseURL + "?" + newAdditionalURL + rows_txt;
}

export function bindEvent(element, type, handler) {
    if (element.addEventListener) {
        element.addEventListener(type, handler, false);
    } else {
        element.attachEvent('on'+type, handler);
    }
}

export function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}
