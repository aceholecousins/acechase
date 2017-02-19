
var WATER_COLOR = new THREE.Color(0x1080ff); // will be overwritten by background color of outline in map svg
var WATER_OPACITY = 0.75; // so will this



// This is the 'compute shader' for the water heightmap:
var heightmapFragmentShader = `

	uniform float viscosityConstant;
	uniform float time;
	uniform vec4 disturbances [NDISTURBS]; //xy=position on water, z=depth, w=sigma

	#define deltaTime ( 1.0 / 60.0 )
	#define GRAVITY_CONSTANT ( resolution.x * deltaTime * 10.0 )

	void main()	{

		vec2 cellSize = 1.0 / resolution.xy;
		vec2 uv = gl_FragCoord.xy * cellSize;

		// heightmapValue.x == height
		// heightmapValue.y == velocity
		// heightmapValue.z == reference height (disturbed by disturbances)
		// heightmapValue.w == 1.0 for water, 0.0 for coast
		vec4 heightmapValue = texture2D( heightmap, uv );

		// Get neighbours
		vec4 N = texture2D( heightmap, uv + vec2( 0.0, cellSize.y ) );
		vec4 S = texture2D( heightmap, uv + vec2( 0.0, - cellSize.y ) );
		vec4 E = texture2D( heightmap, uv + vec2( cellSize.x, 0.0 ) );
		vec4 W = texture2D( heightmap, uv + vec2( - cellSize.x, 0.0 ) );

		float sump = (N.w*(N.x-N.z) + S.w*(S.x-S.z) + E.w*(E.x-E.z) + W.w*(W.x-W.z))/(N.w+S.w+E.w+W.w) - (heightmapValue.x-heightmapValue.z);

		float accel = sump * GRAVITY_CONSTANT;

		// Dynamics
		heightmapValue.y += accel;
		heightmapValue.x += heightmapValue.y * deltaTime;

		// Viscosity
		heightmapValue.x += sump * viscosityConstant;
		heightmapValue.x *= 0.999; // move towards 0

		heightmapValue.x *= heightmapValue.w;
		heightmapValue.y *= heightmapValue.w;

		// disturbances
		heightmapValue.z =
			+ 0.30118*sin(3.8006*time + -87.019*uv.x + -120.67*uv.y)
			+ 0.31303*sin(3.1302*time + -68.387*uv.x + 47.969*uv.y)
			+ 0.36896*sin(3.8314*time + 73.017*uv.x + -139.85*uv.y)
			+ 0.35293*sin(3.7046*time + 57.837*uv.x + -86.63*uv.y)
			+ 0.34859*sin(3.8219*time + -97.666*uv.x + 99.891*uv.y)
			+ 0.32156*sin(3.1244*time + 3.2101*uv.x + 18.612*uv.y)
			+ 0.34801*sin(3.5123*time + 4.7301*uv.x + -13.318*uv.y)
			+ 0.35282*sin(3.1819*time + 132.07*uv.x + -30.798*uv.y)
			+ 0.38279*sin(3.3018*time + -118.34*uv.x + 10.955*uv.y)
			+ 0.38524*sin(3.3936*time + -0.54873*uv.x + 7.6717*uv.y);
		heightmapValue.z*=0.2;

		for(int i=0; i<NDISTURBS; i++){
			heightmapValue.z -= disturbances[i].z*exp(-pow(distance(uv,disturbances[i].xy)*disturbances[i].w, 2.0));
		}

		gl_FragColor = heightmapValue;

	}`;


