
// depends on scene.js

function Control(){
	// parameters read by the rest of the game:
	this.direction = 0; // target direction, 0=right, pi/2=up, -pi/2=down
	this.thrust = 0;
	this.fire = false; // primary fire (phaser)
    this.special = false; // secondary fire (collected item)
    this.eventSupport = new EventSupport();
}

Control.EventTypes = {pause: "pause"}

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

Control.prototype.pausePressed = function() {
    this.eventSupport.fireEvent({type: Control.EventTypes.pause});
}

Control.prototype.addEventHandler = function(handler) {
    this.eventSupport.addHandler(handler);
}

Control.prototype.removeEventHandler = function(handler) {
    this.eventSupport.removeHandler(handler);
}