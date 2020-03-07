
// depends on HBObject.js

var MAP_WIDTH;
var MAP_HEIGHT;
var MAP_MAXDIM;

// the distance map stores the distance to the coast for each pixel in it
// (positive in water and negative on land)
// used for collision detection with the coast and to see where objects
// can spawn randomly
var DISTANCE_MAP = {};

var OUTLINE_BOUNDS; // xmin, xmax, ymin, ymax

// returns the distance from the coast (bilinear interpolation on distance map)
function coastDistance(x, y){ // map center at (0,0), negative distance is in water, positive on land

	// -0.5 because of pixel centering
	var xhr = DISTANCE_MAP.w/2 + x/MAP_SCALING*DISTANCE_MAP.f -0.5;
	var yhr = DISTANCE_MAP.h/2 - y/MAP_SCALING*DISTANCE_MAP.f -0.5;

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

	return ((1-yfrc)*d1 + yfrc*d2)*MAP_SCALING;
}

function findAccessiblePosition(minCoastDistance){ // minCoastDistance must be negative for water

	var x=0;
	var y=0;
	var c=0;
	var found = false;

	var trials = 1;
	while(!found && trials < 10000){
		x = (Math.random()-0.5)*MAP_WIDTH;
		y = (Math.random()-0.5)*MAP_HEIGHT;
		c = coastDistance(x, y);
		if(c <= minCoastDistance){
			found = true;
		}
		trials++;
	}
	if(trials == 10000){console.error("no point with desired coast distance found");}

	return new THREE.Vector2(x,y);
}

// recoursively apply THREE.ObjectSpaceNormalMap to normalMapType
function fixNormalsRec(group){
	if(group.type == "Mesh"){
		group.material.normalMapType = THREE.ObjectSpaceNormalMap
	}
	for(var i=0; i<group.children.length; i++){
		fixNormalsRec(group.children[i])
	}
}

function loadMapConfig(configFile, ondone){
	LOADING_LIST.addItem('mapconfig');

	var loader = new THREE.FileLoader();
	loader.load(configFile,
		function (data) {
			mapconfig = JSON.parse(data)
			for (var prop in mapconfig) {
				if (Object.prototype.hasOwnProperty.call(mapconfig, prop)) {
					window[prop] = mapconfig[prop]
				}
			}
			LOADING_LIST.checkItem('mapconfig');
			ondone()
		}
	)
}

function loadCollada(arena, filename){
	LOADING_LIST.addItem('mapscene');

	var loader = new THREE.ColladaLoader()
	loader.load( filename, function(collada) {
		fixNormalsRec(collada.scene)
		arena.mesh = collada.scene
		arena.mesh.scale.set(MAP_SCALING, MAP_SCALING, MAP_SCALING);
		Scene.graphicsScene.add( arena.mesh );
		LOADING_LIST.checkItem('mapscene');
	})
}

