import { getGPUTier } from 'detect-gpu';

import CubesProgramModel from "./webgl/CubesProgramModel";
const program = CubesProgramModel.create();

// no needs to track CPU on web because of security reasons
// https://stackoverflow.com/questions/9530680/javascript-dynamically-monitor-cpu-memory-usage
$(document).ready(() => {
    const fpsElem = $('#fps');
    const gpuModelElem = $('#gpu-model');
    const heapModelElem = $('#heap-memory');
    const gpuElem = $('#gpu');

    const canvas = document.querySelector('#webgl-canvas');

    (async () => {
        const gpuTier = await getGPUTier();
        gpuModelElem.text(gpuTier.gpu);

        await program.init(canvas);
        // console.log(program.getGpuInfo());
        requestAnimationFrame(loop);
    })();

    let then = 0;
    const maxHeap = performance.memory.jsHeapSizeLimit / Math.pow(1000, 2);
    const loop = (now) => {
        now *= 0.001;                          // convert to seconds
        const deltaTime = now - then;

        then = now;
        const fps = 1 / deltaTime;             // compute frames per second
        fpsElem.text(fps.toFixed(1));
        heapModelElem.text(`${performance.memory.usedJSHeapSize / Math.pow(1000, 2)} MB out of ${maxHeap} MB`);

        //if (fps > 15) {
            program.draw();
            requestAnimationFrame(loop);
        //}
    }
});