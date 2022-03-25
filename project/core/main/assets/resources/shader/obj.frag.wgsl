struct Uniforms {
    eyePosition : vec4<f32>;
    lightPosition : vec4<f32>;
};
[[binding(1), group(0)]] var<uniform> uniforms : Uniforms;
[[binding(2), group(0)]] var textureSampler : sampler;
[[binding(3), group(0)]] var textureData : texture_2d<f32>;

struct Input {
    [[location(0)]] vPosition : vec3<f32>;
    [[location(1)]] vNormal : vec3<f32>;
    [[location(2)]] vUV : vec2<f32>;
};

[[stage(fragment)]]
fn main(input: Input) -> [[location(0)]] vec4<f32> {
    let surfaceColor:vec3<f32> = (textureSample(textureData, textureSampler, input.vUV)).rgb;
    let normal:vec3<f32> = normalize(input.vNormal);
    let eyeVec:vec3<f32> = normalize(uniforms.eyePosition.xyz - input.vPosition);
    let incidentVec:vec3<f32> = normalize(input.vPosition - uniforms.lightPosition.xyz);
    let lightVec:vec3<f32> = -incidentVec;
    let diffuse:f32 = max(dot(lightVec, normal), 0.0);
    let highlight:f32 = pow(max(dot(eyeVec, reflect(incidentVec, normal)), 0.0), 100.0);
    let ambient:f32 = 0.1;
    return vec4<f32>(surfaceColor * (diffuse + highlight + ambient), 1.0);
}