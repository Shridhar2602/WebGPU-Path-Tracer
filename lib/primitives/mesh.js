import { Transform } from "../transform.js";
import { ObjReader } from './objReader.js';
import { Triangle } from "./triangle.js";

export class Mesh {

	constructor(data, offset, id, mesh_id, local_id, material_id) {

		this.triangles = this.load_mesh(data, mesh_id, local_id);
		this.numTriangle = this.triangles.length;
		this.mesh = this.create_mesh(this.numTriangle, offset, id, material_id)
		this.transform = new Transform();
	}

	// update_transform() {
	// 	this.mesh = 
	// }

	load_mesh(data, id, local_id) {

		let temp = data;
		var triangles = [];

		for(var i = 0; i < temp.vertices.length / 9; i++)
		{
			let tri = new Triangle(
				[temp.vertices[i*9 + 0], temp.vertices[i*9 + 1], temp.vertices[i*9 + 2]],
				[temp.vertices[i*9 + 3], temp.vertices[i*9 + 4], temp.vertices[i*9 + 5]],
				[temp.vertices[i*9 + 6], temp.vertices[i*9 + 7], temp.vertices[i*9 + 8]],

				[temp.normals[i*9 + 0], temp.normals[i*9 + 1], temp.normals[i*9 + 2]],
				[temp.normals[i*9 + 3], temp.normals[i*9 + 4], temp.normals[i*9 + 5]],
				[temp.normals[i*9 + 6], temp.normals[i*9 + 7], temp.normals[i*9 + 8]],
				
				id, local_id + i
			);

			// let skip = false;
			// tri.data.forEach(x => {
			// 	if(x === undefined) {
			// 		skip = true;
			// 	}
			// })

			// if(!skip)
			triangles.push(tri);
		}

		return triangles.flat();
	}

	calc_bbox(transform) {
		this.triangles.forEach(tri => {
			tri.calc_bbox(transform);
		})
	}

	create_mesh(num_triangles, offset, id, material_id) {

		return [
			num_triangles, offset, id, material_id
		]
	}
}