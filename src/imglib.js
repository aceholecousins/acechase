
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

function array2canvas(array, w, h){ // use new a = Uint8ClampedArray(length); a[0], a[1] ... for the array
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

// for canvas2texture or image2texture use:
// var tex = new Texture(source)
// tex.needsUpdate = true;

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


