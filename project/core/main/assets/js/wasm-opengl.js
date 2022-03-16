import * as wasmOpenGL from "wasm-opengl";
import {getAgent, getGpuTier} from "./tracker";
import GLBench from "./lib/gl-bench";

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

        program = wasmOpenGL.Context.new("rust-gl", obj_data);
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