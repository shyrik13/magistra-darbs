precision highp float;

attribute vec3 vert_pos;
attribute vec2 vert_uv;
attribute vec3 vert_tang;
attribute vec3 vert_bitang;
//attribute vec3 vert_normal;

uniform mat4 model_view;
uniform mat4 perspective;
// uniform mat4 norm_mtx;
// uniform mat4 proj_mtx;

varying vec2 frag_uv;
varying vec3 ts_light_pos; // Tangent space values
varying vec3 ts_view_pos;  //
varying vec3 ts_frag_pos;  //

mat3 transpose(in mat3 inMatrix)
{
    vec3 i0 = inMatrix[0];
    vec3 i1 = inMatrix[1];
    vec3 i2 = inMatrix[2];

    mat3 outMatrix = mat3(
    vec3(i0.x, i1.x, i2.x),
    vec3(i0.y, i1.y, i2.y),
    vec3(i0.z, i1.z, i2.z)
    );

    return outMatrix;
}

float det(mat2 matrix) {
    return matrix[0].x * matrix[1].y - matrix[0].y * matrix[1].x;
}

mat3 inverse(mat3 matrix) {
    vec3 row0 = matrix[0];
    vec3 row1 = matrix[1];
    vec3 row2 = matrix[2];

    vec3 minors0 = vec3(
    det(mat2(row1.y, row1.z, row2.y, row2.z)),
    det(mat2(row1.z, row1.x, row2.z, row2.x)),
    det(mat2(row1.x, row1.y, row2.x, row2.y))
    );
    vec3 minors1 = vec3(
    det(mat2(row2.y, row2.z, row0.y, row0.z)),
    det(mat2(row2.z, row2.x, row0.z, row0.x)),
    det(mat2(row2.x, row2.y, row0.x, row0.y))
    );
    vec3 minors2 = vec3(
    det(mat2(row0.y, row0.z, row1.y, row1.z)),
    det(mat2(row0.z, row0.x, row1.z, row1.x)),
    det(mat2(row0.x, row0.y, row1.x, row1.y))
    );

    mat3 adj = transpose(mat3(minors0, minors1, minors2));

    return (1.0 / dot(row0, minors0)) * adj;
}

void main(void)
{
    gl_Position = perspective * model_view * vec4(vert_pos, 1.0);
    ts_frag_pos = vec3(model_view * vec4(vert_pos, 1.0));
    vec3 vert_norm = cross(vert_bitang, vert_tang);

    mat3 norm_mtx = transpose(inverse(mat3(model_view)));

    vec3 t = normalize(mat3(norm_mtx) * vert_tang);
    vec3 b = normalize(mat3(norm_mtx) * vert_bitang);
    vec3 n = normalize(mat3(norm_mtx) * vert_norm);
    mat3 tbn = transpose(mat3(t, b, n));

    vec3 light_pos = vec3(1, 2, 0);
    ts_light_pos = tbn * light_pos;
    // Our camera is always at the origin
    ts_view_pos = tbn * vec3(0, 0, 0);
    ts_frag_pos = tbn * ts_frag_pos;

    frag_uv = vert_uv;
}