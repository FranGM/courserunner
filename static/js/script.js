function radians (degrees) {return degrees * (Math.PI/180)}
function degrees (radians) {return radians * (180/Math.PI)}
function angle (cx, cy, px, py) {var x = px - cx; var y = py - cy; return Math.atan2 (y, x)}

function download_as_img() {
	main_stage.toDataURL({
		callback: function(dataURL) {
			dataURL = dataURL.replace("image/png", "image/octet-stream");
			document.location.href = dataURL;
		}
	});
}

function hide_imglink() {
	$("#imglink").hide(100);
}

function set_window_title() {
	document.title = $("#coursename").text() + " - GrumpyCat Agility Mapper";
}

function update_imglink() {
	main_stage.toDataURL({
		callback: function(dataURL) {
			$("#imglink").prop("href", dataURL);
			$("#imglink").prop("download", $("#coursename").text() + ".png");
			$("#imglink").show(100);
		}
	});
}

// Initialize all global structs that will be used
function init_global_structs() {
	window.mapper_structs = {}
	window.mapper_structs.undo_slots = []
	window.mapper_structs.tunnel_list = []

	set_canvas_dirty(false);
	set_window_title();

	window.mapper_structs.obstacle_defs = {
			theme: 'ablues',
			list: ['jump', 'doublejump', 'paneljump',  'table', 'aframe', 'weavepoles',
				   'seesaw', 'widejump', 'dogwalk', 'tirejump', 'collapsedtunnel']
	}

	window.mapper_structs.obstacle_list = [];
	window.mapper_structs.txttags = {list: []};
	window.mapper_structs.numbers = {next_free: 1,
									 list: []
									};
	// This is going to be shared by all obstacles that can be rotated,
	//		so it makes sense to generate it once and cache it here.
	window.mapper_structs.rotIconObj = new Image();
	window.mapper_structs.rotIconObj.src = "/static/img/icons/rotate.png";
}

function set_canvas_dirty(dirty) {
	if (dirty) {
		hide_imglink();
	}
	window.mapper_structs.dirty = dirty;
	enable_buttons();
}

function is_canvas_dirty() {
	return window.mapper_structs.dirty;
}

function add_to_undo() {
	$("#usrmsgcontainer").hide(500);
	window.mapper_structs.undo_slots.push(get_current_status());
	set_canvas_dirty(true);
	console.log("Undo after add: ", window.mapper_structs.undo_slots);
}

function undo() {
	var i = window.mapper_structs.undo_slots.length - 1;
	if (i >= 0) {
		load_status(window.mapper_structs.undo_slots[i], true);
		window.mapper_structs.undo_slots.splice(i, 1);
		console.log("Undo after restore: ", window.mapper_structs.undo_slots);
	}
	set_canvas_dirty(true);
	update_imglink();
}

function wipe_undo() {
	window.mapper_structs.undo_slots = [];
	set_canvas_dirty(false);
}

