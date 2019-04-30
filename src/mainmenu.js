
MainMenu = {};
(function(context) {

    currentMapIndex = 0;

    context.init = function() {
        console.log("init main menu");
        document.getElementById("mainmenu").style.visibility = "visible";
        showMap(currentMapIndex); 
        
        AirControl.init();
        AirControl.addEventHandler(onControllerEvent);
    }

    context.close = function() {
        AirControl.removeEventHandler(onControllerEvent);
        document.getElementById("mainmenu").style.visibility = "hidden";
        setParameters();
    
        AirControl.setGameState(AirControl.GAME_STATES.game);
    
        initGame();
    }

    setParameters = function() {
        const mapToUse = getMapForIndex(currentMapIndex);
        MAP = mapToUse.svg;
        GAME_MODE = mapToUse.gameMode;
        GAME_LEVEL = mapToUse.gameLevel;
    }

    showMap = function(index) {
        left = getMapForIndex(index - 1);
        center = getMapForIndex(index);
        right = getMapForIndex(index + 1);
    
        document.getElementById("leftmenuitem").src = left.thumbnail;
        document.getElementById("centermenuitem").src = center.thumbnail;
        document.getElementById("rightmenuitem").src = right.thumbnail;
    
        document.getElementById("descriptionmenuitem").innerHTML = center.description;
    }

    getMapForIndex = function(index) {
        i = index % GameMap.maps.length;
        if(i < 0) {
            i += GameMap.maps.length;
        }
        return GameMap.maps[i];
    }

    onControllerEvent = function(event) {
        if(event.type == "menu") {
            console.log("MainMenu.onControllerEvent: " + event.value + ", Device " + event.controller.device_id);
            switch(event.value) {
                case "left":
                currentMapIndex--;
                showMap(currentMapIndex); 
                break;
                case "right":
                currentMapIndex++;
                showMap(currentMapIndex); 
                break;
                case "enter":
                context.close();
                break;
            }
        }
    }
})(MainMenu);

