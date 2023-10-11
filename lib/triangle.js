import { Transform } from "./transform.js";
import { AABB } from "./BVH/AABB.js";
import { vec3, mat4 } from 'https://cdn.skypack.dev/gl-matrix';
// import { ZCurve } from 'https://cdn.skypack.dev/@thi.ng/morton';

export class Triangle {

	constructor(A, B, C, normalA, normalB, normalC, mesh_id, local_id) {

		this.type = 2;
		this.global_id = mesh_id;
		this.local_id = local_id;

		this.data = this.create_triangle(A, B, C, normalA, normalB, normalC, mesh_id, local_id);

		this.bbox = new AABB()
		this.morton = -1;

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

		// const z = new ZCurve(3, 10);
		// this.morton = z.encode([
		// 	(this.A[0] + this.B[0] + this.C[0]) / 3,
		// 	(this.A[1] + this.B[1] + this.C[1]) / 3,
		// 	(this.A[2] + this.B[2] + this.C[2]) / 3,
		// ])
		// this.morton = Number(this.morton);
		// console.log(this.morton)

		// this.morton = this.morton3D(
		// 	(this.A[0] + this.B[0] + this.C[0]) / 3,
		// 	(this.A[1] + this.B[1] + this.C[1]) / 3,
		// 	(this.A[2] + this.B[2] + this.C[2]) / 3,
		// )

		// console.log(this.morton)

		// console.log(this.morton)
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

	// Expands a 10-bit integer into 30 bits by inserting 2 zeros after each bit.
	expandBits(v) {
		v = (v * 0x00010001) & 0xFF0000FF;
		v = (v * 0x00000101) & 0x0F00F00F;
		v = (v * 0x00000011) & 0xC30C30C3;
		v = (v * 0x00000005) & 0x49249249;
		return v;
	}
	
	// Calculates a 30-bit Morton code for the given 3D point located within the unit cube [0,1].
	morton3D(x, y, z) {
		// Clamp the input coordinates to the range [0, 1] and scale them to [0, 1023].
		x = Math.min(Math.max(x * 1024.0, 0.0), 1023.0);
		y = Math.min(Math.max(y * 1024.0, 0.0), 1023.0);
		z = Math.min(Math.max(z * 1024.0, 0.0), 1023.0);
	
		// Expand the bits of each coordinate to create the Morton code.

		// const mm = new ZCurve(3, 10);
		// this.morton = mm.encode([x, y, z])

		// return Number(this.morton);


		var xx = this.expandBits(Math.floor(x));
		var yy = this.expandBits(Math.floor(y));
		var zz = this.expandBits(Math.floor(z));
	
		// Combine the expanded bits to create the final 30-bit Morton code.
		return xx * 4 + yy * 2 + zz;
	}

	mortonCode3D(x, y, z) {
		// Interleave the bits of x, y, and z.
		let result = 0;
		for (let i = 0; i < 32; i++) {
		  result |= ((x & (1 << i)) << (3 * i)) | ((y & (1 << i)) << (3 * i + 1)) | ((z & (1 << i)) << (3 * i + 2));
		}
		return result;
	  }
}