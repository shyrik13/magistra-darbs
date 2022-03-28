import * as wasmOpenGL from "wasm-opengl";
import Tracker from "./tracker";
import GLBench from "./lib/gl-bench";
import {SceneInit} from "wasm-opengl";
import Utils from "./Utils";
import {errorFinish, finish} from "./resultModal";

var program = null;

const tracker = Tracker.create();
const TEST_TIME = 60; // 1 min
const ALTERNATIVE = 'wasm-opengl';

const selector = {
    agent: $('#agent'),
    fps: $('#fps'),
    gpuModel: $('#gpu-model'),
    heap: $('#heap-memory'),
    cpu: $('#cpu'),
    sceneVertex: $('#scene-vertex'),
    sceneTriangles: $('#scene-triangles'),
    btnMultipleObjects: $('#btn-multiple-objects'),
    btnLargeObject: $('#btn-large-object'),
    timeLeft: $('#time-left'),
};

let bench;
let start;

$(selector.btnMultipleObjects).on('click', () => {
    const initParams = {
        init_pos: [-20.0, 20.0, -50.0],
        min_max_x: [-20.0, 20.0],
        min_max_y: [-20.0, 20.0],
        min_max_z: [-80.0, -50.0],
        multiple: true
    };

    startTest('cube', initParams, 'Multiple Objects Rendering');
});

$(selector.btnLargeObject).on('click', () => {
    const initParams = {
        init_pos: [0.0, 0.0, -70.0],
        min_max_x: [-20.0, 20.0],
        min_max_y: [-20.0, 20.0],
        min_max_z: [-80.0, -50.0],
        multiple: false
    };

    startTest('skull', initParams, 'Large Object Rendering');
});

// no needs to track CPU on web because of security reasons
// https://stackoverflow.com/questions/9530680/javascript-dynamically-monitor-cpu-memory-usage
$(document).ready(() => {
    (async () => {
        const gpuTier = await tracker.getGpuTier();
        selector.gpuModel.text(gpuTier.gpu);
        selector.agent.text(tracker.getAgent());
    })();
});

function startTest(objName, initParams, name) {

    (async () => {
        let initStart = Date.now();
        tracker.init(ALTERNATIVE, name);

        let source = await fetch(`build/resources/obj/${objName}.obj`);
        let obj_data = await source.text();

        let vsSource = await fetch('build/resources/shader/obj.vert.glsl');
        vsSource = await vsSource.text();

        let fsSource = await fetch('build/resources/shader/obj.frag.glsl');
        fsSource = await fsSource.text();

        const images = await Utils.loadTextureImageUint8ArrayBuffers([
            {id: 'tex_diffuse', url: `build/resources/images/${objName}-diffuse.png`},
            {id: 'tex_norm', url: `build/resources/images/${objName}-normal.png`},
        ]);

        const shaders = {
            vert_str: vsSource,
            frag_str: fsSource,
        };

        let scene = SceneInit.new("rust-gl", obj_data, shaders, images, initParams);

        program = wasmOpenGL.Context.new(scene);

        bench = new GLBench(program.get_context(), {
            withoutUI: true,
            trackGPU: false,
            // chartHz: 5,
            // chartLen: 5,
            paramLogger: (i, cpu, gpu, mem, fps, totalTime, frameId, sceneInfo) => {
                cpu = +(cpu * 0.27).toFixed(0);
                fps = +fps.toFixed(0);
                mem = +mem.toFixed(8);

                tracker.pushHistory(cpu, fps, mem, sceneInfo.vertex, sceneInfo.triangles);

                selector.cpu.text(`${cpu}/100 accumulation`);
                selector.fps.text(fps);
                selector.heap.text(`${mem} MB`);
                selector.sceneVertex.text(sceneInfo.vertex);
                selector.sceneTriangles.text(sceneInfo.triangles);
                selector.timeLeft.text(`${(TEST_TIME - sceneInfo.diff).toFixed(0)} sec`);
            },
            chartLogger: (i, chart, circularId) => {
                // console.log('chart circular buffer=', chart)
            },
        });

        start = Date.now();
        tracker.storeInitTime(initStart);
        requestAnimationFrame(loop);
    })().catch(e => {
        errorFinish(e, bench);
    });

    let time = 0;

    // const maxHeap = performance.memory.jsHeapSizeLimit / Math.pow(1000, 2);
    const loop = (now) => {
        bench.begin();
        program.draw(time += 0.01);
        bench.end();

        let diff = (Date.now() - start) / 1000;

        let info = {
            triangles : program.get_info().get_triangles(),
            vertex: program.get_info().get_vertex_count(),
            diff: diff,
        };

        bench.nextFrame(now, info);

        if (diff <= TEST_TIME) {
            requestAnimationFrame(loop);
        }
        else {
            finish(bench);
        }
    }
}