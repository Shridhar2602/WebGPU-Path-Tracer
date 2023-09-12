@group(0) @binding(0) var<uniform> screenDims: vec4<f32>;
@group(0) @binding(1) var<storage, read> sphere_objs: array<Sphere>;
@group(0) @binding(2) var<storage, read> quad_objs: array<Quad>;
@group(0) @binding(3) var<storage, read_write> framebuffer: array<vec4f>;
@group(0) @binding(4) var<uniform> viewMatrix: mat4x4f;

var<private> NUM_SPHERES : i32;
var<private> NUM_QUADS : i32;

var<private> randState : u32 = 0u;
var<private> coords : vec3f;

var<private> hitRec : HitRecord;
var<private> cam : Camera;
var<private> vp : viewPort;

// PCG prng
// https://www.shadertoy.com/view/XlGcRh
fn rand2D() -> f32 
{
	randState = randState * 747796405u + 2891336453u;
	var word : u32 = ((randState >> ((randState >> 28u) + 4u)) ^ randState) * 277803737u;
	return f32((word >> 22u)^word) / 4294967295;
}

fn randNormalDist() -> f32 {
	let theta = 2 * PI * rand2D();
	let rho = sqrt(-2 * log(rand2D()));
	return rho * cos(theta);
}

fn random_double(min : f32, max : f32) -> f32 {
	return min + (max - min) * rand2D();
}

fn at(ray : Ray, t : f32) -> vec3f {
	return ray.orig + t * ray.dir;
}

fn near_zero(v : vec3f) -> bool {
	let s = 1e-8;
	return (abs(v[0]) < 0 && abs(v[1]) < 0 && abs(v[2]) < 0);
}

fn hit_sphere(sphere : Sphere, tmin : f32, tmax : f32, ray : Ray) -> bool {
	
	let oc = ray.orig - sphere.center;
	let a = dot(ray.dir, ray.dir);
	let half_b = dot(ray.dir, oc);
	let c = dot(oc, oc) - sphere.r * sphere.r;
	let discriminant = half_b*half_b - a*c;

	if(discriminant < 0) {
		return false;
	}

	let sqrtd = sqrt(discriminant);
	var root = (-half_b - sqrtd) / a;
	if(root <= tmin || root >= tmax)
	{
		root = (-half_b + sqrtd) / a;
		if(root <= tmin || root >= tmax)
		{
			return false;
		}
	}

	hitRec.t = root;
	hitRec.p = at(ray, root);
	hitRec.normal = (hitRec.p - sphere.center) / sphere.r;
	hitRec.front_face = dot(ray.dir, hitRec.normal) < 0;
	if(hitRec.front_face == false)
	{
		hitRec.normal = -hitRec.normal;
	}

	hitRec.color = sphere.color;
	hitRec.material = sphere.material;
	hitRec.fuzz = sphere.fuzz;
	hitRec.eta = sphere.eta;
	hitRec.emissionColor = sphere.emissionColor;

	return true;
}

fn hit_quad(quad : Quad, tmin : f32, tmax : f32, ray : Ray) -> bool {

	if(dot(ray.dir, quad.normal) > 0)
	{
		return false;
	}

	let denom = dot(quad.normal, ray.dir);

	// No hit if the ray is paraller to the plane
	if(abs(denom) < 1e-8) {
		return false;
	}

	let t = (quad.D - dot(quad.normal, ray.orig)) / denom;
	if(t <= tmin || t >= tmax) {
		return false;
	}

	// determine if hit point lies within quarilateral
	let intersection = at(ray, t);
	let planar_hitpt_vector = intersection - quad.Q;
	let alpha = dot(quad.w, cross(planar_hitpt_vector, quad.v));
	let beta = dot(quad.w, cross(quad.u, planar_hitpt_vector));

	if(alpha < 0 || 1 < alpha || beta < 0 || 1 < beta) {
		return false;
	}

	hitRec.t = t;
	hitRec.p = intersection;
	hitRec.normal = quad.normal;
	hitRec.front_face = dot(ray.dir, hitRec.normal) < 0;
	if(hitRec.front_face == false)
	{
		hitRec.normal = -hitRec.normal;
	}

	hitRec.color = quad.color;
	hitRec.material = quad.material;
	hitRec.fuzz = quad.fuzz;
	hitRec.eta = quad.eta;
	hitRec.emissionColor = quad.emissionColor;

	return true;
}

fn random_in_unit_sphere() -> vec3f {
	
	let phi = rand2D() * 2.0 * PI;
	let theta = acos(2.0 * rand2D() - 1.0);

	let x = sin(theta) * cos(phi);
	let y = sin(theta) * sin(phi);
	let z = cos(theta);

	// let x = randNormalDist();
	// let y = randNormalDist();
	// let z = randNormalDist();

	return normalize(vec3f(x, y, z));
}

fn random_in_unit_disk() -> vec3f {
	let theta = 2 * PI * rand2D();
	let r = sqrt(rand2D());

	return normalize(vec3f(r * cos(theta), r * sin(theta), 0));
}

