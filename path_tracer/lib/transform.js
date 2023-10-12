import { vec3, mat4 } from 'https://cdn.skypack.dev/gl-matrix';

export class Transform
{
	constructor()
	{
		this.translateV = vec3.create();
		vec3.set(this.translate, 0, 0, 0);
		
		this.scaleV = vec3.create();
		vec3.set(this.scale, 1, 1, 1);
		
		this.rotationAngle = 0;
		this.rotationAxis = vec3.create();
		vec3.set(this.rotationAxis, 1, 0, 0);

		this.tx = 0.0;
		this.ty = 0.0;
		this.tz = 0.0;
		this.sx = 1.0;
		this.sy = 1.0;
		this.sz = 1.0;

		this.translateM = mat4.create();
		this.scaleM = mat4.create();
		this.rotationM = mat4.create();
		this.M = mat4.create();

		this.modelMatrix = mat4.create();
		mat4.identity(this.modelMatrix);

		this.invModelMatrix = mat4.create();
		mat4.identity(this.invModelMatrix);

		this.update();
	}

	getTransform() {
		return [...this.modelMatrix, ...this.invModelMatrix];
	}

	update(...transforms)
	{
		if(transforms.length > 0)
		{
			mat4.identity(this.M);

			for(let i = 0; i < transforms.length; i++)
			{
				mat4.mul(this.M, transforms[i], this.M)
			}

			mat4.identity(this.modelMatrix);
			mat4.mul(this.modelMatrix, this.M, this.modelMatrix);

			mat4.invert(this.invModelMatrix, this.modelMatrix);
		}
	}	

	translate(x, y, z)
	{
		this.tx = x;
		this.ty = y;
		this.tz = z;
		vec3.set(this.translateV, this.tx, this.ty, this.tz);
		mat4.fromTranslation(this.translateM, this.translateV);
		return this.translateM;
	}

	scale(sx, sy, sz)
	{
		this.sx = sx;
		this.sy = sy;
		this.sz = sz;
		vec3.set(this.scaleV, this.sx, this.sy, this.sz);
		mat4.fromScaling(this.scaleM, this.scaleV);
		// mat4.mul(this.modelMatrix, this.scaleM, this.modelMatrix);
		return this.scaleM;
	}

	rotate(theta, axis)
	{
		this.rotationAngle = theta;
		vec3.set(this.rotationAxis, axis[0], axis[1], axis[2]);
		mat4.fromRotation(this.rotationM, this.rotationAngle, this.rotationAxis);
		return this.rotationM;
	}
}