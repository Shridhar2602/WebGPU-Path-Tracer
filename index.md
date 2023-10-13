# WebGPU Path Tracer

[Code Link](https://github.com/Shridhar2602/WebGPU-Path-Tracer)

[Live demo](./path_tracer/index.html) 

Warning - It requires a reasonably powerful GPU and a web browser with WebGPU support enabled.
## Goal

For our Advanced Computer Graphics course project, we decided to build our own Path Tracer from ground zero. Surprisingly, building a path tracer is not that complex. There’s even a [Monte Carlo Path Tracer written in just 99 lines of C++](https://www.kevinbeason.com/smallpt/), generating a picture of a Cornell Box. So we first need to set some goals - 

- We want our ray tracer to be real-time. Challenging, but we’ll see.
- We don’t want to just make another toy ray tracer capable of rendering only parametric shapes. There are tons of really cool shaders on [Shadertoy](https://www.shadertoy.com/).
- A ray tracer that can handle small meshes, maybe a few thousand triangles, would be a solid starting point.
- Building a good ray tracer involved two key aspects: improving the render quality and enhancing performance. We’ll begin by setting up a bare bones path tracer with basic materials. Then optimizing it to run really fast, and finally adding other fancy effects.

## Why WebGPU?

Ok, so next up we need decide on a programming language. Almost all high-quality professional path tracers, like Pixar’s RenderMan, run on CPUs. That makes sense because large and complex scenes require a lot of memory and GPUs have limited VRAM. But we want real-time performance and we’re okay with small scenes, so we will do ray tracing on a GPU. 

Instead of sticking with our good old OpenGL, or modern Graphics APIs like Vulkan and DirectX, we decided to go with WebGPU. It is a relatively new standard, but it has a cool advantage of running on a web browser. WebGPU is being hailed as the future of web graphics, and it supports modern features like compute shaders which WebGL lacks. It is also very easy to setup and will eventually run on all types of systems ([WebGPU API - Compatibility Guide](https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API#browser_compatibility)).