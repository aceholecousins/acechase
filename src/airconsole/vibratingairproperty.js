//Inherits from AirProperty
"use strict";
function VibratingAirProperty (value, maxValue, stateKey, deviceId) {
	AirProperty.call(this, value, maxValue, stateKey, deviceId);
}

VibratingAirProperty.prototype = Object.create(AirProperty.prototype);
VibratingAirProperty.prototype.constructor = VibratingAirProperty;

VibratingAirProperty.prototype.set = function (value) {
	const timeToVibrateOnDeath = 1000;
	const timeToVibratePerValue = 50;

	let oldValue = this.value;
	AirProperty.prototype.set.call(this, value);
	let delta = value - oldValue;
	if(value <= 0) {
		this.vibrate(1000);
	} else if(delta < 0) {
		this.vibrate(- delta * timeToVibratePerValue);
	}
}

VibratingAirProperty.prototype.vibrate = function(timeToVibrate) {
	AirControl.sendMessage(this.deviceId, {"vibrate": timeToVibrate});
}
