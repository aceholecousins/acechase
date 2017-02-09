
// needs to know LEVEL_WIDTH and LEVEL_HEIGHT
var CAMERA = new THREE.PerspectiveCamera(53, window.innerWidth / window.innerHeight, 1.0, 300.0); // angle, aspect, near, far
CAMERA.position.set(0,0,30);

window.addEventListener( 'resize', onWindowResize, false ); // adapt scene when window is resized
function onWindowResize() {

	CAMERA.aspect = window.innerWidth / window.innerHeight;
	CAMERA.updateProjectionMatrix();
	RENDERER.setSize( window.innerWidth, window.innerHeight );

}

if(DEBUG>2){ // render camera frustum
	var material = new THREE.LineBasicMaterial({color: 0xffff00});
	var geometry = new THREE.Geometry();
	var camdir = new THREE.Line(geometry.clone(), material.clone()); GRAPHICS_SCENE.add(camdir);
	camdir.geometry.vertices = [new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,0)];
	var PC = new THREE.Vector3(0,0,0);
	var PNW = new THREE.Vector3(0,0,0);
	var PNE = new THREE.Vector3(0,0,0);
	var PSE = new THREE.Vector3(0,0,0);
	var PSW = new THREE.Vector3(0,0,0);
	var CNW = new THREE.Vector3(0,0,0);
	var CNE = new THREE.Vector3(0,0,0);
	var CSE = new THREE.Vector3(0,0,0);
	var CSW = new THREE.Vector3(0,0,0);
	var camfrust = new THREE.Line(geometry.clone(), material.clone()); GRAPHICS_SCENE.add(camfrust);
	camfrust.geometry.vertices = [PNW, PNE, PSE, PSW, PNW, PC, PNE, PC, PSE, PC, PSW];
	var camh = new THREE.Line(geometry.clone(), material.clone()); GRAPHICS_SCENE.add(camh);
	camh.geometry.vertices = [new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,0)];
	var camv = new THREE.Line(geometry.clone(), material.clone()); GRAPHICS_SCENE.add(camv);
	camv.geometry.vertices = [new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,0)];
	var camview = new THREE.Line(geometry.clone(), material.clone()); GRAPHICS_SCENE.add(camview);
	camview.material.color = new THREE.Color("blue");
	camview.geometry.vertices = [CNW, CNE, CSE, CSW, CNW];
}

function linePlaneIntersect(p1, p2, n, d){
	
	//x = p1 + s*(p2-p1);
	//x*n = d;
	//(p1 + s*(p2-p1))*n = d
	//p1*n + s*(p2-p1)*n = d
	//s*(p2-p1)*n = d - (p1*n)
	//s = d-(p1*n) / (p2-p1)*n

	var delta = new THREE.Vector3().subVectors(p2,p1);

	q = (d-p1.dot(n)) / delta.dot(n);
	var res = new THREE.Vector3().copy(p1).addScaledVector(delta,q);

	return res;
}

