// shared vars for grammar ids
var id_main_grammar, id_core_grammar;



// A convenience function to post a message to the recognizer and associate
// a callback to its response
function postRecognizerJob(message, callback) {
	var msg = message || {};
	if (callbackManager) msg.callbackId = callbackManager.add(callback);
	if (recognizer) recognizer.postMessage(msg);
};

// This function initializes an instance of the recorder
// it posts a message right away and calls onReady when it
// is ready so that onmessage can be properly set
function spawnWorker(workerURL, onReady) {
	recognizer = new Worker(workerURL);
	recognizer.onmessage = function(event) {
		onReady(recognizer);
	};
	recognizer.postMessage('');
};

// To display the hypothesis sent by the recognizer
function updateHyp(hyp, final) {
	if (! outputContainer) {
		consolo.log("Error, no outputContainer to display hypothesis");
		return false;
	}
	outputContainer.classList.toggle("final",final);
	outputContainer.innerHTML = "'" + hyp + "'";
};

// This updates the UI when the app might get ready
// Only when both recorder and recognizer are ready do we enable the buttons
function updateUI() {
	if (recorderReady && recognizerReady) {
		startStopBtn.disabled = false;
		startBtn.disabled = false;
		document.getElementById('startStopBtn-div').classList.toggle("success",true);
		document.getElementById('startBtn-div').classList.toggle("success",true);
	};
};

// This is just a logging window where we display the status
function updateStatus(newStatus) {
	var current_st = document.getElementById('current-status');
	current_st.innerHTML += "<br/>" + newStatus;
	current_st.scrollTop = current_st.scrollHeight;
};

// A recording indicator
function displayRecording(display) {
	var btn =  document.getElementById('startStopBtn-div');
	if (display) {
		btn.classList.toggle("danger", true);
	} else {
		btn.classList.toggle("danger", false);
	}
};

// Callback function once the user authorises access to the microphone
// in it, we instanciate the recorder
function startUserMedia(stream) {
	console.log("Audio media callback...");
	var input = audioContext.createMediaStreamSource(stream);
	// Firefox hack https://support.mozilla.org/en-US/questions/984179
	window.firefox_audio_hack = input; 
	var audioRecorderConfig = {errorCallback: function(x) {updateStatus("Error from recorder: " + x);}};
	recorder = new AudioRecorder(input, audioRecorderConfig);
	// If a recognizer is ready, we pass it to the recorder
	if (recognizer) recorder.consumers = [recognizer];
	recorderReady = true;
	console.log("Update ui (audio on)...");
	updateStatus("Audio recorder ready");
	updateUI();
};

// This starts recording. 
var startRecording = function() {

	document.getElementById("startBtn-div").style.display = 'none';
	document.getElementById("stopBtn-div").style.display = 'inline-block';

	var _grammar_id = (use_core_only) ? id_core_grammar : id_main_grammar;

	console.log('Starting recognizer using the grammar id=' + _grammar_id);

	if (recorder && recorder.start(_grammar_id)) displayRecording(true);
};

// Stops recording
var stopRecording = function() {

	document.getElementById("startBtn-div").style.display = 'inline-block';
	document.getElementById("stopBtn-div").style.display = 'none';

	recorder && recorder.stop();
	displayRecording(false);
};

// Called once the recognizer is ready
// We then add the grammars to the input select tag and update the UI
var recognizerReady = function() {
	recognizerReady = true;
	updateUI();
	updateStatus("Recognizer ready");
};

// This adds the main grammar, once we are done, we can 
// add the core grammar and then finally call recognizerReady()
var feedGrammar = function() {

	postRecognizerJob(
			{command: 'addGrammar', data: grammarvoiceloop}, // grammarvoiceloop comes from voiceloop*.js
			function(id) {
				id_main_grammar = id;
				console.log('Fed main grammar, id=' + id_main_grammar);
				console.debug("Main grammar:\n" + JSON.stringify(grammarvoiceloop) );
				feedCoreGrammar();
			}
	);

};

// This adds the core grammar, once we are done, we can 
// call recognizerReady()
var feedCoreGrammar = function() {

	postRecognizerJob(
			{command: 'addGrammar', data: grammarvoiceloop_core}, // grammarvoiceloop comes from voiceloop*.js
			function(id) {
				id_core_grammar = id;
				console.log('Fed core grammar, id=' + id_core_grammar);
				console.debug("Core grammar:\n" + JSON.stringify(grammarvoiceloop_core) );
				recognizerReady();
			}
	);

};

// This adds words to the recognizer. When it calls back, we add grammars
var feedWords = function(words) {
	postRecognizerJob({command: 'addWords', data: words},
			function() {feedGrammar();});
};

// This initializes the recognizer. When it calls back, we add words
var initRecognizer = function() {
	// You can pass parameters to the recognizer, such as : {command: 'initialize', data: [["-hmm", "my_model"], ["-fwdflat", "no"]]}
	postRecognizerJob({command: 'initialize'},
			function() {
		if (recorder) recorder.consumers = [recognizer];
		feedWords(wordList);}); 	   // wordList comes from voiceloop*.js
};

// spawn a new recognizer worker and call getUserMedia to
// request access to the microphone
function init_stt() {
	outputContainer = document.getElementById("rec-output");
	updateStatus("Initializing web audio and speech recognizer, waiting for approval to access the microphone");
	callbackManager = new CallbackManager();

	// here we spawn the recognizer worker
	//
	spawnWorker("js/pocketsphinx/recognizer.js", function(worker) {
		// This is the onmessage function, once the worker is fully loaded
		worker.onmessage = function(e) {
			// This is the case when we have a callback id to be called
			if (e.data.hasOwnProperty('id')) {
				var clb = callbackManager.get(e.data['id']);
				var data = {};
				if ( e.data.hasOwnProperty('data')) data = e.data.data;
				if(clb) clb(data);
			}
			// This is a case when the recognizer has a new hypothesis
			if (e.data.hasOwnProperty('hyp')) {
				var newHyp = e.data.hyp;
				var final = (e.data.hasOwnProperty('final') && e.data.final);
				if (final) {
					onFinalRecognition(newHyp);
				}
				updateHyp(newHyp, final);
			}
			// This is the case when we have an error
			if (e.data.hasOwnProperty('status') && (e.data.status == "error")) {
				updateStatus("Error in " + e.data.command + " with code " + JSON.stringify(e.data.code) );
			}
		};
		// Once the worker is fully loaded, we can call the initialize function
		initRecognizer();
	});

	// The following is to initialize Web Audio
	//
	try {
		window.AudioContext = window.AudioContext || window.webkitAudioContext;
		navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
		window.URL = window.URL || window.webkitURL;
		audioContext = new AudioContext();
	} catch (e) {
		updateStatus("Error initializing Web Audio browser");
	}

	if (navigator.getUserMedia) {
		console.log("Getting audio media...");
		navigator.getUserMedia(
				{audio: true}, 
				startUserMedia, 
				function(e) {
					updateStatus("No live audio input in this browser");
				}
		);
	} else {
		updateStatus("Sorrry, no web audio support in this browser :(");
	}

	// Wiring JavaScript to the UI
	var startStopBtn = document.getElementById('startStopBtn');

	startStopBtn.disabled = true;
	startStopBtn.onmousedown = startRecording;
	startStopBtn.onmouseup = stopRecording;

	document.getElementById('startBtn').disabled = true;
	document.getElementById('startBtn').onclick = startRecording;
	document.getElementById('stopBtn').onclick = stopRecording;
};

