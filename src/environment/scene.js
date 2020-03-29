
Scene = {}

Scene.renderer = new THREE.WebGLRenderer();
Scene.graphicsScene = new THREE.Scene();

Scene.init = function() {
    Scene.renderer.setPixelRatio(RESOLUTION);
    Scene.renderer.setSize(window.innerWidth, window.innerHeight);
    //Scene.renderer.setClearColor( 0x808080, 1);
    Scene.renderer.setClearColor(0x000000);
    document.body.appendChild(Scene.renderer.domElement); // creates canvas on page into which the scene will be rendered

    ambientLight = new THREE.AmbientLight(0x555555);
    Scene.graphicsScene.add(ambientLight);

    sunLight = new THREE.DirectionalLight(0xeeeeee, 0.8);
    sunLight.position.set(-1, 1, 1).normalize();
    Scene.graphicsScene.add(sunLight);
}
