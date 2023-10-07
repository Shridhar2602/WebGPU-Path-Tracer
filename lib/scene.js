import { vec3, mat4 } from 'https://cdn.skypack.dev/gl-matrix';	
import { Sphere } from './sphere.js';
import { Quad } from './quad.js';
import { Mesh } from './mesh.js';
import { ObjReader } from './objReader.js';

export class Scene {

	constructor() {
		this.mats = [];
		this.material_id = 0;
		this.material_dict = {};

		this.obj_id = 0;
		this.triangle_offset = 0;
		this.spheres = [];
		this.quads = [];
		this.triangles = [];
		this.meshes = [];
		this.objs = [];

		this.create_spheres();
		this.create_quads();
	}

	create_spheres() {

		// dummy sphere
		this.add_material("default", 0, [1, 1, 1], [0, 0, 0], 0, 0);
		let sphere = new Sphere([0, 0, 100], 0.3, this.obj_id++, this.material_dict["default"]);
	
		// cornell spheres
		this.add_material("glass_ball", 1, [1, 1, 1], [0, 0, 0], 0, 1.1);
		this.add_material("diffuse_ball", 0, [1, 1, 1], [0, 0, 0], 0, 0);

		// let sphere1 = new Sphere([-0.5, -0.7, -0.5], 0.3, this.obj_id++, this.add_material("glass_ball", 1, [1, 1, 1], [0, 0, 0], 0, 1.1));
		// let sphere2 = new Sphere([0.6, -0.75, 0.5], 0.25, this.obj_id++, this.add_material("diffuse_ball", 0, [1, 1, 1], [0, 0, 0], 0, 0));

		// sphere2.transform.update(
		// 	sphere2.transform.translate(0, 2, -0.5),
		// 	// sphere1.transform.scale(0.9)
		// )

		// this.spheres = [sphere1.data, sphere2.data];
		// this.objs.push([sphere1, sphere2].flat());
		this.spheres = [sphere.data];
		this.objs.push([sphere].flat());
	}

	create_quads() {
	
		// objs.push(this.quad([-100, -100, 0],       [100, 100, 100],   [100, 100, 100],   [1, 1, 1], 0, 0, 0, [0, 0, 0])); //back
	
		// cornell contentBoxSize
		let q1 = new Quad([-1, -1, -1],    [2, 0, 0],   [0, 2, 0],   this.obj_id++, this.add_material("bWall", 0, [0.3, 0.3, 0.3], [0, 0, 0], 0, 0)); //back
		let q2 = new Quad([-1, -1, 1],     [0, 0, -2],  [0, 2, 0],   this.obj_id++, this.add_material("lWall", 0, [1, 0, 0], [0, 0, 0], 0, 0)); // left
		let q3 = new Quad([1, -1, -1],     [0, 0, 2],   [0, 2, 0],   this.obj_id++, this.add_material("rWall", 0, [0, 1, 0], [0, 0, 0], 0, 0)); // right
		let q4 = new Quad([-0.35, 1, -0.3],[0.7, 0, 0], [0, 0, 0.6], this.obj_id++, this.add_material("light", 0, [0, 0, 0], [13, 13, 13], 0, 0)); //light  // 13
		let q5 = new Quad([-1, 1, -1],     [2, 0, 0],   [0, 0, 2],   this.obj_id++, this.add_material("tWall", 0, [1, 1, 1], [0, 0, 0], 0, 0)); //top
		let q6 = new Quad([1, -1, -1],     [-2, 0, 0],  [0, 0, 2],   this.obj_id++, this.material_dict["tWall"]); //bottom
		let q7 = new Quad([1, -1, 1],      [-2, 0, 0],  [0, 2, 0],   this.obj_id++, this.add_material("fWall", 0, [0, 0, 1], [0, 0, 0], 0, 0)); //front

		this.quads = [q1.data, q2.data, q3.data, q4.data, q5.data, q6.data, q7.data];
		this.objs.push([q1, q2, q3, q4, q5, q6, q7].flat());
	}

	async init_mesh_data() {
		this.mesh_data = {};

		this.mesh_data["cube"] = await ObjReader.load_model("./lib/cube.obj");
		this.mesh_data["icoSphere"] = await ObjReader.load_model("./lib/icosphere.obj");
		this.mesh_data["monkey1"] = await ObjReader.load_model("./lib/monkey_968.obj");
	}

	create_meshes() {

		let m1 = new Mesh(this.mesh_data["cube"], this.triangle_offset, this.obj_id++, this.add_material("glassBox", 1, [1, 1, 1], [0, 0, 0], 0, 0));
		let m2 = new Mesh(this.mesh_data["cube"], this.triangle_offset, this.obj_id++, this.add_material("glassBox", 0, [1, 1, 1], [0, 0, 0], 0, 0));
		this.triangle_offset += m1.numTriangle;

		m1.transform.update(
			m1.transform.scale(1, 2.5, 1),
			m1.transform.rotate(Math.PI / 9, [0, 1, 0]),
			m1.transform.translate(-0.35, -0.5, -0.1),
		)

		m2.transform.update(
			m2.transform.scale(1, 1, 1),
			m2.transform.rotate(-Math.PI / 9, [0, 1, 0]),
			m2.transform.translate(0.28, -0.73, 0.45),
		)

		this.triangles = [m1.triangles, m2.triangles];
		this.meshes = [m1.mesh, m2.mesh];

		this.objs.push([m1, m2]);
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

	get_triangles() { return new Float32Array(this.triangles.flat()) }
	get_meshes() { return new Int32Array(this.meshes.flat()) }
	get_materials() { return new Float32Array(this.mats.flat()); }
	get_spheres() { return new Float32Array(this.spheres.flat()); }
	get_quads() { return new Float32Array(this.quads.flat()); }
}