
// depends on Effects.js

EXPLOSION_DEBUG = false

// smokeball

var smokeballNormalmap = loadTexture('media/textures/smokeball_normal_lq.png');
smokeballNormalmap.minFilter = THREE.LinearFilter // mip mapping causes a seam in the pacific
var smokeballAOmap = loadTexture('media/textures/smokeball_ao_hc_mq.png');
smokeballAOmap.minFilter = THREE.LinearFilter

var smokeballVertexShader = `
varying vec3 vLocalPosition;
varying vec3 vGlobalPosition;
varying vec3 vViewPosition;

#include <common>

void main() {
	#include <begin_vertex>
	#include <project_vertex>
	vLocalPosition = position;
	vGlobalPosition = (modelMatrix * vec4(position, 1.0)).xyz;
	vViewPosition = - mvPosition.xyz;
}`;



var smokeballFragmentShader = `
uniform float coreGlowStrength;
uniform vec3 coreColor;
uniform vec3 smokeColor;
uniform float smokeEmissiveness;
uniform float opacity;

uniform sampler2D smokeNormal;
uniform sampler2D smokeAO;

uniform mat3 normalMatrix;
uniform mat4 modelMatrix;
#include <common>

#include <bsdfs>
#include <lights_pars_begin>
#include <lights_phong_pars_fragment>

varying vec3 vLocalPosition;
varying vec3 vGlobalPosition;

float map(float value, float min1, float max1, float min2, float max2) {
	return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}

void main() {

	float psi = atan(-vLocalPosition.x, vLocalPosition.y);
	float phi = asin(vLocalPosition.z/length(vLocalPosition));
	vec2 sphereUV = vec2(psi/2.0/PI+0.5, phi/PI+0.5);
	vec3 localNormal = normalize(texture2D(smokeNormal, sphereUV).rgb * 2.0 - 1.0);
	vec3 normal = normalize(normalMatrix * localNormal);
	float ao = texture2D(smokeAO, sphereUV).r;

	vec3 modelPos = modelMatrix[3].xyz;
	vec3 cameraPos = cameraPosition;

	float coreMask = saturate(
		coreGlowStrength *
		pow(
			dot(
				normalize(modelPos-vGlobalPosition),
				normalize(modelPos-cameraPos)
			),
			8.0
		) * normal.z * map(ao, 0.0, 1.0, 2.0, 0.5)
	);
	float smokeMask = 1.0-coreMask;


	vec4 diffuseColor = vec4( ao*smokeColor, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );

	vec3 specular = vec3(0.0, 0.0, 0.0);
	float shininess = 0.0;
	float specularStrength = 0.0;

	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_end>

	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular;

	vec3 smokeMix = smokeEmissiveness * smokeColor + (1.0-smokeEmissiveness) * outgoingLight;

	gl_FragColor = vec4( smokeMask * smokeMix + coreMask * coreColor, diffuseColor.a );
}`;


var SMOKEBALL_MESH;

loadCollada( 'media/objects/cloud.dae', function (object) {
	SMOKEBALL_MESH = object.children[0];
	if(EXPLOSION_DEBUG && false){
		SMOKEBALL_MESH.scale.x = SMOKEBALL_MESH.scale.y = SMOKEBALL_MESH.scale.z = 10
	}
	else{
		SMOKEBALL_MESH.scale.x = SMOKEBALL_MESH.scale.y = SMOKEBALL_MESH.scale.z = 0.0001
	}

	uniforms = THREE.UniformsLib['lights']
	uniforms.smokeNormal = { type: "t", value: smokeballNormalmap }
	uniforms.smokeAO = { type: "t", value: smokeballAOmap }

	var smokeballMaterial = new THREE.ShaderMaterial({ // uniforms do not get cloned (only linked) so this was necessary
		uniforms: uniforms,
		vertexShader: smokeballVertexShader,
		fragmentShader: smokeballFragmentShader,
		transparent: true,
		alphaTest: 0.01,
		lights: true
	});

	SMOKEBALL_MESH.material = smokeballMaterial;
	SMOKEBALL_MESH.renderOrder = RENDER_ORDER.explosion;

	Scene.graphicsScene.add( SMOKEBALL_MESH );
});

// shockwave

var shockwaveTexture = loadTexture('media/textures/shockwave.png');
var shockwaveMaterial = new THREE.MeshBasicMaterial( { map: shockwaveTexture, color: 0xffffff, transparent:true, alphaTest:0.01} );
var shockwaveGeometry = new THREE.PlaneGeometry( 1, 1 );
var SHOCKWAVE_MESH = new THREE.Mesh( shockwaveGeometry, shockwaveMaterial );
SHOCKWAVE_MESH.position.set(0,0,0.1);
SHOCKWAVE_MESH.renderOrder = RENDER_ORDER.explosion;
//Scene.graphicsScene.add( shockwave );

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

	//Scene.graphicsScene.add( CRUMB_MESH );
});