// XXX: Too long and unwieldy
function init_layers() {
	main_stage = new Kinetic.Stage({
		container: "maincontainer",
		// XXX: Hardcoded coordinates here
		width: 1000,
		height: 600
	});
	main_layer = new Kinetic.Layer();

	tb_stage = new Kinetic.Stage({
		container: "tbcontainer",
		// XXX: Hardcoded coordinates here
		width: 1000,
		height: 50,
	});
	tb_layer = new Kinetic.Layer();

	anchor_layer = new Kinetic.Layer({
		visible: false,
	});
	drag_anchor_layer = new Kinetic.Layer({
		visible: false,
	});
	line_layer = new Kinetic.Layer({
		visible: false,
	});
	curve_layer = new Kinetic.Layer();

	drag_anchor_layer.on('beforeDraw', function() {
		if (window.mapper_structs.anchor_dragged === undefined) {
		} else {
			var dragger = window.mapper_structs.anchor_dragged;
			var rel_x = dragger.anchor.getX() - dragger.x;
			var rel_y = dragger.anchor.getY() - dragger.y;
			dragger.x = dragger.anchor.getX();
			dragger.y = dragger.anchor.getY();
			var bz = dragger.anchor.bl.bezier;
			bz.start.setPosition(bz.start.getX() + rel_x,
				                 bz.start.getY() + rel_y);
			bz.control1.setPosition(bz.control1.getX() + rel_x,
				                    bz.control1.getY() + rel_y);
			bz.control2.setPosition(bz.control2.getX() + rel_x,
				                    bz.control2.getY() + rel_y);
			bz.end.setPosition(bz.end.getX() + rel_x,
				               bz.end.getY() + rel_y);
			anchor_layer.draw();
		}
	});

	anchor_layer.on('beforeDraw', function() {
		drawCurves();
		updateDottedLines();
	});
	// Hide/show tunnel anchors if mouse is/is not over canvas
	main_layer.getCanvas().element.onmouseout = function(evt){
		anchor_layer.hide();
		drag_anchor_layer.hide();
		line_layer.hide();
		update_imglink();
	};
	main_layer.getCanvas().element.onmouseover = function(evt){
		anchor_layer.show();
		drag_anchor_layer.show();
		line_layer.show();
		line_layer.draw();
		anchor_layer.draw();
		drag_anchor_layer.draw();
	};

	tb_layer.getCanvas().element.onmouseout = function(evt) {
		update_imglink();
	};

	main_stage.add(curve_layer);
	main_stage.add(line_layer);
	main_stage.add(anchor_layer);
	main_stage.add(drag_anchor_layer);
	main_stage.add(main_layer);

	// Add buttons to toolbar
	var button_initial_x = 10;
	var button_padding = 5;
	var icon_width = 30;

	for (var i = 0; i < window.mapper_structs.obstacle_defs.list.length; i++) {
			var obs = window.mapper_structs.obstacle_defs.list[i];

			drawButton(obs, button_initial_x, 10);
			button_initial_x += icon_width + button_padding; 
	}
	var obs_theme = window.mapper_structs.obstacle_defs.theme;
	// XXX: Put this in a nice loop or something pls!!
	drawGenericButton("/static/img/obstacles/" + obs_theme + "/icons/tunnel.png", button_initial_x, 10, addTunnel);
	button_initial_x += icon_width + button_padding; 
	drawGenericButton("/static/img/obstacles/" + obs_theme + "/icons/numbers.png", button_initial_x, 10, addNumber);
	button_initial_x += icon_width + button_padding; 
	drawGenericButton("/static/img/obstacles/" + obs_theme + "/icons/tags.png", button_initial_x, 10, addFreeText);
}

function clear_canvas() {
	var str = window.mapper_structs;

	for(var i = 0; i < str.obstacle_list.length; i++) {
		var obs = str.obstacle_list[i];
		obs.getParent().removeChildren();
	}
	str.obstacle_list = [];

	for(var i = 0; i < str.numbers.list.length; i++) {
		var lbl = str.numbers.list[i];
		lbl.remove();
	}
	str.numbers.list = [];
	str.numbers.next_free = 1;

	// XXX: Maybe we'll want to use the remove_tunnel function for this?
	for(var i = 0; i < str.tunnel_list.length; i++) {
		var bl = str.tunnel_list[i];
		bl.remove();
		bl.bezier.start.remove();
		bl.bezier.control1.remove();
		bl.bezier.control2.remove();
		bl.bezier.end.remove();
		bl.drag_anchor.remove();
	}
	str.tunnel_list = [];

	updateDottedLines();
	drawCurves();
	main_layer.draw();
}

// Load a given state into the canvas
function load_status(state, skip_undo) {

	$("#coursename").text(state.name);
	set_window_title();
	clear_canvas();

	console.log(state);
	console.log(state.name);
	console.log(state.tunnels);

	for(var i = 0; i < state.tunnels.length; i++) {
		addTunnel(state.tunnels[i], skip_undo);
	}

	for(var i = 0; i < state.tags.length; i++) {
		addNumber(state.tags[i], skip_undo);
	}

	for(var i = 0; i < state.txttags.length; i++) {
		addFreeText(state.txttags[i], skip_undo);
	}

	for(var i = 0; i < state.obstacles.length; i++) {
		addObstacle(state.obstacles[i].name, state.obstacles[i], skip_undo);
	}
}

