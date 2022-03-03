use web_sys::{WebGlRenderingContext as GL, WebGlUniformLocation};
use crate::model::program;

pub struct PointPipeline {
    pub program: program::Program,
    pub position_loc: i32,
    pub point_size_loc: i32,
    pub color_loc: Option<WebGlUniformLocation>,
}

impl PointPipeline {
    pub fn new(gl: &GL, vert_src: &str, frag_src: &str) -> Self {
        let program = program::Program::new(gl.clone(), vert_src, frag_src);
        program.bind();

        let position_loc = program.get_attrib_loc("position");
        let point_size_loc = program.get_attrib_loc("point_size");
        let color_loc = program.get_uniform_loc("color");

        Self {
            program,
            position_loc,
            point_size_loc,
            color_loc,
        }
    }
}