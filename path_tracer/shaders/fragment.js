export const FS = `

// @group(1) @binding(0) var<storage, read_write> framebufferFS: array<vec3f>;

fn get2Dfrom1D(pos: vec2f) -> u32 {

    return (u32(pos.y) * u32(screenDims.x) + u32(pos.x));
}

// fn aces_approx(v : vec3f) -> vec3f
// {
//     let v1 = v * 0.6f;
//     const a = 2.51f;
//     const b = 0.03f;
//     const c = 2.43f;
//     const d = 0.59f;
//     const e = 0.14f;
//     return clamp((v1*(a*v1+b))/(v1*(c*v1+d)+e), vec3(0.0f), vec3(1.0f));
// }


@fragment fn fs(@builtin(position) fragCoord: vec4f) -> @location(0) vec4f {

	let i = get2Dfrom1D(fragCoord.xy);
	var color = framebuffer[i].xyz / screenDims.z;

	color = aces_approx(color.xyz);
	color = pow(color.xyz, vec3f(1/2.2));

	if(screenDims[3] == 1)
	{
		framebuffer[i] = vec4f(0);
	}
	
	return vec4f(color, 1);
  }
`;