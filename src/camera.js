
// needs to know LEVEL_WIDTH and LEVEL_HEIGHT
var CAMERA = new THREE.PerspectiveCamera(53, window.innerWidth / window.innerHeight, 1.0, 100.0); // angle, aspect, near, far

var CAM_PIVOT_HEIGHT = 1;
var CAM_PIVOT_RADIUS = 1;
var CAM_FOCUS = new THREE.Vector3(0,0,-1);

window.addEventListener( 'resize', onWindowResize, false ); // adapt scene when window is resized
function onWindowResize() {

	CAMERA.aspect = window.innerWidth / window.innerHeight;
	CAMERA.updateProjectionMatrix();
	RENDERER.setSize( window.innerWidth, window.innerHeight );

	var alphav = CAMERA.fov/2 /180*3.14; // half vertical camera opening angle
	var alphah = Math.atan(Math.tan(alphav)*CAMERA.aspect); // half horizontal camera opening angle
	var alphad = Math.atan(Math.tan(alphav)*Math.sqrt(1+CAMERA.aspect*CAMERA.aspect)) // half diagonal camera opening angle

	var inflate = 1.1; // cover this much of the map

	var camzh = LEVEL_WIDTH*inflate/2  / Math.tan(alphah);
	var camzv = LEVEL_HEIGHT*inflate/2 / Math.tan(alphav);
	
	var camz = camzv;
	var verticallyLimited = true;
	var halfScreenDiag = LEVEL_HEIGHT*Math.sqrt(1+CAMERA.aspect*CAMERA.aspect)/2;
	if(camzh > camz){
		camz=camzh;
		verticallyLimited = false;
		halfScreenDiag = LEVEL_WIDTH*Math.sqrt(1+1/CAMERA.aspect/CAMERA.aspect)/2;
	}

	CAM_PIVOT_HEIGHT = (camz*camz - halfScreenDiag*halfScreenDiag)/camz/2;
	CAM_PIVOT_RADIUS = camz - CAM_PIVOT_HEIGHT;
	CAM_FOCUS.z = CAM_PIVOT_HEIGHT - CAM_PIVOT_RADIUS;

	CAMERA.position.z = camz;
	
}

function updateCam(){
	var snapx = hovers[2].mesh.position.x;
	var snapy = hovers[2].mesh.position.y;
	var snapr = Math.sqrt(snapx*snapx + snapy*snapy);
	
	CAMERA.position.x = snapx;
	CAMERA.position.y = snapy;
	CAMERA.position.z = CAM_PIVOT_HEIGHT + Math.sqrt(CAM_PIVOT_RADIUS*CAM_PIVOT_RADIUS - snapr*snapr);

	CAMERA.lookAt(CAM_FOCUS);

	console.log(CAMERA.matrixWorldInverse);	
}

if(DEBUG>=2){
	new THREE.OrbitControls( CAMERA );
}
