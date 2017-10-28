

window.AudioContext = window.AudioContext||window.webkitAudioContext;

var AUDIO_CONTEXT = new AudioContext();
LOADING_LIST.addItem('sounds');

var SOUNDS = {};

function playSound(buffer, volume, pitch, loop, offset=0.0){

    var source = AUDIO_CONTEXT.createBufferSource();
    var gainNode = AUDIO_CONTEXT.createGain();

    source.buffer = buffer;
    source.loop = loop;

    source.connect(gainNode);
    gainNode.connect(AUDIO_CONTEXT.destination)

    source.playbackRate.value = pitch;
    gainNode.gain.value = volume;

    source.start(0, offset);
	return {src:source, gn:gainNode};
}

sfxBufferLoader = new BufferLoader(
    AUDIO_CONTEXT, [
        'media/sound/phaser2.ogg',
        'media/sound/216277__rsilveira-88__synthesized-explosion-02.ogg',
		'media/sound/110393__soundscalpel-com__water-splash.ogg',
		'media/sound/thrust.ogg'],
    sfxLoadedCallback);

sfxBufferLoader.load();

function sfxLoadedCallback(bufferList) {

    SOUNDS.phaserShot = bufferList[0];
    SOUNDS.explosion = bufferList[1];
    SOUNDS.splash = bufferList[2];
	SOUNDS.thrust = bufferList[3];

    LOADING_LIST.checkItem('sounds');
}

SOUNDTRACK_LIST = [
	{file:'media/music/nutcracker.mp3',
	 attr:'S.Crack - Nutcracker',
	 link:'https://www.youtube.com/channel/UCokEuO_Y-1gjqVa0mhgcawA'},
	{file:'media/music/Facing_Your_Nemesis_lq.ogg',
	 attr:'TeknoAXE - Facing Your Nemesis',
	 link:'https://youtu.be/wewGsomVJNo'},
	{file:'media/music/Mission_A_lq.ogg',
	 attr:'TeknoAXE - Mission A',
	 link:'https://www.youtube.com/watch?v=6jSLv1VWaMc'},
	{file:'media/music/SectaInstrumental.ogg',
	 attr:'Secta Instrumental - CONTRA (David Fau)',
	 link:'https://www.youtube.com/watch?v=zhyrIt3l7hQ'},
	{file:'media/music/Basic_Metal_4_lq.ogg',
	 attr:'TeknoAXE - Basic Metal 4',
	 link:'https://www.youtube.com/watch?v=HaZzgw9aWc8'},
	{file:'media/music/Takeoff_lq.ogg',
	 attr:'Ethan Meixsell - Takeoff',
	 link:'https://youtu.be/dR4xIvrikQo'},
	{file:'media/music/Industrial_Rage_lq.ogg',
	 attr:'TeknoAXE - Industrial Rage',
	 link:'https://www.youtube.com/watch?v=m6kJWnI3Uo8'}];

SOUNDTRACK_PLAYING = false;
NEXT_SOUNDTRACK = SOUNDTRACK_LIST[Math.floor(Math.random()*SOUNDTRACK_LIST.length)];
NEXT_SOUNDTRACK_BUFFER = undefined;
NEXT_SOUNDTRACK_READY = false;

function loadNextSoundtrack(){
	file = NEXT_SOUNDTRACK.file;
	console.log('loading next soundtrack: ' + file)
	soundtrackBufferLoader = new BufferLoader(AUDIO_CONTEXT, [file], function(bufferList){
		NEXT_SOUNDTRACK_BUFFER = bufferList[0];
		NEXT_SOUNDTRACK_READY = true;
		console.log('soundtrack ready')
	})
	soundtrackBufferLoader.load();
}

function manageSoundtrack(){
	
	if(!SOUNDTRACK_PLAYING && NEXT_SOUNDTRACK_READY){
		nodes = playSound(NEXT_SOUNDTRACK_BUFFER, MUSIC_VOLUME, 1.0, false);
		SOUNDTRACK_PLAYING = true;

		ATTRIBUTION_DIV.innerHTML = "<a style='color:#EEFFAA' target='_blank' href='" + 
			NEXT_SOUNDTRACK.link + "'>&sung; " + NEXT_SOUNDTRACK.attr + " &sung;</a>";
		ATTRIBUTION_DIV.style.visibility = "visible";

		setTimeout(function(){ATTRIBUTION_DIV.style.visibility = "hidden";}, 7500);

		console.log('loading next soundtrack in ' + (NEXT_SOUNDTRACK_BUFFER.duration-60.0) + 's')

		setTimeout(loadNextSoundtrack, (NEXT_SOUNDTRACK_BUFFER.duration-60.0)*1000.0);

		NEXT_SOUNDTRACK = SOUNDTRACK_LIST[Math.floor(Math.random()*SOUNDTRACK_LIST.length)];
		NEXT_SOUNDTRACK_BUFFER = undefined;
		NEXT_SOUNDTRACK_READY = false;

		nodes.src.onended = function(){
			console.log('current soundtrack ended')
			SOUNDTRACK_PLAYING = false;
		}

	}
}

if(MUSIC_VOLUME > 0.0) {
	loadNextSoundtrack();
	setInterval(manageSoundtrack, 1000);
}

ATTRIBUTION_DIV = document.createElement("div")
ATTRIBUTION_DIV.style.position = "absolute";
ATTRIBUTION_DIV.style.top = "90%";
ATTRIBUTION_DIV.style.left = "5%";
ATTRIBUTION_DIV.style.width = "90%";
ATTRIBUTION_DIV.style.padding = "10px";
ATTRIBUTION_DIV.style.textAlign = "center";
ATTRIBUTION_DIV.style.backgroundColor = "rgba(30,30,30,0.8)";
ATTRIBUTION_DIV.style.fontSize = "18pt";
ATTRIBUTION_DIV.style.fontFamily = "monospace";
ATTRIBUTION_DIV.style.visibility = "hidden";

document.body.appendChild(ATTRIBUTION_DIV)

