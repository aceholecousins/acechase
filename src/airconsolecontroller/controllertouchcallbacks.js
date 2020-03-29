
import AirConsoleInterface from "./airconsoleinterface.js"
import Controller from "./controller.js"

let ControllerTouchCallbacks = {};
(function(ctx){

ctx.menuLeft = function(){
	AirConsoleInterface.message({type:"menu", navi:"left"})
}

ctx.menuRight = function(){
	AirConsoleInterface.message({type:"menu", navi:"right"})
}

ctx.menuGo = function(){
	AirConsoleInterface.message({type:"menu", navi:"go"})
}

ctx.startFiring = function(){
	Controller.current.fire = 1
	Controller.sendControls()
}

ctx.stopFiring = function(){
	Controller.current.fire = 0
	Controller.sendControls()
}

ctx.moveStick = function(mx, my){
	var x = mx-Controller.sizes.joyHomeX
	var y = my-Controller.sizes.joyHomeY

	var dir = Math.atan2(-y, x)
	var r = Math.sqrt(x*x + y*y)/Controller.sizes.joyRange

	if(r < 0.01){x=y=r=0; dir=NaN;}
	if(r > 1.0){x/=r; y/=r; r=1.0;}

	Controller.current.direction = dir
	Controller.current.spin = NaN
	Controller.current.thrust = r
	Controller.sendControls()
	reposition("joystick", x + Controller.sizes.joyRange, y + Controller.sizes.joyRange)
}

ctx.releaseStick = function(){
	Controller.current.thrust = 0
	Controller.sendControls()
	reposition("joystick", Controller.sizes.joyRange, Controller.sizes.joyRange)
}

ctx.moveLever = function(mx, my){
	var x = mx-Controller.sizes.joyHomeX
	var y = my-Controller.sizes.joyHomeY

	if(x > Controller.sizes.joyRange){x = Controller.sizes.joyRange}
	if(x < -Controller.sizes.joyRange){x = -Controller.sizes.joyRange}
	if(y > Controller.sizes.joyRange){y = Controller.sizes.joyRange}
	if(y < -Controller.sizes.joyRange){y = -Controller.sizes.joyRange}

	Controller.current.direction = NaN
	Controller.current.spin = -x/Controller.sizes.joyRange
	Controller.current.thrust = (-y/Controller.sizes.joyRange + 1.0)/2.0
	Controller.sendControls()
	reposition("lever", x + Controller.sizes.joyRange, y + Controller.sizes.joyRange)
}

ctx.releaseLever = function(){
	Controller.current.direction = undefined
	Controller.current.spin = 0
	Controller.current.thrust = 0
	Controller.sendControls()
	reposition("lever", Controller.sizes.joyRange, Controller.sizes.joyRange*2.0)
}

ctx.changeController = function(select){
	var controllers = document.getElementsByClassName("controller")
	if(select==undefined){
		Controller.activeController = (Controller.activeController + 1) % controllers.length
	}
	else{
		Controller.activeController = select
	}
	for(var i=0; i<controllers.length; i++){
		controllers[i].style.display = "none"
	}
	controllers[Controller.activeController].style.display = "inline-block"
	Controller.current.spin = 0
	Controller.current.thrust = 0
	Controller.current.fire = 0
	Controller.sendControls()
}

ctx.pause = function() {
	Controller.pause();
}

ctx.touchPalette = function(x, y){
	var param = (x-Controller.sizes.w*0.05)/(Controller.sizes.w*0.9)
	if(param<0){param=0}
	if(param>1){param=1}
	Controller.changeColor(param)
}

})(ControllerTouchCallbacks);
export{ControllerTouchCallbacks as default}