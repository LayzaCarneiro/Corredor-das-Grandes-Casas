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
import { createCorridorRoomScenario, createVAO, loadTexture, createPosterMesh } from './scenario.js';
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
const START_Z = 1.5;
// Extra para deixar o corredor bem mais longo (aumenta o tempo até a sala)
const corridorLength = 25

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

// --- CONFIGURAÇÃO DOS PÔSTERES ---
const posterImagePaths = [
  '../assets/houses/stark-poster.png',
  '../assets/houses/lannister-poster.png',
  '../assets/houses/baratheon-poster.png',
  '../assets/houses/targaryen-poster.png',
  '../assets/houses/tyrell-poster.png',
  '../assets/houses/arryn-poster.png',
  '../assets/houses/greyjoy-poster.png',
  '../assets/houses/martell-poster.png',
];

let posterTextures = []; // Agora é um ARRAY de texturas
let posterVao = null;

async function setupPosters() {
  // Carrega todas as texturas e guarda no array
  // O .map cria um novo array com o resultado de loadTexture para cada caminho
  posterTextures = posterImagePaths.map(path => loadTexture(gl, path, true));

  const mesh = createPosterMesh();
  posterVao = createVAO(gl, mesh);
  console.log("Posters setup ok");
}
setupPosters();

const postersConfig = [
  // --- PAREDE ESQUERDA (x: -2.45) ---
  { 
    x: -2.45, y: 1.8, z: 4.0, rotateY: Math.PI / 2, texIndex: 0,
    title: "Casa Stark",
    info: `
      Lema: "O Inverno Está Chegando"
      Senhores de Winterfell, protetores do Norte.
      Membros notáveis: Eddard, Arya, Jon Snow.
      Curiosidade: Cada filho tem um lobo gigante correspondente.
      Evento icônico: Participaram da Rebelião de Robert e da Guerra dos Cinco Reis.
    `
  },
  { 
    x: -2.45, y: 1.8, z: 9.0, rotateY: Math.PI / 2, texIndex: 1,
    title: "Casa Lannister",
    info: `
      Lema: "Ouça-me Rugir"
      Rica e influente, controlam as minas de ouro de Rochedo Casterly.
      Membros notáveis: Tywin, Cersei, Jaime, Tyrion.
      Curiosidade: Famosos por riqueza e astúcia política.
      Evento icônico: Guerra dos Cinco Reis e manipulação da política em Porto Real.
    `
  },
  { 
    x: -2.45, y: 1.8, z: 14.0, rotateY: Math.PI / 2, texIndex: 4,
    title: "Casa Tyrell",
    info: `
      Lema: "Crescendo Fortes"
      Senhores da Campina, sua sede é o castelo Jardim de Cima.
      Membros notáveis: Mace, Olenna, Loras Tyrell.
      Curiosidade: Conhecidos por intrigas e alianças estratégicas.
      Evento icônico: Apoiaram a coroação de Joffrey Baratheon e participaram da batalha de Porto Real.
    `
  },
  { 
    x: -2.45, y: 1.8, z: 19.0, rotateY: Math.PI / 2, texIndex: 5,
    title: "Casa Arryn",
    info: `
      Lema: "Tão Alto como a Honra"
      Protetores do Vale, vivem no impenetrável Ninho da Águia.
      Membros notáveis: Jon Arryn, Lysa, Robin.
      Curiosidade: Casa isolada e quase intocável devido à geografia.
      Evento icônico: A morte de Jon Arryn desencadeou os eventos da Guerra dos Cinco Reis.
    `
  },

  // --- PAREDE DIREITA (x: 2.45) ---
  { 
    x: 2.45, y: 1.8, z: 6.5, rotateY: -Math.PI / 2, texIndex: 2,
    title: "Casa Baratheon",
    info: `
      Lema: "Nossa é a Fúria"
      Conquistaram o Trono de Ferro após a Rebelião de Robert.
      Membros notáveis: Robert, Stannis, Renly.
      Curiosidade: Conhecidos pela força e temperamento explosivo.
      Evento icônico: Rebelião de Robert e guerra civil subsequente.
    `
  },
  { 
    x: 2.45, y: 1.8, z: 11.5, rotateY: -Math.PI / 2, texIndex: 3,
    title: "Casa Targaryen",
    info: `
      Lema: "Fogo e Sangue"
      Últimos senhores dos dragões da antiga Valíria.
      Membros notáveis: Aerys II, Daenerys, Viserys.
      Curiosidade: Sua linhagem é conhecida pelos cabelos platinados e olhos violeta.
      Evento icônico: Queda do Trono de Ferro e a guerra pelo retorno de Daenerys.
    `
  },
  { 
    x: 2.45, y: 1.8, z: 16.5, rotateY: -Math.PI / 2, texIndex: 6,
    title: "Casa Greyjoy",
    info: `
      Lema: "Nós Não Semeamos"
      Senhores das Ilhas de Ferro, mestres dos mares e navios.
      Membros notáveis: Balon, Theon, Yara Greyjoy.
      Curiosidade: Seguidores do Deus Afogado e cultura marítima isolada.
      Evento icônico: Rebelião Greyjoy e invasões ao continente.
    `
  },
  { 
    x: 2.45, y: 1.8, z: 21.5, rotateY: -Math.PI / 2, texIndex: 7,
    title: "Casa Martell",
    info: `
      Lema: "Insubmissos, Não Curvados, Não Quebrados"
      Senhores de Dorne, nunca conquistados por Aegon.
      Membros notáveis: Doran, Oberyn, Ellaria Martell.
      Curiosidade: Cultura distinta e costumes de Dorne mais tolerantes.
      Evento icônico: Conflitos com Lannisters e busca por vingança de Oberyn.
    `
  },
];

