var<private> doSpecular : f32;
fn material_scatter(ray_in : Ray) -> Ray {

	var scattered = Ray(vec3f(0), vec3f(0));
	doSpecular = 0;
	if(hitRec.material.material_type == LAMBERTIAN) {

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

	else if(hitRec.material.material_type == MIRROR) {
		var reflected = reflect(ray_in.dir, hitRec.normal);
		scattered = Ray(hitRec.p, normalize(reflected + hitRec.material.roughness * uniform_random_in_unit_sphere()));

		scatterRec.skip_pdf = true;
		scatterRec.skip_pdf_ray = scattered;
	}

	else if(hitRec.material.material_type == GLASS) {
		var ir = hitRec.material.eta;
		if(hitRec.front_face == true) {
			ir = (1.0 / ir);
		}

		let unit_direction = normalize(ray_in.dir);
		let cos_theta = min(dot(-unit_direction, hitRec.normal), 1.0);
		let sin_theta = sqrt(1 - cos_theta*cos_theta);

		var direction = vec3f(0);
		if(ir * sin_theta > 1.0 || reflectance(cos_theta, ir) > rand2D()) {
		// if(ir * sin_theta > 1.0) {
			direction = reflect(unit_direction, hitRec.normal);
		}
		else {
			direction = refract(unit_direction, hitRec.normal, ir);
		}

		if(near_zero(direction)) {
			direction = hitRec.normal;
		}

		scattered = Ray(hitRec.p, normalize(direction));
		
		scatterRec.skip_pdf = true;
		scatterRec.skip_pdf_ray = scattered;
	}

	else if(hitRec.material.material_type == ISOTROPIC) {
		// scattered = Ray(hitRec.p, uniform_random_in_unit_sphere());
		// scatterRec.skip_pdf = true;
		// scatterRec.skip_pdf_ray = scattered;

		let g = hitRec.material.specularStrength;
		// let cos_hg = (1 - g*g) / (4 * PI * pow(1 + g*g - 2*g*cos(2 * PI * rand2D()), 3/2));
		let cos_hg = (1 + g*g - pow(((1 - g*g) / (1 - g + 2*g*rand2D())), 2)) / (2 * g);
		let sin_hg = sqrt(1 - cos_hg * cos_hg);
		let phi = 2 * PI * rand2D();

		let hg_dir = vec3f(sin_hg * cos(phi), sin_hg * sin(phi), cos_hg);

		let uvw = onb_build_from_w(ray_in.dir);
		scattered = Ray(hitRec.p, normalize(onb_get_local(hg_dir)));

		// scatterRec.pdf = (1 - g*g) / (4 * PI * pow(1 + g*g - 2*g*cos(2 * PI * rand2D()), 3/2));
		scatterRec.skip_pdf = true;
		scatterRec.skip_pdf_ray = scattered;
	}

	return scattered;
}