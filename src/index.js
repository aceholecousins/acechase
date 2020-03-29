var SINGLEMULTI = 0; // 1 for single, 2 for multiplayer
var MAP0 = ""; // selected singleplayer level
var GAME0 = ""; // selected singleplayer game mode

/////////////////////////
// HTML for one player //
/////////////////////////

var playerDisplayTemplate = document.getElementById("playerDisplayTemplate").innerHTML;

//////////////////////////
// strings for dropdown //
//////////////////////////

//http://htmlcolorcodes.com/color-names/
var colors = ["white", "snow", "honeydew", "mintcream", "azure", "aliceblue", "ghostwhite", "whitesmoke", "seashell", "beige", "oldlace", "floralwhite", "ivory", "antiquewhite", "linen", "lavenderblush", "mistyrose", "gold", "yellow", "lightyellow", "lemonchiffon", "lightgoldenrodyellow", "papayawhip", "moccasin", "peachpuff", "palegoldenrod", "khaki", "darkkhaki", "lightsalmon", "coral", "tomato", "orangered", "darkorange", "orange", "indianred", "lightcoral", "salmon", "darksalmon", "lightsalmon", "crimson", "red", "firebrick", "darkred", "pink", "lightpink", "hotpink", "deeppink", "mediumvioletred", "palevioletred", "lavender", "thistle", "plum", "violet", "orchid", "fuchsia", "magenta", "mediumorchid", "mediumpurple", "rebeccapurple", "blueviolet", "darkviolet", "darkorchid", "darkmagenta", "purple", "indigo", "slateblue", "darkslateblue", "mediumslateblue", "aqua", "cyan", "lightcyan", "paleturquoise", "aquamarine", "turquoise", "mediumturquoise", "darkturquoise", "cadetblue", "steelblue", "lightsteelblue", "powderblue", "lightblue", "skyblue", "lightskyblue", "deepskyblue", "dodgerblue", "cornflowerblue", "mediumslateblue", "royalblue", "blue", "mediumblue", "darkblue", "navy", "midnightblue", "greenyellow", "chartreuse", "lawngreen", "lime", "limegreen", "palegreen", "lightgreen", "mediumspringgreen", "springgreen", "mediumseagreen", "seagreen", "forestgreen", "green", "darkgreen", "yellowgreen", "olivedrab", "olive", "darkolivegreen", "mediumaquamarine", "darkseagreen", "lightseagreen", "darkcyan", "teal", "cornsilk", "blanchedalmond", "bisque", "navajowhite", "wheat", "burlywood", "tan", "rosybrown", "sandybrown", "goldenrod", "darkgoldenrod", "peru", "chocolate", "saddlebrown", "sienna", "brown", "maroon", "gainsboro", "lightgray", "silver", "darkgray", "gray", "dimgray", "lightslategray", "slategray", "darkslategray", "black"];

