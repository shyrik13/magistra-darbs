/// CPU-side primitive geometry
pub struct Geometry {
    pub vertices: Vec<f32>,
    pub uvs: Vec<f32>,
    // pub normals: Vec<V>,
    pub tangents: Vec<f32>,
    pub bitangents: Vec<f32>,
    pub triangles: i32,
    pub vertex_count: i32
}

impl Geometry {

    pub fn new(vertices: Vec<f32>, uvs: Vec<f32>, tangents: Vec<f32>, bitangents: Vec<f32>, triangles: i32, vertex_count: i32) -> Self {
        Self { vertices, uvs, tangents, bitangents, triangles, vertex_count }
    }

}