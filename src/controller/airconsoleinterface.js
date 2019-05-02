
AirConsoleInterface = {};
(function(ctx){

var airConsole
var rateLimiter

ctx.init = function(){
	airConsole = new AirConsole({orientation: "landscape", device_motion:30})
	rateLimiter = new RateLimiter(airConsole)

	airConsole.onCustomDeviceStateChange = onStateChange
	onStateChange(AirConsole.SCREEN, airConsole.getCustomDeviceState(AirConsole.SCREEN))

	airConsole.onDeviceMotion = onDeviceMotion
	airConsole.onMessage = onMessage
}

var onStateChange = function(device_id, custom_data){
	Controller.log(JSON.stringify(custom_data), 'orange')

	if(AirConsole.SCREEN == device_id){
		if(custom_data == undefined){
			Controller.current.tab = "menu"
		}
		else{
			Controller.current.tab = custom_data.state
		}

		var tabs = document.getElementsByClassName("tab")
		for(var i=0; i<tabs.length; i++){
			tabs[i].style.display = "none"
		}
		if(Controller.current.tab == "menu"){
			document.getElementById("menu").style.display = "inline-block"
		}
		if(Controller.current.tab == "game"){
			document.getElementById("game").style.display = "inline-block"
		}
	}
}

ctx.simulateStateChange = onStateChange

var onDeviceMotion = function (data){
	if(Controller.current.tab == "game" && document.getElementById("yokecontroller").style.display != "none"){
		const maxDegree = 20.0
		var x = data.beta/maxDegree
		var y = (data.gamma+45.0)/maxDegree

		var dir = Math.atan2(y, x)
		var r = Math.sqrt(x*x + y*y)

		if(r < 0.01){x=y=r=0; dir=NaN;}
		if(r > 1.0){x/=r; y/=r; r=1.0;}

		Controller.current.direction = dir
		Controller.current.spin = NaN
		Controller.current.thrust = r

		Controller.sendControls()
	}
}

var onMessage = function(device_id, data){
	Controller.log(JSON.stringify(data), 'red')
	if(device_id == AirConsole.SCREEN){
		if(data.hull != undefined){
			ControllerSvg.setHull(data.hull)			
		}
		if(data.shield != undefined){
			ControllerSvg.setShield(data.shield)
		}
		if(data.ammo != undefined){
			ControllerSvg.setAmmo(data.ammo)
		}
		if(data.vibrate != undefined) {
			airConsole.vibrate(data.vibrate);
		}
	}
}

ctx.message = function(msg){
	Controller.log(JSON.stringify(msg), 'limegreen')
	rateLimiter.message(AirConsole.SCREEN, msg)
}

ctx.changeProperty = function(key, value){
	Controller.log(key + ": " + JSON.stringify(value), 'cyan')
	rateLimiter.setCustomDeviceStateProperty(key, value);
}

})(AirConsoleInterface);
