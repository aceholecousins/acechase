
// depends on HBObject.js and Effect.js


var PHASER_MESH = new THREE.Mesh( // every new instance of a phaser shot copies from this mesh
	new THREE.PlaneGeometry( 1, 1),
	new THREE.MeshBasicMaterial({
		map: loadTexture( 'media/textures/phaser.png' ),
		color: 0x00ff00,
		transparent: true,
		depthWrite: false,
		side: THREE.FrontSide}));

PHASER_MESH.renderOrder = RENDER_ORDER.phaser;
PHASER_MESH.position.z = 0.1;


var PHASER_IMPACT_MESH = new THREE.Mesh( // little spark effect where phaser shots impact
	new THREE.PlaneGeometry( 1, 1),
	new THREE.MeshBasicMaterial({
		map: loadTexture( 'media/textures/phaser_impact.png' ),
		color: 0x00ff00,
		transparent: true,
		depthWrite: false,
		side: THREE.FrontSide}));

PHASER_IMPACT_MESH.renderOrder = RENDER_ORDER.phaserimpact;
PHASER_IMPACT_MESH.position.z = 0.11;

function Phaser(shooter){ // phaser shot class, needs the HBObject of the shooter for creation
	HBObject.call(this); // inheritance

	this.type = 'phaser';

	this.velocity = PHASER_SPEED;

	this.lock = null;

	var length = PHASER_LENGTH/2;
	var radius = PHASER_LENGTH/4;

	this.shooter = shooter;

	// physics

	//var shape = new p2.Capsule(length, radius); // capsule made the game too slow
	var shape = new p2.Circle(radius);

	this.body = new p2.Body({
        mass: 3.0, // 0.2 before
        position:shooter.body.position,
		angle:shooter.body.angle,
		damping:0.0,
		angularDamping:0.0
    	});
	
	if(GAME_MODE == "R"){this.body.mass = 3.0;} // hard pushing phasers

	PHYSICS_WORLD.disableBodyCollision(this.body, shooter.body);

	this.body.position[0] -= Math.sin(this.body.angle)*shooter.phaserYOffset;
	this.body.position[1] += Math.cos(this.body.angle)*shooter.phaserYOffset;

	this.body.velocity[0] = Math.cos(this.body.angle)*this.velocity;
	this.body.velocity[1] = Math.sin(this.body.angle)*this.velocity;

	shape.material = PHASER_MATERIAL;
	this.body.addShape(shape);

	// graphics

	this.mesh = PHASER_MESH.clone();
	this.mesh.renderOrder = PHASER_MESH.renderOrder; // TODO: maybe remove if fixed in three.js
	this.mesh.material = PHASER_MESH.material.clone(); // so changes don't affect all phasershots
	this.mesh.material.color.copy(shooter.color);
	this.mesh.material.color.lerp(new THREE.Color(1,1,1), 0.66);
	this.mesh.scale.x = length+2*radius;
	this.mesh.scale.y = 2*radius;
	this.spawn();

}

Phaser.prototype = Object.create(HBObject.prototype); // Phaser inherits from HBObject
Phaser.prototype.constructor = Phaser;

Phaser.prototype.specificUpdate = function(){
	if(this.lock != null){
		if(this.lock.hidden == true){
			this.lock = null;
			return;
		}

		var targetdir = Math.atan2(
			this.lock.body.position[1] - this.body.position[1],
			this.lock.body.position[0] - this.body.position[0]);
		var dir = this.body.angle;
		var delta = targetdir - dir;
		if(delta >  Math.PI){delta -= 2*Math.PI;}
		if(delta < -Math.PI){delta += 2*Math.PI;}
		if(delta >  PHASER_TURN*DT){delta =  PHASER_TURN*DT;}
		if(delta < -PHASER_TURN*DT){delta = -PHASER_TURN*DT;}

		this.body.angle += delta;
		this.body.velocity[0] = Math.cos(this.body.angle)*this.velocity;
		this.body.velocity[1] = Math.sin(this.body.angle)*this.velocity;		
	}
}

Phaser.prototype.impact = function(){ // what happens on impact
	var effect = new Effect();
	effect.type = 'phaserimpact';
	effect.mesh = PHASER_IMPACT_MESH.clone();
	effect.mesh.renderOrder = PHASER_IMPACT_MESH.renderOrder; // TODO: maybe remove if fixed in three.js
	effect.mesh.material = PHASER_IMPACT_MESH.material.clone(); // so we can change the color without changing the color of all the shots
	effect.mesh.material.color.copy(this.mesh.material.color);
	effect.mesh.position.copy(this.mesh.position);
	effect.spawn();
	effect.decay = 10; // so the spark degrades in 0.1s
	effect.growth = 10;
	this.despawn();
}

