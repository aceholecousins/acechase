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

		float cx=1.3;
		float ct=0.7;

		heightmapValue.z =
				0.65*(sin(time*3.0*ct + uv.x*50.0*cx + uv.y*13.0*cx)
				+ 0.3*sin(time*4.0*ct + uv.x*21.0*cx - uv.y*45.0*cx)
				+ 0.2*sin(time*5.0*ct - uv.x*25.0*cx - uv.y*40.0*cx));

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

		if(wSpecular<specStart){
			wSpecular = 0.0;
		}
		else if(wSpecular>specFull){
			wSpecular = 1.0;
		}
		else{
			wSpecular = 0.5-0.5*cos((wSpecular-specStart)/(specFull-specStart)*3.1416);
		}

		vec4 cAmbient = vec4(0.0,0.0,0.0,0.8);
		//vec4 cDiffuse = vec4(0.0,0.4,0.8,0.8); // WATER COLOR
		vec4 cDiffuse = vec4(0.0,0.25,0.5,0.8); // WATER COLOR
		//vec4 cDiffuse = vec4(1.0,0.0,0.0,0.8); // WATER COLOR		
		//vec4 cSpecular = vec4(1.0,1.0,1.0,1.0); // looks good but super confusing during gameplay
		vec4 cSpecular = vec4(0.4,0.5,0.6,0.9);
		vec4 cCoast = cDiffuse;

		gl_FragColor = wCoast*cCoast + (1.0-wCoast) * (wSpecular*cSpecular + (1.0-wSpecular) * (wDiffuse*cDiffuse + (1.0-wDiffuse)*cAmbient));

	}`;

var waterVertexShader = `

	uniform sampler2D heightmap;
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

	var geometry = new THREE.PlaneBufferGeometry( LEVEL_MAXDIM, LEVEL_MAXDIM, WATER_CA_WIDTH - 1, WATER_CA_WIDTH -1 );

	// material: make a ShaderMaterial clone of MeshPhongMaterial, with customized vertex shader
	var material = new THREE.ShaderMaterial( {
		uniforms: {
			heightmap: { type: 't', value: null },
			lightvec: { type: 'v3', value: new THREE.Vector3(-1,1,1) } // direction TOWARDS light
			// optional TODO: the light looks corner-ish when it comes from (1,1,1) which makes no sense
			// that doesn't hurt now because it comes from (-1,1,1) but still!
			// update: could be the orientation of the triangle split of the water tiles but that does
			// not explain why there is zero corneriness in the WATERTEST4
		},
		vertexShader: waterVertexShader,
		fragmentShader: waterFragmentShader,
		transparent: true
	} );

	// Defines
	material.defines.WATER_CA_WIDTH = WATER_CA_WIDTH.toFixed( 1 );
	material.defines.WATER_BOUNDS = WATER_BOUNDS.toFixed( 1 );

	WATER_UNIFORMS = material.uniforms;

	var waterMesh = new THREE.Mesh( geometry, material );
	//waterMesh.rotation.x = - Math.PI / 2;
	waterMesh.matrixAutoUpdate = false;
	waterMesh.updateMatrix();

	GRAPHICS_SCENE.add( waterMesh );

	// Creates the gpu computation class and sets it up

	WATER_CA_GPU = new GPUComputationRenderer( WATER_CA_WIDTH, WATER_CA_WIDTH, RENDERER );

	var heightmap0 = WATER_CA_GPU.createTexture();

	fillWaterTexture( heightmap0 );

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

function fillWaterTexture( texture ) {

	var waterMaxHeight = 10;

	var pixels = texture.image.data;

	var p = 0;
	for ( var j = 0; j < WATER_CA_WIDTH; j++ ) {
		for ( var i = 0; i < WATER_CA_WIDTH; i++ ) {

			var x = (i/WATER_CA_WIDTH-0.5) * LEVEL_MAXDIM;
			var y = (j/WATER_CA_WIDTH-0.5) * LEVEL_MAXDIM;

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

	//WATER_HM_VAR.material.uniforms.disturbances.value[1].x -=0.01;
	WATER_HM_VAR.material.uniforms.time.value += DT;

	for(i=0; i<hovers.length; i++){
		WATER_HM_VAR.material.uniforms.disturbances.value[i].x = hovers[i].body.position[0]/LEVEL_MAXDIM+0.5;
		WATER_HM_VAR.material.uniforms.disturbances.value[i].y = hovers[i].body.position[1]/LEVEL_MAXDIM+0.5;
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
