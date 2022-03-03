use crate::model::Texture;
use web_sys::*;

pub struct Framebuffer {
    pub frame: Option<WebGlFramebuffer>,
    pub color: Option<WebGlRenderbuffer>,
    pub depth: Option<WebGlRenderbuffer>,
    pub texture: Option<Texture>,
}