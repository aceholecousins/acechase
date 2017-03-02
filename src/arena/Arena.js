
// depends on HBObject.js

var MAP_WIDTH;
var MAP_HEIGHT;
var MAP_MAXDIM;
var MAP_RES = 1024;

// the distance map stores the distance to the coast for each pixel in it
// (positive in water and negative on land)
// used for collision detection with the coast and to see where objects
// can spawn randomly
var DISTANCE_MAP = {};
var DISTANCE_TEX = {};
var FOG_COLOR = new THREE.Color(0x808080);

var STD_TEX;
var WHITE_TEX;
var whiteArray = new Uint8ClampedArray(16*16*4);
for(var i=0; i<whiteArray.length; i++){whiteArray[i] = 255;}
WHITE_TEX = new THREE.Texture(array2canvas(whiteArray, 16, 16));

var ASL; // arena svg loader

// convert coast distance to terrain height
function d2h(d){return 3.0*Math.atan(0.5*d);}

// returns the distance from the coast (bilinear interpolation on distance map)
function coastDistance(x,y){ // map center at (0,0), negative distance is in water, positive on land

	// the -0.5 was found experimentally but it probably makes sense due to pixel centering and rounding and stuff :P
	var xhr = DISTANCE_MAP.w/2 + x*DISTANCE_MAP.f -0.5;
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

	return (1-yfrc)*d1 + yfrc*d2;
}

function findAccessiblePosition(minCoastDistance){ // minCoastDistance must be negative for water

	var x=0;
	var y=0;
	var c=0;	
	var found = false;

	var trials = 1;
	while(!found && trials < 1000){
		x = (Math.random()-0.5)*MAP_WIDTH;
		y = (Math.random()-0.5)*MAP_HEIGHT;
		c = coastDistance(x,y);
		if(c <= minCoastDistance){
			found = true;
		}
		trials++;
	}
	if(trials == 1000){console.error("no point with desired coast distance found");}
	
	return new THREE.Vector2(x,y);
}

