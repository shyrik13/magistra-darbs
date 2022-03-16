use web_sys::WebGlBuffer;
use crate::model::Geometry;
use web_sys::WebGlRenderingContext as GL;

/// GPU-side primitive geometry
pub struct Primitive {
    pub gl: GL,
    // pub vertex_buffer: Option<WebGlBuffer>,
    pub position_buffer: Option<WebGlBuffer>,
    pub uv_buffer: Option<WebGlBuffer>,
    pub tang_buffer: Option<WebGlBuffer>,
    pub bitang_buffer: Option<WebGlBuffer>,
    pub vertex_count: i32
}

impl Primitive {
    pub fn from_raw(gl: GL, vec_vertices: &Vec<f32>, vec_uvs: &Vec<f32>, vec_tang: &Vec<f32>, vec_bitang: &Vec<f32>, vertex_count: i32) -> Self {

        let position_buffer = gl.create_buffer();
        gl.bind_buffer(GL::ARRAY_BUFFER, position_buffer.as_ref());
        let u8_slice = unsafe {
            std::slice::from_raw_parts(
                vec_vertices.as_ptr() as *const u8,
                vec_vertices.len() * std::mem::size_of::<f32>(),
            )
        };
        gl.buffer_data_with_u8_array(GL::ARRAY_BUFFER, u8_slice, GL::STATIC_DRAW);

        let uv_buffer = gl.create_buffer();
        gl.bind_buffer(GL::ARRAY_BUFFER, uv_buffer.as_ref());
        let u8_slice = unsafe {
            std::slice::from_raw_parts(
                vec_uvs.as_ptr() as *const u8,
                vec_uvs.len() * std::mem::size_of::<f32>(),
            )
        };
        gl.buffer_data_with_u8_array(GL::ARRAY_BUFFER, u8_slice, GL::STATIC_DRAW);

        let tang_buffer = gl.create_buffer();
        gl.bind_buffer(GL::ARRAY_BUFFER, tang_buffer.as_ref());
        let u8_slice = unsafe {
            std::slice::from_raw_parts(
                vec_tang.as_ptr() as *const u8,
                vec_tang.len() * std::mem::size_of::<f32>(),
            )
        };
        gl.buffer_data_with_u8_array(GL::ARRAY_BUFFER, u8_slice, GL::STATIC_DRAW);

        let bitang_buffer = gl.create_buffer();
        gl.bind_buffer(GL::ARRAY_BUFFER, bitang_buffer.as_ref());
        let u8_slice = unsafe {
            std::slice::from_raw_parts(
                vec_bitang.as_ptr() as *const u8,
                vec_bitang.len() * std::mem::size_of::<f32>(),
            )
        };
        gl.buffer_data_with_u8_array(GL::ARRAY_BUFFER, u8_slice, GL::STATIC_DRAW);

        Self {
            gl,
            position_buffer,
            uv_buffer,
            tang_buffer,
            bitang_buffer,
            vertex_count
        }
    }

    pub fn new(gl: GL, geometry: &Geometry) -> Self {
        Self::from_raw(gl, &geometry.vertices, &geometry.uvs, &geometry.tangents, &geometry.bitangents, geometry.vertex_count)
    }

    pub fn draw(&self) {
        self.gl
            .draw_arrays(GL::TRIANGLES, 0, self.vertex_count);
    }
}

impl Drop for Primitive {
    fn drop(&mut self) {
        self.gl.delete_buffer(self.position_buffer.as_ref());
        self.gl.delete_buffer(self.uv_buffer.as_ref());
        self.gl.delete_buffer(self.tang_buffer.as_ref());
        self.gl.delete_buffer(self.bitang_buffer.as_ref());
    }
}