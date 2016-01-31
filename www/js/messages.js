function agentStyle(agent) {
	if ( isMe(agent) ) return 'light';
	switch(agent) {
		case 'soe': return "primary";
		case 'spacon': return "warning";
		default: return "alarm";
	}
};

function isMe(op, id) {
	var _id = id;
	if (! op) return false;
	if (! _id) _id = operator;
	if (! _id) return (op.toLowerCase() == 'som');
	return ( _id.toLowerCase() == op.toLowerCase() );
};

function display_speechact(act, loop) {
	_add_msg(
		document.getElementById('loop1-table'), 
		act,
		document.getElementById('loop1-div')	
	);

	d3_update_graph_node(act);
	
}

function _add_msg(table, act, div) {

     console.log("adding msg act to table...:" + JSON.stringify(act));

    if (!table || !act || !act.speaker) {
	console.log("Missing something");
	return;
    }

    if (!div) div = table.parentNode;

    var tr = document.createElement("tr");

    tr.classList.add("alert");
    tr.classList.add( agentStyle(act.speaker) );

    var tds = [
	document.createElement("td"),
	document.createElement("td"),
	document.createElement("td")
    ];

    var i = isMe(act.speaker) ? 2 : 0; 
    
    tds[i].innerHTML = act.speaker.toUpperCase();
    tds[1].innerHTML = act.content;

    for (var i= 0; i<3; i++) {
	tr.appendChild(tds[i]);
    }

    table.appendChild(tr);
    div.scrollTop = div.scrollHeight;

};


