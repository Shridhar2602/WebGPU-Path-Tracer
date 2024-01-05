import { BVH } from './bvhNode.js';

let flattened_id = 0;
let flattened_array = [];

export function build_bvh(primitives) {

	console.log("building bvh...");
	console.log("number of primitives: " + primitives.length);

	let curTime = performance.now();
	const bvh = BVH.create_bvh(primitives);
	BVH.populate_links(bvh.bvh);
	
	console.log("bvh tree build time: " + (performance.now() - curTime) + "ms");

	curTime = performance.now();
	flattened_array = [];
	flattened_id = 0;
	flattenBVH(bvh.bvh, flattened_array);

	flattened_array.forEach((obj, i) => {
		
		obj[10] = obj[10]?.id ?? -1;
		obj[3] = obj[3]?.id ?? -1;
	})

	console.log("bvh flattening time: " + (performance.now() - curTime) + "ms");
	console.log("bvh size: " + flattened_array.length);

	return {
		bvh: bvh,
		flattened_array: flattened_array,
	};
}

function flattenBVH(node) {
	if(node == null)
		return;

	node.id = flattened_id++;

	if(node.obj != null) 
	{
		flattened_array.push([node.bbox.min[0], node.bbox.min[1], node.bbox.min[2], node.right_offset, node.bbox.max[0], node.bbox.max[1], node.bbox.max[2], node.obj.type, node.startID, node.triCount, node.miss_node, node.axis]);
	}
	else 
	{
		flattened_array.push([node.bbox.min[0], node.bbox.min[1], node.bbox.min[2], node.right_offset, node.bbox.max[0], node.bbox.max[1], node.bbox.max[2], -1, -1, -1, node.miss_node, node.axis]);
	}

	flattenBVH(node.left);
	flattenBVH(node.right);
}

