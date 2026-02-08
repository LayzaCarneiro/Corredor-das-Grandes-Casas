// Importações de utilitários matemáticos, câmera, shader Phong e cenário
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


// ----------------------------------------------------
// Setup inicial do canvas e contexto WebGL2
// ----------------------------------------------------

const canvas = document.getElementById("glCanvas");

// Ajusta canvas para ocupar a tela inteira
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Obtém contexto WebGL2
const gl = canvas.getContext("webgl2");
if (!gl) alert("WebGL2 não suportado");


// ----------------------------------------------------
// Shader Phong
// ----------------------------------------------------

// Cria programa de shader (vertex + fragment)
const program = createPhongProgram(gl);
gl.useProgram(program);

// Obtém localizações de uniforms/atributos
const locs = getPhongLocations(gl, program);


// ----------------------------------------------------
// Configuração do cenário
// ----------------------------------------------------

// Velocidade de movimento da câmera
const MOVE_SPEED = 3.0; // unidades/segundo

// Queremos que o usuário leve ~10s andando até chegar à sala
const TARGET_TIME_TO_ROOM = 10.0;
const START_Z = 1.5;

// Valor extra para deixar o corredor mais longo
const CORRIDOR_EXTRA = 8.0;

// Comprimento final do corredor calculado dinamicamente
const corridorLength = Math.max(
  10,
  MOVE_SPEED * TARGET_TIME_TO_ROOM + START_Z + CORRIDOR_EXTRA
);

// Cria o cenário procedural (corredor + sala)
const scenario = createCorridorRoomScenario(gl, {
  corridorWidth: 5,
  corridorLength,
  roomSize: 10,
  wallHeight: 4,
  doorWidth: 2.2,
  doorHeight: 3.0,
});


// ----------------------------------------------------
// Criação das partes renderizáveis
// Cada parte tem um VAO + material Phong
// ----------------------------------------------------

const parts = [
  {
    name: 'floor',
    vao: createVAO(gl, scenario.meshes.floor),
    material: {
      baseColor: [0.35, 0.18, 0.08],
      ka: 0.35, kd: 0.75, ks: 0.08,
      shininess: 12
    },
  },
  {
    name: 'walls',
    vao: createVAO(gl, scenario.meshes.walls),
    material: {
      baseColor: [0.45, 0.45, 0.48],
      ka: 0.25, kd: 0.7, ks: 0.15,
      shininess: 22
    },
  },
  {
    name: 'ceiling',
    vao: createVAO(gl, scenario.meshes.ceiling),
    material: {
      baseColor: [0.08, 0.08, 0.22],
      ka: 0.35, kd: 0.6, ks: 0.12,
      shininess: 18
    },
  },
  {
    name: 'door',
    vao: createVAO(gl, scenario.meshes.door),
    material: {
      baseColor: [0.35, 0.20, 0.10],
      ka: 0.35, kd: 0.65, ks: 0.18,
      shininess: 28
    },
  },
];


// ----------------------------------------------------
// Configuração da câmera (FPS-style)
// ----------------------------------------------------

const camera = new Camera(canvas, {
  position: [0, 1.6, START_Z], // altura dos "olhos"
  collisionFn: scenario.checkCollision, // função de colisão
  radius: 0.35, // raio do jogador
  speed: MOVE_SPEED,
});


// Matriz identidade para objetos estáticos
const IDENTITY_MODEL = new Float32Array([
  1, 0, 0, 0,
  0, 1, 0, 0,
  0, 0, 1, 0,
  0, 0, 0, 1,
]);

// Ativa teste de profundidade (z-buffer)
gl.enable(gl.DEPTH_TEST);

// Cor de fundo
gl.clearColor(0.1, 0.1, 0.1, 1.0);


// ----------------------------------------------------
// Luz dinâmica (point light animada)
// ----------------------------------------------------

// Faz a luz "andar" pelo cenário ao longo do tempo
function getMovingLightPosition(timeMs) {
  const t = timeMs * 0.001;

  // Oscila em Z entre corredor e sala
  const zBase =
    2 +
    (Math.sin(t * 0.35) * 0.5 + 0.5) *
    (scenario.params.corridorLength + scenario.params.roomSize - 4);

  // Oscila levemente em X
  const x = Math.sin(t * 0.9) * 2.0;

  // Fica próxima ao teto
  const y = scenario.params.wallHeight - 0.6;

  return [x, y, zBase];
}


// ----------------------------------------------------
// Loop de renderização
// ----------------------------------------------------

let lastTime = 0;

function render(time = 0) {

  // Delta time (segundos)
  const dt = Math.min(0.05, Math.max(0, (time - lastTime) * 0.001));
  lastTime = time;

  // Atualiza movimento da câmera
  camera.updatePosition(dt);

  // Matriz de projeção perspectiva
  const projection = perspective(
    Math.PI / 4,                       // FOV 45°
    canvas.width / canvas.height,      // aspect ratio
    0.1,                               // near plane
    800                                // far plane
  );

  // Ajusta viewport e limpa buffers
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Matriz de visão (camera)
  const view = camera.getViewMatrix();

  // Posição atual da luz
  const lightPos = getMovingLightPosition(time);

  // Configura iluminação global
  setPhongAmbient(gl, locs, [0.10, 0.10, 0.12]);
  setPhongCamera(gl, locs, camera.position);

  // Desativa luz direcional
  setPhongDirectionalLight(gl, locs, { enabled: false });

  // Ativa luz pontual animada
  setPhongPointLight(gl, locs, {
    position: lightPos,
    color: [1.0, 0.95, 0.85],
    intensity: 1.5,
    attenuation: [1.0, 0.08, 0.02],
    enabled: true,
  });

  // Envia matrizes comuns (model = identidade)
  setPhongMatrices(gl, locs, {
    model: IDENTITY_MODEL,
    view,
    projection,
    normalMatrix: normalMatrixFromMat4(IDENTITY_MODEL),
  });

  // Renderiza cada parte do cenário
  for (const part of parts) {
    setPhongMaterial(gl, locs, part.material);
    gl.bindVertexArray(part.vao.vao);
    gl.drawArrays(gl.TRIANGLES, 0, part.vao.vertexCount);
  }

  gl.bindVertexArray(null);

  // Próximo frame
  requestAnimationFrame(render);
}

// Inicia loop
render();
