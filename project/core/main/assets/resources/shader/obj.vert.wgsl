struct Uniforms {
    modelMatrix : mat4x4<f32>;
    viewProjectionMatrix : mat4x4<f32>;
    normalModelMatrix : mat4x4<f32>;
};

[[binding(0), group(0)]] var<uniform> uniforms : Uniforms;

struct Output {
    [[builtin(position)]] Position : vec4<f32>;
    [[location(0)]] vPosition : vec3<f32>;
    [[location(1)]] vNormal : vec3<f32>;
    [[location(2)]] vUV : vec2<f32>;
};

[[stage(vertex)]]
fn main([[location(0)]] position: vec4<f32>, [[location(1)]] normal: vec3<f32>, [[location(2)]] uv: vec2<f32>) -> Output {
    var output: Output;

    let modelPosition:vec4<f32> = uniforms.modelMatrix * position;
    output.vPosition = modelPosition.xyz;
    let v4Normal:vec4<f32> = vec4<f32>(normal.x, normal.y, normal.z, 1.);
    output.vNormal = vec4<f32>(uniforms.normalModelMatrix * v4Normal).xyz;
    output.vUV = uv;
    output.Position = uniforms.viewProjectionMatrix * modelPosition;

    return output;
}