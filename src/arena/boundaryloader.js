
// requires imglib

var BOUNDARY_LOADER;

// when the loader is done, the following members are available:
// domsvg
// waterStencil (array)
// physicsDistanceMap (array)
// polygons

// distance maps are positive on land and negative in water (like heightmaps)

function BoundaryLoader(filename, waterStencilDpu, waterStencilOs, collisionBoundsDpu, collisionBoundsOs, callback){

// dpu = dots per unit length
// os = over sampling factor for generation (for anti alias)

	this.checklist = new Checklist();

	new THREE.FileLoader().load(filename, function(rawsvg){

		rawsvg = rawsvg.replace('<?xml version="1.0" encoding="UTF-8" standalone="no"?>', '');

		var svgcontainer = document.createElement("p");
		svgcontainer.innerHTML = rawsvg;

		this.domsvg = svgcontainer.getElementsByTagName("svg")[0];

		var dommapconfig = this.domsvg.getElementById("config");
		if(dommapconfig != null){
			mapconfig = JSON.parse(dommapconfig.textContent)
			for (var prop in mapconfig) {
				if (Object.prototype.hasOwnProperty.call(mapconfig, prop)) {
					window[prop] = mapconfig[prop]
				}
			}
		}

		this.wSvg = this.domsvg.getAttribute("width");
		this.hSvg = this.domsvg.getAttribute("height");

		var wStencil = this.wSvg * waterStencilDpu * waterStencilOs;
		var hStencil = this.hSvg * waterStencilDpu * waterStencilOs;
		this.waterStencilDpu = waterStencilDpu;

		var domoutline = this.domsvg.getElementById("outline");
		var domislands = this.domsvg.getElementById("islands");

		var tform = 'transform="scale(' + waterStencilDpu * waterStencilOs + ',' + waterStencilDpu * waterStencilOs + ')"';
			// svg origin is upper left, dunno what bit them

		var canvas = document.createElement("canvas");
		canvas.width = wStencil;
		canvas.height = hStencil;

		// generate water stencil

		var rawboolsvg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + wStencil + '" height="' + hStencil + '" '
			+ 'style="background-color:white"><g ' + tform + '>'
			+ '<path style="fill:black" d="' + domoutline.getAttribute("d") + '"></path>';
		if(domislands != null){
			rawboolsvg += '<path style="fill:white" d="' + domislands.getAttribute("d") + '"></path>';
		}
		rawboolsvg += '</g></svg>';

		// draw into canvas
		var imgStencil = new Image();
		imgStencil.hBoundaryLoader = this; // Boundary Loader object handle
		this.checklist.addItem("waterStencil");

		imgStencil.onload = function(){
			canvas.getContext('2d').drawImage(this, 0, 0);
			this.hBoundaryLoader.waterStencil = booleanImageFromCanvas(canvas, 128, false);
			this.hBoundaryLoader.checklist.checkItem("waterStencil");
		}
		imgStencil.src='data:image/svg+xml;base64,' + btoa(rawboolsvg);



		// generate physics distance map

		// read polygon data
		var commands = domoutline.getAttribute("d");
		if(domislands != null){
			commands += " " + domislands.getAttribute("d");
		}
		commands = commands.split(/(?=[MZLHVCSmzlhvcs])/);

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
				case "H":
					p = [commands[i].split(" ")[1] * 1, p[1]]
					this.polygons[j].push(p);
					break;
				case "V":
					p = [p[0], commands[i].split(" ")[1] * 1]
					this.polygons[j].push(p);
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

		var polyw = this.wSvg * collisionBoundsDpu * collisionBoundsOs;
		var polyh = this.hSvg * collisionBoundsDpu * collisionBoundsOs;
		this.collisionBoundsDpu = collisionBoundsDpu;

		// generate SVG for physics distance map
		tform = 'transform="scale(' + collisionBoundsDpu * collisionBoundsOs + ',' + collisionBoundsDpu * collisionBoundsOs + ')"';
		var rawboolsvg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + polyw + '" height="' + polyh + '" '
			+ 'style="background-color:white"><g ' + tform + '>'
			+ '<path style="fill:black; fill-rule:evenodd" d="' + commands.join(" ") + '"></path>';
		rawboolsvg += '</g></svg>';

		imgPhysics = new Image();
		imgPhysics.hBoundaryLoader = this; // handle
		this.checklist.addItem("physicsDistanceMap");

		imgPhysics.onload = function(){

			canvas.width = polyw;
			canvas.height = polyh;
			canvas.getContext('2d').drawImage(this, 0, 0);

			var booleanImage = booleanImageFromCanvas(canvas, 128, false);
			var mapOutside = distanceFromBooleanImage(booleanImage, polyw, polyh, 'EDT');
			booleanImage = booleanImageFromCanvas(canvas, 128, true);
			var mapInside = distanceFromBooleanImage(booleanImage, polyw, polyh, 'EDT');

			// downsampling
			this.hBoundaryLoader.physicsDistanceMap = new Array(polyw/collisionBoundsOs * polyh/collisionBoundsOs).fill(0);

			var ix = 0;
			var iy = 0;
			var os = collisionBoundsOs * collisionBoundsOs * collisionBoundsDpu * collisionBoundsOs; // oversampling in x and y and vertical correction

			for(var ipx=0; ipx<polyw*polyh; ipx++){
				ix = ipx % polyw;
				iy = Math.floor(ipx / polyw);
				ix = Math.floor(ix / collisionBoundsOs);
				iy = Math.floor(iy / collisionBoundsOs);

				if(mapInside[ipx]>mapOutside[ipx]){
					this.hBoundaryLoader.physicsDistanceMap[iy*polyw/collisionBoundsOs + ix] += -(mapInside[ipx]-0.5)/os;
				}
				else{
					this.hBoundaryLoader.physicsDistanceMap[iy*polyw/collisionBoundsOs + ix] += (mapOutside[ipx]-0.5)/os;
				}
			}
			this.hBoundaryLoader.checklist.checkItem("physicsDistanceMap");
		}
		imgPhysics.src='data:image/svg+xml;base64,' + btoa(rawboolsvg);

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
