
// GENERAL

var LOADING_LIST = new Checklist(); // contains elements for things that have to be loaded from external files

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
var DT = 1.0/60.0; // time between two frames in seconds. Dynamically adjusts to screen framerate
var COFFEE_STRETCH = 2.5;
var INGAME_TIME = 0; // seconds since start of the current game

// PHYSICS

/* GridBroadphase was removed from p2 but might come back
// broadphase is a pre collision check done by the physics engine to find potential collisions
var BROADPHASE = new p2.GridBroadphase(); // filled in when arena is loaded
*/
var BROADPHASE = new p2.SAPBroadphase();

var USE_DISTANCE_MAP = true

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
		if( USE_DISTANCE_MAP && coastDistance(movingBody.position[0], movingBody.position[1]) > movingBody.boundingRadius+0.2 ){
			result = false;
		}
		else{
			result = p2.Broadphase.aabbCheck(bodyA, bodyB);
			//result = p2.Broadphase.boundingRadiusCheck(bodyA,bodyB);
		}
	}
    return result;
};

//TODO: do the filtering with collision groups https://github.com/schteppe/p2.js/wiki

// CG = collision group
CG_ARENA   = Math.pow(2,0);
CG_HOVER   = Math.pow(2,1);
CG_PHASER  = Math.pow(2,2);
CG_PUBOX   = Math.pow(2,3);
CG_MISSILE = Math.pow(2,4);
CG_SEAMINE = Math.pow(2,5);
CG_TARGET  = Math.pow(2,6);
CG_BOMB    = Math.pow(2,7);

CG_ALL     = Math.pow(2,15)-1;

// CM = collisison mask
CM_ARENA   = CG_ALL
CM_HOVER   = CG_ALL
CM_PHASER  = CG_ALL - CG_SEAMINE
CM_PUBOX   = CG_ALL
CM_MISSILE = CG_ALL - CG_SEAMINE
CM_SEAMINE = CG_ALL - CG_PHASER - CG_MISSILE
CM_TARGET  = CG_ALL
CM_BOMB    = CG_ALL

// override pre collision check to exclude phasershots by one and the same player
var canCollideOld = p2.Broadphase.canCollide;
p2.Broadphase.canCollide = function(bodyA, bodyB){
	if(bodyA.HBO.type == "phaser" && bodyB.HBO.type == "phaser"){
		if(bodyA.HBO.shooter == bodyB.HBO.shooter){
			return false;
		}
	}
	return canCollideOld(bodyA, bodyB);
}

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
var ARENA_MATERIAL = new p2.Material();
var PHASER_MATERIAL = new p2.Material();

PHYSICS_WORLD.addContactMaterial(new p2.ContactMaterial(HOVER_MATERIAL, ARENA_MATERIAL, {
		restitution : 0.5, stiffness : 1e5, friction : 0.1}));
PHYSICS_WORLD.addContactMaterial(new p2.ContactMaterial(HOVER_MATERIAL, HOVER_MATERIAL, {
		restitution : 0.8, stiffness : 1e5, friction : 0.1}));
PHYSICS_WORLD.addContactMaterial(new p2.ContactMaterial(PHASER_MATERIAL, ARENA_MATERIAL, {
		restitution : 0.7, stiffness : 1e5, friction : 0.1}));

// collisions (including phaser hits)

