import {VS} from './shaders/vertex.js';
import {FS} from './shaders/fragment.js';
import { WebGPU } from "./webgpu-utils.js";

export class Renderer 
{
    constructor()
    {
        this.webGPU = new WebGPU();
    }

    static async create() {
        const renderer = new Renderer();
        await renderer.webGPU.init();
        return renderer;
    }

	async loadShaders(shaderPaths) {
		try {
			const shaderContents = await Promise.all(shaderPaths.map(path => loadTextfile(path)));
			return shaderContents.join('');
		} catch (error) {
			console.error('Error loading shader modules:', error);
			throw error;
		}
	}
	
	async createShaderModule() {
		const shaderPaths = [
			'./shaders/header.wgsl',
			'./shaders/common.wgsl',
			'./shaders/main.wgsl',
			'./shaders/shootRay.wgsl',
			'./shaders/hitRay.wgsl',
			'./shaders/traceRay.wgsl',
			'./shaders/scatterRay.wgsl',
			'./shaders/importanceSampling.wgsl',
		];
	
		const computeShader = await this.loadShaders(shaderPaths);
		const module = this.webGPU.createShaderModule(VS + computeShader + FS);
		return module;
	}

	async createShaderModule() {
		try {
		  	const [
				header, common, main, shootRay, hitRay, traceRay, scatterRay, importanceSampling] = await Promise.all([
					loadTextfile('./shaders/header.wgsl'),
					loadTextfile('./shaders/common.wgsl'),
					loadTextfile('./shaders/main.wgsl'),
					loadTextfile('./shaders/shootRay.wgsl'),
					loadTextfile('./shaders/hitRay.wgsl'),
					loadTextfile('./shaders/traceRay.wgsl'),
					loadTextfile('./shaders/scatterRay.wgsl'),
					loadTextfile('./shaders/importanceSampling.wgsl'),
				]);

		  	const module = this.webGPU.createShaderModule(VS + header + common + importanceSampling + scatterRay + traceRay + hitRay + shootRay + main + FS);
		  	return module;
		} 
		catch (error) {
			console.error('Error loading shader modules:', error);
			throw error;
		}
	}

	async initBuffers(scene, camera, WIDTH, HEIGHT) {

		this.uniforms = {
			screenDims: [WIDTH, HEIGHT],
			frameNum: 0,
			resetBuffer: 0,
			viewMatrix: camera.viewMatrix,
		}

		let uniformArray = flattenToFloat32Array(this.uniforms);
		await scene.init_mesh_data();
		scene.create_meshes();
		let meshes = scene.get_meshes();
		let spheres = scene.get_spheres();
		let quads = scene.get_quads();
		let materials = scene.get_materials();
		let transforms = scene.get_transforms();
		scene.create_bvh();
		let bvh = scene.get_bvh()
		let triangles = scene.get_triangles();
		let frameNum = new Float32Array(WIDTH * HEIGHT * 4).fill(0);
		const vertexData = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);	// screen sized quad

