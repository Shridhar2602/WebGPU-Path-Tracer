import {GUI} from 'https://threejsfundamentals.org/threejs/../3rdparty/dat.gui.module.js';
import { vec3 } from 'https://cdn.skypack.dev/gl-matrix';
import {VS} from './shaders/vertex.js';
import {FS} from './shaders/fragment.js';
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
  
	var str_compute = await loadTextfile('./shaders/compute.wgsl');
	// str_compute = str_compute.text();

	// creating shader module 
	const module = device.createShaderModule({
	  label: 'Vertex + Fragment Shaders',
	  code: VS + str_compute + FS,
	});

	const WIDTH = canvas.clientWidth;
	const HEIGHT = canvas.clientHeight;

	// Setting uniforms
	var screenDims = new Float32Array([WIDTH, HEIGHT, 0]);
	const dimsBuffer = device.createBuffer({
		  label: 'screen dims buffer',
		size: screenDims.byteLength,
		usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
	});
	device.queue.writeBuffer(dimsBuffer, 0, screenDims);
	
	// setting sphere data
	var spheres = create_spheres();
	const sphereBuffer = device.createBuffer({
		label: 'spheres buffer',
		  size: spheres.byteLength,
		  usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
	});
	device.queue.writeBuffer(sphereBuffer, 0, spheres);

	// setting quadrilateral data
	var quads = create_quads();
	const quadBuffer = device.createBuffer({
		label: 'quads buffer',
		  size: quads.byteLength,
		  usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
	});
	device.queue.writeBuffer(quadBuffer, 0, quads);

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

	// // Buffer to store agent info
	// var input = create_agents_circleIn(NUM_AGENTS, WIDTH, HEIGHT);
  	// const agentBuffer = device.createBuffer({
    // 	label: 'agent buffer',
   	// 	size: input.byteLength,
    // 	usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
  	// });
  	// device.queue.writeBuffer(agentBuffer, 0, input);

  	// // create a buffer on the GPU to get a copy of the results
  	// const resultBuffer = device.createBuffer({
  	//   label: 'result buffer',
  	//   size: input.byteLength,
  	//   usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
  	// });

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
		  { binding: 1, resource: {buffer : sphereBuffer}},
		  { binding: 2, resource: {buffer : quadBuffer}},
		  { binding: 3, resource: {buffer : frameBuffer}},
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

	function render()
	{
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
	async function render2(time) {
		time *= 0.002;
		stats.begin();

		screenDims[2] = time;
		device.queue.writeBuffer(dimsBuffer, 0, screenDims);

		// ============================== COMPUTE PASS ================================
		var encoder = device.createCommandEncoder({label: 'compute encoder'});
		var pass = encoder.beginComputePass({label: 'compute pass'});
		pass.setPipeline(computePipeline);
		pass.setBindGroup(0, bindGroupCompute);
		var workGroupsNeeded = (WIDTH * HEIGHT) / 64;
		var temp = Math.cbrt(workGroupsNeeded);
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
		render();
	  }
	});

	observer.observe(canvas);
};

function fail(msg) {
	// eslint-disable-next-line no-alert
	alert(msg);
}

start();

function create_spheres() {

	var hittable = [];

	// dummy sphere
	// hittable.push(sphere([-100, 0, 0],       1, [0, 0, 0],    0, 0,   0,    [0, 0, 0]));

	// cornell spheres
	hittable.push(sphere([-0.6, -0.75, 1.1],       0.25, [1, 1, 1],    0, 0,   1.1,    [0, 0, 0]));
	hittable.push(sphere([0, -0.75, 0.5],       0.25, [1, 1, 1],    1, 0,   1.4,    [0, 0, 0]));
	hittable.push(sphere([0.6, -0.75, 1.1],       0.25, [1, 1, 1],    0, 0,   1.04,    [0, 0, 0]));
	hittable.push(sphere([0, -0, 1.4],       0.25, [1, 1, 1],    2, 0,   1.05,    [0, 0, 0]));



	// SCENE - 2
	// hittable.push(sphere([0, -100, 0], 100, [0.4, 0, 0.4],       0, 0.1,  1.5, [0, 0, 0]));
	// hittable.push(sphere([5, 1.9, -2],       2,   [1, 1, 1],     0,  0,   1,    [0, 0, 0]));
	// hittable.push(sphere([2, 1.47, 0],       1.5, [1, 0, 0],     0,  0,   1.5,  [0, 0, 0]));
	// hittable.push(sphere([-0.3, 1, 1],       1,   [0, 1, 0],     0,  0,   1,    [0, 0, 0]));
	// hittable.push(sphere([-2, 0.67, 1.5],    0.7, [0, 1, 1],     0,  0,   1.5,  [0, 0, 0]));
	// hittable.push(sphere([-3.2, 0.45, 1.6],  0.5, [1, 1, 1],     2,  1,   1.3,  [0, 0, 0]));
	// hittable.push(sphere([-9, 12, -4],       6.5, [0, 0, 0],    0, 0,   1.5,    [6, 6, 6]));

	// SCENE - 1
	// hittable.push([0, -200.5, 0, 200, 0.5, 0.5, 0.5, 0, 0.1,   1.5, 0, 0]);
	// hittable.push([0, 0, 0,      0.5, 1, 0, 0,     , 1,  1,   1, 0, 0]);
	// hittable.push([1.1, 0.1, 0,    0.6, 0.7, 0.7, 0.7,     1,  0,   1, 0, 0]);
	// hittable.push([2.4, 0.2, 0,    0.7, 1, 0, 1,           0,  0,   1.5, 0, 0]);
	// hittable.push([-1.1, 0.1, 0,    0.6, 0.7, 0.7, 0.7,    1,  0,   1, 0, 0]);
	// hittable.push([-2.4, 0.2, 0,    0.7, 1, 1, 0,          0,  0,   1.5, 0, 0]);
	// hittable.push([0, 0.1, 1.1,     0.6, 0.7, 0.7, 0.7 ,   1,  0,   1.5, 0, 0]);
	// hittable.push([0, 0.2, 2.4,     0.7, 0, 1, 0,          0,  0,   1.5, 0, 0]);
	// hittable.push([0, 0.1, -1.1,    0.6, 0.7, 0.7, 0.7 ,   1,  0,   1.5, 0, 0]);
	// hittable.push([0, 0.2, -2.4,    0.7, 0, 1, 1,          0,  0,   1.5, 0, 0]);

	return new Float32Array(hittable.flat());
}

