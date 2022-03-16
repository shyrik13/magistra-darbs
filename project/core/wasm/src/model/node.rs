use crate::model::Primitive;

pub struct Node {
    pub id: u32,
    pub coords: (f32, f32, f32),
    pub model: [f32; 16],
    pub primitive: Primitive,
    pub children: Vec<Node>,
}

impl Node {
    pub fn new(primitive: Primitive) -> Self {
        let model =
            [
                0.0,0.0,0.0,0.0,
                0.0,0.0,0.0,0.0,
                0.0,0.0,0.0,0.0,
                0.0,0.0,0.0,0.0
            ];

        Self {
            id: 0,
            coords: (0.0, 0.0, 0.0),
            model,
            primitive,
            children: vec![],
        }
    }

    pub fn set_x_y_z(&mut self, x: f32, y: f32, z: f32) {
        self.coords = (x, y, z);
    }

    pub fn rotate_model(&mut self, c: f32, s: f32) {
        self.model = [
            c.powi(2), -c*s, s, 0.0,
            c*(s.powi(2)+s), c.powi(2)-s.powi(3), -c*s, 0.0,
            s*(s-c.powi(2)), c*(s.powi(2)+s), c.powi(2), 0.0,
            self.coords.0, self.coords.1, self.coords.2, 1.0f32
        ]
    }
}