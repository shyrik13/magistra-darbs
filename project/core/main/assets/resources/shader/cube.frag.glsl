precision highp float;

uniform sampler2D tex_norm;
uniform sampler2D tex_diffuse;

varying vec2 frag_uv;
varying vec3 ts_light_pos;
varying vec3 ts_view_pos;
varying vec3 ts_frag_pos;

void main(void)
{
    vec3 light_dir = normalize(ts_light_pos - ts_frag_pos);
    vec3 view_dir = normalize(ts_view_pos - ts_frag_pos);

    // Only perturb the texture coordinates if a parallax technique is selected
    vec2 uv = frag_uv;

    vec3 albedo = texture2D(tex_diffuse, uv).rgb;
    vec3 ambient = 0.7 * albedo;

    // Normal mapping
    vec3 norm = normalize(texture2D(tex_norm, uv).rgb * 2.0 - 1.0);
    float diffuse = max(dot(light_dir, norm), 0.0);
    gl_FragColor = vec4(diffuse * albedo + ambient, 1.0);
}