
// depends on HBObject.js and Effect.js


var MISSILE_MESH = new THREE.Mesh( // every new instance of a phaser shot copies from this mesh
	new THREE.PlaneGeometry( 1, 1),
	new THREE.MeshBasicMaterial({
		map: loadTexture( 'media/textures/missiletex.png' ),
		color: 0x00ff00,
		transparent: true,
		depthWrite: false,
		side: THREE.FrontSide}));

MISSILE_MESH.renderOrder = RENDER_ORDER.phaser;
MISSILE_MESH.position.z = 0.1;


function Missile(shooter){ // phaser shot class, needs the HBObject of the shooter for creation
	HBObject.call(this); // inheritance

	this.type = 'missile';

	this.hitpoints = MISSILE_HITPOINTS;

	this.velocity = 15;
	this.lock = null;

	this.shooter = shooter;

	// physics

	var shape = new p2.Circle(0.5*HOVER_RADIUS);

	this.body = new p2.Body({
        mass: 3.0,
        position:shooter.body.position,
		angle:shooter.body.angle,
		damping:0.5,
		angularDamping:0.9995
    	});

	PHYSICS_WORLD.disableBodyCollision(this.body, shooter.body);

	this.body.velocity[0] = Math.cos(this.body.angle)*this.velocity;
	this.body.velocity[1] = Math.sin(this.body.angle)*this.velocity;

	this.body.addShape(shape);

	// graphics

	this.mesh = MISSILE_MESH.clone();
	this.mesh.renderOrder = MISSILE_MESH.renderOrder; // TODO: maybe remove if fixed in three.js
	this.mesh.material = MISSILE_MESH.material.clone(); // so changes don't affect all phasershots
	this.mesh.material.color.copy(shooter.color);
	this.mesh.material.color.lerp(new THREE.Color(1,1,1), 0.66);
	this.spawn();

}

Missile.prototype = Object.create(HBObject.prototype); // Phaser inherits from HBObject
Missile.prototype.constructor = Missile;

Missile.prototype.specificUpdate = function(){

	if(this.hitpoints <= 0){
		tihs.impact()
	}

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
		if(delta >  MISSILE_TURN*DT){delta =  MISSILE_TURN*DT;}
		if(delta < -MISSILE_TURN*DT){delta = -MISSILE_TURN*DT;}

		this.body.angle += delta;
		this.body.velocity[0] = Math.cos(this.body.angle)*this.velocity;
		this.body.velocity[1] = Math.sin(this.body.angle)*this.velocity;		
	}
}

Missile.prototype.impact = function(){ // what happens on impact
	explosion(this.mesh.position.clone(), this.mesh.material.color.clone());
	this.despawn();
}

