const canvas = document.getElementById("glCanvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

function perspective(fovy, aspect, near, far) {
  const f = 1.0 / Math.tan(fovy / 2);
  return new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far + near) / (near - far), -1,
    0, 0, (2 * far * near) / (near - far), 0
  ]);
}

const gl = canvas.getContext("webgl2");
if (!gl) {
  alert("WebGL2 não suportado");
}

// Vertex Shader
const vsSource = `#version 300 es
layout(location = 0) in vec3 aPosition;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;

void main() {
  gl_Position = uProjection * uView * uModel * vec4(aPosition, 1.0);
}
`;

// Fragment Shader
const fsSource = `#version 300 es
precision highp float;
out vec4 fragColor;

void main() {
  fragColor = vec4(1.0, 1.0, 1.0, 1.0);
}
`;

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
}

const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);

const program = gl.createProgram();
gl.attachShader(program, vs);
gl.attachShader(program, fs);
gl.linkProgram(program);
gl.useProgram(program);

const uModel = gl.getUniformLocation(program, "uModel");
const uView = gl.getUniformLocation(program, "uView");
const uProjection = gl.getUniformLocation(program, "uProjection");

const angle = Math.PI / 6;
const cos = Math.cos(angle);
const sin = Math.sin(angle);

const model = new Float32Array([
  cos, 0, sin, 0,
  0,   1, 0,   0,
 -sin, 0, cos, 0,
  0,   0, 0,   1
]);

const view = new Float32Array([
  1, 0, 0, 0,
  0, 1, 0, 0,
  0, 0, 1, 0,
  0, 0, -3, 1
]);

const projection = perspective(
  Math.PI / 4,
  canvas.width / canvas.height,
  0.1,
  100
);

gl.uniformMatrix4fv(uModel, false, model);
gl.uniformMatrix4fv(uView, false, view);
gl.uniformMatrix4fv(uProjection, false, projection);

// Cubo
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

// camera
const camera = {
  position: [0, 0, 3],
  yaw: -90,   // olhando pra frente
  pitch: 0,
  speed: 0.05,
  sensitivity: 0.1
};

let keys = {};

window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

canvas.addEventListener("click", () => {
  canvas.requestPointerLock();
});

window.addEventListener("mousemove", e => {
  if (document.pointerLockElement !== canvas) return;

  camera.yaw   += e.movementX * camera.sensitivity;
  camera.pitch -= e.movementY * camera.sensitivity;

  camera.pitch = Math.max(-89, Math.min(89, camera.pitch));
});

function normalize(v) {
  const len = Math.hypot(v[0], v[1], v[2]);
  return [v[0]/len, v[1]/len, v[2]/len];
}

function cross(a, b) {
  return [
    a[1]*b[2] - a[2]*b[1],
    a[2]*b[0] - a[0]*b[2],
    a[0]*b[1] - a[1]*b[0]
  ];
}

function getViewMatrix() {
  const yawRad = camera.yaw * Math.PI / 180;
  const pitchRad = camera.pitch * Math.PI / 180;

  const front = normalize([
    Math.cos(yawRad) * Math.cos(pitchRad),
    Math.sin(pitchRad),
    Math.sin(yawRad) * Math.cos(pitchRad)
  ]);

  const right = normalize(cross(front, [0, 1, 0]));
  const up = cross(right, front);

  return new Float32Array([
    right[0], up[0], -front[0], 0,
    right[1], up[1], -front[1], 0,
    right[2], up[2], -front[2], 0,
    -(
      right[0]*camera.position[0] +
      right[1]*camera.position[1] +
      right[2]*camera.position[2]
    ),
    -(
      up[0]*camera.position[0] +
      up[1]*camera.position[1] +
      up[2]*camera.position[2]
    ),
    (
      front[0]*camera.position[0] +
      front[1]*camera.position[1] +
      front[2]*camera.position[2]
    ),
    1
  ]);
}

function updateCamera() {
  const yawRad = camera.yaw * Math.PI / 180;

  const forward = [
    Math.cos(yawRad),
    0,
    Math.sin(yawRad)
  ];

  const right = [
    -Math.sin(yawRad),
    0,
     Math.cos(yawRad)
  ];

  if (keys["w"]) {
    camera.position[0] += forward[0] * camera.speed;
    camera.position[2] += forward[2] * camera.speed;
  }
  if (keys["s"]) {
    camera.position[0] -= forward[0] * camera.speed;
    camera.position[2] -= forward[2] * camera.speed;
  }
  if (keys["a"]) {
    camera.position[0] -= right[0] * camera.speed;
    camera.position[2] -= right[2] * camera.speed;
  }
  if (keys["d"]) {
    camera.position[0] += right[0] * camera.speed;
    camera.position[2] += right[2] * camera.speed;
  }
}

function render() {
  updateCamera();

  const view = getViewMatrix();
  gl.uniformMatrix4fv(uView, false, view);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.bindVertexArray(vao);
  gl.drawArrays(gl.TRIANGLES, 0, 36);

  requestAnimationFrame(render);
}

render();

// Render
gl.viewport(0, 0, canvas.width, canvas.height);
gl.clearColor(0.1, 0.1, 0.1, 1.0);

gl.enable(gl.DEPTH_TEST);
gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

gl.bindVertexArray(vao);
gl.drawArrays(gl.TRIANGLES, 0, 36);