struct Uniforms {
    eyePosition : vec4<f32>;
    lightPosition : vec4<f32>;
};
[[binding(1), group(0)]] var<uniform> uniforms : Uniforms;
[[binding(2), group(0)]] var textureSampler : sampler;
[[binding(3), group(0)]] var textureDiffData : texture_2d<f32>;
[[binding(4), group(0)]] var textureNormData : texture_2d<f32>;

struct Input {
    [[location(0)]] vPosition : vec3<f32>;
    [[location(1)]] vNormal : vec3<f32>;
    [[location(2)]] vUV : vec2<f32>;
};

//[[stage(fragment)]]
//fn main(input: Input) -> [[location(0)]] vec4<f32> {
//    let surfaceColor:vec3<f32> = (textureSample(textureData, textureSampler, input.vUV)).rgb;
//    let normal:vec3<f32> = normalize(input.vNormal);
//    let eyeVec:vec3<f32> = normalize(uniforms.eyePosition.xyz - input.vPosition);
//    let incidentVec:vec3<f32> = normalize(input.vPosition - uniforms.lightPosition.xyz);
//    let lightVec:vec3<f32> = -incidentVec;
//    let diffuse:f32 = max(dot(lightVec, normal), 0.0);
//    let highlight:f32 = pow(max(dot(eyeVec, reflect(incidentVec, normal)), 0.0), 100.0);
//    let ambient:f32 = 0.1;
//    return vec4<f32>(surfaceColor * (diffuse + highlight + ambient), 1.0);
//}

fn cotangent_frame(normal: vec3<f32>, pos: vec3<f32>, uv: vec2<f32>) -> mat3x3<f32> {
    let dp1:vec3<f32> = dpdx(pos);
    let dp2:vec3<f32> = dpdy(pos);
    let duv1:vec2<f32> = dpdx(uv);
    let duv2:vec2<f32> = dpdy(uv);
    let dp2perp:vec3<f32> = cross(dp2, normal);
    let dp1perp:vec3<f32> = cross(normal, dp1);
    let T:vec3<f32> = dp2perp * duv1.x + dp1perp * duv2.x;
    let B:vec3<f32> = dp2perp * duv1.y + dp1perp * duv2.y;
    let invmax:f32 = inverseSqrt(max(dot(T, T), dot(B, B)));
    return mat3x3<f32>(T * invmax, B * invmax, normal);
}

[[stage(fragment)]]
fn main(input: Input) -> [[location(0)]] vec4<f32> {
    let specular_color:vec3<f32> = vec3<f32>(1.0, 1.0, 1.0);
    let diffuse_color:vec3<f32> = (textureSample(textureDiffData, textureSampler, input.vUV)).rgb;
    let ambient_color:vec3<f32> = diffuse_color * 0.1;

    let normal_map:vec3<f32> = (textureSample(textureNormData, textureSampler, input.vUV)).rgb;
    let tbn:mat3x3<f32> = cotangent_frame(input.vNormal, input.vPosition, input.vUV);
    let real_normal:vec3<f32> = normalize(tbn * (normal_map * 2.0 - 1.0));

    let diffuse:f32 = max(dot(normalize(real_normal), normalize(uniforms.lightPosition.xyz)), 0.2);

    let camera_dir:vec3<f32> = normalize(uniforms.eyePosition.xyz - input.vPosition);
    let half_direction:vec3<f32> = normalize(normalize(uniforms.lightPosition.xyz) + camera_dir);
    let specular:f32 = pow(max(dot(half_direction, normalize(real_normal)), 0.0), 16.0);

    return vec4<f32>(ambient_color + diffuse * diffuse_color + specular * specular_color, 1.0);
}