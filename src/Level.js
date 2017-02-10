
// depends on HBObject.js

var LEVEL_WIDTH;
var LEVEL_HEIGHT;
var LEVEL_MAXDIM;

// the distance map stores the distance to the coast for each pixel in it
// (positive in water and negative on land)
// used for collision detection with the coast and to see where objects
// can spawn randomly
var DISTANCE_MAP = {};
var FOG_COLOR = new THREE.Color(0x808080);

var terrainVertexShader = `

	varying vec3 nml;
	varying vec3 pos;
	varying vec3 cam;


	void main() {
		pos = position;
		nml = normal;
		cam = cameraPosition;

		gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
	}`;

var terrainFragmentShader = `

	uniform vec3 lightvec;
	uniform vec2 terraindims;
	varying vec3 nml;
	varying vec3 pos;
	varying vec3 cam;
	uniform sampler2D diftex;
	uniform sampler2D bumptex;
	uniform sampler2D spectex;
	uniform vec3 fogColor;

	void main()	{

		vec3 light = normalize(lightvec); // direction TOWARDS light
		vec3 n = normalize(nml);

		vec2 uv;
		uv.x = pos.x/terraindims.x+0.5;
		uv.y = pos.y/terraindims.y+0.5;

		// fog at level edge:
		float wFog = 0.0;
		if( uv.x > 0.8 ){ wFog = (uv.x-0.8)/0.2; }
		if( uv.x < 0.2 ){ wFog = 1.0-uv.x/0.2; }
		if( uv.y > 0.8 ){ wFog+= (uv.y-0.8)/0.2; }
		if( uv.y < 0.2 ){ wFog+= 1.0-uv.y/0.2; }
		if( wFog > 1.0 ){ wFog = 1.0; }
	
		// determine new normal from bump map:
		float bumpheight = 0.04;
		float delta = 1.0/2048.0;
		float dhdx = (texture2D( bumptex, vec2(uv.x+delta, uv.y) ).r - texture2D( diftex, vec2(uv.x-delta, uv.y) ).r)
				/2.0/delta/terraindims.x*bumpheight;
		float dhdy = (texture2D( bumptex, vec2(uv.x, uv.y+delta) ).r - texture2D( diftex, vec2(uv.x, uv.y-delta) ).r)
				/2.0/delta/terraindims.y*bumpheight;

		vec3 tangx = normalize(cross(vec3(0.0,1.0,0.0), n)); // tangent vectors along terrain surface (not orthogonal)
		vec3 tangy = normalize(cross(n, vec3(1.0,0.0,0.0)));
		
		vec3 finalnml = normalize(n -dhdx*tangx -dhdy*tangy);

		// determine specularity:
		vec3 view = pos-cam;
		vec3 reflectedView = normalize(view - 2.0*dot(view, finalnml)*finalnml);
		float wSpecular = dot(reflectedView, light);
		float specStart = 0.96;
		float specFull = 0.98;
		if(wSpecular<specStart){wSpecular = 0.0;}
		else if(wSpecular>specFull){wSpecular = 1.0;}
		else{wSpecular = 0.5-0.5*cos((wSpecular-specStart)/(specFull-specStart)*3.1416);}
		wSpecular *= texture2D( spectex, uv ).r;

		// mix colors:
		float wDif = dot(finalnml, light)*0.5+0.5;
		vec4 cDif = texture2D( diftex, uv );
		cDif.xyz *= wDif; // diffuse color
		
		vec4 cDifSpec = wSpecular*vec4(1.0,1.0,1.0,1.0) + (1.0-wSpecular)*cDif;

		vec4 cDifSpecFog = wFog*vec4(fogColor,1.0) + (1.0-wFog)*cDifSpec;

		gl_FragColor = cDifSpecFog;

	}`;



