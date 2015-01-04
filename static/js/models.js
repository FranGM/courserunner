
function addGroup(meshes, pos, initial_rotation) {
	if (initial_rotation === undefined) {
		var initial_rotation = Math.PI/2;
	}

	var grp = new THREE.Object3D();

	for (var i = 0; i < meshes.length; i++) {
		grp.add(meshes[i]);
	}
	grp.position.set(pos.x, 0, pos.y);
	grp.rotation.y = initial_rotation - pos.rot;
	scene.add(grp);
}

// 20x20 px
// 100x100 cm (height: 60 cm)
function addTable(pos) {
	var proportion = 5;

	var width = 100/proportion;
	var height = 60/proportion;
	var thickness = 2;

	var material = new THREE.MeshNormalMaterial();

	var geom_pole = new THREE.CylinderGeometry(1, 1, height);

	var mesh_pole1 = new THREE.Mesh(geom_pole, material);
	var mesh_pole2 = new THREE.Mesh(geom_pole, material);
	var mesh_pole3 = new THREE.Mesh(geom_pole, material);
	var mesh_pole4 = new THREE.Mesh(geom_pole, material);

	var geom_table = new THREE.CubeGeometry(width, width, thickness);
	var mesh_table = new THREE.Mesh(geom_table, material);

	mesh_table.position.y = height;
	mesh_table.rotation.x = Math.PI/2;

	// XXX: This can be trimmed down by creating a mesh_pole array and looping through it
	// Place the legs of the table in place
	// (the -1/+1 bits are for accounting for bad math)
	mesh_pole1.position.set(-width/2 + 1, height/2, -width/2 + 1);
	mesh_pole2.position.set(width/2 - 1, height/2, -width/2 + 1);
	mesh_pole3.position.set(-width/2 + 1, height/2, width/2 - 1);
	mesh_pole4.position.set(width/2 - 1, height/2, width/2 - 1);

	var meshes = [mesh_table, mesh_pole1, mesh_pole2, mesh_pole3, mesh_pole4];
	addGroup(meshes, pos);
}

// 30x30 px
function addWideJump(pos) {
	var proportion = 4;
	var width = 120/proportion;
	var height = 15/proportion;
	var num_planks = 5;
	var depth = 15/proportion;
	var plank_separation = 12/proportion;
	var pole_height = 120/proportion;

	var material = new THREE.MeshNormalMaterial();
	var grp = new THREE.Object3D();

	var geom_pole = new THREE.CylinderGeometry(1, 1, pole_height);
	var mesh_pole1 = new THREE.Mesh(geom_pole, material);
	var mesh_pole2 = new THREE.Mesh(geom_pole, material);
	var mesh_pole3 = new THREE.Mesh(geom_pole, material);
	var mesh_pole4 = new THREE.Mesh(geom_pole, material);

	var geom = new THREE.CubeGeometry(width, height, depth);

	var pos_x = -num_planks/2 * (plank_separation + depth);
	var meshes = [mesh_pole1, mesh_pole2, mesh_pole3, mesh_pole4];
	for (var i = 0; i < num_planks; i++) {
		var mesh = new THREE.Mesh(geom, material);
		mesh.position.set(0, height/2, pos_x);
		meshes.push(mesh);
		pos_x += plank_separation + depth;
	}
	// XXX: Are these two used?
	var geom = new THREE.CubeGeometry(width, height, 2);
	var mesh = new THREE.Mesh(geom, material);

	// XXX: This can be put in a loop and trimmed down a little
	mesh_pole1.position.set(width/2, pole_height/2, -num_planks/2 * (plank_separation + depth));
	mesh_pole2.position.set(-width/2, pole_height/2, -num_planks/2 * (plank_separation + depth));
	mesh_pole3.position.set(width/2, pole_height/2, num_planks/2 * (plank_separation + depth));
	mesh_pole4.position.set(-width/2, pole_height/2, num_planks/2 * (plank_separation + depth));

	addGroup(meshes, pos);
}

function addDogWalk(pos) {
	var proportion = 5.08;
	var plank_length = 420/proportion;
	var angle = 0.2967; // 17 degrees
	var height = 120/proportion;
	var full_length = 1220/proportion;
	var width = 5;

	var material = new THREE.MeshNormalMaterial();

	var geom_plank = new THREE.CubeGeometry(2, plank_length, width);

	var mesh_plank = new THREE.Mesh(geom_plank, material);

	var mesh_sideplank1 = new THREE.Mesh(geom_plank, material);
	var mesh_sideplank2 = new THREE.Mesh(geom_plank, material);

	mesh_plank.position.y = height;
	mesh_plank.rotation.set(0, Math.PI/2, Math.PI/2);

	// The -5/+5 bit accounts for bad math!
	mesh_sideplank1.position.set(0, height/2, -plank_length + 5);
	mesh_sideplank2.position.set(0, height/2, plank_length - 5);

	mesh_sideplank1.rotation.set(Math.PI/2 - angle, Math.PI/2, 0);
	mesh_sideplank2.rotation.set(-Math.PI/2 + angle, Math.PI/2, 0);

	var meshes = [mesh_plank, mesh_sideplank1, mesh_sideplank2];
	addGroup(meshes, pos);
}