		this.buffers = {
			uniforms: this.webGPU.createUniformBuffer('uniformBuffer', uniformArray),
			spheres: this.webGPU.createStorageBuffer_WriteOnly('sphere buffer', spheres),
			meshes: this.webGPU.createStorageBuffer_WriteOnly('mesh buffer', meshes),
			quads: this.webGPU.createStorageBuffer_WriteOnly('quads buffer', quads),
			materials: this.webGPU.createStorageBuffer_WriteOnly('material buffer', materials),
			transforms: this.webGPU.createStorageBuffer_WriteOnly('transform buffer', transforms),
			bvh: this.webGPU.createStorageBuffer_WriteOnly('bvh buffer', bvh),
			triangles: this.webGPU.createStorageBuffer_WriteOnly('tri buffer', triangles),
			frameBuffer: this.webGPU.createStorageBuffer_ReadWrite('frameNum buffer', frameNum),
			vertex: this.webGPU.createVertexBuffer('vertex buffer', vertexData),
		};
	}

	createComputePipeline(module) {
		this.computePipeline = this.webGPU.createComputePipeline(module)

		const buffers = this.buffers;
		this.bindGroupCompute = this.webGPU.device.createBindGroup({
			label: 'bindGroup for work buffer',
			layout: this.computePipeline.getBindGroupLayout(0),
			entries: [
			{ binding: 0, resource: {buffer : buffers.uniforms.buffer}},
			{ binding: 1, resource: {buffer : buffers.spheres.buffer}},
			{ binding: 2, resource: {buffer : buffers.quads.buffer}},
			{ binding: 3, resource: {buffer : buffers.frameBuffer.buffer}},
			{ binding: 5, resource: {buffer : buffers.triangles.buffer}},
			{ binding: 6, resource: {buffer : buffers.meshes.buffer}},
			{ binding: 7, resource: {buffer : buffers.transforms.buffer}},
			{ binding: 8, resource: {buffer : buffers.materials.buffer}},
			{ binding: 9, resource: {buffer : buffers.bvh.buffer}},
			],
		  });
	}

	createRenderPipeline(module) {
		this.renderPipeline = this.webGPU.createRenderPipeline(module);
		
		const buffers = this.buffers;
		this.bindGroup = this.webGPU.device.createBindGroup({
			layout: this.renderPipeline.getBindGroupLayout(0),
			entries: [
			  { binding: 0, resource: {buffer : buffers.uniforms.buffer}},
			  { binding: 3, resource: {buffer : buffers.frameBuffer.buffer}},
			],
		});
	
		this.renderPassDescriptor = this.webGPU.createRenderPassDescriptor();
	}

	setRenderParameters(renderParams, camera, WIDTH, HEIGHT) {

		this.renderParams = renderParams;

		if(this.renderParams.showFPS)
		{
			this.stats = new Stats();
			this.stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
			document.body.appendChild( this.stats.dom );
		}

		this.frameNum = 0.0;
		this.avgFrameTime = 0.0;
		this.reqFrameDelay = 1000 / this.renderParams.maxFPS;
		this.lastFrameTime = performance.now();

		this.camera = camera;
		this.WIDTH = WIDTH;
		this.HEIGHT = HEIGHT;
	}

	// renders continuously
	async renderAnimation() {
		this.frameNum += 1.0;
		
		if(this.renderParams.showFPS)
			this.stats.begin();

		if(this.renderParams.logCountOfSamples && this.frameNum % 100 == 0)
			console.log(this.frameNum + " samples rendered");

		// ============================== UPDATE UNIFORMS ================================
		this.uniforms.frameNum = this.frameNum;
		this.uniforms.resetBuffer = (this.camera.MOVING || this.camera.keyPress) ? 1 : 0;

		if(this.camera.MOVING || this.camera.keyPress)
		{
			this.frameNum = 1;
			this.camera.keyPress = 0;
		}

		this.uniforms.viewMatrix = this.camera.viewMatrix;
		this.buffers.uniforms.data = flattenToFloat32Array(this.uniforms);
		this.webGPU.device.queue.writeBuffer(this.buffers.uniforms.buffer, 0, this.buffers.uniforms.data);

		// ============================== COMPUTE PASS ================================
		let workGroupsNeeded = (this.WIDTH * this.HEIGHT) / 64;
		this.webGPU.computePass(this.computePipeline, this.bindGroupCompute, workGroupsNeeded);

		// ============================== RENDER PASS ================================
	  	this.webGPU.renderPass(this.renderPassDescriptor, this.renderPipeline, this.bindGroup, this.buffers.vertex.buffer);

		// ====================== VSync & Performance Logging ======================
		const currentTime = performance.now();
		const elapsedTime = currentTime - this.lastFrameTime;

		if(this.renderParams.logPerformance) {
			this.avgFrameTime += elapsedTime;
			if(this.frameNum % 100 == 0) {
				console.log("Avg frame time: " + this.avgFrameTime / 100.0 + " ms");
				console.log("FPS (without limiting): " + 1000.0 / (this.avgFrameTime / 100.0));
				this.avgFrameTime = 0.0;
			}
		}
		
		if(elapsedTime < this.reqFrameDelay) {
			await new Promise(resolve => setTimeout(resolve, this.reqFrameDelay - elapsedTime));
		}
		this.lastFrameTime = performance.now();

		if(this.renderParams.showFPS)
			this.stats.end();

		requestAnimationFrame(() => this.renderAnimation());
	}



	// Currently not working - Not sure why
	// renders once (a single frameNum)
	renderSingleFrame()	{
		this.uniforms.viewMatrix = this.camera.viewMatrix;
		this.buffers.uniforms.data = flattenToFloat32Array(this.uniforms);

		this.webGPU.device.queue.writeBuffer(this.buffers.uniforms.buffer, 0, this.buffers.uniforms.data);

		// ============================== COMPUTE PASS ================================
		let encoder = this.webGPU.device.createCommandEncoder({label: 'compute encoder'});
		let pass = encoder.beginComputePass({label: 'compute pass'});
		pass.setPipeline(this.computePipeline);
		pass.setBindGroup(0, this.bindGroupCompute);
		let workGroupsNeeded = (this.WIDTH * this.HEIGHT) / 64;
		// pass.dispatchWorkgroups(temp, temp, temp);
		pass.dispatchWorkgroups(workGroupsNeeded + 1, 1, 1);
		pass.end();
	

		// Finish encoding and submit the commands
		let commandBuffer = encoder.finish();
		this.webGPU.device.queue.submit([commandBuffer]);


		// ============================== RENDER PASS ================================
		this.webGPU.setCanvasAsRenderTarget(this.renderPassDescriptor);
		const renderEncoder = this.webGPU.createCommandEncoder('render encoder');
		// call our vertex shader 6 times (2 triangles)
		this.webGPU.makeRenderPass(renderEncoder, this.renderPassDescriptor, this.renderPipeline, this.bindGroup, this.buffers.vertex.buffer, 6);
		this.webGPU.addCommandBufferToQueue(renderEncoder);
	}
}









async function loadTextfile(path) {
    let response = await fetch(path);
    return response.text();
}

function flattenToFloat32Array(obj) {
	// Flatten the object into an array
	let array = [];
	for (let key in obj) {
		if (Array.isArray(obj[key]) || obj[key] instanceof Float32Array) {
			array.push(...obj[key]);
		} else {
			array.push(obj[key]);
		}
	}

	// Convert the array to a Float32Array
	return new Float32Array(array);
}