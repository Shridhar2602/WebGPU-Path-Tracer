import { AABB } from "./AABB.js";

export class BVH {

	constructor() {
		this.left = null;
		this.right = null;
		this.bbox = new AABB();
		this.obj = null;

		this.id = -1;
		this.hit_node = null;
		this.miss_node = null;
	}

	static create_bvh(objs) {
		return BVH.generate_bvh_heirarchy(objs, 0, objs.length - 1);
	}

	static generate_bvh_heirarchy(objs, start, end) {

		let axis = Math.floor(Math.random() * 3);
		let comparator = (axis == 0) ? BVH.box_x_compare : (axis == 1) ? BVH.box_y_compare : BVH.box_z_compare;

		let obj_span = end - start;

		let node = new BVH();
		if(obj_span == 0) {
			node.obj = objs[start]
			node.bbox = node.obj.bbox;
		}

		else {
			// console.log(objs[1])
			const subarray = objs.slice(start, end + 1); 
			subarray.sort(comparator);
			objs.splice(start, subarray.length, ...subarray);
			// console.log(objs[1])

			let mid = start + Math.floor(obj_span / 2);
			node.left = BVH.generate_bvh_heirarchy(objs, start, mid);
			node.right = BVH.generate_bvh_heirarchy(objs, mid + 1, end);

			node.bbox.merge_bbox(node.left.bbox, node.right.bbox);
		}

		return node;
	}

	// https://stackoverflow.com/questions/55479683/traversal-of-bounding-volume-hierachy-in-shaders/55483964#55483964
	static populate_links(bvh, next_right_node = null) {
		
		// if not leaf node
		if(bvh.obj == null) {

			bvh.hit_node = bvh.left;
			bvh.miss_node = next_right_node;

			BVH.populate_links(bvh.left, bvh.right);
			BVH.populate_links(bvh.right, next_right_node);
		}

		else {
			bvh.hit_node = next_right_node;
			bvh.miss_node = bvh.hit_node;
		}
	}

	static create_lbvh(objs) {
		objs.sort(BVH.lbvh_compare);
		console.log(objs)
		return BVH.generate_lbvh_heirarchy(objs, 0, objs.length - 1);
	}

	static generate_lbvh_heirarchy(sorted_objs, first, last) {
		
		let node = new BVH();
		if(first == last) {
			node.obj = sorted_objs[first];
			node.bbox = node.obj.bbox;
			return node;
		}

		let split = BVH.find_split(sorted_objs, first, last);

		node.left = BVH.generate_lbvh_heirarchy(sorted_objs, first, split);
		node.right = BVH.generate_lbvh_heirarchy(sorted_objs, split + 1, last);
		node.bbox.merge_bbox(node.left.bbox, node.right.bbox);
		return node;
	}

	static find_split(sorted_objs, first, last) {
		// Identical Morton codes => split the range in the middle.
		const firstCode = sorted_objs[first];
		const lastCode = sorted_objs[last];
	
		if (firstCode === lastCode) {
			return Math.floor((first + last) / 2);
		}
	
		// Calculate the number of highest bits that are the same
		// for all objects, using the count-leading-zeros intrinsic.
		const commonPrefix = Math.clz32(firstCode ^ lastCode);
	
		// Use binary search to find where the next bit differs.
		// Specifically, we are looking for the highest object that
		// shares more than commonPrefix bits with the first one.
		let split = first; // initial guess
		let step = last - first;
	
		do {
			step = (step + 1) >> 1; // exponential decrease
			const newSplit = split + step; // proposed new position
	
			if (newSplit < last) {
				const splitCode = sorted_objs[newSplit].morton;
				const splitPrefix = Math.clz32(firstCode ^ splitCode);
				if (splitPrefix > commonPrefix) {
					split = newSplit; // accept proposal
				}
			}
		} while (step > 1);
	
		return split;
	}

	static box_compare(a, b, axis_index) {
		return (a.bbox.axis(axis_index)[0]) - (b.bbox.axis(axis_index)[0]);
	}

	static lbvh_compare(a, b) { return a.morton - b.morton };

	static box_x_compare(a, b) { return BVH.box_compare(a, b, 0) };
	static box_y_compare(a, b) { return BVH.box_compare(a, b, 1) };
	static box_z_compare(a, b) { return BVH.box_compare(a, b, 2) };
}