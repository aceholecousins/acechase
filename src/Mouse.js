// Inherits from Control
"use strict";
function Mouse(params) {
    Control.call(this, params);

    this.relative = params[3] == "rel"; // false for absolute direction control
    this.thrustbutton = 2;
    this.firebutton = 0;
    if (params[4] == "lr") {
        this.thrustbutton = 2;
        this.firebutton = 0;
    }
    this.spcltrigger = params[5];

    this.vx = 0;
    this.vy = 0;
    this.button = [false, false, false], // L M R
    this.lr = false;
    this.scrolled = false;
    this.lastLdown = -1000; // for detecting LR click
    this.lastRdown = -1000;

    document.addEventListener("mousemove", this.handleMouseMove.bind(this), true);
    document.addEventListener("mousedown", this.handleMouseDown.bind(this), true);
    document.addEventListener("mouseup", this.handleMouseUp.bind(this), true);
    document.addEventListener("onscroll", this.handleOnScroll.bind(this), true);
}

Mouse.prototype = Object.create(Control.prototype);
Mouse.prototype.constructor = Mouse;

Mouse.prototype.update = function () {
    // TODO: when spinning mouse player fast, the frame rate goes down which makes no sense

    var mousevx = this.vx;
    var mousevy = this.vy;
    var mousev = Math.sqrt(mousevx * mousevx + mousevy * mousevy);

    if (this.relative) {
        if (mousev > 30) {
            mousevx = mousevx / mousev * 10;
            mousevy = mousevy / mousev * 10;
        }
        this.direction += (Math.cos(this.direction) * mousevy - Math.sin(this.direction) * mousevx) * DT;
    } else { //absolute direction control
        if (mousev > 5) { //TODO: tweak this parameter
            this.direction = Math.atan2(mousevy, mousevx);
        }
    }

    this.thrust = this.button[this.thrustbutton];
    this.fire = this.button[this.firebutton];
    this.special = false;
    if (this.spcltrigger == "ws" && this.scrolled) { // wheel scroll
        this.special = true;
    }
    if (this.spcltrigger == "wp" && this.button[1]) { // wheel press
        this.special = true;
    }
    if (this.spcltrigger == "lr" && this.lr) { // simultaneous left+right click
        this.special = true;
    }
    
    // Reset some controls
    this.scrolled = false;
    this.lr = false;
};

Mouse.prototype.handleMouseMove = function (event) {

    if (this.isMouseLocked()) {
        this.vx = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        this.vy = -(event.movementY || event.mozMovementY || event.webkitMovementY || 0);
    } else {
        this.vx = 0;
        this.vy = 0;
    }
};

Mouse.prototype.handleMouseDown = function (event) {
    if (this.isMouseLocked()) {
        this.button[event.button] = true;
        if (event.button == 0) {
            this.lastLdown = INGAME_TIME;
            if (this.lastLdown - this.lastRdown < 0.1) { //TODO: tweak this parameter
                this.lr = true;
            }
        }
        if (event.button == 2) {
            this.lastRdown = INGAME_TIME;
            if (this.lastRdown - this.lastLdown < 0.1) {
                this.lr = true;
            }
        }
    } else {
        for (var i = 0; i < this.button.length; i++) {
            this.button[i] = false;
        }
    }
};

Mouse.prototype.handleMouseUp = function (event) {
    if (this.isMouseLocked()) {
        this.button[event.button] = false;
    } else {
        for (var i = 0; i < this.button.length; i++) {
            this.button[i] = false;
        }
    }
};

Mouse.prototype.handleOnScroll = function (event) {
    if (this.isMouseLocked()) {
        this.scrolled = true;
    } else {
        this.scrolled = false;
    }
};

Mouse.prototype.isMouseLocked = function () {
    return document.pointerLockElement === RENDERER.domElement ||
            document.mozPointerLockElement === RENDERER.domElement ||
            document.webkitPointerLockElement === RENDERER.domElement;
}

RENDERER.domElement.requestPointerLock =
	RENDERER.domElement.requestPointerLock ||
	RENDERER.domElement.mozRequestPointerLock ||
	RENDERER.domElement.webkitRequestPointerLock;

RENDERER.domElement.onclick = function () {
    if (DEBUG < 2) {
        RENDERER.domElement.requestPointerLock();
    }
}