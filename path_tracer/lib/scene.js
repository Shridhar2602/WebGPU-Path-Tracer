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

		this.create_spheres();
		this.create_quads();

		// const z = new ZCurve(3, 12);
		// console.log(z.encode([60000, 30000, 20000]))
	}

	create_spheres() {

		this.add_material("default", 0, [1, 0, 0], [0, 0, 0], 0, 0);
		this.spheres.push(
			new Sphere([100, 0, 0], 0.3, this.global_id++, this.sphere_id++, this.add_material("sun", 0, [0, 0, 0], [30, 30, 30], 0, 0)),
			// new Sphere([-0.5, -0.7, -0.5], 0.3, this.global_id++, this.sphere_id++, this.add_material("glass_ball", 1, [1, 1, 1], [0, 0, 0], 0, 1.1)),
			// new Sphere([0.6, -0.75, 0.5], 0.25, this.global_id++, this.sphere_id++, this.add_material("diffuse_ball", 0, [1, 1, 1], [0, 0, 0], 0, 0))
		)

		this.objs.push(this.spheres.flat());
	}

	create_quads() {

		this.quads.push(
			// new Quad([-1, -1, -1],    [2, 0, 0],   [0, 2, 0],   this.global_id++, this.material_dict["default"]), //back
			new Quad([-1, -1, -1],    [2, 0, 0],   [0, 2, 0],   this.global_id++, this.quad_id++, this.add_material("bWall", 0, [0.3, 0.3, 0.3], [0, 0, 0], 0, 0)), //back
			new Quad([-1, -1, 1],     [0, 0, -2],  [0, 2, 0],   this.global_id++, this.quad_id++, this.add_material("lWall", 0, [1, 0, 0], [0, 0, 0], 0, 0)), // left
			new Quad([1, -1, -1],     [0, 0, 2],   [0, 2, 0],   this.global_id++, this.quad_id++, this.add_material("rWall", 0, [0, 1, 0], [0, 0, 0], 0, 0)), // right
			// new Quad([-0.35, 1, -0.3],[0.7, 0, 0], [0, 0, 0.6], this.global_id++, this.quad_id++, this.add_material("light", 0, [0, 0, 0], [13, 13, 13], 0, 0)), //light  // 13
			// new Quad([-1, 1, -1],     [2, 0, 0],   [0, 0, 2],   this.global_id++, this.quad_id++, this.add_material("tWall", 0, [1, 1, 1], [0, 0, 0], 0, 0)), //top
			new Quad([-1, 1, -1],     [2, 0, 0],   [0, 0, 2],   this.global_id++, this.quad_id++, this.add_material("tWall", 0, [0, 0, 0], [1.6, 1.6, 1.6], 0, 0)), //top
			new Quad([1, -1, -1],     [-2, 0, 0],  [0, 0, 2],   this.global_id++, this.quad_id++, this.add_material("bWall", 0, [1, 1, 1], [0, 0, 0], 0, 0)), //bottom
			new Quad([1, -1, 1],      [-2, 0, 0],  [0, 2, 0],   this.global_id++, this.quad_id++, this.add_material("fWall", 0, [0, 0, 1], [0, 0, 0], 0, 0)), //front

			// new Quad([-2, -1, -1],    [4, 0, 0],   [0, 2, 0],   this.global_id++, this.quad_id++, this.add_material("bWall", 0, [0.3, 0.3, 0.3], [0, 0, 0], 0, 0)), //back
			// new Quad([-2, -1, 1],     [0, 0, -2],  [0, 2, 0],   this.global_id++, this.quad_id++, this.add_material("lWall", 0, [1, 0, 0], [0, 0, 0], 0, 0)), // left
			// new Quad([2, -1, -1],     [0, 0, 2],   [0, 2, 0],   this.global_id++, this.quad_id++, this.add_material("rWall", 0, [0, 1, 0], [0, 0, 0], 0, 0)), // right
			// // new Quad([-1.7, 1, -0.6],[3.4, 0, 0], [0, 0, 1.2], this.global_id++, this.quad_id++, this.add_material("light", 0, [0, 0, 0], [1, 1, 1], 0, 0)), //light  // 13
			// new Quad([-2, 1, -1],     [4, 0, 0],   [0, 0, 2],   this.global_id++, this.quad_id++, this.add_material("tWall", 0, [1, 1, 1], [0, 0, 0], 0, 0)), //top
			// new Quad([2, -1, -1],     [-4, 0, 0],  [0, 0, 2],   this.global_id++, this.quad_id++, this.add_material("bWall", 0, [1, 1, 1], [0, 0, 0], 0, 0)), //bottom
			// new Quad([2, -1, 1],      [-4, 0, 0],  [0, 2, 0],   this.global_id++, this.quad_id++, this.add_material("fWall", 0, [0, 0, 0], [1, 1, 1], 0, 0)), //front
		)

		this.objs.push(this.quads.flat());
	}

	create_meshes() {

		this.meshes.push(
			new Mesh(this.mesh_data["cube"], this.triangle_offset, this.global_id++, this.mesh_id++, this.triangle_id, this.add_material("glassBox", 1, [1, 1, 1], [0, 0, 0], 0, 0))
		)

		this.triangle_id += this.meshes[0].numTriangle;
		this.triangle_offset += this.meshes[0].numTriangle;
		this.meshes.push(
			new Mesh(this.mesh_data["monkey2"], this.triangle_offset, this.global_id++, this.mesh_id++, this.triangle_id, this.add_material("box2", 0, [1, 1, 1], [0, 0, 0], 0, 1))
		)

		this.triangle_id += this.meshes[1].numTriangle;
		this.triangle_offset += this.meshes[1].numTriangle;

		this.meshes[0].transform.update(
			this.meshes[0].transform.scale(1, 2.5, 1),
			this.meshes[0].transform.rotate(Math.PI / 8, [0, 1, 0]),
			this.meshes[0].transform.translate(-0.45, -0.6, -0.4),
		)

		this.meshes[1].transform.update(
			this.meshes[1].transform.scale(1, 1, 1),
			this.meshes[1].transform.rotate(-Math.PI / 4, [1, 1, 0]),
			this.meshes[1].transform.translate(0.35, -0.77, 0.4),
		)

		// this.meshes[1].transform.update(
		// 	this.meshes[1].transform.scale(1, 1, 1),
		// 	this.meshes[1].transform.translate(0.4, -0.69, 0.3),
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
		this.bvh = BVH.create_bvh(temp, 0, temp.length - 1);
		BVH.populate_links(this.bvh);

		this.bvh_array = [];
		this.bvh_id = 0;
		this.linear_bvh(this.bvh);

		this.bvh_array.forEach((obj, i) => {
			if(obj[9] != null)
				obj[9] = obj[9].id;
			else
				obj[9] = -1;

			if(obj[10] != null)
				obj[10] = obj[10].id;
			else
				obj[10] = -1;
		})

		// console.log(this.bvh_array)
	}

	linear_bvh(bvh) {
		if(bvh == null)
			return;

		bvh.id = this.bvh_id++;
		if(bvh.obj != null) {
			this.bvh_array.push([bvh.bbox.min[0], bvh.bbox.min[1], bvh.bbox.min[2], -1, bvh.bbox.max[0], bvh.bbox.max[1], bvh.bbox.max[2], bvh.obj.type, bvh.obj.local_id, bvh.miss_node, bvh.hit_node, -1]);
		}
		else {
			this.bvh_array.push([bvh.bbox.min[0], bvh.bbox.min[1], bvh.bbox.min[2], -1, bvh.bbox.max[0], bvh.bbox.max[1], bvh.bbox.max[2], -1, -1, bvh.miss_node, bvh.hit_node, -1]);
		}
		this.linear_bvh(bvh.left);
		this.linear_bvh(bvh.right);
	}

	add_material(name, material_type, color, emissionColor, fuzz, eta) {

		this.material_dict[name] = this.material_id;

		this.mats.push([
			color[0], color[1], color[2], -1,
			emissionColor[0], emissionColor[1], emissionColor[2], fuzz,
			eta, material_type, -1, -1,
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
		this.mesh_data["monkey2"] = await ObjReader.load_model("./assets/monkey_5802.obj");
		this.mesh_data["bunny"] = await ObjReader.load_model_fast("./assets/bunny_blender.obj");
		// this.mesh_data["dragon"] = await ObjReader.load_model("./assets/dragon.obj");
		// this.mesh_data["armadillo"] = await ObjReader.load_model_fast("./assets/armadillo.obj");
	}

	get_bvh() { return new Float32Array(this.bvh_array.flat()) }
	get_triangles() { return new Float32Array(this.triangles.map(tri => {return tri.data}).flat()) }
	get_meshes() { return new Int32Array(this.meshes.map(mesh => {return mesh.mesh}).flat()) }
	get_materials() { return new Float32Array(this.mats.flat()) }
	get_spheres() { return new Float32Array(this.spheres.map(sphere => {return sphere.data}).flat()) }
	get_quads() { return new Float32Array(this.quads.map(quad => {return quad.data}).flat()); }
}