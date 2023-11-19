fn reflectance(cosine : f32, ref_idx : f32) -> f32 {
	var r0 = (1 - ref_idx) / (1 + ref_idx);
	r0 = r0 * r0;
	return r0 + (1 - r0) * pow((1 - cosine), 5);
}

fn uniform_random_in_unit_sphere() -> vec3f {
	let phi = rand2D() * 2.0 * PI;
	let theta = acos(2.0 * rand2D() - 1.0);

	let x = sin(theta) * cos(phi);
	let y = sin(theta) * sin(phi);
	let z = cos(theta);

	return normalize(vec3f(x, y, z));
}

fn random_in_unit_disk() -> vec3f {
	let theta = 2 * PI * rand2D();
	let r = sqrt(rand2D());
	return normalize(vec3f(r * cos(theta), r * sin(theta), 0));
}

fn uniform_sampling_hemisphere() -> vec3f {
    let on_unit_sphere = uniform_random_in_unit_sphere();
	let sign_dot = select(1.0, 0.0, dot(on_unit_sphere, hitRec.normal) > 0.0);
    return normalize(mix(on_unit_sphere, -on_unit_sphere, sign_dot));
}

fn cosine_sampling_hemisphere() -> vec3f {
	return uniform_random_in_unit_sphere() + hitRec.normal;
}

// generates a random direction weighted by PDF = cos_theta / PI relative to z axis
fn cosine_sampling_wrt_Z() -> vec3f {
	let r1 = rand2D();
	let r2 = rand2D();

	let phi = 2 * PI * r1;
	let x = cos(phi) * sqrt(r2);
	let y = sin(phi) * sqrt(r2);
	let z = sqrt(1 - r2);

	return vec3f(x, y, z);
}

fn lambertian_scattering_pdf(scattered : Ray) -> f32 {
	let cos_theta = max(0, dot(hitRec.normal, scattered.dir));
	return cos_theta / PI;
}

fn uniform_scattering_pdf(scattered : Ray) -> f32 {
	return 1 / (2 * PI);
}

var<private> unit_w : vec3f;
var<private> u : vec3f;
var<private> v : vec3f;
// creates an orthonormal basis 
fn onb_build_from_w(w : vec3f) -> mat3x3f {
	unit_w = normalize(w);
	let a = select(vec3f(1, 0, 0), vec3f(0, 1, 0), abs(unit_w.x) > 0.9);
	v = normalize(cross(unit_w, a));
	u = cross(unit_w, v);
	
	return mat3x3f(u, v, unit_w);
}

fn onb_get_local(a : vec3f) -> vec3f {
	return u * a.x + v * a.y + unit_w * a.z;
}

fn onb_lambertian_scattering_pdf(scattered : Ray) -> f32 {
	let cosine_theta = dot(normalize(scattered.dir), unit_w);
	return max(0, cosine_theta/PI);
}

