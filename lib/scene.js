import { vec3, mat4 } from 'https://cdn.skypack.dev/gl-matrix';	
import { Sphere } from './sphere.js';
import { Quad } from './quad.js';
import { Mesh } from './mesh.js';
import { ObjReader } from './objReader.js';
import { BVH } from './BVH/bvh.js';
// import { ZCurve } from 'https://cdn.skypack.dev/@thi.ng/morton';

export class Scene {

	constructor() {
		this.mats = [];
		this.material_id = 0;
		this.material_dict = {};

		this.global_id = 0;
		this.sphere_id = 0;
		this.quad_id = 0;
		this.triangle_id = 0;
		this.mesh_id = 0;
		this.triangle_offset = 0;
		this.spheres = [];
		this.quads = [];
		this.triangles = [];
		this.meshes = [];
		this.objs = [];
		this.lights = [];

		this.create_spheres();
		this.create_quads();

		// const z = new ZCurve(3, 12);
		// console.log(z.encode([60000, 30000, 20000]))
	}

	create_spheres() {

		this.add_material("default", 0, [1, 0, 0], [0, 0, 0], [0, 0, 0], 0, 0, 0);
		let temp = [0.94, 0.70, 0.75];
		this.spheres.push(
			// new Sphere([1000, 0, 0], 0.3, this.global_id++, this.sphere_id++, this.add_material("sun", 0, [0, 0, 0], [30, 30, 30], 0, 0)),

			// fog
			// new Sphere([0, 0, 0], 8, this.global_id++, this.sphere_id++, this.add_material("fog", 3, [1, 1, 1], [0.95, 0.95, 0.95], [0, 0, 0], -0.9, -1/0.3, 1.5)),

			new Sphere([0.5, 0, 0], 0.45, this.global_id++, this.sphere_id++, this.add_material("fog", 3, [0.52, 0.8, 0.92], [0.95, 0.95, 0.95], [0, 0, 0], 0.8, -1/10, 1.5)),
			new Sphere([0.5, 0, 0], 0.45, this.global_id++, this.sphere_id++, this.add_material("dfgfd", 2, [1, 1, 1], [0.95, 0.95, 0.95], [0, 0, 0], 0, 0, 1)),

			// new Sphere([-0.5, -0.7, -0.5], 0.3, this.global_id++, this.sphere_id++, this.add_material("glass_ball", 1, [1, 1, 1], [0, 0, 0], 0, 1.1)),
			// new Sphere([0.6, -0.75, 0.5], 0.25, this.global_id++, this.sphere_id++, this.add_material("diffuse_ball", 0, [1, 1, 1], [0, 0, 0], 0, 0)),
			// new Sphere([-0.75, 0, -0.7], 0.15, this.global_id++, this.sphere_id++, this.add_material("diffuse_ball2", 0,  [0.3, 1, 0.3], [0.3, 0.3, 0.3], [0, 0, 0], 1, 0, 0)),
			// new Sphere([-0.375, 0, -0.7], 0.15, this.global_id++, this.sphere_id++, this.add_material("diffuse_ball1", 0, [0.3, 1, 0.3], [0.3, 0.3, 0.3], [0, 0, 0], 1, 0.25, 0)),
			// new Sphere([0, 0, -0.7], 0.15, this.global_id++, this.sphere_id++, this.add_material("diffuse_ball4", 0,      [0.3, 1, 0.3], [0.3, 0.3, 0.3], [0, 0, 0], 1, 0.5, 0)),
			// new Sphere([0.375, 0, -0.7], 0.15, this.global_id++, this.sphere_id++, this.add_material("diffuse_ball3", 0,  [0.3, 1, 0.3], [0.3, 0.3, 0.3], [0, 0, 0], 1, 0.75, 0)),
			// new Sphere([0.75, 0, -0.7], 0.15, this.global_id++, this.sphere_id++, this.add_material("diffuse_ball3", 0,   [0.3, 1, 0.3], [0.3, 0.3, 0.3], [0, 0, 0], 1, 1, 0)),

			// new Sphere([0.6, -0.75, -0.1], 0.25, this.global_id++, this.sphere_id++, this.add_material("pink_ball", 0, [1, 107/255, 144/255], [0.9, 0.9, 0.9], [0, 0, 0], 0.1, 0, 0)),
			// new Sphere([-0.6, -0.75, -0.1], 0.25, this.global_id++, this.sphere_id++, this.add_material("cyan_ball", 0, [0, 0, 1], [1, 0, 0], [0, 0, 0], 0.5, 0.4, 0)),
			// new Sphere([0, -0.75, 0.1], 0.25, this.global_id++, this.sphere_id++, this.add_material("yellow_ball", 0, [0.83, 0.69, 0.22], [1.0, 0.86, 0.57], [0, 0, 0], 0.9, 0.1, 1.9)),
			
			// new Sphere([0.25, -0.5, 0.3], 0.3, this.global_id++, this.sphere_id++, this.add_material("yellow_ball", 1, [0.95, 0.95, 0.95], [0.95, 0.95, 0.95], [0, 0, 0], 0, 0, 1.5)),
			// new Sphere([0, 2, 0], 0.05, this.global_id++, this.sphere_id++, this.add_material("light342", 2, [0, 0, 0], [0, 0, 0], [1000, 1000, 1000], 0, 0, 1.5)),
			// new Sphere([0.0, -0.2, 0], 0.4, this.global_id++, this.sphere_id++, this.add_material("ssc", 2, [0.95, 0.95, 0.95], [0.95, 0.95, 0.95], [0, 0, 0], 0, 0, 1.7)),

			// new Sphere([0.2, -0.5, 0], 0.2, this.global_id++, this.sphere_id++, this.add_material("ssc", 1, [0.95, 0.95, 0.95], [0.95, 0.95, 0.95], [0, 0, 0], 0, 0, 1.7)),
		)

		this.objs.push(this.spheres.flat());
	}

