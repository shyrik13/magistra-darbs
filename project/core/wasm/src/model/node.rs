use nalgebra::Isometry3;
use crate::model::Primitive;

pub struct Node {
    pub id: u32,
    pub transform: Isometry3<f32>,
    pub primitive: Primitive,
    pub children: Vec<Node>,
}

impl Node {
    pub fn new(primitive: Primitive) -> Self {
        Self {
            id: 0,
            transform: Isometry3::identity(),
            primitive,
            children: vec![],
        }
    }
}