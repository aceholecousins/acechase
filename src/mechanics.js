
// GENERAL

var LOADING_LIST = new Checklist(); // contains elements for things that have to be loaded from external files

function xinspect(o,i){ // function for displaying objects on the console
	if(DEBUG>=1){
		if(typeof i=='undefined')i='';
		if(i.length>0)return '[MAX ITERATIONS]';
		var r=[];
		for(var p in o){
		    var t=typeof o[p];
			  if(t=='object'){
			   console.log(i+'"'+p+'"('+t+') => object:');
			   xinspect(o[p],i+'>');
			  }
			  else{if(t=='function'){
			   console.log(i+'"'+p+'"('+t+')');
			  }
			  else{
			   console.log(i+'"'+p+'"('+t+') => ' + o[p]);
			  }}
		}
	}
}

// STATS

var STATS; // display framerate
if(DEBUG>=1){
	STATS = new Stats();
	STATS.domElement.style.position = 'absolute';
	STATS.domElement.style.top = '0px';
	STATS.domElement.style.zIndex = 100;
	document.body.appendChild( STATS.domElement );
}

// LOGIC

var FRAME_COUNTER = 0; // increased by 1 in every game step
var DT = 1.0/60.0; // time between two frames // TODO: should adjust to screen framerate
var INGAME_TIME = 0; // seconds since start of the current game

// PHYSICS

// broadphase is a pre collision check done by the physics engine to find potential collisions
var BROADPHASE = new p2.GridBroadphase(); // filled in when arena is loaded

// the distance map is created when the arena is loaded and stores the distance
// to the coast for each pixel in it (positive in water and negative on land)
// it is used here to pre-check collisions between objects and the coast much
// faster and much more accurate than the standard broadphase does
BROADPHASE.boundingVolumeCheck = function(bodyA, bodyB){

	var result;

	if (!bodyA.inDistanceMap && !bodyB.inDistanceMap) {
		result = p2.Broadphase.boundingRadiusCheck(bodyA,bodyB);
	}
	else{
		var movingBody;
		if(bodyA.inDistanceMap){
			movingBody = bodyB;
		}
		else{
			movingBody = bodyA;
		}
		if( coastDistance(movingBody.position[0], movingBody.position[1]) > movingBody.boundingRadius+0.2 ){
			result = false;
		}
		else{
			// result = p2.Broadphase.aabbCheck(bodyA, bodyB); // THIS DOESNT WORK AND I DONT KNOW WHY. IT MAKES THINGS STOP COLLIDING
			result = p2.Broadphase.boundingRadiusCheck(bodyA,bodyB);
		}
	}
    return result;
};

var PHYSICS_WORLD = new p2.World({
	gravity : [0,0],
	broadphase : BROADPHASE
});

PHYSICS_WORLD.setGlobalStiffness(1e5);
PHYSICS_WORLD.solver.iterations = 5;
PHYSICS_WORLD.solver.tolerance = 0.001;
PHYSICS_WORLD.islandSplit = true;
PHYSICS_WORLD.solver.frictionIterations = 1;

// definition of the collision behavior between different object classes
var HOVER_MATERIAL = new p2.Material();
var MAP_MATERIAL = new p2.Material();
var PHASER_MATERIAL = new p2.Material();

PHYSICS_WORLD.addContactMaterial(new p2.ContactMaterial(HOVER_MATERIAL, MAP_MATERIAL, {
		restitution : 0.5, stiffness : 1e5, friction : 0.1}));
PHYSICS_WORLD.addContactMaterial(new p2.ContactMaterial(HOVER_MATERIAL, HOVER_MATERIAL, {
		restitution : 0.8, stiffness : 1e5, friction : 0.1}));
PHYSICS_WORLD.addContactMaterial(new p2.ContactMaterial(PHASER_MATERIAL, MAP_MATERIAL, {
		restitution : 0.7, stiffness : 1e5, friction : 0.1}));

// collisions (including phaser hits)

PHYSICS_WORLD.on('impact', function(event){
	var firstBody; // sort by type to simplify checks
	var secondBody;
	if(event.bodyA.HBO.type <= event.bodyB.HBO.type){
		firstBody = event.bodyA;
		secondBody = event.bodyB;
	}else{
		firstBody = event.bodyB;
		secondBody = event.bodyA;
	}

	if(firstBody.HBO.type == "phaser"){
		firstBody.HBO.impact();
	}
	if(secondBody.HBO.type == "phaser"){
		secondBody.HBO.impact();
	}
	if(firstBody.HBO.type == "hover" && secondBody.HBO.type == 'phaser'){
		firstBody.HBO.hitBy(secondBody.HBO);
	}
});

// GRAPHICS

var OBJ_LOADER = new THREE.OBJLoader();
var MTL_LOADER = new THREE.MTLLoader();
function loadObjMtl( url, mtlurl, onLoad){
	MTL_LOADER.load( mtlurl, function( materials ) {
		materials.preload();
		var objLoader = new THREE.OBJLoader();
		objLoader.setMaterials( materials );
		objLoader.load( url, onLoad );
	});
};
var TEXTURE_LOADER = new THREE.TextureLoader();
function loadTexture(filename){ // will automatically do CHECKLIST stuff
	LOADING_LIST.addItem(filename);
	return TEXTURE_LOADER.load(filename,
		function(){
			LOADING_LIST.checkItem(filename);
} );
}
var CANVAS_BUFFER = document.getElementById('canvasbuffer');
var BUFFER_CONTEXT = CANVAS_BUFFER.getContext('2d');

// renderorder for transparent objects, they are otherwise sorted by z position
// which can lead to ugly artefacts

var ro = 0;
var RENDER_ORDER = {};
RENDER_ORDER.terrain = ro++;
RENDER_ORDER.water = ro++;
RENDER_ORDER.phaser = RENDER_ORDER.phaserimpact = ro++;
RENDER_ORDER.shield = ro++;
RENDER_ORDER.smoke = ro++;
RENDER_ORDER.explosion = ro++;

// HELPERS

var TIMEOUT_LIST = [];

function ingameTimeout(seconds, callback){ // timeout function using in-game time
	TIMEOUT_LIST.push({seconds, callback});
}

function updateIngameTimeouts(){
	for(var i=0; i<TIMEOUT_LIST.length; i++){
		TIMEOUT_LIST[i].seconds -= DT;
		if(TIMEOUT_LIST[i].seconds<=0){
			TIMEOUT_LIST[i].callback();
			TIMEOUT_LIST.splice(i,1);
		}
	}
}



