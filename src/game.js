
var CFGVERSION = 1; // version of the config string pattern

var PARAMS = location.hash;

var GAME_PHASE; // S for pre start, G for... going... on, O for over, R for results, P for paused

var hovers=[];
var ARENA;
var SCORETABLE;
var SCORETABLE_PROTECT = false;

var USING_AIR_CONSOLE = false;

var STARTLINE, FINISHLINE;

function init() {
	document.getElementById("splashscreentext").innerHTML = "<b>" + QUOTES[Math.floor(Math.random()*QUOTES.length)]
		+ "</b><br><br><i>loading...</i>";

	ARENA = new Arena(MAP);
	SCORETABLE = new ScoreTable();

	GRAPHICS_SCENE.add(SCORETABLE.plane);
	SCORETABLE.plane.visible = false;

	LOADING_LIST.setCallback(prepareGame);
}

function readParams() {

	if(PARAMS == ""){
		USING_AIR_CONSOLE = true;
		return;
	}
	PARAMS = PARAMS.slice(1).split(';');
	if(PARAMS[0] != 'hbcfgv:' + CFGVERSION){
		alert("Link contains invalid or outdated game configuration!");
		PARAMS = "#hbcfgv:" + CFGVERSION
			+ "debug:0;player:Dani,keyboard,pink;player:Mirko,mouse,lime;"
			+ "player:Oli,gamepad1,red;player:Sebbi,gamepad2,yellow";
	}

	for(var i=0; i<PARAMS.length; i++){
		var key = PARAMS[i].split(':')[0];
		var value = PARAMS[i].split(':')[1];

		// the ..0 items are for single player mode
		if(key == "game" || key == "game0"){
			GAME_MODE = value[0];
			if(key.length > 1){GAME_LEVEL = value[1];}
		}
		if(key == "hp"){HITPOINTS = value * 1;}
		if(key == "shld"){SHIELD = value *1;}
		if(key == "shldreg"){SHIELD_REGEN = value * 1;}
		if(key == "ammo"){PHASER_AMMO = value * 1;}
		if(key == "ammoreg"){PHASER_REGEN = value * 1;}
		if(key == "time"){ROUND_TIME = value * 1;}
		if(key == "map" || key == "map0"){MAP = value;}
		if(key == "bump" || key == "bump0"){TERRAIN_BUMP_MAPPING = value=="1";}
		if(key == "h2o" || key == "h2o0"){FANCY_WATER = value=="1";}
		if(key == "res" || key == "res0"){RESOLUTION = 0.01*value;}
		if(key == "vol" || key == "vol0"){MUSIC_VOLUME = 0.01*value;}
		if(key == "debug" || key == "debug0"){DEBUG = 1*value;}
	}
}

function prepareGame() {

	if(GAME_MODE == "T" || GAME_MODE == "R"){ // race or time trial
		STARTLINE = ASL.getline("startline");
		FINISHLINE = ASL.getline("finishline");
	}

	if(GAME_MODE == "T" || GAME_MODE == "R"){ // time trials or race
		SCORETABLE.prepare( hovers.length+4, [1,1], [0.4,0.2,0.4], ["c", "c"]); // room for medal
	}
	else if(GAME_MODE == "D"){ // deathmatch
		SCORETABLE.prepare( hovers.length+2, [1,0.3,0.3,0.3], [0.2,0.1,0.1,0.1,0.2], ["c", "c", "c", "c"]);
	}
	else if(GAME_MODE == "X"){ // shooting range
		SCORETABLE.prepare( hovers.length+4, [1,0.3,0.3,0.3], [0.2,0.1,0.1,0.1,0.2], ["c", "c", "c", "c"]);
	}

	createHovercraftsFromParams();

	if(isAtLeastOneMobileDevice()) {
		console.log("At least one mobile device");
		initMobileDevice();
	} else {
		start();
	}
}

