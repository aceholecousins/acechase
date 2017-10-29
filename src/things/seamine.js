


var SEAMINE_MESH;
LOADING_LIST.addItem('seaminemesh');

OBJ_LOADER.load( 'media/objects/seamine.obj', function (object) {
	SEAMINE_MESH = object;
	LOADING_LIST.checkItem('seaminemesh');
	SEAMINE_MESH.scale.set(0.5,0.5,0.5);
	SEAMINE_MESH.getObjectByName('mine').material = new THREE.MeshLambertMaterial({color:new THREE.Color(0.0,1.0,1.0)});

	SEAMINE_MESH.position.z = 0.1;
});


function Seamine(shooter){ // seamine shot class, needs the HBObject of the shooter for creation
	HBObject.call(this); // inheritance

	this.type = 'seamine';

	this.shooter = shooter;

	// physics

	var shape = new p2.Circle(HOVER_RADIUS);
	shape.collisionGroup = CG_SEAMINE;
	shape.collisionMask  = CM_SEAMINE;

	this.body = new p2.Body({
        mass: 1000.0,
        position:shooter.body.position,
		angle:shooter.body.angle,
		damping:0.9995,
		angularDamping:0.9995
    	});

	PHYSICS_WORLD.disableBodyCollision(this.body, this.shooter.body);
	ingameTimeout(1.0, function(){
		PHYSICS_WORLD.enableBodyCollision(this.body, this.shooter.body);
	}.bind(this));
	
	this.body.addShape(shape);

	// graphics

	this.mesh = SEAMINE_MESH.clone();
	this.mesh.getObjectByName('mine').material =
		new THREE.MeshLambertMaterial({color:this.shooter.color.clone().lerp(new THREE.Color("black"), 0.5)});

	this.oscillation = [Math.random()*4, Math.random()*4];

	this.spawn();

}

Seamine.prototype = Object.create(HBObject.prototype); // Phaser inherits from HBObject
Seamine.prototype.constructor = Seamine;

Seamine.prototype.specificUpdate = function(){
	this.mesh.rotation.x = Math.sin(INGAME_TIME*this.oscillation[0])*0.4;
	this.mesh.rotation.y = Math.sin(INGAME_TIME*this.oscillation[1])*0.5;
}

Seamine.prototype.impact = function(){ // what happens on impact
	explosion(this.mesh.position.clone(), this.shooter.color.clone(), 0.5);
	this.despawn();
}