// 50x30 px
function addTireJump(pos) {
	var proportion = 3;
	var width = 120/proportion;
	var height = 150/proportion;

	var tire_radius = 30/proportion;
	var tire_thickness = 3;

	var material = new THREE.MeshNormalMaterial();

	var geom_pole = new THREE.CylinderGeometry(1, 1, height, height, 4);
	var geom_upper_pole = new THREE.CylinderGeometry(1, 1, width);
	var geom_tire = new THREE.TorusGeometry(tire_radius, tire_thickness, 20, 20);

	var mesh_pole1 = new THREE.Mesh(geom_pole, material);
	var mesh_pole2 = new THREE.Mesh(geom_pole, material);
	var mesh_upper_pole = new THREE.Mesh(geom_upper_pole, material);
	var mesh_lower_pole = new THREE.Mesh(geom_upper_pole, material);

	var mesh_tire = new THREE.Mesh(geom_tire, material);

	mesh_tire.position.y = height/2;

	mesh_pole1.position.set(-width/2, height/2, 0);
	mesh_pole2.position.set(width/2, height/2, 0);

	mesh_upper_pole.position.y = height;
	mesh_upper_pole.rotation.z = Math.PI/2;

	mesh_lower_pole.position.y = 2;
	mesh_lower_pole.rotation.z = Math.PI/2;

	var meshes = [mesh_pole1, mesh_pole2, mesh_upper_pole, mesh_lower_pole, mesh_tire];
	addGroup(meshes, pos);
}

// Length in pixels: 160
// Length in cm: 660 (just counting the gaps: 60 * 11)
function addWeavePoles(pos) {
	var proportion = 4.125;
	var radius = 1;
	var height = 100/proportion;
	var num_poles = 12;
	var pole_separation = 60/proportion;

	var material = new THREE.MeshNormalMaterial();

	var geom = new THREE.CylinderGeometry(radius, radius, height);
	var pos_x = -num_poles/2 *pole_separation;
	var meshes = [];
	for (var i = 0; i < num_poles; i++) {
		var mesh = new THREE.Mesh(geom, material);
		mesh.position.set(pos_x, height/2, 0);
		meshes.push(mesh);
		pos_x += pole_separation;
	}
	addGroup(meshes, pos, 0);
}

function addSeeSaw(pos) {
	var proportion = 8.78; // 82 pixels long
	var angle = 0.20; // should be 9.6 degrees, it's a bit more
	var height = 61/proportion;
	var plank_length = 366/proportion;
	var full_length = 720/proportion;
	var width = 10;

	var material = new THREE.MeshNormalMaterial();

	var geom_pillar = new THREE.CubeGeometry(width, height/2, 2);
	var mesh_pillar = new THREE.Mesh(geom_pillar, material);

	mesh_pillar.position.y = height/4;

	var geom = new THREE.CubeGeometry(width, plank_length, 2);
	var mesh = new THREE.Mesh(geom, material);

	mesh.position.y = height/2;

	mesh.rotation.x = Math.PI/2 - angle;

	var meshes = [mesh_pillar, mesh];
	addGroup(meshes, pos);
}

function addAFrame(pos) {
	// total length = 420cm (90 pixels in 2d)
	var proportion = 4.6;
	var angle = 1.78; //102 degrees
	var plank_length = 270/proportion;
	var height = 170/proportion;
	var total_length = 420/proportion;
	var width = 90/proportion;

	var material = new THREE.MeshNormalMaterial();
	// last param for CubeGeometry is depth, in case you were wondering (I know I was)
	var geom = new THREE.CubeGeometry(width, plank_length, 2);
	var mesh1 = new THREE.Mesh(geom, material);
	var mesh2 = new THREE.Mesh(geom, material);

	mesh1.position.set(0, height/2, -total_length/4);
	mesh2.position.set(0, height/2, total_length/4);

	mesh1.rotation.x = angle/2;
	mesh2.rotation.x = -angle/2;

	addGroup([mesh1, mesh2], pos);
}

