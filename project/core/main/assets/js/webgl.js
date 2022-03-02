import init from './webgl/main';

$(document).ready(() => {
    const canvas = document.querySelector('#webgl-canvas')
    init(canvas);
});