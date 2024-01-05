fn at(ray : Ray, t : f32) -> vec3f {
	return ray.origin + t * ray.dir;
}

// PCG prng
// https://www.shadertoy.com/view/XlGcRh
fn rand2D() -> f32 
{
	randState = randState * 747796405u + 2891336453u;
	var word : u32 = ((randState >> ((randState >> 28u) + 4u)) ^ randState) * 277803737u;
	return f32((word >> 22u)^word) / 4294967295;
}

// random numbers from a normal distribution
fn randNormalDist() -> f32 {
	let theta = 2 * PI * rand2D();
	let rho = sqrt(-2 * log(rand2D()));
	return rho * cos(theta); 
}

fn random_double(min : f32, max : f32) -> f32 {
	return min + (max - min) * rand2D();
}

fn near_zero(v : vec3f) -> bool {
	return (abs(v[0]) < 0 && abs(v[1]) < 0 && abs(v[2]) < 0);
}

fn hit_sphere(sphere : Sphere, tmin : f32, tmax : f32, ray : Ray) -> bool {
	
	// let ray = Ray((vec4f(incidentRay.origin, 1) * transforms[i32(sphere.id)].invModelMatrix).xyz, (vec4f(incidentRay.dir, 0) * transforms[i32(sphere.id)].invModelMatrix).xyz);

	let oc = ray.origin - sphere.center;
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

	// hitRec.p = (vec4f(hitRec.p, 1) * transforms[i32(sphere.id)].invModelMatrix).xyz;
	// hitRec.t = distance(hitRec.p, incidentRay.origin);

	hitRec.normal = normalize((hitRec.p - sphere.center) / sphere.r);

	// hitRec.normal = normalize((vec4f(hitRec.normal, 0) * transpose(transforms[i32(sphere.id)].modelMatrix)).xyz);

	hitRec.front_face = dot(ray.dir, hitRec.normal) < 0;
	if(hitRec.front_face == false)
	{
		hitRec.normal = -hitRec.normal;
	}


	hitRec.material = materials[i32(sphere.material_id)];
	return true;
}

fn hit_sphere_local(sphere : Sphere, tmin : f32, tmax : f32, ray : Ray) -> f32 {
	
	// let ray = Ray((vec4f(incidentRay.origin, 1) * transforms[i32(sphere.id)].invModelMatrix).xyz, (vec4f(incidentRay.dir, 0) * transforms[i32(sphere.id)].invModelMatrix).xyz);
	let oc = ray.origin - sphere.center;
	let a = dot(ray.dir, ray.dir);
	let half_b = dot(ray.dir, oc);
	let c = dot(oc, oc) - sphere.r * sphere.r;
	let discriminant = half_b*half_b - a*c;

	if(discriminant < 0) {
		return MAX_FLOAT + 1;
	}

	let sqrtd = sqrt(discriminant);
	var root = (-half_b - sqrtd) / a;
	if(root <= tmin || root >= tmax)
	{
		root = (-half_b + sqrtd) / a;
		if(root <= tmin || root >= tmax)
		{
			return MAX_FLOAT + 1;
		}
	}

	return root;
}

fn hit_volume(sphere : Sphere, tmin : f32, tmax : f32, ray : Ray) -> bool {

	var rec1 = hit_sphere_local(sphere, -MAX_FLOAT, MAX_FLOAT, ray);
	if(rec1 == MAX_FLOAT + 1) {
		return false;
	}

	var rec2 = hit_sphere_local(sphere, rec1 + 0.0001, MAX_FLOAT, ray);
	if(rec2 == MAX_FLOAT + 1) {
		return false;
	}

	if(rec1 < tmin) {
		rec1 = tmin;
	}

	if(rec2 > tmax) {
		rec2 = tmax;
	}

	if(rec1 >= rec2) {
		return false;
	}

	if(rec1 < 0) {
		rec1 = 0;
	}

	hitRec.material = materials[i32(sphere.material_id)];

	let ray_length = length(ray.dir);
	let dist_inside = (rec2 - rec1) * ray_length;
	let hit_dist = hitRec.material.roughness * log(rand2D());

	if(hit_dist > dist_inside) {
		return false;
	}

	hitRec.t = rec1 + (hit_dist / ray_length);
	hitRec.p = at(ray, hitRec.t);
	hitRec.normal = normalize(hitRec.p - sphere.center);
	hitRec.front_face = true;

	return true;
}

