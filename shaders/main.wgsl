@compute @workgroup_size(64, 1, 1) fn computeFrameBuffer(@builtin(workgroup_id) workgroup_id : vec3<u32>, @builtin(local_invocation_id) local_invocation_id : vec3<u32>, @builtin(local_invocation_index) local_invocation_index: u32, @builtin(num_workgroups) num_workgroups: vec3<u32>) {
	
	let workgroup_index = workgroup_id.x + workgroup_id.y * num_workgroups.x + workgroup_id.z * num_workgroups.x * num_workgroups.y;
	let pixelIndex = workgroup_index * 64 + local_invocation_index;		// global invocation index
	pixelCoords = vec3f(f32(pixelIndex) % uniforms.screenDims.x, f32(pixelIndex) / uniforms.screenDims.x, 1);

	fovFactor = 1 / tan(60 * (PI / 180) / 2);
	cam_origin = (uniforms.viewMatrix * vec4f(0, 0, 0, 1)).xyz;

	NUM_SPHERES = i32(arrayLength(&sphere_objs));
	NUM_QUADS = i32(arrayLength(&quad_objs));
	NUM_MESHES = i32(arrayLength(&meshes));
	NUM_TRIANGLES = i32(arrayLength(&triangles));
	NUM_AABB = i32(arrayLength(&bvh));

	randState = pixelIndex + u32(uniforms.frameNum) * 719393;

	get_lights();
	var pathTracedColor = pathTrace();
	var fragColor = pathTracedColor.xyz;

	if(uniforms.resetBuffer == 0)
	{
		fragColor = framebuffer[pixelIndex].xyz + pathTracedColor;
	}

	framebuffer[pixelIndex] = vec4f(fragColor.xyz, 1.0);
}