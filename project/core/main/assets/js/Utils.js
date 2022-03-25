import {vec2, vec3, mat4} from 'gl-matrix';

// TODO: remove

const ZEROS = [0, 0, 0];
const ONES = [1, 1, 1];

class Utils {

    static async createObjectFromFile(source, asFloat32Array = false) {
        const obj = {
            positions: [],
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

                        obj.positions.push(...vp);
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

        if (asFloat32Array) {
            obj.positions = new Float32Array(obj.positions);
            obj.uvs = new Float32Array(obj.uvs);
            obj.normals = new Float32Array(obj.normals);
            obj.tangents = new Float32Array(obj.tangents);
            obj.bitangents = new Float32Array(obj.tangents);
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

    // TODO: remove
    static xformMatrix(xform, translate, rotate, scale, translateMat, rotateXMat, rotateYMat, rotateZMat, scaleMat) {
        translate = translate || ZEROS;
        rotate = rotate || ZEROS;
        scale = scale || ONES;

        mat4.fromTranslation(translateMat, translate);
        mat4.fromXRotation(rotateXMat, rotate[0]);
        mat4.fromYRotation(rotateYMat, rotate[1]);
        mat4.fromZRotation(rotateZMat, rotate[2]);
        mat4.fromScaling(scaleMat, scale);

        mat4.multiply(xform, rotateXMat, scaleMat);
        mat4.multiply(xform, rotateYMat, xform);
        mat4.multiply(xform, rotateZMat, xform);
        mat4.multiply(xform, translateMat, xform);
    }

    static getImageData(img, textureDataCanvas, textureDataCtx) {
        textureDataCanvas.width = img.width;
        textureDataCanvas.height = img.height;
        textureDataCtx.drawImage(img, 0, 0);
        return textureDataCtx.getImageData(0, 0, img.width, img.height).data;
    }

    static createCube(options) {
        options = options || {};

        let dimensions = options.dimensions || [1, 1, 1];
        let position = options.position || [-dimensions[0] / 2, -dimensions[1] / 2, -dimensions[2] / 2];
        let x = position[0];
        let y = position[1];
        let z = position[2];
        let width = dimensions[0];
        let height = dimensions[1];
        let depth = dimensions[2];

        let fbl = {x: x,         y: y,          z: z + depth};
        let fbr = {x: x + width, y: y,          z: z + depth};
        let ftl = {x: x,         y: y + height, z: z + depth};
        let ftr = {x: x + width, y: y + height, z: z + depth};
        let bbl = {x: x,         y: y,          z: z };
        let bbr = {x: x + width, y: y,          z: z };
        let btl = {x: x,         y: y + height, z: z };
        let btr = {x: x + width, y: y + height, z: z };

        let positions = new Float32Array([
            //front
            fbl.x, fbl.y, fbl.z,
            fbr.x, fbr.y, fbr.z,
            ftl.x, ftl.y, ftl.z,
            ftl.x, ftl.y, ftl.z,
            fbr.x, fbr.y, fbr.z,
            ftr.x, ftr.y, ftr.z,

            //right
            fbr.x, fbr.y, fbr.z,
            bbr.x, bbr.y, bbr.z,
            ftr.x, ftr.y, ftr.z,
            ftr.x, ftr.y, ftr.z,
            bbr.x, bbr.y, bbr.z,
            btr.x, btr.y, btr.z,

            //back
            fbr.x, bbr.y, bbr.z,
            bbl.x, bbl.y, bbl.z,
            btr.x, btr.y, btr.z,
            btr.x, btr.y, btr.z,
            bbl.x, bbl.y, bbl.z,
            btl.x, btl.y, btl.z,

            //left
            bbl.x, bbl.y, bbl.z,
            fbl.x, fbl.y, fbl.z,
            btl.x, btl.y, btl.z,
            btl.x, btl.y, btl.z,
            fbl.x, fbl.y, fbl.z,
            ftl.x, ftl.y, ftl.z,

            //top
            ftl.x, ftl.y, ftl.z,
            ftr.x, ftr.y, ftr.z,
            btl.x, btl.y, btl.z,
            btl.x, btl.y, btl.z,
            ftr.x, ftr.y, ftr.z,
            btr.x, btr.y, btr.z,

            //bottom
            bbl.x, bbl.y, bbl.z,
            bbr.x, bbr.y, bbr.z,
            fbl.x, fbl.y, fbl.z,
            fbl.x, fbl.y, fbl.z,
            bbr.x, bbr.y, bbr.z,
            fbr.x, fbr.y, fbr.z
        ]);

        let uvs = new Float32Array([
            //front
            0, 0,
            1, 0,
            0, 1,
            0, 1,
            1, 0,
            1, 1,

            //right
            0, 0,
            1, 0,
            0, 1,
            0, 1,
            1, 0,
            1, 1,

            //back
            0, 0,
            1, 0,
            0, 1,
            0, 1,
            1, 0,
            1, 1,

            //left
            0, 0,
            1, 0,
            0, 1,
            0, 1,
            1, 0,
            1, 1,

            //top
            0, 0,
            1, 0,
            0, 1,
            0, 1,
            1, 0,
            1, 1,

            //bottom
            0, 0,
            1, 0,
            0, 1,
            0, 1,
            1, 0,
            1, 1
        ]);

        let normals = new Float32Array([
            // front
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,

            // right
            1, 0, 0,
            1, 0, 0,
            1, 0, 0,
            1, 0, 0,
            1, 0, 0,
            1, 0, 0,

            // back
            0, 0, -1,
            0, 0, -1,
            0, 0, -1,
            0, 0, -1,
            0, 0, -1,
            0, 0, -1,

            // left
            -1, 0, 0,
            -1, 0, 0,
            -1, 0, 0,
            -1, 0, 0,
            -1, 0, 0,
            -1, 0, 0,

            // top
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,

            // bottom
            0, -1, 0,
            0, -1, 0,
            0, -1, 0,
            0, -1, 0,
            0, -1, 0,
            0, -1, 0
        ]);

        return {
            positions,
            normals,
            uvs
        };

    }
}

export default Utils;
