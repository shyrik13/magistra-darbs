use crate::model::Vertex;

/// CPU-side primitive geometry
pub struct Geometry<V> {
    pub vertices: Vec<V>,
    pub triangles: i32,
    pub vertex_count: i32
}

impl Geometry<Vertex> {

    pub fn new(vertices: Vec<Vertex>, triangles: i32, vertex_count: i32) -> Self {
        Self { vertices, triangles, vertex_count }
    }

}