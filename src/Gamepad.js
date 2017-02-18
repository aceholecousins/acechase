// Inherits from Control
"use strict";
function Gamepad(params) {
    Control.call(this, params);

    this.gpindex = params[3] - 1; // so the configuration can say 1 and we understand 0
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
}

Gamepad.prototype = Object.create(Control.prototype);
Gamepad.prototype.constructor = Gamepad;

Gamepad.prototype.update = function () {
    var gp = navigator.getGamepads()[this.gpindex];

    if (gp) {
        if (this.relative) {
            if (Math.abs(gp.axes[this.lraxis]) > 0.2) {
                this.direction -= this.lrsign * gp.axes[this.lraxis] * 5.0 * DT;
            }
        } else { //absolute direction control
            if (gp.axes[this.lraxis] * gp.axes[this.lraxis] + gp.axes[this.udaxis] * gp.axes[this.udaxis] > 0.6 * 0.6) {
                this.direction = Math.atan2(this.udsign * gp.axes[this.udaxis], this.lrsign * gp.axes[this.lraxis]);
            }
        }

        if (this.thrustIsAxis) {
            this.thrust = this.thrustsign * gp.axes[this.thrustaxis];
            if (this.thrust < 0) {
                this.thrust = 0;
            }
        } else {
            this.thrust = gp.buttons[this.thrustbutton].value;
        }

        this.fire = gp.buttons[this.firebutton].value;
        this.special = gp.buttons[this.spclbutton].value;
    }
};