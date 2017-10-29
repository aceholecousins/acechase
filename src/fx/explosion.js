
// depends on Effects.js

// source of fire texture: https://tpfto.wordpress.com/2012/02/
// source of smoke sprite: https://hifi-public.s3.amazonaws.com/alan/Particles/Particle-Sprite-Smoke-1.png

// fireball

//TODO: the explosion is not yet super sexy somehow
var fireballTexture = loadTexture('media/textures/fireball.png');

var fireballVertexShader = `
	varying vec3 pos;
	varying vec3 nml;

	void main() {
		pos = position;
		nml = normal;
	  gl_Position = projectionMatrix *
		        modelViewMatrix *
		        vec4(position,1.0);
	}`;

var fireballFragmentShader = `
	#define PI 3.141592654

	varying vec3 pos;
	varying vec3 nml;
	uniform sampler2D firetex;
	uniform float strength;
	uniform vec3 color;

	float TANH(float x){return (1.0-exp(-2.0*x))/(1.0+exp(-2.0*x));}

	void main(){
		float psi=atan(pos.y, pos.x);
		float phi = asin(pos.z/length(pos));
		vec3 rgb = texture2D(firetex, vec2(psi/2.0/PI+0.5, phi/PI+0.5)).rgb;
	
		float process = 1.0-strength;
		if(process<0.0){process = 0.0;}
		if(process>1.0){process = 1.0;}
		float qcore = rgb.g; // how much the current pixel is core
		float qsmoke = 1.0-rgb.r; // how much the current pixel is smoke
		float qmeat = 1.0-qcore-qsmoke; // how much the current pixel is meat

		vec3 csmoke = color * exp(-5.0*process); // color for smoke
		float tsmoke = 1.0-exp(-5.0*(1.0-process)); // transparency for smoke
		vec3 ccore = mix(vec3(1.0,1.0,1.0), color, process); // color for core
		float tcore = 0.5-TANH((process-0.7)*5.0)*0.5; // transparency for core
		vec3 cmeat = mix(vec3(1.0,1.0,1.0), color, 1.0-exp(-15.0*process)); // color for meat
		float tmeat = 0.5-TANH((process-0.55)*10.0)*0.5; // transparency for meat

		gl_FragColor = qcore * vec4(ccore,tcore) + qsmoke * vec4(csmoke,tsmoke) + qmeat * vec4(cmeat,tmeat);
	}`;


var FIREBALL_MESH;
LOADING_LIST.addItem('fireballmesh');

OBJ_LOADER.load( 'media/objects/potatoe.obj', function (object) {
	FIREBALL_MESH = object.children[0];
	FIREBALL_MESH.scale.x = FIREBALL_MESH.scale.y = FIREBALL_MESH.scale.z = 0.0001;
	LOADING_LIST.checkItem('fireballmesh');

	var fireballMaterial = new THREE.ShaderMaterial({ // uniforms do not get cloned so this was necessary
		uniforms: {
			firetex:	{ type: "t", value: fireballTexture},
			strength:	{ type: "f", value: 1.0},
			color:		{ type: "c", value: new THREE.Color( 0xa0a0a0 )}
		},
		vertexShader:   fireballVertexShader,
		fragmentShader: fireballFragmentShader,
		transparent:	true
	});

	FIREBALL_MESH.material = fireballMaterial;
	FIREBALL_MESH.renderOrder = RENDER_ORDER.explosion;

	//GRAPHICS_SCENE.add( FIREBALL_MESH );
});

// shockwave

var shockwaveTexture = loadTexture('media/textures/shockwave.png');
var shockwaveMaterial = new THREE.MeshBasicMaterial( { map: shockwaveTexture, color: 0xffffff, transparent:true, alphaTest:0.5} );
var shockwaveGeometry = new THREE.PlaneGeometry( 1, 1 );
var SHOCKWAVE_MESH = new THREE.Mesh( shockwaveGeometry, shockwaveMaterial );
SHOCKWAVE_MESH.position.set(0,0,0.1);
SHOCKWAVE_MESH.renderOrder = RENDER_ORDER.explosion;
//GRAPHICS_SCENE.add( shockwave );

// crumbs

var CRUMB_MESH;
LOADING_LIST.addItem('crumbmesh');

OBJ_LOADER.load( 'media/objects/crumb.obj', function (object) {
	CRUMB_MESH = object.children[0];
	CRUMB_MESH.scale.x = CRUMB_MESH.scale.y = CRUMB_MESH.scale.z = 30;
	LOADING_LIST.checkItem('crumbmesh');

	CRUMB_MESH.geometry.computeFaceNormals();
	CRUMB_MESH.geometry.computeVertexNormals();
	CRUMB_MESH.material = new THREE.MeshPhongMaterial( {color:0x000000} );

	//GRAPHICS_SCENE.add( CRUMB_MESH );
});

// smoke

var smokeMaterial = new THREE.MeshBasicMaterial( { map: loadTexture('media/textures/smoke.png'), transparent:true} );
var smokeGeometry = new THREE.PlaneGeometry( 1, 1 );
var SMOKE_MESH = new THREE.Mesh( smokeGeometry, smokeMaterial );
SMOKE_MESH.position.set(0,0,0.1);
SMOKE_MESH.renderOrder = RENDER_ORDER.smoke;

// star

var starMaterial = new THREE.MeshBasicMaterial( { map: loadTexture('media/textures/star.png'), transparent:true} );
var starGeometry = new THREE.PlaneGeometry( 1, 1 );
var STAR_MESH = new THREE.Mesh( starGeometry, starMaterial );
STAR_MESH.position.set(0,0,0.1);
STAR_MESH.renderOrder = RENDER_ORDER.smoke;


