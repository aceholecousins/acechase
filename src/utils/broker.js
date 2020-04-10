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

EventChannel.prototype.fetch = function(request) {
	responses = []
	this.handlers.forEach(function(handler) {
		response = handler(request)
		if(response !== undefined){
			responses.push(response)
		}
	})
	return responses
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

//* <- remove a slash here for running the test below in nodejs

export {EventChannel, broker}

/*/

broker.newChannel("myChannel")

broker.myChannel.addHandler(function(event){
	console.log(event)
})

broker.myChannel.fire("Event1!")
// broker.newChannel("myChannel") // error
delete broker.myChannel
// broker.myChannel.fire("Event2!") // error

broker.newChannel("requester")

broker.requester.addHandler(() => 5)
broker.requester.addHandler(() => 7)

answers = broker.requester.fetch()

console.log(answers) // [5, 7]

/**/
