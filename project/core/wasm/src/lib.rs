mod utils;

use std::{cell::RefCell, rc::Rc};
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;

use na::{Isometry3, Point3, Translation3, UnitQuaternion, Vector2, Vector3};
use nalgebra as na;
use web_sys::WebGlRenderingContext as GL;
use web_sys::*;
use rand::Rng;

use crate::model::{*};
mod model;

use crate::gui::*;

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
    gl: WebGlRenderingContext,
    view: Rc<RefCell<Isometry3<f32>>>,
    mouse: Rc<RefCell<Mouse>>,
    offscreen_framebuffer: Framebuffer,
    point_pipeline: model::PointPipeline,
    default_pipeline: model::DefaultPipeline,
    select_pipeline: SelectPipeline,
    nodes: Vec<model::Node>,
    texture: Texture,
    gui: Rc<RefCell<Gui>>,
}

#[wasm_bindgen]
impl Context {

    fn draw_node(&self, now: f32, node: &model::Node, parent_trs: &Isometry3<f32>) {
        node.primitive.bind();
        self.default_pipeline.bind_attribs();

        // Select color
        let select_color_loc = self
            .default_pipeline
            .program
            .get_uniform_loc("select_color");
        let select_color = match self.mouse.borrow().selected_node {
            Some(node_id) if node_id == node.id => [0.4f32, 0.4, 0.1, 0.0],
            _ => [0.0f32, 0.0, 0.0, 0.0],
        };
        self.gl
            .uniform4fv_with_f32_array(select_color_loc.as_ref(), &select_color);

        let transform = parent_trs * node.transform;

        self.gl.uniform_matrix4fv_with_f32_array(
            self.default_pipeline.transform_loc.as_ref(),
            false,
            transform.to_homogeneous().as_slice(),
        );

        let normal_transform = transform.inverse().to_homogeneous().transpose();
        self.gl.uniform_matrix4fv_with_f32_array(
            self.default_pipeline.normal_transform_loc.as_ref(),
            false,
            normal_transform.as_slice(),
        );

        node.primitive.draw();

        for child in &node.children {
            self.draw_node(now, child, &transform);
        }
    }

    pub fn new() -> Result<Context, JsValue> {
        let window = web_sys::window().unwrap();
        let performance = window.performance().unwrap();

        let canvas = get_canvas("rust-gl")?;
        let gl = get_gl_context(&canvas)?;

        //let offscreen_framebuffer =
        //create_offscreen_framebuffer(&gl, canvas.width() as i32, canvas.height() as i32);

        let select_framebuffer =
            create_select_framebuffer(&gl, canvas.width() as i32, canvas.height() as i32);

        let point_pipeline = create_point_program(&gl);
        let default_pipeline = create_default_program(&gl);
        let mut select_pipeline = SelectPipeline::new(&gl);

        // OpenGL uses a right-handed coordinate system
        let view = Rc::new(RefCell::new(Isometry3::look_at_rh(
            &Point3::new(0.0, 0.0, 3.0),
            &Point3::origin(),
            &Vector3::y_axis(),
        )));

        let mut nodes = vec![];

        let cube = Geometry::cube();

        let mut root = model::Node::new(model::Primitive::new(gl.clone(), &cube));
        root.transform
            .append_translation_mut(&Translation3::new(0.0, 0.0, 0.0));

        // Create select color for each node
        let mut rng = rand::thread_rng();
        generate_node_colors(&mut select_pipeline, &mut rng, &root);

        nodes.push(root);

        let texture = model::Texture::new(gl.clone());

        // @todo Extract to function: Create GUI
        let gui = Gui::new(&gl, canvas.width(), canvas.height());

        let ret = Context {
            performance,
            canvas,
            gl,
            view,
            mouse: Rc::new(RefCell::new(Mouse::new())),
            offscreen_framebuffer: select_framebuffer,
            point_pipeline,
            default_pipeline,
            select_pipeline,
            nodes,
            texture,

            gui: Rc::new(RefCell::new(gui)),
        };

        Ok(ret)
    }

