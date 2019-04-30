
AirControl = {};
(function (context) {
	acInstance = null;
	controllers = new Map();
	eventSupport = new EventSupport();

	context.GAME_STATES = { menu: "menu", game: "game" };

	context.init = function () {
		acInstance = new AirConsole()
		acInstance.onConnect = onConnect;
		acInstance.onDisconnect = onDisconnect;
		acInstance.onMessage = onMessage;
	}

	context.getControllers = function() {
		return controllers;
	}

	context.setGameState = function (state) {
		acInstance.setCustomDeviceStateProperty("state", state);
	}

	context.addEventHandler = function (handler) {
		eventSupport.addHandler(handler);
	}
	
	context.removeEventHandler = function (handler) {
		eventSupport.removeHandler(handler);
	}
	
	onConnect = function (device_id) {
		console.log("AirController.onConnect: " + device_id);

		// see if we already know this device and it just reconnects
		let controller = controllers.get(device_id);
		if (controller !== undefined) {
			controller.connected = true
		} else {
			// if its a new device create a new controller instance
			let newController = new AirController(device_id);
			newController.nickName = acInstance.getNickname(device_id)
			controllers.set(device_id, newController);
		}
	}

	onDisconnect = function (device_id) {
		console.log("AirController.onDisconnect: " + device_id);
		controllers.delete(device_id);
		// let controller = AirController.controllers.get(device_id);
		// if (controller !== undefined) {
		// 	controller.connected = false
		// }
	}

	onMessage = function (device_id, data) {
		console.log("AirController.onMessage: " + device_id + ": ", data);
		let controller = controllers.get(device_id);

		if (controller !== undefined) {
			switch (data.type) {
				case 'menu':
					controller.onMenuMessage(data.navi, eventSupport);
					break;
				case 'control':
					controller.onControllerMessage(data);
					break;
			}
		}
	}
})(AirControl);


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

AirController.prototype.onMenuMessage = function (navi, eventSupport) {
	switch (navi) {
		case "right":
			eventSupport.fireEvent({ type: "menu", value: "right", controller: this });
			break;
		case "left":
			eventSupport.fireEvent({ type: "menu", value: "left", controller: this });
			break;
		case "go":
			eventSupport.fireEvent({ type: "menu", value: "enter", controller: this });
			break;
	}
}

AirController.prototype.onControllerMessage = function (data) {

	this.fire = data.fire
	this.thrust = data.thrust;
	this.direction = data.direction;
}