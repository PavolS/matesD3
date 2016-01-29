  // mq(ws)
  var wsUri = 'ws://' + wsHost +':' + wsPort + '/voice';
  var connected = false;

  // stt: These will be initialized later
  var recognizer, recorder, callbackManager, audioContext, outputContainer, grammar_id;
  // stt: Only when both recorder and recognizer do we have a ready application
  var recorderReady = recognizerReady = false;
  // stt: finally find the best fitting "core" speech act
  var core_speechacts = [];
 
  // mq,tts
  var output, operator;
  // tts - voice setup (see also config.js)
  var mespeakSpeakers = {
	som: { variant: 'h5'},
	spacon: spacon_voice,
	soe: soe_voice
  }


  //ui
  // send timer
  var send_interval, send_to = send_to_nominal = 3;
  // original send inner html
  var send_inner = document.getElementById("sendBtn").innerHTML;
  //parsed scenario file
  var scenario = [];

  // compatibility stuff
  if(!window.console){ window.console = {log: function(){} }; } 
  
  if(!window.console.info){ window.console.warn = window.console.log; } 
  if(!window.console.warn){ window.console.warn = window.console.log; } 
  if(!window.console.error){ window.console.warn = window.console.log; } 
  if(!window.console.debug){ window.console.warn = window.console.log; } 
  

  function init()
  {
    // document.getElementById("server").innerHTML=wsUri;

    update_ws_buttons();

    output = document.getElementById("output");

    // start the workers for stt
    init_stt();
	
    // load tts stuff
    meSpeak.loadConfig("public/mespeak_config.json");
    meSpeak.loadVoice("public/voices/en/en.json");

    // connect the loop
    openWebSocket();

    // read the core speechacts
    read_core_grammar();

    // read and print the scenario description
    read_and_print_scenario();

    // update the use core only checkbox
    document.getElementById("core_only").checked = use_core_only;
  }

  function updateStatus() {
	return true;
  };

  function openWebSocket(andSend)
  {
    writeStatus("connecting...");
    websocket = new WebSocket(wsUri);
    websocket.onopen = function(evt) { onOpen(evt, andSend) };
    websocket.onclose = function(evt) { onClose(evt) };
    websocket.onmessage = function(evt) { onMessage(evt) };
    websocket.onerror = function(evt) { onError(evt) };
  }

  function onOpen(evt, andSend)
  {
    writeStatus("connected");

    if (! operator) doRegister();

    connected = true;
	restart(); // d3
    	update_ws_buttons();

    if (andSend) {
	onSend();
    }
  }

  function onClose(evt)
  {
    writeStatus("DISCONNECTED");
    operator = null;
    connected = false;
	restart(); // d3
        update_ws_buttons();
  }

  function onMessage(evt)
  {
    writeToScreen('<span style="color: blue;">RESPONSE: ' + evt.data+'</span>');
    var obj = JSON.parse(evt.data);
    if (obj ) {
	if ( obj.speaker && obj.content ) { 
		playSpeechAct(obj); 
		display_speechact(obj);
	}
	if ( obj.success ) { 
		onRegister(obj); 
	}
    } else {
	writeToScreen('<span style="color: red;">ERROR: Not valid json object!</span>');
    }
  }

  function onError(evt)
  {
    writeToScreen('<span style="color: red;">ERROR: ' + evt.data+'</span>');
    operator=null;
  }

  function doSend(message)
  {
    sendBtn_clear();
    websocket.send(message);
    writeToScreen("SENT: " + message); 
  }

  function onSend()
  {
	if (!connected) {
		console.log("onSend: connect first...");
		openWebSocket(true); // open register and send
		return;
	}

	var _text = document.getElementById("msg").value;
	var _to = document.getElementById("to").value;
	var _intent = document.getElementById("intent").value;
	var _from = document.getElementById("id").value;
	var _aloud = (document.getElementById("aloud").value == 'aloud');


	if (!operator || operator != _from) {
		console.log("onSend: register first...");
		doRegister(true); // register and send
		return;
	}

	var msg = new SpeechAct(_intent, _from, _to, _text);

	if (_aloud) playSpeechAct(msg);
	display_speechact(msg);

	doSend( JSON.stringify(msg) );
  }

  // ws -- stt interface
  function onFinalRecognition(rec, internal)
  {
	console.log("on final...");

	if (! rec) {
		console.log('bad (no) rec, you need to repeat or enter data manually"');
		return false;
	}

	// NLP simulation + remove unnecessary white spaces
	var _msg = get_best_core_fit(rec, forward_spelling).toLowerCase().replace(/^\s+|\s+$/g, '').replace(/\s\s+/g, ' ');

	// update ui
	document.getElementById("to").value = 'loop';
	document.getElementById("msg").value = _msg;
	showInterrupt();

	//  start count-down
	send_interval = setInterval(function(){sendBtn_countDown()},1000);

	return true;
  }

  // mq do- & on-register
  function doRegister(andSend)
  {
	// these two ... 
	operator = document.getElementById("id").value;

        update_ws_buttons();
	// ... should be done uppon succes response to these actions
	var msg = new Registration(operator);
	doSend( JSON.stringify(msg) );

	d3_add_speaker(operator);

	console.log("doRegister " + operator + ": " + andSend);

	if (andSend) {
		onSend();
	}
  }

  function onRegister(obj) {
	console.log("on register ...");
  }; 


  function writeToScreen(message)
  {
    var pre = document.createElement("p");
    pre.style.wordWrap = "break-word";
    pre.innerHTML = message;
    output.appendChild(pre);
    output.scrollTop = output.scrollHeight;
  }

  function writeStatus(message)
  {
    // document.getElementById("status").innerHTML = message;
    updateStatus("ws status: " + message);
  }

  function playSpeechAct(act)
  {
	
	console.log("play act: " + JSON.stringify(act) );
	meSpeak.speak( ( act.content.length < 80) ? act.content : act.content.substr(0,20) + ' and so on', mespeakSpeakers[act.speaker]);
  }

  function playError(msg)
  {
	console.log("play error: " + msg);
	meSpeak.speak( msg, { variant: 'whisper'} );
  }

  window.addEventListener("load", init, false);

  // constructors
	function SpeechAct(intent, speaker, recipient, content) {

		var self = this;
	
		self.intent = intent;
		self.speaker = speaker;
		self.recipient = recipient;
		self.content = content;
	
	}

	function Registration(role) {

		var self = this;
	
		self.operator = role;
	}



   // ui updates
	function update_ws_buttons() {
		var registered = false;
		if ( operator ) registered = true;
		console.log("bools reg: " + registered  + " cn: " + connected );
		sendBtn_clear();
		// do not disable send btn: document.getElementById('sendBtn').disabled = ( ! connected || ! registered );
	}

	function sendBtn_countDown() {
	    console.log("send_to: " + send_to);
            document.getElementById("sendBtn").innerHTML =  send_inner + send_to;
	    if (send_to == 0) {
		return onSend();
	    } else if (send_to == send_to_nominal) {
		console.log("send_to is nominal: " + send_to);
		send_to-=1;
	    } else {
		send_to-=1;
	    }
	}

	function onInterrupt() {
		console.log("interrupt auto send!");
		sendBtn_clear();
	}

	function showInterrupt() {
		document.getElementById("startBtn-div").style.display = 'none';
		document.getElementById("stopBtn-div").style.display = 'none';

		document.getElementById("startStopBtn-div").style.display = 'none';
		document.getElementById("interruptBtn-div").style.display = 'inline-block';
	}

	function sendBtn_clear() {
		send_to = send_to_nominal;
		clearInterval(send_interval);

		document.getElementById("startBtn-div").style.display = 'inline-block';
		document.getElementById("stopBtn-div").style.display = 'none';

		document.getElementById("startStopBtn-div").style.display = 'inline-block';
		document.getElementById("interruptBtn-div").style.display = 'none';
                document.getElementById("sendBtn").innerHTML = send_inner;
	}

	function on_id_select() {
		// TODO update the operator here!!
		// repaint the scenario
		print_scenario();
	}

   // core only control
	function onCoreOnlyToggle(_id) {
		use_core_only = document.getElementById(_id).checked;
	}

   // scenario control
	function onScenario(action) {
		console.log('Send ' + action + ' to supervisor.');
		var msg = new SpeechAct('tell', 'som', 'supervisor', action);
		doSend( JSON.stringify(msg) );
	}

	function read_and_print_scenario() {
		var lines;
		jQuery.get('import/scenario.txt', function(data) {
			console.log("SCENARIO:\n" + data);
			// no comments, no empty lines, split each line
			lines = jQuery.map( data.replace(/\#.*$/g, '').replace(/\r\n\s*$|\r\s*$|\n\s*$/g, '').split(/\r\n|\r|\n/g), function( n, i ) {
			  return [ n.replace(/^ | $/g, '').split(/\t/g) ];
			});
			scenario = lines;
			print_scenario();
		});
	}

	function print_scenario() {

		// remove all entries
		var myNode = document.getElementById("scenario-table");
		while (myNode.firstChild) {
		    myNode.removeChild(myNode.firstChild);
		}

		// process the input file (text expected)
		console.log(JSON.stringify(scenario) + ' is being processed');
		jQuery.map( scenario, function( line, i ) {
		    // skip to next if wrongly parsed
		    if ( line.length == 2 ) {
			console.log(JSON.stringify(line) + ' is being processed');
		    } else {
			console.log(JSON.stringify(line) + ' has wrong format');
			return true; 
		    }

		    var tr = document.createElement("tr");

		    tr.classList.add("alert");
		    tr.classList.add( 
				isMe( line[0], document.getElementById("id").value ) ? "info" : "default" 
			);

		    var tds = [
			document.createElement("td"),
			document.createElement("td"),
		    ];

		    tds[0].innerHTML = line[0].toUpperCase();
		    tds[1].innerHTML = line[1].toLowerCase();

		    for (var i= 0; i<2; i++) {
			tr.appendChild(tds[i]);
		    }

		    document.getElementById("scenario-table").appendChild(tr);
		});		
	}

   // core grammar (faking NLP)
	function read_core_grammar() {
		var lines;
		jQuery.get('import/core/voiceloop.examples.count.txt', function(data) {
			console.debug("CORE SPEECHACTs:\n" + data);
			lines = jQuery.map( data.toUpperCase().replace(/\r\n\s*$|\r\s*$|\n\s*$/g, '').split(/\r\n|\r|\n/g), function( n, i ) {
			  return [ n.replace(/\d/g,'').replace(/\s\s*/g, ' ').replace(/^ | $/g, '').split(/ /g) ];
			});
			console.debug(JSON.stringify(lines));
			core_speechacts = lines;

			get_best_core_fit("This is loop a silly test for the investigate parameter es pi ell ell ee nn gg (with spell. on)", true);
			get_best_core_fit("This is a loop silly test for the investigate parameter es pi ell ell ee nn gg (with spell. off)", false);
			get_best_core_fit("This is a silly loop test for an empty investigate parameter", true);
		});
	}

	function get_best_core_fit(msg, includeSpelling) {
		var top_score = 0, core_fit = null, bufStr = '';

		if ( core_speechacts.length <= 0 ) {
			console.error('WARNING! No core acts defined, leaving recognized msg untouched!');
			return msg;
		}

		jQuery.map( core_speechacts, function( act, i ) {
			  var score_obj = _get_score(act, msg.toUpperCase() );
			  var new_score = score_obj.score;
			  var new_buf = score_obj.buf.join(' ');
			  console.debug(JSON.stringify(act) + ' scored ' + new_score + ' buf: ' + new_buf  );
			  if ( new_score > top_score ) {
				console.debug( 'New best!');
				core_fit = act.slice(0);
				top_score = new_score;
				bufStr = new_buf;
			  }
		});
			
		// handle spelling (SPELLING keyword in core speechact)
		// - currently this only works if 
        //   the last matched part of the core speechact was just before the actuall spelling 
		//   (i.e. core is "bla bla ... BLA SPELLING" and BLA matched, this is blindly assumed to be correct)
		// - needs to be enabled via forward_spelling config param
		var i = core_fit.indexOf('SPELLING');
		if ( i > -1 ) {
			core_fit[i] = (includeSpelling) ? bufStr : '';
		}

		console.info('Final fit: ' + core_fit.join(' ') );


		return core_fit.join(' ');
	}

	function _get_score(core_act, msg) {
		var hits = 0, 
		    buf_weight = 1e-3,
			buf = msg.split(' '), 
			msg_word_count = buf.length, 
			core_act_word_count = core_act.length, 
			core_act_spelling_token_count = 0, 
			buf_coefficient = -1;

		var i = core_act.indexOf('SPELLING');
		if ( i > -1 ) {
			if (i < core_act.length - 1) {
				console.error('Currently, we support only SPELLING as last item! (length=' + core_fit.length + ', index=' + i + ' )');
				return { 'score': -1e3, 'buf': buf}
			}
			core_act_word_count--;
			core_act_spelling_token_count++;
			buf_coefficient = 1;
		}
		
		jQuery.map( core_act, function( word, i ) {
			var j = buf.indexOf(word);
			if ( j > -1 ) {
				hits++;
				buf.splice(0,j+1); // yes, this might delete a lot more than just the matched word!
			}
		});
		
		// the main normalized bonus for number of matching 'real' words from the core speech act
		var hits_bonus = hits / core_act_word_count;
		
		// the spelling and buffer bonus depends on whether we actually are looking at a 
		// core speech act which includes a spelling token or not
		// - if not, it is simply a normalized penalty, depending on the size of the buffer (i.e. unmatched words after last matching word)
		// - if yes, it is a _potential_ corresponding bonus (unless, there are less words in the buffer than spelling tokens in the core act)
		//   note, however, that a non-empty buffer _always_ causes a penalty in the non-spelling case
		var spelling_and_buffer_bonus =  buf_coefficient * 
			(buf.length - core_act_spelling_token_count)/msg_word_count;
										 
		return { 'score': hits_bonus * (1 - buf_weight) + spelling_and_buffer_bonus * buf_weight, 'buf': buf };
	}



