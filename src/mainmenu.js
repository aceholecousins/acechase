
MainMenu = {};
(function (context) {

    currentMapIndex = 0;

    context.init = function () {
        console.log("init main menu");
        document.getElementById("mainmenu").style.visibility = "visible";
        showMap(currentMapIndex);

        AirControl.init();
        AirControl.addEventHandler(onControllerEvent);
    }

    context.close = function () {
        AirControl.removeEventHandler(onControllerEvent);
        document.getElementById("mainmenu").style.visibility = "hidden";
        setParameters();

        AirControl.setGameState(AirControl.GAME_STATES.game);

        initGame();
    }

    setParameters = function () {
        const mapToUse = getMapForIndex(currentMapIndex);
        MAP = mapToUse.svg;
        GAME_MODE = mapToUse.gameMode;
        GAME_LEVEL = mapToUse.gameLevel;
    }

    showMap = function (index) {
        left = getMapForIndex(index - 1);
        center = getMapForIndex(index);
        right = getMapForIndex(index + 1);

        document.getElementById("leftmenuitem").src = left.thumbnail;
        document.getElementById("centermenuitem").src = center.thumbnail;
        document.getElementById("rightmenuitem").src = right.thumbnail;

        document.getElementById("descriptionmenuitem").innerHTML = center.description;
    }

    getMapForIndex = function (index) {
        i = index % GameMap.maps.length;
        if (i < 0) {
            i += GameMap.maps.length;
        }
        return GameMap.maps[i];
    }

    onControllerEvent = function (event) {
        console.log("MainMenu.onControllerEvent:", event);
        if(event.type == "menu") {
            switch (event.value) {
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
                case "connected":
                    console.log("Controller connected: ", event.controller);
                    //TODO: Add information from event.controller to menu
                    break;
                case "disconnected":
                    console.log("Controller disconnected: ", event.controller);
                    //TODO: Remove information from event.controller to menu
                    break;
                case "state":
                    console.log("Controller state changed: ", event.controller);
                    //TODO: Change information from event.controller to menu
                    break;
            }
              
        }
    }
}) (MainMenu);

