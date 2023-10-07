export const FS = `

// @group(1) @binding(0) var<storage, read_write> framebufferFS: array<vec3f>;

fn get2Dfrom1D(pos: vec2f) -> u32 {

    return (u32(pos.y) * u32(screenDims.x) + u32(pos.x));
}

@fragment fn fs(@builtin(position) fragCoord: vec4f) -> @location(0) vec4f {

	let i = get2Dfrom1D(fragCoord.xy);
	let t2 = sphere_objs[0];
	let t3 = quad_objs[0];
	// let t4 = tri_objs[0];

	let color = framebuffer[i];

	if(screenDims[3] == 1)
	{
		framebuffer[i] = vec4f(0);
	}
	
	return vec4f(color);
  }
`;