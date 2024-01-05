fn hitScene(ray : Ray) -> bool
{
	var closest_so_far = MAX_FLOAT;
	var hit_anything = false;

	for(var i = 0; i < NUM_SPHERES; i++)
	{
		let medium = materials[i32(sphere_objs[i].material_id)].material_type;
		if(medium < ISOTROPIC) 
		{
			if(hit_sphere(sphere_objs[i], ray_tmin, closest_so_far, ray))
			{
				hit_anything = true;
				closest_so_far = hitRec.t;
			}
		}
		else 
		{
			if(hit_volume(sphere_objs[i], ray_tmin, closest_so_far, ray))
			{
				hit_anything = true;
				closest_so_far = hitRec.t;
			}
		}

		// if(hit_sphere(sphere_objs[i], ray_tmin, closest_so_far, ray))
		// {
		// 	hit_anything = true;
		// 	closest_so_far = hitRec.t;
		// }
	}

	for(var i = 0; i < NUM_QUADS; i++)
	{
		if(hit_quad(quad_objs[i], ray_tmin, closest_so_far, ray))
		{
			hit_anything = true;
			closest_so_far = hitRec.t;
		}
	}

	// traversing BVH using a stack implementation
	// https://pbr-book.org/3ed-2018/Primitives_and_Intersection_Acceleration/Bounding_Volume_Hierarchies#CompactBVHForTraversal

	const leafNode = 2;		// fix this hardcoding later
	var invDir = 1 / ray.dir;
	var toVisitOffset = 0;
	var curNodeIdx = 0;
	var node = bvh[curNodeIdx];

	while(true) {
		node = bvh[curNodeIdx];

		if(hit_aabb(node, ray_tmin, closest_so_far, ray, invDir)) 
		{
			if(i32(node.prim_type) == leafNode) 
			{

				let startPrim = i32(node.prim_id);
				let countPrim = i32(node.prim_count);
				for(var j = 0; j < countPrim; j++) 
				{
					if(hit_triangle(triangles[startPrim + j], ray_tmin, closest_so_far, ray))
					{
						hit_anything = true;
						closest_so_far = hitRec.t;
					}
				}

				if(toVisitOffset == 0) 
				{
					break;
				}
				toVisitOffset--;
				curNodeIdx = stack[toVisitOffset];
			}

			else 
			{
				if(ray.dir[i32(node.axis)] < 0) 
				{
					stack[toVisitOffset] = curNodeIdx + 1;
					toVisitOffset++;
					curNodeIdx = i32(node.right_offset);
				}
				else 
				{
					stack[toVisitOffset] = i32(node.right_offset);
					toVisitOffset++;
					curNodeIdx++;
				}
			}
		}

		else 
		{
			if(toVisitOffset == 0) 
			{
				break;
			}

			toVisitOffset--;
			curNodeIdx = stack[toVisitOffset];
		}

		if(toVisitOffset >= STACK_SIZE) 
		{
			break;
		}
	}

	return hit_anything;
}






// ============== Other BVH traversal methods (brute force and using skip pointers) =================







// fn hit_skipPointers(ray : Ray) -> bool
// {
// 	var closest_so_far = MAX_FLOAT;
// 	var hit_anything = false;

// 	var invDir = 1 / ray.dir;
// 	var i = 0;
// 	while(i < NUM_AABB && i != -1) 
// 	{
// 		if(hit_aabb(bvh[i], ray_tmin, closest_so_far, ray, invDir)) 
// 		{

// 			let t = i32(bvh[i].prim_type);
			
// 			if(t == 2) {

// 				let startPrim = i32(bvh[i].prim_id);
// 				let countPrim = i32(bvh[i].prim_count);
// 				for(var j = 0; j < countPrim; j++) 
// 				{
// 					if(hit_triangle(triangles[startPrim + j], ray_tmin, closest_so_far, ray))
// 					{
// 						hit_anything = true;
// 						closest_so_far = hitRec.t;
// 					}
// 				}
// 			}

// 			i++;
// 		}

// 		else 
// 		{
// 			i = i32(bvh[i].skip_link);
// 		}
// 	}

// 	for(var i = 0; i < NUM_SPHERES; i++)
// 	{
// 		if(hit_sphere(sphere_objs[i], ray_tmin, closest_so_far, ray))
// 		{
// 			hit_anything = true;
// 			closest_so_far = hitRec.t;
// 		}
// 	}

// 	for(var i = 0; i < NUM_QUADS; i++)
// 	{
// 		if(hit_quad(quad_objs[i], ray_tmin, closest_so_far, ray))
// 		{
// 			hit_anything = true;
// 			closest_so_far = hitRec.t;
// 		}
// 	}

// 	return hit_anything;
// }



// fn hit_bruteForce(ray : Ray) -> bool
// {
// 	var closest_so_far = MAX_FLOAT;
// 	var hit_anything = false;

// 	for(var i = 0; i < NUM_TRIANGLES; i++)
// 	{
// 		if(hit_triangle(triangles[i], ray_tmin, closest_so_far, ray))
// 		{
// 			hit_anything = true;
// 			closest_so_far = hitRec.t;
// 		}
// 	}

// 	for(var i = 0; i < NUM_SPHERES; i++)
// 	{
// 		if(hit_sphere(sphere_objs[i], ray_tmin, closest_so_far, ray))
// 		{
// 			hit_anything = true;
// 			closest_so_far = hitRec.t;
// 		}
// 	}

// 	for(var i = 0; i < NUM_QUADS; i++)
// 	{
// 		if(hit_quad(quad_objs[i], ray_tmin, closest_so_far, ray))
// 		{
// 			hit_anything = true;
// 			closest_so_far = hitRec.t;
// 		}
// 	}

// 	return hit_anything;
// }