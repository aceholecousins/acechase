
// depends on scene.js

function Control(configvalues){ // player config string including name and color
	
	var params = configvalues.split(',');

	// parameters read by the rest of the game:
	this.direction = 0; // target direction, 0=right, pi/2=up, -pi/2=down
	this.thrust = 0;
	this.fire = 0; // primary fire (phaser)
	this.special = 0; // secondary fire (collected item)

	// control input:
	this.device = params[2]; // 'ms' or 'kb' or 'gp' for mouse/keyboard/gamepad

	if(this.device == "gp"){
		this.gpindex = params[3]-1; // so the configuration can say 1 and we understand 0
		this.relative = params[4] == "rel"; // false for absolute direction control
		this.lraxis = params[5].slice(2,3);
		this.lrsign = 1;
		if(params[5].slice(1,2) == "-"){this.lrsign=-1;}
		this.udaxis = params[6].slice(2,3);
		this.udsign = 1;
		if(params[6].slice(1,2) == "-"){this.udsign=-1;}
		this.thrustIsAxis = params[7].slice(0,1) == "a"; // false for button
		if(this.thrustIsAxis){
			this.thrustsign = 1;
			if(params[7].slice(1,2) == "-"){this.thrustsign=-1;}
			this.thrustaxis = params[7].slice(2,3)*1;
		}
		else{
			this.thrustbutton = params[7].slice(1,3)*1;
		}
		this.firebutton = params[8].slice(1,3)*1;
		this.spclbutton = params[9].slice(1,3)*1;
	}

	if(this.device == "kb"){
		this.relative = params[3] == "rel"; // false for absolute direction control
		this.lkey = params[4]*1; // *1 for string to int
		this.rkey = params[5]*1;
		this.ukey = params[6]*1;
		this.dkey = params[7]*1;
		this.thrustkey = params[8]*1;
		this.firekey = params[9]*1;
		this.spclkey = params[10]*1;
	}

	if(this.device == "ms"){
		this.relative = params[3] == "rel"; // false for absolute direction control
		this.thrustbutton = 2;
		this.firebutton = 0;
		if(params[4] == "lr"){
			this.thrustbutton = 2;
			this.firebutton = 0;
		}
		this.spcltrigger = params[5];
	}
        
        calculateRotationMatrixFromCurrentOrientation();
}

function calculateRotationMatrixFromCurrentOrientation() {
    var zVector = new THREE.Vector3(0, 0, 1);
    var initial = SENSORS.gravityVector.clone();
    var angle = zVector.angleTo(initial);
    initial.cross(zVector).normalize();
    SENSORS.deviceRotationMatrix.makeRotationAxis(initial, angle);
}

// new control scheme, relative direction control, auto fire:
Control.prototype.update = function(){ // TODO: test all the control modalities

	if(this.device == "kb"){
		if(this.relative){
			this.direction += (KEYDOWN[this.lkey]-KEYDOWN[this.rkey]) * 5.0 * DT;		
		}
		else{ // absolute direction control
			if(KEYDOWN[this.lkey]-KEYDOWN[this.rkey]!=0 || KEYDOWN[this.ukey]-KEYDOWN[this.dkey]!=0){
				this.direction = Math.atan2(KEYDOWN[this.ukey]-KEYDOWN[this.dkey], KEYDOWN[this.rkey]-KEYDOWN[this.lkey]);
			}
		}
		this.thrust = KEYDOWN[this.thrustkey];
		this.fire = KEYDOWN[this.firekey];
		this.special = KEYDOWN[this.specialkey];
	}

	else if(this.device == "ms"){
		
		// TODO: when spinning mouse player fast, the frame rate goes down which makes no sense

		var mousevx = MOUSE.vx;	
		var mousevy = MOUSE.vy;
		var mousev = Math.sqrt(mousevx*mousevx + mousevy*mousevy);

		if(this.relative){
			if(mousev > 30){
				mousevx = mousevx/mousev*10;
				mousevy = mousevy/mousev*10;
			}
			this.direction += (Math.cos(this.direction) * mousevy - Math.sin(this.direction) * mousevx) * DT;
		}
		else{ //absolute direction control
			if(mousev >5){ //TODO: tweak this parameter
				this.direction = Math.atan2(mousevy, mousevx);
			}
		}
		
		this.thrust = MOUSE.button[this.thrustbutton];
		this.fire = MOUSE.button[this.firebutton];
		this.special = false;
		if(this.spcltrigger == "ws" && MOUSE.scrolled){ // wheel scroll
			this.special = true;
		}
		if(this.spcltrigger == "wp" && MOUSE.button[1]){ // wheel press
			this.special = true;
		}
		if(this.spcltrigger == "lr" && MOUSE.lr){ // simultaneous left+right click
			this.special = true;
		}

	}

	else if(this.device == "gp"){

		var gp = navigator.getGamepads()[this.gpindex];

		if(gp){
			if(this.relative){
				if(Math.abs(gp.axes[this.lraxis]) > 0.2){
					this.direction -= this.lrsign * gp.axes[this.lraxis] * 5.0 * DT;
				}
			}
			else{ //absolute direction control
				if(gp.axes[this.lraxis]*gp.axes[this.lraxis] + gp.axes[this.udaxis]*gp.axes[this.udaxis] > 0.6*0.6){
					this.direction = Math.atan2(this.udsign * gp.axes[this.udaxis], this.lrsign * gp.axes[this.lraxis]);
				}
			}

			if(this.thrustIsAxis){
				this.thrust = this.thrustsign * gp.axes[this.thrustaxis];
				if(this.thrust<0){this.thrust=0;}
			}
			else{
				this.thrust = gp.buttons[this.thrustbutton].value;
			}
	
			this.fire = gp.buttons[this.firebutton].value;
			this.special = gp.buttons[this.spclbutton].value;
		}
	}
        
        else if(this.device == 'md') {
            this.fire = SENSORS.touch;
            
            var thrustVector3D = SENSORS.gravityVector.clone();
            thrustVector3D.applyMatrix4(SENSORS.deviceRotationMatrix);            
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
        }
}