function createHovercraftsFromParams() {
	var iPlayer=0;

	for(var i=0; i<PARAMS.length; i++){
		var key = PARAMS[i].split(':')[0];
		var value = PARAMS[i].split(':')[1];

		if(key=="player" || key=="player0"){
			hovers[iPlayer] = new Hovercraft(
					new THREE.Color(value.split(',')[1]),
					Control.createControl(value));
			hovers[iPlayer].playerName = value.split(',')[0];
			iPlayer++;
		}
	}
}

function isAtLeastOneMobileDevice() {
	return hovers.findIndex(function (element, index, array) {
		return element.control instanceof MobileDevice;
	}) != -1;
}

function initMobileDevice() {
	document.getElementById("splashscreentext").innerHTML =
			"Hold your device in desired initial position and touch screen!<br>" +
			"<img src='media/images/hold_phone.png' alt='Hold Phone Image'>";
	document.body.onclick = start;
}

function captureMobileDevicesInitialPosition() {
	hovers.forEach(function(element, index, array) {
		if(element.control instanceof MobileDevice) {
			element.control.captureRotationMatrix();
		}
	});
}

function start() {

	if(isAtLeastOneMobileDevice()) {
		document.body.onclick = null;
		captureMobileDevicesInitialPosition();
		ScreenControl.enterFullScreen();
		ScreenControl.lockScreenToLandscape();
	}

	onWindowResize(); // call to initially adjust camera
	document.getElementById("splashscreen").style.visibility = "hidden";
	RENDERER.setClearColor( FOG_COLOR );

	newRound();
	gameloop();
}

function gameloop() {

	requestAnimationFrame( gameloop );

	if(GAME_PHASE != "P"){ // not paused
		updateIngameTimeouts(); // ingame timeouts also run during start and over phase (for triggering their end)

		if(GAME_MODE == "D"){maybeSpawnPowerup();}

		PHYSICS_WORLD.step(DT);

		if((GAME_MODE == "T" || GAME_MODE == "R") && GAME_PHASE == "G"){ // time trial or race, ongoing

			var allFinished = true;

			for(var i=0; i<hovers.length; i++){

				if(!hovers[i].finished){
					hovers[i].racetime += DT;
					allFinished = false;
				}

				var finish = linesegintersect(hovers[i].lastPosition, hovers[i].newPosition, FINISHLINE.p0, FINISHLINE.p1);

				if(finish.bool){ // crossed the finish line
					hovers[i].finished = true;
					hovers[i].hitpoints = 0; // explode
					hovers[i].racetime += -DT + finish.s*DT; // subframe accuracy for time measurement!
				}
			}
			if(allFinished){
				GAME_PHASE = "O"; // game is over
				ingameTimeout(1, function(){endRound();});
			}
		}

		if(GAME_PHASE == "R"){
			var continus = 0;
			for(var i=0; i<hovers.length; i++){
				hovers[i].control.update();
				if(hovers[i].control.fire && !SCORETABLE_PROTECT){hovers[i].continu = true;}
				if(hovers[i].continu){continus++;}
			}
			if(continus > hovers.length/2 && !SCORETABLE_PROTECT){newRound();} // majority vote
		}

		THRUST_SOUND.gn.gain.value = 0.0;
		updateAllHBObjects();

		updateCam();
		INGAME_TIME += DT;

		updateAllEffects();
		updateWater();

	}

	RENDERER.render( GRAPHICS_SCENE, CAMERA );
	if(DEBUG>=1){STATS.update()};

	FRAME_COUNTER++;

	// explosion testing
	/*if(FRAME_COUNTER% 6  == 5){
		explosion(new THREE.Vector3(Math.random()*40-20, Math.random()*30-15, 0), new THREE.Color(Math.floor(Math.random()*0x1000000)));
	}*/

}



