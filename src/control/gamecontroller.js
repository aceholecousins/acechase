
// depends on scene.js

function GameController(){
    this.eventSupport = new EventSupport();
    this.control = new Control();
}

GameController.EventTypes = {pause: "pause"}

GameController.createControl = function(configValues) { // player config string including name and color
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
            return new GameController(params);
    }
}

GameController.prototype.setControl = function(control) {
    this.control = control;
}

GameController.prototype.update = function(){
    // Nothing done in the base class. Sub classes have to override this method
    // TODO: test all the control modalities
}

GameController.prototype.pausePressed = function() {
    this.eventSupport.fireEvent({type: GameController.EventTypes.pause});
}

GameController.prototype.addEventHandler = function(handler) {
    this.eventSupport.addHandler(handler);
}

GameController.prototype.removeEventHandler = function(handler) {
    this.eventSupport.removeHandler(handler);
}