import { vec3, mat4 } from 'https://cdn.skypack.dev/gl-matrix';	
import { Transform } from "./transform.js";

export class Quad {
	constructor(Q, u, v, id, material_id) {

		this.data = this.create_quad(Q, u, v, id, material_id);
		this.transform = new Transform();
	}

	create_quad(Q, u, v, id, material_id) {
		var n = vec3.create(), normal = vec3.create(), w = vec3.create(), D = 0;
		vec3.cross(n, u, v);
		vec3.normalize(normal, n);
		D = vec3.dot(normal, Q);
		var temp = vec3.dot(n, n);
		vec3.set(w, n[0] / temp, n[1] / temp, n[2] / temp);
	
		return [
			Q[0], Q[1], Q[2], -1,
			u[0], u[1], u[2], -1,
			v[0], v[1], v[2], id,
			normal[0], normal[1], normal[2], D,
			w[0], w[1], w[2], material_id,
		];
	}
}