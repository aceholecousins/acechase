class AirController extends GameController {
	
	constructor(device_id) {
		super();

		this.device_id = device_id;
		this.nickName = "No Name";
		this.color = new THREE.Color('black');
		this.connected = true;
	}


	onConnect() {
		console.log("AirController re-connected", this.device_id);
		this.connected = true;
	}

	onDisconnect() {
		console.log("AirController disconnected", this.device_id);
		this.connected = false;

		//Reset all control parameters except direction
		this.control.thrust = 0;	
		this.control.fire = false;
		this.control.special = false;
		this.spin = 0;
	}

	onMenuMessage (navi, eventSupport) {
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

	onControllerMessage(data) {
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

	onEventMessage(eventType) {
		if(eventType == "pause") {		
			this.pausePressed();
		}
	}

	onStateChange(data, eventSupport) {
		const maxValue = 255;
		let color = data.color;
		if(color !== undefined) {
			this.color = new THREE.Color(color.red / maxValue, color.green / maxValue, color.blue / maxValue);
		}
		eventSupport.fireEvent({ type: "menu", value: "state", controller: this });
	}

	update() {
		if (this.spin !== undefined && this.spin != 0) {
			this.control.direction += this.spin * 5.0 * DT;
		}
	}
}