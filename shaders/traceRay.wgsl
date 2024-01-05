// https://www.pbr-book.org/3ed-2018/Light_Transport_I_Surface_Reflection/Path_Tracing#Implementation

fn ray_color(incidentRay : Ray) -> vec3f {

	var currRay = incidentRay;
	var acc_radiance = vec3f(0);	// initial radiance (pixel color) is black
	var throughput = vec3f(1);		// initial throughput is 1 (no attenuation)
	let background_color = vec3f(0, 1, 1);
	
	for(var i = 0; i < MAX_BOUNCES; i++)
	{
		if(hitScene(currRay) == false)
		{
			acc_radiance += (background_color * throughput);
			break;
		}

		// unidirectional light
		var emissionColor = hitRec.material.emissionColor;
		if(!hitRec.front_face) {
			emissionColor = vec3f(0);
		}

		if(IMPORTANCE_SAMPLING)
		{
			// IMPORTANCE SAMPLING TOWARDS LIGHT
			// diffuse scatter ray
			let scatterred_surface = material_scatter(currRay);

			if(scatterRec.skip_pdf) {
				acc_radiance += emissionColor * throughput;
				throughput *= mix(hitRec.material.color, hitRec.material.specularColor, doSpecular);

				currRay = scatterRec.skip_pdf_ray;
				continue;
			}

			// ray sampled towards light
			let scattered_light = get_random_on_quad(lights, hitRec.p);

			var scattered = scattered_light;
			var rand = rand2D();
			if(rand > 0.2) {
				scattered = scatterred_surface;
			}

			let lambertian_pdf = onb_lambertian_scattering_pdf(scattered);
			let light_pdf = light_pdf(scattered, lights);
			let pdf = 0.2 * light_pdf + 0.8 * lambertian_pdf;

			if(pdf <= 0.00001) {
				return emissionColor * throughput;
			}

			acc_radiance += emissionColor * throughput;
			throughput *= ((lambertian_pdf * mix(hitRec.material.color, hitRec.material.specularColor, doSpecular)) / pdf);
			currRay = scattered;
		}
		
		else 
		{
			let scattered = material_scatter(currRay);

			acc_radiance += emissionColor * throughput;
			throughput *= mix(hitRec.material.color, hitRec.material.specularColor, doSpecular);
			
			currRay = scattered;
		}

		// russian roulette
		if(i > 2) 
		{
			let p = max(throughput.x, max(throughput.y, throughput.z));
			if(rand2D() > p) {
				break; 
			}

			throughput *= (1.0 / p);
		}
	} 

	return acc_radiance;
}