
// depends on HBObject.js and Effect.js


var MISSILE_MESH;
LOADING_LIST.addItem('missilemesh');

OBJ_LOADER.load( 'media/objects/missile.obj', function (object) {
	MISSILE_MESH = object;
	LOADING_LIST.checkItem('missilemesh');

	MISSILE_MESH.scale.set(0.5,0.4,0.4);
	MISSILE_MESH.getObjectByName('bodya').material = new THREE.MeshLambertMaterial({
			color:new THREE.Color(1.0,1.0,1.0),
			emissive:new THREE.Color(0.5,0.5,0.5)});
	MISSILE_MESH.getObjectByName('bodyb').material = new THREE.MeshLambertMaterial({color:new THREE.Color(0.0,0.0,0.0)});
	MISSILE_MESH.getObjectByName('wings').material = new THREE.MeshLambertMaterial({color:new THREE.Color(0.0,1.0,0.0)});

	MISSILE_MESH.position.z = 0.1;
});




function Missile(shooter){ // missile shot class, needs the HBObject of the shooter for creation
	HBObject.call(this); // inheritance

	this.type = 'missile';

	this.hitpoints = MISSILE_HITPOINTS;

	this.lock = null;

	this.shooter = shooter;

	// physics

	var shape = new p2.Circle(0.5*HOVER_RADIUS);

	this.body = new p2.Body({
        mass: 3.0,
        position:shooter.body.position,
		angle:shooter.body.angle,
		damping:MISSILE_DAMPING,
		angularDamping:0.9995
    	});

	this.body.velocity[0] = this.shooter.body.velocity[0] + Math.cos(this.shooter.body.angle) * 10.0;
	this.body.velocity[1] = this.shooter.body.velocity[1] + Math.sin(this.shooter.body.angle) * 10.0;

	PHYSICS_WORLD.disableBodyCollision(this.body, shooter.body);

	this.body.addShape(shape);

	// graphics

	this.mesh = MISSILE_MESH.clone();
	this.mesh.getObjectByName('wings').material = new THREE.MeshLambertMaterial({
			color:this.shooter.color.clone(),
			emissive:this.shooter.color.clone().lerp(new THREE.Color("black"), 0.5) });
	this.mesh.rotation.order = 'ZYX';
	//this.mesh.material.color.copy(shooter.color);
	//this.mesh.material.color.lerp(new THREE.Color(1,1,1), 0.66);
	this.spawn();

}

Missile.prototype = Object.create(HBObject.prototype); // Phaser inherits from HBObject
Missile.prototype.constructor = Missile;

Missile.prototype.specificUpdate = function(){

	if(this.hitpoints <= 0){
		this.impact()
	}

	this.mesh.rotation.x += 10*DT;

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
		//this.body.velocity[0] = Math.cos(this.body.angle)*MISSILE_THRUST;
		//this.body.velocity[1] = Math.sin(this.body.angle)*MISSILE_THRUST;	
	}

	this.body.force[0] = Math.cos(this.body.angle)*MISSILE_THRUST*this.body.mass;
	this.body.force[1] = Math.sin(this.body.angle)*MISSILE_THRUST*this.body.mass;

	if(Math.random() < 0.5){
		var effect = new Effect();
		effect.type = 'smoke';
		effect.mesh = SMOKE_MESH.clone();
		effect.mesh.position.copy(this.mesh.position);
		effect.mesh.transparent = true;
		effect.mesh.renderOrder = SMOKE_MESH.renderOrder;
		effect.mesh.material = SMOKE_MESH.material.clone();
		effect.mesh.rotation.z = Math.random()*1000;
		effect.mesh.position.z = 0.4;
		effect.velocity.z = 3;
		effect.mesh.material.color = this.shooter.color.clone();
		//effect.mesh.material.color.lerp(new THREE.Color("black"), 0.7);
		effect.growth = 3;
		effect.decay = 2;
		effect.spawn();
	}

}

Missile.prototype.impact = function(){ // what happens on impact
	explosion(this.mesh.position.clone(), this.shooter.color.clone(), 0.5);
	this.despawn();
}

