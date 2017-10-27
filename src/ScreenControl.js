
function ScreenControl() {
	
}

ScreenControl.enterFullScreen = function() {
	var el = document.documentElement;
	var requestMethod = el.requestFullScreen || el.webkitRequestFullScreen || el.mozRequestFullScreen || el.msRequestFullscreen;

	if (requestMethod) { // Native full screen.
		requestMethod.call(el);
	}
}

ScreenControl.lockScreenToLandscape = function() {
	const orientationToLock = ScreenControl.getCurrentOrientation();
	console.log("Try to lock screen to current orientation: " + orientationToLock);
	screen.lockOrientationUniversal = 			
		screen.lockOrientation || 
		screen.mozLockOrientation || 
		screen.msLockOrientation;
	var lockResult;
	if(screen.lockOrientationUniversal) {
		lockResult = screen.lockOrientationUniversal(orientationToLock);
	} else if(screen.orientation.lock) {
		lockResult = screen.orientation.lock(orientationToLock);
	}
}

ScreenControl.getCurrentOrientation = function() {
	screen.orientationUniversal = 
			screen.orientation || 
			screen.mozOrientation || 
			screen.msOrientation;	
	return screen.orientationUniversal.type;;
}