function endRound(){ // display results

	GAME_PHASE = "R";
	SCORETABLE_PROTECT = true;
	ingameTimeout(2, function(){SCORETABLE_PROTECT = false;}); // show scoretable for at least 2 seconds

	if(GAME_MODE == "T"){ // time trial
		hovers.sort(function(a, b){return (a.racetime - b.racetime);});
		// not sure if it is a good idea to shuffle this array, lets see
		SCORETABLE.clear();
		SCORETABLE.line(["P L A Y E R", "T I M E"], new THREE.Color("black"));
		SCORETABLE.line(["", ""], new THREE.Color("black"));

		var highscore = 1e6;

		for(var i=0; i<hovers.length; i++){
			SCORETABLE.line([hovers[i].playerName,
					Math.floor(hovers[i].racetime/60) + ":"
					+ pad(Math.floor(hovers[i].racetime%60),2) + "."
					+ pad(Math.round(1000*(hovers[i].racetime%1)),3)],
					hovers[i].color);

			highscore = getCookie(MAP);
			if(highscore == ""){highscore = 1e6;}
			highscore *= 1; // string to numba
			if(hovers[i].racetime < highscore){
				setCookie(MAP, hovers[i].racetime + "", 3650); // +"" for numba 2 string
				SCORETABLE.centeredLine("Highscore!", hovers[i].color);
				highscore = hovers[i].racetime;
			}

			var award = medal(MAP, hovers[i].racetime);
			if(award == "bronze"){SCORETABLE.centeredLine("Bronze.", new THREE.Color("firebrick"));}
			if(award == "silver"){SCORETABLE.centeredLine("Silver!", new THREE.Color("silver"));}
			if(award == "gold"){SCORETABLE.centeredLine("Gold!!!", new THREE.Color("gold"));}
			if(award == "diamond"){SCORETABLE.centeredLine("DIAMOND!!!1", new THREE.Color("azure"));}

		}

		SCORETABLE.line(["Highscore",
				Math.floor(highscore/60) + ":"
				+ pad(Math.floor(highscore%60),2) + "."
				+ pad(Math.round(1000*(highscore%1)),3)],
				new THREE.Color("black"));

		SCORETABLE.plane.visible = true;
	}

	if(GAME_MODE == "R"){ // race
		hovers.sort(function(a, b){return (a.racetime - b.racetime);});
		// not sure if it is a good idea to shuffle this array, lets see
		SCORETABLE.clear();
		SCORETABLE.line(["P L A Y E R", "T I M E"], new THREE.Color("black"));
		SCORETABLE.line(["", ""], new THREE.Color("black"));

		for(var i=0; i<hovers.length; i++){
			SCORETABLE.line([hovers[i].playerName,
					Math.floor(hovers[i].racetime/60) + ":"
					+ pad(Math.floor(hovers[i].racetime%60),2) + "."
					+ pad(Math.round(1000*(hovers[i].racetime%1)),3)],
					hovers[i].color);
		}
		SCORETABLE.plane.visible = true;
	}

	else if(GAME_MODE == "D"){ // death match
		hovers.sort(function(a, b){return (b.kills*1.1-b.deaths) - (a.kills*1.1-a.deaths);});
		// not sure if it is a good idea to shuffle this array, lets see
		SCORETABLE.clear();
		SCORETABLE.line(["P L A Y E R", "SCORE ", "KILLS ", "DEATHS"], new THREE.Color("black"));
		SCORETABLE.line(["", "", "", ""], new THREE.Color("black"));

		for(var i=0; i<hovers.length; i++){
			SCORETABLE.line([hovers[i].playerName,
					Math.round((hovers[i].kills*1.1 - hovers[i].deaths)*10)/10, // prevents 1.100000000002
					hovers[i].kills,
					hovers[i].deaths],
					hovers[i].color);
		}
		SCORETABLE.plane.visible = true;
	}

	if(GAME_MODE == "X" && hovers.length == 1){ // shooting range, single player

		hovers.sort(function(a, b){return (b.targets-0.9*b.mines) - (a.targets-0.9*a.mines);});
		SCORETABLE.clear();
		SCORETABLE.line(["P L A Y E R", " SCORE ", "TARGETS", " MINES "], new THREE.Color("black"));
		SCORETABLE.line(["", "", "", ""], new THREE.Color("black"));

		var highscore = 0;

		for(var i=0; i<hovers.length; i++){
			var score = Math.round((hovers[i].targets - 0.9*hovers[i].mines)*10)/10; // prevents 1.100000000002

			SCORETABLE.line([hovers[i].playerName, score, hovers[i].targets, hovers[i].mines], hovers[i].color);

			highscore = getCookie(MAP);
			if(highscore == ""){highscore = 0;}
			highscore *= 1; // string to numba
			if(score > highscore){
				setCookie(MAP, score + "", 3650); // +"" for numba 2 string
				SCORETABLE.centeredLine("Highscore!", hovers[i].color);
				highscore = score;
			}

			var award = medal(MAP, score);
			if(award == "bronze"){SCORETABLE.centeredLine("Bronze.", new THREE.Color("firebrick"));}
			if(award == "silver"){SCORETABLE.centeredLine("Silver!", new THREE.Color("silver"));}
			if(award == "gold"){SCORETABLE.centeredLine("Gold!!!", new THREE.Color("gold"));}
			if(award == "diamond"){SCORETABLE.centeredLine("DIAMOND!!!1", new THREE.Color("azure"));}

		}

		SCORETABLE.line(["Highscore", highscore, "", ""], new THREE.Color("black"));
		SCORETABLE.plane.visible = true;
	}

	if(GAME_MODE == "X" && hovers.length > 1){ // shooting range, multiplayer

		hovers.sort(function(a, b){return (b.targets-0.9*b.mines) - (a.targets-0.9*a.mines);});
		SCORETABLE.clear();
		SCORETABLE.line(["P L A Y E R", " SCORE ", "TARGETS", " MINES "], new THREE.Color("black"));
		SCORETABLE.line(["", "", "", ""], new THREE.Color("black"));

		for(var i=0; i<hovers.length; i++){
			var score = Math.round((hovers[i].targets - 0.9*hovers[i].mines)*10)/10; // prevents 1.100000000002
			SCORETABLE.line([hovers[i].playerName, score, hovers[i].targets, hovers[i].mines], hovers[i].color);
		}
		SCORETABLE.plane.visible = true;
	}
}

