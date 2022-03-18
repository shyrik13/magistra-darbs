'use strict';

import {mat4} from 'gl-matrix';
import Utils from "../Utils";

/**
 * @singleton - use create method to get instance.
 */
class CubesProgramModel {

    static _instance;

    uLight = [0.0, 0.4, 5.7];

    cubes = [];
    triangles = 0;
    vertex = 0;

    objVertex = 0;
    objTriangles = 0;
    cubeObj = {};
    textures = [];

    TEXTURE_IDS = [];

    initParams = {};

    gl = undefined;
    programInfo = undefined;
    buffers = undefined;

    /**
     * @private
     */
    constructor() {}

    /**
     * https://stackoverflow.com/questions/12669615/add-created-at-and-updated-at-fields-to-mongoose-schemas#answer-15147350
     * !!! timestamps are in UTC, after fetching it will be server timezone.
     * { versionKey: false } - because multiple php processes can use this model.
     * @return {CubesProgramModel}
     */
    static create() {
        if (this._instance) {return this._instance;}
        this._instance = new this();

        return this._instance;
    }

    async init(canvas, objData, shaders, imagesData, initParams) {
        this.gl = canvas.getContext('webgl');

        // If we don't have a GL context, give up now
        if (!this.gl) {
            alert('Unable to initialize WebGL. Your browser or machine may not support it.');
            return;
        }

        this.cubeObj = await Utils.createObjectFromFile(objData);
        this.objTriangles = this.cubeObj.triangles;
        this.objVertex = this.cubeObj.vertexCount;

        // Initialize a shader program; this is where all the lighting
        // for the vertices and so forth is established.
        const shaderProgram = this.initShaderProgram(this.gl, shaders.vert_str, shaders.frag_str);

        // Collect all the info needed to use the shader program.
        // Look up which attribute our shader program is using
        // for aVertexPosition and look up uniform locations.
        this.programInfo = {
            program: shaderProgram,
            attribLocations: {
                vPosition: this.gl.getAttribLocation(shaderProgram, 'vert_pos'),
                vTang: this.gl.getAttribLocation(shaderProgram, 'vert_tang'),
                vBitang: this.gl.getAttribLocation(shaderProgram, 'vert_bitang'),
                vTexCoors: this.gl.getAttribLocation(shaderProgram, 'vert_uv'),
                // vNormal: this.gl.getAttribLocation(shaderProgram, 'vert_normal'),
            },
            uniformLocations: {
                perspectiveId: this.gl.getUniformLocation(shaderProgram, 'perspective'),
                modelViewId: this.gl.getUniformLocation(shaderProgram, 'model_view'),
                extraUniforms: {}
            },
        };

        const images = await Utils.loadImages(imagesData);

        this.bindScene(this.gl, this.programInfo);
        this.initTextures(this.gl, images);

        // Here's where we call the routine that builds all the
        // objects we'll be drawing.
        this.cubes.push({
            buffers: this.initBuffers(this.gl),
            pos: initParams.init_pos,
            vertexCount: this.cubeObj.vertexCount,
        });
        this.triangles += this.objTriangles;
        this.vertex += this.objVertex;

        this.initParams = initParams;
    }

    getSceneInfo() {
        return {
            triangles: this.triangles,
            vertex: this.vertex,
        }
    }

    getContext() {
        return this.gl;
    }

    getGpuInfo() {
        var unMaskedInfo = {
            renderer: '',
            vendor: ''
        };

        var dbgRenderInfo = this.gl.getExtension("WEBGL_debug_renderer_info");
        if (dbgRenderInfo != null) {
            unMaskedInfo.renderer = this.gl.getParameter(dbgRenderInfo.UNMASKED_RENDERER_WEBGL);
            unMaskedInfo.vendor = this.gl.getParameter(dbgRenderInfo.UNMASKED_VENDOR_WEBGL);
        }

        return {
            renderer: this.gl.getParameter(this.gl.RENDERER),
            vendor: this.gl.getParameter(this.gl.VENDOR),
            rendererInfo: unMaskedInfo.renderer,
            vendorInfo: unMaskedInfo.vendor,
        };
    }

    draw(time) {
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.clear(this.gl.DEPTH_BUFFER_BIT | this.gl.COLOR_BUFFER_BIT);

        for (let idx in this.cubes) {
            let obj = this.cubes[idx];
            let model = Utils.rotationModelXYZ(time, obj.pos.x, obj.pos.y, obj.pos.z);
            this.bindObj(this.gl, this.programInfo, obj.buffers, model);

            this.gl.drawArrays(this.gl.TRIANGLES, 0, obj.vertexCount);
        }

        if (this.initParams.multiple) {
            this.cubes.push({
                buffers: this.initBuffers(this.gl),
                // Utils.getRandomIntInclusive(-2000, 2000) => min -20, max 20
                pos: {
                    x: Utils.getRandomIntInclusive(this.initParams.min_max_x.min * 100, this.initParams.min_max_x.max * 100),
                    y: Utils.getRandomIntInclusive(this.initParams.min_max_y.min * 100, this.initParams.min_max_y.max * 100),
                    z: Utils.getRandomIntInclusive(this.initParams.min_max_z.min * 100, this.initParams.min_max_z.max * 100)
                },
                vertexCount: this.cubeObj.vertexCount
            });
            this.triangles += this.objTriangles;
            this.vertex += this.objVertex;
        }
    }