    /// Draws the scene
    pub fn draw(&self) -> Result<(), JsValue> {

        // After using input, reset its state
        self.mouse.borrow_mut().reset();

        // Set graphics state
        self.gl.enable(GL::DEPTH_TEST);
        self.gl.enable(GL::BLEND);
        self.gl.blend_func(GL::SRC_ALPHA, GL::ONE_MINUS_SRC_ALPHA);

        self.default_pipeline.program.bind();

        // View
        let view_loc = self.default_pipeline.program.get_uniform_loc("view");

        self.gl.uniform_matrix4fv_with_f32_array(
            view_loc.as_ref(),
            false,
            self.view.borrow().to_homogeneous().as_slice(),
        );

        // Proj
        let proj_loc = self.default_pipeline.program.get_uniform_loc("proj");

        let width = self.canvas.width() as f32;
        let height = self.canvas.height() as f32;
        let proj = nalgebra::Perspective3::new(width / height, 3.14 / 4.0, 0.125, 256.0);
        self.gl.uniform_matrix4fv_with_f32_array(
            proj_loc.as_ref(),
            false,
            proj.to_homogeneous().as_slice(),
        );

        // Lighting
        let light_color_loc = self.default_pipeline.program.get_uniform_loc("light_color");
        self.gl.uniform3f(light_color_loc.as_ref(), 1.0, 1.0, 1.0);

        let light_position_loc = self
            .default_pipeline
            .program
            .get_uniform_loc("light_position");
        self.gl
            .uniform3f(light_position_loc.as_ref(), 4.0, 1.0, 1.0);

        // Texture
        self.texture.bind();
        let sampler_loc = self.default_pipeline.program.get_uniform_loc("tex_sampler");
        self.gl.uniform1i(sampler_loc.as_ref(), 0);

        self.gl.clear_color(1.0, 1.0, 1.0, 1.0);
        self.gl.clear(GL::COLOR_BUFFER_BIT);
        self.gl.clear(GL::DEPTH_BUFFER_BIT);

        // Time
        let now = self.performance.now();

        let mut transform = Isometry3::<f32>::identity();
        let rotation =
            UnitQuaternion::<f32>::from_axis_angle(&Vector3::z_axis(), now as f32 / 4096.0);
        transform.append_rotation_mut(&rotation);
        let rotation =
            UnitQuaternion::<f32>::from_axis_angle(&Vector3::y_axis(), now as f32 / 4096.0);
        transform.append_rotation_mut(&rotation);

        // Draw all nodes
        for node in &self.nodes {
            self.draw_node(now as f32, &node, &transform);
        }

        self.gui.borrow().draw();

        Ok(())
    }
}

fn create_point_program(gl: &WebGlRenderingContext) -> PointPipeline {
    let vert_src = include_str!("../res/shader/point.vert.glsl");
    let frag_src = include_str!("../res/shader/point.frag.glsl");

    PointPipeline::new(gl, vert_src, frag_src)
}

fn create_default_program(gl: &WebGlRenderingContext) -> DefaultPipeline {
    let vert_src = include_str!("../res/shader/default.vert.glsl");
    let frag_src = include_str!("../res/shader/default.frag.glsl");
    DefaultPipeline::new(gl, vert_src, frag_src)
}

type Color = [u8; 3];

fn generate_node_colors(
    select_pipeline: &mut SelectPipeline,
    rng: &mut rand::rngs::ThreadRng,
    node: &model::Node,
) {
    let color: Color = [rng.gen(), rng.gen(), rng.gen()];
    select_pipeline.node_colors.insert(node.id, color);

    for child in &node.children {
        generate_node_colors(select_pipeline, rng, child);
    }
}

fn create_select_framebuffer(gl: &GL, width: i32, height: i32) -> Framebuffer {
    // @todo Create a framebuffer object
    let select_framebuffer = gl.create_framebuffer();
    gl.bind_framebuffer(GL::FRAMEBUFFER, select_framebuffer.as_ref());

    // @todo Create a texture object
    let mut texture = Texture::new(gl.clone());
    texture.upload(None, width as u32, height as u32);
    gl.bind_texture(GL::TEXTURE_2D, None);

    gl.framebuffer_texture_2d(
        GL::FRAMEBUFFER,
        GL::COLOR_ATTACHMENT0,
        GL::TEXTURE_2D,
        Some(&texture.handle),
        0,
    );

    // @todo Check error checkframebuffer

    let select_depthbuffer = gl.create_renderbuffer();
    gl.bind_renderbuffer(GL::RENDERBUFFER, select_depthbuffer.as_ref());
    gl.renderbuffer_storage(GL::RENDERBUFFER, GL::DEPTH_COMPONENT16, width, height);
    gl.framebuffer_renderbuffer(
        GL::FRAMEBUFFER,
        GL::DEPTH_ATTACHMENT,
        GL::RENDERBUFFER,
        select_depthbuffer.as_ref(),
    );

    let e = gl.check_framebuffer_status(GL::FRAMEBUFFER);
    if e != GL::FRAMEBUFFER_COMPLETE {
        log("Framebuffer error");
    }

    // Unbind
    gl.bind_framebuffer(GL::FRAMEBUFFER, None);

    Framebuffer {
        frame: select_framebuffer,
        color: None,
        depth: select_depthbuffer,
        texture: Some(texture),
    }
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
    canvas.set_width(canvas.client_width() as u32);
    canvas.set_height(canvas.client_height() as u32);

    Ok(canvas)
}