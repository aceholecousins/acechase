
// depends on nothing

// HBObject is the base class for all objects in the game that interact with each other

var HBO_LIST = []; // list containing all HB objects

function HBObject(){
	this.type = ''; // type of the object (e.g. hover)
	this.body = null; // body for physics engine
	this.mesh = null; // mesh for graphics scene
	this.despawnMe = false; // whether this object should be despawned during next update cycle
}

HBObject.prototype.spawn = function(){ // adds object to the object list, to the physics world and to the graphics scene
	HBO_LIST.push(this); // add object to list
	if(this.body !== null){
		this.body.HBO = this; // link the physics body to this object
		this.body.inDistanceMap = false; // by default the distance map does not contain the distance to this body (flag for broadphase check)
		PHYSICS_WORLD.addBody(this.body);
	}
	if(this.mesh !== null){
		Scene.graphicsScene.add(this.mesh);
		this.mesh.HBO = this; // link the graphics mesh to this object
	}
	this.update();
}

HBObject.prototype.despawn = function(){ // despawn object during next update
	this.despawnMe = true;
}

HBObject.prototype.update = function(){
	if(this.despawnMe){
		HBO_LIST[HBO_LIST.indexOf(this)] = null;

		if(this.body !== null){
			delete this.body.HBO; // remove parent reference so the garbage collector can strike
			PHYSICS_WORLD.removeBody(this.body); // remove from physics world
		}
		if(this.mesh !== null){
			delete this.mesh.HBO; // remove parent reference so the garbage collector can strike
			Scene.graphicsScene.remove(this.mesh); // remove from graphics scene
		}
	}
	else{ // regular update
		if(this.mesh !== null && this.body !== null){ // align graphics mesh with physics body
			this.mesh.position.x = this.body.position[0];
			this.mesh.position.y = this.body.position[1];
			this.mesh.rotation.z = this.body.angle;
		}
		if(typeof(this.specificUpdate)=="function"){
			this.specificUpdate();
		}
	}
}

HBObject.prototype.localToWorld2 = function(p){
	var res = [0,0];
	this.body.toWorldFrame(res, [p.x, p.y]);
	return new THREE.Vector2(res[0], res[1]);
}
HBObject.prototype.localToWorld3 = function(p){
	var res = [0,0];
	this.body.toWorldFrame(res, [p.x, p.y]);
	return new THREE.Vector3(res[0], res[1], p.z);
}

function updateAllHBObjects(){
	for(var i=0; i<HBO_LIST.length; i++){
		HBO_LIST[i].update();
		if(HBO_LIST[i] == null){ // object has been deleted
			HBO_LIST.splice(i, 1); // remove from object list
			i--; // so i is the same next iteration
		}
	}
}
