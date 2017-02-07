
var RENDERER = new THREE.WebGLRenderer();
RENDERER.setSize( window.innerWidth, window.innerHeight );
//RENDERER.setClearColor( 0x808080, 1);
RENDERER.setClearColor( 0x000000 );
document.body.appendChild( RENDERER.domElement ); // creates canvas on page into which the scene will be rendered

var GRAPHICS_SCENE = new THREE.Scene();

var CAMERA = new THREE.PerspectiveCamera(53, window.innerWidth / window.innerHeight, 1.0, 100.0); // angle, aspect, near, far
CAMERA.position.z = 31;

var controls = null; // orbit controls for mouse control of camera
if(DEBUG>=2){
	new THREE.OrbitControls( CAMERA );
}

window.addEventListener( 'resize', onWindowResize, false ); // adapt scene when window is resized
function onWindowResize() {
	CAMERA.aspect = window.innerWidth / window.innerHeight;
	CAMERA.updateProjectionMatrix();
    RENDERER.setSize( window.innerWidth, window.innerHeight );
}

var AMBIENT_LIGHT = new THREE.AmbientLight( 0x303050 );
GRAPHICS_SCENE.add(AMBIENT_LIGHT);

var SUN_LIGHT = new THREE.DirectionalLight( 0xffffff, 0.8 );
SUN_LIGHT.position.set(-1, 1, 1).normalize();
GRAPHICS_SCENE.add( SUN_LIGHT );
