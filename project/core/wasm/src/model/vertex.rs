type UV = [f32; 2];

#[repr(C)]
pub struct Vertex {
    pub position: [f32; 3], // xyz
    pub uv: UV,
    //pub normal: [f32; 3],
    pub tangent: [f32; 3],
    pub bitangent: [f32; 3],
}

impl Vertex {
    pub fn new(position: [f32; 3], uv: UV, /*normal: [f32; 3],*/ tangent: [f32; 3], bitangent: [f32; 3]) -> Vertex {
        Vertex { position: position, uv: uv, /*normal: normal,*/ tangent: tangent, bitangent: bitangent }
    }
}

impl std::fmt::Display for Vertex {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        write!(
            f,
            "(position: {:?}, uv: {:?}, tangent: {:?}, bitangent: {:?})",
            self.position, self.uv, self.tangent, self.bitangent
        )
    }
}

impl std::fmt::Debug for Vertex {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "(position: {:?}, uv: {:?}, tangent: {:?}, bitangent: {:?})",
            self.position, self.uv, self.tangent, self.bitangent
        )
    }
}