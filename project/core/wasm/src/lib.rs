mod utils;

extern crate serde_json;

use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;

use nalgebra as na;
use web_sys::WebGlRenderingContext as GL;
use web_sys::*;

use crate::model::{*};
use crate::model::common::obj_file_data_to_vertex_vector_data;

use wasm_bindgen::__rt::WasmRefCell;
use rand::Rng;

extern crate console_error_panic_hook;

mod model;

#[macro_use]
extern crate serde_derive;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
extern {
    fn alert(s: &str);
}

#[wasm_bindgen]
pub fn greet() {
    alert("Hello, md!");
}

#[wasm_bindgen]
extern "C" {
    // Use `js_namespace` here to bind `console.log(..)` instead of just
    // `log(..)`
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[export_name = "get_info"]
pub extern "C" fn __wasm_bindgen_generated_Context_get_info(me: u32) -> SceneInfo {
    let me = me as *mut WasmRefCell<Context>;
    wasm_bindgen::__rt::assert_not_null(me);
    let me = unsafe { &*me };
    return me.borrow().get_info();
}

// Wrap web-sys console log function in a println! style macro
macro_rules! log {
    ( $( $t:tt )* ) => {
        log(&format!( $( $t )* ));
    }
}

#[wasm_bindgen]
pub struct SceneInit {
    canvas_id: String,
    obj_file_data: String,
    shaders: JsShaders,
    textures_images: Vec<JsTextureImage>,
    render_params: JsRenderParams,
}

#[wasm_bindgen]
impl SceneInit {
    pub fn new(
        canvas_id: &str,
        obj_file_data: &str,
        js_shaders: &JsValue,
        js_textures_images: &JsValue,
        js_render_params: &JsValue
    ) -> Self {
        // console_error_panic_hook::set_once();
        // log(format!("{:?}", render_params).as_ref());

        let shaders: JsShaders = js_shaders.into_serde().unwrap();
        let textures_images: Vec<JsTextureImage> = js_textures_images.into_serde().unwrap();
        let render_params: JsRenderParams = js_render_params.into_serde().unwrap();

        Self { canvas_id: canvas_id.to_string(), obj_file_data: obj_file_data.to_string(), shaders, textures_images, render_params }
    }
}

#[wasm_bindgen]
pub struct SceneInfo {
    triangles: i32,
    vertex_count: i32
}

#[wasm_bindgen]
impl SceneInfo {

    pub fn new(triangles: i32, vertex_count: i32) -> Self {
        Self {triangles, vertex_count}
    }

    pub fn get_triangles(&self) -> i32 {
        self.triangles
    }

    pub fn get_vertex_count(&self) -> i32 {
        self.vertex_count
    }

}

#[wasm_bindgen]
pub struct Context {
    canvas: HtmlCanvasElement,
    obj: Geometry,
    gl: WebGlRenderingContext,
    default_pipeline: model::DefaultPipeline,
    nodes: Vec<model::Node>,
    textures: Vec<Texture>,
    triangles: i32,
    vertex_count: i32,
    render_params: JsRenderParams
}

#[wasm_bindgen]
impl Context {

    pub fn new(scene_init: SceneInit) -> Result<Context, JsValue> {

        let canvas = get_canvas(scene_init.canvas_id.as_ref())?;
        let gl = get_gl_context(&canvas)?;

        let obj_data = obj_file_data_to_vertex_vector_data(scene_init.obj_file_data.as_ref());
        let obj = Geometry::new(
            obj_data.0, obj_data.1, obj_data.2,
            obj_data.3, obj_data.4, obj_data.5
        );
        let triangles = obj.triangles;
        let vertex_count = obj.vertex_count;

        let default_pipeline = create_default_program(&gl, scene_init.shaders);

        let mut nodes = vec![];

        let mut obj_node = model::Node::new(model::Primitive::new(gl.clone(), &obj));
        let init_pos = scene_init.render_params.init_pos.as_ref();
        obj_node.set_x_y_z(init_pos[0], init_pos[1], init_pos[2]);
        nodes.push(obj_node);

        let mut textures = vec![];

        for (i, jti) in scene_init.textures_images.iter().enumerate() {
            let image = Image::from_png(jti.data.as_ref());
            textures.push(Texture::from_image(gl.clone(), &image,  texture::TEXTURE_IDS[i], jti.id.as_ref()));
        }

        // Set graphics state
        gl.enable(GL::DEPTH_TEST);
        gl.depth_func(GL::LEQUAL);
        gl.enable(GL::CULL_FACE);
        gl.blend_func(GL::SRC_ALPHA, GL::ONE_MINUS_SRC_ALPHA);

        default_pipeline.program.bind();

        let ret = Context {
            canvas,
            obj,
            gl,
            default_pipeline,
            nodes,
            textures,
            triangles,
            vertex_count,
            render_params: scene_init.render_params
        };

        Ok(ret)
    }

    pub fn get_info(&self) -> SceneInfo {
        SceneInfo::new(self.triangles, self.vertex_count)
    }

    pub fn get_context(&self) -> WebGlRenderingContext {
        self.gl.to_owned()
    }

    /// Draws the scene
    pub fn draw(&mut self, t: f32) -> Result<(), JsValue> {
        // Perspective
        let width = self.canvas.width() as f32;
        let height = self.canvas.height() as f32;
        let perspective = na::Perspective3::new(width / height, 45.0 * 3.14 / 180.0, 0.1, 100.0);
        self.gl.uniform_matrix4fv_with_f32_array(
            self.default_pipeline.perspective_loc.as_ref(),
            false,
            perspective.to_homogeneous().as_slice(),
        );

        // Textures
        for (i, t) in self.textures.iter().enumerate() {
            t.bind_self();
            self.gl.uniform1i(self.default_pipeline.get_extra_uniform(t.uniform_key.as_ref()).as_ref(), i as i32);
        }

        self.gl.clear_color(0.0, 0.0, 0.0, 1.0);
        self.gl.clear(GL::COLOR_BUFFER_BIT);
        self.gl.clear(GL::DEPTH_BUFFER_BIT);

        let c = t.cos();
        let s = t.sin();

        // Draw all nodes
        for node in self.nodes.iter_mut() {
            node.rotate_model(c, s);

            self.default_pipeline.bind(&node.primitive);

            self.gl.uniform_matrix4fv_with_f32_array(
                self.default_pipeline.model_view_loc.as_ref(),
                false,
                &node.model,
            );

            node.primitive.draw();
        }

        let render_params = &self.render_params;

        // add new object
        if render_params.multiple {
            let triangles = self.obj.triangles;
            let vertex_count = self.obj.vertex_count;

            let mut rng = rand::thread_rng();

            let mut obj_node = model::Node::new(model::Primitive::new(self.gl.clone(), &self.obj));

            obj_node.set_x_y_z(
                rng.gen_range(render_params.min_max_x[0], render_params.min_max_x[1]),
                rng.gen_range(render_params.min_max_y[0], render_params.min_max_y[1]),
                rng.gen_range(render_params.min_max_z[0], render_params.min_max_z[1]),
            );
            self.nodes.push(obj_node);

            self.triangles += triangles;
            self.vertex_count += vertex_count;
        }

        Ok(())
    }
}

fn create_default_program(gl: &WebGlRenderingContext, shaders: JsShaders) -> DefaultPipeline {
    DefaultPipeline::new(gl, shaders.vert_str.as_str(), shaders.frag_str.as_str())
}

fn get_gl_context(canvas: &HtmlCanvasElement) -> Result<GL, JsValue> {
    Ok(canvas.get_context("webgl")?.unwrap().dyn_into::<GL>()?)
}

/// Returns a WebGL Context
fn get_canvas(id: &str) -> Result<HtmlCanvasElement, JsValue> {
    utils::set_panic_hook();

    let doc = window().unwrap().document().unwrap();
    let canvas = doc
        .get_element_by_id(id)
        .expect(&format!("Failed to get canvas: {}", id));
    let canvas: HtmlCanvasElement = canvas.dyn_into::<HtmlCanvasElement>()?;

    Ok(canvas)
}