	create_quads() {

		this.add_material("red", 0, [0.75, 0.1, 0.1], [0.75, 0.1, 0.1], [0, 0, 0], 0.05, 0.95, 0);
		this.add_material("green", 0, [0.05, 0.55, 0.05], [0.05, 0.55, 0.05], [0, 0, 0], 0.05, 0.95, 0);
		this.add_material("blue", 0, [0.05, 0.05, 0.55], [0.05, 0.05, 0.55], [0, 0, 0], 0.05, 0.95, 0);
		this.add_material("white", 0, [0.76, 0.70, 0.51], [0.76, 0.70, 0.51], [0, 0, 0], 0.05, 0.95, 0);
		this.add_material("glossywhite", 0, [0.76, 0.70, 0.51], [0.76, 0.70, 0.51], [0, 0, 0], 0.3, 0.1, 0);
		this.add_material("black", 0, [0.2, 0.2, 0.2], [0.2, 0.2, 0.2], [0, 0, 0], 0.05, 0.95, 0);
		this.add_material("glass", 1, [0.95, 0.95, 0.95], [0,0,0], [0, 0, 0], 0, 0, 0);

		this.quads.push(

			// new Quad([-0.6, -0.05, 0.1],     [0, 0, -0.1],  [0, 0.1, 0],   this.global_id++, this.quad_id++, this.add_material("dfgdfgdf", 0, [0, 0, 0], [0, 0, 0], [100, 100, 100], 0.3, 0.1, 0)), // left

			// new Quad([-1, 1, -1],     [3, 0, 0],   [0, 0, 2],   this.global_id++, this.quad_id++, this.add_material("tWall", 0, [0, 0, 0], [0, 0, 0], [2, 2, 2], 0, 0)), //to

			// new Quad([-0.35, 1.4, -0.3],[0.7, 0, 0], [0, 0, 0.6], this.global_id++, this.quad_id++, this.add_material("light", 0, [0, 0, 0], [0, 0, 0], [10, 10, 10], 0, 0, 0)), //light  // 13
			// new Quad([-0.1, 0.9999, -0.1],[0.2, 0, 0], [0, 0, 0.2], this.global_id++, this.quad_id++, this.add_material("light", 0, [0, 0, 0], [0, 0, 0], [100, 100, 100], 0, 0, 0)), //light  // 13
			new Quad([0.15, 0.9999, -0.25],[0.7, 0, 0], [0, 0, 0.5], this.global_id++, this.quad_id++, this.add_material("light", 0, [0, 0, 0], [0, 0, 0], [20, 20, 20], 0, 0, 0)), //light  // 13
			// new Quad([-0.5, 4, -0.5],[1, 0, 0], [0, 0, 1], this.global_id++, this.quad_id++, this.add_material("light", 0, [0, 0, 0], [0, 0, 0], [10, 10, 10], 0, 0, 0)), //light  // 13
			// new Quad([-0.03, 0.999, -0.03],     [0.06, 0, 0],   [0, 0, 0.06],   this.global_id++, this.quad_id++, this.add_material("light", 0, [0, 0, 0], [0, 0, 0], [200, 200, 200], 0, 0, 0)), //top

			// new Quad([1000, 0, 0],    [2, 0, 0],   [0, 2, 0],   this.global_id++, this.material_dict["default"]), //back
			// new Quad([-1, -1, -1],    [2, 0, 0],   [0, 2, 0],   this.global_id++, this.quad_id++, this.material_dict["black"]), //back
			// new Quad([-1, -1, 1],     [0, 0, -2],  [0, 2, 0],   this.global_id++, this.quad_id++, this.material_dict["red"]), // left
			// new Quad([1, -1, -1],     [0, 0, 2],   [0, 2, 0],   this.global_id++, this.quad_id++, this.material_dict["green"]), // right					10.46, 6.65, 2.29
			// new Quad([-1, 1, -1],     [2, 0, 0],   [0, 0, 2],   this.global_id++, this.quad_id++, this.material_dict["white"]), //top
			// new Quad([1, -1, -1],     [-2, 0, 0],  [0, 0, 2],   this.global_id++, this.quad_id++, this.material_dict["glossywhite"]), //bottom

			new Quad([-1, -1, -1],    [3, 0, 0],   [0, 2, 0],   this.global_id++, this.quad_id++, this.material_dict["black"]), //back
			new Quad([-1, -1, 1],     [0, 0, -2],  [0, 2, 0],   this.global_id++, this.quad_id++, this.material_dict["red"]), // left
			new Quad([2, -1, -1],     [0, 0, 2],   [0, 2, 0],   this.global_id++, this.quad_id++, this.material_dict["green"]), // right					10.46, 6.65, 2.29
			new Quad([-1, 1, -1],     [3, 0, 0],   [0, 0, 2],   this.global_id++, this.quad_id++, this.material_dict["white"]), //top
			new Quad([2, -1, -1],     [-3, 0, 0],  [0, 0, 2],   this.global_id++, this.quad_id++, this.material_dict["glossywhite"]), //bottom

			// new Quad([-1, 1, -1],     [0.85, 0, 0],   [0, 0, 2],   this.global_id++, this.quad_id++, this.material_dict["white"]), //top
			// new Quad([0.15, 1, -1],     [1, 0, 0],   [0, 0, 2],   this.global_id++, this.quad_id++, this.material_dict["white"]), //top
			// new Quad([-1, 1, -1],     [2, 0, 0],   [0, 0, 0.85],   this.global_id++, this.quad_id++, this.material_dict["white"]), //top
			// new Quad([-1, 1, 0.15],     [2, 0, 0],   [0, 0, 1],   this.global_id++, this.quad_id++, this.material_dict["white"]), //top

			// new Quad([-1, 1, -1],     [0.5, 0, 0],   [0, 0, 2],   this.global_id++, this.quad_id++, this.material_dict["white"]), //top
			// new Quad([-0.4, 1, -1],     [0.1, 0, 0],   [0, 0, 2],   this.global_id++, this.quad_id++, this.material_dict["white"]), //top
			// new Quad([-0.2, 1, -1],     [0.1, 0, 0],   [0, 0, 2],   this.global_id++, this.quad_id++, this.material_dict["white"]), //top
			// new Quad([0, 1, -1],     [0.1, 0, 0],   [0, 0, 2],   this.global_id++, this.quad_id++, this.material_dict["white"]), //top
			// new Quad([0.2, 1, -1],     [0.1, 0, 0],   [0, 0, 2],   this.global_id++, this.quad_id++, this.material_dict["white"]), //top
			// new Quad([0.4, 1, -1],     [0.1, 0, 0],   [0, 0, 2],   this.global_id++, this.quad_id++, this.material_dict["white"]), //top

			// new Quad([0.6, 1, -1],     [0.5, 0, 0],   [0, 0, 2],   this.global_id++, this.quad_id++, this.material_dict["white"]), //top

			// new Quad([-1, 1, -1],     [2, 0, 0],   [0, 0, 2],   this.global_id++, this.quad_id++, this.add_material("tWall", 0, [0, 0, 0], [1, 1, 1], 0, 0)), //top
			new Quad([100, -1, -100],     [-200, 0, 0],  [0, 0, 200],   this.global_id++, this.quad_id++, this.material_dict["white"]), //bottom
			// new Quad([2, -1, 1],     [-3, 0, 0],  [0, 2, 0],   this.global_id++, this.quad_id++, this.add_material("fWall", 0, [0.15, 0.15, 0.15], [0, 0, 0], [0, 0, 0], 0, 0, 0)), //front
		)

		this.lights.push(this.quads[0]);

		this.objs.push(this.quads.flat());
	}

