

window.AudioContext = window.AudioContext||window.webkitAudioContext;

var AUDIO_CONTEXT = new AudioContext();
LOADING_LIST.addItem('sounds');

var SOUNDS = {};

function playSound(buffer, volume, pitch, loop){

    var source = AUDIO_CONTEXT.createBufferSource();
    var gainNode = AUDIO_CONTEXT.createGain();

    source.buffer = buffer;
    source.loop = loop;

    source.connect(gainNode);
    gainNode.connect(AUDIO_CONTEXT.destination)

    source.playbackRate.value = pitch;
    gainNode.gain.value = volume;

    source.start(0);
	return source;
}

sfxBufferLoader = new BufferLoader(
    AUDIO_CONTEXT, [
        'media/sound/phaser2.ogg',
        'media/sound/216277__rsilveira-88__synthesized-explosion-02.ogg',
		'media/sound/110393__soundscalpel-com__water-splash.ogg'],
    sfxLoadedCallback);

sfxBufferLoader.load();

function sfxLoadedCallback(bufferList) {

    SOUNDS.phaserShot = bufferList[0];
    SOUNDS.explosion = bufferList[1];
    SOUNDS.splash = bufferList[2];

    LOADING_LIST.checkItem('sounds');

    playSound(SOUNDS.background, MUSIC_VOLUME, 1.0, true);
}

SOUNDTRACK_LIST = [
	'media/music/nutcracker.mp3',
	'media/music/Facing_Your_Nemesis.mp3',
	'media/music/Mission_A.mp3',
	'media/music/SectaInstrumental.ogg',
	'media/music/Basic_Metal_4.mp3',
	'media/music/Takeoff.mp3',
	'media/music/Industrial_Rage.mp3'];

SOUNDTRACK_PLAYING = false;
NEXT_SOUNDTRACK = undefined;
NEXT_SOUNDTRACK_READY = false;

function loadSoundtrack(file){
	console.log('loading next soundtrack: ' + file)
	soundtrackBufferLoader = new BufferLoader(AUDIO_CONTEXT, [file], function(bufferList){
		NEXT_SOUNDTRACK = bufferList[0];
		NEXT_SOUNDTRACK_READY = true;
		console.log('soundtrack ready')
	})
	soundtrackBufferLoader.load();
}

function manageSoundtrack(){
	
	if(!SOUNDTRACK_PLAYING && NEXT_SOUNDTRACK_READY){
		source = playSound(NEXT_SOUNDTRACK, MUSIC_VOLUME, 1.0, false);
		SOUNDTRACK_PLAYING = true;

		console.log('loading next soundtrack in ' + (NEXT_SOUNDTRACK.duration-60.0) + 's')

		setTimeout(function(){ // load another soundtrack 60 seconds before the next one is over
			loadSoundtrack(SOUNDTRACK_LIST[Math.floor(Math.random()*SOUNDTRACK_LIST.length)]);
		}, (NEXT_SOUNDTRACK.duration-60.0)*1000.0);

		NEXT_SOUNDTRACK = undefined;
		NEXT_SOUNDTRACK_READY = false;

		source.onended = function(){
			console.log('current soundtrack ended')
			SOUNDTRACK_PLAYING = false;
		}

	}
}

loadSoundtrack(SOUNDTRACK_LIST[Math.floor(Math.random()*SOUNDTRACK_LIST.length)]);
setInterval(manageSoundtrack, 1000);

