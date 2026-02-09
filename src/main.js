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

// Carregar espada OBJ e textura para primeira pessoa
let swordObj = null;
let swordTexture = null;

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
    console.log('Trono de ferro carregado com sucesso');
  } catch (error) {
    console.error('Erro ao carregar trono:', error);
  }
}

async function loadSword() {
  try {
    const objData = await loadOBJ('models/espada.obj');
    swordObj = {
      vao: createVAO(gl, objData),
      material: { 
        baseColor: [0.7, 0.7, 0.7], 
        ka: 0.3, 
        kd: 0.7, 
        ks: 0.6, 
        shininess: 100 
      },
      useTexture: true,
    };
    swordTexture = loadTexture(gl, 'models/espada.jpg');
    console.log('Espada carregada com sucesso');
  } catch (error) {
    console.error('Erro ao carregar espada:', error);
  }
}

loadIronThrone();
loadSword();

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

// Função para criar matriz de identidade
function createIdentity() {
  return new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
  ]);
}

// Função para multiplicar matrizes 4x4
function multiplyMat4(a, b) {
  const result = new Float32Array(16);
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) {
        sum += a[i + k * 4] * b[k + j * 4];
      }
      result[i + j * 4] = sum;
    }
  }
  return result;
}

// Função para criar matriz de translação
function translateMat4(x, y, z) {
  return new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    x, y, z, 1,
  ]);
}

// Função para criar matriz de rotação no eixo X
function rotateXMat4(angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return new Float32Array([
    1, 0, 0, 0,
    0, c, -s, 0,
    0, s, c, 0,
    0, 0, 0, 1,
  ]);
}

// Função para criar matriz de rotação no eixo Y
function rotateYMat4(angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return new Float32Array([
    c, 0, s, 0,
    0, 1, 0, 0,
    -s, 0, c, 0,
    0, 0, 0, 1,
  ]);
}

// Função para criar matriz de rotação no eixo Z
function rotateZMat4(angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return new Float32Array([
    c, -s, 0, 0,
    s, c, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
  ]);
}

// Função para criar matriz de escala
function scaleMat4(x, y, z) {
  return new Float32Array([
    x, 0, 0, 0,
    0, y, 0, 0,
    0, 0, z, 0,
    0, 0, 0, 1,
  ]);
}


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
    const throneZ = scenario.params.corridorLength + scenario.params.roomSize - 2.0;
    // Escala maior (1.5) + Rotação de 180° no eixo Y para virar o trono
    const throneModel = new Float32Array([
      -1.5, 0, 0, 0,
      0, 1.5, 0, 0,
      0, 0, -1.5, 0,
      0, 0, throneZ, 1,
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

  // Desenhar espada em primeira pessoa (travada na visão)
  if (swordObj && swordTexture) {
    // Calcular se a câmera está se movimentando
    const movementMagnitude = Math.sqrt(
      camera.velocity[0] ** 2 + camera.velocity[2] ** 2
    );
    
    // Animação de bobbing apenas enquanto se move
    const bobAmount = 0.4 * Math.min(movementMagnitude / 3.0, 1.0); // Escala com movimento
    const bobSpeed = 2.5;
    const bobY = Math.sin(time * 0.001 * bobSpeed) * bobAmount;
    
    // Construir matriz de transformação da espada
    // 1. Escala para ficar bem visível
    let swordMatrix = scaleMat4(0.7, 0.35, 0.7);
    
    // 2. Rotação para ficar diagonal
    swordMatrix = multiplyMat4(rotateXMat4(Math.PI / 2), swordMatrix);
    
    // 3. Rotação em Z para deixar diagonal (inclinada)
    swordMatrix = multiplyMat4(rotateZMat4(Math.PI / 4), swordMatrix);
    
    // 4. Rotação em Y para virar a espada
    swordMatrix = multiplyMat4(rotateYMat4(Math.PI / 6), swordMatrix);
    
    // 5. Translação: posição como se estivesse na mão do personagem
    const swordTranslate = translateMat4(
      0.1,           // mais para esquerda
      -0.6 + bobY,   // balança apenas enquanto se move
      -0.5           // frente do campo de visão (mais próximo)
    );
    swordMatrix = multiplyMat4(swordTranslate, swordMatrix);
    
    // Adicionar posição da câmera (para seguir o personagem)
    const cameraTranslate = translateMat4(
      camera.position[0],
      camera.position[1],
      camera.position[2]
    );
    swordMatrix = multiplyMat4(cameraTranslate, swordMatrix);
    
    // View matrix simplificada que não rotaciona (apenas translação)
    // Isso mantém a espada sempre na mesma orientação visual
    const simplifiedView = new Float32Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      -camera.position[0], -camera.position[1], -camera.position[2], 1,
    ]);

    setPhongMatrices(gl, locs, {
      model: swordMatrix,
      view: simplifiedView,
      projection,
      normalMatrix: normalMatrixFromMat4(swordMatrix),
    });

    setPhongMaterial(gl, locs, swordObj.material);
    
    // Ativar textura da espada
    gl.uniform1i(locs.uUseTexture, 1);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, swordTexture);
    gl.uniform1i(locs.uTexture, 0);

    gl.bindVertexArray(swordObj.vao.vao);
    gl.drawArrays(gl.TRIANGLES, 0, swordObj.vao.vertexCount);
  }

  gl.bindVertexArray(null);
  
  requestAnimationFrame(render);
}

render();