// mouse

var MOUSE = {
	vx:0,
	vy:0,
	button:[false,false,false], // L M R
	lr:false, // simultaneous click, reset in global update function
	scrolled:false, // reset in global update function
	lastLdown:-1000, // for detecting LR click
	lastRdown:-1000
}

RENDERER.domElement.requestPointerLock =
	RENDERER.domElement.requestPointerLock ||
	RENDERER.domElement.mozRequestPointerLock ||
	RENDERER.domElement.webkitRequestPointerLock;

RENDERER.domElement.onclick = function() {
	if(DEBUG<2){
		RENDERER.domElement.requestPointerLock();
	}
}

MOUSE_LOCKED = function(){
	return document.pointerLockElement === RENDERER.domElement ||
  		document.mozPointerLockElement === RENDERER.domElement ||
  		document.webkitPointerLockElement === RENDERER.domElement;
}

document.addEventListener("mousemove", function(event){

	if(MOUSE_LOCKED()){
		MOUSE.vx =   event.movementX || event.mozMovementX || event.webkitMovementX || 0;
		MOUSE.vy = -(event.movementY || event.mozMovementY || event.webkitMovementY || 0);
	}
	else{
		MOUSE.vx = 0;
		MOUSE.vy = 0;
	}

}, true);

document.addEventListener("mousedown", function(event){
	if(MOUSE_LOCKED()){
		MOUSE.button[event.button] = true;
		if(event.button==0){
			MOUSE.lastLdown = INGAME_TIME;
			if(MOUSE.lastLdown-MOUSE.lastRdown < 0.1){ //TODO: tweak this parameter
				MOUSE.lr = true;
			}
		}
		if(event.button==2){
			MOUSE.lastRdown = INGAME_TIME;
			if(MOUSE.lastRdown-MOUSE.lastLdown < 0.1){
				MOUSE.lr = true;
			}
		}
	}
	else{
		for(var i=0; i<MOUSE.button.length; i++){
			MOUSE.button[i] = false;
		}
	}
}, true);
document.addEventListener("mouseup", function(event){
	if(MOUSE_LOCKED()){
		MOUSE.button[event.button] = false;
	}
	else{
		for(var i=0; i<MOUSE.button.length; i++){
			MOUSE.button[i] = false;
		}
	}
}, true);
document.addEventListener("onscroll", function(event){
	if(MOUSE_LOCKED()){
		MOUSE.scrolled = true;
	}
	else{
		MOUSE.scrolled = false;
	}
}, true);

// keyboard

var KEYDOWN = [];
for(var i=0; i<256; i++){
	KEYDOWN[i] = false;
}

document.addEventListener('keydown', function(event) {
	KEYDOWN[event.keyCode] = true;
});
document.addEventListener('keyup', function(event) {
	KEYDOWN[event.keyCode] = false;
});

// mobile device

var SENSORS = {
    deviceRotationMatrix:new THREE.Matrix4(),
    gravityVector:new THREE.Vector3(),
    touch:false    
};

document.addEventListener('touchstart', function(event) {
    SENSORS.touch = true; 
});
document.addEventListener('touchend', function(event) {
    SENSORS.touch = false;
});

window.addEventListener('devicemotion', function(event) {
    var acc = event.accelerationIncludingGravity;
    const gravity = 9.807;
    SENSORS.gravityVector.setX(acc.x);
    SENSORS.gravityVector.setY(acc.y);
    SENSORS.gravityVector.setZ(acc.z);
    SENSORS.gravityVector.divideScalar(gravity);
});