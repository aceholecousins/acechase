
// depends on scene.js

class GameController {

    constructor() {
        this.eventSupport = new EventSupport();
        this.control = new Control();
    }

    static createControl(configValues) { // player config string including name and color
        const params = configValues.split(',');
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

    setControl(control) {
        this.control = control;
    }

    update() {
        // Nothing done in the base class. Sub classes have to override this method
        // TODO: test all the control modalities
    }

    pausePressed() {
        this.eventSupport.fireEvent({type: GameController.EventTypes.pause});
    }

    addEventHandler(handler) {
        this.eventSupport.addHandler(handler);
    }

    removeEventHandler(handler) {
        this.eventSupport.removeHandler(handler);
    }
}

GameController.EventTypes = {pause: "pause"};