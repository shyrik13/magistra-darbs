import {mat3, mat4} from 'gl-matrix';
import Utils from "../Utils";

let program = {
    context: null,
    rotation: [0, 0, 0],
    device: null,
    pipeline: null,
    renderPassDescription: null,
    math: {
        translateMat: mat4.create(),
        rotateXMat: mat4.create(),
        rotateYMat: mat4.create(),
        rotateZMat: mat4.create(),
        scaleMat: mat4.create(),
    },
    initParams: null,
    dataObj: null,
    sampler: null,
    textureDiff: null,
    textureNorm: null,
    sceneUniformBindGroupLayout: null,
    buffers: null,
    staticUniforms: {
        viewProjectionMatrix: null,
        eyePosition: null,
        lightPosition: null
    },
    count: 0,
    offset: 256,
    vertexUniformSize: 192,
    fragmentUniformSize: 32,
    triangles: 0,
    vertex: 0,
};

let objects = [];

export default async function init(canvas, objData, shaders, images, initParams) {

    if (!navigator.gpu) {
        document.body.innerHTML = `
            <h1>WebGPU not supported!</h1>
            <div>
                WebGPU is currently only supported in Chrome Canary, Edge Canary
                with the flag "enable-unsafe-webgpu" enabled.
                
                WebGPU is currently only supported in Firefox Nightly
                with the “dom.webgpu.enabled = true” preference set.
            </div>
            <div>
                See the <a href="https://github.com/gpuweb/gpuweb/wiki/Implementation-Status">Implementation Status</a> page for more details.
            </div>
        `;

        throw new Error("WebGPU not supported");
    }

    let textureDiffDataCanvas = document.createElement("canvas");
    let textureDiffDataCtx = textureDiffDataCanvas.getContext("2d");

    let textureNormDataCanvas = document.createElement("canvas");
    let textureNormDataCtx = textureNormDataCanvas.getContext("2d");

    //////////////////////////////////////////
    // Set up WebGPU adapter
    // to compile GLSL to SPIR-V, load
    // texture image
    //////////////////////////////////////////

    const imgDiff = document.createElement("img");
    const imgNorm = document.createElement("img");
    imgDiff.src = images.diffuse_url;
    imgNorm.src = images.normal_url;

    const [adapter] = await Promise.all([
        navigator.gpu.requestAdapter(),
        imgDiff.decode(),
        imgNorm.decode()
    ]);

    ////////////////////////////////////
    // Set up device and canvas context
    ////////////////////////////////////

    program.device = await adapter.requestDevice();

    // canvas.width = window.innerWidth;
    // canvas.height = window.innerHeight;

    program.context = canvas.getContext("webgpu");
    const presentationFormat = program.context.getPreferredFormat(adapter);
    program.context.configure({
        device: program.device,
        format: presentationFormat
    });

    /////////////////////////////////////////
    // Create texture, sampler and load data
    /////////////////////////////////////////

    program.sampler = program.device.createSampler({
        minFilter: "linear",
        magFilter: "linear"
    });

    program.textureDiff = program.device.createTexture({
        size: [imgDiff.width, imgDiff.height, 1],
        format: "rgba8unorm",
        usage: GPUTextureUsage.SAMPLED | GPUTextureUsage.COPY_DST | GPUTextureUsage.TEXTURE_BINDING
    });

    program.textureNorm = program.device.createTexture({
        size: [imgNorm.width, imgNorm.height, 1],
        format: "rgba8unorm",
        usage: GPUTextureUsage.SAMPLED | GPUTextureUsage.COPY_DST | GPUTextureUsage.TEXTURE_BINDING
    });

    const textureDiffData = Utils.getImageData(imgDiff, textureDiffDataCanvas, textureDiffDataCtx);
    const textureNormData = Utils.getImageData(imgNorm, textureNormDataCanvas, textureNormDataCtx);

    if (typeof program.device.queue.writeTexture === "function") {
        // Diff texture
        program.device.queue.writeTexture(
            { texture: program.textureDiff },
            textureDiffData,
            { bytesPerRow: imgDiff.width * 4 },
            [
                imgDiff.width,
                imgDiff.height,
                1
            ]
        );

        // Norm texture
        program.device.queue.writeTexture(
            { texture: program.textureNorm },
            textureNormData,
            { bytesPerRow: imgNorm.width * 4 },
            [
                imgNorm.width,
                imgNorm.height,
                1
            ]
        );
    } else {
        // Diff texture
        // NOTE: Fallback until Queue.writeTexture is implemented.
        const textureDiffDataBuffer = program.device.createBuffer({
            size: textureDiffData.byteLength,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
        });

        program.device.queue.writeBuffer(textureDiffDataBuffer, 0, textureDiffData);

        const textureDiffLoadEncoder = program.device.createCommandEncoder();
        textureDiffLoadEncoder.copyBufferToTexture({
            buffer: textureDiffDataBuffer,
            bytesPerRow: imgDiff.width * 4,
            imageHeight: imgDiff.height
        }, {
            texture: program.textureDiff,
        }, [
            imgDiff.width,
            imgDiff.height,
            1
        ]);

        program.device.queue.submit([textureDiffLoadEncoder.finish()]);

        // Norm texture
        // NOTE: Fallback until Queue.writeTexture is implemented.
        const textureNormDataBuffer = program.device.createBuffer({
            size: textureNormData.byteLength,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
        });

        program.device.queue.writeBuffer(textureNormDataBuffer, 0, textureNormData);

        const textureNormLoadEncoder = program.device.createCommandEncoder();
        textureNormLoadEncoder.copyBufferToTexture({
            buffer: textureNormDataBuffer,
            bytesPerRow: imgNorm.width * 4,
            imageHeight: imgNorm.height
        }, {
            texture: program.textureNorm,
        }, [
            imgNorm.width,
            imgNorm.height,
            1
        ]);

        program.device.queue.submit([textureNormLoadEncoder.finish()]);
    }

    program.sceneUniformBindGroupLayout = program.device.createBindGroupLayout({
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.VERTEX,
                buffer: {
                    type: "uniform"
                }
            },
            {
                binding: 1,
                visibility: GPUShaderStage.FRAGMENT,
                buffer: {
                    type: "uniform"
                }
            },
            {
                binding: 2,
                visibility: GPUShaderStage.FRAGMENT,
                sampler: {
                    type: "filtering"
                }
            },
            {
                binding: 3,
                visibility: GPUShaderStage.FRAGMENT,
                texture: {
                    sampleType: "float"
                }
            },
            {
                binding: 4,
                visibility: GPUShaderStage.FRAGMENT,
                texture: {
                    sampleType: "float"
                }
            }
        ]
    });

    /////////////////
    // Uniform data
    /////////////////

    const eyePosition = new Float32Array([0, 0, 0]);
    const lightPosition = new Float32Array([-1, 1, 0]);

    const projectionMatrix = mat4.create();
    const viewMatrix = mat4.create();

    const viewProjectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, Utils.degsToRads(45.0), canvas.width / canvas.height, 0.1, 100.0)
    mat4.lookAt(viewMatrix, eyePosition, [0, 0, 0], [0, 1, 0]);
    mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix);

    program.staticUniforms.eyePosition = eyePosition;
    program.staticUniforms.lightPosition = lightPosition;
    program.staticUniforms.viewProjectionMatrix = viewProjectionMatrix;

    ////////////////////////////////////////
    // Create vertex buffers and load data
    ////////////////////////////////////////

    program.dataObj = await Utils.createObjectFromFile(objData, true);
    program.buffers = bindBuffers(program.dataObj);

    program.triangles += program.dataObj.triangles;
    program.vertex += program.dataObj.vertexCount;

    let obj = {
        pos: { x: -20, y: 18, z: -50 },
        vertexCount: program.dataObj.vertexCount,
        uniformBuffers: bindUniformBuffers(),
        sceneUniformBindGroup: null
    };
    obj.sceneUniformBindGroup = bindGroup(obj.uniformBuffers.vertexUniformBuffer, obj.uniformBuffers.fragmentUniformBuffer);

    objects.push(obj);
    program.count++;

    ///////////////////////////
    // Create render pipeline
    ///////////////////////////

    program.pipeline = program.device.createRenderPipeline({
        layout: program.device.createPipelineLayout({bindGroupLayouts: [program.sceneUniformBindGroupLayout]}),
        vertex: {
            module: program.device.createShaderModule({
                code: shaders.vert_str
            }),
            entryPoint: "main",
            buffers: [
                {
                    arrayStride: 12,
                    attributes: [{
                        shaderLocation: 0,
                        format: "float32x3",
                        offset: 0
                    }]
                },
                {
                    arrayStride: 12,
                    attributes: [{
                        shaderLocation: 1,
                        format: "float32x3",
                        offset: 0
                    }]
                },
                {
                    arrayStride: 8,
                    attributes: [{
                        shaderLocation: 2,
                        format: "float32x2",
                        offset: 0
                    }]
                }
            ]
        },
        fragment: {
            module: program.device.createShaderModule({
                code: shaders.frag_str
            }),
            entryPoint: "main",
            targets: [{
                format: presentationFormat
            }]
        },
        primitive: {
            topology: "triangle-list",
        },
        depthStencil: {
            format: "depth24plus",
            depthWriteEnabled: true,
            depthCompare: "less"
        }
    });

    ///////////////////////////
    // Render pass description
    ///////////////////////////

    const depthTexture = program.device.createTexture({
        size: [canvas.width, canvas.height, 1],
        format: "depth24plus",
        usage:  GPUTextureUsage.RENDER_ATTACHMENT
    })

    program.renderPassDescription = {
        colorAttachments: [{
            view: program.context.getCurrentTexture().createView(),
            loadValue: [0, 0, 0, 1]
        }],
        depthStencilAttachment: {
            view: depthTexture.createView(),
            depthLoadValue: 1,
            depthStoreOp: "store",
            stencilLoadValue: 0,
            stencilStoreOp: "store"
        }
    };

    program.initParams = initParams;
}

