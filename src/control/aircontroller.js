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