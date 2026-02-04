import { perspective } from './math.js';
import { vsSource, fsSource, createProgram } from './shaders.js';
import { Camera } from './camera.js';

const canvas = document.getElementById("glCanvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const gl = canvas.getContext("webgl2");
if (!gl) alert("WebGL2 não suportado");

const program = createProgram(gl, vsSource, fsSource);
gl.useProgram(program);

// Locations
const uModel = gl.getUniformLocation(program, "uModel");
const uView = gl.getUniformLocation(program, "uView");
const uProjection = gl.getUniformLocation(program, "uProjection");

// Geometria (Cubo)
const vertices = new Float32Array([
  // frente
  -0.5, -0.5,  0.5,
   0.5, -0.5,  0.5,
   0.5,  0.5,  0.5,
  -0.5, -0.5,  0.5,
   0.5,  0.5,  0.5,
  -0.5,  0.5,  0.5,

  // trás
  -0.5, -0.5, -0.5,
  -0.5,  0.5, -0.5,
   0.5,  0.5, -0.5,
  -0.5, -0.5, -0.5,
   0.5,  0.5, -0.5,
   0.5, -0.5, -0.5,

  // esquerda
  -0.5, -0.5, -0.5,
  -0.5, -0.5,  0.5,
  -0.5,  0.5,  0.5,
  -0.5, -0.5, -0.5,
  -0.5,  0.5,  0.5,
  -0.5,  0.5, -0.5,

  // direita
   0.5, -0.5, -0.5,
   0.5,  0.5, -0.5,
   0.5,  0.5,  0.5,
   0.5, -0.5, -0.5,
   0.5,  0.5,  0.5,
   0.5, -0.5,  0.5,

  // topo
  -0.5,  0.5, -0.5,
  -0.5,  0.5,  0.5,
   0.5,  0.5,  0.5,
  -0.5,  0.5, -0.5,
   0.5,  0.5,  0.5,
   0.5,  0.5, -0.5,

  // base
  -0.5, -0.5, -0.5,
   0.5, -0.5,  0.5,
  -0.5, -0.5,  0.5,
  -0.5, -0.5, -0.5,
   0.5, -0.5, -0.5,
   0.5, -0.5,  0.5,
]);

const vao = gl.createVertexArray();
gl.bindVertexArray(vao);
const vbo = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
gl.enableVertexAttribArray(0);
gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

const camera = new Camera(canvas);

// Matriz Model (estática neste exemplo)
const angle = Math.PI / 6;
const cos = Math.cos(angle);
const sin = Math.sin(angle);
const model = new Float32Array([
  Math.cos(angle), 0, Math.sin(angle), 0,
  0,               1, 0,               0,
 -Math.sin(angle), 0, Math.cos(angle), 0,
  0,               0, 0,               1
]);

const projection = perspective(
  Math.PI / 4,
  canvas.width / canvas.height,
  0.1,
  100
);

gl.uniformMatrix4fv(uModel, false, model);
gl.uniformMatrix4fv(uProjection, false, projection);

gl.enable(gl.DEPTH_TEST);
gl.clearColor(0.1, 0.1, 0.1, 1.0);

function render() {
  camera.updatePosition();
  
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // Limpa o frame
  
  // Atualiza a View Matrix a cada frame com a posição da câmera
  gl.uniformMatrix4fv(uView, false, camera.getViewMatrix());

  gl.bindVertexArray(vao);
  gl.drawArrays(gl.TRIANGLES, 0, 36);
  
  requestAnimationFrame(render);
}

render();