fn hit_quad(quad : Quad, tmin : f32, tmax : f32, ray : Ray) -> bool {

	if(dot(ray.dir, quad.normal) > 0) {
		return false;
	}

	let denom = dot(quad.normal, ray.dir);

	// No hit if the ray is paraller to the plane
	if(abs(denom) < 1e-8) {
		return false;
	}

	let t = (quad.D - dot(quad.normal, ray.origin)) / denom;
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
	hitRec.normal = normalize(quad.normal);
	hitRec.front_face = dot(ray.dir, hitRec.normal) < 0;
	if(hitRec.front_face == false)
	{
		hitRec.normal = -hitRec.normal;
	}

	hitRec.material = materials[i32(quad.material_id)];
	return true;
}

// https://stackoverflow.com/questions/42740765/
// https://www.scratchapixel.com/lessons/3d-basic-rendering/ray-tracing-rendering-a-triangle/moller-trumbore-ray-triangle-intersection.html
fn hit_triangle(tri : Triangle, tmin : f32, tmax : f32, incidentRay : Ray) -> bool {

	let mesh = meshes[i32(tri.mesh_id)];
	let invModelMatrix = transforms[mesh.global_id].invModelMatrix;
	let modelMatrix = transforms[mesh.global_id].modelMatrix;

	let ray = Ray((invModelMatrix * vec4f(incidentRay.origin, 1)).xyz, (invModelMatrix * vec4f(incidentRay.dir, 0.0)).xyz);

	let AB = tri.B - tri.A;
	let AC = tri.C - tri.A;
	let normal = cross(AB, AC);
	let determinant = -dot(ray.dir, normal);

	// CULLING
	if(abs(determinant) < tmin) {
		return false;
	}

	let ao = ray.origin - tri.A;
	let dao = cross(ao, ray.dir);

	// calculate dist to triangle & barycentric coordinates of intersection point
	let invDet = 1 / determinant;
	let dst = dot(ao, normal) * invDet;
	let u = dot(AC, dao) * invDet;
	let v = -dot(AB, dao) * invDet;
	let w = 1 - u - v;

	if(dst < tmin || dst > tmax || u < tmin || v < tmin || w < tmin)
	{
		return false;
	}

	hitRec.t = dst;
	hitRec.p = at(incidentRay, dst);

	// hitRec.p = (vec4f(at(ray, dst), 1) * modelMatrix).xyz;
	// hitRec.t = length(hitRec.p - incidentRay.origin);

	hitRec.normal = tri.normalA * w + tri.normalB * u + tri.normalC * v;
	hitRec.normal = normalize((transpose(invModelMatrix) * vec4f(hitRec.normal, 0)).xyz);

	hitRec.front_face = dot(incidentRay.dir, hitRec.normal) < 0;
	if(hitRec.front_face == false)
	{
		hitRec.normal = -hitRec.normal;
	}
	
	hitRec.material = materials[mesh.material_id];

	return true;
}

// https://medium.com/@bromanz/another-view-on-the-classic-ray-aabb-intersection-algorithm-for-bvh-traversal-41125138b525
fn hit_aabb(box : AABB, tmin : f32, tmax : f32, ray : Ray, invDir : vec3f) -> bool {
	var t0s = (box.min - ray.origin) * invDir;
	var t1s = (box.max - ray.origin) * invDir;

	var tsmaller = min(t0s, t1s);
	var tbigger = max(t0s, t1s);

	var t_min = max(tmin, max(tsmaller.x, max(tsmaller.y, tsmaller.z)));
	var t_max = min(tmax, min(tbigger.x, min(tbigger.y, tbigger.z)));
	
	return t_max > t_min;
}

fn get_lights() -> bool {
	for(var i = 0; i < NUM_QUADS; i++) {
		let emission = materials[i32(quad_objs[i].material_id)].emissionColor;

		if(emission.x > 0.0) {
			lights = quad_objs[i];
			break;
		}
	}

	return true;
}

// ACES approximation for tone mapping
// https://knarkowicz.wordpress.com/2016/01/06/aces-filmic-tone-mapping-curve/):
fn aces_approx(v : vec3f) -> vec3f
{
    let v1 = v * 0.6f;
    const a = 2.51f;
    const b = 0.03f;
    const c = 2.43f;
    const d = 0.59f;
    const e = 0.14f;
    return clamp((v1*(a*v1+b))/(v1*(c*v1+d)+e), vec3(0.0f), vec3(1.0f));
}