	create_meshes() {

		this.add_material("dragonMat", 0, [0.0, 0.37, 0.20], [0.0, 0.95, 0.95], [0, 0, 0], 0.4, 0.3, 2.5)

		this.meshes.push(
			// new Mesh(this.mesh_data["cone"], this.triangle_offset, this.global_id++, this.mesh_id++, this.triangle_id, this.add_material("glassBox", 0, [0.95, 0.95, 0.95], [0, 0, 0], [0, 0, 0], 0, 0, 2.5))
			new Mesh(this.mesh_data["cube"], this.triangle_offset, this.global_id++, this.mesh_id++, this.triangle_id, this.material_dict["dragonMat"])
		)

		this.triangle_id += this.meshes[0].numTriangle;
		this.triangle_offset += this.meshes[0].numTriangle;
		// this.meshes.push(
		// 	new Mesh(this.mesh_data["cube"], this.triangle_offset, this.global_id++, this.mesh_id++, this.triangle_id, this.add_material("box2", 1, [0.95, 0.95, 0.95], [0.95, 0.95, 0.95], [0, 0, 0], 0, 0, 1.5))
		// )

		// this.triangle_id += this.meshes[1].numTriangle;
		// this.triangle_offset += this.meshes[1].numTriangle;

		this.meshes[0].transform.update(
			this.meshes[0].transform.scale(1, 2.5, 1),
			this.meshes[0].transform.rotate(Math.PI / 10, [0, 1, 0]),
			// this.meshes[0].transform.translate(-0.3, -0.6, -0.3),
			this.meshes[0].transform.translate(-2, -0.6, -0.3),
		)

		// cone
		// this.meshes[0].transform.update(
		// 	this.meshes[0].transform.scale(0.15, 0.5, 0.15),
		// 	this.meshes[0].transform.rotate(Math.PI / 4, [0, 0, 1]),
		// 	// this.meshes[0].transform.translate(-0.3, -0.6, -0.3),
		// 	this.meshes[0].transform.translate(-5, 1.1, 0),
		// )

		// bunny
		// this.meshes[0].transform.update(
		// 	this.meshes[0].transform.scale(1.2, 1.2, 1.2),
		// 	this.meshes[0].transform.translate(0.1, -1.05, 0),
		// )

		// buddha
		// this.meshes[0].transform.update(
		// 	this.meshes[0].transform.scale(1, 1, 1),
		// 	this.meshes[0].transform.translate(-0.4, -0.7, 0),
		// )

		// // // armadillo
		// this.meshes[1].transform.update(
		// 	this.meshes[1].transform.scale(1, 1, 1),
		// 	this.meshes[1].transform.translate(0.4, -0.6, 0),
		// )

		// dragon
		// this.meshes[0].transform.update(
		// 	this.meshes[0].transform.scale(1.1, 1.1, 1.1),
		// 	this.meshes[0].transform.rotate(Math.PI / 4, [0, 1, 0]),
		// 	this.meshes[0].transform.translate(0.65, -0.64, 0),
		// )
		
		// spanza
		// this.meshes[0].transform.update(
		// 	this.meshes[0].transform.scale(1, 1, 1),
		// 	this.meshes[0].transform.translate(0, 0, 0),
		// )
		
		// this.meshes[1].transform.update(
		// 	this.meshes[1].transform.scale(0.9, 0.9, 0.9),
		// 	this.meshes[1].transform.rotate(-Math.PI / 4, [1, 1, 0]),
		// 	this.meshes[1].transform.translate(0.32, -0.8, 0.32),
		// )

		// this.meshes[1].transform.update(
		// 	this.meshes[1].transform.scale(1, 1, 1),
		// 	this.meshes[1].transform.rotate(-Math.PI / 8, [0, 1, 0]),
		// 	this.meshes[1].transform.translate(0.3, -0.73, 0.2),
		// )

		// this.meshes[1].transform.update(
		// 	this.meshes[1].transform.scale(1, 0.1, 1),
		// 	this.meshes[1].transform.translate(0.7, -0.8, 0),
		// )
		
		this.triangles = this.meshes.map(mesh => {return mesh.triangles}).flat();
		this.meshes.forEach(mesh => {mesh.calc_bbox(mesh.transform)});
		this.triangle_data = this.triangles.map(tri => {return tri.data})
		this.objs.push(this.meshes.flat());

		console.log(this.triangles.length)
	}

