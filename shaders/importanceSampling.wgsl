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

fn get_random_on_quad(q : Quad, origin : vec3f) -> Ray {
	let p = q.Q + (rand2D() * q.u) + (rand2D() * q.v);
	return Ray(origin, normalize(p - origin));
}

fn get_random_on_quad_point(q : Quad) -> vec3f {
	let p = q.Q + (rand2D() * q.u) + (rand2D() * q.v);
	return p;
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