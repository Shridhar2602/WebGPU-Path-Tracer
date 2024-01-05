const PI = 3.1415926535897932385;
const MIN_FLOAT = 0.0001;
const MAX_FLOAT = 999999999.999;
const LAMBERTIAN = 0;
const MIRROR = 1;
const GLASS = 2;
const ISOTROPIC = 3;
const ANISOTROPIC = 4;
const NUM_SAMPLES = 1;
const MAX_BOUNCES = 100;
const STRATIFY = false;
const IMPORTANCE_SAMPLING = false;
const STACK_SIZE = 20;

@group(0) @binding(0) var<uniform> uniforms : Uniforms;
@group(0) @binding(1) var<storage, read> sphere_objs: array<Sphere>;
@group(0) @binding(2) var<storage, read> quad_objs: array<Quad>;
@group(0) @binding(3) var<storage, read_write> framebuffer: array<vec4f>;
@group(0) @binding(5) var<storage, read> triangles: array<Triangle>;
@group(0) @binding(6) var<storage, read> meshes: array<Mesh>;
@group(0) @binding(7) var<storage, read> transforms : array<modelTransform>;
@group(0) @binding(8) var<storage, read> materials: array<Material>;
@group(0) @binding(9) var<storage, read> bvh: array<AABB>;

var<private> NUM_SPHERES : i32;
var<private> NUM_QUADS : i32;
var<private> NUM_MESHES : i32;
var<private> NUM_TRIANGLES : i32;
var<private> NUM_AABB : i32;

var<private> randState : u32 = 0u;
var<private> pixelCoords : vec3f;

var<private> hitRec : HitRecord;
var<private> scatterRec : ScatterRecord;
var<private> lights : Quad;
var<private> ray_tmin : f32 = 0.000001;
var<private> ray_tmax : f32 = MAX_FLOAT;
var<private> stack : array<i32, STACK_SIZE>;

struct Uniforms {
	screenDims : vec2f,
	frameNum : f32,
	resetBuffer : f32,
	viewMatrix : mat4x4f,
}

struct Ray {
	origin : vec3f,
	dir : vec3f,
}

struct Material {
	color : vec3f,			// diffuse color
	specularColor : vec3f,	// specular color
	emissionColor : vec3f,	// emissive color
	specularStrength : f32,	// chance that a ray hitting would reflect specularly
	roughness : f32,		// diffuse strength
	eta : f32,				// refractive index
	material_type : f32,
}

struct modelTransform {
	modelMatrix : mat4x4f,
	invModelMatrix : mat4x4f
}

struct Sphere {
	center : vec3f,
	r : f32,
	global_id : f32,
	local_id : f32,
	material_id : f32
}

struct Quad {
	Q : vec3f,
	u : vec3f,
	local_id : f32,
	v : vec3f,
	global_id : f32,
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
	local_id : f32,
	normalC : vec3f,

	mesh_id : f32,
}

struct Mesh {
	num_triangles : i32,
	offset : i32,
	global_id : i32,
	material_id : i32
}

struct AABB {
	min : vec3f,
	right_offset : f32,
	max : vec3f,

	prim_type : f32,
	prim_id : f32,
	prim_count : f32,
	skip_link : f32,
	axis : f32,
}

struct HitRecord {
	p : vec3f,
	t : f32,
	normal : vec3f,
	front_face : bool,
	material : Material,
}

struct ScatterRecord {
	pdf : f32,
	skip_pdf : bool,
	skip_pdf_ray : Ray
}