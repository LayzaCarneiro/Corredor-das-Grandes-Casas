export const vsSource = `#version 300 es
layout(location = 0) in vec3 aPosition;

uniform mat4 uModel; 
uniform mat4 uView; 
uniform mat4 uProjection;

void main() { 
    gl_Position = uProjection * uView * uModel * vec4(aPosition, 1.0); 
}
`;

export const fsSource = `#version 300 es
precision highp float;
out vec4 fragColor;

void main() { 
    fragColor = vec4(1.0, 1.0, 1.0, 1.0); 
}
`;

export function createProgram(gl, vsSource, fsSource) {
  const createShader = (type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader));
    }
    return shader;
  };

  const program = gl.createProgram();
  gl.attachShader(program, createShader(gl.VERTEX_SHADER, vsSource));
  gl.attachShader(program, createShader(gl.FRAGMENT_SHADER, fsSource));
  gl.linkProgram(program);
  return program;
}