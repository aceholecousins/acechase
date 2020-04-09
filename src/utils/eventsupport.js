function EventSupport() {
    this.handlers = new Set();
}

EventSupport.prototype.addHandler = function(handler) {
    this.handlers.add(handler);
}

EventSupport.prototype.removeHandler = function(handler) {
    this.handlers.delete(handler);
}

EventSupport.prototype.fireEvent = function(event) {
    this.handlers.forEach(function(handler) {
        handler(event);
    })
}
