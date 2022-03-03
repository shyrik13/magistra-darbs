type UV = [f32; 2];

#[repr(C)]
pub struct Vertex {
    pub position: [f32; 3], // xy
    pub color: [f32; 4],    // rgba
    pub normal: [f32; 3],
    pub uv: UV,
}