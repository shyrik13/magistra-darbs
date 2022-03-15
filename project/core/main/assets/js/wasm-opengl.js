import * as wasmOpenGL from "wasm-opengl";

var teaser_ctx = null;

const tick_teaser = () => {
    teaser_ctx.draw();
    requestAnimationFrame(tick_teaser);
}

async function start() {
    if (teaser_ctx == null) {
        let source = await fetch('build/resources/obj/cube.obj');
        let obj_data = await source.text();

        teaser_ctx = wasmOpenGL.Context.new("rust-gl", obj_data);
        console.log(teaser_ctx);
    }
    //requestAnimationFrame(tick_teaser);
}

start();

console.log("OpenGL");