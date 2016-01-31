  var output;
  var wsUri = 'ws://' + wsHost +':' + wsPort + '/supervisor'; 


  function init()
  {
    writeStatus("initializing...");
    document.getElementById("server").innerHTML=wsUri;
    output = document.getElementById("output");
    openWebSocket();
    writeStatus("initialized");
  }

  function openWebSocket()
  {
    writeStatus("connecting...");
    websocket = new WebSocket(wsUri);
    websocket.onopen = function(evt) { onOpen(evt) };
    websocket.onclose = function(evt) { onClose(evt) };
    websocket.onmessage = function(evt) { onMessage(evt) };
    websocket.onerror = function(evt) { onError(evt) };
  }

  function onOpen(evt)
  {
    writeStatus("connected");
  }

  function onClose(evt)
  {
    writeStatus("DISCONNECTED");
  }

  function onMessage(evt)
  {
    screen_msg_obj = parseMessage(evt.data);
    writeToScreen('<span style="color: ' + screen_msg_obj.color + ';"> ' + screen_msg_obj.msg +'</span>');
  }

  function onError(evt)
  {
    writeStatus('<span style="color: red;">ERROR:</span> ' + evt.data);
  }

  function parseMessage(jsonStr)
  {
	var _msg = jsonStr;
	var _type = "ERROR";

	var obj = JSON.parse(jsonStr);
	if (obj && obj.message) {
		var re_msg =  new RegExp("([A-Z]*): " + "(.+)");
		var str = obj.message;
		console.log("parsing: " + str);
		if ( re_msg.test(obj.message) ) {
			_log_msg = re_msg.exec(obj.message);
			_type = _log_msg[1];
			_msg = JSON.parse(_log_msg[2]);
		} else {
			console.log("Couldn't parse log message: " + obj.message);
		}
	} else {
		console.log("Couldn't parse json from ws: " + jsonStr);
	}
	return { msg: _msg, color: type2color(_type) };
  }

  function type2color(type)
  {
	switch (type) {
		case "INFO": return "black";
		case "WARN": return "blue";
		case "DEBUG": return "gray";
		case "ERROR": return "red";
		case "TRACE": return "gray";
	}
  }

  function writeToScreen(message)
  {
    var d = new Date();
    var pre = document.createElement("p");
    pre.style.wordWrap = "break-word";
    pre.innerHTML = '<span style="color: gray;"> [' + d.toLocaleTimeString() + '] </span> ' + message;
    output.appendChild(pre);
    output.scrollTop = output.scrollHeight;
    console.log("screen add: " + message);
  }

  function writeStatus(message)
  {
    document.getElementById("status").innerHTML = message;
    console.log("Status: " + message);
  }

  window.addEventListener("load", init, false);