//http://skinnyms.com/50-super-foods-the-ultimate-shopping-list/
//http://bembu.com/healthy-spices-and-herbs
//https://en.wikipedia.org/wiki/List_of_micronutrients
//http://www.sixwise.com/newsletters/05/07/27/the-15-healthiest-berries-you-could-possibly-eat--including-7-most-havent-heard-of.htm
//http://www.livestrong.com/slideshow/1009507-9-healthiest-nuts-that-may-live-longer/
var names = ["Almond", "Apple", "Apricot", "Artichoke", "Asparagus", "Avocado", "Banana", "Bean", "Lentil", "Beet", "BellPepper", "Broccoli", "B-Sprout", "Cabbage", "Cantaloupe", "Carrot", "Cauliflower", "Cherry", "Chia", "Coconut", "DarkChocolate", "Flax", "Garlic", "Grape", "HotPepper", "Kale", "Kiwi", "Lemon", "Lime", "Mango", "Mushroom", "Oat", "Olive", "Orange", "Papaya", "Peach", "Pineapple", "Pumpkin", "Pomegranate", "Quinoa", "Spinach", "Spirulina", "Sprout", "SweetPotato", "SwissChard", "Tomato", "Walnut", "Turmeric", "Rosemary", "Basil", "Cumin", "Nutmeg", "Saffron", "Ginseng", "Cardamom", "Curry", "Thyme", "Cay-N-Pepper", "LicoriceRoot", "Oregano", "Cilantro", "Lavender", "Sage", "Ginger", "Cinnamon", "Parsley", "Fennel", "Boron", "Calcium", "Cobalt", "Chloride", "Chromium", "Copper", "Fluoride", "Iodine", "Iron", "Lithium", "Magnesium", "Manganese", "Molybdenum", "Phosphorus", "Potassium", "Selenium", "Sodium", "Sulfur", "Zinc", "Thiamin", "Riboflavin", "Niacin", "PantothenicAcid", "Pyridoxine", "Pyridoxal", "Pyridoxamine", "Biotin", "ErgadenylicAcid", "FolicAcid", "Cyanocobalamin", "Choline", "Retinol", "AscorbicAcid", "VitaminD", "Tocopherol", "VitaminK", "AlphaCarotene", "BetaCarotene", "Cryptoxanthin", "Lutein", "Lycopene", "Zeaxanthin", "Blueberry", "Strawberry", "Bilberry", "Blackberry", "Elderberry", "GojiBerry", "Lingonberry", "Cranberry", "Raspberry", "Dewberry", "Mulberry", "Gooseberry", "Huckleberry", "Chokeberry", "Pecan", "Pistachio", "Hazelnut", "Cashew", "Macadamia", "BrazilNut", "Peanut"];
names = names.sort();

var axespm = ["-/+ Axis 0", "+/- Axis 0", "-/+ Axis 1", "+/- Axis 1", "-/+ Axis 2", "+/- Axis 2", "-/+ Axis 3", "+/- Axis 3", "-/+ Axis 4", "+/- Axis 4", "-/+ Axis 5", "+/- Axis 5"];
var axeshalf = ["- Axis 0", "+ Axis 0", "- Axis 1", "+ Axis 1", "- Axis 2", "+ Axis 2", "- Axis 3", "+ Axis 3", "- Axis 4", "+ Axis 4", "- Axis 5", "+ Axis 5"];
var axcode = ["a+0", "a-0", "a+1", "a-1", "a+2", "a-2", "a+3", "a-3", "a+4", "a-4", "a+5", "a-5"]
var buttons = [];
var butcode = [];
for(var i=0; i<20; i++){buttons.push("Button "+i);}
for(var i=0; i<10; i++){butcode.push("b0"+i);}
for(var i=10; i<20; i++){butcode.push("b"+i);}

//https://github.com/wesbos/keycodes
var keyNames={3:"break", 8:"backspace", 9:"tab", 12:'clear',13:"enter", 16:"shift", 17:"ctrl", 18:"alt", 19:"pause", 20:"caps", 27:"esc", 32:"space", 33:"pgup", 34:"pgdn", 35:"end", 36:"home", 37:"left", 38:"up", 39:"right", 40:"down", 41:"select", 42:"print", 43:"exec", 44:"Print", 45:"insert", 46:"delete", 48:"0", 49:"1", 50:"2", 51:"3", 52:"4", 53:"5", 54:"6", 55:"7", 56:"8", 57:"9", 58:":", 59:";/=", 60:"<", 61:"=", 63:"ß", 64:"@", 65:"a", 66:"b", 67:"c", 68:"d", 69:"e", 70:"f", 71:"g", 72:"h", 73:"i", 74:"j", 75:"k", 76:"l", 77:"m", 78:"n", 79:"o", 80:"p", 81:"q", 82:"r", 83:"s", 84:"t", 85:"u", 86:"v", 87:"w", 88:"x", 89:"y", 90:"z", 96:"num0", 97:"num1", 98:"num2", 99:"num3", 100:"num4", 101:"num5", 102:"num6", 103:"num7", 104:"num8", 105:"num9", 106:"numx", 107:"num+", 108:"num.", 109:"num-", 110:"num,", 111:"num:", 112:"f1", 113:"f2", 114:"f3", 115:"f4", 116:"f5", 117:"f6", 118:"f7", 119:"f8", 120:"f9", 121:"f10", 122:"f11", 123:"f12", 124:"f13", 125:"f14", 126:"f15", 127:"f16", 128:"f17", 129:"f18", 130:"f19", 131:"f20", 132:"f21", 133:"f22", 134:"f23", 135:"f24", 144:"numlock", 145:"scrolllock", 160:"^", 161:'!',163:"#", 164:'$',165:'ù',170:'*',171:"~+*key", 186:";/ñ", 187:"=", 188:",", 189:"-", 190:".", 191:"//ç", 192:"`/ñ/æ", 193:"?,/°", 194:"num.", 219:"(", 220:"\\", 221:")", 222:"'/ø", 223:"`", 225:"altgr", 226:"</>", 231:"ç"};