export function getContext() {
    return program.context;
}

export function getSceneInfo() {
    return {
        triangles: program.triangles,
        vertex: program.vertex,
        count: program.count,
    }
}

export function draw() {

    program.rotation[0] += 0.01;
    program.rotation[2] += 0.005;

    program.renderPassDescription.colorAttachments[0].view = program.context.getCurrentTexture().createView();

    const commandEncoder = program.device.createCommandEncoder();
    const renderPass = commandEncoder.beginRenderPass(program.renderPassDescription);

    renderPass.setPipeline(program.pipeline);

    // First argument here refers to array index
    // in pipeline vertexState.vertexBuffers
    renderPass.setVertexBuffer(0, program.buffers.positionBuffer);
    renderPass.setVertexBuffer(1, program.buffers.normalBuffer);
    renderPass.setVertexBuffer(2, program.buffers.uvBuffer);

    for (let i = 0; i < objects.length; i++) {
        const obj = objects[i];
        const modelMatrix = mat4.create();

        Utils.xformMatrix(
            modelMatrix, [obj.pos.x, obj.pos.y, obj.pos.z], program.rotation, null,
            program.math.translateMat, program.math.rotateXMat, program.math.rotateYMat,
            program.math.rotateZMat, program.math.scaleMat
        );

        // in wgsl inverse function is not implemented yet
        let normalModelMatrix3x3 = mat3.create();
        mat3.normalFromMat4(normalModelMatrix3x3, modelMatrix);
        let normalModelMatrix4x4 = mat4.create();
        mat4.fromValues(
            normalModelMatrix3x3[0][0], normalModelMatrix3x3[0][1], normalModelMatrix3x3[0][2], 0,
            normalModelMatrix3x3[1][0], normalModelMatrix3x3[1][1], normalModelMatrix3x3[1][2], 0,
            normalModelMatrix3x3[2][0], normalModelMatrix3x3[2][1], normalModelMatrix3x3[2][2], 0,
            0, 0, 0, 1
        );

        program.device.queue.writeBuffer(obj.uniformBuffers.vertexUniformBuffer, 128, normalModelMatrix4x4);
        program.device.queue.writeBuffer(obj.uniformBuffers.vertexUniformBuffer, 0, modelMatrix);
    }

    for (let obj of objects) {
        renderPass.setBindGroup(0, obj.sceneUniformBindGroup);
        renderPass.draw(obj.vertexCount, 1, 0, 0);
    }

    renderPass.endPass();
    program.device.queue.submit([commandEncoder.finish()]);

    if (program.initParams.multiple) {
        let obj = {
            pos: {
                x: Utils.getRandomIntInclusive(program.initParams.min_max_x.min * 100, program.initParams.min_max_x.max * 100),
                y: Utils.getRandomIntInclusive(program.initParams.min_max_y.min * 100, program.initParams.min_max_y.max * 100),
                z: Utils.getRandomIntInclusive(program.initParams.min_max_z.min * 100, program.initParams.min_max_z.max * 100)
            },
            vertexCount: program.dataObj.vertexCount,
            uniformBuffers: bindUniformBuffers(),
            sceneUniformBindGroup: null
        };

        obj.sceneUniformBindGroup = bindGroup(obj.uniformBuffers.vertexUniformBuffer, obj.uniformBuffers.fragmentUniformBuffer);

        objects.push(obj);

        program.triangles += program.dataObj.triangles;
        program.vertex += program.dataObj.vertexCount;

        program.count++;
    }
}

