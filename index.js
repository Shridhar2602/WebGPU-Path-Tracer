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
  
	// creating shader module 
	const module = device.createShaderModule({
	  label: 'Vertex + Fragment Shaders',
	  code: VS + FS,
	});

	const WIDTH = canvas.clientWidth;
	const HEIGHT = canvas.clientHeight;
	const ASPECT = WIDTH / HEIGHT;
	// console.log(WIDTH, HEIGHT, ASPECT)

	// Setting uniforms
	const screenDims = new Float32Array([WIDTH, HEIGHT, ASPECT]);
	const dimsBuffer = device.createBuffer({
	  	label: 'screen dims buffer',
		size: screenDims.byteLength,
		usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
	});
	device.queue.writeBuffer(dimsBuffer, 0, screenDims);

	// const randState = new Float32Array([WIDTH, HEIGHT]);
	// const randBuffer = device.createBuffer({
	//   	label: 'screen dims buffer',
	// 	size: screenDims.byteLength,
	// 	usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
	// });
	// device.queue.writeBuffer(randBuffer, 0, randState);


	// ============================== COMPUTE PIPELINE ================================

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
		//   { binding: 1, resource: {buffer : randBuffer}},
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

	// const deltaTime = 1/60;
	// async function render(time) {
	// 	time *= 0.0001;


	// 	// ============================== RENDER PASS ================================
	//   	// Get the current texture from the canvas context and
	//   	// set it as the texture to render to.
	//   	renderPassDescriptor.colorAttachments[0].view = context.getCurrentTexture().createView();
		  
	//   	const renderEncoder = device.createCommandEncoder({label: 'render encoder'});
	//   	const renderPass = renderEncoder.beginRenderPass(renderPassDescriptor);
	//   	renderPass.setPipeline(pipeline);
	//   	renderPass.setBindGroup(0, bindGroup);
	//   	renderPass.setVertexBuffer(0, vertexBuffer);
	//   	renderPass.draw(6);  // call our vertex shader 6 times (2 triangles)
	//   	renderPass.end();
  
	//   	const renderCommandBuffer = renderEncoder.finish();
	//   	device.queue.submit([renderCommandBuffer]);

	//   	requestAnimationFrame(render);
	// }

  
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