String.prototype.replaceAll = function(search, replacement){var target = this; return target.split(search).join(replacement);};

////////////////
// add player //
////////////////

var mplayerIndex = 1; // index 0 is for single player

ADDPLAYER_BLINK = false;
BLINK_ON = true;
setInterval(function(){
	if(ADDPLAYER_BLINK){
		BLINK_ON = !BLINK_ON;
		if(BLINK_ON){get("addplayerbutton").style.boxShadow = '0px 0px 10px 4px #ff4000';}
		else{get("addplayerbutton").style.boxShadow = '';}
	}
}, 300);

function addPlayer(multiplayer){
	var playerIndex;

	if(multiplayer){playerIndex = mplayerIndex;}
	else{playerIndex = 0;}

	var p = make("p");
	p.id = "playerbox_" + playerIndex;

	if(multiplayer){
		get("mpdisparea").insertBefore(p, get("mpdisparea").childNodes[0]);
	}
	else{
		get("spdisparea").appendChild(p);
	}

	var html = playerDisplayTemplate.replaceAll("0000", playerIndex);
	p.innerHTML = html;

	for(var i=0; i<colors.length; i++){
		opt = make("option");
		opt.appendChild(txt(colors[i]));
		opt.style.backgroundColor = colors[i];
		get("color_" + playerIndex).appendChild(opt);
	}
	var c = get("color_" + playerIndex);
	c.selectedIndex = randint(colors.length);
	get("picbg_" + playerIndex).style.backgroundColor = c.value;
	get("name_" + playerIndex).value = names[randint(names.length)];

	ctlSelect(playerIndex, "kb");

	get("gpidx_" + playerIndex).dataset.code = playerIndex;
	get("gpidx_" + playerIndex).innerHTML = playerIndex;
	GamepadManager.fillButtonText(get("gplr_" + playerIndex), 'a+0');
	GamepadManager.fillButtonText(get("gpud_" + playerIndex), 'a-1');
	GamepadManager.fillButtonText(get("gpthrust_" + playerIndex), 'b07');
	GamepadManager.fillButtonText(get("gpfire_" + playerIndex), 'b00');
	GamepadManager.fillButtonText(get("gpspcl_" + playerIndex), 'b01');

	get("kbl_" + playerIndex).dataset.code = 65;
	get("kbl_" + playerIndex).innerHTML = keyNames[65];
	get("kbr_" + playerIndex).dataset.code = 68;
	get("kbr_" + playerIndex).innerHTML = keyNames[68];
	get("kbu_" + playerIndex).dataset.code = 69;
	get("kbu_" + playerIndex).innerHTML = keyNames[69];
	get("kbd_" + playerIndex).dataset.code = 83;
	get("kbd_" + playerIndex).innerHTML = keyNames[83];
	get("kbthrust_" + playerIndex).dataset.code = 87;
	get("kbthrust_" + playerIndex).innerHTML = keyNames[87];
	get("kbfire_" + playerIndex).dataset.code = 32;
	get("kbfire_" + playerIndex).innerHTML = keyNames[32];
	get("kbspcl_" + playerIndex).dataset.code = 17;
	get("kbspcl_" + playerIndex).innerHTML = keyNames[17];

	if(multiplayer){mplayerIndex++;}
	if(!multiplayer){get("remove_" + playerIndex).style.display = "none";}

	return playerIndex;
}

function checkZeroPlayers(){ // deactivate the start button if there are no players
	if(get("mpdisparea").childNodes.length == 0){
		get("gogogobutton").style.backgroundColor = '#cccccc';
		get("gogogobutton").onclick = "";
		ADDPLAYER_BLINK = true;
	}
	else{
		get("gogogobutton").style.backgroundColor = '#ff7755';
		get("gogogobutton").onclick = startgame;
		get("addplayerbutton").style.boxShadow = '';
		ADDPLAYER_BLINK = false;
	}
}

