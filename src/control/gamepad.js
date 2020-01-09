// Inherits from GameController
"use strict";
function Gamepad(params) {
    GameController.call(this);

    this.gpindex = params[3] - 1; // so the configuration can say 1 and we understand 0
    this.gamepad;
    this.relative = params[4] == "rel"; // false for absolute direction control
    this.lraxis = params[5].slice(2, 3);
    this.lrsign = 1;
    if (params[5].slice(1, 2) == "-") {
        this.lrsign = -1;
    }
    this.udaxis = params[6].slice(2, 3);
    this.udsign = 1;
    if (params[6].slice(1, 2) == "-") {
        this.udsign = -1;
    }
    this.thrustIsAxis = params[7].slice(0, 1) == "a"; // false for button
    if (this.thrustIsAxis) {
        this.thrustsign = 1;
        if (params[7].slice(1, 2) == "-") {
            this.thrustsign = -1;
        }
        this.thrustaxis = params[7].slice(2, 3) * 1;
    } else {
        this.thrustbutton = params[7].slice(1, 3) * 1;
    }
    this.firebutton = params[8].slice(1, 3) * 1;
    this.spclbutton = params[9].slice(1, 3) * 1;

    this.pausebutton = 9;

    this.lastPauseButtonState = false;
}

Gamepad.prototype = Object.create(GameController.prototype);
Gamepad.prototype.constructor = Gamepad;

Gamepad.prototype.initGamepad = function() {
    this.gamepad = navigator.getGamepads()[this.gpindex];
    if(this.gamepad) {        
        if(this.gamepad.mapping == "standard") {
            this.pausebutton = 9;
        } else {
            this.pausebutton = 7;
        }
    }
}

Gamepad.prototype.update = function () {

    this.initGamepad();    

    if (this.gamepad) {
        if (this.relative) {
            if (Math.abs(this.gamepad.axes[this.lraxis]) > 0.2) {
                this.control.direction -= this.lrsign * this.gamepad.axes[this.lraxis] * 5.0 * DT;				
            }
        } else { //absolute direction control
            if (this.gamepad.axes[this.lraxis] * this.gamepad.axes[this.lraxis] + this.gamepad.axes[this.udaxis] * this.gamepad.axes[this.udaxis] > 0.6 * 0.6) {
                this.control.direction = Math.atan2(this.udsign * this.gamepad.axes[this.udaxis], this.lrsign * this.gamepad.axes[this.lraxis]);
            }
        }

        if (this.thrustIsAxis) {
            this.control.thrust = this.thrustsign * this.gamepad.axes[this.thrustaxis];
            if (this.control.thrust < 0) {
                this.control.thrust = 0;
            }
        } else {
            this.control.thrust = this.gamepad.buttons[this.thrustbutton].value;
        }

        this.control.fire = this.gamepad.buttons[this.firebutton].value;
        this.control.special = this.gamepad.buttons[this.spclbutton].value;

        let currentPauseButtonState = this.gamepad.buttons[this.pausebutton].pressed;
        if(this.lastPauseButtonState != currentPauseButtonState) {
            this.lastPauseButtonState = currentPauseButtonState;
            this.pausePressed();
        }
    }
};