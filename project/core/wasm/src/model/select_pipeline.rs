use crate::model::{Program, Vertex};
use std::collections::HashMap;
use web_sys::WebGlUniformLocation;
use web_sys::WebGlRenderingContext as GL;

type Color = [u8; 3];

pub struct SelectPipeline {
    pub program: Program,
    pub transform_loc: Option<WebGlUniformLocation>,
    pub color_loc: Option<WebGlUniformLocation>,

    pub node_colors: HashMap<u32, Color>,
}

impl SelectPipeline {
    pub fn new(gl: &GL) -> SelectPipeline {
        let vert_src = include_str!("../../res/shader/select.vert.glsl");
        let frag_src = include_str!("../../res/shader/select.frag.glsl");
        let program = Program::new(gl.clone(), vert_src, frag_src);
        program.bind();

        let transform_loc = program.get_uniform_loc("transform");
        let color_loc = program.get_uniform_loc("color");

        Self {
            program,
            transform_loc,
            color_loc,
            node_colors: HashMap::new(),
        }
    }

    pub fn bind_attribs(&self) {
        // Position
        let position_loc = self.program.get_attrib_loc("in_position");

        // Number of bytes between each vertex element
        let stride = std::mem::size_of::<Vertex>() as i32;
        // Offset of vertex data from the beginning of the buffer
        let offset = 0;

        self.program.gl.vertex_attrib_pointer_with_i32(
            position_loc as u32,
            3,
            GL::FLOAT,
            false,
            stride,
            offset,
        );
        self.program
            .gl
            .enable_vertex_attrib_array(position_loc as u32);
    }
}