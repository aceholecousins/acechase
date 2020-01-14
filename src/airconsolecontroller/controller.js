
Controller = {};
(function(ctx){

ctx.init = function(){

	ctx.sizes = {}
	window.onresize = onResize
	onResize()

	ctx.activeController = 0
	ctx.current = {direction:(Math.random()*2-1)*Math.PI, spin:0, thrust:0, fire:0, tab:"menu"}
	colorParameter = Math.random()

	document.getElementById("togglelog").onclick = toggleLog

	AirConsoleInterface.init()

	initPalette()

	Touch.callbacks = ControllerTouchCallbacks
	Touch.callbacks.changeController(0)
	Touch.init()

	ControllerSvg.init()
}

var paletteColor // function will be defined by initPalette

var initPalette = function(){
	var img = document.getElementById('palette');
	var paletteCanvas = document.createElement('canvas');
	var paletteContext = paletteCanvas.getContext('2d')
	img.onload = function(){
		paletteCanvas.width = img.naturalWidth;
		paletteCanvas.height = img.naturalHeight;
		paletteContext.drawImage(img, 0, 0, paletteCanvas.width, paletteCanvas.height);
		ctx.changeColor(Math.random())
	}
	img.src = "media/images/palette.png"
	paletteColor = function(parameter){
		return paletteContext.getImageData(Math.round(colorParameter*(paletteCanvas.width-1)), 1, 1, 1).data;
	}
}

ctx.log = function(txt, color){
	var history = document.getElementById("log").innerHTML
	var display = "<span style='color:" + color + "'>" + txt + "</span><br>" + history
	display = display.substr(0, 4000)
	document.getElementById("log").innerHTML = display
}

var toggleLog = function(){
	var logwindow = document.getElementById("log")
	if(logwindow.style.display == "none"){
		logwindow.style.display = "inline-block"
	}
	else{
		logwindow.style.display = "none"
	}
}

var last = {direction:undefined, spin:undefined, thrust:undefined, fire:undefined, tab:undefined}
ctx.sendControls = function(force = false){
	if(ctx.current.tab != last.tab){
		last.tab = ctx.current.tab
		force = true
	}

	if(ctx.current.tab == "game"){
		var data = {type:"control"}

		if(!isNaN(ctx.current.direction) && (ctx.current.direction != last.direction || force)){
			data.direction = ctx.current.direction
			last.direction = ctx.current.direction
		}

		if(!isNaN(ctx.current.spin) && (ctx.current.spin != last.spin || force)){
			data.spin = ctx.current.spin
			last.spin = ctx.current.spin
		}

		if(ctx.current.thrust != last.thrust || force){
			data.thrust = ctx.current.thrust
			last.thrust = ctx.current.thrust
		}

		if(ctx.current.fire != last.fire || force){
			data.fire = ctx.current.fire
			last.fire = ctx.current.fire
		}

		AirConsoleInterface.message(data)
	}
}

var colorParameter = 0
ctx.changeColor = function(newParam, forceSend=false){

	if(newParam != undefined){
		colorParameter = newParam
	}

	reposition("colorslider",
			ctx.sizes.w*(0.05 + 0.9*colorParameter) - ctx.sizes.h*0.03,
			ctx.sizes.h*0.79,
			ctx.sizes.h*0.06,
			ctx.sizes.h*0.12)

	if(newParam != undefined || forceSend){
		var c = paletteColor(colorParameter)
		var mainColorString = "rgb(" + c[0] + "," + c[1] + "," + c[2] + ")"
		var darkColorString = "rgb(" + c[0]/2 + "," + c[1]/2 + "," + c[2]/2 + ")"

		document.getElementById("colorslider").style.backgroundColor = mainColorString
		document.documentElement.style.setProperty('--main-color', mainColorString);
		document.documentElement.style.setProperty('--dark-color', darkColorString);

		AirConsoleInterface.changeProperty("color", {red:c[0], green:c[1], blue:c[2]})
	}
}

var onResize = function(){
	ctx.sizes.w = window.innerWidth
	ctx.sizes.h = window.innerHeight

	ctx.sizes.tile = Math.min(ctx.sizes.w/3.0, ctx.sizes.h)
	ctx.sizes.joyHomeX = ctx.sizes.tile*0.5
	ctx.sizes.joyHomeY = ctx.sizes.h*0.5
	ctx.sizes.joyDiam = ctx.sizes.tile*0.4
	ctx.sizes.joyRange = (ctx.sizes.tile - ctx.sizes.joyDiam)*0.5

	reposition("status", (ctx.sizes.w-ctx.sizes.tile*0.7)*0.5,
			(ctx.sizes.h-ctx.sizes.tile*0.7)*0.4, ctx.sizes.tile*0.7, ctx.sizes.tile*0.7)

	reposition("joyarea", ctx.sizes.joyHomeX - ctx.sizes.joyRange-ctx.sizes.joyDiam*0.5,
			ctx.sizes.joyHomeY - ctx.sizes.joyRange-ctx.sizes.joyDiam*0.5, ctx.sizes.tile, ctx.sizes.tile)
	reposition("joystick", ctx.sizes.joyRange, ctx.sizes.joyRange, ctx.sizes.joyDiam, ctx.sizes.joyDiam)
	reposition("joytrigger", ctx.sizes.w-ctx.sizes.tile, (ctx.sizes.h-ctx.sizes.tile)*0.5, ctx.sizes.tile, ctx.sizes.tile)

	reposition("leverarea", ctx.sizes.joyHomeX - ctx.sizes.joyRange-ctx.sizes.joyDiam*0.5,
			ctx.sizes.joyHomeY - ctx.sizes.joyRange-ctx.sizes.joyDiam*0.5, ctx.sizes.tile, ctx.sizes.tile)
	reposition("lever", ctx.sizes.joyRange, ctx.sizes.joyRange*2.0, ctx.sizes.joyDiam, ctx.sizes.joyDiam)
	reposition("levertrigger", ctx.sizes.w-ctx.sizes.tile, (ctx.sizes.h-ctx.sizes.tile)*0.5, ctx.sizes.tile, ctx.sizes.tile)

	reposition("yoketriggericon1", 0, (ctx.sizes.h-ctx.sizes.tile)*0.5, ctx.sizes.tile, ctx.sizes.tile)
	reposition("yoketriggericon2", ctx.sizes.w-ctx.sizes.tile, (ctx.sizes.h-ctx.sizes.tile)*0.5, ctx.sizes.tile, ctx.sizes.tile)
	reposition("yoketriggerarea", 0, 0, ctx.sizes.w, ctx.sizes.h)

	reposition("pause", ctx.sizes.w*0.4, ctx.sizes.h-ctx.sizes.w*0.06, ctx.sizes.w*0.2, ctx.sizes.w*0.06)

	reposition("left", 0.05*ctx.sizes.w, 0.1*ctx.sizes.h, 0.25*ctx.sizes.w, 0.6*ctx.sizes.h)
	reposition("go", 0.37*ctx.sizes.w, 0.1*ctx.sizes.h, 0.26*ctx.sizes.w, 0.6*ctx.sizes.h)
	reposition("right", 0.7*ctx.sizes.w, 0.1*ctx.sizes.h, 0.25*ctx.sizes.w, 0.6*ctx.sizes.h)
	reposition("palette", ctx.sizes.w*0.05, ctx.sizes.h*0.8, ctx.sizes.w*0.9, ctx.sizes.h*0.1)
	reposition("palettetouch", ctx.sizes.w*0.05, ctx.sizes.h*0.8, ctx.sizes.w*0.9, ctx.sizes.h*0.1)
	ctx.changeColor() // reposition colorslider
}

})(Controller)
