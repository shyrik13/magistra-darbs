import * as wasmOpenGL from "wasm-opengl";

var teaser_ctx = null;

const tick_teaser = () => {
    teaser_ctx.draw();
    requestAnimationFrame(tick_teaser);
}

function start() {
    if (teaser_ctx == null) {
        teaser_ctx = wasmOpenGL.Context.new();
    }
    requestAnimationFrame(tick_teaser);
}

start();

console.log("OpenGL");