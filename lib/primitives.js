import { vec3, mat4 } from 'https://cdn.skypack.dev/gl-matrix';
import { ObjReader } from './objReader.js';

export class Primitives {
	constructor()
	{
		this.materials = {};
	}

	// create_materials() {

	// 	this.materials["Mirror"] = 

	// }

	create_spheres() {

		var objs = [];
	
		// dummy sphere
		// objs.push(this.sphere([-100, 0, 0],       0.3, [0, 0, 0],    0, 0,   0,    [0, 0, 0]));
	
		// cornell spheres
		objs.push(this.sphere([-0.5, -0.7, -0.5],       0.3, [1, 1, 1],    1, 0,   1.1,    [0, 0, 0]));
		// objs.push(this.sphere([0.5, -0.7, 0.3],       0.3, [1, 1, 1],    2, 0,   1.05,    [0, 0, 0]));
		objs.push(this.sphere([0.6, -0.75, 0.5],       0.25, [1, 1, 1],   0, 0,   1.04,    [0, 0, 0]));
		// objs.push(this.sphere([0, 0, -2],       0.1, [1, 0, 1],    0, 0,   1.06,    [0, 0, 0]));
	
		return new Float32Array(objs.flat());
	}

	create_quads() {
		var objs = [];
	
		// objs.push(this.quad([-100, -100, 0],       [100, 100, 100],   [100, 100, 100],   [1, 1, 1], 0, 0, 0, [0, 0, 0])); //back
	
		// cornell box
		objs.push(this.quad([-1, -1, -1],       [2, 0, 0],   [0, 2, 0],   [0.3, 0.3, 0.3], 0, 0, 0, [0, 0, 0])); //back
		objs.push(this.quad([-1, -1, 1],       [0, 0, -2],  [0, 2, 0],   [1, 0, 0], 0, 0, 0, [0, 0, 0])); // left
		objs.push(this.quad([1, -1, -1],        [0, 0, 2],  [0, 2, 0],   [0, 1, 0], 0, 0, 0, [0, 0, 0])); // right
		objs.push(this.quad([-0.35, 1, -0.3],  [0.7, 0, 0], [0, 0, 0.6], [0, 0, 0], 0, 0, 0, [13, 13, 13])); //light
		objs.push(this.quad([-1, 1, -1],        [2, 0, 0],   [0, 0, 2], 	[1, 1, 1], 0, 0, 0, [0, 0, 0])); //top
		objs.push(this.quad([1, -1, -1],       [-2, 0, 0],   [0, 0, 2], 	[1, 1, 1], 0, 0, 0, [0, 0, 0])); //bottom
		objs.push(this.quad([1, -1, 1],        [-2, 0, 0],   [0, 2, 0], 	[0, 0, 1], 0, 0, 0, [0, 0, 0])); //front
		return new Float32Array(objs.flat());
	}

	async create_triangles() {
		var objs = [];

		var temp = await ObjReader.load_model("./lib/cubeNormal.obj");

		console.log(temp);

		var objsTemp = [];

		for(var i = 0; i < temp.vertices.length / 9; i++)
		{
			objsTemp.push(
				this.triangle(
					[temp.vertices[i*9 + 0], temp.vertices[i*9 + 1], temp.vertices[i*9 + 2]],
					[temp.vertices[i*9 + 3], temp.vertices[i*9 + 4], temp.vertices[i*9 + 5]],
					[temp.vertices[i*9 + 6], temp.vertices[i*9 + 7], temp.vertices[i*9 + 8]],

					[temp.normals[i*9 + 0], temp.normals[i*9 + 1], temp.normals[i*9 + 2]],
					[temp.normals[i*9 + 3], temp.normals[i*9 + 4], temp.normals[i*9 + 5]],
					[temp.normals[i*9 + 6], temp.normals[i*9 + 7], temp.normals[i*9 + 8]],

					// [temp.normals[i*9 + 0], temp.normals[i*9 + 1], temp.normals[i*9 + 2]],

					[1, 1, 1],
					0, 0, 0, 
					[0, 0, 0]
				)
			)
		}

		objs.push(this.triangle(
			[-0.5, 0, 0], [0.5, 0, 0], [0, 1, 0], 
			[0, -1, 0], [0, -1, 0], [0, -1, 0], 
			[1, 0, 0], 0, 0, 0, [0, 0, 0])
		);
		return new Float32Array(objs.flat());
	}

	sphere(pos, r, color, material, eta, fuzz, emission) {
		return [
			pos[0], pos[1], pos[2], r,
			color[0], color[1], color[2], material, 
			eta, fuzz, -1, -1,
			emission[0], emission[1], emission[2], -1
		];
	}

	quad(Q, u, v, color, material, eta, fuzz, emission) {
		var n = vec3.create(), normal = vec3.create(), w = vec3.create(), D = 0;
		vec3.cross(n, u, v);
		vec3.normalize(normal, n);
		D = vec3.dot(normal, Q);
		var temp = vec3.dot(n, n);
		vec3.set(w, n[0] / temp, n[1] / temp, n[2] / temp);
	
		return [
			Q[0], Q[1], Q[2], -1,
			u[0], u[1], u[2], -1,
			v[0], v[1], v[2], -1,
			normal[0], normal[1], normal[2], D,
			w[0], w[1], w[2], material,
			color[0], color[1], color[2], fuzz,
			emission[0], emission[1], emission[2], eta
		];
	}

	triangle(A, B, C, normalA, normalB, normalC, color, material, eta, fuzz, emission)
	{
		return [
			A[0], A[1], A[2], -1,
			B[0], B[1], B[2], -1,
			C[0], C[1], C[2], -1,
			normalA[0], normalA[1], normalA[2], -1,
			normalB[0], normalB[1], normalB[2], -1,
			normalC[0], normalC[1], normalC[2], -1,

			color[0], color[1], color[2], -1,
			emission[0], emission[1], emission[2],
			material, eta, fuzz, -1, -1
		]
	}

	


}