var<private> doSpecular : f32;
fn material_scatter(ray_in : Ray) -> Ray {

	var scattered = Ray(vec3f(0), vec3f(0));
	if(hitRec.material.material_type == LAMBERTIAN)
	{

		let uvw = onb_build_from_w(hitRec.normal);
		var diffuse_dir = cosine_sampling_wrt_Z();
		diffuse_dir = normalize(onb_get_local(diffuse_dir));

		scattered = Ray(hitRec.p, diffuse_dir);

		doSpecular = select(0.0, 1.0, rand2D() < hitRec.material.specularStrength);

		// var diffuse_dir = uniform_sampling_hemisphere();
		// var diffuse_dir = cosine_sampling_hemisphere();
		// if(near_zero(diffuse_dir)) {
		// 	diffuse_dir = hitRec.normal;
		// }

		// scattered = Ray(hitRec.p, normalize(diffuse_dir));
		var specular_dir = reflect(ray_in.dir, hitRec.normal);
		specular_dir = normalize(mix(specular_dir, diffuse_dir, hitRec.material.roughness));

		scattered = Ray(hitRec.p, normalize(mix(diffuse_dir, specular_dir, doSpecular)));

		scatterRec.skip_pdf = false;

		if(doSpecular == 1.0) {
			scatterRec.skip_pdf = true;
			scatterRec.skip_pdf_ray = scattered;
		}
	}

	else if(hitRec.material.material_type == MIRROR)
	{
		var reflected = reflect(ray_in.dir, hitRec.normal);
		scattered = Ray(hitRec.p, normalize(reflected + hitRec.material.roughness * uniform_random_in_unit_sphere()));

		scatterRec.skip_pdf = true;
		scatterRec.skip_pdf_ray = scattered;
	}

	else if(hitRec.material.material_type == GLASS)
	{
		var ir = hitRec.material.eta;
		if(hitRec.front_face == true) {
			ir = (1.0 / ir);
		}

		let unit_direction = normalize(ray_in.dir);
		let cos_theta = min(dot(-unit_direction, hitRec.normal), 1.0);
		let sin_theta = sqrt(1 - cos_theta*cos_theta);

		var direction = vec3f(0);
		if(ir * sin_theta > 1.0 || reflectance(cos_theta, ir) > rand2D()) {
			direction = reflect(unit_direction, hitRec.normal);
		}
		else {
			direction = refract(unit_direction, hitRec.normal, ir);
		}

		scattered = Ray(hitRec.p, normalize(direction));
		
		scatterRec.skip_pdf = true;
		scatterRec.skip_pdf_ray = scattered;
	}

	return scattered;
}

// fn get_light_pdf() -> vec3f {
// 	let on_light = vec3f((rand2D() * 2 - 1) * 0.35, 1, (rand2D() * 2 - 1) * 0.3);
// 	var to_light = on_light - hitRec.p;
// 	let distance_squared = length(to_light) * length(to_light);
// 	to_light = normalize(to_light);

// 	let light_area = 0.7 * 0.6;
// 	let light_cosine = abs(to_light.y);
// 	var pdf = distance_squared / (light_cosine * light_cosine);

// 	if(dot(to_light, hitRec.normal) < 0) {
// 		return 0;
// 	}

// 	if(light_cosine < 0.000001) {
// 		return 0;
// 	}

// 	let scattered = Ray(hitRec.p, to_light);
// }

fn get_random_on_quad(q : Quad, origin : vec3f) -> Ray {
	let p = q.Q + (rand2D() * q.u) + (rand2D() * q.v);
	return Ray(origin, normalize(p - origin));
}

fn light_pdf(ray : Ray, quad : Quad) -> f32 {

	if(dot(ray.dir, quad.normal) > 0) {
		return MIN_FLOAT;
	}

	let denom = dot(quad.normal, ray.dir);

	if(abs(denom) < 1e-8) {
		return MIN_FLOAT;
	}

	let t = (quad.D - dot(quad.normal, ray.origin)) / denom;
	if(t <= 0.001 || t >= MAX_FLOAT) {
		return MIN_FLOAT;
	}

	let intersection = at(ray, t);
	let planar_hitpt_vector = intersection - quad.Q;
	let alpha = dot(quad.w, cross(planar_hitpt_vector, quad.v));
	let beta = dot(quad.w, cross(quad.u, planar_hitpt_vector));

	if(alpha < 0 || 1 < alpha || beta < 0 || 1 < beta) {
		return MIN_FLOAT;
	}

	var hitNormal = quad.normal;
	let front_face = dot(ray.dir, quad.normal) < 0;
	if(front_face == false)
	{
		hitNormal = -hitNormal;
	}

	let distance_squared = t * t * length(ray.dir) * length(ray.dir);
	let cosine = abs(dot(ray.dir, hitNormal) / length(ray.dir));

	return (distance_squared / (cosine * length(cross(lights.u, lights.v))));
}

