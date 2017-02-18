
// depends on scene.js

function Control(){ 
	// parameters read by the rest of the game:
	this.direction = 0; // target direction, 0=right, pi/2=up, -pi/2=down
	this.thrust = 0;
	this.fire = 0; // primary fire (phaser)
	this.special = 0; // secondary fire (collected item)
}

Control.createControl = function(configValues) { // player config string including name and color
    var params = configValues.split(',');
    switch (params[2]) {
        case 'md':
            return new MobileDevice(params);                        
        case 'ms':
            return new Mouse(params);
        case 'gp':
            return new Gamepad(params);
        case 'kb':
            return new Keyboard(params);
        default:
            return new Control(params);
    }
}

Control.prototype.update = function(){ 
    // Nothing done in the base class. Sub classes have to override this method
    // TODO: test all the control modalities
}
