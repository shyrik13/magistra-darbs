import * as wasmOpenGL from "wasm-opengl";

import TrianglesProgramModel from "./webgl/TrianglesProgramModel";
const program = TrianglesProgramModel.create();

$(document).ready(() => {
    const fpsElem = document.querySelector("#fps");
    const canvas = document.querySelector('#webgl-canvas');

    (async () => {
        await program.init(canvas);
        requestAnimationFrame(loop);
    })();

    let then = 0;
    const loop = (now) => {
        now *= 0.001;                          // convert to seconds
        const deltaTime = now - then;          // compute time since last frame
        then = now;                            // remember time for next frame
        const fps = 1 / deltaTime;             // compute frames per second
        fpsElem.textContent = fps.toFixed(1);  // update fps display

        program.draw();
        requestAnimationFrame(loop);
    }
});