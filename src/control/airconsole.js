
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
AirController.eventSupport = new EventSupport();

AirController.init = function () {

	let acInstance = AirController.acInstance = new AirConsole()

	acInstance.onConnect = AirController.onConnect;
	acInstance.onDisconnect = AirController.onDisconnect;
	acInstance.onMessage = AirController.onMessage;
}

AirController.onConnect = function (device_id) {
	console.log("AirController.onConnect: " + device_id);
	let players = AirController.players;

	// see if we already know this device and it just reconnects
	let player = players.get(device_id);
	if (player !== undefined) {
		player.connected = true
	} else {
		// if its a new device create a new player
		let newPlayer = new AirController(device_id);
		newPlayer.playerName = AirController.acInstance.getNickname(device_id)
		players.set(device_id, newPlayer);
	}
}

AirController.onDisconnect = function (device_id) {
	console.log("AirController.onDisconnect: " + device_id);
	let player = AirController.players.get(device_id);
	if (player !== undefined) {
		player.connected = false
	}
}

AirController.onMessage = function (device_id, data) {
	console.log("AirController.onMessage: " + device_id + ": " + data);
	let player = AirController.players.get(device_id);

	if (player !== undefined) {
		switch (data.type) {
			case 'menu':
				player.onMenuMessage(data.navi);
				break;
			case 'control':
				player.onControllerMessage(data);
				break;
		}
	}
}

AirController.prototype.onMenuMessage = function (navi) {
	switch (navi) {
		case "right":
			AirController.eventSupport.fireEvent({ type: "menu", value: "right", controller: this });
			break;
		case "left":
			AirController.eventSupport.fireEvent({ type: "menu", value: "left", controller: this });
			break;
		case "go":
			AirController.eventSupport.fireEvent({ type: "menu", value: "enter", controller: this });
			break;
	}
}

AirController.prototype.onControllerMessage = function (data) {

	this.fire = data.fire
	this.thrust = data.thrust;
	this.direction = data.direction;
}

AirController.addEventHandler = function (handler) {
	AirController.eventSupport.addHandler(handler);
}

AirController.removeEventHandler = function (handler) {
	AirController.eventSupport.removeHandler(handler);
}