function bindBuffers(dataObj) {
    const positionBuffer = program.device.createBuffer({
        size: dataObj.positions.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });
    const normalBuffer = program.device.createBuffer({
        size: dataObj.normals.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });
    const uvBuffer = program.device.createBuffer({
        size: dataObj.uvs.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });

    program.device.queue.writeBuffer(positionBuffer, 0, dataObj.positions);
    program.device.queue.writeBuffer(normalBuffer, 0, dataObj.normals);
    program.device.queue.writeBuffer(uvBuffer, 0, dataObj.uvs);

    return {
        positionBuffer: positionBuffer,
        normalBuffer: normalBuffer,
        uvBuffer: uvBuffer,
    }
}

function bindGroup(vertexUniformBuffer, fragmentUniformBuffer) {

    program.device.queue.writeBuffer(vertexUniformBuffer, 64, program.staticUniforms.viewProjectionMatrix);
    program.device.queue.writeBuffer(fragmentUniformBuffer, 0, program.staticUniforms.eyePosition);
    program.device.queue.writeBuffer(fragmentUniformBuffer, 16, program.staticUniforms.lightPosition);

    return program.device.createBindGroup({
        layout: program.sceneUniformBindGroupLayout,
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: vertexUniformBuffer
                }
            },
            {
                binding: 1,
                resource: {
                    buffer: fragmentUniformBuffer
                }
            },
            {
                binding: 2,
                resource: program.sampler
            },
            {
                binding: 3,
                resource: program.textureDiff.createView()
            },
            {
                binding: 4,
                resource: program.textureNorm.createView()
            }
        ]
    });
}

function bindUniformBuffers() {
    let vertexUniformBuffer = program.device.createBuffer({
        // size: program.offset + program.vertexUniformSize, // modelViewMatrix | inverse modelViewMatrix | viewProjectionMatrix
        size: program.vertexUniformSize,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    let fragmentUniformBuffer = program.device.createBuffer({
        // size: program.offset + program.fragmentUniformSize,
        size: program.fragmentUniformSize,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    return {
        vertexUniformBuffer: vertexUniformBuffer,
        fragmentUniformBuffer: fragmentUniformBuffer
    }
}