PHYSICS_WORLD.on('impact', function(event){
	var firstBody; // alphabetically sort by type to simplify checks
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
	if(firstBody.HBO.type == "phaser" && secondBody.HBO.type == "pubox"){
		secondBody.HBO.shot();
	}
	if(firstBody.HBO.type == "phaser" && secondBody.HBO.type == "target"){
		secondBody.HBO.shotBy(firstBody.HBO.shooter);
	}
	if(firstBody.HBO.type == "bomb" && secondBody.HBO.type == "phaser"){
		firstBody.HBO.shotBy(secondBody.HBO.shooter);
	}
	if(firstBody.HBO.type == "bomb" && secondBody.HBO.type == "hover"){
		if(GAME_PHASE == "G"){
			firstBody.HBO.hitpoints.set(0);
			secondBody.HBO.hitpoints.set(0);
			firstBody.HBO.destroyedBy = secondBody.HBO;
		}
	}
	if(firstBody.HBO.type == "hover" && secondBody.HBO.type == "pubox"){
		firstBody.HBO.collect(secondBody.HBO.pu);
		secondBody.HBO.destroyed();
	}
	if(firstBody.HBO.type == "missile" && secondBody.HBO.type == "pubox"){
		secondBody.HBO.destroyed();
	}
	if(firstBody.HBO.type == "pubox" && secondBody.HBO.type == "seamine"){
		firstBody.HBO.destroyed();
	}
	if(firstBody.HBO.type == "arena" && secondBody.HBO.type == "hover"){
		secondBody.HBO.wallhit();
	}
	if(firstBody.HBO.type == "missile" && secondBody.HBO.type == 'phaser'){
		firstBody.HBO.hitpoints.change(-1);
	}
	else{
		if(firstBody.HBO.type == "missile"){
			firstBody.HBO.impact();
		}
		if(secondBody.HBO.type == "missile"){
			secondBody.HBO.impact();
		}
	}
	if(firstBody.HBO.type == "hover" && secondBody.HBO.type == 'missile'){
		firstBody.HBO.hitBy(secondBody.HBO);
	}
	if(firstBody.HBO.type == "seamine"){
		firstBody.HBO.impact();
	}
	if(secondBody.HBO.type == "seamine"){
		secondBody.HBO.impact();
	}
	if(firstBody.HBO.type == "hover" && secondBody.HBO.type == 'seamine'){
		firstBody.HBO.hitBy(secondBody.HBO);
	}
	if(firstBody.HBO.type == "hover" && secondBody.HBO.type == 'hover'){ // possible powershield damage and bounce
		firstBody.HBO.hitBy(secondBody.HBO);
		secondBody.HBO.hitBy(firstBody.HBO);
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
		});
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

var DAE_LOADER = new THREE.ColladaLoader()
function loadCollada(filename, onLoad){
	LOADING_LIST.addItem(filename);

	DAE_LOADER.load( filename, function(collada) {
		fixNormalsRec(collada.scene)
		onLoad(collada.scene)
		LOADING_LIST.checkItem(filename);
	})
}

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
	var timeoutObject = {seconds, callback};
	TIMEOUT_LIST.push(timeoutObject);
	return timeoutObject;
}

function updateIngameTimeouts(){
	for(var i=0; i<TIMEOUT_LIST.length; i++){
		TIMEOUT_LIST[i].seconds -= DT;
		if(TIMEOUT_LIST[i].seconds<=0){
			var cb = TIMEOUT_LIST[i].callback;
			TIMEOUT_LIST.splice(i,1);
			cb(); // needs to be done after splice, otherwise if newRound() clears the list and creates a new timeout, it will be deleted by splice
		}
	}
}

function pad(num, size){ // 0 padding for time
	var s = num+"";
	while (s.length < size){
		s = "0" + s;
	}
	return s;
}

String.prototype.replaceAll = function(search, replacement){var target = this; return target.split(search).join(replacement);};

function linesegintersect(p1, p2, q1, q2){ // stolen from p2.js
   var dx = p2.x - p1.x;
   var dy = p2.y - p1.y;
   var da = q2.x - q1.x;
   var db = q2.y - q1.y;

   // segments are parallel
   if(da*dy - db*dx == 0){
      return {bool:false, s:0, t:0};
	}

   var s = (dx * (q1.y - p1.y) + dy * (p1.x - q1.x)) / (da * dy - db * dx)
   var t = (da * (p1.y - q1.y) + db * (q1.x - p1.x)) / (db * dx - da * dy)

   return {bool:(s>=0 && s<=1 && t>=0 && t<=1), s:s, t:t};
};

function breakpoint(){
	var a=0; // place a breakpoint here in the browser debugger
}
