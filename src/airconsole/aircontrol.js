"use strict";
var AirControl = {};
(function (context) {
	var airConsole = null;
	var rateLimiter = null;
	var controllers = new Map();
	var eventSupport = new EventSupport();

	context.GAME_STATES = { menu: "menu", game: "game" };

	context.init = function () {
		airConsole = new AirConsole();
		rateLimiter = new RateLimiter(airConsole);
		airConsole.onConnect = onConnect;
		airConsole.onDisconnect = onDisconnect;
		airConsole.onMessage = onMessage;
		airConsole.onCustomDeviceStateChange = onCustomDeviceStateChange;
	}

	context.getControllers = function () {
		return controllers;
	}

	context.setGameState = function (state) {
		rateLimiter.setCustomDeviceStateProperty("state", state);
	}

	context.sendMessage = function (deviceId, data) {
		rateLimiter.message(deviceId, data);
	}

	context.addEventHandler = function (handler) {
		eventSupport.addHandler(handler);
	}

	context.removeEventHandler = function (handler) {
		eventSupport.removeHandler(handler);
	}

	var onConnect = function (device_id) {
		console.log("AirController.onConnect: " + device_id);

		// see if we already know this device and it just reconnects
		let controller = controllers.get(device_id);
		if (controller !== undefined) {
			controller.connected = true
		} else {
			// if its a new device create a new controller instance
			let newController = new AirController(device_id);
			newController.nickName = airConsole.getNickname(device_id)
			controllers.set(device_id, newController);
		}
	}

	var onDisconnect = function (device_id) {
		console.log("AirController.onDisconnect: " + device_id);
		controllers.delete(device_id);
		// let controller = AirController.controllers.get(device_id);
		// if (controller !== undefined) {
		// 	controller.connected = false
		// }
	}

	var onMessage = function (device_id, data) {
		//console.log("AirController.onMessage: " + device_id + ": ", data);
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

	var onCustomDeviceStateChange = function (device_id, data) {
		//console.log("AirController.onCustomDeviceStateChange: " + device_id + ": ", data);
		let controller = controllers.get(device_id);

		if (controller !== undefined) {
			controller.onStateChange(data);
		}
	}
})(AirControl);




