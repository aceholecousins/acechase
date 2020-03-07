
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
	new GameMap("Mt. Grassice", "X", 0, "mtgrassice", "description goes here"),
	new GameMap("Hackerland", "X", 0, "hackerland", "description goes here"),
	new GameMap("Beehive", "X", 0, "beehive", "description goes here"),
	new GameMap("Temple Ruin", "X", 0, "temple", "description goes here"),
]
