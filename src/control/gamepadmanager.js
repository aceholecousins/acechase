//Manages gamepad assignment and gamepad control assignment in menu

GamepadManager = function() {
}

GamepadManager.start = function (playerIndex) {
	console.log("start gp manager");
	if(this.gamepadTimer === undefined) {
		this.gamepadTimer = setInterval(GamepadManager.update, 50);
	}
	
	this.currentButton = document.getElementById("gpidx_" + playerIndex);
	this.currentButton.style.backgroundColor = "yellow";
}

GamepadManager.stop = function() {
	console.log("stop gp manager");
	if(this.gamepadTimer !== undefined) {
		clearInterval(this.gamepadTimer);
		this.gamepadTimer = undefined;
	}
}

GamepadManager.update = function() {
	//console.log("update");
	let gamepadList = navigator.getGamepads();
	for(let i = 0; i < gamepadList.length; i++) {
		let gamepad = gamepadList[i];
		if(gamepad != null && gamepad.connected == true) {
			
			gamepad.axes.forEach(function(value, index) {
				if(Math.abs(value) > 0.5) {
					GamepadManager.triggered(gamepad, i, index, -1);
				}
			});
			gamepad.buttons.forEach(function(button, index) {	
				if(button.pressed == true) {
					GamepadManager.triggered(gamepad, i, -1, index);
				}
			});
		}
	};
}

GamepadManager.triggered = function(gamepad, iGamepad, iAxis, iButton) {
	console.log("Gamepad[" + i + "]: " + gamepad.index + ", " + gamepad.id + ", " + gamepad.connected);
	
	this.currentButton.innerHTML = iGamepad + 1;
	this.currentButton.style.backgroundColor = "#f0f8ff";
	
	if(iAxis >= 0) {
		console.log("	Axis[" + iAxis + "] " + gamepad.axes[iAxis]);
	}
	if(iButton >= 0) {
		let button = gamepad.buttons[iButton];
		console.log("	Button[" + iButton + "] " + button.pressed + ", " + button.value);
	}
	
	GamepadManager.stop();
}