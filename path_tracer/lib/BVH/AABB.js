export class AABB {
	constructor() {
		this.min = [];
		this.max = [];
	}

	bbox(a, b) {
		this.min = [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.min(a[2], b[2])];
		this.max = [Math.max(a[0], b[0]), Math.max(a[1], b[1]), Math.max(a[2], b[2])];
		// this.x = [Math.min(a[0], b[0]), Math.max(a[0], b[0])];
		// this.y = [Math.min(a[1], b[1]), Math.max(a[1], b[1])];
		// this.z = [Math.min(a[2], b[2]), Math.max(a[2], b[2])];
	}

	bbox_triangle(a, b, c) {
		this.min = [
			Math.min(a[0], Math.min(b[0], c[0])),
			Math.min(a[1], Math.min(b[1], c[1])),
			Math.min(a[2], Math.min(b[2], c[2]))
		]

		this.max = [
			Math.max(a[0], Math.max(b[0], c[0])),
			Math.max(a[1], Math.max(b[1], c[1])),
			Math.max(a[2], Math.max(b[2], c[2]))
		]
	}

	merge_bbox(a, b) {
		this.min = [Math.min(a.min[0], b.min[0]), Math.min(a.min[1], b.min[1]), Math.min(a.min[2], b.min[2])];
		this.max = [Math.max(a.max[0], b.max[0]), Math.max(a.max[1], b.max[1]), Math.max(a.max[2], b.max[2])];
		// this.x = [Math.min(a.x[0], b.x[0]), Math.max(a.x[1], b.x[1])]
		// this.y = [Math.min(a.y[0], b.y[0]), Math.max(a.y[1], b.y[1])]
		// this.z = [Math.min(a.z[0], b.z[0]), Math.max(a.z[1], b.z[1])]
	}

	pad() {
		let delta = 0.0001 / 2;
		if(this.max[0] - this.min[0] < delta) {
			this.max[0] += delta;
			this.min[0] -= delta;
		}

		if(this.max[1] - this.min[1] < delta) {
			this.max[1] += delta;
			this.min[1] -= delta;
		}

		if(this.max[2] - this.min[2] < delta) {
			this.max[2] += delta;
			this.min[2] -= delta;
		}
	}

	axis(a) {
		if(a == 0)
			return [this.min[0], this.max[0]];
		if(a == 1)
			return [this.min[1], this.max[1]];
		return [this.min[2], this.max[2]];
	}
}