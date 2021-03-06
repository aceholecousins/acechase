class Keyboard extends GameController {
    constructor(params) {
        super();

        this.relative = params[3] == "rel"; // false for absolute direction control
        this.lkey = params[4] * 1; // *1 for string to int
        this.rkey = params[5] * 1;
        this.ukey = params[6] * 1;
        this.dkey = params[7] * 1;
        this.thrustkey = params[8] * 1;
        this.firekey = params[9] * 1;
        this.spclkey = params[10] * 1;

        this.keyDownMap = [];
        for (let i = 0; i < 256; i++) {
            this.keyDownMap[i] = false;
        }
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
    }

    update() {
        if (this.relative) {
            this.control.direction += (this.keyDownMap[this.lkey] - this.keyDownMap[this.rkey]) * 5.0 * DT;
        } else { // absolute direction control
            if (this.keyDownMap[this.lkey] - this.keyDownMap[this.rkey] != 0 || this.keyDownMap[this.ukey] - this.keyDownMap[this.dkey] != 0) {
                this.control.direction = Math.atan2(this.keyDownMap[this.ukey] - this.keyDownMap[this.dkey], this.keyDownMap[this.rkey] - this.keyDownMap[this.lkey]);
            }
        }
        this.control.thrust = this.keyDownMap[this.thrustkey];
        this.control.fire = this.keyDownMap[this.firekey];
        this.control.special = this.keyDownMap[this.specialkey];
    }

    handleKeyDown(event) {
        if(!event.repeat) {
            this.keyDownMap[event.keyCode] = true;
            if(Keyboard.PAUSE_KEYS.indexOf(event.keyCode) != -1) {
                this.pausePressed();
            }
        }
    }

    handleKeyUp(event) {
        this.keyDownMap[event.keyCode] = false;
    }
}

Keyboard.PAUSE_KEYS = [80, 19];