// returns the distance from the coast (bilinear interpolation on distance map)
function coastDistance(x,y){ // map center at (0,0)
	var xhr = DISTANCE_MAP.w/2 + x*DISTANCE_MAP.f -0.5; // high resolution
	var yhr = DISTANCE_MAP.h/2 - y*DISTANCE_MAP.f -0.5;

	if(xhr<0){xhr = 0;}
	if(xhr>DISTANCE_MAP.w-1.00001){xhr = DISTANCE_MAP.w-1.00001;}
	if(yhr<0){yhr = 0;}
	if(yhr>DISTANCE_MAP.h-1.00001){yhr = DISTANCE_MAP.h-1.00001;}

	var xint = Math.floor(xhr); // round part
	var yint = Math.floor(yhr);
	var xfrc = xhr - xint; // fraction
	var yfrc = yhr - yint;

	var d1 = DISTANCE_MAP.map[ yint   *DISTANCE_MAP.w+xint] * (1-xfrc) + DISTANCE_MAP.map[ yint   *DISTANCE_MAP.w+xint+1] * xfrc;
	var d2 = DISTANCE_MAP.map[(yint+1)*DISTANCE_MAP.w+xint] * (1-xfrc) + DISTANCE_MAP.map[(yint+1)*DISTANCE_MAP.w+xint+1] * xfrc;

	return ((1-yfrc)*d1 + yfrc*d2)/DISTANCE_MAP.f;
}

function findAccessiblePosition(minCoastDistance){

	var x=0;
	var y=0;
	var found = false;

	while(!found){ // could in a very unlikely scenario run forever...
		x = (Math.random()-0.5)*LEVEL_WIDTH;
		y = (Math.random()-0.5)*LEVEL_HEIGHT;
		if(coastDistance(x,y) >= minCoastDistance){
			found = true;
		}
	}

	return new THREE.Vector2(x,y);
}

