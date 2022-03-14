import {getGPUTier} from "detect-gpu";

const agent = navigator.userAgent;
const history = [];

let gpuTier;

export function getAgent() {
    return agent;
}

export async function getGpuTier() {
    gpuTier = await getGPUTier();
    return gpuTier;
}

export function save(data){
    return history.push(data);
}
