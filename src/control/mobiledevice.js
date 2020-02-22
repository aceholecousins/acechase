// Inherits from GameController
"use strict";
function MobileDevice(params) {
    GameController.call(this);
	
	this.invertLeftRight = params[3] != 0 ? true : false;
	this.invertUpDown = params[4] != 0 ? true : false;
	this.sensitivity = params[5];
    this.deviceRotationMatrix = new THREE.Matrix4();
    this.gravityVector = new THREE.Vector3(0, 0, 1);
    this.touch = false;
    
    window.addEventListener('touchstart', this.handleTouchStart.bind(this));
    window.addEventListener('touchend', this.handleTouchEnd.bind(this));
    window.addEventListener('devicemotion', this.handleDeviceMotion.bind(this));
}

MobileDevice.prototype = Object.create(GameController.prototype);
MobileDevice.prototype.constructor = MobileDevice;

MobileDevice.THRUST_THRESHOLD = 0.1;
MobileDevice.ROTATE_THRESHOLD = 0.05;

MobileDevice.prototype.captureRotationMatrix = function () {
    var zVector = new THREE.Vector3(0, 0, 1);
    var initial = this.gravityVector.clone();
    var angle = zVector.angleTo(initial);
    initial.cross(zVector).normalize();
    this.deviceRotationMatrix.makeRotationAxis(initial, angle);
};

MobileDevice.prototype.update = function() {
    this.control.fire = this.touch;
            
    var thrustVector3D = this.gravityVector.clone();
    
    //Equalize device rotation    
    thrustVector3D.applyMatrix4(this.deviceRotationMatrix);
	
    //Use 2D components only
    var thrustVector2D = new THREE.Vector2(this.getInverter(this.invertUpDown) * (-thrustVector3D.x), this.getInverter(this.invertLeftRight) * (-thrustVector3D.y));
    
    //Equalize device orientation (landscape/portrait)
    thrustVector2D.rotateAround(new THREE.Vector2(), window.orientation * Math.PI / 180);

    var length = thrustVector2D.length() * this.sensitivity;
    if(length > MobileDevice.THRUST_THRESHOLD) {
        this.control.thrust = Math.min(length, 1);
    } else {
        this.control.thrust = 0;
    }

    if(length > MobileDevice.ROTATE_THRESHOLD) {
        this.control.direction = thrustVector2D.angle();
    }
};

MobileDevice.prototype.getInverter = function(invert) {
	return invert ? -1.0 : 1.0;
};

MobileDevice.prototype.handleTouchStart = function(event) {    
    if(event.touches.length > 1) {
        this.eventSupport.fireEvent({type: GameController.EventTypes.pause});
    } else {
        this.touch = true;
    }    
};

MobileDevice.prototype.handleTouchEnd = function(event) {    
    this.touch = false;
};

MobileDevice.prototype.handleDeviceMotion = function(event) {
	
    var acc = event.accelerationIncludingGravity;
    const gravity = 9.807;
    this.gravityVector.setX(acc.x);
    this.gravityVector.setY(acc.y);
    this.gravityVector.setZ(acc.z);
    this.gravityVector.divideScalar(gravity);
};