// Load a given course from the backend
function load_state_from_backend(course_id) {
	$.getJSON('/courses/' + course_id, function(data) {
		console.log("Getting data from backend for course id:", course_id);
		$("#courseid").text(course_id);
		load_state(data);
	});
}

// Load a given state into the canvas
function load_state(state) {

	document.title = state.name + " - GrumpyCat Agility Mapper";

	for(var i = 0; i < state.tunnels.length; i++) {
		addTunnel(state.tunnels[i]);
	}

	for(var i = 0; i < state.tags.length; i++) {
		addTag(state.tags[i]);
	}

	for(var i = 0; i < state.txttags.length; i++) {
		addTag(state.txttags[i]);
	}

	var obstacleFuncs = {
		'jump': addJump,
		'paneljump': addPanelJump,
		'doublejump': addDoubleJump,
		'collapsedtunnel': addCollapsedTunnel,
		'aframe': addAFrame,
		'seesaw': addSeeSaw,
		'weavepoles': addWeavePoles,
		'tirejump': addTireJump,
		'dogwalk': addDogWalk,
		'table': addTable,
		'widejump': addWideJump,
	};

	for(var i = 0; i < state.obstacles.length; i++) {
		console.log(state.obstacles[i].name);
		obstacleFuncs[state.obstacles[i].name](state.obstacles[i]);
	}
}

function addObstacle(pos) {
	var jsonLoader = new THREE.JSONLoader();
	jsonLoader.load("/static/models/" + pos.name +".js", function(geometry, materials) {
		console.log("Calling loader");
		addModelToScene(geometry, materials, pos);
	});
}

function addModelToScene(geometry, materials, pos) {
	var material = new THREE.MeshFaceMaterial(materials);
	mesh = new THREE.Mesh(geometry, material);
	mesh.scale.set(10,10,10);
	mesh.position.set(pos.x, 0, pos.y);
	mesh.rotation.y = pos.rot;
	scene.add(mesh);
}

function addTag(pos) {
	console.log("pushing into ", pos);
	var materialArray = [new THREE.MeshBasicMaterial({color: 0xff0000}),
						 new THREE.MeshBasicMaterial({color: 0x000088})];
	var font_size = 15;
	var font_height = 4;
	var font_bevel = true
	if (String(pos.txt).length > 3) {
		font_size = 5;
		font_bevel = false;
		font_height = 2;
	}
	console.log(String(pos.txt));
	var arraytxt = wrap_txt(String(pos.txt)).split('\n');
	console.log(arraytxt);
	var heights = 0;
	for (var i = arraytxt.length - 1; i >= 0; i--) {
		var textGeom = new THREE.TextGeometry(arraytxt[i], {
				size: font_size, height: font_height, curveSegments: 3,
				font: "helvetiker", style: "normal", weight: "bold",
				bevelThickness: 1, bevelSize: 2, bevelEnabled: font_bevel,
				material: 0, extrudeMaterial: 1
		});

		var textMaterial = new THREE.MeshFaceMaterial(materialArray);
		var textMesh = new THREE.Mesh(textGeom, textMaterial);

		THREE.GeometryUtils.center( textGeom );
		textGeom.computeBoundingBox();
		var textWidth = textGeom.boundingBox.max.x - textGeom.boundingBox.min.x;
		var textHeight = textGeom.boundingBox.max.y - textGeom.boundingBox.min.y;

		textMesh.position.set(pos.x, heights + (textHeight/2), pos.y);
		scene.add(textMesh);

		number_list.push(textMesh);
		heights += textHeight;
	}
}

function addTunnel(pos) {
	var radius = 7;
	var y = radius;
	v0 = new THREE.Vector3(pos.start_x, y, pos.start_y);
	v1 = new THREE.Vector3(pos.control1_x, y, pos.control1_y);
	v2 = new THREE.Vector3(pos.control2_x, y, pos.control2_y);
	v3 = new THREE.Vector3(pos.end_x, y, pos.end_y);

	var c = new THREE.CubicBezierCurve3(v0,v1,v2,v3);
	var path = new THREE.TubeGeometry(c, 500, radius);

	var mesh = new THREE.Mesh(path, new THREE.MeshLambertMaterial({
		color: pos.colour,
		wireframe: true,
	}));
	scene.add(mesh);
}

function animate()
{
    requestAnimationFrame(animate);
	render();		
	update();
}

function enableCamChanges() {
	canChangeCamera = true;
}

