export class WebGPU 
{
	constructor()
	{
		this.device = null;
	}

	createShaderModule(source) {
		const shaderModuleDescriptor = {
			code: source,
		};
		return this.device.createShaderModule(shaderModuleDescriptor);
	}

	createUniformBuffer(label, uniformArray) {
		const uniformBuffer = this.device.createBuffer({
			label: label,
			size: uniformArray.byteLength,
			usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
		});
		this.device.queue.writeBuffer(uniformBuffer, 0, uniformArray);

		return {
			data: uniformArray,
			buffer: uniformBuffer
		}
	}

	createStorageBuffer_WriteOnly(label, bufferArray) {
		const storageBuffer = this.device.createBuffer({
			label: label,
			size: bufferArray.byteLength,
			usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
		});
		this.device.queue.writeBuffer(storageBuffer, 0, bufferArray);

		return {
			data: bufferArray,
			buffer: storageBuffer
		}
	}

	createStorageBuffer_ReadWrite(label, bufferArray) {
		const storageBuffer = this.device.createBuffer({
			label: label,
			size: bufferArray.byteLength,
			usage: GPUBufferUsage.STORAGE |  GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
		});
		this.device.queue.writeBuffer(storageBuffer, 0, bufferArray);

		return {
			data: bufferArray,
			buffer: storageBuffer
		}
	}

	createVertexBuffer(label, bufferArray) {
		const vertexBuffer = this.device.createBuffer({
			label: label,
			size: bufferArray.byteLength,
			usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
		});
		this.device.queue.writeBuffer(vertexBuffer, 0, bufferArray);

		return {
			data: bufferArray,
			buffer: vertexBuffer
		}
	}

	createRenderPipeline(module) {
		const renderPipeline = this.device.createRenderPipeline({
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
			  targets: [{ format: this.presentationFormat }],
			},
		});

		return renderPipeline;
	}

	createRenderPassDescriptor() {
		const renderPassDescriptor = {
			label: 'renderPass',
			colorAttachments: [
			  {
				clearValue: [0.3, 0.3, 0.3, 1],
				loadOp: 'clear',
				storeOp: 'store',
			  },
			],
		};

		return renderPassDescriptor;
	}

	createComputePipeline(module) {
		const computePipeline = this.device.createComputePipeline({
			label: 'Compute pipeline',
			layout: 'auto',
			compute: {
			  module,
			  entryPoint: 'computeFrameBuffer',
			},
		});

		return computePipeline;
	}


	computePass(computePipeline, bindGroupCompute, workGroupsNeeded) {
		let encoder = this.device.createCommandEncoder({label: 'compute encoder'});
		let pass = encoder.beginComputePass({label: 'compute pass'});
		pass.setPipeline(computePipeline);
		pass.setBindGroup(0, bindGroupCompute);
		pass.dispatchWorkgroups(workGroupsNeeded + 1, 1, 1);
		pass.end();
		let commandBuffer = encoder.finish();
		this.device.queue.submit([commandBuffer]);
	}


	renderPass(renderPassDescriptor, renderPipeline, bindGroup, vertexBuffer) {
		renderPassDescriptor.colorAttachments[0].view = this.context.getCurrentTexture().createView();
	  	const renderEncoder = this.device.createCommandEncoder({label: 'render encoder'});
	  	const renderPass = renderEncoder.beginRenderPass(renderPassDescriptor);
	  	renderPass.setPipeline(renderPipeline);
	  	renderPass.setBindGroup(0, bindGroup);
	  	renderPass.setVertexBuffer(0, vertexBuffer);
	  	renderPass.draw(6);  // call our vertex shader 6 times (2 triangles)
	  	renderPass.end();
	  	const renderCommandBuffer = renderEncoder.finish();
	  	this.device.queue.submit([renderCommandBuffer]);
	}




	// Functions for creating Render Passes
	createCommandEncoder(label) {
		return this.device.createCommandEncoder({label: label});
	}

	setCanvasAsRenderTarget(renderPassDescriptor) {
		renderPassDescriptor.colorAttachments[0].view = this.context.getCurrentTexture().createView();
	}

	makeRenderPass(renderEncoder, renderPassDescriptor, renderPipeline, bindGroup, vertexBuffer, numDrawCalls) {
		const renderPass = renderEncoder.beginRenderPass(renderPassDescriptor);
		renderPass.setPipeline(renderPipeline);
		renderPass.setBindGroup(0, bindGroup);
		renderPass.setVertexBuffer(0, vertexBuffer);
		renderPass.draw(numDrawCalls);
		renderPass.end();
	}

	addCommandBufferToQueue(renderEncoder) {
		this.device.queue.submit([renderEncoder.finish()]);
	}



	// Initializing WebGPU (https://webgpufundamentals.org/webgpu/lessons/webgpu-fundamentals.html)
	async init()
	{
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

		const canvas = document.querySelector('canvas');
		const context = canvas.getContext('webgpu');
		const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
		context.configure({
	  		device,
	  		format: presentationFormat,
		});

		this.device = device;
		this.context = context;
		this.presentationFormat = presentationFormat;
	}
}