	create_bvh() {
		// let temp = [this.objs[0], this.objs[1], this.triangles].flat();
		let temp = [this.triangles].flat();
		// this.bvh = BVH.create_lbvh(temp);
		console.log("started creating BVH")
		let curTime = performance.now();
		let bvh = BVH.create_bvh(temp, 0, temp.length - 1); 
		this.bvh = bvh.bvh;
		this.triangles = bvh.objs;

		console.log("finished creating BVH")
		console.log("Time taken - ", performance.now() - curTime)
		BVH.populate_links(this.bvh);

		this.bvh_array = [];
		this.bvh_id = 0;
		this.linear_bvh(this.bvh);

		this.bvh_array.forEach((obj, i) => {
			if(obj[10] != null)
				obj[10] = obj[10].id;
			else
				obj[10] = -1;

			if(obj[3] != null) 
				obj[3] = obj[3].id;
			else
				obj[3] = -1
		})
	}

	linear_bvh(bvh) {
		if(bvh == null)
			return;

		bvh.id = this.bvh_id++;
		if(bvh.obj != null) {
			this.bvh_array.push([bvh.bbox.min[0], bvh.bbox.min[1], bvh.bbox.min[2], bvh.right_offset, bvh.bbox.max[0], bvh.bbox.max[1], bvh.bbox.max[2], bvh.obj.type, bvh.startID, bvh.triCount, bvh.miss_node, bvh.axis]);
		}
		else {
			this.bvh_array.push([bvh.bbox.min[0], bvh.bbox.min[1], bvh.bbox.min[2], bvh.right_offset, bvh.bbox.max[0], bvh.bbox.max[1], bvh.bbox.max[2], -1, -1, -1, bvh.miss_node, bvh.axis]);
		}
		this.linear_bvh(bvh.left);
		this.linear_bvh(bvh.right);
	}

