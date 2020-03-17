class MobileDevice extends GameController {
    constructor(params) {
        super();
        
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

    captureRotationMatrix() {
        let zVector = new THREE.Vector3(0, 0, 1);
        let initial = this.gravityVector.clone();
        let angle = zVector.angleTo(initial);
        initial.cross(zVector).normalize();
        this.deviceRotationMatrix.makeRotationAxis(initial, angle);
    }

    update() {
        this.control.fire = this.touch;
                
        let thrustVector3D = this.gravityVector.clone();
        
        //Equalize device rotation    
        thrustVector3D.applyMatrix4(this.deviceRotationMatrix);
        
        //Use 2D components only
        let thrustVector2D = new THREE.Vector2(this.getInverter(this.invertUpDown) * (-thrustVector3D.x), this.getInverter(this.invertLeftRight) * (-thrustVector3D.y));
        
        //Equalize device orientation (landscape/portrait)
        thrustVector2D.rotateAround(new THREE.Vector2(), window.orientation * Math.PI / 180);

        let length = thrustVector2D.length() * this.sensitivity;
        if(length > MobileDevice.THRUST_THRESHOLD) {
            this.control.thrust = Math.min(length, 1);
        } else {
            this.control.thrust = 0;
        }

        if(length > MobileDevice.ROTATE_THRESHOLD) {
            this.control.direction = thrustVector2D.angle();
        }
    }

    getInverter(invert) {
	    return invert ? -1.0 : 1.0;
    }

    handleTouchStart(event) {    
        if(event.touches.length > 1) {
            this.eventSupport.fireEvent({type: GameController.EventTypes.pause});
        } else {
            this.touch = true;
        }
    }

    handleTouchEnd(event) {    
        this.touch = false;
    }

    handleDeviceMotion(event) {
        let acc = event.accelerationIncludingGravity;
        const gravity = 9.807;
        this.gravityVector.setX(acc.x);
        this.gravityVector.setY(acc.y);
        this.gravityVector.setZ(acc.z);
        this.gravityVector.divideScalar(gravity);
    }
}

MobileDevice.THRUST_THRESHOLD = 0.1;
MobileDevice.ROTATE_THRESHOLD = 0.05;