// Load a given course from the backend
function load_status_from_backend(course_id) {
	$.getJSON('/courses/' + course_id, function(data) {
		console.log("Getting data from backend for course id:", course_id);
		wipe_undo();
		load_status(data, true);
		show_saved_url(course_id);
	});
}

// Returns the current object status so it can be serialized and stuff
function get_current_status() {
	var res = {
		tunnels: [],
		obstacles: [],
		tags: [],
		txttags: [],
	};
	var str = window.mapper_structs;
	// Go through the tunnels
	for (var i = 0; i < str.tunnel_list.length; i++) {
		var t = str.tunnel_list[i].bezier;
		// if you pass a pos object to addTunnel it will recreate this tunnel
		var pos = {start_x: t.start.getX(),
				   start_y: t.start.getY(),
				   control1_x: t.control1.getX(),
				   control1_y: t.control1.getY(),
				   control2_x: t.control2.getX(),
				   control2_y: t.control2.getY(),
				   end_x: t.end.getX(),
				   end_y: t.end.getY(),
				   colour: t.mapper_attrs.colour,
		}
		res.tunnels.push(pos);
	}

	// Go through obstacle list
	for (var i = 0; i < str.obstacle_list.length; i++) {
		// We need coordinates from the group and rotation from the shape
		var o = str.obstacle_list[i];
		var g = o.getParent();
		o.setRotation(o.getRotation());
		// XXX: What's this doing here? See if we can remove this
		main_layer.draw();
		var pos = {
			x: g.getX(),
			y: g.getY(),
			rot: o.getRotation(),
			name: o.obs_name,
		};

		res.obstacles.push(pos);
	}

	for (var i = 0; i < str.txttags.list.length; i++) {
		var n = str.txttags.list[i];

		var pos = {
			x: n.getX(),
			y: n.getY(),
			txt: n.pos_txt,
		};
		res.txttags.push(pos);
	}


	for (var i = 0; i < str.numbers.list.length; i++) {
		var n = str.numbers.list[i];

		var pos = {
			x: n.getX(),
			y: n.getY(),
			txt: parseInt(n.pos_txt),
		};

		res.tags.push(pos);
	}
	return res;
}

function set_waitmsg(msg, error) {
	console.log(msg);
	$("#waitmsg").text(msg);
	if (error) {
		$("#waitmsg").addClass('error');
		$("#waitmsg").click(function(evt) {
			$("#waitmsg").hide(300);
		});
	} else {
		$("#waitmsg").removeClass('error');
	}
}

function save_current_status(cb) {
	if (is_canvas_dirty()) {
		var state = get_current_status();
		state.name = $("#coursename").text();
		$.ajax({
			url: '/courses/',
			type: 'POST',
			data: JSON.stringify(state),
			contentType: 'application/json; charset=utf-8',
			dataType: 'json',
			async: true,
		}).done(function(msg) {
			console.log(msg);
			if (msg.error) {
				set_waitmsg(msg.error, true);
			} else {
				// Set cookie to remember last saved course, expiring in 30 days
				$.cookie("last_saved", msg.response, { path: '/', expires: 30});
				show_saved_url(msg.response, cb);
				set_canvas_dirty(false);
			}
		});
		set_waitmsg("Saving...");
		$("#waitmsg").show(100);
	} else {
		// We still need to do stuff if canvas is not dirty, like invoking callbacks...
		if (cb) {
			var id = $("#savedurl").prop("data");
			cb(id);
		}
	}
}

function create_saved_url(id, selector) {
	$(selector).text(window.location.host + '/course/' + id);
	$(selector).prop('href', '/course/' + id);
	$(selector).prop('data', id);
}

