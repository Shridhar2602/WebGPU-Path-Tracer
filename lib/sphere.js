import { Transform } from "./transform.js";

export class Sphere {

	constructor(pos, r, id, material_id) {

		this.data = this.create_sphere(pos, r, id, material_id);
		this.transform = new Transform();
	}

	create_sphere(pos, r, id, material_id) {
		return [
			pos[0], pos[1], pos[2], r,
			id, material_id, -1, -1 
		];
	}
}