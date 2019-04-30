
// Inherits from Control
"use strict";
function AirController(device_id) {
	Control.call(this);

	this.device_id = device_id;
	this.nickName = "No Name";
	this.connected = true;
}

AirController.prototype = Object.create(Control.prototype);
AirController.prototype.constructor = AirController;

AirController.acInstance;
AirController.controllers = new Map();
AirController.eventSupport = new EventSupport();

AirController.init = function () {

	let acInstance = AirController.acInstance = new AirConsole()

	acInstance.onConnect = AirController.onConnect;
	acInstance.onDisconnect = AirController.onDisconnect;
	acInstance.onMessage = AirController.onMessage;
}

AirController.onConnect = function (device_id) {
	console.log("AirController.onConnect: " + device_id);
	let controllers = AirController.controllers;

	// see if we already know this device and it just reconnects
	let controller = controllers.get(device_id);
	if (controller !== undefined) {
		controller.connected = true
	} else {
		// if its a new device create a new controller instance
		let newController = new AirController(device_id);
		newController.nickName = AirController.acInstance.getNickname(device_id)
		controllers.set(device_id, newController);
	}
}

AirController.onDisconnect = function (device_id) {
	console.log("AirController.onDisconnect: " + device_id);
	AirController.controllers.delete(device_id);
	// let controller = AirController.controllers.get(device_id);
	// if (controller !== undefined) {
	// 	controller.connected = false
	// }
}

AirController.onMessage = function (device_id, data) {
	console.log("AirController.onMessage: " + device_id + ": ",  data);
	let controller = AirController.controllers.get(device_id);

	if (controller !== undefined) {
		switch (data.type) {
			case 'menu':
				controller.onMenuMessage(data.navi);
				break;
			case 'control':
				controller.onControllerMessage(data);
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

const GAME_STATES = {menu: "menu", game: "game"};

AirController.setGameState = function(state) {
	AirController.acInstance.setCustomDeviceStateProperty("state", state);
}