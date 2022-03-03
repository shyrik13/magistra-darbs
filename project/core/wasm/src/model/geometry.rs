use crate::model::Vertex;

/// CPU-side primitive geometry
pub struct Geometry<V> {
    pub vertices: Vec<V>,
    pub indices: Vec<u8>,
}

impl Geometry<Vertex> {
    pub fn triangle() -> Self {
        let vertices = vec![
            Vertex {
                position: [-0.5, -0.5, 0.0],
                color: [1.0, 1.0, 1.0, 1.0],
                normal: [0.0, 0.0, 1.0],
                uv: [0.0, 0.0],
            },
            Vertex {
                position: [0.5, -0.5, 0.0],
                color: [1.0, 1.0, 1.0, 1.0],
                normal: [0.0, 0.0, 1.0],
                uv: [1.0, 0.0],
            },
            Vertex {
                position: [0.0, 0.5, 0.0],
                color: [1.0, 1.0, 1.0, 1.0],
                normal: [0.0, 0.0, 1.0],
                uv: [0.5, 1.0],
            },
        ];

        let indices = vec![0, 1, 2];

        Self { vertices, indices }
    }

    /// Constructs a unit quad centered at the origin
    /// Vertices are ordered like so: `[bottom-left, bottom-right, top-right, top-left]`
    pub fn quad() -> Self {
        let vertices: Vec<Vertex> = vec![
            // Bottom-left
            Vertex {
                position: [0.0, 1.0, 0.0],
                color: [1.0, 1.0, 1.0, 1.0],
                normal: [0.0, 0.0, 1.0],
                uv: [0.0, 1.0],
            },
            // Bottom-right
            Vertex {
                position: [1.0, 1.0, 0.0],
                color: [1.0, 1.0, 1.0, 1.0],
                normal: [0.0, 0.0, 1.0],
                uv: [1.0, 1.0],
            },
            // Top-right
            Vertex {
                position: [1.0, 0.0, 0.0],
                color: [1.0, 1.0, 1.0, 1.0],
                normal: [0.0, 0.0, 1.0],
                uv: [1.0, 0.0],
            },
            // Top-left
            Vertex {
                position: [0.0, 0.0, 0.0],
                color: [1.0, 1.0, 1.0, 1.0],
                normal: [0.0, 0.0, 1.0],
                uv: [0.0, 0.0],
            },
        ];

        let indices = vec![0, 1, 2, 0, 2, 3];

        Self { vertices, indices }
    }