fn random_on_hemisphere(normal : vec3f) -> vec3f {
	var on_unit_sphere = random_in_unit_sphere() + normal;
	if(dot(on_unit_sphere, normal) > 0.0) {
		return on_unit_sphere;
	}
	else {
		return -on_unit_sphere;
	}
}

fn reflectance(cosine : f32, ref_idx : f32) -> f32 {
	var r0 = (1 - ref_idx) / (1 + ref_idx);
	r0 = r0 * r0;
	return r0 + (1 - r0) * pow((1 - cosine), 5);
}

fn material_scatter(ray_in : Ray) -> Ray {

	var scattered = Ray(vec3f(0), vec3f(0));
	if(hitRec.material == LAMBERTIAN)
	{
		var scatter_dir = random_on_hemisphere(hitRec.normal);
		if(near_zero(scatter_dir))
		{
			scatter_dir = hitRec.normal;
		}
		scattered = Ray(hitRec.p, scatter_dir);
	}

	else if(hitRec.material == MIRROR)
	{
		var reflected = reflect(normalize(ray_in.dir), hitRec.normal);
		scattered = Ray(hitRec.p, reflected + hitRec.fuzz * random_on_hemisphere(hitRec.normal));
	}

	else if(hitRec.material == GLASS)
	{
		var ir = hitRec.eta;
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

		scattered = Ray(hitRec.p, direction);
	}

	return scattered;
}

var<private> background_color = vec3f(0.1, 0.7, 0.88);
// var<private> background_color = vec3f(19/255.0, 24/255.0, 98/255.0);
// var<private> background_color = vec3f(0, 0, 0);
fn ray_color(ray : Ray) -> vec3f {

	var curRay = ray;
	var acc_light = vec3f(0);
	var acc_color = vec3f(1);
	// let a = 0.4 * (1 - (coords.y / screenDims.y));

	for(var i = 0; i < MAX_BOUNCES; i++)
	{
		if(hit(curRay) == false)
		{
			// return acc_color * ((1 - a) * vec3f(1) + a * background_color);
			acc_light += (1 * background_color) * acc_color;
			break;
		}

		acc_light += hitRec.emissionColor * acc_color;
		acc_color *= hitRec.color;

		curRay = material_scatter(curRay);
	}

	return acc_light;
}

fn hit(ray : Ray) -> bool
{
	var closest_so_far = MAX_FLOAT;
	var hit_anything = false;

	for(var i = 0; i < NUM_SPHERES; i++)
	{
		if(hit_sphere(sphere_objs[i], 0.0001, closest_so_far, ray))
		{
			hit_anything = true;
			closest_so_far = hitRec.t;
		}
	}

	for(var i = 0; i < NUM_QUADS; i++)
	{
		if(hit_quad(quad_objs[i], 0.0001, closest_so_far, ray))
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

	// sqrt for gamma correction
	return pixColor.xyz;
}

var<private> fovFactor : f32;
fn camera_get_ray2(s : f32, t : f32) -> Ray {

	let origin = (viewMatrix * vec4f(0, 0, 0, 1)).xyz;
	let dir = (viewMatrix * vec4f(vec3f(s, t, -fovFactor), 0)).xyz;		// not normalized
	var ray = Ray(origin, dir);

	return ray;
}
 
@compute @workgroup_size(64, 1, 1) fn computeSomething(@builtin(workgroup_id) workgroup_id : vec3<u32>, @builtin(local_invocation_id) local_invocation_id : vec3<u32>, @builtin(local_invocation_index) local_invocation_index: u32, @builtin(num_workgroups) num_workgroups: vec3<u32>) {
	
	let workgroup_index = workgroup_id.x + workgroup_id.y * num_workgroups.x + workgroup_id.z * num_workgroups.x * num_workgroups.y;
	let i = workgroup_index * 64 + local_invocation_index;
	let fragCoord = vec3f(f32(i) % screenDims.x, f32(i) / screenDims.x, 1);

	fovFactor = 1 / tan(60 * (PI / 180) / 2);

	// var lookfrom = vec3f(2, 6, 8);
	// var lookat = vec3f(1.5, 0, -3);
	// var lookfrom = vec3f(0, 0, 3.7);
	// var lookat = vec3f(0, 0, 0);
	// camera_init(
	// 	lookfrom,
	// 	lookat,
	// 	vec3f(0, 1, 0),
	// 	60.0,
	// 	0.0,
	// 	1
	// );

	NUM_SPHERES = i32(arrayLength(&sphere_objs));
	NUM_QUADS = i32(arrayLength(&quad_objs));
	coords = fragCoord.xyz;

	randState = i + u32(screenDims.z) * 719393;

	var fragColor = antialiased_color();
	var accFragColor = fragColor.xyz;

	if(screenDims[3] == 0)
	{
		let weight = 1.0 / (screenDims.z + 1);
		accFragColor = framebuffer[i].xyz * (1 - weight) + fragColor * weight;
	}

	framebuffer[i] = vec4f(accFragColor.xyz, 1.0);
}