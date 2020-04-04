
Scene = {}

Scene.renderer = new THREE.WebGLRenderer();
if(DEPRICATED){
	Scene.graphicsScene = new THREE.Scene();
}
else{
	Scene.graphicsScene = null
}

Scene.renderer.domElement.requestPointerLock =
	Scene.renderer.domElement.requestPointerLock ||
	Scene.renderer.domElement.mozRequestPointerLock ||
	Scene.renderer.domElement.webkitRequestPointerLock;

Scene.renderer.domElement.onclick = function () {
	if (DEBUG < 2) {
	Scene.renderer.domElement.requestPointerLock();
	ScreenControl.enterFullScreen();
	}
};

var HEMISPHERE_LIGHT

Scene.init = function() {
	Scene.renderer.setPixelRatio(RESOLUTION);
	Scene.renderer.setSize(window.innerWidth, window.innerHeight);
	Scene.renderer.setClearColor(0x000000);
	document.body.appendChild(Scene.renderer.domElement); // creates canvas on page into which the scene will be rendered

	if(DEPRICATED){
		HEMISPHERE_LIGHT = new THREE.HemisphereLight(0x2A2A2A, 0x000000, 2.0)
		HEMISPHERE_LIGHT.position.set(0, 0, 1)

		Scene.graphicsScene.add(HEMISPHERE_LIGHT)

		sunLight = new THREE.DirectionalLight(0xeeeeee, 0.8);
		sunLight.position.set(-1, 1, 1).normalize();
		Scene.graphicsScene.add(sunLight);
	}
}
