//Inherits from Property
"use strict";
function AirProperty (value, maxValue, stateKey, deviceId) {
	Property.call(this, value);
	this.maxValue = maxValue;
	this.stateKey = stateKey;
	this.deviceId = deviceId;
}

AirProperty.prototype = Object.create(Property.prototype);
AirProperty.prototype.constructor = AirProperty;

AirProperty.prototype.set = function (value) {
	//Trim old and new value in order to not send changes if trimmed values did not change.
	let trimmedOldValue = this.trim(this.value);
	let trimmedNewValue = this.trim(value);

	//Set un-trimmed value by intention
	Property.prototype.set.call(this, value);

	if (trimmedNewValue != trimmedOldValue) {
		let normalizedValue = trimmedNewValue / this.maxValue;

		let message = {};
		message[this.stateKey] = normalizedValue;
		AirControl.sendMessage(this.deviceId, message);
	}
}

AirProperty.prototype.trim = function (value) {
	return Math.max(0, Math.min(this.maxValue, value));
}