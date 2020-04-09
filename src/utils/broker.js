function EventChannel() {
	this.handlers = new Set();
}

EventChannel.prototype.addHandler = function(handler) {
	this.handlers.add(handler);
}

EventChannel.prototype.removeHandler = function(handler) {
	this.handlers.delete(handler);
}

EventChannel.prototype.fire = function(event) {
	this.handlers.forEach(function(handler) {
		handler(event);
	})
}

var broker = {}
broker.newChannel = function(name){
	if(broker.hasOwnProperty(name)){
		throw new Error('channel "' + name + '" already exists')
	}
	else{
		broker[name] = new EventChannel()
	}
}

export {EventChannel, broker}

/*
broker.newChannel("myChannel")
broker.myChannel.addHandler(function(event){
	console.log(event)
})
broker.myChannel.fire("Event1!")
// broker.newChannel("myChannel") // error
delete broker.myChannel
// broker.myChannel.fire("Event2!") // error
*/
