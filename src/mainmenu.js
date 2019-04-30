
MainMenu = {}

MainMenu.currentMapIndex = 0;

MainMenu.init = function() {
    console.log("init main menu");
    MainMenu.showMap(MainMenu.currentMapIndex); 
    //document.addEventListener('keydown', MainMenu.handleKeyDown);
    AirController.init();
}

MainMenu.showMap = function(index) {
    left = MainMenu.getCurrentMap(index - 1);
    center = MainMenu.getCurrentMap(index);
    right = MainMenu.getCurrentMap(index + 1);

    document.getElementById("leftmenuitem").src = left.thumbnail;
    document.getElementById("centermenuitem").src = center.thumbnail;
    document.getElementById("rightmenuitem").src = right.thumbnail;

    document.getElementById("descriptionmenuitem").innerHTML = center.description;
}

MainMenu.getCurrentMap = function(index) {
    i = index % GameMap.maps.length;
    if(i < 0) {
        i += GameMap.maps.length;
    }
    return GameMap.maps[i];
}

MainMenu.handleKeyDown = function (event) {
    if(event.key == "ArrowLeft") {
        MainMenu.currentMapIndex--;
        MainMenu.showMap(MainMenu.currentMapIndex); 
    } else if(event.key == "ArrowRight") {
        MainMenu.currentMapIndex++;
        MainMenu.showMap(MainMenu.currentMapIndex); 
    }
};