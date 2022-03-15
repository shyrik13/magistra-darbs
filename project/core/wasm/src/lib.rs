mod utils;

use std::{cell::RefCell, rc::Rc};
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;

use na::{Isometry3, Point3, Translation3, UnitQuaternion, Vector2, Vector3};
use nalgebra as na;
use web_sys::WebGlRenderingContext as GL;
use web_sys::*;

use crate::model::{*};
use crate::model::common::obj_file_data_to_vertex_vector_data;

mod model;

// use crate::model::read::read_into_vertex_vector;

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

// Wrap web-sys console log function in a println! style macro
macro_rules! log {
    ( $( $t:tt )* ) => {
        log(&format!( $( $t )* ));
    }
}

#[wasm_bindgen]
pub struct Context {
    performance: web_sys::Performance,
    canvas: HtmlCanvasElement,
    obj: Geometry<Vertex>,
    gl: WebGlRenderingContext,
    default_pipeline: model::DefaultPipeline,
    nodes: Vec<model::Node>,
    textures: Vec<Texture>,
    // gui: Rc<RefCell<Gui>>,
}

#[wasm_bindgen]
impl Context {

    // fn draw_node(&self, now: f32, node: &model::Node, parent_trs: &Isometry3<f32>) {
    //     node.primitive.bind();
    //     self.default_pipeline.bind_attribs();
    //
    //     let transform = parent_trs * node.transform;
    //
    //     self.gl.uniform_matrix4fv_with_f32_array(
    //         self.default_pipeline.transform_loc.as_ref(),
    //         false,
    //         transform.to_homogeneous().as_slice(),
    //     );
    //
    //     let normal_transform = transform.inverse().to_homogeneous().transpose();
    //     self.gl.uniform_matrix4fv_with_f32_array(
    //         self.default_pipeline.normal_transform_loc.as_ref(),
    //         false,
    //         normal_transform.as_slice(),
    //     );
    //
    //     node.primitive.draw();
    //
    //     for child in &node.children {
    //         self.draw_node(now, child, &transform);
    //     }
    // }

    pub fn new(canvas_id: &str, obj_file_data: &str) -> Result<Context, JsValue> {
        let window = web_sys::window().unwrap();
        let performance = window.performance().unwrap();

        let canvas = get_canvas(canvas_id)?;
        let gl = get_gl_context(&canvas)?;

        let obj_data = obj_file_data_to_vertex_vector_data(obj_file_data);
        let obj = Geometry::new(obj_data.0, obj_data.1, obj_data.2);

        let default_pipeline = create_default_program(&gl);

        let mut nodes = vec![];

        let mut root = model::Node::new(model::Primitive::new(gl.clone(), &obj));
        root.transform
            .append_translation_mut(&Translation3::new(0.0, 0.0, 0.0));

        nodes.push(root);

        let image_diffuse = Image::from_png(include_bytes!("../res/images/cube-diffuse.png"));
        let image_normal = Image::from_png(include_bytes!("../res/images/cube-normal.png"));
        // log(&*format!("{:?} {:?}", image_diffuse.data.len() as u32, image_diffuse.width * image_diffuse.height * 4));
        // log(&*format!("{:?} {:?}", image_diffuse.width, image_diffuse.height));

        // log(&*format!("{:?} {:?}", image_normal.data.len() as u32, image_normal.width * image_normal.height * 4));
        // log(&*format!("{:?} {:?}", image_normal.width, image_normal.height));

        let textures = vec![
            Texture::from_image(gl.clone(), &image_diffuse),
            Texture::from_image(gl.clone(), &image_normal),
        ];

        // @todo Extract to function: Create GUI
        // let gui = Gui::new(&gl, canvas.width(), canvas.height());

        let ret = Context {
            performance,
            canvas,
            obj,
            gl,
            default_pipeline,
            nodes,
            textures,

            // gui: Rc::new(RefCell::new(gui)),
        };

        Ok(ret)
    }

