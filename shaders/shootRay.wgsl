// To get pixel center ->
//		x = aspect * (2 * (x / width) - 1) 	[ranges from -aspect to +aspect]
//		y = -(2 * (y / height) - 1)			[ranges from +1 to -1]

fn pathTrace() -> vec3f {
	
	var pixColor = vec3f(0, 0, 0);

	if(STRATIFY) 
	{
		let sqrt_spp = sqrt(NUM_SAMPLES);
		let recip_sqrt_spp = 1.0 / f32(i32(sqrt_spp));
		var numSamples = 0.0;	// NUM_SAMPLES may not be perfect square

		for(var i = 0.0; i < sqrt_spp; i += 1.0)
		{
			for(var j = 0.0; j < sqrt_spp; j += 1.0)
			{
				let ray = getCameraRay(
					(uniforms.screenDims.x / uniforms.screenDims.y) * (2 * ((pixelCoords.x - 0.5 + (recip_sqrt_spp * (i + rand2D()))) / uniforms.screenDims.x) - 1),
					-1 * (2 * ((pixelCoords.y - 0.5 + (recip_sqrt_spp * (j + rand2D()))) / uniforms.screenDims.y) - 1)
				);

				pixColor += ray_color(ray);

				numSamples += 1;
			}
		}

		pixColor /= numSamples;
	}

	else 
	{
		for(var i = 0; i < NUM_SAMPLES; i += 1)
		{
			let ray = getCameraRay(
				(uniforms.screenDims.x / uniforms.screenDims.y) * (2 * ((pixelCoords.x  - 0.5 + rand2D()) / uniforms.screenDims.x) - 1), 
				-1 * (2 * ((pixelCoords.y  - 0.5 + rand2D()) / uniforms.screenDims.y) - 1)
			);

			pixColor += ray_color(ray);
		}

		pixColor /= NUM_SAMPLES;
	}

	return pixColor;
}

var<private> fovFactor : f32;
var<private> cam_origin : vec3f;

fn getCameraRay(s : f32, t : f32) -> Ray {

	let dir = normalize(uniforms.viewMatrix * vec4f(vec3f(s, t, -fovFactor), 0)).xyz;
	var ray = Ray(cam_origin, dir);

	return ray;
}