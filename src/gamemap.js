
GameMap = function(name, gameMode, gameLevel, folder, description) {
	this.name = name;
	this.gameMode = gameMode;
	this.gameLevel = gameLevel;
	//this.thumbnail = thumbnail;
	this.thumbnail = null;
	this.folder = folder;
	this.description = description;
}

GameMap.maps = [
	new GameMap("Mt. Grassice", "R", 0, "mtgrassice", "description goes here"),
	new GameMap("Hackerland", "D", 0, "hackerland", "description goes here"),
	new GameMap("Beehive", "D", 0, "beehive", "description goes here"),
	new GameMap("Temple Ruin", "D", 0, "temple", "description goes here"),
	new GameMap("TripleAce Arena I", "X1", 0, "tripleace", "description goes here"),
	new GameMap("TripleAce Arena II", "X2", 0, "tripleace", "description goes here"),
]
