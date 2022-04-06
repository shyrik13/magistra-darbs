import init, {draw, getContext, getSceneInfo, testFinish} from './webgpu/main';
import Tracker from "./tracker";
import GLBench from "./lib/gl-bench";
import {errorFinish, finish} from "./resultModal";

const tracker = Tracker.create();
const TEST_TIME_60 = 60; // 1 min
const TEST_TIME_20 = 20; // 20 sec
const ALTERNATIVE = 'webgpu';

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
let connectionLostError = false;

$(selector.btnMultipleObjects).on('click', () => {
    const initParams = {
        init_pos: {x: -20.0, y: 18.0, z: -50.0},
        min_max_x: {min: -20.0, max: 20.0},
        min_max_y: {min: -18.0, max: 18.0},
        min_max_z: {min: -80.0, max: -50.0},
        multiple: true
    };

    startTest('cube', initParams, 'Multiple Objects Rendering', TEST_TIME_60);
});

$(selector.btnLargeObject).on('click', () => {
    const initParams = {
        init_pos: {x: 0.0, y: 0.0, z: -50.0},
        min_max_x: {min: -20.0, max: 20.0},
        min_max_y: {min: -18.0, max: 18.0},
        min_max_z: {min: -80.0, max: -50.0},
        multiple: false
    };

    startTest('skull', initParams, 'Large Object Rendering', TEST_TIME_20);
});

// no needs to track CPU on web because of security reasons
// https://stackoverflow.com/questions/9530680/javascript-dynamically-monitor-cpu-memory-usage
$(document).ready(() => {
    canvas = canvas = document.querySelector('#webgpu-canvas');

    (async () => {
        const gpuTier = await tracker.getGpuTier();
        selector.gpuModel.text(gpuTier.gpu);
        selector.agent.text(tracker.getAgent());
        selector.deviceType.text(tracker.getDeviceType());
    })();
});

function startTest(objName, initParams, name, testTime) {

    const setConnectionLostError = (e) => {
        connectionLostError = e;
    };

    (async () => {
        selector.loader.show();
        $('#webgpu-canvas').hide();
        selector.btnMultipleObjects.hide();
        selector.btnLargeObject.hide();

        let initStart = Date.now();
        tracker.init(ALTERNATIVE, name);

        let source = await fetch(`build/resources/obj/${objName}.obj`);
        let obj_data = await source.text();

        let vsSource = await fetch('build/resources/shader/obj.vert.wgsl');
        vsSource = await vsSource.text();

        let fsSource = await fetch('build/resources/shader/obj.frag.wgsl');
        fsSource = await fsSource.text();

        const images = {
            diffuse_url: `build/resources/images/${objName}-diffuse.png`,
            normal_url: `build/resources/images/${objName}-normal.png`,
        };

        const shaders = {
            vert_str: vsSource,
            frag_str: fsSource,
        };

        await init(canvas, obj_data, shaders, images, initParams, setConnectionLostError);

        bench = new GLBench(getContext(), {
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
        $('#webgpu-canvas').show();

        start = Date.now();
        tracker.storeInitTime(initStart);
        requestAnimationFrame(loop);
    })().catch((e) => {
        selector.loader.hide();
        $('#webgpu-canvas').show();

        console.error(e);

        errorFinish(e, bench);
        testFinish();
    });

    const loop = (now) => {
        bench.begin();
        draw();
        bench.end();

        let diff = (Date.now() - start) / 1000;
        let info = getSceneInfo();
        info.diff = diff;

        bench.nextFrame(now, info);

        if (diff <= testTime && !connectionLostError) {
            requestAnimationFrame(loop);
        }
        else if (connectionLostError) {
            errorFinish(connectionLostError, bench);
            testFinish();
        }
        else {
            finish(bench);
            testFinish();
        }
    }
}