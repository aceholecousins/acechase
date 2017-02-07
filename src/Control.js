
// depends on scene.js

function Control(device){
	this.device = device; // 'mouse' or 'keyboard' or 'gamepad0' .. 'gamepad127'
	this.direction = 0; // target direction, 0=left, pi/2=up, -pi/2=down
	this.turn = 0; // whether the hover should turn or not (and how fast)
	this.thrust = 0;
	this.fire1 = 0; // primary fire (phaser)
	this.fire2 = 0; // secondary fire (collected item)
}

// new control scheme, relative direction control, auto fire:
Control.prototype.update = function(){

	if(this.device == "keyboard"){
		this.direction += (KEYDOWN[65]-KEYDOWN[68]) * 5.0 * DT; // wasd
		this.turn = 1;
		this.thrust = KEYDOWN[87]; // w
		//this.thrust = KEYDOWN[17]; // ctrl
		this.fire1 = KEYDOWN[32]; // auto phaser
		this.fire2 = KEYDOWN[32]; // space
	}

	else if(this.device == "mouse"){
		
		// TODO: when spinning mouse player fast, the frame rate goes down which makes no sense

		var mousevx = MOUSE.vx;	
		var mousevy = MOUSE.vy;
		var mousev = Math.sqrt(mousevx*mousevx + mousevy*mousevy);
		if(mousev > 10){
			mousevx = mousevx/mousev*10;
			mousevy = mousevy/mousev*10;
		}
		this.direction += (Math.cos(this.direction) * mousevy - Math.sin(this.direction) * mousevx) * DT;
		
		this.turn = 1;
		//this.fire1 = 1;

		if(MOUSE.buttonL){this.fire1 = 1;} 
		else{this.fire1 = 0;}

		if(MOUSE.buttonR){this.thrust = 1;}
		else{this.thrust = 0;}
	}

	else if(this.device.slice(0,7) == "gamepad"){ // TODO: gamepad different under Windows/Linux
		var igp = parseInt(this.device.slice(7));
		igp--; // so we start at 1
		var gp = navigator.getGamepads()[igp];

		if(gp){

			if(Math.abs(gp.axes[0]) > 0.2){
				this.direction -= gp.axes[0] * 5.0 * DT;
			}
			
			this.turn = 1;

			
			if(gp.buttons[0].value){this.fire1 = 1;}
			else{this.fire1 = 0;}

			//this.fire1 = 1;
			
			shouldervalue = 0.5 * (gp.axes[4] + 1);
			this.thrust = shouldervalue > 0.1 ? shouldervalue : 0;

			this.thrust += gp.buttons[5].value;
			if(this.thrust>1){this.thrust = 1;}

			//for(var i=0; i<gp.buttons.length; i++){if(gp.buttons[i].value >0){console.log(i);}}
		}
	}
}

// old control scheme, absolute direction control
Control.prototype.update2 = function(){

	if(this.device == "keyboard"){
		this.direction = Math.atan2(KEYDOWN[87]-KEYDOWN[83], KEYDOWN[68]-KEYDOWN[65]); // wasd
		this.turn = KEYDOWN[65] || KEYDOWN[68] || KEYDOWN[83] || KEYDOWN[87];
		this.thrust = KEYDOWN[65] || KEYDOWN[68] || KEYDOWN[83] || KEYDOWN[87];
		//this.thrust = KEYDOWN[17]; // ctrl
		this.fire1 = KEYDOWN[32]; // space
		this.fire2 = KEYDOWN[18]; // alt
	}

	else if(this.device == "mouse"){
		this.direction = Math.atan2(MOUSE.vy, MOUSE.vx);
		var abs = Math.sqrt(Math.pow(MOUSE.vx,2) + Math.pow(MOUSE.vy,2));

		if(abs > 1){
			this.turn = (abs-1)*0.4;
			if(this.turn > 1){this.turn = 1;}
		}
		else{this.turn = 0;}

		if(abs > 7){this.thrust = 1;}
		else{this.thrust = 0;}

		if(MOUSE.buttonL){this.fire1 = 1;}
		else{this.fire1 = 0;}

		if(MOUSE.buttonR){this.fire2 = 1;}
		else{this.fire2 = 0;}
	}

	else if(this.device.slice(0,7) == "gamepad"){
		var igp = parseInt(this.device.slice(7));
		var gp = navigator.getGamepads()[igp];

		if(gp){

			this.direction = Math.atan2(-gp.axes[1], gp.axes[0]);
			var abs = Math.sqrt(Math.pow(gp.axes[0],2) + Math.pow(gp.axes[1],2));

			if(abs > 0.2){
				this.turn = (abs-0.2)*2;
				if(this.turn > 1){this.turn = 1;}
			}
			else{this.turn = 0;}

			if(abs > 0.9){this.thrust = 1;}
			else{this.thrust = 0;}

			if(gp.buttons[0].value){this.fire1 = 1;}
			else{this.fire1 = 0;}

			if(gp.buttons[1].value){this.fire2 = 1;}
			else{this.fire2 = 0;}
		}
	}
}

// mouse

var MOUSE = {
	vx:0,
	vy:0,
	buttonL:false,
	buttonM:false,
	buttonR:false
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
		if(event.button == 0){MOUSE.buttonL = true;}
		else if(event.button == 1){MOUSE.buttonM = true;}
		else if(event.button == 2){MOUSE.buttonR = true;}
	}
	else{
		MOUSE.buttonL = MOUSE.buttonM = MOUSE.buttonR = false;
	}
}, true);

document.addEventListener("mouseup", function(event){

	if(MOUSE_LOCKED()){
		if(event.button == 0){MOUSE.buttonL = false;}
		else if(event.button == 1){MOUSE.buttonM = false;}
		else if(event.button == 2){MOUSE.buttonR = false;}
	}
	else{
		MOUSE.buttonL = MOUSE.buttonM = MOUSE.buttonR = false;
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
