
Map = function(name, thumbnail, svg, description) {
    this.name = name;
    this.thumbnail = thumbnail;
    this.svg = svg;
    this.description = description;
}

Map.maps = [
    new Map("Cactus", "maps/cactus.jpg", "maps/cactus.svg", "This is a Cactus description"),
    new Map("Hilbert Garden", "maps/hilbertsgarden.jpg", "maps/hilbertsgarden.svg", "This is a Hilbert description"),
    new Map("Shooting Range 1", "maps/shootingrange1.png", "maps/shootingrange1.svg", "This is a Shooting Range 1 description"),
    new Map("Shooting Range 2", "maps/shootingrange2.png", "maps/shootingrange2.svg", "This is a Shooting Range 2 description"),
]