    pub fn cube() -> Self {
        let vertices = vec![
            // Front
            Vertex {
                position: [-0.5, -0.5, 0.5],
                color: [1.0, 1.0, 1.0, 1.0],
                normal: [0.0, 0.0, 1.0],
                uv: [0.0, 0.0],
            },
            Vertex {
                position: [0.5, -0.5, 0.5],
                color: [1.0, 1.0, 1.0, 1.0],
                normal: [0.0, 0.0, 1.0],
                uv: [1.0, 0.0],
            },
            Vertex {
                position: [0.5, 0.5, 0.5],
                color: [1.0, 1.0, 1.0, 1.0],
                normal: [0.0, 0.0, 1.0],
                uv: [1.0, 1.0],
            },
            Vertex {
                position: [-0.5, 0.5, 0.5],
                color: [1.0, 1.0, 1.0, 1.0],
                normal: [0.0, 0.0, 1.0],
                uv: [0.0, 1.0],
            },
            // Right
            Vertex {
                position: [0.5, -0.5, 0.5],
                color: [1.0, 1.0, 1.0, 1.0],
                normal: [1.0, 0.0, 0.0],
                uv: [0.0, 0.0],
            },
            Vertex {
                position: [0.5, -0.5, -0.5],
                color: [1.0, 1.0, 1.0, 1.0],
                normal: [1.0, 0.0, 0.0],
                uv: [1.0, 0.0],
            },
            Vertex {
                position: [0.5, 0.5, -0.5],
                color: [1.0, 1.0, 1.0, 1.0],
                normal: [1.0, 0.0, 0.0],
                uv: [1.0, 1.0],
            },
            Vertex {
                position: [0.5, 0.5, 0.5],
                color: [1.0, 1.0, 1.0, 1.0],
                normal: [1.0, 0.0, 0.0],
                uv: [0.0, 1.0],
            },
            // Back
            Vertex {
                position: [0.5, -0.5, -0.5],
                color: [1.0, 1.0, 1.0, 1.0],
                normal: [0.0, 0.0, -1.0],
                uv: [0.0, 0.0],
            },
            Vertex {
                position: [-0.5, -0.5, -0.5],
                color: [1.0, 1.0, 1.0, 1.0],
                normal: [0.0, 0.0, -1.0],
                uv: [1.0, 0.0],
            },
            Vertex {
                position: [-0.5, 0.5, -0.5],
                color: [1.0, 1.0, 1.0, 1.0],
                normal: [0.0, 0.0, -1.0],
                uv: [1.0, 1.0],
            },
            Vertex {
                position: [0.5, 0.5, -0.5],
                color: [1.0, 1.0, 1.0, 1.0],
                normal: [0.0, 0.0, -1.0],
                uv: [0.0, 1.0],
            },
            // Left
            Vertex {
                position: [-0.5, -0.5, -0.5],
                color: [1.0, 1.0, 1.0, 1.0],
                normal: [-1.0, 0.0, 0.0],
                uv: [0.0, 0.0],
            },
            Vertex {
                position: [-0.5, -0.5, 0.5],
                color: [1.0, 1.0, 1.0, 1.0],
                normal: [-1.0, 0.0, 0.0],
                uv: [1.0, 0.0],
            },
            Vertex {
                position: [-0.5, 0.5, 0.5],
                color: [1.0, 1.0, 1.0, 1.0],
                normal: [-1.0, 0.0, 0.0],
                uv: [1.0, 1.0],
            },
            Vertex {
                position: [-0.5, 0.5, -0.5],
                color: [1.0, 1.0, 1.0, 1.0],
                normal: [-1.0, 0.0, 0.0],
                uv: [0.0, 1.0],
            },
            // Top
            Vertex {
                position: [-0.5, 0.5, 0.5],
                color: [1.0, 1.0, 1.0, 1.0],
                normal: [0.0, 1.0, 0.0],
                uv: [0.0, 0.0],
            },
            Vertex {
                position: [0.5, 0.5, 0.5],
                color: [1.0, 1.0, 1.0, 1.0],
                normal: [0.0, 1.0, 0.0],
                uv: [1.0, 0.0],
            },
            Vertex {
                position: [0.5, 0.5, -0.5],
                color: [1.0, 1.0, 1.0, 1.0],
                normal: [0.0, 1.0, 0.0],
                uv: [1.0, 1.0],
            },
            Vertex {
                position: [-0.5, 0.5, -0.5],
                color: [1.0, 1.0, 1.0, 1.0],
                normal: [0.0, 1.0, 0.0],
                uv: [0.0, 1.0],
            },
            // Bottom
            Vertex {
                position: [-0.5, -0.5, -0.5],
                color: [1.0, 1.0, 1.0, 1.0],
                normal: [0.0, -1.0, 0.0],
                uv: [0.0, 0.0],
            },
            Vertex {
                position: [0.5, -0.5, -0.5],
                color: [1.0, 1.0, 1.0, 1.0],
                normal: [0.0, -1.0, 0.0],
                uv: [1.0, 0.0],
            },
            Vertex {
                position: [0.5, -0.5, 0.5],
                color: [1.0, 1.0, 1.0, 1.0],
                normal: [0.0, -1.0, 0.0],
                uv: [1.0, 1.0],
            },
            Vertex {
                position: [-0.5, -0.5, 0.5],
                color: [1.0, 1.0, 1.0, 1.0],
                normal: [0.0, -1.0, 0.0],
                uv: [0.0, 1.0],
            },
        ];

        let indices: Vec<u8> = vec![
            0, 1, 2, 0, 2, 3, // front face
            4, 5, 6, 4, 6, 7, // right
            8, 9, 10, 8, 10, 11, // back
            12, 13, 14, 12, 14, 15, // left
            16, 17, 18, 16, 18, 19, // top
            20, 21, 22, 20, 22, 23, // bottom
        ];

        Self { vertices, indices }
    }
}