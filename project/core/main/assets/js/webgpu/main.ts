import { LightInputs } from './shaders';
import { CreateShapeWithTexture } from './texture';
import { CubeData } from './vertex_data';

const CreateShape = async (ul:number, vl:number, li:LightInputs, textureFile:string, 
    addressModeU:GPUAddressMode, addressModeV:GPUAddressMode, isAnimation:boolean) => {
    const data = CubeData(ul, vl);
    await CreateShapeWithTexture(data.positions, data.normals, data.uvs, textureFile, addressModeU, addressModeV, li, isAnimation);
}

let textureFile = 'brick.png';
let addressModeU = 'repeat' as GPUAddressMode;
let addressModeV = 'repeat' as GPUAddressMode;
let li:LightInputs = {};
let isAnimation = true;
let ul = 1;
let vl = 1;

export default function init() {
    CreateShape(ul, vl, li, textureFile, addressModeU, addressModeV, isAnimation);
}

function windowResize() {
    CreateShape(ul, vl, li, textureFile, addressModeU, addressModeV, isAnimation);
};
window.addEventListener('resize', windowResize);