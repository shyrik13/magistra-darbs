// #version 300 es

precision mediump float;
attribute vec3 vertPosition;
attribute vec3 vertColor;
uniform vec3 colorShift;
varying vec3 fragColor;

void main() {
  fragColor = vertColor * colorShift;
  gl_Position = vec4(vertPosition, 1.0);
  // gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
}