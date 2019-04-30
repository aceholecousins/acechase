
MainMenu = {}

MainMenu.currentMapIndex = 0;

MainMenu.init = function() {
    console.log("init main menu");
    MainMenu.showMap(MainMenu.currentMapIndex); 
    //document.addEventListener('keydown', MainMenu.handleKeyDown);
    AirController.init();
    AirController.addEventHandler(MainMenu.onControllerEvent);
}

MainMenu.close = function() {
    AirController.removeEventHandler(MainMenu.onControllerEvent);
    document.getElementById("mainmenu").style.visibility = "hidden";
    MainMenu.setParameters();

    AirController.setGameState(GAME_STATES.game);

    init();
}

MainMenu.setParameters = function() {
    const mapToUse = MainMenu.getMapForIndex(MainMenu.currentMapIndex);
    MAP = mapToUse.svg;
    GAME_MODE = mapToUse.gameMode;
    GAME_LEVEL = mapToUse.gameLevel;
}

MainMenu.showMap = function(index) {
    left = MainMenu.getMapForIndex(index - 1);
    center = MainMenu.getMapForIndex(index);
    right = MainMenu.getMapForIndex(index + 1);

    document.getElementById("leftmenuitem").src = left.thumbnail;
    document.getElementById("centermenuitem").src = center.thumbnail;
    document.getElementById("rightmenuitem").src = right.thumbnail;

    document.getElementById("descriptionmenuitem").innerHTML = center.description;
}

MainMenu.getMapForIndex = function(index) {
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

MainMenu.onControllerEvent = function(event) {
    if(event.type == "menu") {
        console.log("MainMenu.onControllerEvent: " + event.value + ", Device " + event.controller.device_id);
        switch(event.value) {
            case "left":
            MainMenu.currentMapIndex--;
            MainMenu.showMap(MainMenu.currentMapIndex); 
            break;
            case "right":
            MainMenu.currentMapIndex++;
            MainMenu.showMap(MainMenu.currentMapIndex); 
            break;
            case "enter":
            MainMenu.close();
            break;
        }
    }
}