function sphere(pos, r, color, material, eta, fuzz, emission) {
	return [
		pos[0], pos[1], pos[2], r,
		color[0], color[1], color[2], material, 
		eta, fuzz, -1, -1,
		emission[0], emission[1], emission[2], -1
	];
}

function create_quads() {
	var hittable = [];

	// hittable.push(quad([-100, -100, 0],       [100, 100, 100],   [100, 100, 100],   [1, 1, 1], 0, 0, 0, [0, 0, 0])); //back

	// cornell box
	hittable.push(quad([-1, -1, 0],       [2, 0, 0],   [0, 2, 0],   [0.3, 0.3, 0.3], 0, 0, 0, [0, 0, 0])); //back
	hittable.push(quad([-1, -1, 2],       [0, 0, -2],  [0, 2, 0],   [1, 0, 0], 0, 0, 0, [0, 0, 0])); // left
	hittable.push(quad([1, -1, 0],        [0, 0, 2],  [0, 2, 0],   [0, 1, 0], 0, 0, 0, [0, 0, 0])); // right
	hittable.push(quad([-0.25, 1, 0.75],  [0.5, 0, 0], [0, 0, 0.5], [0, 0, 0], 0, 0, 0, [20, 20, 20])); //light
	hittable.push(quad([-1, 1, 0],        [2, 0, 0],   [0, 0, 2], 	[1, 1, 1], 0, 0, 0, [0, 0, 0])); //top
	hittable.push(quad([1, -1, 0],       [-2, 0, 0],   [0, 0, 2], 	[1, 1, 1], 0, 0, 0, [0, 0, 0])); //bottom
	hittable.push(quad([1, -1, 2],        [-2, 0, 0],   [0, 2, 0], 	[0, 0, 1], 0, 0, 0, [0, 0, 0])); //front
	return new Float32Array(hittable.flat());
}

function quad(Q, u, v, color, material, eta, fuzz, emission) {
	var n = vec3.create(), normal = vec3.create(), w = vec3.create(), D = 0;
	vec3.cross(n, u, v);
	vec3.normalize(normal, n);
	D = vec3.dot(normal, Q);
	var temp = vec3.dot(n, n);
	vec3.set(w, n[0] / temp, n[1] / temp, n[2] / temp);

	return [
		Q[0], Q[1], Q[2], -1,
		u[0], u[1], u[2], -1,
		v[0], v[1], v[2], -1,
		normal[0], normal[1], normal[2], D,
		w[0], w[1], w[2], material,
		color[0], color[1], color[2], fuzz,
		emission[0], emission[1], emission[2], eta
	];
}













	// for(var a = -5; a < 5; a++)
	// {
	// 	for(var b = -5; b < 5; b++)
	// 	{
	// 		var choose_mat = Math.random();
	// 		var center = [a + 0.9 * Math.random(), 0/2, b + 0/9 * Math.random()];

	// 		var p1 = center[0] - 4;
	// 		var p2 = center[1] - 0.2;
	// 		var p3 = center[2] - 0;
	// 		var length = Math.sqrt(p1*p1 + p2*p2 + p3*p3);

	// 		if(length > 0.9)
	// 		{
	// 			if(choose_mat < 0.8)
	// 			{
	// 				hittable.push([
	// 					center[0], center[1], center[2], 
	// 					0.2, 
	// 					Math.random(), Math.random(), Math.random(),
	// 					0, 1, 1, 0, 0
	// 				]);
	// 			}

	// 			else if(choose_mat < 0.95)
	// 			{
	// 				hittable.push([
	// 					center[0], center[1], center[2], 
	// 					0.2, 
	// 					0.5 + 0.5 * Math.random(), 0.5 + 0.5 * Math.random(), 0.5 + 0.5 * Math.random(),
	// 					1, 0.5 + 0.5 * Math.random(), 1, 0, 0
	// 				]);
	// 			}

	// 			else 
	// 			{
	// 				hittable.push([
	// 					center[0], center[1], center[2], 
	// 					0.2, 
	// 					1, 1, 1,
	// 					2, 1, 1.5, 0, 0
	// 				]);
	// 			}
	// 		}
	// 	}
	// }