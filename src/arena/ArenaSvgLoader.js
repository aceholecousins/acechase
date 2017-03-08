
// requires imglib

function ArenaSvgLoader(filename, curvdpu, curvos, polydpu, polyos, callback){

// curv = curved paths, poly = cornered paths, dpu = dots per unit length, os = over sampling factor for generation (to avoid aliasing)

// when the loader is done, .domsvg, .curvdistancemap (array), .polydistancemap (array) and .polygons can be used
// distance maps are positive on land and negative in water (like heightmaps)

	new THREE.FileLoader().load(filename, function(rawsvg){

		rawsvg = rawsvg.replace('<?xml version="1.0" encoding="UTF-8" standalone="no"?>', '');

		var svgcontainer = document.createElement("p");
		svgcontainer.innerHTML = rawsvg;

		this.domsvg = svgcontainer.getElementsByTagName("svg")[0];

		this.svgw = this.domsvg.getAttribute("width");
		this.svgh = this.domsvg.getAttribute("height");

		var curvw = this.svgw * curvdpu * curvos;
		var curvh = this.svgh * curvdpu * curvos;
		this.curvdpu = curvdpu;

		var domoutline = this.domsvg.getElementById("outline");
		var domislands = this.domsvg.getElementById("islands");

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
		img.src='data:image/svg+xml;base64,' + btoa(rawboolsvg);
		canvas.getContext('2d').drawImage(img, 0, 0);

		// generate distance map
		var booleanImage = booleanImageFromCanvas(canvas, 128, false);
		var mapOutside = distanceFromBooleanImage(booleanImage, curvw, curvh, 'EDT');
		booleanImage = booleanImageFromCanvas(canvas, 128, true);
		var mapInside = distanceFromBooleanImage(booleanImage, curvw, curvh, 'EDT');

		// downsampling
		this.curvdistancemap = new Array(curvw/curvos * curvh/curvos).fill(0);

		var ix = 0;
		var iy = 0;
		var os4 = curvos*curvos*curvos*curvos;

		for(var ipx=0; ipx<curvw*curvh; ipx++){
			ix = ipx % curvw;
			iy = Math.floor(ipx / curvw);
			ix = Math.floor(ix / curvos);
			iy = Math.floor(iy / curvos);

			if(mapInside[ipx]>mapOutside[ipx]){
				this.curvdistancemap[iy*curvw/curvos + ix] += -mapInside[ipx]/os4;
			}
			else{
				this.curvdistancemap[iy*curvw/curvos + ix] += mapOutside[ipx]/os4;
			}
		}


		// read polygon data

		var commands = domoutline.getAttribute("d");
		if(domislands != null){
			commands += domislands.getAttribute("d");
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
		img.src='data:image/svg+xml;base64,' + btoa(rawboolsvg);
		canvas.width = polyw;
		canvas.height = polyh;
		canvas.getContext('2d').drawImage(img, 0, 0);

		booleanImage = booleanImageFromCanvas(canvas, 128, false);
		mapOutside = distanceFromBooleanImage(booleanImage, polyw, polyh, 'EDT');
		booleanImage = booleanImageFromCanvas(canvas, 128, true);
		mapInside = distanceFromBooleanImage(booleanImage, polyw, polyh, 'EDT');

		// downsampling
		this.polydistancemap = new Array(polyw/polyos * polyh/polyos).fill(0);

		ix = 0;
		iy = 0;
		os4 = polyos*polyos*polyos*polyos;

		for(var ipx=0; ipx<polyw*polyh; ipx++){
			ix = ipx % polyw;
			iy = Math.floor(ipx / polyw);
			ix = Math.floor(ix / polyos);
			iy = Math.floor(iy / polyos);

			if(mapInside[ipx]>mapOutside[ipx]){
				this.polydistancemap[iy*polyw/polyos + ix] += -mapInside[ipx]/os4;
			}
			else{
				this.polydistancemap[iy*polyw/polyos + ix] += mapOutside[ipx]/os4;
			}
		}

		callback(this);

	}.bind(this));

	this.gettex = function(id){
		var elem = this.domsvg.getElementById(id);
		if(elem == null){return null;}

		var url = elem.getAttribute('xlink:href');
		var img = new Image();
		img.src = url;
		var tex = new THREE.Texture(img);
		tex.needsUpdate = true;
		tex.wrapS = THREE.RepeatWrapping;
		tex.wrapT = THREE.RepeatWrapping;
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
		return {tex:tex, pos:pos, tfinv:tfinv};
	}

	this.getstyle = function(id, styleElement){
		var elem = this.domsvg.getElementById(id);
		if(elem == null){return null;}

		var dummydiv = document.createElement("div");
		dummydiv.style = elem.getAttribute("style");
		return dummydiv.style[styleElement];
	}

}
