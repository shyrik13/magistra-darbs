use web_sys::WebGlBuffer;
use crate::model::Geometry;
use web_sys::WebGlRenderingContext as GL;

/// GPU-side primitive geometry
pub struct Primitive {
    pub gl: GL,
    pub vertex_buffer: Option<WebGlBuffer>,
    pub index_buffer: Option<WebGlBuffer>,
    pub index_count: i32,
}

impl Primitive {
    pub fn from_raw<T>(gl: GL, vertices: &Vec<T>, indices: &Vec<u8>) -> Self {
        let vertex_buffer = gl.create_buffer();
        gl.bind_buffer(GL::ARRAY_BUFFER, vertex_buffer.as_ref());
        let u8_slice = unsafe {
            std::slice::from_raw_parts(
                vertices.as_ptr() as *const u8,
                vertices.len() * std::mem::size_of::<T>(),
            )
        };
        gl.buffer_data_with_u8_array(GL::ARRAY_BUFFER, u8_slice, GL::STATIC_DRAW);

        let index_buffer = gl.create_buffer();
        gl.bind_buffer(GL::ELEMENT_ARRAY_BUFFER, index_buffer.as_ref());
        gl.buffer_data_with_u8_array(GL::ELEMENT_ARRAY_BUFFER, &indices, GL::STATIC_DRAW);

        let index_count = indices.len() as i32;
        Self {
            gl,
            vertex_buffer,
            index_buffer,
            index_count,
        }
    }

    pub fn new<V>(gl: GL, geometry: &Geometry<V>) -> Self {
        Self::from_raw(gl, &geometry.vertices, &geometry.indices)
    }

    pub fn bind(&self) {
        self.gl
            .bind_buffer(GL::ARRAY_BUFFER, self.vertex_buffer.as_ref());
        self.gl
            .bind_buffer(GL::ELEMENT_ARRAY_BUFFER, self.index_buffer.as_ref());
    }

    pub fn draw(&self) {
        self.gl
            .draw_elements_with_i32(GL::TRIANGLES, self.index_count, GL::UNSIGNED_BYTE, 0);
    }
}

impl Drop for Primitive {
    fn drop(&mut self) {
        self.gl.delete_buffer(self.vertex_buffer.as_ref());
        self.gl.delete_buffer(self.index_buffer.as_ref());
    }
}