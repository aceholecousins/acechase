
function ScoreTable(){ // use .prepare to prepare and .line to add lines and add .plane to the scene

	this.canvas = document.createElement("canvas");
	this.canvas.width = this.canvas.height = 1024;
	this.ctx = this.canvas.getContext("2d");

	this.iline = 0;
	this.widths = [300,200,200,200];
	this.spaces = [20,20,20,20,20];
	this.aligns = ["c","r","r","r"];
	this.lineHeight = 64;
	this.yoffset = 0;
	this.bgimg = document.createElement("img");
	this.bgimg.src = "media/images/scorebg.jpg";

	this.tex = new THREE.Texture(this.canvas);
	this.planegeo = new THREE.PlaneGeometry(2,2,1,1);
	this.planemat = new THREE.ShaderMaterial( {
		uniforms: {
			tex:{type:'t', value:this.tex}, 
			dims:{type:'v2', value: new THREE.Vector2(0.9*0.75,0.9)}
		},
		vertexShader: `
			varying vec2 vUv;
			uniform vec2 dims;
			void main(){
				vUv = uv;
				gl_Position = vec4( position.xy * dims, 1.0, 1.0 );
			}`,

		fragmentShader: `
			varying vec2 vUv;
			uniform sampler2D tex;
			void main(){
				gl_FragColor = texture2D(tex, vUv);
			}`
	} );
	this.plane = new THREE.Mesh(this.planegeo, this.planemat);
	this.plane.material.depthTest = false;
	this.plane.material.depthWrite = false;
	this.plane.material.transparent = true;
	this.plane.renderOrder = 10000000;

	this.clear = function(){
		this.ctx.scale(2,2);
		this.ctx.drawImage(this.bgimg,0,0);
		this.ctx.setTransform(1, 0, 0, 1, 0, 0);
		this.iline = 0;
	}

	// prepare font size and y offset for an amount of lines and stuff
	this.prepare = function(numlines, widths, spaces, aligns){
		var h = this.canvas.height;
		var w = this.canvas.width;
		this.lineHeight = 64;

		this.widths = [];
		this.spaces = [];

		var totalwidth = 0;
		for(i=0; i<widths.length; i++){totalwidth += widths[i];}
		for(i=0; i<spaces.length; i++){totalwidth += spaces[i];}
		for(i=0; i<widths.length; i++){this.widths[i] = widths[i]*w/totalwidth;}
		for(i=0; i<spaces.length; i++){this.spaces[i] = spaces[i]*w/totalwidth;}

		this.aligns = aligns;

		if(numlines > h/this.lineHeight){
			this.lineHeight = h/numlines;
		}
		this.ctx.font = "bold " + this.lineHeight*0.6 + "px monospace";

		this.yoffset = (h - this.lineHeight*numlines)/2;
		this.clear();

	}

	this.line = function(txt, color){
		var left = 0;

		var cdark = color.clone().lerp(new THREE.Color("black"), 0.6);

		this.ctx.lineJoin="round";
		this.ctx.textBaseline="middle"; 

		for(i=0; i<this.widths.length; i++){
			var textw = this.ctx.measureText(txt[i]).width;
			var anchorx = left+this.spaces[i];
			var anchory = this.yoffset + (this.iline+0.5)*this.lineHeight;

			if(this.aligns[i] == "l"){
				this.ctx.textAlign = "left";
			}
			if(this.aligns[i] == "r"){
				this.ctx.textAlign = "right";
				anchorx += this.widths[i];
			}
			if(this.aligns[i] == "c"){
				this.ctx.textAlign = "center";
				anchorx += this.widths[i]/2;
			}

			if(textw > this.widths[i]){
				var s = this.widths[i]/textw;
				this.ctx.scale(s,s);
				anchorx /= s;
				anchory /= s;
			}

			this.ctx.lineWidth = 13;	
			this.ctx.filter = "blur(3px)";
			this.ctx.strokeStyle = color.getStyle();
			this.ctx.strokeText(txt[i], anchorx, anchory);

			this.ctx.lineWidth = 8;	
			this.ctx.filter = "none";
			this.ctx.strokeStyle = "white";
			this.ctx.strokeText(txt[i], anchorx, anchory);

			this.ctx.filter = "none";
			this.ctx.fillStyle = cdark.getStyle();
			this.ctx.fillText  (txt[i], anchorx, anchory);
			left += this.spaces[i] + this.widths[i];

			this.ctx.setTransform(1, 0, 0, 1, 0, 0);
		}
		this.iline++;
		this.tex.needsUpdate = true;
	}
}

