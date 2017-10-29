
// class for graphic effects (like particles) that have no influence on the physics

var EFFECT_LIST = []; // array containing all effect objects

function Effect(){
	this.type = ''; // e.g. 'phaserimpact'
	this.mesh = null;
	this.strength = 1.0; // an effect should be spawned with strength 1 (or more), decay over time and be deleted when 0
	this.decay = 1.0; // loss of strength per second
	this.velocity = new THREE.Vector3(0,0,0);
	this.acceleration = new THREE.Vector3(0,0,0);
	this.growth = 0.0;
	this.spin = new THREE.Vector3(0,0,0);
}

Effect.prototype.spawn = function(){ // create effect
	EFFECT_LIST.push(this); // add to list
	if(this.mesh !== null){
		GRAPHICS_SCENE.add(this.mesh);
	}
	this.update();
}

Effect.prototype.despawn = function(){ // delete effect
	EFFECT_LIST[EFFECT_LIST.indexOf(this)] = null; // nullify element in lists
	GRAPHICS_SCENE.remove(this.mesh); // remove from scene
}

Effect.prototype.update = function(){ // reduce effect strength and delete if strength is zero
	this.strength -= this.decay*DT;
	this.mesh.position.x += this.velocity.x*DT;
	this.mesh.position.y += this.velocity.y*DT;
	this.mesh.position.z += this.velocity.z*DT;
	this.velocity.x += this.acceleration.x*DT;
	this.velocity.y += this.acceleration.y*DT;
	this.velocity.z += this.acceleration.z*DT;
	this.mesh.scale.x += this.growth*DT;
	this.mesh.scale.y += this.growth*DT;
	this.mesh.scale.z += this.growth*DT;
	this.mesh.rotation.x += this.spin.x*DT; // this is not what physics does but it's just effects so what
	this.mesh.rotation.y += this.spin.y*DT;
	this.mesh.rotation.z += this.spin.z*DT;
	this.mesh.material.transparent = true;
	this.mesh.material.alphaTest = 0.01;
	this.mesh.material.opacity = this.strength; // set transparency according to strength
	if(this.mesh.material.hasOwnProperty("uniforms")){
		this.mesh.material.uniforms.strength.value = this.strength;
	}
	if(this.strength <= 0 || this.mesh.position.z<-1){
		this.despawn();
	}
}

function updateAllEffects(){
	for(var i=0; i<EFFECT_LIST.length; i++){
		if(EFFECT_LIST[i] == null){ // has been despawned already
			EFFECT_LIST.splice(i, 1); // remove from list
			i--; // so i is the same next iteration
		}
		else{
			EFFECT_LIST[i].update();
			if(EFFECT_LIST[i] == null){ // has been despawned during update
				EFFECT_LIST.splice(i, 1); // remove from list
				i--; // so i is the same next iteration
			}
		}
	}
}
