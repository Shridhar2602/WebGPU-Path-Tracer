const PI = 3.1415926535897932385;
const MAX_FLOAT = 999999999.999;
const LAMBERTIAN = 0;
const MIRROR = 1;
const GLASS = 2;
const NUM_SAMPLES = 1;
const MAX_BOUNCES = 3;
const ROTATION = false;

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
	origin : vec3f,
	dir : vec3f,
}

struct Material {
	color : vec3f,
	emissionColor : vec3f,
	fuzz : f32,
	eta : f32,
	material_type : f32,
}

struct modelTransform {
	modelMatrix : mat4x4f,
	invModelMatrix : mat4x4f
}

struct Sphere {
	center : vec3f,
	r : f32,
	id : f32,
	material_id : f32
}

struct Quad {
	Q : vec3f,
	u : vec3f,
	v : vec3f,
	id : f32,
	normal : vec3f,
	D : f32,
	w : vec3f, 
	material_id : f32,
}

struct Triangle {
	A : vec3f,
	B : vec3f,
	C : vec3f,
	normalA : vec3f,
	normalB : vec3f,
	normalC : vec3f,
}

struct Mesh {
	num_triangles : i32,
	offset : i32,
	id : i32,
	material_id : i32
}

struct HitRecord {
	p : vec3f,
	t : f32,
	normal : vec3f,
	front_face : bool,
	material : Material,
}


// ====================== Camera Code for defocus blue ============================

// fn camera_init(lookfrom : vec3f, lookat : vec3f, up : vec3f, vfov : f32, aperture : f32, focusDist : f32) {
	
// 	cam.lensRadius = aperture / 2.0;

// 	vp.viewPortY = 2 * tan(vfov * (PI / 180) / 2);
// 	vp.viewPortX = vp.viewPortY * (screenDims.x / screenDims.y);

// 	cam.center = lookfrom;
// 	cam.w = viewMatrix[2].xyz;
// 	cam.u = viewMatrix[0].xyz;
// 	cam.v = viewMatrix[1].xyz;

// 	cam.lowerleftcorner = cam.center 	- (vp.viewPortX / 2) * focusDist * cam.u 
// 										- (vp.viewPortY / 2) * focusDist * cam.v 
// 										- focusDist * cam.w;

// 	cam.horizontal = vp.viewPortX * focusDist * cam.u;
// 	cam.vertical = vp.viewPortY * focusDist * cam.v;
// }

// fn camera_get_ray(s : f32, t : f32) -> Ray {
// 	let rd = cam.lensRadius * random_in_unit_disk();
// 	let offset = cam.u * rd.x + cam.v * rd.y;

// 	return Ray(
// 				cam.center + offset,
// 				cam.lowerleftcorner + s * cam.horizontal + t * cam.vertical - cam.center - offset
// 			);
// }
