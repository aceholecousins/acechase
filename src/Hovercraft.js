
// depends on HBObject.js

var HOVERCRAFT_MESH;
LOADING_LIST.addItem('hovercraftmesh');
loadObjMtl( 'media/objects/glider.obj', 'media/objects/glider.mtl', function (object) {
	HOVERCRAFT_MESH = object;
	LOADING_LIST.checkItem('hovercraftmesh');
});

function Hovercraft(color, control){
	HBObject.call(this); // inheritance

	this.type = 'hover';
	this.hidden = false; // if the hovercraft is on the map and taking part in the game
	this.color = color;
	this.playerName = '';
	this.hitpoints = 0;
	this.shield = 0;
	this.ammo = 0;
	this.radius = 0.4;
	this.control = control;
	this.beamed = false; // so that the trail does not draw a stroke all over the place
	this.kills = 0;
	this.killedBy = {};
	this.deaths = 0;
	this.powerup = -1; // active powerup (-1 = none)
	this.powerupLasts = 0; // time until powerup is over

	// physics

	var shape = new p2.Circle(this.radius);

	this.body = new p2.Body({
        mass: 6,
        position:[0,0],
		damping:0.5,
		angularDamping:0.9995
    	});
	shape.material = HOVER_MATERIAL;
	this.body.addShape(shape);

	// graphics

	this.mesh = HOVERCRAFT_MESH.clone();
	this.mesh.getObjectByName('body').material = HOVERCRAFT_MESH.getObjectByName('body').material.clone();
	this.mesh.getObjectByName('bumper').material = HOVERCRAFT_MESH.getObjectByName('bumper').material.clone();
	//this.mesh.getObjectByName('halo').material = HOVERCRAFT_MESH.getObjectByName('halo').material.clone();
	this.mesh.getObjectByName('halo').material = new THREE.MeshBasicMaterial();

	this.mesh.getObjectByName('body').material.color.copy(this.color);
	this.mesh.getObjectByName('bumper').material.color.copy(this.color);
	this.mesh.getObjectByName('bumper').material.color.lerp(new THREE.Color(0.3,0.3,0.3), 0.5);
	this.mesh.getObjectByName('halo').material.color.copy(this.color);
	
	this.mesh.scale.x = this.mesh.scale.y = this.mesh.scale.z = this.radius;

	this.mesh.position.z = 0.1; // so it doesn't sink in waves

	this.shieldMesh = new THREE.Mesh(
            new THREE.SphereGeometry(1.2,9,9),
            new THREE.MeshPhongMaterial({
				color:color,
				emissive:color.clone().lerp(new THREE.Color("black"), 0.4),
				opacity:0.7,
				transparent:true}));
	this.shieldMesh.renderOrder = RENDER_ORDER.shield;

	this.mesh.add(this.shieldMesh);

	this.trail1 = new Trail(this.mesh.position,0.1,color,0.8);
	this.trail2 = new Trail(this.mesh.position,0.1,color,0.8);

	this.flame = new Flame(this);

	this.phaserGlow1 = PHASER_IMPACT_MESH.clone();
	this.phaserGlow1.material = PHASER_IMPACT_MESH.material.clone();
	this.phaserGlow1.material.color = color.clone();
	this.phaserGlow1.material.color.lerp(new THREE.Color("white"), 0.8);
	this.mesh.add(this.phaserGlow1);	
	this.phaserGlow1.position.copy(new THREE.Vector3(0.7,0.7,0.11));
	this.phaserGlow1.scale.x = this.phaserGlow1.scale.y = 1.3;
	this.phaserGlow2 = this.phaserGlow1.clone()
	this.mesh.add(this.phaserGlow2);	
	this.phaserGlow2.position.y *= -1;
	
	this.initNewRound(new THREE.Vector3());
	
	this.spawn();
}

Hovercraft.prototype = Object.create(HBObject.prototype); // Hovercraft inherits from HBObject
Hovercraft.prototype.constructor = Hovercraft;

Hovercraft.prototype.initNewRound = function (startPos) {
	this.kills = 0;
	this.deaths = 0;
	this.hitpoints = HITPOINTS;
	this.shield = SHIELD;
	this.ammo = PHASER_AMMO;
	this.powerup = -1;
	this.powerupLasts = 0;

	this.body.position[0] = startPos.x;
	this.body.position[1] = startPos.y;
	this.beamed = true;
	this.body.angle = Math.random() * 2 * Math.PI;
	this.control.direction = this.body.angle;
	if (this.hidden) {
		this.unhide();
	}
	
	this.lastPhaserShot = INGAME_TIME; // for limiting firing speed
	this.phaserYOffset = 0.21; // offset between phaser shot line and center of the hovercraft
}