function enable_buttons() {
	console.log("canvas dirty:", is_canvas_dirty());
	$("#btnsave").attr("disabled", !is_canvas_dirty());
	$("#btnundo").attr("disabled", window.mapper_structs.undo_slots.length == 0);
	$("btngetimg").attr("disabled", false);
	$("#btnthreed").attr("disabled", false);
}

function show_saved_url(id, cb) {
	enable_buttons();
	$("#waitmsg").hide(100);
	create_saved_url(id, "#savedurl");
	var last_saved = $.cookie("last_saved", undefined, {path: '/'});
	console.log("Cookie is ", last_saved);
	if (last_saved) {
		create_saved_url(last_saved, "#lastsavedurl");
		$("#lastsaved_container").show(200);
	}
	$("#usrmsgcontainer").show(500);

	// Invoke the callback with the new id
	if (cb) {
		cb(id);
	}
}

function show_bin(show) {
	if (show) {
		window.mapper_structs.bin_img.show();
	} else {
		window.mapper_structs.bin_img.hide();
	}
	main_layer.draw();
}

// Returns true if the given object is touching the bin
function hits_bin(obj) {
	var pos = obj.getAbsolutePosition();
	return (pos.x > 930 && pos.y > 530);
}

// XXX: This is mainly copied from addNumber
function addFreeText(pos, skip_undo) {
	if (!skip_undo) {
		add_to_undo();
	}
	
	if (pos === undefined) {
		// XXX: Hardcoded coordinates
		var pos = {
			x: 400,
			y: 400,
			txt: window.prompt("Please enter text content", "Text")
		};
	}

	// XXX: What to do here if previous prompt was cancelled?
	var lbl = new Kinetic.Label({
		x: pos.x,
		y: pos.y,
		opacity: 0.75,
		draggable: true,
		text: {
			text: wrap_txt(pos.txt),
			fontFamily: 'Arial',
			fontSize: 15,
			padding: 5,
			fill: 'black'
		},
		rect: {
			fill: 'white',
		stroke: 'black',
		}
	});

	lbl.pos_txt = pos.txt;

	lbl.on('mouseover', function(evt) {
		document.body.style.cursor = 'pointer';
	});

	lbl.on('mouseout', function(evt) {
		document.body.style.cursor = 'default';
	});

	lbl.on('dragstart', function(evt) {
		add_to_undo();
		show_bin(true);
	});

	lbl.on('dragend', function(evt) {
		show_bin(false);
		if (hits_bin(lbl)) {
			lbl.remove();
			main_layer.draw();
			var elem_pos = window.mapper_structs.txttags.list.indexOf(lbl);
			window.mapper_structs.txttags.list.splice(elem_pos, 1);
		}
	});

	window.mapper_structs.txttags.list.push(lbl);
	main_layer.add(lbl);
	main_layer.draw();
}

function addNumber(pos, skip_undo) {
	if (!skip_undo) {
		add_to_undo();
	}
	
	if (pos === undefined) {
		// XXX: Hardcoded coordinates
		var pos = {
			x: 400,
			y: 400,
			txt: window.mapper_structs.numbers.next_free,
		};
	}
	var first_free = window.mapper_structs.numbers.next_free;
	next_free = first_free + 1;

	for (var i = 0; i < window.mapper_structs.numbers.list.length; i++) {
			var val = parseInt(window.mapper_structs.numbers.list[i].attrs.text.partialText);
			if (val == next_free) {
					next_free++;
			}
	}

	var lbl = new Kinetic.Label({
		x: pos.x,
		y: pos.y,
		opacity: 0.75,
		draggable: true,
		text: {
			text: first_free,
			fontFamily: 'Arial',
			fontSize: 15,
			padding: 5,
			fill: 'black'
		},
		rect: {
			fill: 'white',
		stroke: 'black',
		}
	});

	lbl.pos_txt = pos.txt;

	lbl.on('mouseover', function(evt) {
		document.body.style.cursor = 'pointer';
	});

	lbl.on('mouseout', function(evt) {
		document.body.style.cursor = 'default';
	});

	lbl.on('dragstart', function(evt) {
		add_to_undo();
		show_bin(true);
	});

	lbl.on('dragend', function(evt) {
		show_bin(false);
		if (hits_bin(lbl)) {
			lbl.remove();
			main_layer.draw();
			var elem_pos = window.mapper_structs.numbers.list.indexOf(lbl);
			window.mapper_structs.numbers.list.splice(elem_pos, 1);
			var val = parseInt(lbl.attrs.text.partialText);
			if (val < window.mapper_structs.numbers.next_free) {
				window.mapper_structs.numbers.next_free = val;
			}
		}
	});

	window.mapper_structs.numbers.list.push(lbl);
	window.mapper_structs.numbers.next_free = next_free;
	main_layer.add(lbl);
	main_layer.draw();
}

