/////////////////////////////////////////////////////////
//
// mates web backend -- websocket host & port
//

//var wsHost = "172.16.128.113";
//var wsPort = "8081";
//var wsHost = "10.48.18.174";
//var wsPort = "8085";
var wsHost = "";
var wsPort = "";


/////////////////////////////
//
// voice config
//

// the easisest way to tweak the values below is to visit: http://www.masswerk.at/mespeak/

var soe_voice = {
		amplitude: 100,
		pitch: 80,
		speed: 175,
		wordgap: 3,
		variant: 'f2'
	};

var spacon_voice = {
		amplitude: 120,
		pitch: 30,
		speed: 160,
		wordgap: 3,
		variant: 'm7'
	};


/////////////////////////////
//
// recognition config
//

var use_core_only = false;
var forward_spelling = true;