var waterFragmentShader = `

	uniform vec3 lightvec;
	varying vec3 vNormal;
	varying vec3 pCam;
	varying vec3 pSurf;
	varying vec4 hmap;
	uniform vec4 waterColor;

	void main()	{

		vec3 n = normalize(vNormal);
		vec3 light = normalize(lightvec); // direction TOWARDS light

		vec3 view = pSurf-pCam;
		vec3 reflectedView = normalize(view - 2.0*dot(view, n)*n);

		float wDiffuse = dot(n, light)*0.5+0.5;
		float wSpecular = dot(reflectedView, light);
		float wCoast = 1.0-hmap.w;
	
		float specStart = 0.96;
		float specFull = 0.98;
		if(wSpecular<specStart){wSpecular = 0.0;}
		else if(wSpecular>specFull){wSpecular = 1.0;}
		else{wSpecular = 0.5-0.5*cos((wSpecular-specStart)/(specFull-specStart)*3.1416);}

		vec4 cAmbient = vec4(0.0,0.0,0.0,waterColor.w);
		vec4 cDiffuse = waterColor;
		vec4 cSpecular = waterColor;
		cSpecular.x += 0.25;
		if(cSpecular.x > 1.0){cSpecular.x = 1.0;}
		cSpecular.y += 0.25;
		if(cSpecular.y > 1.0){cSpecular.y = 1.0;}
		cSpecular.z += 0.25;
		if(cSpecular.z > 1.0){cSpecular.z = 1.0;}
		vec4 cCoast = cDiffuse;

		gl_FragColor = wCoast*cCoast + (1.0-wCoast) * (wSpecular*cSpecular + (1.0-wSpecular) * (wDiffuse*cDiffuse + (1.0-wDiffuse)*cAmbient));
		
	}`;

var waterVertexShaderCA = `// read water level from cellular automata

	uniform sampler2D heightmap;
	uniform float time; // only needed in noCA version
	varying vec3 vNormal;
	varying vec3 pCam;
	varying vec3 pSurf;
	varying vec4 hmap;

	void main() {

		vec2 cellSize = vec2( 1.0 / WATER_CA_WIDTH, 1.0 / WATER_CA_WIDTH );

		// Compute normal from heightmap
		vNormal = normalize(vec3(
			( texture2D( heightmap, uv + vec2( - cellSize.x, 0 ) ).x - texture2D( heightmap, uv + vec2( cellSize.x, 0 ) ).x ) * WATER_CA_WIDTH / WATER_BOUNDS,
			( texture2D( heightmap, uv + vec2( 0, - cellSize.y ) ).x - texture2D( heightmap, uv + vec2( 0, cellSize.y ) ).x ) * WATER_CA_WIDTH / WATER_BOUNDS,
			1.0 ));
	
		hmap = texture2D( heightmap, uv );
		float heightValue = hmap.x - 5.0*hmap.w;
		vec3 transformed = vec3( position.x, position.y, (heightValue + 5.0)*0.03);
		//vec3 transformed = vec3( position.x, position.y, position.z );

		vNormal = (modelMatrix * vec4(vNormal,0.0)).xyz;
		pSurf = (modelMatrix * vec4(transformed,1.0)).xyz;

		pCam = cameraPosition;

		gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed,1.0);
	}`;

var waterVertexShaderNoCA = `// generate water level

	uniform sampler2D heightmap;
	uniform float time;
	varying vec3 vNormal;
	varying vec3 pCam;
	varying vec3 pSurf;
	varying vec4 hmap;

	float h(vec2 r_){
		vec2 r=r_;
		return
			( 0.30118*sin(3.8006*time + -87.019*r.x + -120.67*r.y)
			+ 0.31303*sin(3.1302*time + -68.387*r.x + 47.969*r.y)
			+ 0.36896*sin(3.8314*time + 73.017*r.x + -139.85*r.y)
			+ 0.35293*sin(3.7046*time + 57.837*r.x + -86.63*r.y)
			+ 0.34859*sin(3.8219*time + -97.666*r.x + 99.891*r.y)
			+ 0.32156*sin(3.1244*time + 3.2101*r.x + 18.612*r.y)
			+ 0.34801*sin(3.5123*time + 4.7301*r.x + -13.318*r.y)
			+ 0.35282*sin(3.1819*time + 132.07*r.x + -30.798*r.y)
			+ 0.38279*sin(3.3018*time + -118.34*r.x + 10.955*r.y)
			+ 0.38524*sin(3.3936*time + -0.54873*r.x + 7.6717*r.y)) *0.6;
	}

	void main() {

		vec2 cellSize = vec2( 1.0 / WATER_CA_WIDTH, 1.0 / WATER_CA_WIDTH );

		// Compute normal from heightmap
		vNormal = normalize(vec3(
			( h( uv + vec2( - cellSize.x, 0 ) ) - h( uv + vec2( cellSize.x, 0 ) ) ) * WATER_CA_WIDTH / WATER_BOUNDS,
			( h( uv + vec2( 0, - cellSize.y ) ) - h( uv + vec2( 0, cellSize.y ) ) ) * WATER_CA_WIDTH / WATER_BOUNDS,
			1.0 ));
	
		hmap = vec4(0.0,0.0,0.0,1.0); // indicates "no coast" for the fragment shader
		vec3 transformed = vec3( position.x, position.y, (h(uv) + 1.0)*0.03);
		//vec3 transformed = vec3( position.x, position.y, position.z );

		vNormal = (modelMatrix * vec4(vNormal,0.0)).xyz;
		pSurf = (modelMatrix * vec4(transformed,1.0)).xyz;

		pCam = cameraPosition;

		gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed,1.0);
	}`;