function addBin() {
	var imageObj = new Image();
	imageObj.src = "/static/img/bin.png";

	imageObj.onload = function() {
			window.mapper_structs.bin_img = new Kinetic.Image({
				image: imageObj,
				// XXX: Hardcoded coordinates here
				x: 930,
				y: 530,
				visible: false,
			});
			main_layer.add(window.mapper_structs.bin_img);
	}
}

function updateDottedLines() {
	for (var i = 0; i < window.mapper_structs.tunnel_list.length; i++) {
		var bl = window.mapper_structs.tunnel_list[i];

		var b = bl.bezier;

		bl.setPoints([b.start.getX(),
					  b.start.getY(),
					  b.control1.getX(),
					  b.control1.getY(),
					  b.control2.getX(),
					  b.control2.getY(),
					  b.end.getX(),
					  b.end.getY()]);
	}
	line_layer.draw();
}

function buildTunnelDragger(x, y, bl) {
	var anchor = new Kinetic.Circle({
		x: x,
		y: y,
		radius: 8,
		stroke: '#666',
		fill: 'red',
		strokeWidth: 1,
		draggable: true
	});

	// add hover styling
	anchor.on('mouseover', function(evt) {
		document.body.style.cursor = 'pointer';
		this.setStrokeWidth(4);
		drag_anchor_layer.draw();
	});
	anchor.on('mouseout', function(evt) {
		document.body.style.cursor = 'default';
		this.setStrokeWidth(2);
		drag_anchor_layer.draw();
	});

	anchor.on('dragstart', function(evt) {
		add_to_undo();
		show_bin(true);
		// Store our current coordinates so we can update all other anchors
		//   as we keep moving
		window.mapper_structs.anchor_dragged = {
			anchor: anchor,
			x: anchor.getX(),
			y: anchor.getY()
		}
	});

	anchor.on('dragend', function(evt) {
		window.mapper_structs.anchor_dragged = undefined;
		anchor_dragend(anchor);
	});

	// Link back to the tunnel we belong to
	anchor.bl = bl;

	drag_anchor_layer.add(anchor);
	drag_anchor_layer.draw();

	return anchor;
}

function buildAnchor(x, y, bl) {
	var anchor = new Kinetic.Circle({
		x: x,
		y: y,
		radius: 8,
		stroke: '#666',
		fill: '#ddd',
		strokeWidth: 1,
		draggable: true
	});

	// Link back to our parent tunnel
	anchor.bl = bl;

	// add hover styling
	anchor.on('mouseover', function(evt) {
		document.body.style.cursor = 'pointer';
		this.setStrokeWidth(4);
		anchor_layer.draw();
	});
	anchor.on('mouseout', function(evt) {
		document.body.style.cursor = 'default';
		this.setStrokeWidth(2);
		anchor_layer.draw();
	});

	anchor.on('dragstart', function(evt) {
		add_to_undo();
		anchor.bl.drag_anchor.hide();
		drag_anchor_layer.draw();
		show_bin(true);
	});

	anchor.on('dragend', function(evt) {
		if (anchor.drag_buddy === undefined) {
		} else {
			// XXX: The offset is hardcoded
			anchor.drag_buddy.setX(anchor.getX() + 10);
			anchor.drag_buddy.setY(anchor.getY() + 10);
		}
		anchor.bl.drag_anchor.show();
		drag_anchor_layer.draw();
		anchor_dragend(anchor);
	});

	anchor_layer.add(anchor);
	anchor_layer.draw();
	return anchor;
}

