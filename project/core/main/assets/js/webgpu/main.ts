import {mat4} from 'gl-matrix';
import Utils from "../Utils";


export default async function init() {

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

    let textureDataCanvas = document.createElement("canvas");
    let textureDataCtx = textureDataCanvas.getContext("2d");

    //////////////////////////////////////////
    // Set up WebGPU adapter
    // to compile GLSL to SPIR-V, load
    // texture image
    //////////////////////////////////////////

    const img = document.createElement("img");
    img.src = "build/resources/images/cube-diffuse.png";

    const [adapter] = await Promise.all([
        navigator.gpu.requestAdapter(),
        img.decode()
    ]);

    ////////////////////////////////////
    // Set up device and canvas context
    ////////////////////////////////////

    const device = await adapter.requestDevice();

    const canvas = document.getElementById("webgpu-canvas");
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

    const texture = device.createTexture({
        size: [img.width, img.height, 1],
        format: "rgba8unorm",
        usage: GPUTextureUsage.SAMPLED | GPUTextureUsage.COPY_DST | GPUTextureUsage.TEXTURE_BINDING
    });

    const textureData = Utils.getImageData(img, textureDataCanvas, textureDataCtx);

    if (typeof device.queue.writeTexture === "function") {
        device.queue.writeTexture(
            { texture },
            textureData,
            { bytesPerRow: img.width * 4 },
            [
                img.width,
                img.height,
                1
            ]
        );
    } else {
        // NOTE: Fallback until Queue.writeTexture is implemented.
        const textureDataBuffer = device.createBuffer({
            size: textureData.byteLength,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
        });

        device.queue.writeBuffer(textureDataBuffer, 0, textureData);

        const textureLoadEncoder = device.createCommandEncoder();
        textureLoadEncoder.copyBufferToTexture({
            buffer: textureDataBuffer,
            bytesPerRow: img.width * 4,
            imageHeight: img.height
        }, {
            texture,
        }, [
            img.width,
            img.height,
            1
        ]);

        device.queue.submit([textureLoadEncoder.finish()]);
    }

    ////////////////////////////////////////
    // Create vertex buffers and load data
    ////////////////////////////////////////

    const cubeData = Utils.createCube();
    const numVertices = cubeData.positions.length / 3;

    const positionBuffer = device.createBuffer({
        size: cubeData.positions.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });
    const normalBuffer = device.createBuffer({
        size: cubeData.normals.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });
    const uvBuffer = device.createBuffer({
        size: cubeData.uvs.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });

    device.queue.writeBuffer(positionBuffer, 0, cubeData.positions);
    device.queue.writeBuffer(normalBuffer, 0, cubeData.normals);
    device.queue.writeBuffer(uvBuffer, 0, cubeData.uvs);

    /////////////////
    // Uniform data
    /////////////////

    const eyePosition = new Float32Array([1, 1, 1]);
    const lightPosition = new Float32Array([1, 1, 1]);

    const projectionMatrix = mat4.create();
    const viewMatrix = mat4.create();
    const modelMatrix = mat4.create();
    const viewProjectionMatrix = mat4.create();
    const mvpMatrix = mat4.create();
    const rotation = [0, 0, 0];

    mat4.perspective(projectionMatrix, Math.PI / 2, canvas.width / canvas.height, 0.1, 10.0)
    mat4.lookAt(viewMatrix, [1, 1, 1], [0, 0, 0], [0, 1, 0]);
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
                resource: texture.createView()
            }

        ]
    });

    ///////////////////////////
    // Create render pipeline
    ///////////////////////////
    const vs = `
        struct Uniforms {
        worldMatrix : mat4x4<f32>;
        viewProjectionMatrix : mat4x4<f32>;
        };
        [[binding(0), group(0)]] var<uniform> uniforms : Uniforms;
        
        struct Output {
        [[builtin(position)]] Position : vec4<f32>;
        [[location(0)]] vPosition : vec3<f32>;
        [[location(1)]] vNormal : vec3<f32>;
        [[location(2)]] vUV : vec2<f32>;
        };
        
        [[stage(vertex)]]
        fn main([[location(0)]] position: vec4<f32>, [[location(1)]] normal: vec3<f32>, [[location(2)]] uv: vec2<f32>) -> Output {
        var output: Output;
        
        let worldPosition:vec4<f32> = uniforms.worldMatrix * position;
        output.vPosition = worldPosition.xyz;
        let v4Normal:vec4<f32> = vec4<f32>(normal.x, normal.y, normal.z, 1.);
        output.vNormal = vec4<f32>(uniforms.worldMatrix * v4Normal).xyz;
        output.vUV = uv;
        output.Position = uniforms.viewProjectionMatrix * worldPosition;
        
        return output;
        }
    `.trim();

    const fs = `
        struct Uniforms {
            eyePosition : vec4<f32>;
            lightPosition : vec4<f32>;
        };
        [[binding(1), group(0)]] var<uniform> uniforms : Uniforms;
        [[binding(2), group(0)]] var textureSampler : sampler;
        [[binding(3), group(0)]] var textureData : texture_2d<f32>;
        
        struct Input {
            [[location(0)]] vPosition : vec3<f32>;
            [[location(1)]] vNormal : vec3<f32>;
            [[location(2)]] vUV : vec2<f32>;
        };
        
        [[stage(fragment)]]
        fn main(input: Input) -> [[location(0)]] vec4<f32> {
            let surfaceColor:vec3<f32> = (textureSample(textureData, textureSampler, input.vUV)).rgb;
            let normal:vec3<f32> = normalize(input.vNormal);
            let eyeVec:vec3<f32> = normalize(uniforms.eyePosition.xyz - input.vPosition);
            let incidentVec:vec3<f32> = normalize(input.vPosition - uniforms.lightPosition.xyz);
            let lightVec:vec3<f32> = -incidentVec;
            let diffuse:f32 = max(dot(lightVec, normal), 0.0);
            let highlight:f32 = pow(max(dot(eyeVec, reflect(incidentVec, normal)), 0.0), 100.0);
            let ambient:f32 = 0.1;
            return vec4<f32>(surfaceColor * (diffuse + highlight + ambient), 1.0);
        }
    `.trim();

    const pipeline = device.createRenderPipeline({
        layout: device.createPipelineLayout({bindGroupLayouts: [sceneUniformBindGroupLayout]}),
        vertex: {
            module: device.createShaderModule({
                code: vs
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
                code: fs
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
        Utils.xformMatrix(modelMatrix, null, rotation, null, translateMat, rotateXMat, rotateYMat, rotateZMat, scaleMat);

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