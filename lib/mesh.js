import { Transform } from "./transform.js";
import { ObjReader } from './objReader.js';

export class Mesh {

	constructor(data, offset, id, material_id) {

		this.triangles = this.load_mesh(data);
		this.numTriangle = this.triangles.length / 18;
		this.mesh = this.create_mesh(this.numTriangle, offset, id, material_id)
		this.transform = new Transform();
	}

	// update_transform() {
	// 	this.mesh = 
	// }

	load_mesh(data) {

		let temp = data;
		var triangles = [];

		for(var i = 0; i < temp.vertices.length / 9; i++)
		{
			triangles.push(
				this.create_triangle(
					[temp.vertices[i*9 + 0], temp.vertices[i*9 + 1], temp.vertices[i*9 + 2]],
					[temp.vertices[i*9 + 3], temp.vertices[i*9 + 4], temp.vertices[i*9 + 5]],
					[temp.vertices[i*9 + 6], temp.vertices[i*9 + 7], temp.vertices[i*9 + 8]],

					[temp.normals[i*9 + 0], temp.normals[i*9 + 1], temp.normals[i*9 + 2]],
					[temp.normals[i*9 + 3], temp.normals[i*9 + 4], temp.normals[i*9 + 5]],
					[temp.normals[i*9 + 6], temp.normals[i*9 + 7], temp.normals[i*9 + 8]],
				)
			)
		}

		return triangles.flat();
	}

	create_mesh(num_triangles, offset, id, material_id) {

		return [
			num_triangles, offset, id, material_id
		]
	}

	create_triangle(A, B, C, normalA, normalB, normalC)
	{
		return [
			A[0], A[1], A[2], -1,
			B[0], B[1], B[2], -1,
			C[0], C[1], C[2], -1,
			normalA[0], normalA[1], normalA[2], -1,
			normalB[0], normalB[1], normalB[2], -1,
			normalC[0], normalC[1], normalC[2], -1,
		]
	}
}