function loadBounds(arena, boundarySvgFile, ondone){
	// load SVG for boundary

	LOADING_LIST.addItem('mapbounds');

	//ArenaSvgLoader(filename, curvdpu, curvos, polydpu, polyos, callback){
	BOUNDARY_LOADER = new BoundaryLoader(boundarySvgFile, 4, 4, 4, 4, function(){ // to be executed when the svg is loaded:

		wSvg = BOUNDARY_LOADER.wSvg
		hSvg = BOUNDARY_LOADER.hSvg

		MAP_WIDTH = wSvg * MAP_SCALING
		MAP_HEIGHT = hSvg * MAP_SCALING

		MAP_MAXDIM = Math.max(MAP_WIDTH, MAP_HEIGHT);

		WATER_COLOR = new THREE.Color(BOUNDARY_LOADER.getstyle("outline", "fill"));
		WATER_OPACITY = BOUNDARY_LOADER.getstyle("outline", "fillOpacity");

		// tile dimensions for collision detection broadphase:
		BROADPHASE.xmin = -MAP_WIDTH/2;
		BROADPHASE.xmax = MAP_WIDTH/2;
		BROADPHASE.ymin = -MAP_HEIGHT/2;
		BROADPHASE.ymax = MAP_HEIGHT/2;
		BROADPHASE.nx = 20;
		BROADPHASE.ny = 20;
		BROADPHASE.binsizeX = MAP_WIDTH/20;
		BROADPHASE.binsizeY = MAP_HEIGHT/20;

		// cut open the outline at the leftest point (smallestx)
		// the physics library can't deal with a shape that has a hole
		// so we turn it into one concave shape by turning an O into a C with a very tiny gap
		var ismallestx = -1;

		var polysrc = BOUNDARY_LOADER.polygons;
		var poly = []

		// make 0,0 the map center, scale map, invert y (svg coordinates start top left (eww)):
		for(var j=0; j<polysrc.length; j++){
			poly[j] = []
			for(var i=0; i<polysrc[j].length; i++){
				poly[j][i] = [
					polysrc[j][i][0]*MAP_SCALING - MAP_WIDTH/2,
					MAP_HEIGHT/2 - polysrc[j][i][1]*MAP_SCALING
				]
			}
		}

		OUTLINE_BOUNDS = new THREE.Vector4(0,0,0,0);
		for(var ipt=0; ipt<poly[0].length; ipt++){
			if(poly[0][ipt][0] < OUTLINE_BOUNDS.x){ // .x = xmin
				OUTLINE_BOUNDS.x = poly[0][ipt][0];
				ismallestx = ipt;
			}
			if(poly[0][ipt][0] > OUTLINE_BOUNDS.y){ // .y = xmax
				OUTLINE_BOUNDS.y = poly[0][ipt][0];
			}
			if(poly[0][ipt][1] < OUTLINE_BOUNDS.z){ // .z = ymin
				OUTLINE_BOUNDS.z = poly[0][ipt][1];
			}
			if(poly[0][ipt][1] > OUTLINE_BOUNDS.w){ // .w = ymax
				OUTLINE_BOUNDS.w = poly[0][ipt][1];
			}
		}

		// find y values of the points before and after the incision
		var ybefore;
		var yafter;
		if(ismallestx == 0){
			ybefore = poly[0][poly[0].length-1][1];
			yafter  = poly[0][1][1];}
		else if(ismallestx == poly[0].length-1){
			ybefore = poly[0][ismallestx-1][1];
			yafter  = poly[0][0][1];}
		else{
			ybefore = poly[0][ismallestx-1][1];
			yafter  = poly[0][ismallestx+1][1];}

		// we have to draw the outer rim of the C (which will be a rectangle) in the
		// right direction or otherwise the incision lines will cross and the whole
		// thing will be a mess
		var dir = Math.sign(yafter-ybefore);

		// insert incision and outer rectangle into the polygon:
		poly[0].splice(ismallestx+1, 0,
			[          -MAP_WIDTH/2, poly[0][ismallestx][1]],
			[          -MAP_WIDTH/2, -dir * MAP_HEIGHT/2],
			[           MAP_WIDTH/2, -dir * MAP_HEIGHT/2],
			[           MAP_WIDTH/2, dir * MAP_HEIGHT/2],
			[          -MAP_WIDTH/2, dir * MAP_HEIGHT/2],
			[          -MAP_WIDTH/2, poly[0][ismallestx][1]+dir*0.01],
			[poly[0][ismallestx][0], poly[0][ismallestx][1]+dir*0.01]
		);

		// cornery distance map for physics and game engine:
		DISTANCE_MAP.f = BOUNDARY_LOADER.collisionBoundsDpu; // resolution factor
		DISTANCE_MAP.w = wSvg * BOUNDARY_LOADER.collisionBoundsDpu;
		DISTANCE_MAP.h = hSvg * BOUNDARY_LOADER.collisionBoundsDpu;
		DISTANCE_MAP.map = BOUNDARY_LOADER.physicsDistanceMap;

		// draw border lines
		if(DEBUG >= 3){
			for(var iil=0; iil<poly.length; iil++){
				var mat = new THREE.LineBasicMaterial({color: 0x00ffff});
				var geom = new THREE.Geometry();

				for(var ipt=0; ipt<poly[iil].length; ipt++){
					geom.vertices.push(new THREE.Vector3(poly[iil][ipt][0], poly[iil][ipt][1], 0.01));
				}
				geom.vertices.push(new THREE.Vector3(poly[iil][0][0], poly[iil][0][1], 0.01));

				var line = new THREE.Line(geom, mat);
				Scene.graphicsScene.add(line);
			}
		}

		// generate phyisics engine polygons
		for(var iil=0; iil<poly.length; iil++){
			var body = new p2.Body({mass:0, position:[0,0]});
			body.fromPolygon(poly[iil]);

			for (var i=0; i<body.shapes.length; i++) {
				body.shapes[i].material = ARENA_MATERIAL;
				body.shapes[i].collisionGroup = CG_ARENA;
				body.shapes[i].collisionMask  = CM_ARENA;

				if(DEBUG >= 4){ // draw convex shape decomposition
					var mat = new THREE.LineBasicMaterial({color: 0xff8000});
					var geom = new THREE.Geometry();

					for(var ipt=0; ipt<body.shapes[i].vertices.length; ipt++){
						geom.vertices.push(new THREE.Vector3(
							body.shapes[i].vertices[ipt][0]+body.shapeOffsets[i][0]+body.position[0],
							body.shapes[i].vertices[ipt][1]+body.shapeOffsets[i][1]+body.position[1],
							0.01));
					}
					geom.vertices.push(new THREE.Vector3(
						body.shapes[i].vertices[0][0]+body.shapeOffsets[i][0]+body.position[0],
						body.shapes[i].vertices[0][1]+body.shapeOffsets[i][1]+body.position[1],
						0.01));

					var line = new THREE.Line(geom, mat);
					Scene.graphicsScene.add(line);
				}
			}
			body.inDistanceMap = true;
			body.HBO = arena;
			PHYSICS_WORLD.addBody(body);
		}

		/* Debug distance map
		for(x=-50; x<50; x+=1){
			for(y=-50; y<50; y+=1){
				if (coastDistance(x, y) < 0){
					var geometry = new THREE.CubeGeometry();
					var material = new THREE.MeshBasicMaterial( {color: 0xffff00} );
					var sphere = new THREE.Mesh( geometry, material );
					sphere.position.set(x, y, coastDistance(x, y))
					sphere.scale.set(0.5,0.5,0.5);
					Scene.graphicsScene.add( sphere );
				}
			}
		}
		*/

		LOADING_LIST.checkItem('mapbounds');
		ondone()
	})
}

function Arena(modelDaeFile, boundarySvgFile, configFile){
	HBObject.call(this); // inheritance

	this.type = 'arena';

	loadMapConfig(configFile, function(){
		loadCollada(this, modelDaeFile)
		loadBounds(this, boundarySvgFile, function(){
			initWater()
		})
	})
}


Arena.prototype = Object.create(HBObject.prototype);
Arena.prototype.constructor = Arena;
