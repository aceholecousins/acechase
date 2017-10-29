
var ipu = 0;
var POWERUPS = {
	nothing:    {tex:null, color:null, count:0},

	missile:    {tex:loadTexture("media/textures/missile.png"),    color:new THREE.Color(0xff8000), count:3},
	seamine:    {tex:loadTexture("media/textures/seamine.png"),    color:new THREE.Color(0xffff00), count:1},
	powershield:{tex:loadTexture("media/textures/shield.png"),     color:new THREE.Color(0x0090ff), count:7},
	adrenaline: {tex:loadTexture("media/textures/adrenaline.png"), color:new THREE.Color(0x00ff00), count:7},
	repair:     {tex:loadTexture("media/textures/repair.png"),     color:new THREE.Color(0xffffff), count:0},
};

var PUARRAY=[POWERUPS.missile, POWERUPS.seamine, POWERUPS.powershield, POWERUPS.adrenaline, POWERUPS.repair];

var NPUBOXES = 0; // number of powerup boxes currently floating around

function maybeSpawnPowerup(){
	if(Math.random()<DT/AVG_SECONDS_BETWEEN_POWERUPS && NPUBOXES < PUBOX_LIMIT){
		var pos = findAccessiblePosition(-1);
		var pu = PUARRAY[Math.floor(Math.random()*PUARRAY.length)];
		new Pubox(pos, pu);
	}
}

function Pubox(pos, pu){ // powerup box class
	HBObject.call(this); // inheritance

	NPUBOXES++;

	this.type = 'pubox';
	this.pu = pu;
	this.hitpoints = PUBOX_HITPOINTS;

	// physics

	var shape = new p2.Circle(PUBOX_SIZE*0.7);
	shape.collisionGroup = CG_PUBOX;
	shape.collisionMask  = CM_PUBOX;

	var vphi = Math.random()*10000;
	var v = Math.random()*3+0.1;
	this.oscillation = [Math.random()*4, Math.random()*4];

	this.body = new p2.Body({
        mass: 1,
        position: [pos.x, pos.y],
		velocity: [v*Math.cos(vphi), v*Math.sin(vphi)],
		angle:Math.random()*10000,
		angularVelocity: Math.random()-0.5,
		damping:0.0,
		angularDamping:0.0
    	});

	this.body.addShape(shape);

	// graphics

	this.mesh = new THREE.Mesh(
		new THREE.BoxGeometry(PUBOX_SIZE, PUBOX_SIZE, PUBOX_SIZE),
		new THREE.MeshLambertMaterial({
			map: pu.tex,
			emissiveMap: pu.tex,
			emissive: new THREE.Color(0.3,0.3,0.3)
		}));
	var contour = new THREE.Mesh(
		new THREE.BoxGeometry(PUBOX_SIZE*1.05,PUBOX_SIZE*1.05,PUBOX_SIZE*1.05),
		//new THREE.BoxGeometry(2,2,2),
		new THREE.MeshBasicMaterial({color:pu.color})
	);
	contour.material.side = THREE.BackSide;
	this.mesh.add(contour);

	// spawnstar
	
	effect = new Effect();
	effect.type = 'star';
	effect.mesh = STAR_MESH.clone();
	effect.mesh.position.x = pos.x;
	effect.mesh.position.y = pos.y;
	effect.mesh.position.z = 0.2;
	effect.mesh.renderOrder = STAR_MESH.renderOrder; // TODO: maybe remove if fixed in three.js
	effect.mesh.material = STAR_MESH.material.clone();
	effect.mesh.material.color.copy(pu.color);
	effect.mesh.scale.set(2,2,1);
	effect.spawn();
	effect.strength = 5;
	effect.decay = 80;
	effect.growth = 30;

	playSound(SOUNDS.splash, 0.3, 1.3, false);

	this.spawn();

}

Pubox.prototype = Object.create(HBObject.prototype); // Pubox inherits from HBObject
Pubox.prototype.constructor = Pubox;

Pubox.prototype.shot = function(damage = 1){ // what happens on phaser impact
	this.hitpoints -= damage;
}

Pubox.prototype.destroyed = function(){ // when collected or destroyed by phaser
	NPUBOXES--;

	this.despawn();
	effect = new Effect();
	effect.type = 'star';
	effect.mesh = STAR_MESH.clone();
	effect.mesh.position.x = this.mesh.position.x;
	effect.mesh.position.y = this.mesh.position.y;
	effect.mesh.position.z = 0.2;
	effect.mesh.renderOrder = STAR_MESH.renderOrder; // TODO: maybe remove if fixed in three.js
	effect.mesh.material = STAR_MESH.material.clone();
	effect.mesh.material.color.copy(this.pu.color);
	effect.mesh.scale.set(2,2,1);
	effect.spawn();
	effect.strength = 5;
	effect.decay = 80;
	effect.growth = 30;
}

Pubox.prototype.specificUpdate=function(){
	if(this.hitpoints <= 0){
		this.destroyed();
	}

	this.mesh.rotation.x = Math.sin(INGAME_TIME*this.oscillation[0])*0.4;
	this.mesh.rotation.y = Math.sin(INGAME_TIME*this.oscillation[1])*0.5;
}

