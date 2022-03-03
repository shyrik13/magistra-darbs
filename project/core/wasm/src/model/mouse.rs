use nalgebra::Vector2;

pub struct Mouse {
    pub pos: Vector2<i32>,
    pub prev: Vector2<i32>,
    pub drag: Vector2<i32>,

    pub left_click: bool,
    pub left_down: bool,

    pub selected_node: Option<u32>,
}

impl Mouse {
    const LEFT: u16 = 1;
    const RIGHT: u16 = 2;
    const MIDDLE: u16 = 4;

    pub fn new() -> Self {
        Self {
            pos: Vector2::new(0, 0),
            prev: Vector2::new(0, 0),
            drag: Vector2::new(0, 0),
            left_click: false,
            left_down: false,
            selected_node: None,
        }
    }

    pub fn reset(&mut self) {
        self.left_click = false;
        self.drag.x = 0;
        self.drag.y = 0;
    }
}