// Inherits from Control
"use strict";
function MobileDevice(params) {
    Control.call(this, params);
    
    this.deviceRotationMatrix = new THREE.Matrix4();
    this.gravityVector = new THREE.Vector3(0, 0, 1);
    this.touch = false;
    this.rotationMatrixCaptured = false;
    
    window.addEventListener('touchstart', this.handleTouchStart.bind(this));
    window.addEventListener('touchend', this.handleTouchEnd.bind(this));
    window.addEventListener('devicemotion', this.handleDeviceMotion.bind(this));
}

MobileDevice.prototype = Object.create(Control.prototype);
MobileDevice.prototype.constructor = MobileDevice;

MobileDevice.prototype.captureRotationMatrix = function () {
    var zVector = new THREE.Vector3(0, 0, 1);
    var initial = this.gravityVector.clone();
    var angle = zVector.angleTo(initial);
    initial.cross(zVector).normalize();
    this.deviceRotationMatrix.makeRotationAxis(initial, angle);
};

MobileDevice.prototype.update = function() {
    this.fire = this.touch;
            
    var thrustVector3D = this.gravityVector.clone();
    thrustVector3D.applyMatrix4(this.deviceRotationMatrix);            
    var thrustVector2D = new THREE.Vector2(thrustVector3D.y, -thrustVector3D.x);

    var length = thrustVector2D.length();
    if(length > 0.1) {
        this.thrust = Math.min(length * 3, 1);
    } else {
        this.thrust = 0;
    }

    if(length > 0.05) {
        this.direction = thrustVector2D.angle();
    }
};

MobileDevice.prototype.handleTouchStart = function(event) {
    this.touch = true;
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
    
    if(!this.rotationMatrixCaptured) {
        this.captureRotationMatrix();
        this.rotationMatrixCaptured = true;
    }
};