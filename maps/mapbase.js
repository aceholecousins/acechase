
class Map{

	constructor(scene, settings, players){
		// load content, fill scene, position players
	}

	reportLoadingProgress(){
		// used for the loading bar of the level
		return 1.0
	}

	update(time, players){
		// time is the ingame time, negative during dollie shot and countdown
		// each player has a score and a score string for the score table

		// return true if round is over (will keep running during score screen)
		return time > 60
	}

	restart(){

	}

	// for cleanup we just delete both scene and renderer
}
