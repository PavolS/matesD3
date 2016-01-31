// set up SVG for D3
var width  = 960 / 12 * 5,
    height = width,
//    colors = d3.scale.category10(),
    max_msg_length = 64;

var svg = d3.select("#graph")
  .append('svg')
  .attr('width', width)
  .attr('height', height);

// define a few colors based on gumby css
primary_color = '#3085d6';
secondary_color = '#42a35a';
default_color = '#f2f2f2';
info_color = '#4a4d50';
danger_color = '#ca3838';
warning_color = '#f6b83f';
success_color = '#58c026';

primary_hover_color = '#58b2fa';
secondary_hover_color = '#6dbb80';
default_hover_color = '#ffffff';
info_hover_color = '#868d92';
danger_hover_color = '#f14f4f';
warning_hover_color = '#fdd27f';
success_hover_color = '#66d92f';


// set up initial nodes and links
//  - nodes are known by 'id', not by index in array.
//  - links are always source < target; edge directions are set by 'left' and 'right'.
var nodes = [
    {id: 0, sid: "loop 1", loop: true, x: width/2, y: height/2, fixed: true},
  ],
  lastNodeId = 0,
  links = [
  ];

var diam = 30;
var offset_y = [45, -37], offset_y_big = [53, -45];
var was_connected = false;

// init D3 force layout
var force = d3.layout.force()
    .nodes(nodes)
    .links(links)
    .size([width, height])
    .linkDistance(150)
    .charge(-300)
    .on('tick', tick)