	add_material(name, material_type, color, specularColor, emissionColor, percentSpecular, roughness, eta) {

		this.material_dict[name] = this.material_id;

		this.mats.push([
			color[0], color[1], color[2], -1,
			specularColor[0], specularColor[1], specularColor[2], -1,
			emissionColor[0], emissionColor[1], emissionColor[2], percentSpecular, 
			roughness, eta, material_type, -1
		]);

		return this.material_id++;
	}

	get_transforms() {
		var transforms = [];
		this.objs.flat().forEach((i) => {
			transforms.push(i.transform.getTransform());
		})

		return new Float32Array(transforms.flat());
	}

	async init_mesh_data() {

		let temp = new ObjReader();

		this.mesh_data = {};
		this.mesh_data["cube"] = await ObjReader.load_model("./assets/cube.obj");
		this.mesh_data["icoSphere"] = await ObjReader.load_model("./assets/icosphere.obj");
		this.mesh_data["monkey1"] = await ObjReader.load_model("./assets/monkey_968.obj");
		// this.mesh_data["monkey2"] = await ObjReader.load_model("./assets/monkey_smooth_15744.obj");
		// this.mesh_data["monkey3"] = await ObjReader.load_model("./assets/monkey_3.obj");
		// this.mesh_data["bunny"] = await ObjReader.load_model("./assets/stanfordBunny.obj");
		// this.mesh_data["dragon"] = await ObjReader.load_model("./assets/stanfordXYZdragon.obj");
		// this.mesh_data["buddha"] = await ObjReader.load_model("./assets/buddha.obj");
		// this.mesh_data["armadillo"] = await ObjReader.load_model("./assets/armadillo.obj");
		// this.mesh_data["sponza"] = await ObjReader.load_model("./assets/sponzaAtrium.obj");
		// this.mesh_data["cabin"] = await ObjReader.load_model("./assets/theCabin.obj");
		this.mesh_data["cone"] = await ObjReader.load_model("./assets/cone.obj");
	}

