import { AABB } from "./AABB.js";

export class BVH {

	constructor() {
		this.left = null;
		this.right = null;
		this.bbox = new AABB();
		this.obj = null;

		// this.triID = -1;
		// this.numTri = 0;
		// this.leafTri = [];

		this.id = -1;
		this.hit_node = null;
		this.miss_node = null;
	}

	static create_bvh(objs) {
		return BVH.generate_bvh_heirarchy(objs, 0, objs.length - 1);
	}

	static generate_bvh_heirarchy(objs, start, end) {

		let node = new BVH();
		for(var i = start; i <= end; i++) {
			node.bbox.merge(objs[i].bbox);
		}

		// choose the longest axis as the axis to split about
		let extent = node.bbox.extent();
		let axis = 0;
		if(extent[1] > extent[0]) axis = 1;
		if(extent[2] > extent[axis]) axis = 2;
		let splitPos = node.bbox.centroid(axis);
		let comparator = (axis == 0) ? BVH.box_x_compare : (axis == 1) ? BVH.box_y_compare : BVH.box_z_compare;

		let obj_span = end - start;

		// Create a new node. If single object present then it is a leaf node
		if(obj_span == 0) {
			node.obj = objs[start];
			node.bbox = node.obj.bbox;

			// node.leafTri.push(objs[start]);
		}

		else {
			// Create a shallow copy and sort along the chosen axis
			const subarray = objs.slice(start, end + 1); 
			subarray.sort(comparator);
			objs.splice(start, subarray.length, ...subarray);

			// Assign the first half to the left child and the second half to the right child
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

	static box_compare(a, b, axis_index) {
		return (a.bbox.axis(axis_index)[0]) - (b.bbox.axis(axis_index)[0]);
	}

	static box_x_compare(a, b) { return BVH.box_compare(a, b, 0) };
	static box_y_compare(a, b) { return BVH.box_compare(a, b, 1) };
	static box_z_compare(a, b) { return BVH.box_compare(a, b, 2) };




	// ================= Surface Area Heuristic ================== //

	static generate_bvh_heirarchy_SAH(objs, start, end) {

		let node = new BVH();

		// choose the longest axis as the axis to split about
		let splits = BVH.FindBestSplitPlane3(objs, start, end);
		let axis = splits[0];
		let splitPos = splits[1];
		
		let comparator = (axis == 0) ? BVH.box_x_compare : (axis == 1) ? BVH.box_y_compare : BVH.box_z_compare;

		let obj_span = end - start;

		// Create a new node. If single object present then it is a leaf node
		if(obj_span == 0) {
			node.obj = objs[start]
			node.bbox = node.obj.bbox;
		}

		else {
			// Create a shallow copy and sort along the chosen axis
			const subarray = objs.slice(start, end + 1); 
			subarray.sort(comparator);
			objs.splice(start, subarray.length, ...subarray);

			// var i = start;
			// var j = end;
			// while(i < j) {
			// 	if(objs[i].bbox.centroid(axis) < splitPos) {
			// 		i++;
			// 	}
			// 	else {
			// 		let temp = objs[i];
			// 		objs[i] = objs[j];
			// 		objs[j] = temp;
			// 		j--;
			// 	}
			// }

			let splitIdx = start;
			while(splitIdx < end - 1) {
				let centroid = objs[splitIdx].bbox.centroid(axis);
				if(centroid <= splitPos)
					splitIdx++
				else
					break;
			}
			
			// Assign the first half to the left child and the second half to the right child
			let mid = splitIdx;
			node.left = BVH.generate_bvh_heirarchy_SAH(objs, start, mid);
			node.right = BVH.generate_bvh_heirarchy_SAH(objs, mid + 1, end);

			node.bbox.merge_bbox(node.left.bbox, node.right.bbox);
		}

		return node;
	}

	static evaluateSAH(objs, start, end, axis, pos) {
		let leftBox = new AABB(), rightBox = new AABB();
		var leftCount = 0, rightCount = 0;
		for(var i = start; i <= end; i++) {
			let centroid = objs[i].bbox.centroid(axis);
			if(centroid < pos) {
				leftCount++;
				leftBox.merge(objs[i].bbox);
			}
			else {
				rightCount++;
				rightBox.merge(objs[i].bbox);
			}
		}
		var cost = leftCount * leftBox.surface_area() + rightCount * rightBox.surface_area();
		return cost > 0 ? cost : 1e30;
	}

	static FindBestSplitPlane1(objs, start, end) {
		let bestAxis = -1;
		let bestPos = 0, bestCost = 1e30;
		for(var i = 0; i < 3; i++) {
			for(var j = start; j <= end; j++) {
				var candidatePos = objs[j].bbox.centroid(i);
				var cost = BVH.evaluateSAH(objs, start, end, i, candidatePos);
				if(cost < bestCost) {
					bestPos = candidatePos;
					bestAxis = i;
					bestCost = cost;
				}
			}
		}

		return [bestAxis, bestPos];
	}

	static FindBestSplitPlane2(objs, start, end) {
		let bestAxis = -1;
		let bestPos = 0, bestCost = 1e30;

		for(var i = 0; i < 3; i++) {
			let boundsMin = 1e30, boundsMax = -1e30;
			for(let j = start; j <= end; j++) {
				boundsMin = Math.min(boundsMin, objs[j].bbox.centroid(i));
				boundsMax = Math.max(boundsMax, objs[j].bbox.centroid(i));
			}
			
			if(boundsMin == boundsMax)	continue;
			let scale = (boundsMax - boundsMin) / 100;
			for(var j = 1; j < 100; j++) {
				var candidatePos = boundsMin + j * scale;
				var cost = BVH.evaluateSAH(objs, start, end, i, candidatePos);
				if(cost < bestCost) {
					bestPos = candidatePos;
					bestAxis = i;
					bestCost = cost;
				}
			}
		}

		return [bestAxis, bestPos];
	}


	static FindBestSplitPlane3(objs, start, end) {
		let bestCost = 1e30;
		let BINS = 8;
		var axis = 0;
		var splitPos = 0;
	  
		for(let a = 0; a < 3; a++) {
			let boundsMin = 1e30;
		  	let boundsMax = -1e30;
	  
			// finding the bounds of centroids of all objects
		  	for(let i = start; i <= end; i++) {
				boundsMin = Math.min(boundsMin, objs[i].bbox.centroid(a));
				boundsMax = Math.max(boundsMax, objs[i].bbox.centroid(a));
		  	}
	  
		  	if (boundsMin === boundsMax) continue;
	  
		  	// Populate the bins
		  	const bin = Array.from({ length: BINS }, () => new Bin());
		  	var scale = BINS / (boundsMax - boundsMin);
	  
		  	for(let i = start; i <= end; i++) {
				const binIdx = Math.min(BINS - 1, Math.floor((objs[i].bbox.centroid(a) - boundsMin) * scale));
				bin[binIdx].triCount++;
				bin[binIdx].bounds.merge(objs[i].bbox);
		  	}
	  
		  	// Gather data for the 7 planes between the 8 bins
		  	const leftArea = Array(BINS - 1).fill(0), rightArea = Array(BINS - 1).fill(0);
		  	const leftCount = Array(BINS - 1).fill(0), rightCount = Array(BINS - 1).fill(0);
		  	let leftBox = new AABB(), rightBox = new AABB();
		  	let leftSum = 0, rightSum = 0;
	  
		  	for(let i = 0; i < BINS - 1; i++) {
				leftSum += bin[i].triCount;
				leftCount[i] = leftSum;
				leftBox.merge(bin[i].bounds);
				leftArea[i] = leftBox.surface_area();
	  
				rightSum += bin[BINS - 1 - i].triCount;
				rightCount[BINS - 2 - i] = rightSum;
				rightBox.merge(bin[BINS - 1 - i].bounds);
				rightArea[BINS - 2 - i] = rightBox.surface_area();
		  	}
	  
		  	// Calculate SAH cost for the 7 planes
		  	scale = (boundsMax - boundsMin) / BINS;
	  
		  	for(let i = 0; i < BINS - 1; i++) {
				const planeCost = leftCount[i] * leftArea[i] + rightCount[i] * rightArea[i];
	  
				if(planeCost < bestCost) {
			  		axis = a;
			  		splitPos = boundsMin + scale * (i + 1);
			  		bestCost = planeCost;
				}
		  	}
		}

		return [axis, splitPos];
	}
}

class Bin {
	constructor() {
	  	this.bounds = new AABB();
	  	this.triCount = 0;
	}
}