function newRound(){
	GAME_PHASE = "S";

	INGAME_TIME = 0;

	SCORETABLE.plane.visible = false;

	for(var i=0; i<hovers.length; i++){
		hovers[i].initNewRound(i);
	}

	for(var i=0; i<EFFECT_LIST.length; i++){
		EFFECT_LIST[i].despawn();
	}
	updateAllEffects();

	for(var i=0; i<HBO_LIST.length; i++){
		if(HBO_LIST[i].type != 'hover'){
			HBO_LIST[i].despawn();
		}
	}
	NPUBOXES = 0;

	DT = DT_ORIGINAL;
	WATER_MATERIAL.uniforms.waterColor.value.set(WATER_COLOR.r, WATER_COLOR.g, WATER_COLOR.b, WATER_OPACITY);

	updateAllHBObjects();

	TIMEOUT_LIST = [];

	ingameTimeout(1, function(){GAME_PHASE = "G";});

	if(GAME_MODE == "D" || GAME_MODE == "X"){ // death match or shooting range
		ingameTimeout(ROUND_TIME+1, function(){
			endRound();
		}); // time limit
	}

	if(GAME_MODE == "X"){ // spawn targets for shooting range
		if(GAME_LEVEL == "1"){
			ingameTimeout(1, function(){spawnTarget(false);});
			ingameTimeout(2, function(){spawnTarget(false);});
			ingameTimeout(3, function(){spawnTarget(false);});
			ingameTimeout(4, function(){spawnTarget(false);});
			ingameTimeout(5, function(){spawnTarget(true, 50);});
		}
		if(GAME_LEVEL == "2"){
			ingameTimeout(1, function(){spawnTarget(false);});
			ingameTimeout(2, function(){spawnTarget(false);});
			ingameTimeout(3, function(){spawnTarget(false);});
			ingameTimeout(5, function(){spawnTarget(true, 20);});
			ingameTimeout(6, function(){spawnTarget(true, 60);});
			ingameTimeout(7, function(){spawnTarget(true, 120);});
		}
	}
}
