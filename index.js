import {GUI} from 'https://threejsfundamentals.org/threejs/../3rdparty/dat.gui.module.js';
import {VS} from './shaders/vertex.js';
import {FS} from './shaders/fragment.js';
import {CS} from './shaders/compute.js';

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
  
	// creating shader module 
	const module = device.createShaderModule({
	  label: 'Vertex + Fragment Shaders',
	  code: VS + FS,
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

	// function render()
	// {
	// 	renderPassDescriptor.colorAttachments[0].view = context.getCurrentTexture().createView();
			  
	// 	const renderEncoder = device.createCommandEncoder({label: 'render encoder'});
	// 	const renderPass = renderEncoder.beginRenderPass(renderPassDescriptor);
	// 	renderPass.setPipeline(pipeline);
	// 	renderPass.setBindGroup(0, bindGroup);
	// 	renderPass.setVertexBuffer(0, vertexBuffer);
	// 	renderPass.draw(6);  // call our vertex shader 6 times (2 triangles)
	// 	renderPass.end();

	// 	const renderCommandBuffer = renderEncoder.finish();

	// 	device.queue.submit([renderCommandBuffer]);
	// }

	const deltaTime = 1/60;
	async function render(time) {
		time *= 0.002;
		stats.begin();



		screenDims[2] = time;
		device.queue.writeBuffer(dimsBuffer, 0, screenDims);

		// ============================== RENDER PASS ================================
	  	// Get the current texture from the canvas context and
	  	// set it as the texture to render to.
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
	  	requestAnimationFrame(render);
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

	hittable.push([0, -200.5, 0, 200, 0.5, 0.5, 0.5, 1, 0.1,   1, 0, 0]);
	
	hittable.push([0, 0, 0,      0.5, 1, 0, 0,     , 1,  1,   1, 0, 0]);
	// hittable.push([-1, 0, 0,     0.5, 0.7, 0.7, 0.7, 1,  0.4, 1.5, 0, 0]);
	// hittable.push([1, 0, 0,      0.5, 0.7, 0.7, 0.7, 1,  0,   1, 0, 0]);

	hittable.push([1.1, 0.1, 0,    0.6, 0.7, 0.7, 0.7,   1,  0,   1, 0, 0]);
	hittable.push([2.4, 0.2, 0,    0.7, 1, 0, 1,         0,  0,   1, 0, 0]);
	hittable.push([-1.1, 0.1, 0,    0.6, 0.7, 0.7, 0.7,  1,  0,   1, 0, 0]);
	hittable.push([-2.4, 0.2, 0,    0.7, 1, 1, 0,        0,  0,   1, 0, 0]);

	hittable.push([0, 0.1, 1.1,     0.6, 0.7, 0.7, 0.7 ,  1,  0,   1.5, 0, 0]);
	hittable.push([0, 0.2, 2.4,     0.7, 0, 1, 0,        0,  0,   1, 0, 0]);
	hittable.push([0, 0.1, -1.1,    0.6, 0.7, 0.7, 0.7 ,  1 ,  0,   1.5, 0, 0]);
	hittable.push([0, 0.2, -2.4,    0.7, 0, 1, 1,        0,  0,   1, 0, 0]);

	// hittable.push([-3, 0.2, -2.4,    0.7, 1, 1, 1,        2,  0,   1, 0, 0]);



	// hittable.push([0, 0, -1,      0.5, 0.7, 0.7, 0.7, 1,  0,   1, 0, 0]);
	// hittable.push([0, 0, 1,      0.5, 0.7, 0.7, 0.7, 1,  0,   1, 0, 0]);

	return new Float32Array(hittable.flat());
}