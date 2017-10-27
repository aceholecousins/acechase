

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

}

bufferLoader = new BufferLoader(
    AUDIO_CONTEXT, [
        'media/sound/phaser2.ogg',
        'media/sound/216277__rsilveira-88__synthesized-explosion-02.ogg',
	'media/sound/110393__soundscalpel-com__water-splash.ogg',
	'media/music/nutcracker.mp3'],
    soundsLoadedCallback);

bufferLoader.load();

function soundsLoadedCallback(bufferList) {

    SOUNDS.phaserShot = bufferList[0];
    SOUNDS.explosion = bufferList[1];
    SOUNDS.splash = bufferList[2];
    SOUNDS.background = bufferList[3];

    LOADING_LIST.checkItem('sounds');

    playSound(SOUNDS.background, MUSIC_VOLUME, 1.0, true);
}
