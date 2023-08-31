import { vec3, mat4, quat } from 'https://cdn.skypack.dev/gl-matrix';

export class Camera
{
	constructor(canvas)
	{
		this.viewMatrix = mat4.create();

		this.eye = vec3.create();
		this.center = vec3.create();
		this.up = vec3.create();
		this.direction = vec3.create();
		this.rotateAngle = 0;

		this.zoomSpeed = 0.1;
		this.moveSpeed = 0.005;

		this.MOVING = 0;

		this.MoveCamera(canvas, this);
	}

	set_camera(eye=this.eye, center=this.center, up=this.up)
	{
		vec3.set(this.eye, eye[0], eye[1], eye[2])
		vec3.set(this.center, center[0], center[1], center[2])
		vec3.set(this.up, up[0], up[1], up[2])

		vec3.subtract(this.direction, this.eye, this.center);
		mat4.targetTo(this.viewMatrix, eye, center, up);
	}

	zoom(delta)
	{
		// this.eye[0] += this.direction[0] * this.zoomSpeed * Math.sign(delta);
		// this.eye[1] += this.direction[1] * this.zoomSpeed * Math.sign(delta);
		// this.eye[2] += this.direction[2] * this.zoomSpeed * Math.sign(delta);

		this.set_camera();
	}

	move(oldCoord, newCoord)
	{
		let dX = (newCoord[0] - oldCoord[0]) * Math.PI / 180 * this.moveSpeed;
		let dY = (newCoord[1] - oldCoord[1]) * Math.PI / 180 * this.moveSpeed;

		this.rotateAngle = dX;

		vec3.rotateY(this.eye, this.eye, [0, 0, 0], dX);
		this.set_camera();
	}

	MoveCamera(canvas, camera)
	{
		let oldCoord = [];
		let newCoord = [];

		canvas.addEventListener("mousedown", event => {
			if(event.button == 0)
			{
				oldCoord = [event.clientX, event.clientY]
				canvas.addEventListener("mousemove", onMouseMove)
			}
		})

		function onMouseMove(event)
		{
			newCoord = [event.clientX, event.clientY]
			camera.move(oldCoord, newCoord)
			camera.MOVING = 1;
		}

		canvas.addEventListener("mouseup", event => {
			canvas.removeEventListener("mousemove", onMouseMove);
			this.MOVING = 0;
		})
	}
}