var<private> background_color = vec3f(0.7, 0.7, 0.7);
// var<private> background_color = vec3f(0.1, 0.7, 0.88);
// var<private> background_color = vec3f(19/255.0, 24/255.0, 98/255.0);
// var<private> background_color = vec3f(0, 0, 0);
fn ray_color(ray : Ray) -> vec3f {

	var curRay = ray;
	var acc_light = vec3f(0);
	var acc_color = vec3f(1);
	// let a = 0.4 * (1 - (coords.y / screenDims.y));
	
	for(var i = 0; i < MAX_BOUNCES; i++)
	{
		if(hit2(curRay) == false)
		{
			// return acc_color * ((1 - a) * vec3f(1) + a * background_color);
			acc_light += (1 * background_color) * acc_color;
			break;
		}

		// unidirectional light
		var emissionColor = hitRec.material.emissionColor;
		if(!hitRec.front_face) {
			emissionColor = vec3f(0);
		}

		// IMPORTANCE SAMPLING TOWARDS LIGHT
		// diffuse scatter ray
		let scatterred_surface = material_scatter(curRay);

		if(scatterRec.skip_pdf) {
			acc_light += emissionColor * acc_color;
			acc_color *= 1 * mix(hitRec.material.color, hitRec.material.specularColor, doSpecular);

			curRay = scatterRec.skip_pdf_ray;
			continue;
		}

		// ray sampled towards light
		let scattered_light = get_random_on_quad(lights, hitRec.p);

		var scattered = scattered_light;
		if(rand2D() > 0.2) {
			scattered = scatterred_surface;
		}

		let lambertian_pdf = onb_lambertian_scattering_pdf(scattered);
		let light_pdf = light_pdf(scattered, lights);
		let pdf = 0.2 * light_pdf + 0.8 * lambertian_pdf;

		if(pdf <= 0.00000001) {
			return emissionColor * acc_color;
		}

		acc_light += emissionColor * acc_color;
		acc_color *= ((1 * lambertian_pdf * mix(hitRec.material.color, hitRec.material.specularColor, doSpecular)) / pdf);
		curRay = scattered;


		// let scattered = material_scatter(curRay);
		// // let scattering_pdf = lambertian_scattering_pdf(scattered);
		// // let pdf = scattering_pdf;

		// // if(pdf <= 0.00000001) {
		// // 	return emissionColor * acc_color;
		// // }

		// acc_light += emissionColor * acc_color;
		// // acc_color *= ((1 * scattering_pdf * mix(hitRec.material.color, hitRec.material.specularColor, doSpecular)) / pdf);
		// acc_color *= ((1 * mix(hitRec.material.color, hitRec.material.specularColor, doSpecular)));
		
		// curRay = scattered;

		if(i > 2) {

			let p = max(acc_color.x, max(acc_color.y, acc_color.z));
			if(rand2D() > p) {
				break; 
			}

			acc_color *= (1.0 / p);
		}
	} 

	return acc_light;
}

fn hit(ray : Ray) -> bool
{
	var closest_so_far = MAX_FLOAT;
	var hit_anything = false;

	for(var i = 0; i < NUM_TRIANGLES; i++)
	{
		if(hit_triangle(triangles[i], 0.0000001, closest_so_far, ray))
		{
			hit_anything = true;
			closest_so_far = hitRec.t;
		}
	}

	for(var i = 0; i < NUM_SPHERES; i++)
	{
		if(hit_sphere(sphere_objs[i], 0.0000001, closest_so_far, ray))
		{
			hit_anything = true;
			closest_so_far = hitRec.t;
		}
	}

	for(var i = 0; i < NUM_QUADS; i++)
	{
		if(hit_quad(quad_objs[i], 0.0000001, closest_so_far, ray))
		{
			hit_anything = true;
			closest_so_far = hitRec.t;
		}
	}

	return hit_anything;
}

fn hit2(ray : Ray) -> bool
{
	var closest_so_far = MAX_FLOAT;
	var hit_anything = false;

	var i = 0;
	while(i < NUM_AABB && i != -1) {
		
		if(hit_aabb(bvh[i], ray)) {

			let t = i32(bvh[i].prim_type);
			
			if(t == 2) {

				let startPrim = i32(bvh[i].prim_id);
				let countPrim = i32(bvh[i].prim_count);
				for(var j = 0; j < countPrim; j++) {
					if(hit_triangle(triangles[startPrim + j], 0.000001, closest_so_far, ray))
					{
						hit_anything = true;
						closest_so_far = hitRec.t;
					}
				}
			}

			i++;
		}
		else {
			i = i32(bvh[i].skip_link);
		}
	}

	for(var i = 0; i < NUM_SPHERES; i++)
	{
		if(hit_sphere(sphere_objs[i], 0.000001, closest_so_far, ray))
		{
			hit_anything = true;
			closest_so_far = hitRec.t;
		}
	}

	for(var i = 0; i < NUM_QUADS; i++)
	{
		if(hit_quad(quad_objs[i], 0.000001, closest_so_far, ray))
		{
			hit_anything = true;
			closest_so_far = hitRec.t;
		}
	}

	return hit_anything;
}

