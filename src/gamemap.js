
GameMap = function(name, gameMode, gameLevel, folder, description) {
	this.name = name;
	this.gameMode = gameMode;
	this.gameLevel = gameLevel;
	this.folder = folder;
	this.description = description;

	this.getThumbnail = function() {
		return "maps/" + this.folder + "/thumb.jpg"
	}
}

GameMap.maps = [
	new GameMap("Mt. Grassice", "R", 0, "mtgrassice", "Hustle through the beautiful valley of Mt. Grassice and be faster then your competitors!"),
	new GameMap("Hackerland", "D", 0, "hackerland", "Hack it!"),
	new GameMap("Beehive", "D", 0, "beehive", "Take up the role of a bee and beat your bee fellows."),
	new GameMap("Temple Ruin", "D", 0, "temple", "Hide and seek at this ancient and abandoned place."),
	new GameMap("TripleAce Arena I", "X1", 0, "tripleace", "Shoot as many targets as you can! Avoid shooting or touching the magnet mine though. 1 mine at a time."),
	new GameMap("TripleAce Arena II", "X2", 0, "tripleace", "Shoot as many targets as you can! Avoid shooting or touching the magnet mine though. 3 mines at a time."),
]
