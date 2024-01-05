import { Renderer } from './renderer.js';
import { Camera } from './lib/camera.js';	
import { Scene } from './lib/scene.js';

async function start() {
	const renderer = await Renderer.create();	
	render(renderer);
}

async function render(renderer) {

	const device = renderer.webGPU.device;
	const canvas = document.querySelector('canvas');
  
	const module = await renderer.createShaderModule();

	const WIDTH = canvas.clientWidth;
	const HEIGHT = canvas.clientHeight;

	const camera = new Camera(canvas);
	const scene = new Scene();

	await renderer.initBuffers(scene, camera, WIDTH, HEIGHT);
	renderer.createComputePipeline(module);
	renderer.createRenderPipeline(module);

	const renderParams = {
		WIDTH: WIDTH,
		HEIGHT: HEIGHT,
		showFPS: true,
		maxFPS: 61,
		logCountOfSamples: false,
		logPerformance: false,
	}

	renderer.setRenderParameters(renderParams, camera, WIDTH, HEIGHT);

	// eye, center, up
	camera.set_camera([0.5, 0, 2.5], [0.5, 0, 0], [0, 1, 0]);

	// code to resize canvas (https://webgpufundamentals.org/webgpu/lessons/webgpu-fundamentals.html)
	const observer = new ResizeObserver(entries => {
	  for (const entry of entries) {
		const canvas = entry.target;
		const width = entry.contentBoxSize[0].inlineSize;
		const height = entry.contentBoxSize[0].blockSize;
		canvas.width = Math.max(1, Math.min(width, device.limits.maxTextureDimension2D));
		canvas.height = Math.max(1, Math.min(height, device.limits.maxTextureDimension2D));

		// re-render
		renderer.renderAnimation();
		// renderer.renderSingleFrame();
	  }
	});

	observer.observe(canvas);
};

start();