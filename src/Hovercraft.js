
// depends on HBObject.js

var HOVERCRAFT_MESH;
LOADING_LIST.addItem('hovercraftmesh');
loadObjMtl( 'media/objects/glider.obj', 'media/objects/glider.mtl', function (object) {
	HOVERCRAFT_MESH = object;
	LOADING_LIST.checkItem('hovercraftmesh');
});


var HEADLIGHT_MESH = new THREE.Mesh(
	new THREE.PlaneGeometry( 1, 1),
	new THREE.MeshBasicMaterial({
		map: loadTexture( 'media/textures/headlight.png' ),
		color: 0xffffff,
		transparent: true,
		depthWrite: false,
		side: THREE.FrontSide}));
HEADLIGHT_MESH.renderOrder = RENDER_ORDER.phaser;
HEADLIGHT_MESH.position.set(4.7,0,0.1);
HEADLIGHT_MESH.scale.set(7,3.5,1);


function Hovercraft(color, control){
	HBObject.call(this); // inheritance

	this.type = 'hover';
	this.hidden = false; // if the hovercraft is on the map and taking part in the game
	this.color = color;
	this.playerName = '';
	this.hitpoints = 0;
	this.shield = 0;
	this.ammo = 0;
	this.radius = HOVER_RADIUS;
	this.control = control;
	this.beamed = false; // so that the trail does not draw a stroke all over the place
	this.kills = 0;
	this.killedBy = {};
	this.deaths = 0;
	this.powerup = POWERUPS.nothing; // active powerup (-1 = none)
	this.powerupLasts = 0; // time/shots until powerup is over
	this.lastPosition = new THREE.Vector2(0,0); // for line crossing tests
	this.newPosition = new THREE.Vector2(0,0);
	this.thrustSound = playSound(SOUNDS.thrust, 0.0, 1.0, true);

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
	//this.mesh.getObjectByName('arrow').material = this.mesh.getObjectByName('halo').material;

	this.mesh.getObjectByName('body').material.color.copy(this.color);
	this.mesh.getObjectByName('bumper').material.color.copy(this.color);
	this.mesh.getObjectByName('bumper').material.color.lerp(new THREE.Color(0.3,0.3,0.3), 0.5);
	this.mesh.getObjectByName('halo').material.color.copy(this.color);
	
	this.mesh.scale.x = this.mesh.scale.y = this.mesh.scale.z = this.radius;

	this.mesh.position.z = 0.1; // so it doesn't sink in waves

	this.shieldMesh = new THREE.Mesh(
            new THREE.SphereGeometry(1.7,9,9),
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

	this.headlight = HEADLIGHT_MESH.clone();
	this.mesh.add(this.headlight);

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
	
	this.initNewRound(0);
	
	this.spawn();
}

Hovercraft.prototype = Object.create(HBObject.prototype); // Hovercraft inherits from HBObject
Hovercraft.prototype.constructor = Hovercraft;

Hovercraft.prototype.initNewRound = function (iPlayer) {

	var startPos;

	if(GAME_MODE == "T" || GAME_MODE == "R"){ // time trial or race: place players along start line
		startPos = STARTLINE.p0.clone().lerp(STARTLINE.p1,(iPlayer+1)/(NUM_PLAYERS+1));
		this.control.direction = this.body.angle =
			Math.atan2(STARTLINE.p1.y-STARTLINE.p0.y, STARTLINE.p1.x-STARTLINE.p0.x)+Math.PI/2;
		this.racetime = 0;
		this.finished = false;
		this.lastPosition.copy(startPos); // for line crossing tests
		this.newPosition.copy(startPos);
	}
	else if(GAME_MODE == "D" || GAME_MODE == "X"){ // death match or shooting range: place randomly on map
		startPos = findAccessiblePosition(-1);
		this.control.direction = this.body.angle = Math.random() * 2 * Math.PI;
	}
	if(GAME_MODE == "X"){ // shooting range
		this.targets = 0;
		this.mines = 0;
	}

	this.continu = false; // whether the player has voted to continue the game during result display

	this.kills = 0;
	this.deaths = 0;
	this.hitpoints = HITPOINTS;
	this.shield = SHIELD;
	this.ammo = PHASER_AMMO;
	this.powerup = POWERUPS.nothing;
	this.powerupLasts = 0;
	this.fireReleased = false;

	this.body.position[0] = startPos.x;
	this.body.position[1] = startPos.y;
	this.body.velocity[0] = this.body.velocity[1] = 0;
	this.beamed = true;
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
	this.setThrustGain(0.0);
}

Hovercraft.prototype.unhide = function(){
	this.hidden = false;
	PHYSICS_WORLD.addBody(this.body);
	this.mesh.visible = true;
	this.beamed = true;
	this.flame.mesh.visible = true;
}

Hovercraft.prototype.setThrustGain = function(gain) {
	this.thrustSound.gn.gain.value = gain;
}

Hovercraft.prototype.update = function(){

	//this.mesh.position.z = coastDistance(this.body.position[0], this.body.position[1]);
	//if(coastDistance(this.body.position[0], this.body.position[1])>0){breakpoint();}

	if(this.hidden){
		return;
	}

	var localdt = DT;
	

	this.shield += SHIELD_REGEN*localdt;
	if(this.shield > SHIELD){this.shield = SHIELD;}
	this.shieldMesh.material.opacity *= 0.98;

	if(this.powerup == POWERUPS.shield){
		this.shield = SHIELD;
		this.shieldMesh.material.opacity = 0.7;
	}

	this.ammo += PHASER_REGEN*localdt;
	if(this.powerup == POWERUPS.adrenaline){
		this.ammo = PHASER_AMMO;
	}
	if(this.ammo >= PHASER_AMMO){
		this.ammo = PHASER_AMMO;
		this.phaserGlow1.visible = this.phaserGlow2.visible = true;
	}
	else{
		this.phaserGlow1.visible = this.phaserGlow2.visible = false;
	}

	if(this.powerup == POWERUPS.shield || this.powerup == POWERUPS.adrenaline){
		this.powerupLasts -= localdt;
		if(this.powerupLasts<0){
			this.powerup = POWERUPS.nothing;
			this.powerupLasts = 0;
		}
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

	this.controlHover();

	// explode and respawn after 3 seconds
	if(this.hitpoints <= 0){
		explosion(this.mesh.position.clone(), this.color.clone());
		playSound(SOUNDS.explosion, 1.4, 1.0, 0.0);
		this.deaths++;
		this.killedBy.kills++;
		this.hide();
		this.hitpoints = HITPOINTS;
		this.shieldpoints = SHIELD;
		this.powerup = POWERUPS.nothing;

		if(GAME_MODE != "T" && GAME_MODE != "R"){ // don't respawn in time trials after suicide or in race
			ingameTimeout(RESPAWN_TIME, function(){
				var startPos = findAccessiblePosition(-2);

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

				playSound(SOUNDS.splash, 0.0, 1.0, false, Math.random());

			}.bind(this));
		}
	}

	HBObject.prototype.update.call(this);

	this.lastPosition.copy(this.newPosition);
	this.newPosition.fromArray(this.body.position);

	if(this.beamed){
		this.trail1.reposition(this.localToWorld3(new THREE.Vector3(-0.7*this.radius,-0.7*this.radius,0.1)));
		this.trail2.reposition(this.localToWorld3(new THREE.Vector3(-0.7*this.radius, 0.7*this.radius,0.1)));
		this.beamed = false;
	}
	else{
		this.trail1.meshline.advance(this.localToWorld3(new THREE.Vector3(-0.7*this.radius,-0.7*this.radius,0.1)));
		this.trail2.meshline.advance(this.localToWorld3(new THREE.Vector3(-0.7*this.radius, 0.7*this.radius,0.1)));
	}
	//console.log(this.flame.mesh.scale.x)
	this.flame.update();
	//console.log(this.flame.mesh.scale.x)
	if(this.powerup == POWERUPS.adrenaline){
		//console.log(this.flame.mesh.scale.x)
		this.flame.mesh.scale.x *= ADRENALINE_BOOST;
		this.flame.mesh.scale.y *= ADRENALINE_BOOST;
		//console.log(this.flame.mesh.scale.x)
	}
}

Hovercraft.prototype.controlHover = function() {
	if(typeof(this.control) != "undefined"){

		this.control.update();

		if(GAME_PHASE != "G"){this.control.thrust = 0;} // game not going

		var tau = 0.1; // for rotation lowpass filter
		var q = 1.0 - Math.exp(-DT/tau);

		var watchdog = 0;
		while(this.control.direction > Math.PI && watchdog<10){this.control.direction -= 2*Math.PI; watchdog++;}
		while(this.control.direction <-Math.PI && watchdog<10){this.control.direction += 2*Math.PI; watchdog++;}
		while(this.body.angle - this.control.direction > Math.PI && watchdog<10){this.body.angle -= 2*Math.PI; watchdog++;}
		while(this.control.direction - this.body.angle > Math.PI && watchdog<10){this.body.angle += 2*Math.PI; watchdog++;}

		if(watchdog>6){
			console.log("This should not have happened. Sorry.")
		}

		this.setThrustGain(this.control.thrust*0.3);

		this.body.angle = q * this.control.direction + (1.0-q) * this.body.angle;
		//this.body.angle = this.control.direction;

		var boost = 1.0;
		if(this.powerup == POWERUPS.adrenaline){boost = ADRENALINE_BOOST;}

		this.body.force[0] = Math.cos(this.body.angle)*HOVER_THRUST*this.body.mass * this.control.thrust * boost;
		this.body.force[1] = Math.sin(this.body.angle)*HOVER_THRUST*this.body.mass * this.control.thrust * boost;


		if(this.control.fire){
			if(this.powerup == POWERUPS.missile){
				if(this.fireReleased){
					var m = new Missile(this);

					var locktarget = null;
					var deltamin = 1000;

					for(var i=0; i<hovers.length; i++){
						if(hovers[i] == this || hovers[i].hidden){continue;} // don't aim at yourself or hidden hovers
						var targetdir = Math.atan2( // TODO this could be done faster with dot product but I'm too tired now and just copied from the phaser homing code
							hovers[i].body.position[1] - this.body.position[1],
							hovers[i].body.position[0] - this.body.position[0]);
						var dir = this.body.angle;
						var delta = targetdir - dir;
						if(delta >  Math.PI){delta -= 2*Math.PI;}
						if(delta < -Math.PI){delta += 2*Math.PI;}
						if(Math.abs(delta) < deltamin){
							deltamin = Math.abs(delta);
							locktarget = hovers[i];
						}
					}
				
					m.lock = locktarget;
					
					this.powerupLasts--;
					if(this.powerupLasts <= 0.000001){
						this.powerupLasts = 0;
						this.powerup = POWERUPS.nothing;
					}
				}
			}
			else if(this.powerup == POWERUPS.seamine){
				if(this.fireReleased){
					var m = new Seamine(this);

					this.powerupLasts--;
					if(this.powerupLasts <= 0.000001){
						this.powerupLasts = 0;
						this.powerup = POWERUPS.nothing;
					}
				}
			}
			else{ // phaser
				// race or death match or shooting range ongoing?
				if((GAME_MODE == "R" || GAME_MODE == "D" || GAME_MODE == "X") && GAME_PHASE == "G"){
					this.shootPhaser();
				}
				else if(GAME_MODE == "T" && GAME_PHASE == "G"){ // time trial
					this.hitpoints = 0; // explode
					GAME_PHASE = "O"; // round over
					ingameTimeout(1, function(){newRound();});
				}
			}
			this.fireReleased = false;
		}
		else{
			this.fireReleased = true;
		}

	}
}

Hovercraft.prototype.shootPhaser = function(){

	var boost = 1.0;
	if(this.powerup == POWERUPS.adrenaline){
		boost = ADRENALINE_BOOST;
	}

	if(this.lastPhaserShot < INGAME_TIME - 1/PHASER_FIRE_RATE/boost && this.ammo > 2){ // can I fire already?
		this.ammo -= 2;
		var p;
		var locktarget;

        p = new Phaser(this); // create new phaser shot with this hovercraft as its shooter
		if(this.powerup == POWERUPS.adrenaline){		
			p.body.angle += 0.15*Math.random()-0.02;
			p.velocity *= ADRENALINE_BOOST;
			p.body.velocity[0] = Math.cos(p.body.angle)*p.velocity;
			p.body.velocity[1] = Math.sin(p.body.angle)*p.velocity;
		}
		this.phaserYOffset *= -1; // invert y offset to shoot from the other cannon
        p = new Phaser(this);
		if(this.powerup == POWERUPS.adrenaline){		
			p.body.angle -= 0.15*Math.random()-0.02;
			p.velocity *= ADRENALINE_BOOST;
			p.body.velocity[0] = Math.cos(p.body.angle)*p.velocity;
			p.body.velocity[1] = Math.sin(p.body.angle)*p.velocity;
		}
		this.phaserYOffset *= -1;

		this.lastPhaserShot = INGAME_TIME;
		// playSound(SOUNDS.phaserShot, 0.05, Math.random()*0.5 + 2.8, false) // this was first phaser
		playSound(SOUNDS.phaserShot, 0.25, Math.random()*0.1 + 0.5, false) // this was first phaser
	}
}

Hovercraft.prototype.hitBy = function(thing){
	
	if(GAME_MODE != "R"){ // no damage during race
		if(thing.type == "phaser"){
			this.shield -= 1;
		}
		if(thing.type == "missile"){
			this.shield -= MISSILE_DAMAGE;
		}
		if(thing.type == "seamine"){
			this.shield -= SEAMINE_DAMAGE;
		}
	}

	if(this.shield<=0){
		this.hitpoints += this.shield;
		this.shield = 0;
		this.shieldMesh.material.opacity = 0;
	}
	else{
		this.shieldMesh.material.opacity = this.shield/SHIELD*0.5+0.5; // will be reduced by update before first render...
	}

	if(this.hitpoints <= 0){
		if(thing.type == "phaser" || thing.type == "missile" || thing.type == "seamine"){		
			this.killedBy = thing.shooter;
		}
	}
}

Hovercraft.prototype.wallhit = function(){
	if(GAME_MODE == "R" || GAME_MODE == "T"){ // penalty
		this.body.velocity[0] *= 0.2;
		this.body.velocity[1] *= 0.2;
		effect = new Effect();
		effect.type = 'star';
		effect.mesh = STAR_MESH.clone();
		effect.mesh.position.x = this.body.position[0];
		effect.mesh.position.y = this.body.position[1];
		effect.mesh.position.z = 0.2;
		effect.mesh.renderOrder = STAR_MESH.renderOrder; // TODO: maybe remove if fixed in three.js
		effect.mesh.material = STAR_MESH.material.clone();
		effect.mesh.material.color.copy(this.color);
		effect.mesh.scale.set(2,2,1);
		effect.spawn();
		effect.strength = 5;
		effect.decay = 80;
		effect.growth = 30;
	}
} 

Hovercraft.prototype.collect = function(pu){

	if(pu == POWERUPS.repair){
		this.hitpoints = HITPOINTS;	
	}
	else{
		this.powerup = pu;
		this.powerupLasts = pu.count;
	}
}