// XXX: Too long, can probably be trimmed down a little
function addJump(pos) {
	// width = 50px
	var proportion = 4; // 200cm / 50px
	var pole_length = 120 / proportion;
	var pole_height = 65 / proportion;
	var support_length = 100 / proportion;
	var outer_support_length = 75 / proportion;
	var middle_support_length = 90 / proportion;

	var height = 10;
	var pole_radius = 1;
	var width = 10;
	var gap = 40 / proportion;

	var material = new THREE.MeshNormalMaterial();

	var geom_pole =    new THREE.CylinderGeometry(pole_radius, pole_radius, pole_length, pole_length, 4);
	var support_pole = new THREE.CylinderGeometry(pole_radius, pole_radius, support_length);

	var outer_support_pole = new THREE.CylinderGeometry(pole_radius, pole_radius, outer_support_length);

	var middle_support_pole = new THREE.CylinderGeometry(pole_radius, pole_radius, middle_support_length);

	var mesh_middle_support1 = new THREE.Mesh(middle_support_pole, material);
	var mesh_middle_support2 = new THREE.Mesh(middle_support_pole, material);

	var mesh_pole = new THREE.Mesh(geom_pole, material);
	var mesh_support1 = new THREE.Mesh(support_pole, material);
	var mesh_support2 = new THREE.Mesh(support_pole, material);

	var mesh_outer_support1 = new THREE.Mesh(outer_support_pole, material);
	var mesh_outer_support2 = new THREE.Mesh(outer_support_pole, material);

	mesh_pole.position.set(0, pole_height, 0);
	mesh_pole.rotation.set(Math.PI/2, 0, Math.PI);

	mesh_support1.position.set(0, support_length/2, -pole_length/2);
	mesh_support2.position.set(0, support_length/2, pole_length/2);

	mesh_outer_support1.position.set(0, outer_support_length/2, mesh_support1.position.z - gap);
	mesh_outer_support2.position.set(0, outer_support_length/2, mesh_support2.position.z + gap);

	mesh_middle_support1.position.set(0, middle_support_length/2, mesh_support1.position.z - gap/2);
	mesh_middle_support2.position.set(0, middle_support_length/2, mesh_support2.position.z + gap/2);

	var meshes = [mesh_pole, mesh_support1, mesh_support2, mesh_outer_support1, mesh_outer_support2,
		          mesh_middle_support1, mesh_middle_support2];
	addGroup(meshes, pos);
}

// XXX: Too long, can probably be trimmed down a little
function addPanelJump(pos) {
	// width = 50px
	var proportion = 4; // 200cm / 50px
	var pole_length = 120 / proportion;
	var pole_height = 65 / proportion;
	var support_length = 100 / proportion;
	var outer_support_length = 75 / proportion;
	var middle_support_length = 90 / proportion;

	var height = 10;
	var pole_radius = 1;
	var width = 10;
	var gap = 40 / proportion;

	var material = new THREE.MeshNormalMaterial();

	var geom_wall =    new THREE.CubeGeometry(pole_radius, pole_height, pole_length);
	var mesh_pole = new THREE.Mesh(geom_wall, material);

	var support_pole = new THREE.CylinderGeometry(pole_radius, pole_radius, support_length);

	var outer_support_pole = new THREE.CylinderGeometry(pole_radius, pole_radius, outer_support_length);

	var middle_support_pole = new THREE.CylinderGeometry(pole_radius, pole_radius, middle_support_length);

	var mesh_middle_support1 = new THREE.Mesh(middle_support_pole, material);
	var mesh_middle_support2 = new THREE.Mesh(middle_support_pole, material);

	var mesh_support1 = new THREE.Mesh(support_pole, material);
	var mesh_support2 = new THREE.Mesh(support_pole, material);

	var mesh_outer_support1 = new THREE.Mesh(outer_support_pole, material);
	var mesh_outer_support2 = new THREE.Mesh(outer_support_pole, material);

	mesh_pole.position.y = pole_height/2;

	mesh_support1.position.set(0, support_length/2, -pole_length/2);
	mesh_support2.position.set(0, support_length/2, pole_length/2);

	mesh_outer_support1.position.set(0, outer_support_length/2, mesh_support1.position.z - gap);
	mesh_outer_support2.position.set(0, outer_support_length/2, mesh_support2.position.z + gap);

	mesh_middle_support1.position.set(0, middle_support_length/2, mesh_support1.position.z - gap/2);
	mesh_middle_support2.position.set(0, middle_support_length/2, mesh_support2.position.z + gap/2);

	var meshes = [mesh_pole, mesh_support1, mesh_support2, mesh_outer_support1, mesh_outer_support2,
		          mesh_middle_support1, mesh_middle_support2];
	addGroup(meshes, pos);
}

