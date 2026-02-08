/*
 ===============================
        VERTEX SHADER
 ===============================

Responsável por transformar cada vértice do objeto
aplicando as matrizes:

Model      -> posiciona o objeto no mundo
View       -> posiciona a câmera
Projection -> cria a perspectiva

Pipeline:
Objeto → Model → View → Projection → Tela
*/

export const vsSource = `#version 300 es
layout(location = 0) in vec3 aPosition;

uniform mat4 uModel; 
uniform mat4 uView; 
uniform mat4 uProjection;

void main() { 
    gl_Position = uProjection * uView * uModel * vec4(aPosition, 1.0); 
}
`;


/*
 ===============================
        FRAGMENT SHADER
 ===============================

Responsável por definir a cor final
de cada fragmento (pixel).

Atualmente:
Cor branca fixa (RGBA)
*/

export const fsSource = `#version 300 es
precision highp float;

out vec4 fragColor;

void main() { 
    fragColor = vec4(1.0, 1.0, 1.0, 1.0); 
}
`;


/*
 ===============================
    CRIAÇÃO DO PROGRAMA SHADER
 ===============================

1. Compila Vertex Shader
2. Compila Fragment Shader
3. Linka ambos em um programa WebGL
*/

export function createProgram(gl, vsSource, fsSource) {

  // Função auxiliar para compilar shader
  const createShader = (type, source) => {

    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    // Verifica erro de compilação
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error("Erro ao compilar shader:");
      console.error(gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  };

  const vertexShader = createShader(gl.VERTEX_SHADER, vsSource);
  const fragmentShader = createShader(gl.FRAGMENT_SHADER, fsSource);

  if (!vertexShader || !fragmentShader) {
    console.error("Falha na criação dos shaders.");
    return null;
  }

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  // Verifica erro de link
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Erro ao linkar programa:");
    console.error(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  return program;
}