// Pegar referências do HTML
const uiElement = document.getElementById("poster-ui");
const uiTitle = document.getElementById("poster-title");
const uiText = document.getElementById("poster-text");

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
    ironThroneTexture = loadTexture(gl, 'models/IronThrone_Diff.vtf.png', false);

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
    swordTexture = loadTexture(gl, 'models/espada.jpg', false);
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

  // --- DESENHAR PÔSTERES ---
  // Verifica se o VAO existe e se temos texturas carregadas no array
  if (posterVao && posterTextures.length > 0) {
    gl.uniform1i(locs.uUseTexture, 1); // Ativa modo textura
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(locs.uTexture, 0);

    // Material padrão do papel
    setPhongMaterial(gl, locs, { 
        baseColor: [1, 1, 1], ka: 0.4, kd: 0.8, ks: 0.1, shininess: 5 
    });
    
    // Vincula o VAO uma vez só (a geometria é a mesma para todos)
    gl.bindVertexArray(posterVao.vao);

    for (const p of postersConfig) {
      // --- O PULO DO GATO: VINCULAR A TEXTURA CORRETA ---
      // Pega a textura do array baseado no índice definido na config
      const textureToUse = posterTextures[p.texIndex];
      
      // Segurança: só vincula se a textura já foi criada pelo loadTexture
      if (textureToUse) {
          gl.bindTexture(gl.TEXTURE_2D, textureToUse);
      }

      // Criar matriz de modelo (Escala e Posição)
      const model = new Float32Array([
        1.2 * Math.cos(p.rotateY), 0, -1.2 * Math.sin(p.rotateY), 0,
        0, 1.6, 0, 0,
        1.2 * Math.sin(p.rotateY), 0, 1.2 * Math.cos(p.rotateY), 0,
        p.x, p.y, p.z, 1
      ]);

      setPhongMatrices(gl, locs, {
        model: model,
        view,
        projection,
        normalMatrix: normalMatrixFromMat4(model),
      });

      // Desenha este pôster específico com a textura vinculada acima
      gl.drawArrays(gl.TRIANGLES, 0, posterVao.vertexCount);
    }
  }

  // --- LÓGICA DE PROXIMIDADE ---
  let closestPoster = null;
  const PROXIMITY_THRESHOLD = 2.0; // Distância de 2 metros para ativar

  for (const p of postersConfig) {
    // Calcula a distância entre a câmera e o pôster
    const dx = p.x - camera.position[0];
    const dz = p.z - camera.position[2];
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance < PROXIMITY_THRESHOLD) {
      closestPoster = p;
      break; // Encontrou um perto, não precisa checar os outros
    }
  }

  // Atualiza a UI baseada no pôster mais próximo
  if (closestPoster) {
    uiTitle.innerText = closestPoster.title;
    uiText.innerText = closestPoster.info;
    uiElement.style.display = "block";
  } else {
    uiElement.style.display = "none";
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