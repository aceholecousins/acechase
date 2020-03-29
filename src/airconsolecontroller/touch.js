
/*
<button
	data-downcallback="myDown"
	data-movecallback="myMove"
	data-upcallback="myUp"
	class="touchable"> Click </button>

<script>
	Touch.callbacks.myDown = function(){console.log("down")}
	Touch.callbacks.myMove = function(x, y){console.log("move: ", x, y)} // window coordinates
	Touch.callbacks.myUp = function(){console.log("up")}
	Touch.init()
</script>
*/

let Touch = {}

Touch.callbacks = {}

Touch.onMouseDown = function(ev){
	if(-1 == ev.target.dataset.finger){
		ev.target.dataset.finger = "m"
		if(ev.target.dataset.downcallback != undefined){
			Touch.callbacks[ev.target.dataset.downcallback]()
		}
		if(ev.target.dataset.movecallback != undefined){
			Touch.callbacks[ev.target.dataset.movecallback](
					ev.clientX,
					ev.clientY)
		}
	}
}

Touch.onTouchStart = function(ev){
	ev.preventDefault();
	if(-1 == ev.target.dataset.finger){
		ev.target.dataset.finger = ev.changedTouches[0].identifier
		if(ev.target.dataset.downcallback != undefined){
			Touch.callbacks[ev.target.dataset.downcallback]()
		}
		if(ev.target.dataset.movecallback != undefined){
			Touch.callbacks[ev.target.dataset.movecallback](
					ev.changedTouches[0].clientX,
					ev.changedTouches[0].clientY)
		}
	}
}

Touch.onMouseMove = function(ev){
	for(var iElem=0; iElem<Touch.touchables.length; iElem++){
		if("m" == Touch.touchables[iElem].dataset.finger){
			if(Touch.touchables[iElem].dataset.movecallback != undefined){
				Touch.callbacks[Touch.touchables[iElem].dataset.movecallback](
						ev.clientX,
						ev.clientY)
			}
		}
	}
}

Touch.onTouchMove = function(ev){
	for(var iTouch=0; iTouch<ev.changedTouches.length; iTouch++){
		for(var iElem=0; iElem<Touch.touchables.length; iElem++){
			if(ev.changedTouches[iTouch].identifier == Touch.touchables[iElem].dataset.finger){
				if(Touch.touchables[iElem].dataset.movecallback != undefined){
					Touch.callbacks[Touch.touchables[iElem].dataset.movecallback](
							ev.changedTouches[iTouch].clientX,
							ev.changedTouches[iTouch].clientY)
				}
			}
		}
	}
}

Touch.onMouseUp = function(ev){
	for(var iElem=0; iElem<Touch.touchables.length; iElem++){
		if("m" == Touch.touchables[iElem].dataset.finger){
			Touch.touchables[iElem].dataset.finger = -1
			if(Touch.touchables[iElem].dataset.upcallback != undefined){
				Touch.callbacks[Touch.touchables[iElem].dataset.upcallback]()
			}
		}
	}
}

Touch.onTouchUp = function(ev){
	for(var iTouch=0; iTouch<ev.changedTouches.length; iTouch++){
		for(var iElem=0; iElem<Touch.touchables.length; iElem++){
			if(ev.changedTouches[iTouch].identifier == Touch.touchables[iElem].dataset.finger){
				Touch.touchables[iElem].dataset.finger = -1
				if(Touch.touchables[iElem].dataset.upcallback != undefined){
					Touch.callbacks[Touch.touchables[iElem].dataset.upcallback]()
				}
			}
		}
	}
}

Touch.init = function(){
	Touch.touchables = document.getElementsByClassName("touchable")
	for(var iElem=0; iElem<Touch.touchables.length; iElem++){
		Touch.touchables[iElem].dataset.finger = -1
		Touch.touchables[iElem].addEventListener('mousedown', Touch.onMouseDown, {passive: false});
		Touch.touchables[iElem].addEventListener('touchstart', Touch.onTouchStart, {passive: false});
	}

	window.addEventListener('mousemove', Touch.onMouseMove, {passive: false});
	window.addEventListener('touchmove', Touch.onTouchMove, {passive: false});
	window.addEventListener('mouseup', Touch.onMouseUp, {passive: false});
	window.addEventListener('touchend', Touch.onTouchUp, {passive: false});
	window.addEventListener('touchcancel', Touch.onTouchUp, {passive: false});
}

export{Touch as default}