function Level(filename){
	HBObject.call(this); // inheritance

	this.type = 'level';

	// load SVG for contour

	LOADING_LIST.addItem('level');
	var loader = new THREE.FileLoader();

	loader.load(filename, function(text){ // to be executed when the svg is loaded:

		var draw = SVG('leveldrawing');
		var store = draw.svg(text);

		var points = store.get('outline').node.points;
		var levelPolygons = new Array(1);
		levelPolygons[0] = new Array(points.length);

		LEVEL_WIDTH = store.get('hbmap').node.width.baseVal.value;
		LEVEL_HEIGHT = store.get('hbmap').node.height.baseVal.value;
		
		LEVEL_MAXDIM = LEVEL_WIDTH;
		if(LEVEL_HEIGHT>LEVEL_WIDTH){LEVEL_MAXDIM = LEVEL_HEIGHT;}

		BROADPHASE.xmin = -LEVEL_WIDTH/2;
		BROADPHASE.xmax = LEVEL_WIDTH/2;
		BROADPHASE.ymin = -LEVEL_HEIGHT/2;
		BROADPHASE.ymax = LEVEL_HEIGHT/2;
		BROADPHASE.nx = 20;
		BROADPHASE.ny = 20;
		BROADPHASE.binsizeX = LEVEL_WIDTH/20;
		BROADPHASE.binsizeY = LEVEL_HEIGHT/20;

		var smallestx = LEVEL_WIDTH;
		var ismallestx = -1;

		for(var ipt=0; ipt<points.length; ipt++){
			levelPolygons[0][ipt] = [points[ipt].x, points[ipt].y];
			if(points[ipt].x < smallestx){
				smallestx = points[ipt].x;
				ismallestx = ipt;
			}
		}

		var ybefore;
		var yafter;
		if(ismallestx == 0){
			ybefore = levelPolygons[0][levelPolygons[0].length-1][1];
			yafter  = levelPolygons[0][1][1];}
		else if(ismallestx == levelPolygons[0].length-1){
			ybefore = levelPolygons[0][ismallestx-1][1];
			yafter  = levelPolygons[0][0][1];}
		else{
			ybefore = levelPolygons[0][ismallestx-1][1];
			yafter  = levelPolygons[0][ismallestx+1][1];}

		var dir = Math.sign(yafter-ybefore)>0;

		levelPolygons[0].splice(ismallestx+1, 0,
			[0, points[ismallestx].y],
			[0, dir?0:LEVEL_HEIGHT],
			[LEVEL_WIDTH, dir?0:LEVEL_HEIGHT],
			[LEVEL_WIDTH, dir?LEVEL_HEIGHT:0],
			[0, dir?LEVEL_HEIGHT:0],
			[0, points[ismallestx].y+(dir?1:-1)*1e-10],
			[points[ismallestx].x, points[ismallestx].y+(dir?1:-1)*1e-10]);

		for(var i=0; i<levelPolygons[0].length; i++){
			levelPolygons[0][i][0] -= LEVEL_WIDTH/2;
			levelPolygons[0][i][1] = LEVEL_HEIGHT/2 - levelPolygons[0][i][1];
		}

		var iil = 1
		while(true){
			if(('island' + iil) in store._importStore){
				points = store.get('island' + iil).node.points;
				levelPolygons.push(new Array(points.length));
				for(var ipt=0; ipt<points.length; ipt++){
					levelPolygons[iil][ipt] = [points[ipt].x-LEVEL_WIDTH/2, LEVEL_HEIGHT/2-points[ipt].y];
				}
				iil++;
			}
			else{break;}
		}

		// draw level into canvas for distance transform

		// distance map exactly for the level:
		/*DISTANCE_MAP.f = 5; // resolution factor
		DISTANCE_MAP.w = LEVEL_WIDTH*DISTANCE_MAP.f;
		DISTANCE_MAP.h = LEVEL_HEIGHT*DISTANCE_MAP.f;

		CANVAS_BUFFER.width = DISTANCE_MAP.w;
		CANVAS_BUFFER.height = DISTANCE_MAP.h;

		BUFFER_CONTEXT.fillStyle="#ffffff";
		BUFFER_CONTEXT.rect(0,0,DISTANCE_MAP.w,DISTANCE_MAP.h);
		BUFFER_CONTEXT.fill();
		BUFFER_CONTEXT.fillStyle = '#000000';
		for(var iil=0; iil<levelPolygons.length; iil++){
			BUFFER_CONTEXT.beginPath();
			BUFFER_CONTEXT.moveTo(
					(LEVEL_WIDTH/2 +levelPolygons[iil][0][0])*DISTANCE_MAP.f,
					(LEVEL_HEIGHT/2-levelPolygons[iil][0][1])*DISTANCE_MAP.f);
			for(var ipt=1; ipt<levelPolygons[iil].length; ipt++){
				BUFFER_CONTEXT.lineTo(
						(LEVEL_WIDTH/2 +levelPolygons[iil][ipt][0])*DISTANCE_MAP.f,
						(LEVEL_HEIGHT/2-levelPolygons[iil][ipt][1])*DISTANCE_MAP.f);
			}
			BUFFER_CONTEXT.closePath();
			BUFFER_CONTEXT.fill();
		}
		var booleanImage = booleanImageFromCanvas(CANVAS_BUFFER, 128, false);
		var mapOutside = distanceFromBooleanImage(booleanImage, DISTANCE_MAP.w, DISTANCE_MAP.h, 'EDT');
		booleanImage = booleanImageFromCanvas(CANVAS_BUFFER, 128, true);
		var mapInside = distanceFromBooleanImage(booleanImage, DISTANCE_MAP.w, DISTANCE_MAP.h, 'EDT');
		DISTANCE_MAP.map = mapOutside;
		for(var ipx=0; ipx<DISTANCE_MAP.w*DISTANCE_MAP.h; ipx++){
			if(mapInside[ipx]>mapOutside[ipx]){
				DISTANCE_MAP.map[ipx] = -mapInside[ipx];
			}
		}*/

		// distance map much bigger so the level looks good when the cam zooms out:
		DISTANCE_MAP.f = 5; // resolution factor
		DISTANCE_MAP.w = LEVEL_MAXDIM*2*DISTANCE_MAP.f;
		DISTANCE_MAP.h = LEVEL_MAXDIM*2*DISTANCE_MAP.f;

		CANVAS_BUFFER.width = DISTANCE_MAP.w;
		CANVAS_BUFFER.height = DISTANCE_MAP.h;

		BUFFER_CONTEXT.fillStyle="#000000";
		BUFFER_CONTEXT.fillRect(0,0,DISTANCE_MAP.w,DISTANCE_MAP.h);
		BUFFER_CONTEXT.fillStyle="#ffffff";
		BUFFER_CONTEXT.fillRect(DISTANCE_MAP.w/2-LEVEL_WIDTH*DISTANCE_MAP.f/2,
				DISTANCE_MAP.h/2-LEVEL_HEIGHT*DISTANCE_MAP.f/2,
				LEVEL_WIDTH*DISTANCE_MAP.f,
				LEVEL_HEIGHT*DISTANCE_MAP.f);

		BUFFER_CONTEXT.fillStyle = '#000000';
		for(var iil=0; iil<levelPolygons.length; iil++){
			BUFFER_CONTEXT.beginPath();
			BUFFER_CONTEXT.moveTo(
					(LEVEL_MAXDIM +levelPolygons[iil][0][0])*DISTANCE_MAP.f,
					(LEVEL_MAXDIM -levelPolygons[iil][0][1])*DISTANCE_MAP.f);
			for(var ipt=1; ipt<levelPolygons[iil].length; ipt++){
				BUFFER_CONTEXT.lineTo(
						(LEVEL_MAXDIM +levelPolygons[iil][ipt][0])*DISTANCE_MAP.f,
						(LEVEL_MAXDIM -levelPolygons[iil][ipt][1])*DISTANCE_MAP.f);
			}
			BUFFER_CONTEXT.closePath();
			BUFFER_CONTEXT.fill();
		}
		var booleanImage = booleanImageFromCanvas(CANVAS_BUFFER, 128, false);
		var mapOutside = distanceFromBooleanImage(booleanImage, DISTANCE_MAP.w, DISTANCE_MAP.h, 'EDT');
		booleanImage = booleanImageFromCanvas(CANVAS_BUFFER, 128, true);
		var mapInside = distanceFromBooleanImage(booleanImage, DISTANCE_MAP.w, DISTANCE_MAP.h, 'EDT');
		DISTANCE_MAP.map = mapOutside;
		for(var ipx=0; ipx<DISTANCE_MAP.w*DISTANCE_MAP.h; ipx++){
			if(mapInside[ipx]>mapOutside[ipx]){
				DISTANCE_MAP.map[ipx] = -mapInside[ipx];
			}
		}

		// draw border lines

		if(DEBUG >= 2){
			for(var iil=0; iil<levelPolygons.length; iil++){
				var material = new THREE.LineBasicMaterial({color: 0x00ffff});
				var geometry = new THREE.Geometry();

				for(var ipt=0; ipt<levelPolygons[iil].length; ipt++){
					geometry.vertices.push(new THREE.Vector3(levelPolygons[iil][ipt][0], levelPolygons[iil][ipt][1], 0.01));
				}
				geometry.vertices.push(new THREE.Vector3(levelPolygons[iil][0][0], levelPolygons[iil][0][1], 0.01));

				var line = new THREE.Line(geometry, material);
				GRAPHICS_SCENE.add(line);
			}
		}

		// phyisics

		for(var iil=0; iil<levelPolygons.length; iil++){
			var body = new p2.Body({mass:0, position:[0,0]});
			body.fromPolygon(levelPolygons[iil]);
			for (var i=0; i<body.shapes.length; i++) {
				body.shapes[i].material = LEVEL_MATERIAL;

				if(DEBUG >= 3){ // draw convex shape decomposition
					var material = new THREE.LineBasicMaterial({color: 0xff8000});
					var geometry = new THREE.Geometry();

					for(var ipt=0; ipt<body.shapes[i].vertices.length; ipt++){
						geometry.vertices.push(new THREE.Vector3(
							body.shapes[i].vertices[ipt][0]+body.shapeOffsets[i][0]+body.position[0],
							body.shapes[i].vertices[ipt][1]+body.shapeOffsets[i][1]+body.position[1],
							0.01));
					}
					geometry.vertices.push(new THREE.Vector3(
						body.shapes[i].vertices[0][0]+body.shapeOffsets[i][0]+body.position[0],
						body.shapes[i].vertices[0][1]+body.shapeOffsets[i][1]+body.position[1],
						0.01));

					var line = new THREE.Line(geometry, material);
					GRAPHICS_SCENE.add(line);
				}
			}
			body.inDistanceMap = true;
			body.HBO = this;
			PHYSICS_WORLD.addBody(body);
		}


		// graphics

		var w = 256;
		var h = 256;
		var geometry = new THREE.PlaneGeometry( LEVEL_MAXDIM*2, LEVEL_MAXDIM*2, w, h);

		for(var iv=0; iv<geometry.vertices.length; iv++){
			geometry.vertices[iv].x += (Math.random()-0.5)*LEVEL_MAXDIM/w*2;
			geometry.vertices[iv].y += (Math.random()-0.5)*LEVEL_MAXDIM/h*2;
			geometry.vertices[iv].z = -3.0*Math.atan(0.5*coastDistance(geometry.vertices[iv].x, geometry.vertices[iv].y));
		}
		geometry.computeFaceNormals();
		geometry.computeVertexNormals();

		var difblob = store.get('pigmentmap');
		var diftex;
		if(typeof(difblob) == "undefined"){
			diftex = loadTexture('media/textures/rocktex.jpg'); // source: https://jwhigham.files.wordpress.com/2010/05/synthtilingsynthesised.jpg
		}
		else{
			var difimg = new Image();
			difimg.src = difblob.src;
			diftex = new THREE.Texture(difimg);
			diftex.needsUpdate = true;
		}

		var bumpblob = store.get('bumpmap');
		var bumptex;
		if(typeof(bumpblob) == "undefined"){
			bumptex = loadTexture('media/textures/rocktex.jpg');
		}
		else{
			var bumpimg = new Image();
			bumpimg.src = bumpblob.src;
			bumptex = new THREE.Texture(bumpimg);
			bumptex.needsUpdate = true;
		}

		var specblob = store.get('specularmap');
		var spectex;
		if(typeof(specblob) == "undefined"){
			spectex = loadTexture('media/textures/rocktex.jpg');
		}
		else{
			var specimg = new Image();
			specimg.src = specblob.src;
			spectex = new THREE.Texture(specimg);
			spectex.needsUpdate = true;
		}

		if(typeof(store.get('fog')) != "undefined"){
			FOG_COLOR = new THREE.Color(store.get('fog').node.style.fill);
		}
		WATER_COLOR = new THREE.Color(store.get('outline').node.style.fill);
		WATER_OPACITY = store.get('outline').node.style.fillOpacity;

		/*var material = new THREE.MeshLambertMaterial({
			map:diftex,
			wireframe:false
		});*/

		var material = new THREE.ShaderMaterial( {
			uniforms: {
				diftex: { type: 't', value: diftex },
				bumptex: { type: 't', value: bumptex },
				spectex: { type: 't', value: spectex },
				terraindims: { type: 'v2', value: new THREE.Vector2(2*LEVEL_MAXDIM, 2*LEVEL_MAXDIM) },
				lightvec: { type: 'v3', value: new THREE.Vector3(-1,1,1) }, // direction TOWARDS light
				fogColor: { type: 'c', value: FOG_COLOR}
			},
			vertexShader: terrainVertexShader,
			fragmentShader: terrainFragmentShader
		} );

		this.mesh = new THREE.Mesh(geometry, material );
		GRAPHICS_SCENE.add( this.mesh );

		/*var geometry = new THREE.PlaneGeometry( LEVEL_WIDTH, LEVEL_HEIGHT, 1, 1);
		var material = new THREE.MeshBasicMaterial({
			color:0x0080ff,
			opacity:0.5,
			transparent:true});
		var water = new THREE.Mesh(geometry, material );
		water.renderOrder = RENDER_ORDER.water;
		water.position.z = 0;
		GRAPHICS_SCENE.add(water);*/
		initWater();

		LOADING_LIST.checkItem('level');
	});

}

Level.prototype = Object.create(HBObject.prototype);
Level.prototype.constructor = Level;

