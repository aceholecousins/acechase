
// Inherits from Control
"use strict";
function AirController(device_id) {
	Control.call(this);
	this.device_id = device_id;
	this.connected = true;
}

AirController.prototype = Object.create(Control.prototype);
AirController.prototype.constructor = AirController;


AirController.acInstance;
AirController.players = new Map();

AirController.init = function(){

	let acInstance = AirController.acInstance = new AirConsole()

	acInstance.onConnect = AirController.onConnect;
	acInstance.onDisconnect = AirController.onDisconnect;
	acInstance.onMessage = AirController.onMessage;
}	

AirController.onConnect = function(device_id){
	console.log("AirController.onConnect: " + device_id);
	let players = AirController.players;

	// see if we already know this device and it just reconnects
	let player = players.get(device_id);
	if(player !== undefined){
		player.connected = true
	} else {
		// if its a new device create a new player
		let newPlayer = new AirController(device_id);
		newPlayer.playerName = AirController.acInstance.getNickname(device_id)
		players.set(device_id, newPlayer);
	}
}

AirController.onDisconnect = function(device_id) {
	console.log("AirController.onDisconnect: " + device_id);
	let player = AirController.players.get(device_id);
	if(player !== undefined){
		player.connected = false
	}
}

AirController.onMessage = function(device_id, data) {
	console.log("AirController.onMessage: " + device_id, + ": " + data);
	let player = AirController.players.get(device_id);

	if(player !== undefined){

		switch (data[0]) {
			case 'f': // fire
			player.fire = data[1]
				break
			case 's': // steer
				var x = data[1]
				var y = data[2]
				player.thrust = Math.sqrt(x*x + y*y)
				if(player.thrust > 0){
					player.direction = Math.atan2(y, x)
				}
				break
		}
	}
}



