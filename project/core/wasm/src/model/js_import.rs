extern crate serde_json;

#[derive(Serialize, Deserialize)]
pub struct JsTextureImage {
    pub id: String,
    pub data: Box<[u8]>
}

#[derive(Serialize, Deserialize)]
pub struct JsShaders {
    pub vert_str: String,
    pub frag_str: String
}

#[derive(Serialize, Deserialize)]
pub struct JsRenderParams {
    pub init_pos: Box<[f32; 3]>,
    pub min_max_x: Box<[f32; 2]>,
    pub min_max_y: Box<[f32; 2]>,
    pub min_max_z: Box<[f32; 2]>,
    pub multiple: bool
}