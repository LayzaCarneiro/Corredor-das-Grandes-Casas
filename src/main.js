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
import { createCorridorRoomScenario, createVAO, loadTexture } from './scenario.js';
import { loadOBJ } from './obj.js';

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
    useTexture: false,
  },
  {
    name: 'carpet',
    vao: createVAO(gl, scenario.meshes.carpet),
    material: { baseColor: [0.75, 0.08, 0.10], ka: 0.35, kd: 0.85, ks: 0.05, shininess: 8 },
  },
  {
    name: 'walls',
    vao: createVAO(gl, scenario.meshes.walls),
    material: { baseColor: [0.45, 0.45, 0.48], ka: 0.25, kd: 0.7, ks: 0.15, shininess: 22 },
    useTexture: false,
  },
  {
    name: 'ceiling',
    vao: createVAO(gl, scenario.meshes.ceiling),
    material: { baseColor: [0.08, 0.08, 0.22], ka: 0.35, kd: 0.6, ks: 0.12, shininess: 18 },
    useTexture: false,
  },
  {
    name: 'door',
    vao: createVAO(gl, scenario.meshes.door),
    material: { baseColor: [0.35, 0.20, 0.10], ka: 0.35, kd: 0.65, ks: 0.18, shininess: 28 },
    useTexture: false,
  },
];

// Carregar trono OBJ e textura
let ironThroneObj = null;
let ironThroneTexture = null;
let ironThroneWorldAabbXZ = null;

const THRONE_SCALE = 1.5;
const THRONE_POS_X = 0.0;
function getThronePosZ() {
  return scenario.params.corridorLength + scenario.params.roomSize - 2.0;
}

function computeLocalAabbXZ(positions) {
  let minX = Infinity, maxX = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const z = positions[i + 2];
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  }
  return { minX, maxX, minZ, maxZ };
}

function shrinkAabbXZ(aabb, factor = 0.85) {
  const cx = (aabb.minX + aabb.maxX) * 0.5;
  const cz = (aabb.minZ + aabb.maxZ) * 0.5;
  const ex = (aabb.maxX - aabb.minX) * 0.5 * factor;
  const ez = (aabb.maxZ - aabb.minZ) * 0.5 * factor;
  return { minX: cx - ex, maxX: cx + ex, minZ: cz - ez, maxZ: cz + ez };
}

function transformAabbXZ(localAabb, { scale, tx, tz }) {
  // Model do trono usa escala negativa em X/Z (rotação 180° no Y).
  const sx = -scale;
  const sz = -scale;

  const x1 = sx * localAabb.minX + tx;
  const x2 = sx * localAabb.maxX + tx;
  const z1 = sz * localAabb.minZ + tz;
  const z2 = sz * localAabb.maxZ + tz;

  return {
    minX: Math.min(x1, x2),
    maxX: Math.max(x1, x2),
    minZ: Math.min(z1, z2),
    maxZ: Math.max(z1, z2),
  };
}

function circleIntersectsAabbXZ(cx, cz, r, aabb) {
  const closestX = Math.max(aabb.minX, Math.min(cx, aabb.maxX));
  const closestZ = Math.max(aabb.minZ, Math.min(cz, aabb.maxZ));
  const dx = cx - closestX;
  const dz = cz - closestZ;
  return (dx * dx + dz * dz) < (r * r);
}

async function loadIronThrone() {
  try {
    const objData = await loadOBJ('models/iron_throne.obj');
    ironThroneObj = {
      vao: createVAO(gl, objData),
      material: { 
        baseColor: [0.8, 0.8, 0.8], 
        ka: 0.3, 
        kd: 0.7, 
        ks: 0.5, 
        shininess: 159.999985 
      },
      useTexture: true,
    };
    ironThroneTexture = loadTexture(gl, 'models/IronThrone_Diff.vtf.png');

    // Calcula AABB de colisão em XZ com base no OBJ (no espaço local) e aplica o mesmo
    // transform usado no render (escala + rotação 180° via escala negativa + translação).
    const localAabb = shrinkAabbXZ(computeLocalAabbXZ(objData.positions), 0.82);
    ironThroneWorldAabbXZ = transformAabbXZ(localAabb, {
      scale: THRONE_SCALE,
      tx: THRONE_POS_X,
      tz: getThronePosZ(),
    });

    console.log('Trono de ferro carregado com sucesso');
  } catch (error) {
    console.error('Erro ao carregar trono:', error);
  }
}

loadIronThrone();

// Configurar áudio de fundo
const backgroundAudio = new Audio('audio/YTDown.com_YouTube_Game-of-Thrones-Tema-de-Abertura-Oppenin_Media_8wYhc8xpBkc_001_1080p.mp4');
backgroundAudio.loop = true;
backgroundAudio.volume = 0.3;

// Iniciar áudio após interação do usuário
document.addEventListener('click', () => {
  backgroundAudio.play().catch(e => console.log('Erro ao reproduzir áudio:', e));
}, { once: true });


const camera = new Camera(canvas, {
  position: [0, 1.6, START_Z],
  collisionFn: (x, z, radius) => {
    if (scenario.checkCollision(x, z, radius)) return true;
    if (ironThroneWorldAabbXZ && circleIntersectsAabbXZ(x, z, radius, ironThroneWorldAabbXZ)) return true;
    return false;
  },
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
    gl.uniform1i(locs.uUseTexture, 0); // Sem textura para partes do cenário
    gl.bindVertexArray(part.vao.vao);
    gl.drawArrays(gl.TRIANGLES, 0, part.vao.vertexCount);
  }

  // Desenhar trono de ferro no final da sala
  if (ironThroneObj && ironThroneTexture) {
    // Posicionar trono no final da sala
    const throneZ = getThronePosZ();
    // Escala maior (1.5) + Rotação de 180° no eixo Y para virar o trono
    const throneModel = new Float32Array([
      -THRONE_SCALE, 0, 0, 0,
      0, THRONE_SCALE, 0, 0,
      0, 0, -THRONE_SCALE, 0,
      THRONE_POS_X, 0, throneZ, 1,
    ]);

    setPhongMatrices(gl, locs, {
      model: throneModel,
      view,
      projection,
      normalMatrix: normalMatrixFromMat4(throneModel),
    });

    setPhongMaterial(gl, locs, ironThroneObj.material);
    
    // Ativar textura
    gl.uniform1i(locs.uUseTexture, 1);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, ironThroneTexture);
    gl.uniform1i(locs.uTexture, 0);

    gl.bindVertexArray(ironThroneObj.vao.vao);
    gl.drawArrays(gl.TRIANGLES, 0, ironThroneObj.vao.vertexCount);
  }

  gl.bindVertexArray(null);
  
  requestAnimationFrame(render);
}

render();