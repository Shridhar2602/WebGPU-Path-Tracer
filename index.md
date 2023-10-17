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

Ok, so next up we needed decide on a programming language. Almost all high-quality professional path tracers, like Pixar’s RenderMan, run on CPUs. That makes sense because large and complex scenes require a lot of memory and GPUs have limited VRAM. But we want real-time performance and we’re okay with small scenes, so we will do ray tracing on a GPU. 

Instead of sticking with our good old OpenGL, or modern Graphics APIs like Vulkan and DirectX, we decided to go with WebGPU. It is a relatively new standard, but it has a cool advantage of running on a web browser. WebGPU is being hailed as the future of web graphics, and it supports modern features like compute shaders which WebGL lacks. It is also very easy to setup and will eventually run on all types of systems ([WebGPU API - Compatibility Guide](https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API#browser_compatibility)).

## A Minimal Ray-Tracer

We started by following Peter Shirley’s wonderful [Ray Tracing in One Weekend Series](https://raytracing.github.io/). It’s fairly easy to understand, well paced and includes code snippets in C++. All we need to do is port it to WebGPU, which is not as straightforward as it sounds because GPUs specialize in doing simple operations really fast which means that code optimized for CPU won’t necessarily translate to GPU efficiency. Furthermore, most shaders still don’t support recursive calls, which is a problem because ray-tracing in inherently a recursive operation. 

Here, we won’t be going into details on the math and physics behind ray-tracing because there’s no way we can do a better job than Peter Shirley. Instead, we’ll focus on the implementation details & challenges we faced when implementing ray-tracing on WebGPU.

Lastly, we followed [WebGPU Fundamentals](https://webgpufundamentals.org/) to set up a basic WebGPU pipeline. For now we don’t want to go into optimizing WebGPU for performance, though we do plan to do so later. 

## Code structure

We currently have a multi-shader setup with a two-pass system -

- 1st pass (compute shader) : does the ray-tracing and stores the final color in a buffer.
- 2nd pass (vertex + fragment shader) : renders the final colors on the screen.

It is technically possible to do everything in a fragment shader. However, compute shaders gives us control over how work is distributed in a GPU. Currently, a single compute shader handles everything, but we plan to split it into multiple shaders, which can improve performance.

## Shooting rays

In order to shoot rays from the camera to each pixel, we first need to convert the pixel coordinates from **raster space** to **screen space.** 

In a compute shader, we only have access to the `global_invocation_index` , which we can think of as a linear id of each pixel (actually, `global_invocation_index` is not a built-in, so we must first calculate it. [WebGPU Compute Shader Basics](https://webgpufundamentals.org/webgpu/lessons/webgpu-compute-shaders.html) is an excellent resource on how compute shaders work).

Given the screen dimensions, we can easily convert the linear pixel index to the raster space (a 2D space with (0,0) being the top-left corner) -

```rust
let fragCoord = vec3f(f32(i) % screenDims.x, f32(i) / screenDims.x, 1);
```

The z-coordinate is fixed as 1 since our projection plane is fixed at (0, 0, 1). Now, we can convert these to the screen space -

```rust
aspect = screenDims.x / screenDims.y;
pixel_x = aspect * (2 * (fragCoord.x / width) - 1)  // [ranges from -aspect to +aspect]
pixel_y = -(2 * (fragCoord.y / height) - 1)  // [ranges from +1 to -1]
```

In rasterization, the camera remains fixed at the origin and we use a world-to-view matrix (typically called `viewMatrix`) to transform the world to the camera space, where all calculations are carried out. However, in ray tracing, it is more convenient to work in world space. So, we transform the ray to the world space using the inverse of the `viewMatrix`.

The following function takes the pixel coordinates, computes the ray from the camera to the pixel, and transforms it to the world space:

```rust
fn camera_get_ray(s : f32, t : f32) -> Ray {

	let origin = (invViewMatrix * vec4f(0, 0, 0, 1)).xyz;  // projection plane fixed at (0,0,1)
	let dir = (invViewMatrix * vec4f(vec3f(s, t, -fovFactor), 0)).xyz;
	var ray = Ray(origin, dir);

	return ray;
}
```

Now, we can shoot this ray into the scene.

NOTE : Peter Shirley doesn’t use any matrices in his implementations. We don’t really have to because there are many ways to describe the transformation due to an arbitrarily positioned camera. However, for us, it is more efficient to precompute a `viewMatrix` , rather than computing it for each pixel in a shader.