use web_sys::{WebGlRenderingContext as GL, WebGlProgram, WebGlUniformLocation, WebGlShader};

pub struct Program {
    pub gl: GL,
    pub program: WebGlProgram,
}

impl Program {
    pub fn new(gl: GL, vert_src: &str, frag_src: &str) -> Self {
        let vert_shader = compile_shader(&gl, GL::VERTEX_SHADER, vert_src);
        let frag_shader = compile_shader(&gl, GL::FRAGMENT_SHADER, frag_src);

        let program = link_program(&gl, vert_shader, frag_shader);

        Self { gl, program }
    }

    pub fn bind(&self) {
        self.gl.use_program(Some(&self.program));
    }

    pub fn get_attrib_loc(&self, name: &str) -> i32 {
        self.gl.get_attrib_location(&self.program, name)
    }

    pub fn get_uniform_loc(&self, name: &str) -> Option<WebGlUniformLocation> {
        self.gl.get_uniform_location(&self.program, name)
    }
}

impl Drop for Program {
    fn drop(&mut self) {
        self.gl.delete_program(Some(&self.program));
    }
}

/// Compiles source code into a shader object
fn compile_shader(gl: &GL, shader_type: u32, source: &str) -> WebGlShader {
    let shader = gl.create_shader(shader_type).unwrap();
    gl.shader_source(&shader, source);
    gl.compile_shader(&shader);

    if !gl
        .get_shader_parameter(&shader, GL::COMPILE_STATUS)
        .as_bool()
        .unwrap()
    {
        let msg = gl
            .get_shader_info_log(&shader)
            .unwrap_or_else(|| String::from("Unknown error"));
        panic!("Failed to compile shader: {}", msg);
    }

    shader
}

/// Links vertex and fragment shader into a shader program
fn link_program(gl: &GL, vert: WebGlShader, frag: WebGlShader) -> WebGlProgram {
    let program = gl.create_program().unwrap();

    gl.attach_shader(&program, &vert);
    gl.attach_shader(&program, &frag);
    gl.link_program(&program);

    if !gl
        .get_program_parameter(&program, GL::LINK_STATUS)
        .as_bool()
        .unwrap()
    {
        let msg = gl
            .get_program_info_log(&program)
            .unwrap_or_else(|| String::from("Unknown error"));
        panic!("Failed to link program: {}", msg);
    }

    gl.delete_shader(Some(&vert));
    gl.delete_shader(Some(&frag));

    program
}