function updateCam(){

	var snapx = 0; // point that controls the camera angle in a magic way
	var snapy = 0;

	for(var i=0; i<hovers.length; i++){
		snapx += hovers[i].mesh.position.x;
		snapy += hovers[i].mesh.position.y;
	}
	snapx/=hovers.length;
	snapy/=hovers.length;
	
	// p are points, e are planes (makes sense in German) (the normals)

	var dir = new THREE.Vector3(-snapx, -snapy, -LEVEL_MAXDIM).normalize(); // camera direction
	var eh = new THREE.Vector3().crossVectors(dir, CAMERA.up).normalize(); // horizon vector (horizontal cam direction)
	var ev = new THREE.Vector3().crossVectors(eh, dir).normalize(); // vertical cam direction

	// half sizes of virtual screen plane at distance 1 in front of camera:
	var tanAlphav = Math.tan(CAMERA.fov/2 /180*3.14); // tangens of half vertical camera opening angle
	var tanAlphah = tanAlphav*CAMERA.aspect; // tangens half horizontal camera opening angle

	var dir_ = dir.clone();
	dir_.multiplyScalar(-tanAlphav);
	var eN = new THREE.Vector3().addVectors(dir_, ev); // northern limiting cam frustrum plane normal
	var eS = new THREE.Vector3().subVectors(dir_, ev); // southern ...

	dir_ = dir.clone();
	dir_.multiplyScalar(-tanAlphah);
	var eE = new THREE.Vector3().addVectors(dir_, eh); // eastern ...
	var eW = new THREE.Vector3().subVectors(dir_, eh); // western ...

	pSW = new THREE.Vector3(-LEVEL_WIDTH/2, -LEVEL_HEIGHT/2, 0); // map corners
	pSE = new THREE.Vector3( LEVEL_WIDTH/2, -LEVEL_HEIGHT/2, 0); 
	pNW = new THREE.Vector3(-LEVEL_WIDTH/2,  LEVEL_HEIGHT/2, 0); 
	pNE = new THREE.Vector3( LEVEL_WIDTH/2,  LEVEL_HEIGHT/2, 0); 
	
	var pN = pNE.clone(); // northest map corner in the camera view
	if(pNW.dot(eN) > pNE.dot(eN)){pN.copy(pNW);}

	var pS = pSE.clone(); // southest map corner in the camera view
	if(pSW.dot(eS) > pSE.dot(eS)){pS.copy(pSW);}

	var pE = pNE.clone() // eastest 
	if(pSE.dot(eE) > pNE.dot(eE)){pE.copy(pSE);}

	var pW = pNW.clone() // westest 
	if(pSW.dot(eW) > pNW.dot(eW)){pW.copy(pSW);}

	var eqsysh = new THREE.Matrix3();
	eqsysh.set( // coefficients for finding intersection points of the planes
		eN.x, eN.y, eN.z,
		eS.x, eS.y, eS.z,
		eh.x, eh.y, eh.z);

	var eqsysv = new THREE.Matrix3();
	eqsysv.set(
		eW.x, eW.y, eW.z,
		eE.x, eE.y, eE.z,
		ev.x, ev.y, ev.z);

	var mhinv = new THREE.Matrix3().getInverse(eqsysh);
	var rhs = new THREE.Vector3(eN.dot(pN), eS.dot(pS), 0);

	var pNSintersect = rhs.applyMatrix3(mhinv).clone(); // point on the line where north and south plane intersect

	var mvinv = new THREE.Matrix3().getInverse(eqsysv);
	rhs.set(eW.dot(pW), eE.dot(pE), 0);

	var pEWintersect = rhs.applyMatrix3(mvinv).clone(); // point on the line where east and west plane intersect

	var campos = new THREE.Vector3();

	if(dir.dot(pNSintersect) < dir.dot(pEWintersect)){ // NS planes determine cam position
		rhs.set(eN.dot(pN), eS.dot(pS), eh.dot(pEWintersect));
		campos.copy(rhs.applyMatrix3(mhinv));
	}
	else{
		rhs.set(eW.dot(pW), eE.dot(pE), ev.dot(pNSintersect));
		campos.copy(rhs.applyMatrix3(mvinv));
	}
	var lookat = new THREE.Vector3().addVectors(campos, dir);

	if(DEBUG<=2){
		CAMERA.position.copy(campos);
		CAMERA.lookAt(lookat);
	}

	if(DEBUG>2){ // render camera frustum

		var cammtx = new THREE.Matrix4();
		cammtx.set(
			eh.x, ev.x, -dir.x, campos.x,
			eh.y, ev.y, -dir.y, campos.y,
			eh.z, ev.z, -dir.z, campos.z,
			0,0,0,1);

		//camfrust.setRotationFromQuaternion(new THREE.Quaternion(0,1,0,0));
		//camfrust.position.copy(campos);

		camdir.geometry.vertices[0].copy(campos.clone());
		camdir.geometry.vertices[1].copy(lookat.clone());
		camdir.geometry.verticesNeedUpdate = true;

		camh.geometry.vertices[0].copy(new THREE.Vector3().copy(campos).addScaledVector(eh,-4));
		camh.geometry.vertices[1].copy(new THREE.Vector3().copy(campos).addScaledVector(eh,4));
		camh.geometry.verticesNeedUpdate = true;

		camv.geometry.vertices[0].copy(new THREE.Vector3().copy(campos).addScaledVector(ev,-3));
		camv.geometry.vertices[1].copy(new THREE.Vector3().copy(campos).addScaledVector(ev,3));
		camv.geometry.verticesNeedUpdate = true;

		var s = 30;
		PNW.set(-tanAlphah*s, tanAlphav*s, -s); PNW.applyMatrix4(cammtx);
		PNE.set( tanAlphah*s, tanAlphav*s, -s); PNE.applyMatrix4(cammtx);
		PSE.set( tanAlphah*s,-tanAlphav*s, -s); PSE.applyMatrix4(cammtx);
		PSW.set(-tanAlphah*s,-tanAlphav*s, -s); PSW.applyMatrix4(cammtx);
		PC.copy(campos);
		camfrust.geometry.verticesNeedUpdate = true;

		var ez = new THREE.Vector3(0,0,1);
		CNW.copy(linePlaneIntersect(campos, PNW, ez, 0));
		CNE.copy(linePlaneIntersect(campos, PNE, ez, 0));
		CSE.copy(linePlaneIntersect(campos, PSE, ez, 0));
		CSW.copy(linePlaneIntersect(campos, PSW, ez, 0));
		camview.geometry.verticesNeedUpdate = true;
	}	
}

if(DEBUG>=2){
	new THREE.OrbitControls( CAMERA );
}
