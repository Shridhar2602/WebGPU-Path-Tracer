import {GUI} from 'https://threejsfundamentals.org/threejs/../3rdparty/dat.gui.module.js';
import { vec3, mat4 } from 'https://cdn.skypack.dev/gl-matrix';
import {VS} from './shaders/vertex.js';
import {FS} from './shaders/fragment.js';
import { Camera } from './lib/camera.js';	
import { Scene } from './lib/scene.js';
// import {CS} from './shaders/compute.js';

// Initializing WebGPU (https://webgpufundamentals.org/webgpu/lessons/webgpu-fundamentals.html)
async function start() {
	if (!navigator.gpu) {
	  fail('this browser does not support WebGPU');
	  return;
	}
  
	const adapter = await navigator.gpu.requestAdapter();
	if (!adapter) {
	  fail('this browser supports webgpu but it appears disabled');
	  return;
	}
  
	const device = await adapter?.requestDevice();
	device.lost.then((info) => {
	  console.error(`WebGPU device was lost: ${info.message}`);

	  if (info.reason !== 'destroyed') {
		start();
	  }
	});
	
	main(device);
}

async function loadTextfile(path) {
    var response = await fetch(path);
    return response.text();
}

async function main(device) {

	// Get a WebGPU context from the canvas and configure it
	const canvas = document.querySelector('canvas');
	const context = canvas.getContext('webgpu');
	const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
	context.configure({
	  device,
	  format: presentationFormat,
	});

	var stats = new Stats();
	stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
	document.body.appendChild( stats.dom );
  
	var str_common = await loadTextfile('./shaders/common.wgsl');
	var str_compute = await loadTextfile('./shaders/compute.wgsl');
	// str_compute = str_compute.text();

	// creating shader module 
	const module = device.createShaderModule({
	  label: 'Vertex + Fragment Shaders',
	  code: VS + str_common + str_compute + FS,
	});

	const WIDTH = canvas.clientWidth;
	const HEIGHT = canvas.clientHeight;

	const camera = new Camera(canvas);

	const scene = new Scene();


	// Setting uniforms
	var screenDims = new Float32Array([WIDTH, HEIGHT, 1, 0]);
	const dimsBuffer = device.createBuffer({
		label: 'screen dims buffer',
		size: screenDims.byteLength,
		usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
	});
	device.queue.writeBuffer(dimsBuffer, 0, screenDims);

	// Setting view matrix 
	const viewMatrixBuffer = device.createBuffer({
		label: 'viewMatrix buffer',
	  	size: camera.viewMatrix.byteLength,
	  	usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  	});
  	device.queue.writeBuffer(viewMatrixBuffer, 0, camera.viewMatrix);

	// setting triangle data
	await scene.init_mesh_data();
	scene.create_meshes();

	var triangles = scene.get_triangles();

	const triBuffer = device.createBuffer({
		label: 'tri buffer',
		size: triangles.byteLength,
		usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
	});
	device.queue.writeBuffer(triBuffer, 0, triangles);

	var meshes = scene.get_meshes();
	const meshBuffer = device.createBuffer({
		label: 'mesh buffer',
		size: meshes.byteLength,
		usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
	});
	device.queue.writeBuffer(meshBuffer, 0, meshes);
	
	// setting sphere data
	var spheres = scene.get_spheres();
	const sphereBuffer = device.createBuffer({
		label: 'spheres buffer',
		size: spheres.byteLength,
		usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
	});
	device.queue.writeBuffer(sphereBuffer, 0, spheres);

	// setting quadrilateral data
	var quads = scene.get_quads();
	const quadBuffer = device.createBuffer({
		label: 'quads buffer',
		size: quads.byteLength,
		usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
	});
	device.queue.writeBuffer(quadBuffer, 0, quads);

	// setting material data
	var materials = scene.get_materials();
	const materialBuffer = device.createBuffer({
		label: 'material buffer',
		size: materials.byteLength,
		usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
	});
	device.queue.writeBuffer(materialBuffer, 0, materials);

	// setting transform data
	var transforms = scene.get_transforms();
	const transformBuffer = device.createBuffer({
		label: 'transform buffer',
		size: transforms.byteLength,
		usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
	});
	device.queue.writeBuffer(transformBuffer, 0, transforms);

	scene.create_bvh();
	var bvh = scene.get_bvh();
	const bvhBuffer = device.createBuffer({
		label: 'bvh buffer',
		size: bvh.byteLength,
		usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
	});
	device.queue.writeBuffer(bvhBuffer, 0, bvh);


	// A screen sized buffer to store the rgb values
	var frame = new Float32Array(WIDTH * HEIGHT * 4).fill(0);
  	const frameBuffer = device.createBuffer({
    	label: 'screen buffer',
   		size: frame.byteLength,
    	usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
  	});
  	device.queue.writeBuffer(frameBuffer, 0, frame);

	// ============================== COMPUTE PIPELINE ================================

	const computePipeline = device.createComputePipeline({
		label: 'Compute pipeline',
		layout: 'auto',
		compute: {
		  module,
		  entryPoint: 'computeSomething',
		},
	});

	// Setup a bindGroup to tell the shader which
  	// buffer to use for the computation
  	const bindGroupCompute = device.createBindGroup({
  	  label: 'bindGroup for work buffer',
  	  layout: computePipeline.getBindGroupLayout(0),
  	  entries: [
		{ binding: 0, resource: {buffer : dimsBuffer}},
		{ binding: 1, resource: {buffer : sphereBuffer}},
		{ binding: 2, resource: {buffer : quadBuffer}},
		{ binding: 3, resource: {buffer : frameBuffer}},
		{ binding: 4, resource: {buffer : viewMatrixBuffer}},
		{ binding: 5, resource: {buffer : triBuffer}},
		{ binding: 6, resource: {buffer : meshBuffer}},
		{ binding: 7, resource: {buffer : transformBuffer}},
		{ binding: 8, resource: {buffer : materialBuffer}},
		{ binding: 9, resource: {buffer : bvhBuffer}},

		// { binding: 5, resource: {buffer : triBuffer}},
		// { binding: 6, resource: {buffer : modelMatrixBuffer}},
		// { binding: 7, resource: {buffer : invModelMatrixBuffer}},
  	  ],
  	});

	// ============================== RENDER PIPELINE ================================

	// Vertex Buffer to draw a quad spanning the whole canvas
	const vertexData = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
	const vertexBuffer = device.createBuffer({
		label: 'vertex buffer vertices',
		size: vertexData.byteLength,
		usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
	});
	device.queue.writeBuffer(vertexBuffer, 0, vertexData);

	const pipeline = device.createRenderPipeline({
		label: 'render pipeline',
		layout: 'auto',
		vertex: {
		  module,
		  entryPoint: 'vs',
		  buffers: [
			  {
				  arrayStride: 2 * 4, // 2 floats, 4 bytes each
				  attributes: [{shaderLocation: 0, offset: 0, format: 'float32x2'}],
			  },
		  ],
		},
		fragment: {
		  module,
		  entryPoint: 'fs',
		  targets: [{ format: presentationFormat }],
		},
	});
	
	const bindGroup = device.createBindGroup({
		layout: pipeline.getBindGroupLayout(0),
		entries: [
		  { binding: 0, resource: {buffer : dimsBuffer}},
		  { binding: 3, resource: {buffer : frameBuffer}},
		//   { binding: 5, resource: {buffer : triBuffer}},
		],
	});

	const renderPassDescriptor = {
	  label: 'renderPass',
	  colorAttachments: [
		{
		  // view: <- to be filled out when we render
		  clearValue: [0.3, 0.3, 0.3, 1],
		  loadOp: 'clear',
		  storeOp: 'store',
		},
	  ],
	};

	// eye, center, up
	camera.set_camera([0, 0, 2.4], [0, 0, 0], [0, 1, 0]);
	function render()
	{
		device.queue.writeBuffer(viewMatrixBuffer, 0, camera.viewMatrix);
		// ============================== COMPUTE PASS ================================
		var encoder = device.createCommandEncoder({label: 'slime encoder'});
		var pass = encoder.beginComputePass({label: 'slime compute pass'});
		pass.setPipeline(computePipeline);
		pass.setBindGroup(0, bindGroupCompute);
		var workGroupsNeeded = (WIDTH * HEIGHT) / 64;
		// var temp = Math.cbrt(workGroupsNeeded);
		// pass.dispatchWorkgroups(temp, temp, temp);
		pass.dispatchWorkgroups(workGroupsNeeded + 1, 1, 1);
		pass.end();
	
		// Encode a command to copy the results to a mappable buffer.
		// encoder.copyBufferToBuffer(agentBuffer, 0, resultBuffer, 0, resultBuffer.size);
		
		// Finish encoding and submit the commands
		var commandBuffer = encoder.finish();
		device.queue.submit([commandBuffer]);



		// ============================== RENDER PASS ================================
	  	renderPassDescriptor.colorAttachments[0].view = context.getCurrentTexture().createView();
	  	const renderEncoder = device.createCommandEncoder({label: 'render encoder'});
	  	const renderPass = renderEncoder.beginRenderPass(renderPassDescriptor);
	  	renderPass.setPipeline(pipeline);
	  	renderPass.setBindGroup(0, bindGroup);
	  	renderPass.setVertexBuffer(0, vertexBuffer);
	  	renderPass.draw(6);  // call our vertex shader 6 times (2 triangles)
	  	renderPass.end();
	  	const renderCommandBuffer = renderEncoder.finish();
	  	device.queue.submit([renderCommandBuffer]);
	}

	const deltaTime = 1/60;
	var frame = 0.0;
	let startTime = performance.now();
	var avgTime = 0.0;
	async function render2(time) {
		time = 0.001;
		frame += 1.0;
		stats.begin();

		if(frame % 1000 == 0)
			console.log(frame);

		screenDims[2] = frame;
		screenDims[3] = camera.MOVING;

		if(camera.MOVING)
		{
			frame = 0;
		}

		device.queue.writeBuffer(dimsBuffer, 0, screenDims);
		device.queue.writeBuffer(viewMatrixBuffer, 0, camera.viewMatrix);

		// ============================== COMPUTE PASS ================================
		var encoder = device.createCommandEncoder({label: 'compute encoder'});
		var pass = encoder.beginComputePass({label: 'compute pass'});
		pass.setPipeline(computePipeline);
		pass.setBindGroup(0, bindGroupCompute);
		var workGroupsNeeded = (WIDTH * HEIGHT) / 64;
		// pass.dispatchWorkgroups(temp, temp, temp);
		pass.dispatchWorkgroups(workGroupsNeeded + 1, 1, 1);
		pass.end();
	
		// Encode a command to copy the results to a mappable buffer.
		// encoder.copyBufferToBuffer(agentBuffer, 0, resultBuffer, 0, resultBuffer.size);
		
		// Finish encoding and submit the commands
		var commandBuffer = encoder.finish();
		device.queue.submit([commandBuffer]);



		// ============================== RENDER PASS ================================
	  	renderPassDescriptor.colorAttachments[0].view = context.getCurrentTexture().createView();
	  	const renderEncoder = device.createCommandEncoder({label: 'render encoder'});
	  	const renderPass = renderEncoder.beginRenderPass(renderPassDescriptor);
	  	renderPass.setPipeline(pipeline);
	  	renderPass.setBindGroup(0, bindGroup);
	  	renderPass.setVertexBuffer(0, vertexBuffer);
	  	renderPass.draw(6);  // call our vertex shader 6 times (2 triangles)
	  	renderPass.end();
	  	const renderCommandBuffer = renderEncoder.finish();
	  	device.queue.submit([renderCommandBuffer]);

		let currentTime = performance.now();
		avgTime += (currentTime - startTime);
		startTime = currentTime;

		// if(frame % 60 == 0) {
		// 	console.log(avgTime / 60);
		// 	avgTime = 0;
		// }

		stats.end();
	  	requestAnimationFrame(render2);
	}

  
	// code to resize canvas (https://webgpufundamentals.org/webgpu/lessons/webgpu-fundamentals.html)
	const observer = new ResizeObserver(entries => {
	  for (const entry of entries) {
		const canvas = entry.target;
		const width = entry.contentBoxSize[0].inlineSize;
		const height = entry.contentBoxSize[0].blockSize;
		canvas.width = Math.max(1, Math.min(width, device.limits.maxTextureDimension2D));
		canvas.height = Math.max(1, Math.min(height, device.limits.maxTextureDimension2D));
		// re-render
		render2();
	  }
	});

	observer.observe(canvas);
};

function fail(msg) {
	// eslint-disable-next-line no-alert
	alert(msg);
}

start();