Hovercraft.prototype.hide = function(){
	this.hidden = true;
	PHYSICS_WORLD.removeBody(this.body);
	this.mesh.visible = false;
	this.trail1.reposition(new THREE.Vector3(0,0,-10000)); // TODO little parts of the trail are remaining for some reason
	this.trail2.reposition(new THREE.Vector3(0,0,-10000));
	this.flame.mesh.visible = false;
}

Hovercraft.prototype.unhide = function(){
	this.hidden = false;
	PHYSICS_WORLD.addBody(this.body);
	this.mesh.visible = true;
	this.beamed = true;
	this.flame.mesh.visible = true;
}

Hovercraft.prototype.update = function(){

	if(this.hidden){return;}

	this.shield += SHIELD_REGEN*DT;
	if(this.shield > SHIELD){this.shield = SHIELD;}
	this.shieldMesh.material.opacity *= 0.98;

	if(this.powerup == PU.BLUEBERRY){
		this.shield = SHIELD;
		this.shieldMesh.material.opacity = 0.7;
	}

	this.ammo += PHASER_REGEN*DT;
	if(this.ammo >= PHASER_AMMO){
		this.ammo = PHASER_AMMO;
		this.phaserGlow1.visible = this.phaserGlow2.visible = true;
	}
	else{
		this.phaserGlow1.visible = this.phaserGlow2.visible = false;
	}

	this.powerupLasts -= DT;
	if(this.powerupLasts<0){
		this.powerup = -1;
		this.powerupLasts = 0;
	}

	// smoke
	if(Math.random() < Math.pow(1-this.hitpoints/HITPOINTS,1.7)*10*DT){
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
		//effect.mesh.material.color = this.color.clone();
		//effect.mesh.material.color.lerp(new THREE.Color("black"), 0.7);
		effect.mesh.material.color = new THREE.Color("white");
		effect.growth = 3;
		effect.decay = 2;
		effect.spawn();
	}


	// explode and respawn after 3 seconds
	if(this.hitpoints <= 0){
		explosion(this.mesh.position.clone(), this.color.clone());
		playSound(SOUNDS.explosion, 1.4, 1.0, 0.0);
		this.deaths++;
		this.killedBy.kills++;
		this.hide();
		this.hitpoints = HITPOINTS;
		this.shieldpoints = SHIELD;
		this.powerup = -1;
		this.powerupLasts = 0;
		if(GLOBAL_POWERUP_TARGET.victim == this){
			GLOBAL_POWERUP_TARGET.pu = -1;
			GLOBAL_POWERUP_TARGET.victim = [];
		}

		ingameTimeout(3, function(){
			var startPos = findAccessiblePosition(2);
			this.body.position[0] = startPos.x;
			this.body.position[1] = startPos.y;
			this.beamed = true;
			this.body.angle = Math.random()*2*Math.PI;
			this.control.direction = this.body.angle;
			this.unhide();
			this.update();

			effect = new Effect();
			effect.type = 'star';
			effect.mesh = STAR_MESH.clone();
			effect.mesh.position.copy(this.mesh.position);
			effect.mesh.renderOrder = STAR_MESH.renderOrder; // TODO: maybe remove if fixed in three.js
			effect.mesh.material = STAR_MESH.material.clone();
			effect.mesh.material.color.copy(this.color);
			effect.mesh.scale.set(3,3,1);
			effect.spawn();
			effect.strength = 5;
			effect.decay = 40;
			effect.growth = 30;

			playSound(SOUNDS.splash, 0.5, 1.0, false);

		}.bind(this));
	}

	

	if(typeof(this.control) != "undefined"){
		this.control.update();
		if(this.powerup == PU.BEANS){this.control.thrust*=2;}

		if((GLOBAL_POWERUP_TARGET.pu == PU.BONBON
				|| GLOBAL_POWERUP_TARGET.pu == PU.GARLIC)
				&& GLOBAL_POWERUP_TARGET.victim != this){
			this.control.direction = Math.atan2(
				GLOBAL_POWERUP_TARGET.victim.body.position[1] - this.body.position[1],
				GLOBAL_POWERUP_TARGET.victim.body.position[0] - this.body.position[0]);
			if(GLOBAL_POWERUP_TARGET.pu == PU.GARLIC){
				this.control.direction += Math.PI;
			}
			this.control.thrust = 1;
		}

		var tau = 0.1; // for rotation lowpass filter
		if(this.powerup == PU.CANNABIS){
			this.control.thrust*=0.3;
			tau*=4;
		}
		var q = 1.0 - Math.exp(-DT/tau);

		var watchdog = 0;
		while(this.control.direction > Math.PI && watchdog<10){this.control.direction -= 2*Math.PI; watchdog++;}
		while(this.control.direction <-Math.PI && watchdog<10){this.control.direction += 2*Math.PI; watchdog++;}
		while(this.body.angle - this.control.direction > Math.PI && watchdog<10){this.body.angle -= 2*Math.PI; watchdog++;}
		while(this.control.direction - this.body.angle > Math.PI && watchdog<10){this.body.angle += 2*Math.PI; watchdog++;}

		if(watchdog>6){
			console.log("This should not have happened. Sorry.")
		}

		this.body.angle = q * this.control.direction + (1.0-q) * this.body.angle;
		//this.body.angle = this.control.direction;

		//if(this.control.thrust){
			this.body.force[0] = Math.cos(this.body.angle)*17*this.body.mass * this.control.thrust;
			this.body.force[1] = Math.sin(this.body.angle)*17*this.body.mass * this.control.thrust;
		//}

		if(this.control.fire){
			this.shootPhaser();
		}
	}

	HBObject.prototype.update.call(this);

	if(this.beamed){
		this.trail1.reposition(this.localToWorld3(new THREE.Vector3(-0.7*this.radius,-0.7*this.radius,0.1)));
		this.trail2.reposition(this.localToWorld3(new THREE.Vector3(-0.7*this.radius, 0.7*this.radius,0.1)));
		this.beamed = false;
	}
	else{
		this.trail1.meshline.advance(this.localToWorld3(new THREE.Vector3(-0.7*this.radius,-0.7*this.radius,0.1)));
		this.trail2.meshline.advance(this.localToWorld3(new THREE.Vector3(-0.7*this.radius, 0.7*this.radius,0.1)));
	}
	this.flame.update();
}