//////////////////////
// helper functions //
//////////////////////

function get(id){return document.getElementById(id);}
function make(tag){return document.createElement(tag);}
function txt(str){return document.createTextNode(str);}
function idx(self){return self.id.split("_")[1];} // return index of an html element
function randint(maximum){return Math.floor(Math.random()*maximum);}
function pad(num, size){var s = num+""; while (s.length < size){s = "0" + s;} return s;} // 0 padding for strings

function fillOptions(select, options, code){
	for(var i=0; i<options.length; i++){
		opt = make("option");
		opt.appendChild(txt(options[i]));
		opt.dataset.code = code[i];
		select.appendChild(opt);
	}
}

function ctlSelect(index, element){ // takes the player index and "gp/ms/kb/md"
	get("gpoptions_" + index).style.display = "none";
	get("msoptions_" + index).style.display = "none";
	get("kboptions_" + index).style.display = "none";
    get("mdoptions_" + index).style.display = "none";
	get(element + "options_" + index).style.display = "inline";

	get("ctlgp_" + index).style.backgroundColor = "#f0f8ff";
	get("ctlms_" + index).style.backgroundColor = "#f0f8ff";
	get("ctlkb_" + index).style.backgroundColor = "#f0f8ff";
        get("ctlmd_" + index).style.backgroundColor = "#f0f8ff";
	get("ctl" + element + "_" + index).style.backgroundColor = "skyblue";

	get("ctltype_" + index).dataset.selected = element;
}

function spmpSelect(spmp){ // sp for singleplayer, mp for multiplayer
	if(spmp == "sp"){
		get("singleplayercfg").style.display = "inline";
		get("sp").style.backgroundColor = "skyblue";
		get("multiplayercfg").style.display = "none";
		get("mp").style.backgroundColor = "#f0f8ff";
		SINGLEMULTI = 1;
	}
	else if(spmp == "mp"){
		get("singleplayercfg").style.display = "none";
		get("sp").style.backgroundColor = "#f0f8ff";
		get("multiplayercfg").style.display = "inline";
		get("mp").style.backgroundColor = "skyblue";
		SINGLEMULTI = 2;
	}
}

var assignKeyToButton='';
function assignKey(button){
	assignKeyToButton = button;
	button.style.backgroundColor = "yellow";
}
document.body.onkeydown = function(e){
	if(assignKeyToButton != ''){
		e.preventDefault();
		assignKeyToButton.innerHTML = keyNames[e.keyCode] || "k" + e.keyCode;
		assignKeyToButton.dataset.code = e.keyCode;
		assignKeyToButton.style.backgroundColor = "#f0f8ff";
		assignKeyToButton='';
	}
}
function selectItem(select, item){ // selects a string (text or data-code) in a select dropdown
	for(var i=0; i<select.options.length; i++){
		if(select.options[i].text == item || select.options[i].dataset.code == item){
			select.selectedIndex = i;
			return;
		}
	}
}

function setValueIfDefined(element, value) { //sets value of the element only to value if value is defined
	if(value !== undefined) {
		element.value = value;
	}
}

function getSelectedCode(select){ // returns the data-code of the selected option
	return select.options[select.selectedIndex].dataset.code;
}



function flipOptions(){
	if(get("mpoptions").style.display == "block"){
		get("mpoptions").style.display = "none";
	}
	else{
		get("mpoptions").style.display = "block";
	}
}

function defaultOptions(){

	get("time").value = 120;
	get("hp").value = 6;
	get("shld").value = 4;
	get("shldreg").value = 1;
	get("ammo").value = 30;
	get("ammoreg").value = 10;
	get("vol").value = 40;
	get("res").value = 100;
	get("debug").value = 0;

}

function startgame(){

	setCookie('hbcfg', config2string(true), 3650);

	var urltail = "#" + config2string(false);

	var url = window.location.href.replace(/index\.html.*/, "");
	while(url.slice(-1) == "/"){url = url.substring(0, url.length-1);}

	url = url + "/screen.html" + urltail;

	GamepadManager.stop();

	window.location.href = url;
}

