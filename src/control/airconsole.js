
AirControl = {};
(function (context) {
	airConsole = null;
	rateLimiter = null;
	controllers = new Map();
	eventSupport = new EventSupport();

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

	onConnect = function (device_id) {
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

	onDisconnect = function (device_id) {
		console.log("AirController.onDisconnect: " + device_id);
		controllers.delete(device_id);
		// let controller = AirController.controllers.get(device_id);
		// if (controller !== undefined) {
		// 	controller.connected = false
		// }
	}

	onMessage = function (device_id, data) {
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

	onCustomDeviceStateChange = function (device_id, data) {
		//console.log("AirController.onCustomDeviceStateChange: " + device_id + ": ", data);
		let controller = controllers.get(device_id);

		if (controller !== undefined) {
			controller.onStateChange(data);
		}
	}
})(AirControl);


// Inherits from Control
"use strict";
function AirController(device_id) {
	Control.call(this);

	this.device_id = device_id;
	this.nickName = "No Name";
	this.color = new THREE.Color('black');
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
	if(data.fire !== undefined) {
		this.fire = data.fire
	}
	if(data.thrust !== undefined) {
		this.thrust = data.thrust;
	}
	if (data.direction !== undefined) {
		this.direction = data.direction;
	}
	if(data.spin !== undefined) {
		this.spin = data.spin;
	}
}

AirController.prototype.onStateChange = function (data) {
	const maxValue = 255;
	let color = data.color;
	if(color !== undefined) {
		this.color = new THREE.Color(color.red / maxValue, color.green / maxValue, color.blue / maxValue);
	}
}

AirController.prototype.update = function () {
	if (this.spin !== undefined && this.spin != 0) {
		this.direction += this.spin * 5.0 * DT;
	}
}

//Inherits from Property
AirProperty = function (value, maxValue, stateKey, deviceId) {
	Property.call(this, value);
	this.maxValue = maxValue;
	this.stateKey = stateKey;
	this.deviceId = deviceId;
}

AirProperty.prototype = Object.create(Property.prototype);
AirProperty.prototype.constructor = AirProperty;

AirProperty.prototype.set = function (value) {
	//Trim old and new value in order to not send changes if trimmed values did not change.
	trimmedOldValue = this.trim(this.value);
	trimmedNewValue = this.trim(value);

	//Set un-trimmed value by intention
	Property.prototype.set.call(this, value);

	if (trimmedNewValue != trimmedOldValue) {
		normalizedValue = trimmedNewValue / this.maxValue;

		message = {};
		message[this.stateKey] = normalizedValue;
		AirControl.sendMessage(this.deviceId, message);
	}
}

AirProperty.prototype.trim = function (value) {
	return Math.max(0, Math.min(this.maxValue, value));
}