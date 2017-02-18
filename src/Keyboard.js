// Inherits from Control
"use strict";
function Keyboard(params) {
    Control.call(this);

    this.relative = params[3] == "rel"; // false for absolute direction control
    this.lkey = params[4] * 1; // *1 for string to int
    this.rkey = params[5] * 1;
    this.ukey = params[6] * 1;
    this.dkey = params[7] * 1;
    this.thrustkey = params[8] * 1;
    this.firekey = params[9] * 1;
    this.spclkey = params[10] * 1;

    this.keyDownMap = [];
    for (var i = 0; i < 256; i++) {
        this.keyDownMap[i] = false;
    }
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('keyup', this.handleKeyUp.bind(this));
}

Keyboard.prototype = Object.create(Control.prototype);
Keyboard.prototype.constructor = Keyboard;

Keyboard.prototype.update = function () {
    if (this.relative) {
        this.direction += (this.keyDownMap[this.lkey] - this.keyDownMap[this.rkey]) * 5.0 * DT;
    } else { // absolute direction control
        if (this.keyDownMap[this.lkey] - this.keyDownMap[this.rkey] != 0 || this.keyDownMap[this.ukey] - this.keyDownMap[this.dkey] != 0) {
            this.direction = Math.atan2(this.keyDownMap[this.ukey] - this.keyDownMap[this.dkey], this.keyDownMap[this.rkey] - this.keyDownMap[this.lkey]);
        }
    }
    this.thrust = this.keyDownMap[this.thrustkey];
    this.fire = this.keyDownMap[this.firekey];
    this.special = this.keyDownMap[this.specialkey];
};

Keyboard.prototype.handleKeyDown = function (event) {
    this.keyDownMap[event.keyCode] = true;
};

Keyboard.prototype.handleKeyUp = function (event) {
    this.keyDownMap[event.keyCode] = false;
};