function anchor_dragend(anchor) {
	show_bin(false);
	if (hits_bin(anchor)) {
		remove_tunnel(anchor.bl);
		main_layer.draw();
		drag_anchor_layer.draw();
		anchor_layer.draw();
	} 
	drawCurves();
	updateDottedLines();
}

function remove_tunnel(bl) {
	bl.remove();
	bl.bezier.start.remove();
	bl.bezier.control1.remove();
	bl.bezier.control2.remove();
	bl.bezier.end.remove();
	bl.drag_anchor.remove();
	var pos_to_delete = -1;
	for (var i = 0; i < window.mapper_structs.tunnel_list.length; i++) {
			if (window.mapper_structs.tunnel_list[i] == bl) {
					pos_to_delete = i;
			}
	}
	window.mapper_structs.tunnel_list.splice(pos_to_delete, 1);
}

function drawCurves() {
	var canvas = curve_layer.getCanvas();
	canvas.clear();

	for (var i = 0; i < window.mapper_structs.tunnel_list.length; i++) {
			var bl = window.mapper_structs.tunnel_list[i];
			var context = canvas.getContext();

			// draw bezier
			context.beginPath();
			context.moveTo(bl.bezier.start.getX(), bl.bezier.start.getY());
			context.bezierCurveTo(bl.bezier.control1.getX(), bl.bezier.control1.getY(), bl.bezier.control2.getX(), bl.bezier.control2.getY(), bl.bezier.end.getX(), bl.bezier.end.getY());
			// XXX: Try to get more than one colour in the same tunnel
			context.strokeStyle = bl.bezier.mapper_attrs.colour;
			context.lineWidth = 30;
			context.stroke();
	}
}

function addTunnel(pos, skip_undo) {
	if (!skip_undo) {
		add_to_undo();
	}
	// XXX: Careful, hardcoded coordinates
	if (pos === undefined) {
		// XXX: Add more colours!!
		colour_list = ['blue', 'orange', 'red', 'green', 'magenta'];
		var randomIndex = Math.floor(Math.random()*colour_list.length);
		var x = 300;
		var y = 300;
		var pos = {
				start_x: x+30,
				start_y: y-30,
				control1_x: x,
				control1_y: y,
				control2_x: x + 5,
				control2_y: y + 5,
				end_x: x + 20,
				end_y: y + 20,
				colour: colour_list[randomIndex],
		};
	}
	var bl = new Kinetic.Line({
		dashArray: [10, 10, 0, 10],
		strokeWidth: 3,
		stroke: 'black',
		lineCap: 'round',
		opacity: 0.8,
		points: [0, 0],
	});

	bl.bezier = {
		start: buildAnchor(pos.start_x, pos.start_y, bl),
		control1: buildAnchor(pos.control1_x, pos.control1_y, bl),
		control2: buildAnchor(pos.control2_x, pos.control2_y, bl),
		end: buildAnchor(pos.end_x, pos.end_y, bl),
	};

	bl.drag_anchor = buildTunnelDragger(pos.start_x+10, pos.start_y + 10, bl);
	bl.bezier.start.drag_buddy = bl.drag_anchor;

	bl.bezier.mapper_attrs = {
		colour: pos.colour,
	}

	anchor_layer.draw();
	drag_anchor_layer.draw();

	window.mapper_structs.tunnel_list.push(bl);

	line_layer.add(bl);

	drawCurves();
	updateDottedLines();
}

// Draw a button on the given coordinates with specified callback
function drawGenericButton(icon_url, pos_x, pos_y, cb) {
	var imageObj = new Image();
	imageObj.src = icon_url;

	imageObj.onload = function() {
		var img = new Kinetic.Image({
			image: imageObj,
			x: pos_x,
			y: pos_y,
		});

		// add cursor styling
		img.on('mouseover', function(evt) {
			document.body.style.cursor = 'pointer';
		});
		img.on('click', function(evt) {
				cb();
		});
		img.on('mouseout', function(evt) {
			document.body.style.cursor = 'default';
		});

		tb_layer.add(img);
		tb_stage.add(tb_layer);
	}
}

