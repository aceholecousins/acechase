
var terrainVertexShader = `

	varying vec3 nml;
	varying vec3 pos;
	varying vec3 cam;
	varying vec2 vuv;

	void main() {
		pos = position;
		nml = normal;
		cam = cameraPosition;
		vuv = uv;

		gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
	}`;

// fragment shader using precomputed normal map with specular information in alpha channel
var terrainFragmentShader = `

	uniform vec3 lightvec;
	uniform vec2 terraindims;
	varying vec3 nml;
	varying vec3 pos;
	varying vec3 cam;
	uniform sampler2D diftex;
	uniform vec2 diftexrepeat;
	uniform sampler2D nmlspectex;
	uniform vec3 fogColor;
	uniform sampler2D distancetex;
	uniform vec3 waterColor;
	varying vec2 vuv;

	void main()	{

		vec3 light = normalize(lightvec); // direction TOWARDS light
		vec3 n = normalize(nml);

		//vuv.x = pos.x/terraindims.x+0.5;
		//vuv.y = pos.y/terraindims.y+0.5;

		vec2 distanceuv = vuv;
		if(terraindims.x > terraindims.y){distanceuv.y = vuv.y*terraindims.y/terraindims.x;} // TODO: do this computation in the vertex shader
		else{distanceuv.x = vuv.x*terraindims.x/terraindims.y;}

		// fog at terrain edge:
		float wFog = 0.0;
		if( vuv.x > 0.8 ){ wFog = (vuv.x-0.8)/0.2; }
		if( vuv.x < 0.2 ){ wFog = 1.0-vuv.x/0.2; }
		if( vuv.y > 0.8 ){ wFog+= (vuv.y-0.8)/0.2; }
		if( vuv.y < 0.2 ){ wFog+= 1.0-vuv.y/0.2; }
		/*if( vuv.x > 0.75 ){ wFog = (vuv.x-0.75)/0.05; }
		if( vuv.x < 0.25 ){ wFog = 1.0-(vuv.x-0.2)/0.05; }
		if( vuv.y > 0.75 ){ wFog+= (vuv.y-0.75)/0.05; }
		if( vuv.y < 0.25 ){ wFog+= 1.0-(vuv.y-0.2)/0.05; }*/
		if( wFog > 1.0 ){ wFog = 1.0; }
	
		// fog under water:
		vec4 hmap = texture2D(distancetex, distanceuv);
		float h = hmap.x*255.0 + hmap.y*255.0/256.0 + hmap.z*255.0/256.0/256.0 - 128.0;
		float wTurbid = 0.0;
		//if(h<0.0){wTurbid = 1.0-exp(1.4*h);}
		//if(wTurbid>1.0){wTurbid=1.0;}

		// determine new normal from bump map:

		vec4 nmlspec = texture2D( nmlspectex, vuv );
		vec3 texnml = nmlspec.xyz*2.0-1.0;

		// determine specularity:
		vec3 view = pos-cam;
		vec3 reflectedView = normalize(view - 2.0*dot(view, texnml)*texnml);
		float wSpecular = dot(reflectedView, light);
		float specStart = 0.96;
		float specFull = 0.98;
		if(wSpecular<specStart){wSpecular = 0.0;}
		else if(wSpecular>specFull){wSpecular = 1.0;}
		else{wSpecular = 0.5-0.5*cos((wSpecular-specStart)/(specFull-specStart)*3.1416);}
		wSpecular *= nmlspec.w;

		// mix colors:
		float wDif = dot(texnml, light)*0.5+0.5;
		vec4 cDif = texture2D( diftex, (vuv*diftexrepeat) );
		cDif.xyz *= wDif; // diffuse color
		
		vec4 cDifSpec = wSpecular*vec4(1.0,1.0,1.0,1.0) + (1.0-wSpecular)*cDif;

		vec4 cDifSpecFog = wFog*vec4(fogColor,1.0) + wTurbid*vec4(waterColor,1.0) + (1.0-wFog-wTurbid)*cDifSpec;

		gl_FragColor = cDifSpecFog;
		//gl_FragColor = hmap;

	}`;

var terrainNormalComputationShader = `

	uniform sampler2D distancetex;
	uniform float distancetexdim;
	uniform sampler2D bumptex;
	uniform float bumptexdim;
	uniform vec2 bumptexrepeat;
	uniform sampler2D spectex;
	uniform vec2 spectexrepeat;
	uniform float terraindim;

	void main() {
		vec2 cellSize = 1.0 / resolution.xy;
		vec2 uv = gl_FragCoord.xy * cellSize;

		float dhm = 8.0/distancetexdim;
		float dbm = 0.01/bumptexdim;

		vec4 buf = texture2D( distancetex, vec2(uv.x+dhm, uv.y) );
		float hE = buf.x*256.0 + buf.y + buf.z/256.0; // east neighbor pixel
		buf = texture2D( distancetex, vec2(uv.x-dhm, uv.y) );
		float hW = buf.x*256.0 + buf.y + buf.z/256.0; // west neighbor pixel
		buf = texture2D( distancetex, vec2(uv.x, uv.y+dhm) );
		float hN = buf.x*256.0 + buf.y + buf.z/256.0; // north neighbor pixel
		buf = texture2D( distancetex, vec2(uv.x, uv.y-dhm) );
		float hS = buf.x*256.0 + buf.y + buf.z/256.0; // south neighbor pixel

		vec3 hnml = normalize(vec3(
			-(hE-hW)/(2.0*dhm*terraindim),
			-(hN-hS)/(2.0*dhm*terraindim), // no minus cause image was flipped somewhere
			1.0));

		vec3 tangx = normalize(cross(vec3(0.0,1.0,0.0), hnml)); // tangent vectors along terrain surface (not orthogonal)
		vec3 tangy = normalize(cross(hnml, vec3(1.0,0.0,0.0)));

		vec3 tangx2 = normalize(cross(tangy, hnml));
		vec3 tangy2 = normalize(cross(hnml, tangx));

		// those should be orthogonal:
		vec3 tangx3 = normalize(tangx + tangx2);
		vec3 tangy3 = normalize(tangy + tangy2);

		buf = texture2D( bumptex, (vec2(uv.x+dbm, uv.y)*bumptexrepeat) );
		hE = buf.x; // east neighbor pixel
		buf = texture2D( bumptex, (vec2(uv.x-dbm, uv.y)*bumptexrepeat) );
		hW = buf.x; // west neighbor pixel
		buf = texture2D( bumptex, (vec2(uv.x, uv.y+dbm)*bumptexrepeat) );
		hN = buf.x; // north neighbor pixel
		buf = texture2D( bumptex, (vec2(uv.x, uv.y-dbm)*bumptexrepeat) );
		hS = buf.x; // south neighbor pixel

		vec3 bnml = normalize(vec3(
			-(hE-hW)/(2.0*dbm*terraindim),
			-(hN-hS)/(2.0*dbm*terraindim), // no minus cause image was flipped somewhere
			1.0));

		vec3 combinednml = normalize(hnml + bnml.x*tangx3 + bnml.y*tangy3);

		float spec = texture2D( spectex, (uv*spectexrepeat) ).x;

		gl_FragColor = vec4(combinednml*0.5+0.5, spec);
	}`;
