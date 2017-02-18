
// depends on scene.js

function Control(params){ 
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
}

Control.createControl = function(configValues) { // player config string including name and color
    var params = configValues.split(',');
    switch (params[2]) {
        case 'md':
            return new MobileDevice(params);                        
        case 'ms':
            return new Mouse(params);            
        default:
            return new Control(params);            
    }
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
}

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