    //// Draws the scene
    // pub fn draw(&self) -> Result<(), JsValue> {
    //
    //     // Set graphics state
    //     self.gl.enable(GL::DEPTH_TEST);
    //     self.gl.depthFunc(GL::LEQUAL);
    //     self.gl.enable(GL::CULL_FACE);
    //     self.gl.blend_func(GL::SRC_ALPHA, GL::ONE_MINUS_SRC_ALPHA);
    //
    //     self.default_pipeline.program.bind();
    //
    //     // View
    //     let view_loc = self.default_pipeline.program.get_uniform_loc("view");
    //
    //     self.gl.uniform_matrix4fv_with_f32_array(
    //         view_loc.as_ref(),
    //         false,
    //         self.view.borrow().to_homogeneous().as_slice(),
    //     );
    //
    //     // Proj
    //     let proj_loc = self.default_pipeline.program.get_uniform_loc("proj");
    //
    //     let width = self.canvas.width() as f32;
    //     let height = self.canvas.height() as f32;
    //     let proj = nalgebra::Perspective3::new(width / height, 3.14 / 4.0, 0.125, 256.0);
    //     self.gl.uniform_matrix4fv_with_f32_array(
    //         proj_loc.as_ref(),
    //         false,
    //         proj.to_homogeneous().as_slice(),
    //     );
    //
    //     // Lighting
    //     let light_color_loc = self.default_pipeline.program.get_uniform_loc("light_color");
    //     self.gl.uniform3f(light_color_loc.as_ref(), 1.0, 1.0, 1.0);
    //
    //     let light_position_loc = self
    //         .default_pipeline
    //         .program
    //         .get_uniform_loc("light_position");
    //     self.gl
    //         .uniform3f(light_position_loc.as_ref(), 4.0, 1.0, 1.0);
    //
    //     // Texture
    //     self.texture.bind();
    //     let sampler_loc = self.default_pipeline.program.get_uniform_loc("tex_sampler");
    //     self.gl.uniform1i(sampler_loc.as_ref(), 0);
    //
    //     self.gl.clear_color(1.0, 1.0, 1.0, 1.0);
    //     self.gl.clear(GL::COLOR_BUFFER_BIT);
    //     self.gl.clear(GL::DEPTH_BUFFER_BIT);
    //
    //     // Time
    //     let now = self.performance.now();
    //
    //     let mut transform = Isometry3::<f32>::identity();
    //     let rotation =
    //         UnitQuaternion::<f32>::from_axis_angle(&Vector3::z_axis(), now as f32 / 4096.0);
    //     transform.append_rotation_mut(&rotation);
    //     let rotation =
    //         UnitQuaternion::<f32>::from_axis_angle(&Vector3::y_axis(), now as f32 / 4096.0);
    //     transform.append_rotation_mut(&rotation);
    //
    //     // Draw all nodes
    //     for node in &self.nodes {
    //         self.draw_node(now as f32, &node, &transform);
    //     }
    //
    //     self.gui.borrow().draw();
    //
    //     Ok(())
    // }
}

fn create_default_program(gl: &WebGlRenderingContext) -> DefaultPipeline {
    let vert_src = include_str!("../res/shader/cube.vert.glsl");
    let frag_src = include_str!("../res/shader/cube.frag.glsl");
    DefaultPipeline::new(gl, vert_src, frag_src)
}

// fn create_select_framebuffer(gl: &GL, width: i32, height: i32) -> Framebuffer {
//     // @todo Create a framebuffer object
//     let select_framebuffer = gl.create_framebuffer();
//     gl.bind_framebuffer(GL::FRAMEBUFFER, select_framebuffer.as_ref());
//
//     // @todo Create a texture object
//     let mut texture = Texture::new(gl.clone());
//     texture.upload(None, width as u32, height as u32);
//     gl.bind_texture(GL::TEXTURE_2D, None);
//
//     gl.framebuffer_texture_2d(
//         GL::FRAMEBUFFER,
//         GL::COLOR_ATTACHMENT0,
//         GL::TEXTURE_2D,
//         Some(&texture.handle),
//         0,
//     );
//
//     // @todo Check error checkframebuffer
//
//     let select_depthbuffer = gl.create_renderbuffer();
//     gl.bind_renderbuffer(GL::RENDERBUFFER, select_depthbuffer.as_ref());
//     gl.renderbuffer_storage(GL::RENDERBUFFER, GL::DEPTH_COMPONENT16, width, height);
//     gl.framebuffer_renderbuffer(
//         GL::FRAMEBUFFER,
//         GL::DEPTH_ATTACHMENT,
//         GL::RENDERBUFFER,
//         select_depthbuffer.as_ref(),
//     );
//
//     let e = gl.check_framebuffer_status(GL::FRAMEBUFFER);
//     if e != GL::FRAMEBUFFER_COMPLETE {
//         log("Framebuffer error");
//     }
//
//     // Unbind
//     gl.bind_framebuffer(GL::FRAMEBUFFER, None);
//
//     Framebuffer {
//         frame: select_framebuffer,
//         color: None,
//         depth: select_depthbuffer,
//         texture: Some(texture),
//     }
// }

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
    canvas.set_width(canvas.client_width() as u32);
    canvas.set_height(canvas.client_height() as u32);

    Ok(canvas)
}