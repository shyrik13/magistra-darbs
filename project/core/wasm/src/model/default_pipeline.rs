use web_sys::{WebGlRenderingContext as GL, WebGlUniformLocation};
use crate::model::{program, Primitive};

pub struct DefaultPipeline {
    pub program: program::Program,
    pub perspective_loc: Option<WebGlUniformLocation>,
    pub tex_diffuse_loc: Option<WebGlUniformLocation>,
    pub tex_norm_loc: Option<WebGlUniformLocation>,
    pub model_view_loc: Option<WebGlUniformLocation>,
    pub vert_pos_loc: i32,
    pub vert_uv_loc: i32,
    pub vert_tang_loc: i32,
    pub vert_bitang_loc: i32
}

impl DefaultPipeline {
    pub fn new(gl: &GL, vert_src: &str, frag_src: &str) -> Self {
        let program = program::Program::new(gl.clone(), vert_src, frag_src);
        program.bind();

        let perspective_loc = program.get_uniform_loc("perspective");
        let tex_diffuse_loc = program.get_uniform_loc("tex_diffuse");
        let tex_norm_loc = program.get_uniform_loc("tex_norm");
        let model_view_loc = program.get_uniform_loc("model_view");

        let vert_pos_loc = program.get_attrib_loc("vert_pos");
        let vert_uv_loc = program.get_attrib_loc("vert_uv");
        let vert_tang_loc = program.get_attrib_loc("vert_tang");
        let vert_bitang_loc = program.get_attrib_loc("vert_bitang");

        Self {
            program,
            perspective_loc,
            tex_diffuse_loc,
            tex_norm_loc,
            model_view_loc,
            vert_pos_loc,
            vert_uv_loc,
            vert_tang_loc,
            vert_bitang_loc
        }
    }

    pub fn bind(&self, primitive: &Primitive) {

        // position coordinates
        self.program.gl.bind_buffer(GL::ARRAY_BUFFER, primitive.position_buffer.as_ref());
        self.program.gl.vertex_attrib_pointer_with_i32(
            self.vert_pos_loc as u32, 3, GL::FLOAT, false, 0, 0
        );
        self.program.gl.enable_vertex_attrib_array(self.vert_pos_loc as u32);

        // uv (texture) coordinates
        self.program.gl.bind_buffer(GL::ARRAY_BUFFER, primitive.uv_buffer.as_ref());
        self.program.gl.vertex_attrib_pointer_with_i32(
            self.vert_uv_loc as u32, 2, GL::FLOAT, false, 0, 0
        );
        self.program.gl.enable_vertex_attrib_array(self.vert_uv_loc as u32);

        // tang coordinates
        self.program.gl.bind_buffer(GL::ARRAY_BUFFER, primitive.tang_buffer.as_ref());
        self.program.gl.vertex_attrib_pointer_with_i32(
            self.vert_tang_loc as u32, 3, GL::FLOAT, false, 0, 0
        );
        self.program.gl.enable_vertex_attrib_array(self.vert_tang_loc as u32);

        // bitang coordinates
        self.program.gl.bind_buffer(GL::ARRAY_BUFFER, primitive.bitang_buffer.as_ref());
        self.program.gl.vertex_attrib_pointer_with_i32(
            self.vert_bitang_loc as u32, 3, GL::FLOAT, false, 0, 0
        );
        self.program.gl.enable_vertex_attrib_array(self.vert_bitang_loc as u32);
    }
}