function addCollapsedTunnel(pos) {
	var proportion = 4;
	var tunnel_radius = 30/proportion;
	var tunnel_length = 90/proportion;
	var collapsed_length = 200/proportion;
	var material = new THREE.MeshNormalMaterial();

	var collapsed_geom = new THREE.CylinderGeometry(tunnel_radius, tunnel_radius + 10, tunnel_length + 20);
	var collapsed_mesh = new THREE.Mesh(collapsed_geom, material);

	var tun = new THREE.CylinderGeometry(tunnel_radius, tunnel_radius, tunnel_length*2 + 10);
	var mesh_tun = new THREE.Mesh(tun, material);

	mesh_tun.position.z = -tunnel_length;
	mesh_tun.rotation.x = Math.PI/2;
	mesh_tun.position.y = tunnel_radius - 2;

	collapsed_mesh.rotation.x = -Math.PI/3;
	collapsed_mesh.position.y = -3;
	collapsed_mesh.position.z = tunnel_length/2;

	addGroup([mesh_tun, collapsed_mesh], pos);
}

// XXX: Too long, can probably be trimmed down a little
function addDoubleJump(pos) {
	console.log('Adding double jump');
	// width = 50px
	var proportion = 4; // 200cm / 50px
	var pole_length = 120 / proportion;
	var pole_height = 65 / proportion;
	var support_length = 100 / proportion;
	var outer_support_length = 75 / proportion;
	var middle_support_length = 90 / proportion;

	var height = 10;
	var pole_radius = 1;
	var width = 10;
	var gap = 40 / proportion;

	var material = new THREE.MeshNormalMaterial();

	var geom_pole = new THREE.CylinderGeometry(pole_radius, pole_radius, pole_length);
	var mesh_pole = new THREE.Mesh(geom_pole, material);
	var mesh_pole2 = new THREE.Mesh(geom_pole, material);
	var mesh_pole3 = new THREE.Mesh(geom_pole, material);

	var support_pole = new THREE.CubeGeometry(support_length, pole_radius, 10);
	var outer_support_pole = new THREE.CubeGeometry(outer_support_length, pole_radius, 10);
	var middle_support_pole = new THREE.CubeGeometry(middle_support_length, pole_radius, 10);

	var mesh_middle_support1 = new THREE.Mesh(middle_support_pole, material);
	var mesh_middle_support2 = new THREE.Mesh(middle_support_pole, material);

	var mesh_support1 = new THREE.Mesh(support_pole, material);
	var mesh_support2 = new THREE.Mesh(support_pole, material);

	var mesh_outer_support1 = new THREE.Mesh(outer_support_pole, material);
	var mesh_outer_support2 = new THREE.Mesh(outer_support_pole, material);

	mesh_pole.position.y = pole_height;
	mesh_pole.rotation.set(Math.PI/2, 0, Math.PI);

	mesh_pole2.position.set(5, pole_height - 5, 0);
	mesh_pole2.rotation.set(Math.PI/2, 0, Math.PI);

	mesh_pole3.position.set(10, pole_height - 10, 0);
	mesh_pole3.rotation.set(Math.PI/2, 0, Math.PI);

	mesh_support1.position.set(5, support_length/2, -pole_length/2);
	mesh_support2.position.set(5, support_length/2, pole_length/2);

	mesh_outer_support1.position.set(5, outer_support_length/2, mesh_support1.position.z - gap);
	mesh_outer_support2.position.set(5, outer_support_length/2, mesh_support2.position.z + gap);

	mesh_middle_support1.position.set(5, middle_support_length/2, mesh_support1.position.z - gap/2);
	mesh_middle_support2.position.set(5, middle_support_length/2, mesh_support2.position.z + gap/2);

	mesh_outer_support1.rotation.set(Math.PI/2, Math.PI/2, 0);
	mesh_outer_support2.rotation.set(Math.PI/2, Math.PI/2, 0);

	mesh_support1.rotation.set(Math.PI/2, Math.PI/2, 0);
	mesh_support2.rotation.set(Math.PI/2, Math.PI/2, 0);

	mesh_middle_support1.rotation.set(Math.PI/2, Math.PI/2, 0);
	mesh_middle_support2.rotation.set(Math.PI/2, Math.PI/2, 0);

	var meshes = [mesh_pole, mesh_pole2, mesh_pole3, mesh_support1,
				  mesh_support2, mesh_outer_support1, mesh_outer_support2,
				  mesh_middle_support1, mesh_middle_support2];
	addGroup(meshes, pos);
}

