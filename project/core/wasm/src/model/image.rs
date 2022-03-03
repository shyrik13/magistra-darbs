pub struct Image {
    pub data: Vec<u8>,
    pub width: u32,
    pub height: u32,
}

impl Image {
    /// Creates a default image of one white pixel
    pub fn new() -> Self {
        Self {
            data: vec![255, 255, 255, 255],
            width: 1,
            height: 1,
        }
    }

    /// Creates an image from raw data
    pub fn from_raw(data: &[u8], width: u32, height: u32) -> Self {
        Self::from_vec(data.into(), width, height)
    }

    /// Creates an image from raw data as vector
    pub fn from_vec(data: Vec<u8>, width: u32, height: u32) -> Self {
        let channels = 4; // RGBA
        assert!(data.len() as u32 == width * height * channels);
        Self {
            data,
            width,
            height,
        }
    }

    /// Creates an image from png data
    pub fn from_png(png_data: &[u8]) -> Self {
        let decoder = png::Decoder::new(png_data);
        let (info, mut reader) = decoder.read_info().expect("Failed reading png info");
        let mut data: Vec<u8> = vec![0; info.buffer_size()];
        reader
            .next_frame(data.as_mut_slice())
            .expect("Failed to read png frame");

        Image::from_vec(data, info.width, info.height)
    }
}