// To get pixel center ->
//		x = aspect * (2 * (x / width) - 1) 	[ranges from -aspect to +aspect]
//		y = -(2 * (y / height) - 1)			[ranges from +1 to -1]
fn antialiased_color() -> vec3f {
	
	var pixColor = vec3f(0, 0, 0);
	let sqrt_spp = sqrt(NUM_SAMPLES);
	let recip_sqrt_spp = 1.0 / f32(i32(sqrt_spp));
	var count = 0.0;

	// stratified sampling
	for(var i = 0.0; i < sqrt_spp; i+= 1.0)
	{
		for(var j = 0.0; j < sqrt_spp; j += 1.0)
		{
			let ray = camera_get_ray2(
				(screenDims.x / screenDims.y) * (2 * ((coords.x - 0.5 + (recip_sqrt_spp * (i + rand2D()))) / screenDims.x) - 1),
				-1 * (2 * ((coords.y - 0.5 + (recip_sqrt_spp * (j + rand2D()))) / screenDims.y) - 1)
			);
			pixColor += ray_color(ray);

			count += 1;
		}
	}
	pixColor /= count;

	// for(var i = 0; i < NUM_SAMPLES; i += 1)
	// {
	// 	let ray = camera_get_ray2(
	// 		(screenDims.x / screenDims.y) * (2 * ((coords.x  - 0.5 + rand2D()) / screenDims.x) - 1), 
	// 		-1 * (2 * ((coords.y  - 0.5 + rand2D()) / screenDims.y) - 1)
	// 	);
	// 	pixColor += ray_color(ray);
	// }

	// pixColor /= NUM_SAMPLES;
	// pixColor = aces_approx(pixColor);
	return pixColor;
}

var<private> fovFactor : f32;
var<private> cam_origin : vec3f;
fn camera_get_ray2(s : f32, t : f32) -> Ray {

	// let origin = (viewMatrix * vec4f(0, 0, 0, 1)).xyz;
	let dir = (viewMatrix * vec4f(vec3f(s, t, -fovFactor), 0)).xyz;		// not normalized
	var ray = Ray(cam_origin, dir);

	return ray;
}

@compute @workgroup_size(64, 1, 1) fn computeSomething(@builtin(workgroup_id) workgroup_id : vec3<u32>, @builtin(local_invocation_id) local_invocation_id : vec3<u32>, @builtin(local_invocation_index) local_invocation_index: u32, @builtin(num_workgroups) num_workgroups: vec3<u32>) {
	
	let workgroup_index = workgroup_id.x + workgroup_id.y * num_workgroups.x + workgroup_id.z * num_workgroups.x * num_workgroups.y;
	let i = workgroup_index * 64 + local_invocation_index;
	let fragCoord = vec3f(f32(i) % screenDims.x, f32(i) / screenDims.x, 1);

	fovFactor = 1 / tan(60 * (PI / 180) / 2);
	cam_origin = (viewMatrix * vec4f(0, 0, 0, 1)).xyz;

	NUM_SPHERES = i32(arrayLength(&sphere_objs));
	NUM_QUADS = i32(arrayLength(&quad_objs));
	NUM_MESHES = i32(arrayLength(&meshes));
	NUM_TRIANGLES = i32(arrayLength(&triangles));
	// NUM_MESHES = 0;	
	NUM_AABB = i32(arrayLength(&bvh));

	coords = fragCoord.xyz;

	randState = i + u32(screenDims.z) * 719393;

	get_lights();
	var fragColor = antialiased_color();
	var accFragColor = fragColor.xyz;

	if(screenDims[3] == 0)
	{
		accFragColor = framebuffer[i].xyz + fragColor;
	}

	framebuffer[i] = vec4f(accFragColor.xyz, 1.0);
}