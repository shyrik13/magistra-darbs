'use strict';

import {mat4} from 'gl-matrix';

/**
 * @singleton - use create method to get instance.
 */
class CubesProgramModel {

    static _instance;

    cubes = [];
    vertices = 0;

    gl = undefined;
    programInfo = undefined;
    buffers = undefined;

    colorShiftUniformLocation = undefined;
    colorShift = [0.5, 0.5, 0.5];

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

    async init(canvas) {
        this.gl = canvas.getContext('webgl');

        // If we don't have a GL context, give up now

        if (!this.gl) {
            alert('Unable to initialize WebGL. Your browser or machine may not support it.');
            return;
        }

        // Vertex shader program
        let vsSource = await fetch('build/shader/triangle.vert.glsl'); //fs.readFileSync("", "utf-8");
        vsSource = await vsSource.text();

        // Fragment shader program
        let fsSource = await fetch('build/shader/triangle.frag.glsl'); //fs.readFileSync("./shader/triangle.frag.glsl", "utf-8");
        fsSource = await fsSource.text();

        // Initialize a shader program; this is where all the lighting
        // for the vertices and so forth is established.
        const shaderProgram = this.initShaderProgram(this.gl, vsSource, fsSource);

        // Collect all the info needed to use the shader program.
        // Look up which attribute our shader program is using
        // for aVertexPosition and look up uniform locations.
        this.programInfo = {
            program: shaderProgram,
            attribLocations: {
                vertPosition: this.gl.getAttribLocation(shaderProgram, 'vertPosition'),
                vertColor: this.gl.getAttribLocation(shaderProgram, 'vertColor'),
            },
            uniformLocations: {
                //projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
                //modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
                colorShift: this.gl.getUniformLocation(shaderProgram, 'colorShift'),
            },
        };

        // Here's where we call the routine that builds all the
        // objects we'll be drawing.
        this.cubes.push({
            buffers: this.initBuffers(this.gl)
        });
        this.vertices++;

        this.bindScene(this.gl, this.programInfo, this.buffers);
    }

    getSceneInfo() {
        return {
            vertices: this.vertices,
            points: this.vertices * 3,
        }
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

    draw() {
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.clear(this.gl.DEPTH_BUFFER_BIT | this.gl.COLOR_BUFFER_BIT);

        for (let idx in this.colorShift) {

            if (this.colorShift[idx] === 1.0) {
                this.colorShift[idx] -= 0.01;
            }
            else if (this.colorShift[idx] === 0.0) {
                this.colorShift[idx] += 0.01;
            }
            else {
                this.colorShift[idx] += Math.random() >= 0.5 ? 0.01 : -0.01;
            }
        }

        for (let idx in this.cubes) {
            this.bindTriangle(this.gl, this.programInfo, this.cubes[idx].buffers);

            const offset = 0;
            const vertexCount = 3;
            this.gl.drawArrays(this.gl.TRIANGLE_STRIP, offset, vertexCount);
        }

        this.cubes.push({
            buffers: this.initBuffers(this.gl)
        });
        this.vertices++;
    }

    initBuffers(gl) {
        // XYZ
        var triangleVertices = [
            0.0, 0.5, 0.0,
            -0.5, -0.5, 0.0,
            0.5, -0.5, 0.0
        ];

        // RGB
        var triangleColor = [
            1.0, 1.0, 0.0,
            0.7, 0.0, 1.0,
            0.1, 1.0, 0.6
        ];

        const triangleVertexBufferObject = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexBufferObject);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.STATIC_DRAW);

        const triangleColorBufferObject = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, triangleColorBufferObject);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleColor), gl.STATIC_DRAW);

        return {
            position: triangleVertexBufferObject,
            color: triangleColorBufferObject,
        };
    }

    bindScene(gl, programInfo) {
        gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
        gl.clearDepth(1.0);                 // Clear everything
        gl.enable(gl.DEPTH_TEST);           // Enable depth testing
        gl.depthFunc(gl.LEQUAL);            // Near things obscure far things
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(programInfo.program);
    }

    // TODO: make list of normal mapped cubes
    bindTriangle(gl, programInfo, buffers) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertPosition,
            3,
            gl.FLOAT,
            false,
            3 * Float32Array.BYTES_PER_ELEMENT,
            0);

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertColor, // Attribute location
            3, // Number of elements per attribute
            gl.FLOAT, // Type of elements
            false,
            3 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
            0 // Offset from the beginning of a single vertex to this attribute
        );

        gl.enableVertexAttribArray(programInfo.attribLocations.vertPosition);
        gl.enableVertexAttribArray(programInfo.attribLocations.vertColor);

        this.colorShiftUniformLocation = gl.getUniformLocation(programInfo.program, 'colorShift');

        gl.uniform3fv(this.colorShiftUniformLocation, this.colorShift);
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