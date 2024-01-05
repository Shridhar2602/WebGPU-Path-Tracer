import { Transform } from "../transform.js";
import { AABB } from "../BVH/AABB.js";
import { vec3, mat4 } from 'https://cdn.skypack.dev/gl-matrix';
// import { ZCurve } from 'https://cdn.skypack.dev/@thi.ng/morton';

export class Triangle {

	constructor(A, B, C, normalA, normalB, normalC, mesh_id, local_id) {

		this.type = 2;
		this.global_id = mesh_id;
		this.local_id = local_id;

		this.data = this.create_triangle(A, B, C, normalA, normalB, normalC, mesh_id, local_id);

		this.bbox = new AABB()

		this.A = A;
		this.B = B;
		this.C = C;

		// let temp = vec3.create();
		// vec3.transformMat4(temp, A, this.transform.modelMatrix);
		// console.log(temp)
	}

	calc_bbox(transform) {

		this.A = vec3.transformMat4(vec3.create(), this.A, transform.modelMatrix)
		this.B = vec3.transformMat4(vec3.create(), this.B, transform.modelMatrix)
		this.C = vec3.transformMat4(vec3.create(), this.C, transform.modelMatrix)

		this.bbox.bbox_triangle(
			this.A, 
			this.B,
			this.C,
		);
		this.bbox.pad();
	}


	create_triangle(A, B, C, normalA, normalB, normalC, mesh_id, local_id)
	{
		return [
			A[0], A[1], A[2], -1,
			B[0], B[1], B[2], -1,
			C[0], C[1], C[2], -1,
			normalA[0], normalA[1], normalA[2], -1,
			normalB[0], normalB[1], normalB[2], local_id,
			normalC[0], normalC[1], normalC[2], mesh_id
		]
	}
}