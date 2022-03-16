use na::{Vector2, Vector3};
use nalgebra as na;
use std::ops::{Sub, Mul};

pub fn obj_file_data_to_vertex_vector_data(obj_file_data: &str) -> (Vec<f32>, Vec<f32>, Vec<f32>, Vec<f32>, i32, i32) {
    let mut vec_positions: Vec<[f32; 3]> = Vec::new();
    let mut vec_uv: Vec<[f32; 2]> = Vec::new();
    let mut vec_normals: Vec<[f32; 3]> = Vec::new();

    let mut vec_obj_vertices: Vec<f32> = Vec::new();
    let mut vec_obj_uvs: Vec<f32> = Vec::new();
    let mut vec_obj_tangents: Vec<f32> = Vec::new();
    let mut vec_obj_bitangent: Vec<f32> = Vec::new();

    let mut triangles = 0;
    let mut vertex_count = 0;

    // Dummy
    vec_positions.push( [0.0, 0.0, 0.0]);
    vec_uv.push([0.0, 0.0]);
    vec_normals.push([0.0, 0.0, 0.0]);

    let lines = obj_file_data.split("\n");

    for line in lines {
        // let line = line.unwrap();
        let vec_split: Vec<&str> = line.split_whitespace().collect();
        if vec_split[0] == "v" {
            let v1: f32 = vec_split[1].parse().unwrap();
            let v2: f32 = vec_split[2].parse().unwrap();
            let v3: f32 = vec_split[3].parse().unwrap();
            vec_positions.push([v1, v2, v3]);
        } else if vec_split[0] == "vt" {
            let v1: f32 = vec_split[1].parse().unwrap();
            let v2: f32 = vec_split[2].parse().unwrap();
            vec_uv.push([v1, v2]);
        } else if vec_split[0] == "vn" {
            let v1: f32 = vec_split[1].parse().unwrap();
            let v2: f32 = vec_split[2].parse().unwrap();
            let v3: f32 = vec_split[3].parse().unwrap();
            vec_normals.push([v1, v2, v3]);
        } else if vec_split[0] == "f" {
            triangles += 1;

            let mut vs = vec![];
            let mut uvs = vec![];
            let mut temp_vec_vertex = vec![];

            for i in 1..vec_split.len() {
                let vec_split: Vec<&str> = vec_split[i].split("/").collect();

                let ind1: usize = vec_split[0].parse().unwrap();
                let ind2: usize = vec_split[1].parse().unwrap();
                let ind3: usize = vec_split[2].parse().unwrap();

                vs.push(Vector3::new(vec_positions[ind1][0], vec_positions[ind1][1], vec_positions[ind1][2]));
                uvs.push(Vector2::new(vec_uv[ind2][0], vec_uv[ind2][1]));

                temp_vec_vertex.push((vec_positions[ind1], vec_uv[ind2], vec_normals[ind3]));

                vertex_count += 1;
            }

            // http://www.opengl-tutorial.org/intermediate-tutorials/tutorial-13-normal-mapping/#computing-the-tangents-and-bitangents
            let delta_pos_1 = vs[1].sub(&vs[0]);
            let delta_pos_2 = vs[2].sub(&vs[0]);

            let delta_uv_1 = uvs[1].sub(&uvs[0]);
            let delta_uv_2 = uvs[2].sub(&uvs[0]);

            let r = 1.0 / (&delta_uv_1.data[0] * &delta_uv_2.data[1] - &delta_uv_1.data[1] * &delta_uv_2.data[0]);

            // delta_pos_1 * delta_uv_2.y
            let tangent_mul_1 = delta_pos_1.mul(delta_uv_2.data[1].to_owned());
            // delta_pos_2 * delta_uv_1.y
            let tangent_mul_2 = delta_pos_2.mul(delta_uv_1.data[1].to_owned());
            // (delta_pos_1 * delta_uv_2.y - delta_pos_2 * delta_uv_1.y) * r
            let tangent_sub = tangent_mul_1.sub(tangent_mul_2);
            let res = tangent_sub.mul(r.to_owned());
            let tangent = [res.data[0], res.data[1], res.data[2]];

            // delta_pos_2 * delta_uv_1.x
            let bitangent_mul_1 = delta_pos_2.mul(delta_uv_1.data[0].to_owned());
            // delta_pos_1 * delta_uv_2.x
            let bitangent_mul_2 = delta_pos_1.mul(delta_uv_2.data[0].to_owned());
            // (delta_pos_2 * delta_uv_1.x - delta_pos_1 * delta_uv_2.x) * r
            let bitangent_sub = bitangent_mul_1.sub(bitangent_mul_2);
            let res = bitangent_sub.mul(r.to_owned());
            let bitangent = [res.data[0], res.data[1], res.data[2]];

            for i in 0..temp_vec_vertex.len() {
                let temp_vertex = temp_vec_vertex[i];

                vec_obj_vertices.push(temp_vertex.0[0]);
                vec_obj_vertices.push(temp_vertex.0[1]);
                vec_obj_vertices.push(temp_vertex.0[2]);

                vec_obj_uvs.push(temp_vertex.1[0]);
                vec_obj_uvs.push(temp_vertex.1[1]);

                vec_obj_tangents.push(tangent[0]);
                vec_obj_tangents.push(tangent[1]);
                vec_obj_tangents.push(tangent[2]);

                vec_obj_bitangent.push(bitangent[0]);
                vec_obj_bitangent.push(bitangent[1]);
                vec_obj_bitangent.push(bitangent[2]);
            }

        }
    }

    (vec_obj_vertices, vec_obj_uvs, vec_obj_tangents, vec_obj_bitangent, triangles, vertex_count)
}