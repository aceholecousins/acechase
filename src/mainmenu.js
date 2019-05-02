
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
					document.getElementById("avatarlist").innerHTML += `
						<div id="avatarDiv_{DEVICEID}">
							<table><tr><td>
								<img id="avatarImg_{DEVICEID}" src="media/images/avatar.png" style="background-color:{COLOR}; width:50%"></img>
							</td><td>
								{NICK}
							</td></tr></table>
						</div>`
							.split("{DEVICEID}").join(event.controller.device_id)
							.replace("{COLOR}", "#" + event.controller.color.getHexString())
							.replace("{NICK}", event.controller.nickName.split(" ").join("&nbsp;"))
					break;
				case "disconnected":
					document.getElementById("avatarDiv_" + event.controller.device_id).outerHTML = ""
					break;
				case "state":
					document.getElementById("avatarImg_" + event.controller.device_id).style.backgroundColor =
							"#" + event.controller.color.getHexString()
					break;
			}

		}
	}
}) (MainMenu);
