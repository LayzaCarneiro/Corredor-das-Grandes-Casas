/**
 * shaders.js
 * Utilitários para compilação e criação de programas de shader no WebGL 2.
 */

// Shaders básicos (Fallbacks caso o carregamento principal falhe)
export const vsSource = `#version 300 es
layout(location = 0) in vec3 aPosition;
uniform mat4 uModel, uView, uProjection;
void main() { 
    gl_Position = uProjection * uView * uModel * vec4(aPosition, 1.0); 
}`;

export const fsSource = `#version 300 es
precision highp float;
out vec4 fragColor;
void main() { fragColor = vec4(1.0, 1.0, 1.0, 1.0); }`;

/**
 * Cria um programa shader completo a partir das fontes de Vertex e Fragment.
 */
export function createProgram(gl, vsSource, fsSource) {
  const vShader = compileShader(gl, gl.VERTEX_SHADER, vsSource);
  const fShader = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);

  const program = gl.createProgram();
  gl.attachShader(program, vShader);
  gl.attachShader(program, fShader);
  gl.linkProgram(program);

  // Verifica se o link foi bem sucedido
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const msg = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`Erro ao linkar programa: ${msg}`);
  }

  // Uma vez linkado, os shaders individuais podem ser deletados para liberar memória
  gl.deleteShader(vShader);
  gl.deleteShader(fShader);

  return program;
}

/**
 * Compila um shader individual (Vertex ou Fragment).
 */
function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const msg = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    const typeStr = type === gl.VERTEX_SHADER ? 'VERTEX' : 'FRAGMENT';
    throw new Error(`Erro de compilação no shader ${typeStr}: ${msg}`);
  }
  return shader;
}