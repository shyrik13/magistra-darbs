import GLBench from "./lib/gl-bench";

import CubesProgramModel from "./webgl/CubesProgramModel";
import Tracker from './tracker.js';
import {errorFinish, finish} from "./resultModal";

const program = CubesProgramModel.create();
const tracker = Tracker.create();
const TEST_TIME_60 = 60; // 1 min
const TEST_TIME_20 = 20; // 20 sec
const ALTERNATIVE = 'webgl';

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
    loader: $('#loader'),
    deviceType: $('#device-type'),
};

let bench;
let start;
let canvas;

$(selector.btnMultipleObjects).on('click', () => {
    const initParams = {
        init_pos: {x: -20.0, y: 20.0, z: -50.0},
        min_max_x: {min: -20.0, max: 20.0},
        min_max_y: {min: -20.0, max: 20.0},
        min_max_z: {min: -80.0, max: -50.0},
        multiple: true
    };

    startTest('cube', initParams, 'Multiple Objects Rendering', TEST_TIME_60);
});

$(selector.btnLargeObject).on('click', () => {
    const initParams = {
        init_pos: {x: 0.0, y: 0.0, z: -70.0},
        min_max_x: {min: -20.0, max: 20.0},
        min_max_y: {min: -20.0, max: 20.0},
        min_max_z: {min: -80.0, max: -50.0},
        multiple: false
    };

    startTest('skull', initParams, 'Large Object Rendering', TEST_TIME_20);
});

// no needs to track CPU on web because of security reasons
// https://stackoverflow.com/questions/9530680/javascript-dynamically-monitor-cpu-memory-usage
$(document).ready(() => {
    canvas = document.querySelector('#webgl-canvas');

    (async () => {
        const gpuTier = await tracker.getGpuTier();
        selector.gpuModel.text(gpuTier.gpu);
        selector.agent.text(tracker.getAgent());
        selector.deviceType.text(tracker.getDeviceType());
    })();
});

function startTest(objName, initParams, name, testTime) {

    (async () => {
        selector.loader.show();
        $('#webgl-canvas').hide();
        selector.btnMultipleObjects.hide();
        selector.btnLargeObject.hide();

        let initStart = Date.now();
        tracker.init(ALTERNATIVE, name);

        let source = await fetch(`build/resources/obj/${objName}.obj`);
        let obj_data = await source.text();

        let vsSource = await fetch('build/resources/shader/obj.vert.glsl');
        vsSource = await vsSource.text();

        let fsSource = await fetch('build/resources/shader/obj.frag.glsl');
        fsSource = await fsSource.text();

        const images = [
            {id: 'tex_diffuse', url: `build/resources/images/${objName}-diffuse.png`},
            {id: 'tex_norm', url: `build/resources/images/${objName}-normal.png`},
        ];

        const shaders = {
            vert_str: vsSource,
            frag_str: fsSource,
        };

        await program.init(canvas, obj_data, shaders, images, initParams);

        bench = new GLBench(program.getContext(), {
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
                selector.timeLeft.text(`${(testTime - sceneInfo.diff).toFixed(0)} sec`);
            },
            chartLogger: (i, chart, circularId) => {
                // console.log('chart circular buffer=', chart)
            },
        });

        selector.loader.hide();
        $('#webgl-canvas').show();

        start = Date.now();
        tracker.storeInitTime(initStart);
        requestAnimationFrame(loop);
    })().catch(e => {
        selector.loader.hide();
        $('#webgl-canvas').show();

        console.log(e);

        errorFinish(e, bench);
        program.finish();
    });

    let time = 0;
    const loop = (now) => {
        bench.begin();
        program.draw(time += 0.01);
        bench.end();

        let diff = (Date.now() - start) / 1000;
        let info = program.getSceneInfo();
        info.diff = diff;

        bench.nextFrame(now, info);

        if (diff <= testTime) {
            requestAnimationFrame(loop);
        }
        else {
            finish(bench);
            program.finish();
        }
    }
}