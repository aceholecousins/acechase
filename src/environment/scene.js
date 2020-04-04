
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

Scene.init = function() {
	Scene.renderer.setPixelRatio(RESOLUTION);
	Scene.renderer.setSize(window.innerWidth, window.innerHeight);
	Scene.renderer.setClearColor(0x000000);
	document.body.appendChild(Scene.renderer.domElement); // creates canvas on page into which the scene will be rendered

	if(DEPRICATED){
		ambientLight = new THREE.AmbientLight(0x555555);
		Scene.graphicsScene.add(ambientLight);

		sunLight = new THREE.DirectionalLight(0xeeeeee, 0.8);
		sunLight.position.set(-1, 1, 1).normalize();
		Scene.graphicsScene.add(sunLight);
	}
}
