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


// depends on nothing

// class for sequential code execution
// after creation, items can be added to it
// then a callback has to be defined that will be called when all items are done

// make sure that you define the callback when there are some items already,
// otherwise it will be called immediately

// can be used if for instance some files need to be loaded until a piece of
// code can be executed

function Checklist(){
    this.items = [];
    this.done = [];
    this.callback = {};
    this.timerID = {};

    this.addItem = function(name){
        this.items.push(name);
        this.done.push(false);
    }

    this.checkItem = function(name){
        this.done[this.items.indexOf(name)] = true;
    }

    this.setCallback = function(callback){
        this.callback = callback;
        this.timerID = setInterval(function(obj){
            var allDone = true;
            for(var i=0; i<obj.done.length; i++){
                if(!obj.done[i]){
                    allDone = false;
                    break;
                }
            }
            if(allDone){
                clearInterval(obj.timerID);
                obj.callback();
                obj.callback = {};
            }
        }, 50, this); // call every 50ms
    }
}
