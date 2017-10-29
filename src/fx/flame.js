
var flameVertexShader = `
	varying vec2 vUv;

	void main() {
		vUv = uv;
	  gl_Position = projectionMatrix *
		        modelViewMatrix *
		        vec4(position,1.0);
	}`;

var flameFragmentShader = `
	varying vec2 vUv;
	uniform sampler2D flametex;
	uniform int index;
	uniform vec3 color;

	void main(){

		vec2 offset = vec2(0.0,0.0);
		float localIndex = float(index);
		if(localIndex >= 4.0){
			offset.y = 0.5;
			localIndex-=4.0;
		}
		offset.x = localIndex*0.25;

		vec4 rgba = texture2D(flametex, vec2(vUv.x*0.25 + offset.x, vUv.y*0.5 + offset.y));

		vec3 white = vec3(1.0,1.0,1.0);
		vec3 brightColor = mix(color, white, 0.5);

		gl_FragColor = vec4(rgba.z * white + (1.0-rgba.b)*(rgba.y * brightColor + (1.0-rgba.y) * rgba.x * color), rgba.w);
		//gl_FragColor = vec4(1.0,0.0,0.0,0.5);
	}`;

var FLAME_TEXTURE = loadTexture('media/textures/jetflame.png');

var FLAME_MESH = new THREE.Mesh(new THREE.PlaneGeometry( 1, 1), null);

FLAME_MESH.renderOrder = RENDER_ORDER.phaser;
FLAME_MESH.position.z = 0.1;

function Flame(hover){

	this.hover = hover;
	this.len = 2.0*hover.radius;
	this.mesh = FLAME_MESH.clone();
	this.mesh.renderOrder = FLAME_MESH.renderOrder; // TODO: maybe remove if fixed in three.js
	this.mesh.material = new THREE.ShaderMaterial({ // material.clone() does not clone uniforms so this was necessary
		uniforms: {
			flametex:	{ type: "t", value: FLAME_TEXTURE},
			index:		{ type: "i", value: 0},
			color:		{ type: "c", value: hover.color.clone()}
		},
		vertexShader:   flameVertexShader,
		fragmentShader: flameFragmentShader,
		transparent:	true
	});

	this.mesh.scale.x = 0.5*this.len;
	this.mesh.scale.y = this.len;
	GRAPHICS_SCENE.add(this.mesh);
}

Flame.prototype.update = function(){
	this.mesh.position.x = this.hover.mesh.position.x;
	this.mesh.position.copy(this.hover.localToWorld3(new THREE.Vector3(-this.hover.radius-this.hover.control.thrust*this.len/2,0,0.1)));
	this.mesh.scale.x = 0.5 * this.len;
	this.mesh.scale.y = (this.hover.control.thrust+0.000001) * this.len;
	this.mesh.rotation.z = this.hover.mesh.rotation.z+1.57;
	this.mesh.material.uniforms.index.value = Math.floor(Math.random()*8);
}
