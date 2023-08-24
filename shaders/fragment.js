export const FS = `

const PI = 3.1415926535897932385;
const MAX_FLOAT = 999999999.999;
const LAMBERTIAN = 0;
const MIRROR = 1;
const GLASS = 2;
const NUM_OBJECTS = 10;
const NUM_SAMPLES = 100;
const MAX_BOUNCES = 10;
const ROTATION = true;

var<private> randState : vec2f;
var<private> coords : vec3f;

struct viewPort {
	viewPortX : f32,
	viewPortY : f32,
	pixel_delta_u : vec3f,
	pixel_delta_v : vec3f,
}

struct Camera {
	center : vec3f,
	u : vec3f,
	v : vec3f,
	w : vec3f,
	lowerleftcorner : vec3f,
	lensRadius : f32,
	offset : vec3f,
	horizontal : vec3f,
	vertical : vec3f,
}

struct Ray {
	orig : vec3f,
	dir : vec3f,
}

struct Sphere {
	center : vec3f,
	r : f32,
	color : vec3f,
	material : f32,
	fuzz : f32,
	eta : f32,
}

struct HitRecord {
	p : vec3f,
	t : f32,
	normal : vec3f,
	front_face : bool,
	obj : Sphere,
}

@group(0) @binding(0) var<uniform> screenDims: vec3<f32>;
@group(0) @binding(1) var<storage, read> hittables: array<Sphere>;

var<private> hitRec : HitRecord;
var<private> cam : Camera;
var<private> vp : viewPort;

fn hash(n : f32) -> f32 
{
    return fract(sin(n)*43758.54554213);
}

var<private> K1 = vec2f(23.14069263277926, 2.665144142690225);
fn rand2D() -> f32
{
    // randState.x = fract(sin(dot(randState, vec2(12.9898, 78.233))) * 43758.5453);
    // randState.y = fract(sin(dot(randState, vec2(12.9898, 78.233))) * 43758.5453);

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
	hitRec.obj = sphere;

	return true;
}

fn random_in_unit_sphere() -> vec3f {
	
	let phi = rand2D() * 2.0 * PI;
	let theta = acos(2.0 * rand2D() - 1.0);

	let x = sin(theta) * cos(phi);
	let y = sin(theta) * sin(phi);
	let z = cos(theta);

	let dir = normalize(vec3f(x, y, z));
	return dir;
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
	if(hitRec.obj.material == LAMBERTIAN)
	{
		var scatter_dir = random_on_hemisphere(hitRec.normal);
		if(near_zero(scatter_dir))
		{
			scatter_dir = hitRec.normal;
		}
		scattered = Ray(hitRec.p, scatter_dir);
	}

	else if(hitRec.obj.material == MIRROR)
	{
		var reflected = reflect(normalize(ray_in.dir), hitRec.normal);
		scattered = Ray(hitRec.p, reflected + hitRec.obj.fuzz * random_on_hemisphere(hitRec.normal));
	}

	else if(hitRec.obj.material == GLASS)
	{
		var ir = hitRec.obj.eta;
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

fn ray_color(ray : Ray) -> vec3f {

	var curRay = ray;
	var acc_color = vec3f(1, 1, 1);
	let a = 0.55 * (1 - (coords.y / screenDims.y));

	for(var i = 0; i < MAX_BOUNCES; i++)
	{
		if(hit(curRay) == false)
		{
			return acc_color * (1 - a) * vec3f(1) + a * vec3(0.5, 0.7, 1.0);
			// return acc_color * vec3f(0.5, 0.7, 1);
		}

		acc_color = (acc_color * hitRec.obj.color);

		curRay = material_scatter(curRay);
	}

	return acc_color;
}

fn hit(ray : Ray) -> bool
{
	// var temp = HitRecord(vec3f(0), 0, vec3f(0), false, vec3f(0));
	var closest_so_far = MAX_FLOAT;
	var hit_anything = false;

	for(var i = 0; i < NUM_OBJECTS; i++)
	{
		if(hit_sphere(hittables[i], 0.0001, closest_so_far, ray))
		{
			hit_anything = true;
			closest_so_far = hitRec.t;
			// return hit_anything;
		}
	}

	return hit_anything;
}

fn antialiased_color() -> vec3f {
	
	var pixColor = vec3f(0, 0, 0);
	for(var i = 0.0; i < NUM_SAMPLES; i += 1.0)
	{
		let ray = camera_get_ray((coords.x + rand2D()) / screenDims.x, 1 - (coords.y + rand2D()) / screenDims.y);
		pixColor += ray_color(ray);
	}

	pixColor /= NUM_SAMPLES;

	// sqrt for gamma correction
	return pixColor.xyz;
}

fn camera_init(lookfrom : vec3f, lookat : vec3f, up : vec3f, vfov : f32, aperture : f32, focusDist : f32) {
	
	cam.lensRadius = aperture / 2.0;

	vp.viewPortY = 2 * tan(vfov * (PI / 180) / 2);
	vp.viewPortX = vp.viewPortY * (screenDims.x / screenDims.y);

	cam.center = lookfrom;
	cam.w = normalize(lookfrom - lookat);
	cam.u = normalize(cross(up, cam.w));
	cam.v = cross(cam.w, cam.u);

	cam.lowerleftcorner = cam.center 	- (vp.viewPortX / 2) * focusDist * cam.u 
										- (vp.viewPortY / 2) * focusDist * cam.v 
										- focusDist * cam.w;

	cam.horizontal = vp.viewPortX * focusDist * cam.u;
	cam.vertical = vp.viewPortY * focusDist * cam.v;
}

fn camera_get_ray(s : f32, t : f32) -> Ray {
	let rd = cam.lensRadius * random_in_unit_disk();
	let offset = cam.u * rd.x + cam.v * rd.y;

	return Ray(
				cam.center + offset,
				cam.lowerleftcorner + s * cam.horizontal + t * cam.vertical - cam.center - offset
			);
}

@fragment fn fs(@builtin(position) fragCoord: vec4f) -> @location(0) vec4f {

	var lookfrom = vec3f(2, 3.5, 4.5);
	if(ROTATION)
    {
        let angle = screenDims.z / 2.0;
    	let rotationMatrix = mat4x4f(cos(angle), 0.0, sin(angle), 0.0,
                                          0.0, 1.0,        0.0, 0.0,
                                 -sin(angle),  0.0, cos(angle), 0.0,
                                         0.0,  0.0,        0.0, 1.0);
    
    	lookfrom = (rotationMatrix * vec4f(lookfrom, 1.0)).xyz;
    }

	camera_init(
		lookfrom,
		vec3f(0, 0, 0),
		vec3f(0, 1, 0),
		60.0,
		0.0,
		1
	);

	coords = fragCoord.xyz;
	randState = vec2(hash(fragCoord.x), hash(fragCoord.y));

	var fragColor = antialiased_color();
	return vec4f(fragColor, 1);
  }
`;