////////////////////
// store and load //
////////////////////

function config2string(complete){ // incomplete only contains stuff necessary for starting the game
	var result = 'hbcfgv:' + CFGVERSION + ';';

	if(complete){
		result += 'sm:' + SINGLEMULTI + ';';
	}

	if(SINGLEMULTI == 2 || complete){
		result += 'time:' + get('time').value + ';';
		result += 'hp:' + get('hp').value + ';';
		result += 'shld:' + get('shld').value + ';';
		result += 'shldreg:' + get('shldreg').value + ';';
		result += 'ammo:' + get('ammo').value + ';';
		result += 'ammoreg:' + get('ammoreg').value + ';';
		result += 'vol:' + get('vol').value + ';';
		result += 'res:' + get('res').value + ';';
		result += 'bump:' + get('bump').checked * 1 + ';';
		result += 'h2o:' + get('h2o').checked * 1 + ';';
		result += 'debug:' + get('debug').value + ';';
		result += 'map:' + get('map').value.split("|")[0] + ';';
		result += 'game:' + get('map').value.split("|")[1] + ';';
	}

	if(SINGLEMULTI == 1 || complete){
		result += 'vol0:' + get('vol0').value + ';';
		result += 'res0:' + get('res0').value + ';';
		result += 'bump0:' + get('bump0').checked * 1 + ';';
		result += 'h2o0:' + get('h2o0').checked * 1 + ';';
		result += 'debug0:' + get('debug0').value + ';';
		result += 'map0:' + MAP0 + ';';
		result += 'game0:' + GAME0 + ';';
	}

	for(var i=-1; i<get("mpdisparea").childNodes.length; i++){ // -1 for the single player
		if( i==-1 && SINGLEMULTI == 2 && !complete ){continue;}
		if( i>-1 && SINGLEMULTI == 1 && !complete ){break;}

		var index;
		if( i==-1 ){
			index = 0;
			result += "player0:";
		}
		else{
			index = idx(get("mpdisparea").childNodes[i]);
			result += "player:";
		}

		result += get("name_"+index).value + ",";
		result += get("color_"+index).value + ",";
		var ctl = get("ctltype_"+index).dataset.selected;
		result += ctl;

		if(ctl == "gp" || complete){
			result += ",";
			result += get("gpidx_" + index).dataset.code + ",";
			result += getSelectedCode(get("gprelabs_" + index)) + ",";
			result += get("gplr_" + index).dataset.code + ",";
			result += get("gpud_" + index).dataset.code + ",";
			result += get("gpthrust_" + index).dataset.code + ",";
			result += get("gpfire_" + index).dataset.code + ",";
			result += get("gpspcl_" + index).dataset.code;
		}
		if(ctl == "kb" || complete){
			result += ",";
			result += getSelectedCode(get("kbrelabs_" + index)) + ",";
			result += get("kbl_" + index).dataset.code + ",";
			result += get("kbr_" + index).dataset.code + ",";
			result += get("kbu_" + index).dataset.code + ",";
			result += get("kbd_" + index).dataset.code + ",";
			result += get("kbthrust_" + index).dataset.code + ",";
			result += get("kbfire_" + index).dataset.code + ",";
			result += get("kbspcl_" + index).dataset.code;
		}
		if(ctl == "ms" || complete){
			result += ",";
			result += getSelectedCode(get("msrelabs_" + index)) + ",";
			result += getSelectedCode(get("msthrustfire_" + index)) + ",";
			result += getSelectedCode(get("msspcl_" + index));
		}
		if(ctl == "md" || complete){
			result += ",";
			result += get('mdleftright_' + index).checked * 1 + ',';
			result += get('mdupdown_' + index).checked * 1 + ',';
			result += get('mdsensitivity_' + index).value;
		}
		result += ";";
	}


	return result;
}

