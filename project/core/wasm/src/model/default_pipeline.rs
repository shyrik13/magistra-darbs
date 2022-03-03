use web_sys::{WebGlRenderingContext as GL, WebGlUniformLocation};
use crate::model::{program, Vertex};

pub struct DefaultPipeline {
    pub program: program::Program,
    pub transform_loc: Option<WebGlUniformLocation>,
    pub normal_transform_loc: Option<WebGlUniformLocation>,
}

impl DefaultPipeline {
    pub fn new(gl: &GL, vert_src: &str, frag_src: &str) -> Self {
        let program = program::Program::new(gl.clone(), vert_src, frag_src);
        program.bind();

        let transform_loc = program.get_uniform_loc("transform");
        let normal_transform_loc = program.get_uniform_loc("normal_transform");

        Self {
            program,
            transform_loc,
            normal_transform_loc,
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

        // Color
        let color_loc = self.program.get_attrib_loc("in_color");

        let offset = 3 * std::mem::size_of::<f32>() as i32;
        self.program.gl.vertex_attrib_pointer_with_i32(
            color_loc as u32,
            4,
            GL::FLOAT,
            false,
            stride,
            offset,
        );
        self.program.gl.enable_vertex_attrib_array(color_loc as u32);

        // Normal
        let normal_loc = self.program.get_attrib_loc("in_normal");

        let offset = 7 * std::mem::size_of::<f32>() as i32;
        self.program.gl.vertex_attrib_pointer_with_i32(
            normal_loc as u32,
            3,
            GL::FLOAT,
            false,
            stride,
            offset,
        );
        self.program
            .gl
            .enable_vertex_attrib_array(normal_loc as u32);

        // Texture coordinates
        let uv_loc = self.program.get_attrib_loc("in_uv");
        let offset = 10 * std::mem::size_of::<f32>() as i32;
        self.program.gl.vertex_attrib_pointer_with_i32(
            uv_loc as u32,
            2,
            GL::FLOAT,
            false,
            stride,
            offset,
        );
        self.program.gl.enable_vertex_attrib_array(uv_loc as u32);
    }
}