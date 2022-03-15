use web_sys::{WebGlRenderingContext as GL, WebGlUniformLocation};
use crate::model::{program, Vertex};

pub struct DefaultPipeline {
    pub program: program::Program,
    // pub transform_loc: Option<WebGlUniformLocation>,
    // pub normal_transform_loc: Option<WebGlUniformLocation>,
}

impl DefaultPipeline {
    pub fn new(gl: &GL, vert_src: &str, frag_src: &str) -> Self {
        let program = program::Program::new(gl.clone(), vert_src, frag_src);
        program.bind();

        // let perspective_id = program.get_uniform_loc("perspective");

        Self {
            program
        }
    }

    pub fn bind_attribs(&self) {
        // Position
        let vert_pos_loc = self.program.get_attrib_loc("vert_pos");

        // Number of bytes between each vertex element
        let stride = std::mem::size_of::<Vertex>() as i32;
        // Offset of vertex data from the beginning of the buffer
        let offset = 0;

        self.program.gl.vertex_attrib_pointer_with_i32(
            vert_pos_loc as u32,
            3,
            GL::FLOAT,
            false,
            stride,
            offset,
        );
        self.program
            .gl
            .enable_vertex_attrib_array(vert_pos_loc as u32);

        // uv (texture) coordinates
        let vert_uv_loc = self.program.get_attrib_loc("vert_uv");

        let offset = 3 * std::mem::size_of::<f32>() as i32;
        self.program.gl.vertex_attrib_pointer_with_i32(
            vert_uv_loc as u32,
            2,
            GL::FLOAT,
            false,
            stride,
            offset,
        );
        self.program.gl.enable_vertex_attrib_array(vert_uv_loc as u32);

        // tang coordinates
        let vert_tang_loc = self.program.get_attrib_loc("vert_tang");

        let offset = 5 * std::mem::size_of::<f32>() as i32;
        self.program.gl.vertex_attrib_pointer_with_i32(
            vert_tang_loc as u32,
            3,
            GL::FLOAT,
            false,
            stride,
            offset,
        );
        self.program
            .gl
            .enable_vertex_attrib_array(vert_tang_loc as u32);

        // bitang coordinates
        let vert_bitang_loc = self.program.get_attrib_loc("vert_bitang");
        let offset = 8 * std::mem::size_of::<f32>() as i32;
        self.program.gl.vertex_attrib_pointer_with_i32(
            vert_bitang_loc as u32,
            2,
            GL::FLOAT,
            false,
            stride,
            offset,
        );
        self.program.gl.enable_vertex_attrib_array(vert_bitang_loc as u32);
    }
}