function update()
{
        // delta = change in time since last call (seconds)
        var delta = clock.getDelta(); 
        var moveDistance = 100 * delta;

	// Toggle camera from chase to top (have to wait .3 seconds to change again!)
	if (canChangeCamera && keyboard.pressed("c")) {
		isChaseCameraActive = !isChaseCameraActive;
		canChangeCamera = false;
		var timer = setTimeout(enableCamChanges, 300);
	}

        walking = false;
        // move forwards / backwards
        if (keyboard.pressed("down")) {
                android.translateZ(-moveDistance);
		walking = true;
	}
        if (keyboard.pressed("up")) {
                android.translateZ(moveDistance);
		walking = true;
	}
        // rotate left/right
        if (keyboard.pressed("left")) {
                android.rotation.y += delta;
		walking = true;
	}
        if (keyboard.pressed("right")) {
                android.rotation.y -= delta;
		walking = true;
	}
       
	controls.update();

	// If the model hasn't been loaded we have nothing to follow yet!
	if (android) {
		var relativeCameraOffset = new THREE.Vector3(0,20,-20);
		var chaseCameraOffset = relativeCameraOffset.applyMatrix4(android.matrix);
		chaseCamera.position.set(chaseCameraOffset.x, chaseCameraOffset.y, chaseCameraOffset.z);
		chaseCamera.lookAt(android.position);
	}
}

function render()
{
	var PIseconds = Date.now() * Math.PI;

	// Rotate the numbers in the course for greater visibility
	for (var i = 0; i < number_list.length; i++) {
		number_list[i].rotation.y = PIseconds*0.0002;// * (i % 2 ? 1 : -1);
	}

        if ( android && walking ) // exists / is loaded 
        {
                // Alternate morph targets
                var time = new Date().getTime() % duration;
                var keyframe = Math.floor(time / interpolation) + animOffset;
                if ( keyframe != currentKeyframe ) 
                {
                        android.morphTargetInfluences[lastKeyframe] = 0;
                        android.morphTargetInfluences[currentKeyframe] = 1;
                        android.morphTargetInfluences[keyframe] = 0;
                        lastKeyframe = currentKeyframe;
                        currentKeyframe = keyframe;
                }
                android.morphTargetInfluences[keyframe] = 
                        (time % interpolation) / interpolation;
                android.morphTargetInfluences[lastKeyframe] = 
                        1 - android.morphTargetInfluences[keyframe];
        }

	if (isChaseCameraActive) {
		renderer.render(scene, chaseCamera);
	} else {
		renderer.render(scene, topCamera);
	}
}

function initialize_scene() {
	
	// TODO: Group these in a struct or something
	// Animation related global vars
	android = undefined;
	animOffset       = 0;   // starting frame of animation
	walking         = false;
	duration        = 1000; // milliseconds to complete animation
	keyframes       = 20;   // total number of animation frames
	interpolation   = duration / keyframes; // milliseconds per frame
	lastKeyframe    = 0;    // previous keyframe
	currentKeyframe = 0;

	// Allow the camera to be changed
	canChangeCamera = true;

	// Set up the scene
	scene = new THREE.Scene();
	scene.position.set(500, 0, 500);
	// Set up camera
	var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
	var VIEW_ANGLE = 90, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 20000;
	topCamera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
	scene.add(topCamera);
	topCamera.position.set(1000, 500, 1000);
	topCamera.lookAt(scene.position);	

	chaseCamera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
	scene.add(chaseCamera);

	// Initialize renderer
	if (Detector.webgl) {
		renderer = new THREE.WebGLRenderer( {antialias:true} );
	} else {
		renderer = new THREE.CanvasRenderer();
	}
	renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
	container = document.createElement('div');
	document.body.appendChild(container);
	container.appendChild(renderer.domElement);
	// Change camera perspective on window resize
	THREEx.WindowResize(renderer, topCamera);
	THREEx.WindowResize(renderer, chaseCamera);
	// Set up trackball controls and keyboard
	controls = new THREE.TrackballControls(topCamera);
	console.log("initializing keyboard");
	keyboard = new THREEx.KeyboardState();

	// Set up lighting
	var light = new THREE.PointLight(0xffffff);
	light.position.set(-100,200,100);
	scene.add(light);
	// Set up floor
	var floorTexture = new THREE.ImageUtils.loadTexture('/static/img/GrassTexture.png');
	floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
	floorTexture.repeat.set(10, 10);
	var floorMaterial = new THREE.MeshBasicMaterial({map: floorTexture, side: THREE.DoubleSide});
	var floorGeometry = new THREE.PlaneGeometry(2000, 2000, 10, 10);
	var floor = new THREE.Mesh(floorGeometry, floorMaterial);
	floor.position.set(0, -0.5, 0);
	floor.rotation.x = Math.PI / 2;
	scene.add(floor);

	var ambientLight = new THREE.AmbientLight(0x111111);
	scene.add(ambientLight);

	// Note: if imported model appears too dark,
	//   add an ambient light in this file
	//   and increase values in model's exported .js file
	//    to e.g. "colorAmbient" : [0.75, 0.75, 0.75]

	number_list = [];
}

function addAndroidToScene( geometry, materials )
{
	// Preparing animation
	for (var i = 0; i < materials.length; i++) {
		materials[i].morphTargets = true;
	}
	var material = new THREE.MeshFaceMaterial(materials);
	android = new THREE.Mesh(geometry, material);
	android.scale.set(4,4,4);
	scene.add(android);
}

