

Property = function(value) {
    this.value = value;
}

Property.prototype.set = function(value) {
    this.value = value;
}

Property.prototype.change = function(delta) {
    this.set(this.value + delta);
}

Property.prototype.get = function() {
    return this.value;
}