//Manages gamepad assignment and gamepad control assignment in menu
class GamepadManager {

	static start(playerIndex, button) {
		console.log("start gp manager");
		if (this.gamepadTimer === undefined) {
			this.gamepadTimer = setInterval(GamepadManager.update, 50);
		}

		GamepadManager.initAllButtons(playerIndex);

		if (this.currentButton !== undefined) {
			this.currentButton.style.backgroundColor = "#f0f8ff";
		}
		this.currentButton = button;
		this.currentButton.style.backgroundColor = "yellow";
	}

	static stop() {
		console.log("stop gp manager");
		if (this.gamepadTimer !== undefined) {
			clearInterval(this.gamepadTimer);
			this.gamepadTimer = undefined;
		}
	}

	static initAllButtons(playerIndex) {
		this.indexButton = get("gpidx_");
		this.axisButtons = [get("gplr_"), get("gpud_"), get("gpthrust_")];
		this.buttonButtons = [get("gpthrust_"), get("gpfire_"), get("gpspcl_")];

		function get(prefix) {
			return document.getElementById(prefix + playerIndex);
		}
	}

	static update() {
		//console.log("update");
		let gamepadList = navigator.getGamepads();
		for (let i = 0; i < gamepadList.length; i++) {
			let gamepad = gamepadList[i];
			if (gamepad != null && gamepad.connected == true) {

				gamepad.axes.forEach(function (value, index) {
					if (Math.abs(value) > 0.5) {
						GamepadManager.triggered(gamepad, i, index, -1);
					}
				});
				gamepad.buttons.forEach(function (button, index) {
					if (button.pressed == true) {
						GamepadManager.triggered(gamepad, i, -1, index);
					}
				});
			}
		};
	}

	static triggered(gamepad, iGamepad, iAxis, iButton) {
		console.log("Gamepad[" + i + "]: " + gamepad.index + ", " + gamepad.id + ", " + gamepad.connected);

		if (this.currentButton === this.indexButton) {
			this.currentButton.dataset.code = iGamepad + 1;
			finish(this.currentButton);
		}
		if (iAxis >= 0 && this.axisButtons.indexOf(this.currentButton) != -1) {
			let value = gamepad.axes[iAxis];
			this.currentButton.dataset.code = "a" + (value > 0 ? "+" : "-") + iAxis;
			console.log("	Axis[" + iAxis + "] " + value);
			finish(this.currentButton);
		}
		if (iButton >= 0 && this.buttonButtons.indexOf(this.currentButton) != -1) {
			let value = gamepad.buttons[iButton].value;
			this.currentButton.dataset.code = "b" + padWithZeroes(iButton);
			console.log("	Button[" + iButton + "] " + value);
			finish(this.currentButton);
		}

		function finish(button) {
			button.innerHTML = GamepadManager.codeToText(button.dataset.code);
			button.style.backgroundColor = "#f0f8ff";
			GamepadManager.stop();
		}
	}

	static fillButtonText(button, code) {
		button.dataset.code = code;
		button.innerHTML = GamepadManager.codeToText(code);
	}

	static codeToText(code) {
		if (code[0] == 'a') {
			return code[1] + " Axis " + code.slice(2);
		} else if (code[0] == 'b') {
			return "Button " + (code.slice(1) * 1);
		} else {
			return code;
		}
	}
}