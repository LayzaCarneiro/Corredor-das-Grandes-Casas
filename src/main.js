import { perspective } from './math.js';
import { Camera } from './camera.js';
import {
  createPhongProgram,
  getPhongLocations,
  setPhongMatrices,
  setPhongCamera,
  setPhongAmbient,
  setPhongMaterial,
  setPhongDirectionalLight,
  setPhongPointLight,
  setPhongSpotLight,
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

// Cenário: corredor longo + sala pequena.
// Meta: ~10s caminhando em linha reta até a sala.
const MOVE_SPEED = 3.0; // unidades/segundo
const TARGET_TIME_TO_ROOM = 10.0; // segundos
const START_Z = 1.5;
// Extra para deixar o corredor bem mais longo (aumenta o tempo até a sala)
const CORRIDOR_EXTRA = 8.0;
const corridorLength = Math.max(10, MOVE_SPEED * TARGET_TIME_TO_ROOM + START_Z + CORRIDOR_EXTRA);

const scenario = createCorridorRoomScenario(gl, {
  corridorWidth: 5,
  corridorLength,
  roomSize: 10,
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
  position: [0, 1.6, START_Z],
  collisionFn: scenario.checkCollision,
  radius: 0.35,
  speed: MOVE_SPEED,
});

const IDENTITY_MODEL = new Float32Array([
  1, 0, 0, 0,
  0, 1, 0, 0,
  0, 0, 1, 0,
  0, 0, 0, 1,
]);

gl.enable(gl.DEPTH_TEST);
gl.clearColor(0.1, 0.1, 0.1, 1.0);

// FOV mais confortável para FPS/corredor
const FOV_DEG = 75;
const FOV_RAD = (FOV_DEG * Math.PI) / 180;

let lastTime = 0;
function render(time = 0) {
  const dt = Math.min(0.05, Math.max(0, (time - lastTime) * 0.001));
  lastTime = time;
  camera.updatePosition(dt);

  const projection = perspective(
    FOV_RAD,
    canvas.width / canvas.height,
    0.1,
    800
  );
  
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // Limpa o frame

  const view = camera.getViewMatrix();
  // Luz na "cabeça" do personagem (campo de luz ao redor, curto alcance)
  const headLightPos = [
    camera.position[0],
    camera.position[1] + 0.10,
    camera.position[2],
  ];

  // Um pouco mais de ambiente pra não ficar "preto" longe, sem lavar o cenário
  setPhongAmbient(gl, locs, [0.03, 0.03, 0.035]);
  setPhongCamera(gl, locs, camera.position);

  // Sem luz direcional (evita iluminar o cenário inteiro sem atenuação)
  setPhongDirectionalLight(gl, locs, { enabled: false });

  // Luz pontual na cabeça: ilumina em 360º perto do jogador, mas cai rápido.
  setPhongPointLight(gl, locs, {
    enabled: true,
    position: headLightPos,
    color: [1.0, 0.98, 0.92],
    intensity: 3.8,
    // Alcance curto/médio: ilumina perto do jogador e cai rápido
    attenuation: [1.0, 0.35, 0.25],
  });

  // Garante que o spotlight não influencie (se estava ligado antes)
  setPhongSpotLight(gl, locs, { enabled: false });

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