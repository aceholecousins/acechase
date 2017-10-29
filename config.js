
var GAME_MODE = "D"; // R for race, T for time trial, D for deathmatch, X for shooting range
var GAME_LEVEL = 0; // for different levels of the same game mode

var MAP = 'maps/islandisle.svg';

var HOVER_RADIUS = 0.4;
var HOVER_THRUST = 17.0;
var HITPOINTS = 10;
var SHIELD = 6;
var SHIELD_REGEN = 1;

var PHASER_LENGTH = 0.8;
var PHASER_AMMO = 30;
var PHASER_SPEED = 30;
var PHASER_FIRE_RATE = 12;
var PHASER_REGEN = 10;
var PHASER_TURN = 0.7; // angular velocity for homing phasers

var MISSILE_THRUST = 100;
var MISSILE_DAMPING = 0.98;
var MISSILE_TURN = 3.5;
var MISSILE_DAMAGE = SHIELD + HITPOINTS/2;
var MISSILE_HITPOINTS = 3;

var SEAMINE_DAMAGE = SHIELD + HITPOINTS/2;

var ADRENALINE_BOOST = 1.6; // increases fire rate, phaser speed and thrust when green powerup collected

var LAPS = 3;

var AVG_SECONDS_BETWEEN_POWERUPS = 5;
var PUBOX_HITPOINTS = 7;
var PUBOX_LIMIT = 3;
var PUBOX_SIZE = 1.2; //1.0

var MUSIC_VOLUME = 0.2;
var RESOLUTION = 1;

var RESPAWN_TIME = 3;
var ROUND_TIME = 40;
var PAUSE_TIME = 10;

var TERRAIN_BUMP_MAPPING = false;
var FANCY_WATER = true;

var DEBUG = 0; // debug level
