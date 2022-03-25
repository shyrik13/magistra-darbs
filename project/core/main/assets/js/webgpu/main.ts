import {mat4} from 'gl-matrix';
import Utils from "../Utils";

let objects = [];

export default async function init(canvas, objData, shaders, images, initParams) {

    let translateMat = mat4.create();
    let rotateXMat = mat4.create();
    let rotateYMat = mat4.create();
    let rotateZMat = mat4.create();
    let scaleMat = mat4.create();

    if (!navigator.gpu) {
        document.body.innerHTML = `
                    <h1>WebGPU not supported!</h1>
                    <div>
                        SPIR-V WebGPU is currently only supported in <a href="https://www.google.com/chrome/canary/">Chrome Canary</a>
                        with the flag "enable-unsafe-webgpu" enabled.
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

    const device = await adapter.requestDevice();

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const context = canvas.getContext("webgpu");
    const presentationFormat = context.getPreferredFormat(adapter);
    context.configure({
        device,
        format: presentationFormat
    });

    /////////////////////////////////////////
    // Create texture, sampler and load data
    /////////////////////////////////////////

    const sampler = device.createSampler({
        minFilter: "linear",
        magFilter: "linear"
    });

    const textureDiff = device.createTexture({
        size: [imgDiff.width, imgDiff.height, 1],
        format: "rgba8unorm",
        usage: GPUTextureUsage.SAMPLED | GPUTextureUsage.COPY_DST | GPUTextureUsage.TEXTURE_BINDING
    });

    const textureNorm = device.createTexture({
        size: [imgNorm.width, imgNorm.height, 1],
        format: "rgba8unorm",
        usage: GPUTextureUsage.SAMPLED | GPUTextureUsage.COPY_DST | GPUTextureUsage.TEXTURE_BINDING
    });

    const textureDiffData = Utils.getImageData(imgDiff, textureDiffDataCanvas, textureDiffDataCtx);
    const textureNormData = Utils.getImageData(imgNorm, textureNormDataCanvas, textureNormDataCtx);

    if (typeof device.queue.writeTexture === "function") {
        // Diff texture
        device.queue.writeTexture(
            { texture: textureDiff },
            textureDiffData,
            { bytesPerRow: imgDiff.width * 4 },
            [
                imgDiff.width,
                imgDiff.height,
                1
            ]
        );

        // Norm texture
        device.queue.writeTexture(
            { texture: textureNorm },
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
        const textureDiffDataBuffer = device.createBuffer({
            size: textureDiffData.byteLength,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
        });

        device.queue.writeBuffer(textureDiffDataBuffer, 0, textureDiffData);

        const textureDiffLoadEncoder = device.createCommandEncoder();
        textureDiffLoadEncoder.copyBufferToTexture({
            buffer: textureDiffDataBuffer,
            bytesPerRow: imgDiff.width * 4,
            imageHeight: imgDiff.height
        }, {
            textureDiff,
        }, [
            imgDiff.width,
            imgDiff.height,
            1
        ]);

        device.queue.submit([textureDiffLoadEncoder.finish()]);

        // Norm texture
        // NOTE: Fallback until Queue.writeTexture is implemented.
        const textureNormDataBuffer = device.createBuffer({
            size: textureNormData.byteLength,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
        });

        device.queue.writeBuffer(textureNormDataBuffer, 0, textureNormData);

        const textureNormLoadEncoder = device.createCommandEncoder();
        textureNormLoadEncoder.copyBufferToTexture({
            buffer: textureNormDataBuffer,
            bytesPerRow: imgNorm.width * 4,
            imageHeight: imgNorm.height
        }, {
            textureNorm,
        }, [
            imgNorm.width,
            imgNorm.height,
            1
        ]);

        device.queue.submit([textureNormLoadEncoder.finish()]);
    }

    ////////////////////////////////////////
    // Create vertex buffers and load data
    ////////////////////////////////////////

    const dataObj = await Utils.createObjectFromFile(objData, true);

    const numVertices = dataObj.vertexCount;

    const positionBuffer = device.createBuffer({
        size: dataObj.positions.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });
    const normalBuffer = device.createBuffer({
        size: dataObj.normals.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });
    const uvBuffer = device.createBuffer({
        size: dataObj.uvs.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });

    device.queue.writeBuffer(positionBuffer, 0, dataObj.positions);
    device.queue.writeBuffer(normalBuffer, 0, dataObj.normals);
    device.queue.writeBuffer(uvBuffer, 0, dataObj.uvs);

    /////////////////
    // Uniform data
    /////////////////

    const eyePosition = new Float32Array([0, 0, 0]);
    const lightPosition = new Float32Array([-1, 1, 0]);

    const projectionMatrix = mat4.create();
    const viewMatrix = mat4.create();
    const modelMatrix = mat4.create();

    const viewProjectionMatrix = mat4.create();
    const mvpMatrix = mat4.create();
    const rotation = [0, 0, 0];
    mat4.perspective(projectionMatrix, Utils.degsToRads(45.0), canvas.width / canvas.height, 0.1, 100.0)
    mat4.lookAt(viewMatrix, eyePosition, [0, 0, 0], [0, 1, 0]);
    mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix);

    /////////////////////////////////////////////
    // Create uniform buffers and binding layout
    /////////////////////////////////////////////

    const vertexUniformBuffer = device.createBuffer({
        size: 128,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    const fragmentUniformBuffer = device.createBuffer({
        size: 32,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    device.queue.writeBuffer(vertexUniformBuffer, 64, viewProjectionMatrix);
    device.queue.writeBuffer(fragmentUniformBuffer, 0, eyePosition);
    device.queue.writeBuffer(fragmentUniformBuffer, 16, lightPosition);

    const sceneUniformBindGroupLayout = device.createBindGroupLayout({
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

    const sceneUniformBindGroup = device.createBindGroup({
        layout: sceneUniformBindGroupLayout,
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
                resource: sampler
            },
            {
                binding: 3,
                resource: textureDiff.createView()
            },
            {
                binding: 4,
                resource: textureNorm.createView()
            }

        ]
    });

    ///////////////////////////
    // Create render pipeline
    ///////////////////////////

    const pipeline = device.createRenderPipeline({
        layout: device.createPipelineLayout({bindGroupLayouts: [sceneUniformBindGroupLayout]}),
        vertex: {
            module: device.createShaderModule({
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
            module: device.createShaderModule({
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

    const depthTexture = device.createTexture({
        size: [canvas.width, canvas.height, 1],
        format: "depth24plus",
        usage:  GPUTextureUsage.RENDER_ATTACHMENT
    })

    const renderPassDescription = {
        colorAttachments: [{
            view: context.getCurrentTexture().createView(),
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

    requestAnimationFrame(function draw() {
        /////////////////////////
        // Update uniform buffer
        /////////////////////////

        rotation[0] += 0.01;
        rotation[2] += 0.005;

        Utils.xformMatrix(modelMatrix, [0, 0, -10], rotation, null, translateMat, rotateXMat, rotateYMat, rotateZMat, scaleMat);

        device.queue.writeBuffer(vertexUniformBuffer, 0, modelMatrix);

        ////////////////////
        // Swap framebuffer
        ////////////////////

        renderPassDescription.colorAttachments[0].view = context.getCurrentTexture().createView();

        const commandEncoder = device.createCommandEncoder();
        const renderPass = commandEncoder.beginRenderPass(renderPassDescription);

        renderPass.setPipeline(pipeline);

        // First argument here refers to array index
        // in pipeline vertexState.vertexBuffers
        renderPass.setVertexBuffer(0, positionBuffer);
        renderPass.setVertexBuffer(1, normalBuffer);
        renderPass.setVertexBuffer(2, uvBuffer);

        // First argument here refers to array index
        // in pipeline layout.bindGroupLayouts
        renderPass.setBindGroup(0, sceneUniformBindGroup);

        renderPass.draw(numVertices, 1, 0, 0);
        renderPass.endPass();

        device.queue.submit([commandEncoder.finish()]);

        requestAnimationFrame(draw);
    });
}