	get_bvh() { return new Float32Array(this.bvh_array.flat()) }
	get_triangles() { return new Float32Array(this.triangles.map(tri => {return tri.data}).flat()) }
	get_meshes() { return new Int32Array(this.meshes.map(mesh => {return mesh.mesh}).flat()) }
	get_materials() { return new Float32Array(this.mats.flat()) }
	get_spheres() { return new Float32Array(this.spheres.map(sphere => {return sphere.data}).flat()) }
	get_quads() { return new Float32Array(this.quads.map(quad => {return quad.data}).flat()); }
	get_lights() { return new Float32Array(this.lights.map(light => {return light.data}).flat()); }
}
























// subsurface scattering

// new Sphere([-0.3, -0.65, 0.3], 0.35, this.global_id++, this.sphere_id++, this.add_material("fog", 3, [0.56, 0.93, 0.56], [0, 0, 0], [0, 0, 0], 0, -1/4, 0)),
// new Sphere([-0.3, -0.65, 0.3], 0.35, this.global_id++, this.sphere_id++, this.add_material("gg4t", 2, [1, 1, 1], [0, 0, 0], [0, 0, 0], 0, 0, 1.5)),

// new Sphere([-0.3, -0.05, 0.3], 0.25, this.global_id++, this.sphere_id++, this.add_material("fog", 3, [0.56, 0.93, 0.56], [0, 0, 0], [0, 0, 0], 0, -1/4, 0)),
// new Sphere([-0.3, -0.05, 0.3], 0.25, this.global_id++, this.sphere_id++, this.add_material("gg4t", 2, [1, 1, 1], [0, 0, 0], [0, 0, 0], 0, 0, 1.5)),

