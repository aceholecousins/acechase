// Inherits from GameController
"use strict";
function AirController(device_id) {
	GameController.call(this);

	this.device_id = device_id;
	this.nickName = "No Name";
	this.color = new THREE.Color('black');
	this.connected = true;
}

AirController.prototype = Object.create(GameController.prototype);
AirController.prototype.constructor = AirController;

AirController.prototype.onConnect = function() {
	console.log("AirController re-connected", this.device_id);
	this.connected = true;
}

AirController.prototype.onDisconnect = function() {
	console.log("AirController disconnected", this.device_id);
	this.connected = false;

	//Reset all control parameters except direction
	this.control.thrust = 0;	
	this.control.fire = false;
	this.control.special = false;
	this.spin = 0;
}

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
		this.control.fire = data.fire
	}
	if(data.thrust !== undefined) {
		this.control.thrust = data.thrust;
	}
	if (data.direction !== undefined) {
		this.control.direction = data.direction;
	}
	if(data.spin !== undefined) {
		this.spin = data.spin;
	}
}

AirController.prototype.onStateChange = function (data, eventSupport) {
	const maxValue = 255;
	let color = data.color;
	if(color !== undefined) {
		this.color = new THREE.Color(color.red / maxValue, color.green / maxValue, color.blue / maxValue);
	}
	eventSupport.fireEvent({ type: "menu", value: "state", controller: this });
}

AirController.prototype.update = function () {
	if (this.spin !== undefined && this.spin != 0) {
		this.control.direction += this.spin * 5.0 * DT;
	}
}