var WATER_MATERIAL = {};

// Texture width for simulation
var WATER_CA_WIDTH = 128;
var NUM_TEXELS = WATER_CA_WIDTH * WATER_CA_WIDTH;

// Water size in system units
var WATER_BOUNDS = 300; // optional TODO: this parameter is still somewhat arbitrary
var WATER_BOUNDS_HALF = WATER_BOUNDS * 0.5;

var WATER_CA_GPU;
var WATER_HM_VAR; // water heightmap variable
var WATER_UNIFORMS;

function initWater() {

	var geometry = new THREE.PlaneBufferGeometry( MAP_MAXDIM, MAP_MAXDIM, WATER_CA_WIDTH-1, WATER_CA_WIDTH-1 );

	var vertexShader = waterVertexShaderCA;
	if(!FANCY_WATER){vertexShader = waterVertexShaderNoCA;}

	// material: make a ShaderMaterial clone of MeshPhongMaterial, with customized vertex shader
	WATER_MATERIAL = new THREE.ShaderMaterial( {
		uniforms: {
			heightmap: { type: 't', value: null },
			time: { type: 'f', value: 0 },
			lightvec: { type: 'v3', value: LIGHT_VECTOR }, // direction TOWARDS light
			// optional TODO: the light looks corner-ish when it comes from (1,1,1) which makes no sense
			// that doesn't hurt now because it comes from (-1,1,1) but still!
			// update: could be the orientation of the triangle split of the water tiles but that does
			// not explain why there is zero corneriness in the WATERTEST4
			waterColor: { type: 'v4', value: new THREE.Vector4(WATER_COLOR.r, WATER_COLOR.g, WATER_COLOR.b, WATER_OPACITY)}
			// make sure water color is set by arena loader
		},
		vertexShader: vertexShader,
		fragmentShader: waterFragmentShader,
		transparent: true
	} );

	// Defines
	WATER_MATERIAL.defines.WATER_CA_WIDTH = WATER_CA_WIDTH.toFixed( 1 );
	WATER_MATERIAL.defines.WATER_BOUNDS = WATER_BOUNDS.toFixed( 1 );

	WATER_UNIFORMS = WATER_MATERIAL.uniforms;

	var waterMesh = new THREE.Mesh( geometry, WATER_MATERIAL );
	//waterMesh.rotation.x = - Math.PI / 2;
	waterMesh.matrixAutoUpdate = false;
	waterMesh.updateMatrix();

	GRAPHICS_SCENE.add( waterMesh );

	// Creates the gpu computation class and sets it up

	WATER_CA_GPU = new GPUComputationRenderer( WATER_CA_WIDTH, WATER_CA_WIDTH, RENDERER );
	var heightmap0 = WATER_CA_GPU.createTexture();
	fillWaterTexture( heightmap0 );

	if(FANCY_WATER){
		
		WATER_HM_VAR = WATER_CA_GPU.addVariable( "heightmap", heightmapFragmentShader, heightmap0 );

		WATER_CA_GPU.setVariableDependencies( WATER_HM_VAR, [ WATER_HM_VAR ] );

		var disturbs = [];
		for(var i=0; i<NUM_PLAYERS; i++){
			disturbs[i] = new THREE.Vector4( 1000, 1000, 3, 50 );
		}

		WATER_HM_VAR.material.uniforms.viscosityConstant = { type: "f", value: 0.03 };
		WATER_HM_VAR.material.uniforms.disturbances = { type: "v4v", value: disturbs};
		WATER_HM_VAR.material.uniforms.time = { type: "f", value: 0.0 };
		WATER_HM_VAR.material.defines.WATER_BOUNDS = WATER_BOUNDS.toFixed( 1 );
		WATER_HM_VAR.material.defines.NDISTURBS = NUM_PLAYERS;

		var error = WATER_CA_GPU.init();
		if ( error !== null ) {
			console.error( error );
		}
	}
	else{
		WATER_UNIFORMS.heightmap.value = heightmap0;
	}
	/* // just a boring plane
	var geometry = new THREE.PlaneGeometry( MAP_WIDTH, MAP_HEIGHT, 1, 1);
	var material = new THREE.MeshBasicMaterial({
		color:WATER_COLOR,
		opacity:WATER_OPACITY,
		transparent:true});
	var water = new THREE.Mesh(geometry, material );
	water.renderOrder = RENDER_ORDER.water;
	water.position.z = 0;
	GRAPHICS_SCENE.add(water);
	*/
}

