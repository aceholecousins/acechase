
var AIR_CONSOLE = false;

function initAirConsole(){

	AIR_CONSOLE = new AirConsole()

	AIR_CONSOLE.onConnect = function(device_id){
		var newPlayer = true

		// see if we already know this device and it just reconnects
		for(var i=0; i<hovers.length; i++){
			if(device_id == hovers[i].control.device_id){
				newPlayer = false
				hovers[i].control.connected = true
				break;
			}
		}

		// if its a new device create a new player
		if(newPlayer){
			iPlayer = hovers.length

			hovers[iPlayer] = new Hovercraft(
				new THREE.Color("red"),
				Control.createControl("-,-,ac," + device_id))
			hovers[iPlayer].playerName = AIR_CONSOLE.getNickname(device_id)
			hovers[iPlayer].initNewRound(iPlayer)
		}
	}

	AIR_CONSOLE.onDisconnect = function(device_id) {
		for(var i=0; i<hovers.length; i++){
			if(device_id == hovers[i].control.device_id){
				hovers[i].control.connected = false
				break
			}
		}
	}

	AIR_CONSOLE.onMessage = function(device_id, data) {

		var i=0;

		for(i=0; i<hovers.length; i++){
			if(device_id == hovers[i].control.device_id){
				break
			}
		}

		if(i >= hovers.length){return}

		switch (data[0]) {
			case 'f': // fire
				hovers[i].control.fire = data[1]
				break
			case 's': // steer
				var x = data[1]
				var y = data[2]
				hovers[i].control.thrust = Math.sqrt(x*x + y*y)
				if(hovers[i].control.thrust > 0){
					hovers[i].control.direction = Math.atan2(y, x)
				}
				break
		}
	}

}


// Inherits from Control
"use strict";
function AirController(params) {
	Control.call(this);
	this.device_id = params[3]*1;
	this.connected = true;
}

AirController.prototype = Object.create(Control.prototype);
AirController.prototype.constructor = AirController;