    initTextures(gl, images = []) {
        this.TEXTURE_IDS = [gl.TEXTURE0, gl.TEXTURE1];

        // TEXTURES
        this.textures = [];
        for (let i = 0; i < images.length; i++) {
            let texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);

            // Set the parameters so we can render any size image.
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

            // Upload the image into the texture.
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, images[i].data);

            // add the texture to the array of textures.
            this.textures.push({id: images[i].id, texture: texture});
        }
    }

    initBuffers(gl) {
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.cubeObj.vertices), gl.STATIC_DRAW);

        const uvsBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, uvsBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.cubeObj.uvs), gl.STATIC_DRAW);

        const tangBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, tangBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.cubeObj.tangents), gl.STATIC_DRAW);

        const bitangBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bitangBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.cubeObj.bitangents), gl.STATIC_DRAW);

        // const normalsBuffer = gl.createBuffer();
        // gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer);
        // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.cubeObj.normals), gl.STATIC_DRAW);

        return {
            positions: positionBuffer,
            uvs: uvsBuffer,
            tangents: tangBuffer,
            bitangents: bitangBuffer,
            // normals: normalsBuffer,
        };
    }

    bindScene(gl, programInfo) {
        gl.clearColor(1.0, 1.0, 1.0, 1.0);
        gl.clearDepth(1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.enable(gl.CULL_FACE);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(programInfo.program);

        gl.enableVertexAttribArray(programInfo.attribLocations.vPosition);
        gl.enableVertexAttribArray(programInfo.attribLocations.vTexCoors);
        gl.enableVertexAttribArray(programInfo.attribLocations.vTang);
        gl.enableVertexAttribArray(programInfo.attribLocations.vBitang);
        // gl.enableVertexAttribArray(programInfo.attribLocations.vNormal);
    }

    bindObj(gl, programInfo, buffers, model) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.positions);
        gl.vertexAttribPointer(
            programInfo.attribLocations.vPosition, 3, gl.FLOAT, false, 0, 0
        );

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.uvs);
        gl.vertexAttribPointer(
            programInfo.attribLocations.vTexCoors, 2, gl.FLOAT, false, 0, 0
        );

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.tangents);
        gl.vertexAttribPointer(
            programInfo.attribLocations.vTang, 3, gl.FLOAT, false, 0, 0
        );

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.bitangents);
        gl.vertexAttribPointer(
            programInfo.attribLocations.vBitang, 3, gl.FLOAT, false, 0, 0
        );

        // gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normals);
        // gl.vertexAttribPointer(
        //     programInfo.attribLocations.vNormal, 3, gl.FLOAT, false, 0, 0
        // );

        // console.log(model);
        gl.uniformMatrix4fv(this.programInfo.uniformLocations.modelViewId, false, model);
        // gl.uniformMatrix4fv(this.programInfo.uniformLocations.modelNormMapId, false, Utils.mtx_transpose(Utils.mtx_inverse(model)));
        //
        // let a = Utils.mtx_perspective(45, 680.0/382.0, 0.1, 100.0);
        // gl.uniformMatrix4fv(this.programInfo.uniformLocations.modelProjMapId, false, Utils.mtx_mul(a, model));

        const projMatrix = mat4.identity(mat4.create());
        mat4.perspective(projMatrix, Utils.degsToRads(45.0), 4/3, 0.1, 100.0);
        gl.uniformMatrix4fv(this.programInfo.uniformLocations.perspectiveId, false, projMatrix);

        // activate textures
        for (let tid in this.textures) {
            if (!this.textures[tid].id in this.programInfo.uniformLocations.extraUniforms) {
                this.programInfo.uniformLocations.extraUniforms[this.textures[tid].id] =
                    this.gl.getUniformLocation(this.programInfo.program, this.textures[tid].id)
            }

            gl.activeTexture(this.TEXTURE_IDS[tid]);
            gl.bindTexture(gl.TEXTURE_2D, this.textures[tid].texture);
            gl.uniform1i(this.programInfo.uniformLocations.extraUniforms[this.textures[tid].id], tid);
        }
    }

    initShaderProgram(gl, vsSource, fsSource) {
        const vertexShader = this.loadShader(gl, gl.VERTEX_SHADER, vsSource);
        const fragmentShader = this.loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

        // Create the shader program

        const shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);

        // If creating the shader program failed, alert

        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
            return null;
        }

        return shaderProgram;
    }

    loadShader(gl, type, source) {
        const shader = gl.createShader(type);

        // Send the source to the shader object

        gl.shaderSource(shader, source);

        // Compile the shader program

        gl.compileShader(shader);

        // See if it compiled successfully

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    }
}

export default CubesProgramModel;