function fillWaterTexture( texture ) {

	var waterMaxHeight = 10;

	var pixels = texture.image.data;

	var p = 0;
	for ( var j = 0; j < WATER_CA_WIDTH; j++ ) {
		for ( var i = 0; i < WATER_CA_WIDTH; i++ ) {

			var x = (i/WATER_CA_WIDTH-0.5) * MAP_MAXDIM;
			var y = (j/WATER_CA_WIDTH-0.5) * MAP_MAXDIM;

			var x2 = x*2.6-1.3;
			var y2 = y*2.6-1.3;

			var w = Math.pow(x2,4.0)+Math.pow(y2,4.0) + 0.5*Math.sin(19.0*x) + 0.5*Math.sin(17.0*y) - 0.9;
			w=-3*w;
			w = coastDistance(x,y)*5.0+3.0;

		    pixels[ p + 0 ] = 0;
			pixels[ p + 1 ] = 0;
			pixels[ p + 2 ] = 0;
			if(w<0.01){w = 0.01;}
			if(w>1){w = 1;}
			pixels[ p + 3 ] = w;

			p += 4;
		}
	}
}

function updateWater(){

	WATER_MATERIAL.uniforms.time.value += DT;


	if(FANCY_WATER){
		//WATER_HM_VAR.material.uniforms.disturbances.value[1].x -=0.01;
		WATER_HM_VAR.material.uniforms.time.value += DT;

		for(i=0; i<hovers.length; i++){
			WATER_HM_VAR.material.uniforms.disturbances.value[i].x = hovers[i].body.position[0]/MAP_MAXDIM+0.5;
			WATER_HM_VAR.material.uniforms.disturbances.value[i].y = hovers[i].body.position[1]/MAP_MAXDIM+0.5;
			if(!hovers[i].hidden){
				WATER_HM_VAR.material.uniforms.disturbances.value[i].z =
					Math.sqrt(Math.pow(hovers[i].body.velocity[0],2) + Math.pow(hovers[i].body.velocity[1],2))*0.1+0.5;
			}
			else{
				WATER_HM_VAR.material.uniforms.disturbances.value[i].z = 0;
			}
		}

		// Do the gpu computation
		WATER_CA_GPU.compute();

		// Get compute output in custom uniform
		WATER_UNIFORMS.heightmap.value = WATER_CA_GPU.getCurrentRenderTarget( WATER_HM_VAR ).texture;
	}
}