function explosion(position, color, scale=1.0){

	// fireball

	var effect = new Effect();
	effect.type = 'fireball';
	effect.mesh = FIREBALL_MESH.clone();
	effect.mesh.position.copy(position);
	effect.mesh.renderOrder = FIREBALL_MESH.renderOrder; // TODO: maybe remove if fixed in three.js
	effect.mesh.material = FIREBALL_MESH.material.clone(); // so we can change the color without changing the color of all fireballs
	effect.mesh.material.uniforms.color = { type: "c", value: new THREE.Color( color )}; // new object necessary
	effect.mesh.material.uniforms.strength = { type: "f", value: 1.0}; // new object necessary
	effect.mesh.rotation.x = Math.random()*1000;
	effect.mesh.rotation.y = Math.random()*1000;
	effect.mesh.rotation.z = Math.random()*1000;
	effect.spin.x = (Math.random()-0.5)*6;
	effect.spin.y = (Math.random()-0.5)*6;
	effect.spin.z = (Math.random()-0.5)*6;
	effect.spawn();
	effect.strength = 1.1;
	effect.decay = 2;
	effect.growth = 10*scale;

	// shockwave
	
	effect = new Effect();
	effect.type = 'shockwave';
	effect.mesh = SHOCKWAVE_MESH.clone();
	effect.mesh.position.copy(position);
	effect.mesh.renderOrder = SHOCKWAVE_MESH.renderOrder; // TODO: maybe remove if fixed in three.js
	effect.mesh.material = SHOCKWAVE_MESH.material.clone();
	effect.mesh.scale.set(2,2,1);
	effect.spawn();
	effect.decay = 3;
	effect.growth = 50;

	// star
	
	effect = new Effect();
	effect.type = 'star';
	effect.mesh = STAR_MESH.clone();
	effect.mesh.position.copy(position);
	effect.mesh.renderOrder = STAR_MESH.renderOrder; // TODO: maybe remove if fixed in three.js
	effect.mesh.material = STAR_MESH.material.clone();
	effect.mesh.material.color.copy(color);
	effect.mesh.scale.set(3,3,1);
	effect.spawn();
	effect.strength = 5;
	effect.decay = 10;
	effect.growth = 15*scale;

	// little crumbs

	for(var i=0; i<20; i++){
		effect = new Effect();
		effect.type = 'crumb';
		effect.mesh = CRUMB_MESH.clone();
		effect.mesh.material = CRUMB_MESH.material.clone();
		effect.mesh.position.copy(position);
		effect.mesh.scale.x = effect.mesh.scale.y = effect.mesh.scale.z = (Math.random()*0.2+0.06);
		effect.spawn();
		effect.strength = 1.5;
		effect.decay = 0.3;
		var phi=Math.random()*2*3.1416;
		var vr=Math.random()*10+5;
		var vz=Math.random()*10+5;
		effect.velocity = new THREE.Vector3(Math.cos(phi)*vr,Math.sin(phi)*vr,vz);
		effect.acceleration = new THREE.Vector3(0,0,-30);
		effect.mesh.rotation.x = Math.random()*1000;
		effect.mesh.rotation.y = Math.random()*1000;
		effect.mesh.rotation.z = Math.random()*1000;	
		effect.spin.z = Math.random()*20;
		
		if(i<=4){ // those become smoking crumbs!
			effect.mesh.material.color.copy(color);
			effect.mesh.scale.x = Math.random()*0.2+0.1;
			effect.mesh.scale.y = Math.random()*0.2+0.3;
			effect.mesh.scale.z = Math.random()*0.2+0.45;
			vr*=2;
			vz*=2;

			effect.update = function(){ // create smoke traces
				if(FRAME_COUNTER % 4 == 0){
					var subeffect = new Effect();
					subeffect.type = 'smoke';
					subeffect.mesh = SMOKE_MESH.clone();
					subeffect.mesh.position.copy(this.mesh.position);
					subeffect.mesh.transparent = true;
					subeffect.mesh.renderOrder = SMOKE_MESH.renderOrder;
					subeffect.mesh.material = SMOKE_MESH.material.clone();
					subeffect.mesh.rotation.z = Math.random()*1000;
					subeffect.growth = 3;
					subeffect.decay = 2;
					subeffect.spawn();
				}

				Effect.prototype.update.call(this); // call original update function
			}
		}

	}

	// sparks
	
	for(var i=0; i<20; i++){
		effect = new Effect();
		effect.type = 'spark';
		effect.mesh = CRUMB_MESH.clone();
		effect.mesh.material = CRUMB_MESH.material.clone();
		effect.mesh.position.copy(position);
		effect.mesh.scale.x = 2;
		effect.mesh.scale.z = effect.mesh.scale.y = 0.1;
		effect.mesh.material.color.set(0xffa040);
		effect.mesh.material.emissive.set(0xffa040);
		effect.spawn();
		effect.decay = 2;
		var phi=Math.random()*2*3.1416;
		var vr=Math.random()*10+5;
		var vz=Math.random()*10+5;
		effect.velocity = new THREE.Vector3(Math.cos(phi)*vr,Math.sin(phi)*vr,vz);
		effect.mesh.rotation.order = 'ZYX';
		effect.mesh.rotation.y = -Math.atan(vz/vr);
		effect.mesh.rotation.z = phi;
	}	

}
