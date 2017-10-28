// Tools

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    var cookie = cname + "=" + cvalue.replaceAll(";", "|") + ";" + expires + ";path=/";
    document.cookie = cookie;
    console.log("Cookie written: " + cookie);
    console.log("Verify: " + document.cookie);
}

function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
			let returnString = c.substring(name.length, c.length).replaceAll("|", ";");
			console.log("Cookie read: " + cname + ": "+ returnString);
            return returnString;
        }
    }
    return "";
}