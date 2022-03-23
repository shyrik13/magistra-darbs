import * as wasmOpenGL from "wasm-opengl";
import {getAgent, getGpuTier} from "./tracker";
import GLBench from "./lib/gl-bench";
import {SceneInit} from "wasm-opengl";
import Utils from "./Utils";

var program = null;

$(document).ready(() => {
    const selector = {
        agent: $('#agent'),
        fps: $('#fps'),
        gpuModel: $('#gpu-model'),
        heap: $('#heap-memory'),
        gpu: $('#gpu'),
        cpu: $('#cpu'),
        sceneVertex: $('#scene-vertex'),
        sceneTriangles: $('#scene-triangles'),
    };

    let bench;

    (async () => {
        const gpuTier = await getGpuTier();
        selector.gpuModel.text(gpuTier.gpu);
        selector.agent.text(getAgent());

        let source = await fetch('build/resources/obj/cube.obj');
        let obj_data = await source.text();

        let vsSource = await fetch('build/resources/shader/obj.vert.glsl');
        vsSource = await vsSource.text();

        let fsSource = await fetch('build/resources/shader/obj.frag.glsl');
        fsSource = await fsSource.text();

        const images = await Utils.loadTextureImageUint8ArrayBuffers([
            {id: 'tex_diffuse', url: 'build/resources/images/cube-diffuse.png'},
            {id: 'tex_norm', url: 'build/resources/images/cube-normal.png'},
        ]);

        const shaders = {
            vert_str: vsSource,
            frag_str: fsSource,
        };

        const initParams = {
            init_pos: [-20.0, 20.0, -50.0],
            min_max_x: [-20.0, 20.0],
            min_max_y: [-20.0, 20.0],
            min_max_z: [-80.0, -50.0],
            multiple: true
        };

        let scene = SceneInit.new("rust-gl", obj_data, shaders, images, initParams);

        program = wasmOpenGL.Context.new(scene);

        bench = new GLBench(program.get_context(), {
            withoutUI: true,
            trackGPU: false,
            // chartHz: 5,
            // chartLen: 5,
            paramLogger: (i, cpu, gpu, mem, fps, totalTime, frameId, sceneInfo) => {
                selector.cpu.text(`${cpu.toFixed(2)} %`);
                selector.gpu.text(`${gpu.toFixed(2)} %`);
                selector.fps.text(fps.toFixed(1));
                selector.heap.text(`${mem.toFixed(8)} MB`);
                selector.sceneVertex.text(sceneInfo.vertex);
                selector.sceneTriangles.text(sceneInfo.triangles);
            },
            chartLogger: (i, chart, circularId) => {
                // console.log('chart circular buffer=', chart)
            },
        });

        requestAnimationFrame(loop);
    })();

    // TODO: measures https://developer.mozilla.org/en-US/docs/Web/API/Performance/measure

    let time = 0;

    // const maxHeap = performance.memory.jsHeapSizeLimit / Math.pow(1000, 2);
    const loop = (now) => {
        bench.begin();
        program.draw(time += 0.01);
        bench.end();
        bench.nextFrame(now, {
            triangles : program.get_info().get_triangles(),
            vertex: program.get_info().get_vertex_count(),
        });
        requestAnimationFrame(loop);
    }
});

console.log("OpenGL");