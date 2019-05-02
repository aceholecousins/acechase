
GameMap = function(name, gameMode, gameLevel, thumbnail, svg, description) {
	this.name = name;
	this.gameMode = gameMode;
	this.gameLevel = gameLevel;
	this.thumbnail = thumbnail;
	this.svg = svg;
	this.description = description;
}

GameMap.maps = [
	new GameMap("Cactus", "R", 0, "maps/cactus.jpg", "maps/cactus.svg", "Race through the desert of Molvania!"),
	new GameMap("Hilbert Garden", "R", 0, "maps/hilbertsgarden.jpg", "maps/hilbertsgarden.svg", "Race through the Hilbert curve!"),
	new GameMap("Shooting Range 1", "X", 1, "maps/shootingrange1.png", "maps/shootingrange1.svg", "Shoot the targets and avoid touching or shooting the mines!"),
	new GameMap("Shooting Range 2", "X", 2, "maps/shootingrange2.png", "maps/shootingrange2.svg", "Shoot the targets and avoid touching or shooting the mines!"),
	new GameMap("Gass Ice Islands", "D", 0, "maps/grassiceislands.png", "maps/grassiceislands.svg", "Deathmatch on Grassice Island"),
	new GameMap("Hackerland", "D", 0, "maps/hackerland.png", "maps/hackerland.svg", "Deathmatch in Hackerland"),
	new GameMap("Honeycombs", "D", 0, "maps/honeycombs.png", "maps/honeycombs.svg", "Deathmatch in the BeeHive")
]
