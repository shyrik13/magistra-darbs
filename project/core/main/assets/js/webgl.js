import GLBench from "./lib/gl-bench";

import CubesProgramModel from "./webgl/CubesProgramModel";
import {getGpuTier, getAgent} from './tracker.js';

const program = CubesProgramModel.create();

// no needs to track CPU on web because of security reasons
// https://stackoverflow.com/questions/9530680/javascript-dynamically-monitor-cpu-memory-usage
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

    const canvas = document.querySelector('#webgl-canvas');

    let bench;

    (async () => {
        const gpuTier = await getGpuTier();
        selector.gpuModel.text(gpuTier.gpu);
        selector.agent.text(getAgent());

        await program.init(canvas);

        bench = new GLBench(program.getContext(), {
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
        bench.nextFrame(now, program.getSceneInfo());
        requestAnimationFrame(loop);
    }
});