function string2config(string, warning){ // string must be complete

	get("spdisparea").innerHTML = '';
	addPlayer(false); // add random single player
	get("mpdisparea").innerHTML = '';

	if(string.split(';')[0] != 'hbcfgv:' + CFGVERSION){
		if(warning){alert("Data does not store AceChase configuration or version is incompatible!");}
		console.log("Data: " + string);
		return;
	}

	var cfg = string.split(';');

	for(let i=cfg.length-1; i>=0; i--){ // back to front cuz players are added on top
		var key = cfg[i].split(':')[0];
		var value = cfg[i].split(':')[1];

		if(key=="sm"){
			if(value == 1){spmpSelect('sp');}
			if(value == 2){spmpSelect('mp');}
		}

		if(key=="time" || key=="hp" || key=="shld" || key=="shldreg" || key=="ammo" || key=="ammoreg"
				|| key=="vol" || key=="res" || key=="debug" || key=="vol0" || key=="res0" || key=="debug0"){
			get(key).value = value;
		}

		if(key=="map"){
			for(let k=0; k<get("map").options.length; k++){
				if(get("map").options[k].value.indexOf(value) != -1){
					get("map").selectedIndex = k;
				}
			}
		}

		if(key=="bump" || key=="h2o" || key=="bump0" || key=="h2o0"){
			get(key).checked = value=="1";
		}

		if(key == "player" || key == "player0"){
			var ip = 0; // index of part
			var part = value.split(',');
			var index = 0;
			if(key == "player"){index = addPlayer(true)};
			get("name_"+index).value = part[ip];
			selectItem(get("color_"+index), part[++ip]);
			get("color_"+index).onchange();
			ctlSelect(index, part[++ip]);

			get("gpidx_" + index).dataset.code = part[++ip];
			get("gpidx_" + index).innerHTML = part[ip];
			selectItem(get("gprelabs_" + index), part[++ip]);
			GamepadManager.fillButtonText(get("gplr_" + index), part[++ip]);
			GamepadManager.fillButtonText(get("gpud_" + index), part[++ip]);
			GamepadManager.fillButtonText(get("gpthrust_" + index), part[++ip]);
			GamepadManager.fillButtonText(get("gpfire_" + index), part[++ip]);
			GamepadManager.fillButtonText(get("gpspcl_" + index), part[++ip]);

			selectItem(get("kbrelabs_" + index), part[++ip]);
			get("kbl_" + index).dataset.code = part[++ip];
			get("kbl_" + index).innerHTML = keyNames[part[ip]] || "k" + part[ip];
			get("kbr_" + index).dataset.code = part[++ip];
			get("kbr_" + index).innerHTML = keyNames[part[ip]] || "k" + part[ip];
			get("kbu_" + index).dataset.code = part[++ip];
			get("kbu_" + index).innerHTML = keyNames[part[ip]] || "k" + part[ip];
			get("kbd_" + index).dataset.code = part[++ip];
			get("kbd_" + index).innerHTML = keyNames[part[ip]] || "k" + part[ip];
			get("kbthrust_" + index).dataset.code = part[++ip];
			get("kbthrust_" + index).innerHTML = keyNames[part[ip]] || "k" + part[ip];
			get("kbfire_" + index).dataset.code = part[++ip];
			get("kbfire_" + index).innerHTML = keyNames[part[ip]] || "k" + part[ip];
			get("kbspcl_" + index).dataset.code = part[++ip];
			get("kbspcl_" + index).innerHTML = keyNames[part[ip]] || "k" + part[ip];

			selectItem(get("msrelabs_" + index), part[++ip]);
			selectItem(get("msthrustfire_" + index), part[++ip]);
			selectItem(get("msspcl_" + index), part[++ip]);

			get("mdleftright_" + index).checked = part[++ip] == '1';
			get("mdupdown_" + index).checked = part[++ip] == '1';
			setValueIfDefined(get("mdsensitivity_" + index), part[++ip]);
		}
	}

}

/*
function loadSinglePlayerMission(missionName) {
	let mapPath = missionName;
	let hs = getCookie(mapPath);
	if(hs != ""){
		let award = medal(mapPath, hs*1);
		if(award != null){
			get(missionName + "medal").src = "media/images/" + award + ".png";
			get(missionName + "medal").style.display = "inline";
		}
		get(missionName + "hs").innerHTML = Math.floor(hs/60) + ":" + pad(Math.floor(hs%60),2) + "." + pad(Math.round(1000*(hs%1)),3);
	}
}
*/
