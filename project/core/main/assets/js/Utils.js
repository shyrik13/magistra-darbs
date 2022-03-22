import {vec2, vec3, mat4} from 'gl-matrix';

class Utils {

    static async createObjectFromFile(source) {
        const obj = {
            vertices: [],
            uvs: [],
            normals: [],
            tangents: [],
            bitangents: [],
            triangles: 0,
            vertexCount: 0
        };

        let vArr = [[0.0, 0.0, 0.0]];
        let uvArr = [[0.0, 0.0]];
        let vnArr = [[0.0, 0.0, 0.0]];

        const arr = source.split("\n");

        for (let i = 0; i < arr.length; i++) {
            let split = arr[i].split(' ');

            if (split.length === 0) {
                break;
            }

            if (split[0] === 'v') {
                vArr.push([parseFloat(split[1]), parseFloat(split[2]), parseFloat(split[3])]);
            } else if (split[0] === 'vt') {
                uvArr.push([parseFloat(split[1]), parseFloat(split[2])]);
            } else if (split[0] === 'vn') {
                vnArr.push([parseFloat(split[1]), parseFloat(split[2]), parseFloat(split[3])]);
            } else if (split[0] === 'f') {

                let vPoints = [];
                for (let j = 1; j < split.length; j++) {
                    if (split[j] === '\r') {
                        continue;
                    }

                    vPoints.push(split[j]);
                }

                let index = 0;
                let triangles = [];
                // quads logic ABCD => (ABC, ACD)
                while (index + 2 !== vPoints.length) {
                    triangles.push([vPoints[0], vPoints[index+1], vPoints[index+2]]);
                    index++;
                }

                for (let j = 0; j < triangles.length; j++) {
                    obj.triangles++;
                    let vs = [];
                    let uvs = [];

                    for (let k = 0; k < triangles[j].length; k++) {
                        let n_split = triangles[j][k].split('/');

                        let vp = vArr[parseInt(n_split[0])];
                        let uvp = uvArr[parseInt(n_split[1])];

                        obj.vertices.push(...vp);
                        obj.uvs.push(...uvp);
                        obj.normals.push(...vnArr[parseInt(n_split[2])]);

                        vs.push(vec3.fromValues(vp[0], vp[1], vp[2]));
                        uvs.push(vec2.fromValues(uvp[0], uvp[1]));

                        obj.vertexCount++;
                    }

                    // http://www.opengl-tutorial.org/intermediate-tutorials/tutorial-13-normal-mapping/#computing-the-tangents-and-bitangents
                    let deltaPos1 = vec3.create(); vec3.sub(deltaPos1, vs[1], vs[0]);
                    let deltaPos2 = vec3.create(); vec3.sub(deltaPos2, vs[2], vs[0]);

                    let deltaUV1 = vec2.create(); vec2.sub(deltaUV1, uvs[1], uvs[0]);
                    let deltaUV2 = vec2.create(); vec2.sub(deltaUV2, uvs[2], uvs[0]);

                    let r = 1.0 / (deltaUV1[0] * deltaUV2[1] - deltaUV1[1] * deltaUV2[0]);

                    // deltaPos1 * deltaUV2.y
                    let tangentMul1 = vec3.fromValues(deltaPos1[0] * deltaUV2[1], deltaPos1[1] * deltaUV2[1], deltaPos1[2] * deltaUV2[1]);
                    // deltaPos2 * deltaUV1.y
                    let tangentMul2 = vec3.fromValues(deltaPos2[0] * deltaUV1[1], deltaPos2[1] * deltaUV1[1], deltaPos2[2] * deltaUV1[1]);
                    let tangentSub = vec3.create(); vec3.sub(tangentSub, tangentMul1, tangentMul2);
                    // (deltaPos1 * deltaUV2.y - deltaPos2 * deltaUV1.y) * r
                    let tangent = vec3.fromValues(tangentSub[0] * r, tangentSub[1] * r, tangentSub[2] * r);

                    // deltaPos2 * deltaUV1.x
                    let bitangentMul1 = vec3.fromValues(deltaPos2[0] * deltaUV1[0], deltaPos2[1] * deltaUV1[0], deltaPos2[2] * deltaUV1[0]);
                    // deltaPos1 * deltaUV2.x
                    let bitangentMul2 = vec3.fromValues(deltaPos1[0] * deltaUV2[0], deltaPos1[1] * deltaUV2[0], deltaPos1[2] * deltaUV2[0]);
                    let bitangentSub = vec3.create(); vec3.sub(bitangentSub, bitangentMul1, bitangentMul2);
                    // (deltaPos2 * deltaUV1.x - deltaPos1 * deltaUV2.x) * r
                    let bitangent = vec3.fromValues(bitangentSub[0] * r, bitangentSub[1] * r, bitangentSub[2] * r);

                    for (let n = 0; n < 3; n++) {
                        obj.tangents.push(...tangent);
                        obj.bitangents.push(...bitangent);
                    }
                }
            }
        }

        return obj;
    }

    static async loadImages(imagesData) {
        const promises = await imagesData.map(data => {
            return new Promise((resolve, reject) => {
                let img = new Image()
                img.onload = () => resolve({id: data.id, data: img});
                img.onerror = reject;
                img.src = data.url;
            });
        });

        return await Promise.all(promises);
    }

    /**
     * imagesData = {
     *     {id: uniform_id, url: image_path}
     * }
     *
     * @param imagesData
     * @return {Promise<unknown[]>}
     */
    static async loadTextureImageUint8ArrayBuffers(imagesData) {
        const promises = await imagesData.map(data => {
            return new Promise((resolve) => {
                fetch(data.url).then(res => {
                    res.arrayBuffer().then(arrayBuffer => {

                        resolve({id: data.id, data: Array.from(new Uint8Array(arrayBuffer).values())});
                    });
                });
            });
        });

        return await Promise.all(promises);
    }

    static rotationModelXYZ(t, x, y, z) {
        const viewMatrix = mat4.create();
        let c = Math.cos(t);
        let s = Math.sin(t);

        mat4.set(viewMatrix,
           Math.pow(c, 2), -c*s, s, 0.0,
           c*(Math.pow(s, 2)+s), Math.pow(c, 2)-Math.pow(s, 3), -c*s, 0.0,
           s*(s-Math.pow(c, 2)), c*(Math.pow(s, 2)+s), Math.pow(c, 2), 0.0,
           x, y, z, 1.0
        );

        return viewMatrix;
    }

    static degsToRads(deg) {
        return (deg * Math.PI) / 180.0;
    }

    static getRandomIntInclusive(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1) + min) / 100;
    }
}

export default Utils;