// new Sphere([-0.3, 0.3, 0.3], 0.1, this.global_id++, this.sphere_id++, this.add_material("fog", 3, [0.56, 0.93, 0.56], [0, 0, 0], [0, 0, 0], 0, -1/4, 0)),
// new Sphere([-0.3, 0.3, 0.3], 0.1, this.global_id++, this.sphere_id++, this.add_material("gg4t", 2, [1, 1, 1], [0, 0, 0], [0, 0, 0], 0, 0, 1.5)),

// new Sphere([-0.3, 0.45, 0.3], 0.05, this.global_id++, this.sphere_id++, this.add_material("fog", 3, [0.56, 0.93, 0.56], [0, 0, 0], [0, 0, 0], 0, -1/4, 0)),
// new Sphere([-0.3, 0.45, 0.3], 0.05, this.global_id++, this.sphere_id++, this.add_material("gg4t", 2, [1, 1, 1], [0, 0, 0], [0, 0, 0], 0, 0, 1.5)),


// new Sphere([0.5, -0.65, -0.2], 0.35, this.global_id++, this.sphere_id++, this.add_material("fog", 3, [0.52, 0.8, 0.92], [0, 0, 0], [0, 0, 0], 0, -1/7, 0)),
// new Sphere([0.5, -0.65, -0.2], 0.35, this.global_id++, this.sphere_id++, this.add_material("gg4t", 2, [1, 1, 1], [0, 0, 0], [0, 0, 0], 0, 0, 1)),


// new Sphere([0.5, 0.1, 0.2], 0.2, this.global_id++, this.sphere_id++, this.add_material("gg4t", 2, [1, 1, 1], [0, 0, 0], [0, 0, 0], 0, 0, 1.5)),


// new Sphere([1.3, -0.65, 0.3], 0.35, this.global_id++, this.sphere_id++, this.add_material("fog", 3, temp, [0, 0, 0], [0, 0, 0], 0, -1/10, 0)),
// new Sphere([1.3, -0.65, 0.3], 0.35, this.global_id++, this.sphere_id++, this.add_material("gg4t", 2, [1, 1, 1], [0, 0, 0], [0, 0, 0], 0, 0, 1)),

// new Sphere([1.3, -0.05, 0.3], 0.25, this.global_id++, this.sphere_id++, this.add_material("fog", 3, temp, [0, 0, 0], [0, 0, 0], 0, -1/10, 0)),
// new Sphere([1.3, -0.05, 0.3], 0.25, this.global_id++, this.sphere_id++, this.add_material("gg4t", 2, [1, 1, 1], [0, 0, 0], [0, 0, 0], 0, 0, 1)),

// new Sphere([1.3, 0.3, 0.3], 0.1, this.global_id++, this.sphere_id++, this.add_material("fog", 3, temp, [0, 0, 0], [0, 0, 0], 0, -1/10, 0)),
// new Sphere([1.3, 0.3, 0.3], 0.1, this.global_id++, this.sphere_id++, this.add_material("gg4t", 2, [1, 1, 1], [0, 0, 0], [0, 0, 0], 0, 0, 1)),

// new Sphere([1.3, 0.45, 0.3], 0.05, this.global_id++, this.sphere_id++, this.add_material("fog", 3, temp, [0, 0, 0], [0, 0, 0], 0, -1/10, 0)),
// new Sphere([1.3, 0.45, 0.3], 0.05, this.global_id++, this.sphere_id++, this.add_material("gg4t", 2, [1, 1, 1], [0, 0, 0], [0, 0, 0], 0, 0, 1)),