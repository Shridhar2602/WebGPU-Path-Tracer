export const FS = `

const PI = 3.1415926535897932385;
const MAX_FLOAT = 999999999.999;

@group(0) @binding(0) var<uniform> screenDims: vec3<f32>;
// @group(0) @binding(1) var<uniform> randState: vec2<f32>;

var<private> randState : vec2f;
var<private> coords : vec3f;

struct viewPort {
	screenWidth : f32,
	screenHeight : f32,
	viewPortX : f32,
	viewPortY : f32,
	pixel_delta_u : f32,
	pixel_delta_v : f32,
}

var<private> vp : viewPort;

struct Ray {
	orig : vec3f,
	dir : vec3f,
}

struct Sphere {
	center : vec3f,
	r : f32,
	color : vec3f,
}

struct HitRecord {
	hit : bool,
	p : vec3f,
	t : f32,
	normal : vec3f,
	front_face : bool,
	color : vec3f,
}

fn hash(n : f32) -> f32 
{
    return fract(sin(n)*43758.54554213);
}

fn rand2D() -> f32
{
    // randState.x = fract(sin(dot(randState, vec2(12.9898, 78.233))) * 43758.5453);
    // randState.y = fract(sin(dot(randState, vec2(12.9898, 78.233))) * 43758.5453);

	let K1 = vec2f(23.14069263277926, 2.665144142690225);
	randState.x = fract( cos( dot(randState,K1) ) * 12345.6789 );
	randState.y = fract( cos( dot(randState,K1) ) * 12345.6789 );
    
    return randState.x;
}

fn random_double(min : f32, max : f32) -> f32 {
	return min + (max - min) * rand2D();
}

fn at(ray : Ray, t : f32) -> vec3f {
	return ray.orig + t * ray.dir;
}

fn hit_sphere(sphere : Sphere, tmin : f32, tmax : f32, ray : Ray) -> HitRecord {
	
	let oc = ray.orig - sphere.center;
	let a = dot(ray.dir, ray.dir);
	let half_b = dot(ray.dir, oc);
	let c = dot(oc, oc) - sphere.r * sphere.r;
	let discriminant = half_b*half_b - a*c;

	var hitRecord = HitRecord(false, vec3f(0),0,vec3f(0), false, sphere.color);

	if(discriminant < 0) {
		return hitRecord;
	}

	let sqrtd = sqrt(discriminant);
	var root = (-half_b - sqrtd) / a;
	if(root <= tmin || root >= tmax)
	{
		root = (-half_b + sqrtd) / a;
		if(root <= tmin || root >= tmax)
		{
			return hitRecord;
		}
	}

	hitRecord.hit = true;
	hitRecord.t = root;
	hitRecord.p = at(ray, root);
	hitRecord.normal = (hitRecord.p - sphere.center) / sphere.r;
	hitRecord.front_face = dot(ray.dir, hitRecord.normal) < 0;
	if(hitRecord.front_face == false)
	{
		hitRecord.normal = -hitRecord.normal;
	}

	return hitRecord;
}

fn random_in_unit_sphere() -> vec3f{
	
	let phi = rand2D() * 2.0 * PI;
	let theta = acos(2.0 * rand2D() - 1.0);

	let x = sin(theta) * cos(phi);
	let y = sin(theta) * sin(phi);
	let z = cos(theta);

	let dir = normalize(vec3f(x, y, z));
	return dir;

	// while(true) {
	// 	var p = vec3f(random_double(-1, 1), random_double(-1, 1), random_double(-1, 1));
	// 	if(dot(p, p) < 1)
	// 	{
	// 		return normalize(p);
	// 	}
	// }

	// return vec3f(0);
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

fn ray_color(hittable : array<Sphere, 2>, ray : Ray, max_bounces : i32) -> vec3f {

	var curRay = ray;
	var acc_color = vec3f(1, 1, 1);
	let a = 0.5 * (coords.y + 1.0);

	for(var i = 0; i < max_bounces; i++)
	{
		var curHit = hit(hittable, curRay);

		if(curHit.hit == false)
		{
			return acc_color * (1 - a) * vec3f(1) + a * vec3(0.5, 0.7, 1.0);
			// return acc_color * vec3f(0.5, 0.7, 1);
		}

		acc_color = (acc_color * 0.4 * curHit.color);

		let direction = random_on_hemisphere(curHit.normal);
		curRay = Ray(curHit.p, direction);
	}

	
	// return (1 - a) * vec3f(1) + a * vec3(0.5, 0.7, 1.0);
	return acc_color;
}

fn hit(hittable : array<Sphere, 2>, ray : Ray) -> HitRecord
{
	var temp = HitRecord(false, vec3f(0), 0, vec3f(0), false, vec3f(0));
	for(var i = 0; i < 2; i++)
	{
		temp = hit_sphere(hittable[i], 0.0001, MAX_FLOAT, ray);

		if(temp.hit == true)
		{
			return temp;
		}
	}

	return temp;
}

fn antialiased_color(num_samples : f32, coords : vec3f, hittable : array<Sphere, 2>) -> vec3f {
	
	var pixColor = vec3f(0, 0, 0);
	for(var i = 0.0; i < num_samples; i += 1.0)
	{
		let random_point = (rand2D() - 0.5) * vp.pixel_delta_u + (rand2D() - 0.5) * vp.pixel_delta_v;
		let ray = Ray(vec3f(0, 0, 0), vec3f(coords.x + random_point, coords.y + random_point, -1));
		// let ray = Ray(vec3f(0, 0, 0), vec3f(coords.x, coords.y, -1));

		pixColor += ray_color(hittable, ray, 10);
	}

	pixColor /= num_samples;

	// sqrt for gamma correction
	return sqrt(pixColor.xyz);
}

@fragment fn fs(@builtin(position) fragCoord: vec4f) -> @location(0) vec4f {

	// convert fragCoord to standard coordinate system
	vp = viewPort(screenDims.x, screenDims.y, 2.0, 2.0 / screenDims.z, 2.0 / screenDims.x, (2.0 / screenDims.z) / screenDims.y);
	coords = (fragCoord.xyz - vec3f(vp.screenWidth / 2, vp.screenHeight / 2, 0.0)) / vec3f(vp.screenWidth / vp.viewPortX, -vp.screenHeight / vp.viewPortY, 1);

	randState = vec2(hash(coords.x), hash(coords.y));

	let hittable = array<Sphere, 2>(
		Sphere(vec3f(0, 0, -1), 0.4, vec3f(1, 1, 1)),
		Sphere(vec3f(0, -100.4, -1), 100, vec3f(1, 1, 1)),
	);

	var fragColor = antialiased_color(100, coords, hittable);
	return vec4f(fragColor, 1);
  }

`;