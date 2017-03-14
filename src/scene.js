
var RENDERER = new THREE.WebGLRenderer();
RENDERER.setSize( window.innerWidth, window.innerHeight );
//RENDERER.setClearColor( 0x808080, 1);
RENDERER.setClearColor( 0x000000 );
document.body.appendChild( RENDERER.domElement ); // creates canvas on page into which the scene will be rendered

var GRAPHICS_SCENE = new THREE.Scene();

var AMBIENT_LIGHT = new THREE.AmbientLight( 0x404050 );
GRAPHICS_SCENE.add(AMBIENT_LIGHT);

var SUN_LIGHT = new THREE.DirectionalLight( 0xffffff, 0.8 );
SUN_LIGHT.position.set(-1, 1, 1).normalize();
GRAPHICS_SCENE.add( SUN_LIGHT );