// smoke

var smokeMaterial = new THREE.MeshBasicMaterial( { map: loadTexture('media/textures/smoke.png'), transparent:true, alphaTest: 0.01} );
var smokeGeometry = new THREE.PlaneGeometry( 1, 1 );
var SMOKE_MESH = new THREE.Mesh( smokeGeometry, smokeMaterial );
SMOKE_MESH.position.set(0,0,0.1);
SMOKE_MESH.renderOrder = RENDER_ORDER.smoke;

// star

var starMaterial = new THREE.MeshBasicMaterial( { map: loadTexture('media/textures/star.png'), transparent:true, alphaTest: 0.01} );
var starGeometry = new THREE.PlaneGeometry( 1, 1 );
var STAR_MESH = new THREE.Mesh( starGeometry, starMaterial );
STAR_MESH.position.set(0,0,0.1);
STAR_MESH.renderOrder = RENDER_ORDER.smoke;


function explosion(position, color, scale=1.0){

	// smokeball

	var effect = new Effect();
	effect.type = 'smokeball';
	effect.mesh = SMOKEBALL_MESH.clone();
	effect.mesh.position.copy(position);
	effect.mesh.renderOrder = SMOKEBALL_MESH.renderOrder; // TODO: maybe remove if fixed in three.js
	effect.mesh.material = SMOKEBALL_MESH.material.clone(); // so we can change the color without changing the color of all smokeballs
	effect.mesh.material.uniforms.strength = { type: "f", value: 1.1};
	effect.mesh.material.uniforms.coreColor = { type: "c", value: new THREE.Color(0xffffff)};
	effect.mesh.material.uniforms.coreGlowStrength = { type: "f", value: 1.0};
	effect.mesh.material.uniforms.smokeColor = { type: "c", value: new THREE.Color( color )};
	effect.mesh.material.uniforms.smokeEmissiveness = { type: "f", value: 1.0};
	effect.mesh.material.uniforms.smokeNormal = { type: "t", value: smokeballNormalmap};
	effect.mesh.material.uniforms.smokeAO = { type: "t", value: smokeballAOmap};
	effect.mesh.material.uniforms.opacity = { type: "f", value: 1.0};
	effect.mesh.rotation.x = Math.random()*1000;
	effect.mesh.rotation.y = Math.random()*1000;
	effect.mesh.rotation.z = Math.random()*1000;
	effect.spin.x = 0//(Math.random()-0.5)*6;
	effect.spin.y = 0//(Math.random()-0.5)*6;
	effect.spin.z = 0//(Math.random()-0.5)*6;
	effect.spawn();
	effect.strength = 1.5;
	effect.decay = 3.3;
	effect.growth = 10*scale;

	var smokeTarget = new THREE.Color(0xbbbbbb)

	effect.specialUpdate = function(){
		var cappedStrength = THREE.Math.clamp(this.strength, 0.0, 1.0)
		this.mesh.material.uniforms.coreGlowStrength.value = cappedStrength + 0.5
		this.mesh.material.uniforms.coreColor.value.setRGB(1.0, 1.0, 1.0).lerp(color, 1.0-cappedStrength)
		this.mesh.material.uniforms.smokeColor.value.copy(color).lerp(smokeTarget, 1.0-cappedStrength)
		this.mesh.material.uniforms.smokeEmissiveness.value = 0.7*cappedStrength
		this.mesh.material.uniforms.opacity.value = Math.pow(cappedStrength, 0.25)
	}

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
	effect.growth = 25*scale;

	// little crumbs

	for(var i=0; i<30; i++){
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
		var vr=Math.random()*15+5;
		var vz=Math.random()*10+5;
		effect.velocity = new THREE.Vector3(Math.cos(phi)*vr,Math.sin(phi)*vr,vz);
		effect.acceleration = new THREE.Vector3(0,0,-30);
		effect.mesh.rotation.x = Math.random()*1000;
		effect.mesh.rotation.y = Math.random()*1000;
		effect.mesh.rotation.z = Math.random()*1000;
		effect.spin.z = Math.random()*20;

		if(i<=10){ // those become smoking crumbs!
			effect.mesh.material.color.copy(color);
			effect.mesh.scale.x = Math.random()*0.2+0.1;
			effect.mesh.scale.y = Math.random()*0.2+0.3;
			effect.mesh.scale.z = Math.random()*0.2+0.45;
			vr*=2;
			vz*=2;

			effect.update = function(){ // create smoke traces
				if(FRAME_COUNTER % 7 == 0){
					var subeffect = new Effect();
					subeffect.type = 'smoke';
					subeffect.mesh = SMOKE_MESH.clone();
					subeffect.mesh.position.copy(this.mesh.position);
					subeffect.mesh.transparent = true;
					subeffect.mesh.alphaTest = 0.01;
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