Hovercraft.prototype.shootPhaser = function(){

	var cannabisfactor = 1;
	if(this.powerup == PU.CANNABIS){
		cannabisfactor = 1.5;
	}

	if(this.lastPhaserShot < INGAME_TIME - 1/PHASER_FIRE_RATE*cannabisfactor && this.ammo > 2){ // can I fire already?
		this.ammo -= 2;
		if(this.powerup != PU.CANNABIS || Math.random()<0.5){
			new Phaser(this); // create new phaser shot with this hovercraft as its parent
		}
		this.phaserYOffset *= -1; // invert y offset to shoot from the other cannon
		if(this.powerup != PU.CANNABIS || Math.random()<0.5){
			new Phaser(this);
		}
		this.phaserYOffset *= -1;
		this.lastPhaserShot = INGAME_TIME;
		playSound(SOUNDS.phaserShot, 0.05, Math.random()*0.5 + 2.8, false)
	}
}

Hovercraft.prototype.hitBy = function(thing){
	
	this.shield -= 1;
	if(this.shield<=0){
		this.hitpoints += this.shield;
		this.shield = 0;
		this.shieldMesh.material.opacity = 0;
	}
	else{
		this.shieldMesh.material.opacity = this.shield/SHIELD*0.5+0.5; // will be reduced by update before first render...
	}

	if(this.hitpoints <= 0){
		if(thing.type == "phaser"){		
			this.killedBy = thing.shooter;
		}
	}
}

Hovercraft.prototype.collect = function(pu){
	this.powerup = pu;
	this.powerupLasts = POWERUP_DURATIONS[pu];

	if(pu == PU.ALOEVERA){this.hitpoints = HITPOINTS;}
	if(pu == PU.CIGARETTE){this.hitpoints = 0.0001;}

	if(pu == PU.BONBON || pu == PU.GARLIC){
		GLOBAL_POWERUP_TARGET.pu = pu;
		GLOBAL_POWERUP_TARGET.victim = this;
		ingameTimeout(POWERUP_DURATIONS[pu], function(){
			GLOBAL_POWERUP_TARGET.pu = -1;
			GLOBAL_POWERUP_TARGET.victim = [];
		});
	}
}