// define arrow markers for graph links
svg.append('svg:defs').append('svg:marker')
    .attr('id', 'end-arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 6)
    .attr('markerWidth', 3)
    .attr('markerHeight', 3)
    .attr('orient', 'auto')
  .append('svg:path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', '#000');

svg.append('svg:defs').append('svg:marker')
    .attr('id', 'start-arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 4)
    .attr('markerWidth', 3)
    .attr('markerHeight', 3)
    .attr('orient', 'auto')
  .append('svg:path')
    .attr('d', 'M10,-5L0,0L10,5')
    .attr('fill', '#000');


// handles to link and node element groups
var path = svg.append('svg:g').selectAll('path'),
    circle = svg.append('svg:g').selectAll('g');

// update force layout (called automatically each iteration)
function tick() {
  // draw directed edges with proper padding from node centers
  path.attr('d', function(d) {
    var deltaX = d.target.x - d.source.x,
        deltaY = d.target.y - d.source.y,
        dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY),
        normX = deltaX / dist,
        normY = deltaY / dist,
        sourcePadding = d.left ? 17 : 12,
        targetPadding = d.right ? 17 : 12,
        sourceX = d.source.x + (sourcePadding * normX),
        sourceY = d.source.y + (sourcePadding * normY),
        targetX = d.target.x - (targetPadding * normX),
        targetY = d.target.y - (targetPadding * normY);

        return "M" + 
            sourceX + "," + 
            sourceY + "A" + 
            dist/2 + "," + dist/2 + " 0 0,1 " + 
            targetX + "," + 
            targetY;

  });



  circle.attr('transform', function(c) {
    return 'translate(' + c.x + ',' + c.y + ')';
  });
}

function loop_connected() {
	was_connected = ( was_connected || connected );
	return connected;
}

function shuffle() {
  // shuffle nodes 
  for ( i = 0; i <= lastNodeId; ++i ) {
	nodes[i].x = Math.floor( (Math.random() * width ) + 1);
	nodes[i].y = Math.floor( (Math.random() * height ) + 1);
        console.log('set coordinates: ' + nodes[i].x + ', ' + nodes[i].y);
  };

}

// update graph (called when needed)
function restart(active_id) {
  // path (link) group
  path = path.data(links);

  // update existing links
  path.classed('selected', function(d) { return false; })
    .style('marker-start', function(d) { return d.left ? 'url(#start-arrow)' : ''; })
    .style('marker-end', function(d) { return d.right ? 'url(#end-arrow)' : ''; })
    .transition() // there 
	    .style('stroke',  success_hover_color)
	    .style('stroke-width', '3px')
    .transition() // back
	    .style('stroke',  '#000')
	    .style('stroke-width', '1px')
    .transition() // there 
	    .style('stroke',  success_hover_color)
	    .style('stroke-width', '3px')
    .transition() // back
	    .style('stroke',  '#000')
	    .style('stroke-width', '1px')
    .transition() // there 
	    .style('stroke',  success_hover_color)
	    .style('stroke-width', '3px')
    .transition() // back
	    .style('stroke',  '#000')
	    .style('stroke-width', '1px')
  ;


  // add new links
  path.enter().append('svg:path')
    .attr('class', 'link')
    .classed('activated', true)
    .attr('id',  function(d) { return d.target.id ? 'link-' + d.target.id : 'link-' + d.target; });



  // remove old links
  path.exit().remove();


  // circle (node) group

  // update the loop color to green
  

  // NB: the function arg is crucial here! nodes are known by id, not by index!
  circle = circle.data(nodes, function(d) { return d.id; });

  // update existing nodes (loop & selected visual states)
  circle.selectAll('circle')
    .classed('loop', function(d) { return d.loop; })
    .classed('loopConnected', function(d) { return ( d.loop && loop_connected() ); })
    .classed('loopDisconnected', function(d) { return ( d.loop && !loop_connected() && was_connected ); });

  // update msg
  circle.append('svg:text')
	.text( function(d) {  var msg = d.msg; d.msg=''; return msg ? msg : ''; })
	.attr('y', function(d) { return (d.y>height/2) ? 45 : -37; } )
      .style('font-weight', 'regular')
      .transition() // there
      .attr('y', function(d) { return (d.y>height/2) ? offset_y_big[0] : offset_y_big[1]; } )
      .style('font', '20px sans-serif')
      .style('font-weight', 'bold')
      .style('fill', primary_color)
      .transition() // back
      .attr('y', function(d) { return (d.y>height/2) ? offset_y[0] : offset_y[1]; } )
      .duration(1000)
      .style('font', '12px sans-serif')
      .style('font-weight', 'regular')
      .style('fill', '#000')
      .transition() // fade
      .duration(5000)
      .style('fill', 'white')
      .remove()
  ;

  // add new nodes
  var g = circle.enter().append('svg:g');

  g.append('svg:circle')
    .attr('class', function(d) { return 'node ' + d.sid; } )
    .attr('r', diam)
    .classed('loop', function(d) { return d.loop; })
    .classed('loopConnected', function(d) { return ( d.loop && loop_connected() ); })
    .classed('loopDisconnected', function(d) { return ( d.loop && !loop_connected() && was_connected ); });

  // show node IDs
  g.append('svg:text')
      .attr('x', 0)
      .attr('y', 4)
      .attr('class', 'id')
      .text(function(d) { return d.sid; });


  // show message
  g.append('svg:text')
      .attr('x', 0)
      .attr('y', function(d) { return (d.y>height/2) ? offset_y[0] : offset_y[1]; } )
      .style('font-weight', 'regular')
      .text( function(d) {  var msg = d.msg; d.msg=''; return msg ? msg : ''; })
      .transition() // there
      .attr('y', function(d) { return (d.y>height/2) ? offset_y_big[0] : offset_y_big[1]; } )
      .style('font', '20px sans-serif')
      .style('font-weight', 'bold')
      .style('fill', primary_color)
      .transition() // back
      .attr('y', function(d) { return (d.y>height/2) ? offset_y[0] : offset_y[1]; } )
      .duration(1000)
      .style('font', '12px sans-serif')
      .style('font-weight', 'regular')
      .style('fill', '#000')
      .transition() // fade
      .duration(5000)
      .style('fill', 'white')
      .remove()
  ;

  // remove old nodes
  circle.exit().remove();

  // set the graph in motion
  force.start();
}

function spliceLinksForNode(node) {
  var toSplice = links.filter(function(l) {
    return (l.source === node || l.target === node);
  });
  toSplice.map(function(l) {
    links.splice(links.indexOf(l), 1);
  });
}

function mousedown() {
  // prevent I-bar on drag
  //d3.event.preventDefault();
  
  // because :active only works in WebKit?
  svg.classed('active', true);

	
  shuffle();

  restart();
}

function _add_speaker(speaker, pos) {
  // get current id
  var _sid = speaker;

  // insert new node at point
  var point = pos,
      node = {id: ++lastNodeId, sid: _sid, loop: false};
  node.x = point[0];
  node.y = point[1];
  nodes.push(node);

  var link = {source: 0, target: node.id, left: true, right: false};
  links.push(link);

  return lastNodeId;

}

function d3_add_speaker(speaker) {
	d3_update_graph_node(
		new SpeechAct('', speaker, '', '')
	);
}

function d3_update_graph_node(act) {

    if (!act || !act.speaker) {
	console.log("Missing speaker in speechact...");
	return;
    }

  
  // NB: the function arg is crucial here! nodes are known by id, not by index!
  circle = circle.data(nodes, function(d) { return d.id; });

  // update existing nodes (loop & selected visual states)
  var _id = -1;
  circle.selectAll('circle').each(function(d) { console.log( "checking: " + d.sid) ; if ( d.sid == act.speaker) _id = d.id; } );

  if ( _id > 0 ) {
	console.log("ALREADY have "+act.speaker);
  } else {
	console.log("NEED to add "+act.speaker);
	_id = _add_speaker(act.speaker, [
			Math.floor((Math.random() * width) + 1),
			Math.floor((Math.random() * height) + 1)
		]);
  }

  var _node = nodes[_id];
  console.log("node: "+ JSON.stringify(_node) );
  _node.msg=_cut_message(act.content);
  console.log("node+m: "+ JSON.stringify(_node) );

  restart(_id);
}

function _cut_message(msg) {
	if (msg.length > max_msg_length) {
		return msg.substr(0,17) + '...';
	} else {
		return msg;
	}
}


// app starts here
svg.on('mousedown', mousedown);

restart();

