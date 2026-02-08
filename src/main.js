import { perspective } from './math.js';
import { Camera } from './camera.js';
import {
  createPhongProgram,
  getPhongLocations,
  setPhongMatrices,
  setPhongCamera,
  setPhongAmbient,
  setPhongMaterial,
  setPhongPointLight,
  setPhongDirectionalLight,
  normalMatrixFromMat4,
} from './phong.js';
import { createCorridorRoomScenario, createVAO } from './scenario.js';

const canvas = document.getElementById("glCanvas");
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const gl = canvas.getContext("webgl2");
if (!gl) alert("WebGL2 não suportado");

const program = createPhongProgram(gl);
gl.useProgram(program);
const locs = getPhongLocations(gl, program);

// Cenário corredor → sala
const scenario = createCorridorRoomScenario(gl, {
  corridorWidth: 6,
  corridorLength: 18,
  roomSize: 22,
  wallHeight: 4,
  doorWidth: 2.2,
  doorHeight: 3.0,
});

const parts = [
  {
    name: 'floor',
    vao: createVAO(gl, scenario.meshes.floor),
    material: { baseColor: [0.35, 0.18, 0.08], ka: 0.35, kd: 0.75, ks: 0.08, shininess: 12 },
  },
  {
    name: 'walls',
    vao: createVAO(gl, scenario.meshes.walls),
    material: { baseColor: [0.45, 0.45, 0.48], ka: 0.25, kd: 0.7, ks: 0.15, shininess: 22 },
  },
  {
    name: 'ceiling',
    vao: createVAO(gl, scenario.meshes.ceiling),
    material: { baseColor: [0.08, 0.08, 0.22], ka: 0.35, kd: 0.6, ks: 0.12, shininess: 18 },
  },
  {
    name: 'door',
    vao: createVAO(gl, scenario.meshes.door),
    material: { baseColor: [0.35, 0.20, 0.10], ka: 0.35, kd: 0.65, ks: 0.18, shininess: 28 },
  },
];

const camera = new Camera(canvas, {
  position: [0, 1.6, 1.5],
  collisionFn: scenario.checkCollision,
  radius: 0.35,
});

const IDENTITY_MODEL = new Float32Array([
  1, 0, 0, 0,
  0, 1, 0, 0,
  0, 0, 1, 0,
  0, 0, 0, 1,
]);

gl.enable(gl.DEPTH_TEST);
gl.clearColor(0.1, 0.1, 0.1, 1.0);

function getMovingLightPosition(timeMs) {
  const t = timeMs * 0.001;
  // Passeia do corredor para a sala e oscila em X
  const zBase = 2 + (Math.sin(t * 0.35) * 0.5 + 0.5) * (scenario.params.corridorLength + scenario.params.roomSize - 4);
  const x = Math.sin(t * 0.9) * 2.0;
  const y = scenario.params.wallHeight - 0.6;
  return [x, y, zBase];
}

function render(time = 0) {
  camera.updatePosition();

  const projection = perspective(
    Math.PI / 4,
    canvas.width / canvas.height,
    0.1,
    200
  );
  
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // Limpa o frame

  const view = camera.getViewMatrix();
  const lightPos = getMovingLightPosition(time);

  setPhongAmbient(gl, locs, [0.10, 0.10, 0.12]);
  setPhongCamera(gl, locs, camera.position);
  setPhongDirectionalLight(gl, locs, { enabled: false });
  setPhongPointLight(gl, locs, {
    position: lightPos,
    color: [1.0, 0.95, 0.85],
    intensity: 1.5,
    attenuation: [1.0, 0.08, 0.02],
    enabled: true,
  });

  // Matrizes comuns (model = identidade)
  setPhongMatrices(gl, locs, {
    model: IDENTITY_MODEL,
    view,
    projection,
    normalMatrix: normalMatrixFromMat4(IDENTITY_MODEL),
  });

  for (const part of parts) {
    setPhongMaterial(gl, locs, part.material);
    gl.bindVertexArray(part.vao.vao);
    gl.drawArrays(gl.TRIANGLES, 0, part.vao.vertexCount);
  }
  gl.bindVertexArray(null);
  
  requestAnimationFrame(render);
}

render();