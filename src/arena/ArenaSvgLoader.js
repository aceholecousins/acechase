
// requires imglib

var ASL; // arena svg loader

function ArenaSvgLoader(filename, curvdpu, curvos, polydpu, polyos, callback){

// curv = curved paths, poly = cornered paths, dpu = dots per unit length, os = over sampling factor for generation (to avoid aliasing)

// when the loader is done, .domsvg, .curvdistancemap (array), .polydistancemap (array) and .polygons
// and the textures .diffstruct .nrmlstruct .bumpstruct .specstruct .overstruct can be used
// distance maps are positive on land and negative in water (like heightmaps)

	this.checklist = new Checklist();

	this.extractTex = function(id){ // since img.src=bla is asynchronous even with dataurls, we need this extra trouble
		this.checklist.addItem(id);

		var elem = this.domsvg.getElementById(id);
		if(elem == null){
			this.checklist.checkItem(id);
			return null;
		}

		var pos = new THREE.Vector4(elem.getAttribute('x'), elem.getAttribute('y'),
			elem.getAttribute('width'), elem.getAttribute('height'));
		var tfmtx = elem.getAttribute('transform');
		if(tfmtx == null){
			tfmtx = new THREE.Vector4(1,0,0,1);
		}
		else{
			tfmtx = tfmtx.replace("matrix(", "").replace(")","").split(',');
			tfmtx = new THREE.Vector4(tfmtx[0], tfmtx[1], tfmtx[2], tfmtx[3]);
		}
		var tfinv = new THREE.Vector4(tfmtx.w, -tfmtx.y, -tfmtx.z, tfmtx.x).multiplyScalar(1/(tfmtx.x*tfmtx.w - tfmtx.y*tfmtx.z));

		var url = elem.getAttribute('xlink:href');
		var img = new Image();
		var result = {tex:null, pos:pos, tfinv:tfinv};
		img.hresult = result; // handle so the texture can be assigned from inside the onload callback
		img.hcl = this.checklist;
		img.id = id;

		img.onload = function(){
			var tex = new THREE.Texture(img);
			tex.needsUpdate = true;
			tex.wrapS = THREE.RepeatWrapping;
			tex.wrapT = THREE.RepeatWrapping;
			this.hresult.tex = tex;
			this.hcl.checkItem(this.id);
		}
		img.src = url;

		return result; // result.tex will be assigned in the callback
	}

	new THREE.FileLoader().load(filename, function(rawsvg){

		rawsvg = rawsvg.replace('<?xml version="1.0" encoding="UTF-8" standalone="no"?>', '');

		var svgcontainer = document.createElement("p");
		svgcontainer.innerHTML = rawsvg;

		this.domsvg = svgcontainer.getElementsByTagName("svg")[0];

		this.svgw = this.domsvg.getAttribute("width");
		this.svgh = this.domsvg.getAttribute("height");

		var curvw = this.svgw * curvdpu * curvos;
		var curvh = this.svgh * curvdpu * curvos;
		this.curvdpu = curvdpu; // since we are inside a callback, it is strange that we can access curvdpu from the outside...

		var domoutline = this.domsvg.getElementById("outline");
		var domislands = this.domsvg.getElementById("islands");

		this.diffstruct = this.extractTex('diffusemap');
		this.nrmlstruct = this.extractTex('normalmap');
		this.bumpstruct = this.extractTex('bumpmap');
		this.specstruct = this.extractTex('specularmap');
		this.overstruct = this.extractTex('overlay');

		var tform = 'transform="scale(' + curvdpu * curvos + ',' + curvdpu * curvos + ')"';
			// svg origin is upper left, dunno what bit them

		var canvas = document.createElement("canvas");
		canvas.width = curvw;
		canvas.height = curvh;

		// generate SVG for curved distance map
		var rawboolsvg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + curvw + '" height="' + curvh + '" '
			+ 'style="background-color:white"><g ' + tform + '>'
			+ '<path style="fill:black" d="' + domoutline.getAttribute("d") + '"></path>';
		if(domislands != null){
			rawboolsvg += '<path style="fill:white" d="' + domislands.getAttribute("d") + '"></path>';
		}
		rawboolsvg += '</g></svg>';

		// draw into canvas
		var img = new Image();
		img.hasl = this; // Arena Svg Loader object handle
		this.checklist.addItem("curvdistancemap");

		img.onload = function(){
			canvas.getContext('2d').drawImage(this, 0, 0);

			// generate distance map
			var booleanImage = booleanImageFromCanvas(canvas, 128, false);
			var mapOutside = distanceFromBooleanImage(booleanImage, curvw, curvh, 'EDT');
			booleanImage = booleanImageFromCanvas(canvas, 128, true);
			var mapInside = distanceFromBooleanImage(booleanImage, curvw, curvh, 'EDT');

			// downsampling
			this.hasl.curvdistancemap = new Array(curvw/curvos * curvh/curvos).fill(0);

			var ix = 0;
			var iy = 0;
			var os = curvos * curvos * curvos * curvdpu; // oversampling in x and y and vertical correction

			for(var ipx=0; ipx<curvw*curvh; ipx++){
				ix = ipx % curvw;
				iy = Math.floor(ipx / curvw);
				ix = Math.floor(ix / curvos);
				iy = Math.floor(iy / curvos);

				if(mapInside[ipx]>mapOutside[ipx]){
					this.hasl.curvdistancemap[iy*curvw/curvos + ix] += -(mapInside[ipx]-0.5)/os;
				}
				else{
					this.hasl.curvdistancemap[iy*curvw/curvos + ix] += (mapOutside[ipx]-0.5)/os;
				}
			}

			this.hasl.checklist.checkItem("curvdistancemap");
		}
		img.src='data:image/svg+xml;base64,' + btoa(rawboolsvg);
		
		// read polygon data

		var commands = domoutline.getAttribute("d");
		if(domislands != null){
			commands += " " + domislands.getAttribute("d");
		}
		commands = commands.split(/(?=[MZLHVCSmzlhvcs])/);

		//console.log(commands)

		this.polygons=[];
		var j=0;
		var p=[];

		this.polygons[0]=[];
		for(var i=0; i<commands.length; i++){
			switch(commands[i].charAt(0)){
				case "M": case "L":
					p = commands[i].split(" ")[1].split(",");
					p[0]*=1; p[1]*=1; // string to number
					this.polygons[j].push(p); break;
				case "C":
					p = commands[i].split(" ")[3].split(",");
					p[0]*=1; p[1]*=1; // string to number
					this.polygons[j].push(p);
					commands[i] = "L " + commands[i].split(" ")[3]; // replace by line for physics distance map
					break;
				case "Z": case "z":
					var k = this.polygons[j].length-1;
					if(Math.abs(this.polygons[j][k][0]-this.polygons[j][0][0] < 0.001) &&
						Math.abs(this.polygons[j][k][1]-this.polygons[j][0][1] < 0.001)){
						// polygon is a closed ring (first point = last point) which confuses the physics engine
						// because it closes the polygon on its own, so remove last point
						this.polygons[j].pop();
					}
					this.polygons.push([]); j++; break;
				default:
					console.error("svg path command not supported: " + commands[i].charAt(0));
			}
		}
		this.polygons.pop(); // delete the last empty thing

		//console.log(commands.join(" "));

		var polyw = this.svgw * polydpu * polyos;
		var polyh = this.svgh * polydpu * polyos;
		this.polydpu = polydpu;

		// generate SVG for physics distance map
		tform = 'transform="scale(' + polydpu * polyos + ',' + polydpu * polyos + ')"';
		var rawboolsvg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + polyw + '" height="' + polyh + '" '
			+ 'style="background-color:white"><g ' + tform + '>'
			+ '<path style="fill:black; fill-rule:evenodd" d="' + commands.join(" ") + '"></path>';
		rawboolsvg += '</g></svg>';

		img = new Image();
		img.hasl = this; // Arena Svg Loader object handle
		this.checklist.addItem("polydistancemap");

		img.onload = function(){

			canvas.width = polyw;
			canvas.height = polyh;
			canvas.getContext('2d').drawImage(this, 0, 0);

			var booleanImage = booleanImageFromCanvas(canvas, 128, false);
			var mapOutside = distanceFromBooleanImage(booleanImage, polyw, polyh, 'EDT');
			booleanImage = booleanImageFromCanvas(canvas, 128, true);
			var mapInside = distanceFromBooleanImage(booleanImage, polyw, polyh, 'EDT');

			// downsampling
			this.hasl.polydistancemap = new Array(polyw/polyos * polyh/polyos).fill(0);

			var ix = 0;
			var iy = 0;
			var os = polyos * polyos * polydpu * polyos; // oversampling in x and y and vertical correction

			for(var ipx=0; ipx<polyw*polyh; ipx++){
				ix = ipx % polyw;
				iy = Math.floor(ipx / polyw);
				ix = Math.floor(ix / polyos);
				iy = Math.floor(iy / polyos);

				if(mapInside[ipx]>mapOutside[ipx]){
					this.hasl.polydistancemap[iy*polyw/polyos + ix] += -(mapInside[ipx]-0.5)/os;
				}
				else{
					this.hasl.polydistancemap[iy*polyw/polyos + ix] += (mapOutside[ipx]-0.5)/os;
				}
			}
			this.hasl.checklist.checkItem("polydistancemap");
		}
		img.src='data:image/svg+xml;base64,' + btoa(rawboolsvg);

		this.checklist.setCallback(callback);

	}.bind(this));

	this.getstyle = function(id, styleElement){
		var elem = this.domsvg.getElementById(id);
		if(elem == null){return null;}

		var dummydiv = document.createElement("div");
		dummydiv.style = elem.getAttribute("style");
		return dummydiv.style[styleElement];
	}

	this.getline = function(id){ // read start and end point of a line (startline, finishline, checkpoint, whatnot)
		var line = this.domsvg.getElementById(id).getAttribute("d"); // make sure this is "M x1,y1 L x2,y2"
		line = line.replaceAll(" ", "").replaceAll("M", "").split("L");
		var p0 = new THREE.Vector2().fromArray(line[0].split(","));
		p0.x-=MAP_WIDTH/2;
		p0.y=MAP_HEIGHT/2-p0.y;
		var p1 = new THREE.Vector2().fromArray(line[1].split(","));
		p1.x-=MAP_WIDTH/2;
		p1.y=MAP_HEIGHT/2-p1.y;
		return {p0:p0, p1:p1};
	}

}
