import webglObjLoader from 'https://cdn.jsdelivr.net/npm/webgl-obj-loader@2.0.8/+esm'

export class ObjReader
{
	constructor()
	{

	}

	static async load_model_fast(path) {
		const file = await fetch(path);
		const text = await file.text();
		
		let temp = new webglObjLoader.OBJ.Mesh(text)
		return {vertices : new Float32Array(temp.vertices), normals : new Float32Array(temp.vertexNormals)}
	}


	static async load_model(path)
	{
		const file = await fetch(path);
		const text = await file.text();
		
		const lines = text.split('\n');
		let vertexArray = [];
		let indexArray = [];
		let normalArray = [];
		let normalIndex = [];
		
		for(let i = 0; i < lines.length; i++)
		{
			const line = lines[i].trim();

			if(line.startsWith('#'))
				continue;

			else if (line.startsWith('v '))
			{
				let temp = line.split(" ").slice(1);
				temp = temp.map(Number)
				vertexArray.push(temp);
			}

			else if (line.startsWith('f '))
			{
				let temp = line.split(/[\s/]+/).slice(1);
				
				let vert = temp.filter(function(v, i) {
					return i % 3 == 0;
				})
				vert = vert.map(Number)
				vert = vert.map(v=> v - 1)
				indexArray = indexArray.concat(vert)

				let norm = temp.filter(function(v, i) {
					return i % 3 == 2;
				})
				norm = norm.map(Number)
				norm = norm.map(v=> v - 1)
				normalIndex = normalIndex.concat(norm)
			}

			else if (line.startsWith('vn '))
			{
				let temp = line.split(" ").slice(1);
				temp = temp.map(Number)
				normalArray.push(temp)
			}
		}


		normalArray = normalIndex.map(v => normalArray[v])
		normalArray = normalArray.flat(1);

		vertexArray = indexArray.map(v => vertexArray[v])
		vertexArray = vertexArray.flat(1)

		return {vertices : new Float32Array(vertexArray), normals : new Float32Array(normalArray)}
	}
}