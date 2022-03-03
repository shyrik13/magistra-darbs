use web_sys::WebGlRenderingContext as GL;
use web_sys::*;
use crate::model::Image;

pub struct Texture {
    pub gl: GL,
    pub handle: WebGlTexture,
    pub width: u32,
    pub height: u32,
}

impl Texture {
    /// Returns a new texture uploading data from the specified image
    pub fn from_image(gl: GL, image: &Image) -> Self {
        let handle = gl.create_texture().expect("Failed to create texture");

        let mut texture = Self {
            gl,
            handle,
            width: 0,
            height: 0,
        };

        texture.bind();

        texture
            .gl
            .tex_parameteri(GL::TEXTURE_2D, GL::TEXTURE_MIN_FILTER, GL::LINEAR as i32);
        texture
            .gl
            .tex_parameteri(GL::TEXTURE_2D, GL::TEXTURE_MAG_FILTER, GL::LINEAR as i32);

        //    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        texture
            .gl
            .tex_parameteri(GL::TEXTURE_2D, GL::TEXTURE_WRAP_S, GL::CLAMP_TO_EDGE as i32);
        texture
            .gl
            .tex_parameteri(GL::TEXTURE_2D, GL::TEXTURE_WRAP_T, GL::CLAMP_TO_EDGE as i32);

        texture.upload(Some(&image.data), image.width, image.height);

        texture
    }

    /// Returns a new default texture with a default image (2x2 red, blue, green, white)
    pub fn new(gl: GL) -> Self {
        let pixels = [
            255u8, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 255, 255,
        ];
        let image = Image::from_raw(&pixels, 2, 2);
        Self::from_image(gl, &image)
    }

    pub fn bind(&self) {
        //self.gl.active_texture(GL::TEXTURE0);
        self.gl.bind_texture(GL::TEXTURE_2D, Some(&self.handle));
    }

    /// Uploads pixels data to the texture memory in the GPU
    pub fn upload(&mut self, pixels: Option<&[u8]>, width: u32, height: u32) {
        self.gl
            .tex_image_2d_with_i32_and_i32_and_i32_and_format_and_type_and_opt_u8_array(
                GL::TEXTURE_2D,
                0,
                GL::RGBA as i32,
                width as i32,
                height as i32,
                0,
                GL::RGBA,
                GL::UNSIGNED_BYTE,
                pixels,
            )
            .expect("Failed to upload texture data");

        self.width = width;
        self.height = height;
    }
}

impl Drop for Texture {
    fn drop(&mut self) {
        self.gl.delete_texture(Some(&self.handle))
    }
}