function drawButton(obs, pos_x, pos_y) {
	var imageObj = new Image();
	imageObj.src = '/static/img/obstacles/' + window.mapper_structs.obstacle_defs.theme + "/icons/" + obs + ".png";

	imageObj.onload = function() {

			var img = new Kinetic.Image({
				image: imageObj,
				x: pos_x,
				y: pos_y,
			});

			// add cursor styling
			img.on('mouseover', function(evt) {
				document.body.style.cursor = 'pointer';
			});
			img.on('click', function(evt) {
				addObstacle(obs);
			});
			img.on('mouseout', function(evt) {
				document.body.style.cursor = 'default';
			});

			tb_layer.add(img);
			tb_stage.add(tb_layer);
	}
}

function create_rot_icon(grp, img) {
	var icon = new Kinetic.Image({
			image: window.mapper_structs.rotIconObj,
			visible: false,
			draggable: true,
	});

	icon.setOffset(icon.getWidth()/2, icon.getHeight()/2);

	function rotate_listener(evt) {
		img.setRotation(angle(img.getX(), img.getY(),
							  icon.getX(), icon.getY()));
	}

	icon.on('mouseover', function(evt){
		document.body.style.cursor = 'crosshair';
	});

	icon.on('mouseout', function(evt){
		document.body.style.cursor = 'default';
	});

	icon.on('dragstart', function(evt){
		add_to_undo();
		main_stage.getContainer().addEventListener('mousemove', rotate_listener);
	});

	icon.on('dragend', function(evt){
		main_stage.getContainer().removeEventListener('mousemove', rotate_listener);
		// Go back to the center of the image
		this.transitionTo({
			x: 0,
			y: 0,
			duration: 0.1,
			callback: function() {
				icon.hide();
			}
		});
	});
	
	icon.on('mousedown', function(evt){
		evt.cancelBubble = true;
	});

	return icon;
}

function addObstacle(obs, pos, skip_undo) {
	if (!skip_undo) {
		add_to_undo();
	}
	if (pos === undefined) {
		var pos = {
			// XXX: Hardcoded coordinates
			x: 200,
			y: 200,
			rot: 0,
		}
	} 

	var imageObj = new Image();
	imageObj.src = '/static/img/obstacles/' + window.mapper_structs.obstacle_defs.theme + "/img/" + obs + ".png";

	imageObj.onload = function() {
		var grp = new Kinetic.Group({
				x: pos.x,
				y: pos.y,
				draggable: true,
		});

		var img = new Kinetic.Image({
			image: imageObj,
		});

		img.obs_name = obs;

		img.setOffset(img.getWidth()/2, img.getHeight()/2);
		img.setRotation(pos.rot);

		var icon = create_rot_icon(grp, img);

		grp.add(img);
		grp.add(icon);

		window.mapper_structs.obstacle_list.push(img);
		var img_pos = window.mapper_structs.obstacle_list.length - 1;

		grp.on('mouseover', function() {
			document.body.style.cursor = 'pointer';
			icon.show();
			main_layer.draw();
		});

		img.on('mouseout', function() {
			document.body.style.cursor = 'default';
			icon.hide();
			main_layer.draw();
		});

		grp.on('dragstart', function(evt) {
			add_to_undo();
			show_bin(true);
		});

		grp.on('dragend', function(evt) {
			show_bin(false);
			if (hits_bin(grp)) {
				grp.remove();
				window.mapper_structs.obstacle_list.splice(img_pos, 1);
				document.body.style.cursor = 'pointer';
			}
			main_layer.draw();
		});

		main_layer.add(grp);
		main_stage.add(main_layer);

		// Link back to obstacle object we come from
		img.obstacle = obs;
	}
}
