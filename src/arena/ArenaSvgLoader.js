
// requires imglib

function ArenaSvgLoader(filename, gfxres, phxdpu, callback){
// gfxres describes the texture width (or height, whatever is bigger) for the graphical distance map (smooth paths)
// phxdpu describes the gfxres of the distance map for the physics engine in dots per unit length of the svg dims

// when the loader is done, .domsvg, .gfxdistancemap (canvas), .phxdistancemap (array) and .polygons can be used
// distance maps are positive on land and negative in water (like heightmaps)

	new THREE.FileLoader().load(filename, function(rawsvg){

		rawsvg = rawsvg.replace('<?xml version="1.0" encoding="UTF-8" standalone="no"?>', '');

		var svgcontainer = document.createElement("p");
		svgcontainer.innerHTML = rawsvg;

		this.domsvg = svgcontainer.getElementsByTagName("svg")[0];

		this.svgw = this.domsvg.getAttribute("width");
		this.svgh = this.domsvg.getAttribute("height");
		var resw;
		var resh;

		var domoutline = this.domsvg.getElementById("outline");
		var domislands = this.domsvg.getElementById("islands");

		var tform;
		var ppu; // pixel per unit length

		if(this.svgw>this.svgh){
			ppu = gfxres/this.svgw;
			resw = gfxres;
			resh = Math.pow(2.0, Math.ceil(Math.log2(this.svgh*ppu))); // next largest power of 2
			tform = 'transform="translate(0,' + (resh-this.svgh*ppu) + ') scale(' + ppu + ',' + ppu + ')"';
			// svg origin is upper left, dunno what bit them
		}
		else{
			ppu = gfxres/this.svgh;
			resh = gfxres;
			resw = Math.pow(2.0, Math.ceil(Math.log2(this.svgw*ppu))); // next largest power of 2
			tform = 'transform="scale(' + ppu + ',' + ppu + ')"';
		}

		var canvas = document.createElement("canvas");
		canvas.width = resw;
		canvas.height = resh;

		// generate SVG for graphics distance map
		var rawboolsvg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + resw + '" height="' + resh + '" '
			+ 'style="background-color:white"><g ' + tform + '>'
			+ '<path style="fill:black" d="' + domoutline.getAttribute("d") + '"></path>';
		if(domislands != null){
			rawboolsvg += '<path style="fill:white" d="' + domislands.getAttribute("d") + '"></path>';
		}
		rawboolsvg += '</g></svg>';

		var img = new Image();
		img.src='data:image/svg+xml;base64,' + btoa(rawboolsvg);
		canvas.getContext('2d').drawImage(img, 0, 0);

		var booleanImage = booleanImageFromCanvas(canvas, 128, false);
		var mapOutside = distanceFromBooleanImage(booleanImage, resw, resh, 'EDT');
		booleanImage = booleanImageFromCanvas(canvas, 128, true);
		var mapInside = distanceFromBooleanImage(booleanImage, resw, resh, 'EDT');
		distancemap = mapOutside;

		var u8ca = new Uint8ClampedArray(resw*resh*4);
		var d;
		for(var ipx=0; ipx<resw*resh; ipx++){
			if(mapInside[ipx]>mapOutside[ipx]){
				distancemap[ipx] = -mapInside[ipx];
			}
			d = distancemap[ipx]/ppu+128;
			if(d < 0){d = 0;}
			if(d >= 256){d = 256 * 0xffffff/0x1000000;}
			u8ca[4*ipx  ] = Math.floor(d); // red changes by 1 per unit coast distance, land at r >= 128
			d = (d-u8ca[4*ipx  ])*256;
			u8ca[4*ipx+1] = Math.floor(d); // green changes by 1 per 1/256 unit coast distance
			d = (d-u8ca[4*ipx+1])*256;
			u8ca[4*ipx+2] = Math.floor(d); // blue changes by 1 per 1/256^2 unit coast distance
			u8ca[4*ipx+3] = 255;
		}

		this.gfxdistancemap = array2canvas(u8ca, resw, resh);

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

		this.phxw = this.svgw*phxdpu;
		this.phxh = this.svgh*phxdpu;
		this.phxdpu = phxdpu;

		// generate SVG for physics distance map
		tform = 'transform="scale(' + phxdpu + ',' + phxdpu + ')"';
		var rawboolsvg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + this.svgw*phxdpu + '" height="' + this.svgh*phxdpu + '" '
			+ 'style="background-color:white"><g ' + tform + '>'
			+ '<path style="fill:black; fill-rule:evenodd" d="' + commands.join(" ") + '"></path>';
		rawboolsvg += '</g></svg>';

		img = new Image();
		img.src='data:image/svg+xml;base64,' + btoa(rawboolsvg);
		canvas.width = this.phxw;
		canvas.height = this.phxh;
		canvas.getContext('2d').drawImage(img, 0, 0);

		booleanImage = booleanImageFromCanvas(canvas, 128, false);
		mapOutside = distanceFromBooleanImage(booleanImage, this.phxw, this.phxh, 'EDT');
		booleanImage = booleanImageFromCanvas(canvas, 128, true);
		mapInside = distanceFromBooleanImage(booleanImage, this.phxw, this.phxh, 'EDT');
		distancemap = mapOutside;

		for(var ipx=0; ipx<this.phxw*this.phxh; ipx++){
			if(mapInside[ipx]>mapOutside[ipx]){
				distancemap[ipx] = -mapInside[ipx]/phxdpu;
			}
			else{
				distancemap[ipx] = mapOutside[ipx]/phxdpu;
			}
		}

		this.phxdistancemap = distancemap;

		//document.body.appendChild(canvas);

		/*u8ca = new Uint8ClampedArray(canvas.width*canvas.height*4);
		for(var ipx=0; ipx<canvas.width*canvas.height; ipx++){
			d = distancemap[ipx]+100;
			if(d < 0){d = 0;}
			if(d > 255){d = 255;}
			u8ca[4*ipx  ] = Math.floor(d);
			u8ca[4*ipx+1] = Math.floor(d);
			u8ca[4*ipx+2] = Math.floor(d);
			u8ca[4*ipx+3] = 255;
		}
		document.body.appendChild(array2canvas(u8ca, canvas.width, canvas.height))
*/

		callback(this);

	}.bind(this));

	this.gettex = function(id){
		var elem = this.domsvg.getElementById(id);
		if(elem == null){return undefined;}

		var url = elem.getAttribute('xlink:href');
		var xy = new THREE.Vector2(elem.getAttribute('x'), elem.getAttribute('y'));
		var dims = new THREE.Vector2(elem.getAttribute('width'), elem.getAttribute('height'));
		var tfmtx = elem.getAttribute('transform');
		if(tfmtx == null){
			tfmtx = new THREE.Vector4(1,0,0,1);
		}
		else{
			tfmtx = tfmtx.replace("matrix(", "").replace(")","").split(',');
			tfmtx = new THREE.Vector4(tfmtx[0], tfmtx[1], tfmtx[2], tfmtx[3]);
		}
		return {mapurl:url, pos:xy, dims:dims, tfmtx:tfmtx};
	}

	this.getstyle = function(id, styleElement){
		var elem = this.domsvg.getElementById(id);
		if(elem == null){return undefined;}

		var dummydiv = document.createElement("div");
		dummydiv.style = elem.getAttribute("style");
		return dummydiv.style[styleElement];
	}

}