function Arena(filename){
	HBObject.call(this); // inheritance

	this.type = 'arena';

	// load SVG for contour

	LOADING_LIST.addItem('arena');

	ASL = new ArenaSvgLoader(MAP, MAP_RES, 6, function(){ // to be executed when the svg is loaded:
		TEXTURE_LOADER.load('media/textures/stdtex.png', function(tex){ // to be executed when standard texture is loaded:
			STD_TEX = tex;
			STD_TEX.wrapS = THREE.RepeatWrapping;
			STD_TEX.wrapT = THREE.RepeatWrapping;
			STD_TEX.repeat.set(50,40);

			MAP_WIDTH = ASL.svgw;
			MAP_HEIGHT = ASL.svgh;
		
			MAP_MAXDIM = Math.max(MAP_WIDTH, MAP_HEIGHT);

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
			var smallestx = MAP_WIDTH;
			var ismallestx = -1;

			var poly = ASL.polygons;

			for(var ipt=0; ipt<poly[0].length; ipt++){
				if(poly[0][ipt][0] < smallestx){
					smallestx = poly[0][ipt][0];
					ismallestx = ipt;
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
			var dir = Math.sign(yafter-ybefore)>0;

			// insert incision and outer rectangle into the polygon:
			poly[0].splice(ismallestx+1, 0,
				[0, poly[0][ismallestx][1]],
				[0, dir?0:MAP_HEIGHT],
				[MAP_WIDTH, dir?0:MAP_HEIGHT],
				[MAP_WIDTH, dir?MAP_HEIGHT:0],
				[0, dir?MAP_HEIGHT:0],
				[0, poly[0][ismallestx][1]+(dir?1:-1)*0.01],
				[poly[0][ismallestx][0], poly[0][ismallestx][1]+(dir?1:-1)*0.01]);

			// make 0,0 the map center and invert y (svg coordinates start top left (eww)):
			for(var j=0; j<poly.length; j++){
				for(var i=0; i<poly[j].length; i++){
					poly[j][i][0] -= MAP_WIDTH/2;
					poly[j][i][1] = MAP_HEIGHT/2 - poly[j][i][1];
				}
			}

			// cornery distance map for physics and game engine:
			DISTANCE_MAP.f = ASL.phxdpu; // resolution factor
			DISTANCE_MAP.w = ASL.phxw;
			DISTANCE_MAP.h = ASL.phxh;
			DISTANCE_MAP.map = ASL.phxdistancemap;

			// draw border lines
			if(DEBUG >= 2){
				for(var iil=0; iil<poly.length; iil++){
					var material = new THREE.LineBasicMaterial({color: 0x00ffff});
					var geometry = new THREE.Geometry();

					for(var ipt=0; ipt<poly[iil].length; ipt++){
						geometry.vertices.push(new THREE.Vector3(poly[iil][ipt][0], poly[iil][ipt][1], 0.01));
					}
					geometry.vertices.push(new THREE.Vector3(poly[iil][0][0], poly[iil][0][1], 0.01));

					var line = new THREE.Line(geometry, material);
					GRAPHICS_SCENE.add(line);
				}
			}

			// generate phyisics engine polygons
			for(var iil=0; iil<poly.length; iil++){
				var body = new p2.Body({mass:0, position:[0,0]});
				body.fromPolygon(poly[iil]);
				
				for (var i=0; i<body.shapes.length; i++) {
					body.shapes[i].material = MAP_MATERIAL;

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

			// create terrain mesh
			var geometry = new THREE.PlaneGeometry( MAP_WIDTH, MAP_HEIGHT, MAP_WIDTH*2, MAP_HEIGHT*2);

			for(var iv=0; iv<geometry.vertices.length; iv++){
				geometry.vertices[iv].z = d2h( coastDistance(geometry.vertices[iv].x, geometry.vertices[iv].y) );
			}
			geometry.computeFaceNormals();
			geometry.computeVertexNormals();

			var difblob = ASL.gettex('pigmentmap');
			var diftex;
			if(typeof(difblob) == "undefined"){
				diftex = STD_TEX;
			}
			else{
				var difimg = new Image();
				difimg.src = difblob.mapurl;
				diftex = new THREE.Texture(difimg);
				diftex.needsUpdate = true;
			}

			var bumpblob = ASL.gettex('bumpmap');
			var bumptex;
			if(typeof(bumpblob) == "undefined"){
				bumptex = STD_TEX;
			}
			else{
				var bumpimg = new Image();
				bumpimg.src = bumpblob.mapurl;
				bumptex = new THREE.Texture(bumpimg);
				bumptex.needsUpdate = true;
			}

			var specblob = ASL.gettex('specularmap');
			var spectex;
			if(typeof(specblob) == "undefined"){
				spectex = STD_TEX;
			}
			else{
				var specimg = new Image();
				specimg.src = specblob.mapurl;
				spectex = new THREE.Texture(specimg);
				spectex.needsUpdate = true;
			}

			if(typeof(ASL.getstyle("fog", "fill")) != undefined){
				FOG_COLOR = new THREE.Color(ASL.getstyle("fog", "fill"));
			}
			WATER_COLOR = new THREE.Color(ASL.getstyle("outline", "fill"));
			WATER_OPACITY = ASL.getstyle("outline", "fillOpacity");

			var material;
			DISTANCE_TEX = new THREE.Texture(ASL.gfxdistancemap);
			DISTANCE_TEX.needsUpdate = true;
			DISTANCE_TEX.magFilter = THREE.NearestFilter; // TODO: use kind of gray code so we can interpolate this
			DISTANCE_TEX.minFilter = THREE.NearestFilter;

			//document.body.appendChild(ASL.gfxdistancemap);

			var heightMapDim = DISTANCE_TEX.image.width;

			// convert bumpmap and terrain height map into normal map
			var terrainGPU = new GPUComputationRenderer( 2048, 2048, RENDERER );
			var terrainGPUmat = terrainGPU.createShaderMaterial( terrainNormalComputationShader,{
				distancetex: {type:'t', value: DISTANCE_TEX},
				distancetexdim: {type:'f', value: heightMapDim},
				bumptex: {type:'t', value: bumptex},
				bumptexdim: {type:'f', value: bumptex.image.width},
				bumptexrepeat: {type: 'v2', value: bumptex.repeat},
				spectex: {type:'t', value: spectex},
				spectexrepeat: {type: 'v2', value: spectex.repeat},
				terraindim: {type: 'f', value: 2*MAP_MAXDIM}
				 } );
		
			//( sizeXTexture, sizeYTexture, wrapS, wrapT, minFilter, magFilter, textureType )
			var outputRenderTarget = terrainGPU.createRenderTarget(
				undefined, undefined, undefined, undefined, THREE.LinearMipMapLinearFilter, THREE.LinearFilter, THREE.UnsignedByteType);
			var nmlspectex = outputRenderTarget.texture;

			STD_TEX.minFilter = THREE.NearestFilter;
 			terrainGPU.doRenderTarget( terrainGPUmat, outputRenderTarget );
			STD_TEX.minFilter = THREE.LinearMipMapLinearFilter;

			//use the new texture
			material = new THREE.ShaderMaterial( {
				uniforms: {
					diftex: { type: 't', value: diftex },
					diftexrepeat: { type: 'v2', value: diftex.repeat },
					nmlspectex: { type: 't', value: nmlspectex },
					terraindims: { type: 'v2', value: new THREE.Vector2(MAP_WIDTH, MAP_HEIGHT) },
					lightvec: { type: 'v3', value: LIGHT_VECTOR }, // direction TOWARDS light
					fogColor: { type: 'c', value: FOG_COLOR},
					distancetex: {type:'t', value: DISTANCE_TEX},
					waterColor: {type: 'c', value: WATER_COLOR}
				},
				vertexShader: terrainVertexShader,
				fragmentShader: terrainFragmentShader
			} );

			if(!TERRAIN_BUMP_MAPPING){ // prerender terrain and use that (light static)
				
				var tg = new TextureGenerator(2048, 2048, RENDERER, '', '');
				tg.mesh.material = material;
				material.uniforms.terraindims.value = new THREE.Vector2(2, 2);

				var statictex = tg.render();

				material = new THREE.MeshBasicMaterial({map:statictex});

			}

			// always in background
			material.depthWrite = false;
			this.mesh = new THREE.Mesh(geometry, material );
			GRAPHICS_SCENE.add( this.mesh );

			initWater();

			LOADING_LIST.checkItem('arena');
		});
	});

}

Arena.prototype = Object.create(HBObject.prototype);
Arena.prototype.constructor = Arena;

