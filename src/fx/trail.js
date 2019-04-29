

// class for long trail graphic effects that decay over time

function Trail(startPosition, width, color, duration){
	this.type = ''; // e.g. 'hovertrail'

	this.trailgeometry = new THREE.Geometry();
	for (var i = 0; i < duration/DT; i++) {
		this.trailgeometry.vertices.push(startPosition.clone());
	}

	this.trailmaterial = new MeshLineMaterial( {
		color: color.clone(),
		opacity: 0.45,
		resolution: new THREE.Vector2( window.innerWidth, window.innerHeight ),
		sizeAttenuation: 1,
		lineWidth: width,
		near: CAMERA.near,
		far: CAMERA.far,
		depthTest: true,
		//blending: THREE.AdditiveBlending,
		transparent: true,
		side: THREE.DoubleSide
	});

	this.meshline = new MeshLine();
	this.meshline.setGeometry( this.trailgeometry, function(p) {return Math.sin(2.5*p);} );

	this.mesh = new THREE.Mesh( this.meshline.geometry, this.trailmaterial );
	this.mesh.frustumCulled = false;

	Scene.graphicsScene.add( this.mesh );
}

Trail.prototype.reposition = function(pos){

	var positions = this.meshline.attributes.position.array;
	var previous = this.meshline.attributes.previous.array;
	var next = this.meshline.attributes.next.array;
	var l = positions.length;

	for(var i=0; i<l; i+=3){
		positions[i  ] = pos.x;
		positions[i+1] = pos.y;
		positions[i+2] = pos.z;
		previous[i  ] = pos.x;
		previous[i+1] = pos.y;
		previous[i+2] = pos.z;
		next[i  ] = pos.x;
		next[i+1] = pos.y;
		next[i+2] = pos.z;	
	}

	this.meshline.attributes.position.needsUpdate = true;
	this.meshline.attributes.previous.needsUpdate = true;
	this.meshline.attributes.next.needsUpdate = true;
}
