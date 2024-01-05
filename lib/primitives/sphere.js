import { Transform } from "../transform.js";
import { AABB } from "../BVH/AABB.js";

export class Sphere {

	constructor(center, r, global_id, local_id, material_id) {

		this.type = 0;
		this.global_id = global_id;
		this.local_id = local_id;
		this.data = this.create_sphere(center, r, global_id, local_id, material_id);
		this.bbox = new AABB();
		this.bbox.bbox(
			[center[0] - r, center[1] - r, center[2] - r], 
			[center[0] + r, center[1] + r, center[2] + r]
		)

		this.transform = new Transform();
	}

	aabb(center, r) {
		
	}

	create_sphere(center, r, global_id, local_id, material_id) {
		return [
			center[0], center[1], center[2], r,
			global_id, local_id, material_id, -1 
		];
	}
}