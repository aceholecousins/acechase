
function loadImage(url, onload){
	var pic = document.createElement("img");
	pic.onload = onload;
	pic.src = url;
	return pic;
}

function image2canvas(img){
	var canvas = document.createElement('canvas');
	canvas.width = img.width; canvas.height = img.height;
	var ctx = canvas.getContext('2d');	
	ctx.drawImage(img,0,0);
	//document.body.appendChild( canvas );
	return canvas;
}

function canvas2array(canvas){ // result.data contains array
	return canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
}

function image2array(img){ // result.data contains array
	return canvas2array(image2canvas(img));
}

function array2canvas(array, w, h){ // use var a = new Uint8ClampedArray(w*h*4); a[0], a[1] ... for the array
	var canvas = document.createElement('canvas');
	canvas.width = w; canvas.height = h;
	var ctx = canvas.getContext('2d');
	var imageData = ctx.createImageData(w, h);
	imageData.data.set(array);
	ctx.putImageData(imageData, 0, 0);
	return canvas;
}

function canvas2png(canvas){ // <a href="[dataurl]" download="image.png">download</a>
	return canvas.toDataURL("image/png");
}

function canvas2jpg(canvas, quality){ // quality=0..1  <a href="[dataurl]" download="image.png">download</a>
	return canvas.toDataURL("image/jpg", quality);
}

function canvas2image(canvas){
	var pic = document.createElement("img");
	pic.src = canvas.toDataUrl();
	return pic;
}

function canvas2texture(canvas){
	var tex = new THREE.Texture(canvas);
	tex.needsUpdate = true;
	return tex;
}

function image2texture(image){
	var tex = new THREE.Texture(image);
	tex.needsUpdate = true;
	return tex;
}

/*
loadImage("testtex.png", function(){
	var idata = image2array(this);
	var buf = new Uint8ClampedArray(idata.data.length);
	for(i=0; i<idata.data.length; i+=4){
		buf[i  ] = 255-idata.data[i];
		buf[i+1] = 255-idata.data[i+1];
		buf[i+2] = 255-idata.data[i+2];
		buf[i+3] = idata.data[i+3];
	}
	var canv = array2canvas(buf, this.width, this.height);
	document.body.appendChild(canv);
});
*/

function renderTexture(tex, renderer){
	var material = new THREE.MeshBasicMaterial( { map:tex } );

	var scene = new THREE.Scene();
	var camera = new THREE.PerspectiveCamera( 90, 1, 0.1, 10 );

	var geometry = new THREE.PlaneGeometry(2,2);
	var mesh = new THREE.Mesh( geometry, material );
	scene.add( mesh );

	camera.position.z = 1;

	var sizeBefore = renderer.getSize();
	renderer.setSize(tex.image.width, tex.image.height);
	renderer.render( scene, camera );
	renderer.setSize(sizeBefore.width, sizeBefore.height);
}

// TODO: DOESNT WORK
function texture2array(tex, renderer){
	var material = new THREE.MeshBasicMaterial( { map:tex } );

	var scene = new THREE.Scene();
	var camera = new THREE.PerspectiveCamera( 90, 1, 0.1, 10 );

	var geometry = new THREE.PlaneGeometry(2,2);
	var mesh = new THREE.Mesh( geometry, material );
	scene.add( mesh );

	camera.position.z = 1;

	var renderTarget = new THREE.WebGLRenderTarget(tex.image.width, tex.image.height);

	var sizeBefore = renderer.getSize();
	renderer.setSize(tex.image.width, tex.image.height);
	renderer.render( scene, camera, renderTarget );
	renderer.setSize(sizeBefore.width, sizeBefore.height);

	var buffer = new Uint8Array(tex.image.width * tex.image.height * 4);
	renderer.readRenderTargetPixels ( renderTarget, 0, 0, tex.image.width, tex.image.height, buffer );
	return buffer;
}

TextureGenerator = function(w, h, renderer, fragmentShader, uniforms){
	this.w = w;
	this.h = h;

	this.vertexShader = `
		varying vec3 vPosition;
		varying vec2 vUv;
		varying vec3 vNormal;
		varying vec3 vCameraPosition;
		void main()	{
			vPosition = position;
			vUv = uv;
			vNormal = normal;
			vCameraPosition = cameraPosition;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
	}`;

	this.shaderMaterial = new THREE.ShaderMaterial( {
		uniforms: uniforms,
		vertexShader: this.vertexShader,
		fragmentShader: fragmentShader
	} );

	this.renderTarget = new THREE.WebGLRenderTarget( w, h);

	this.scene = new THREE.Scene();
	this.camera = new THREE.PerspectiveCamera( 90, 1, 0.1, 10 );

	this.geometry = new THREE.PlaneGeometry(2,2);
	//this.resultMaterial = new THREE.MeshBasicMaterial( { map:this.renderTarget.texture } );
	this.mesh = new THREE.Mesh( this.geometry, this.shaderMaterial );
	this.scene.add( this.mesh );

	this.camera.position.z = 1;

	this.render = function(){
		var sizeBefore = renderer.getSize();
		renderer.setSize(this.w, this.h);
		renderer.render( this.scene, this.camera, this.renderTarget );
		renderer.setSize(sizeBefore.width, sizeBefore.height);
		return this.renderTarget.texture;
	}
}


