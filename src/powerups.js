
var ipu = 0;
var PU = {
	ALOEVERA:ipu++,
	BEANS:ipu++,
	BLUEBERRY:ipu++,
	BONBON:ipu++,
	CANNABIS:ipu++,
	CARROT:ipu++,
	CIGARETTE:ipu++,
	COFFEE:ipu++,
	GARLIC:ipu++
};
var NPUS = ipu; // number of implemented powerups

var POWERUP_TEXTURES = [];
POWERUP_TEXTURES[PU.ALOEVERA]=		loadTexture("media/textures/aloevera.png");
POWERUP_TEXTURES[PU.BEANS]=			loadTexture("media/textures/beans.png");
POWERUP_TEXTURES[PU.BLUEBERRY]=		loadTexture("media/textures/blueberry.png");
POWERUP_TEXTURES[PU.BONBON]=		loadTexture("media/textures/bonbon.png");
POWERUP_TEXTURES[PU.CANNABIS]=		loadTexture("media/textures/cannabis.png");
POWERUP_TEXTURES[PU.CARROT]=		loadTexture("media/textures/carrot.png");
POWERUP_TEXTURES[PU.CIGARETTE]=		loadTexture("media/textures/cigarette.png");
POWERUP_TEXTURES[PU.COFFEE]=		loadTexture("media/textures/coffee.png");
POWERUP_TEXTURES[PU.GARLIC]=		loadTexture("media/textures/garlic.png");

var POWERUP_COLORS = [];
POWERUP_COLORS[PU.ALOEVERA]=		new THREE.Color(0x00dd00);
POWERUP_COLORS[PU.BEANS]=			new THREE.Color(0xdd0000);
POWERUP_COLORS[PU.BLUEBERRY]=		new THREE.Color(0x0000ff);
POWERUP_COLORS[PU.BONBON]=			new THREE.Color(0x8000ff);
POWERUP_COLORS[PU.CANNABIS]=		new THREE.Color(0xffff00);
POWERUP_COLORS[PU.CARROT]=			new THREE.Color(0xff8000);
POWERUP_COLORS[PU.CIGARETTE]=		new THREE.Color(0xAAAAAA);
POWERUP_COLORS[PU.COFFEE]=			new THREE.Color(0x804000);
POWERUP_COLORS[PU.GARLIC]=			new THREE.Color(0xf0e0d0);

var POWERUP_DURATIONS = [];
POWERUP_DURATIONS[PU.ALOEVERA]=		0;
POWERUP_DURATIONS[PU.BEANS]=		8;
POWERUP_DURATIONS[PU.BLUEBERRY]=	6;
POWERUP_DURATIONS[PU.BONBON]=		2;
POWERUP_DURATIONS[PU.CANNABIS]=		6;
POWERUP_DURATIONS[PU.CARROT]=		8;
POWERUP_DURATIONS[PU.CIGARETTE]=	0;
POWERUP_DURATIONS[PU.COFFEE]=		6;
POWERUP_DURATIONS[PU.GARLIC]=		4;

var GLOBAL_POWERUP_TARGET = {pu:-1, victim:[]}; // garlic or bonbon

var NPUBOXES = 0; // number of powerup boxes currently floating around

function maybeSpawnPowerup(){
	if(Math.random()<DT/AVG_SECONDS_BETWEEN_POWERUPS && NPUBOXES < PUBOX_LIMIT){
		var pos = findAccessiblePosition(-1);
		var pu = Math.floor(Math.random()*NPUS);
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

	var shape = new p2.Circle(0.7);

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

	shape.material = PHASER_MATERIAL;
	this.body.addShape(shape);

	// graphics

	this.mesh = new THREE.Mesh(
		new THREE.BoxGeometry(1,1,1),
		new THREE.MeshLambertMaterial({
			map: POWERUP_TEXTURES[pu],
			emissiveMap: POWERUP_TEXTURES[pu],
			emissive: new THREE.Color(0.3,0.3,0.3)
		}));
	var contour = new THREE.Mesh(
		new THREE.BoxGeometry(1.16,1.16,1.16),
		new THREE.MeshBasicMaterial({color:POWERUP_COLORS[pu]})
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
	effect.mesh.material.color.copy(POWERUP_COLORS[pu]);
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

Pubox.prototype.shot = function(){ // what happens on phaser impact
	this.hitpoints--;
	if(this.hitpoints == 0){
		this.destroyed();
	}
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
	effect.mesh.material.color.copy(POWERUP_COLORS[this.pu]);
	effect.mesh.scale.set(2,2,1);
	effect.spawn();
	effect.strength = 5;
	effect.decay = 80;
	effect.growth = 30;
}

Pubox.prototype.specificUpdate=function(){
	this.mesh.rotation.x = Math.sin(INGAME_TIME*this.oscillation[0])*0.4;
	this.mesh.rotation.y = Math.sin(INGAME_TIME*this.oscillation[1])*0.5;
}

