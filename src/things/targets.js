
var TARGET_TEX = loadTexture("media/textures/target.png");
//var MINE_TEX = loadTexture("media/textures/bomb.png");
var TARGETS = [];

function spawnTarget(isMine, attractforce){

	var pos;
	var posok = false;
	var ntrials = 0;

	while(!posok){ // find a position away from gliders and other targets
		pos = findAccessiblePosition(-3);
		posok = true;

		for(var i=0; i<TARGETS.length; i++){
			if(Math.pow(pos.x - TARGETS[i].body.position[0], 2)
					+ Math.pow(pos.y - TARGETS[i].body.position[1], 2) < Math.pow(MAP_WIDTH/5,2)){
				posok = false;
				break;
			}
		}
		for(var i=0; i<hovers.length; i++){
			if(Math.pow(pos.x - hovers[i].body.position[0], 2)
					+ Math.pow(pos.y - hovers[i].body.position[1], 2) < Math.pow(MAP_WIDTH/5,2)){
				posok = false;
				break;
			}
		}
		ntrials ++;
		if(ntrials > 1000){
			console.error("No suitable spawning location for target found!")
			break;
		}
	}

	new Target(pos, isMine, attractforce);

}

function Target(pos, isMine, attractforce){ // powerup box class
	HBObject.call(this); // inheritance
	this.destroyedBy = null;

	var mineSizeFactor = 1; // how much mines are bigger

	if(!isMine){
		this.type = 'target';
		this.hitpoints = PUBOX_HITPOINTS;
	}
	else{
		this.type = 'bomb';
		this.hitpoints = PUBOX_HITPOINTS/3;
		this.attractforce = attractforce;
		mineSizeFactor = 2;
	}
	TARGETS.push(this);

	// physics

	var shape = new p2.Circle(PUBOX_SIZE*0.5*mineSizeFactor);
	if(!isMine){
		shape.collisionGroup = CG_TARGET;
		shape.collisionMask  = CM_TARGET;
	}
	else{
		shape.collisionGroup = CG_BOMB;
		shape.collisionMask  = CM_BOMB;
	}

	var vphi = Math.random()*10000;
	var v = Math.random()*3+0.1;
	this.oscillation = [Math.random()*4, Math.random()*4];

	this.body = new p2.Body({
        mass: 8,
        position: [pos.x, pos.y],
		velocity: [v*Math.cos(vphi), v*Math.sin(vphi)],
		angle:Math.random()*10000,
		angularVelocity: Math.random()-0.5,
		damping:isMine ? 0.6 : 0.0,
		angularDamping:0.0
    	});

	this.body.addShape(shape);

	// graphics

	this.mesh = null;
	if(!isMine){
		this.mesh = new THREE.Mesh(
			new THREE.IcosahedronGeometry(PUBOX_SIZE/2*mineSizeFactor, 2),
			new THREE.MeshLambertMaterial({
				map: TARGET_TEX,
				emissiveMap: TARGET_TEX,
				emissive: new THREE.Color(0.3,0.3,0.3)
			}));
	}
	else{
		this.mesh = SEAMINE_MESH.clone();
		this.mesh.getObjectByName('mine').material =
			new THREE.MeshLambertMaterial({color:new THREE.Color(0.5,0.5,0.5)});
		this.mesh.scale.set(0.8,0.8,0.8);
	}

	this.mesh.position.z = 0.3;

	// spawnstar
	
	effect = new Effect();
	effect.type = 'star';
	effect.mesh = STAR_MESH.clone();
	effect.mesh.position.x = pos.x;
	effect.mesh.position.y = pos.y;
	effect.mesh.position.z = 0.2;
	effect.mesh.renderOrder = STAR_MESH.renderOrder; // TODO: maybe remove if fixed in three.js
	effect.mesh.material = STAR_MESH.material.clone();
	effect.mesh.material.color = new THREE.Color(isMine? "red" : "white");
	effect.mesh.scale.set(2,2,1);
	effect.spawn();
	effect.strength = 5;
	effect.decay = 80;
	effect.growth = 30;

	playSound(SOUNDS.splash, 0.3, 1.3, false);

	this.spawn();

}

Target.prototype = Object.create(HBObject.prototype); // Target inherits from HBObject
Target.prototype.constructor = Target;

Target.prototype.shotBy = function(shooter){ // what happens on phaser impact
	this.hitpoints--;
	this.destroyedBy = shooter; // stores the last hover that hit this thing
}

Target.prototype.destroyed = function(){

	for(var i=0; i<TARGETS.length; i++){
		if(TARGETS[i] == this){
			TARGETS.splice(i,1);
			break;
		}
	}

	effect = new Effect();
	effect.type = 'star';
	effect.mesh = STAR_MESH.clone();
	effect.mesh.position.x = this.mesh.position.x;
	effect.mesh.position.y = this.mesh.position.y;
	effect.mesh.position.z = 0.2;
	effect.mesh.renderOrder = STAR_MESH.renderOrder; // TODO: maybe remove if fixed in three.js
	effect.mesh.material = STAR_MESH.material.clone();
	effect.mesh.material.color.copy(this.destroyedBy.color);
	effect.mesh.scale.set(2,2,1);
	effect.spawn();
	effect.strength = 5;
	effect.decay = 40;

	if(this.type == "target"){
		playSound(SOUNDS.plop, 1.0, 0.8+Math.random()*0.3, 0.0);
		effect.growth = 30;
		ingameTimeout(2, function(){spawnTarget(false);});
	}
	if(this.type == "bomb"){
		playSound(SOUNDS.plop, 1.0, 0.8+Math.random()*0.3, 0.0);
		playSound(SOUNDS.fart, 1.0, 0.8+Math.random()*0.3, 0.0);
		effect.growth = 60;
		ingameTimeout(4, function(){spawnTarget(true, this.attractforce);}.bind(this));
	}
	this.despawn();

}


Target.prototype.specificUpdate=function(){
	this.mesh.rotation.x = Math.sin(INGAME_TIME*this.oscillation[0])*0.4;
	this.mesh.rotation.y = Math.sin(INGAME_TIME*this.oscillation[1])*0.4;

	if(this.hitpoints <= 0){
		if(this.destroyedBy != null){
			if(this.type == 'bomb'){
				this.destroyedBy.mines++;
			}
			if(this.type == 'target'){
				this.destroyedBy.targets++;
			}
		}
		this.destroyed();
		return;
	}

	if(this.type=="bomb"){

		var mindist = 1e100;
		var imin;
		for(var i=0; i<hovers.length; i++){
			var dist = Math.sqrt(Math.pow(hovers[i].body.position[0]-this.body.position[0], 2) + 
					Math.pow(hovers[i].body.position[1]-this.body.position[1], 2));
			if(dist < mindist){
				mindist = dist;
				imin = i;
			}
		}

		this.body.force[0] = (hovers[imin].body.position[0]-this.body.position[0])/mindist * this.attractforce;
		this.body.force[1] = (hovers[imin].body.position[1]-this.body.position[1])/mindist * this.attractforce;

	}

}

