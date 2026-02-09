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
  posterTextures = posterImagePaths.map(path => loadTexture(gl, path));

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
    info: "'O Inverno está Chegando'. Os protetores do Norte e senhores de Winterfell."
  },
  { 
    x: -2.45, y: 1.8, z: 9.0, rotateY: Math.PI / 2, texIndex: 1,
    title: "Casa Lannister",
    info: "'Ouça-me Rugir'. Conhecidos por sua imensa riqueza e pelas minas de Rochedo Casterly."
  },
  { 
    x: -2.45, y: 1.8, z: 14.0, rotateY: Math.PI / 2, texIndex: 4,
    title: "Casa Tyrell",
    info: "'Crescendo Fortes'. Senhores da Campina, sua sede é o castelo de Jardim de Cima."
  },
  { 
    x: -2.45, y: 1.8, z: 19.0, rotateY: Math.PI / 2, texIndex: 5,
    title: "Casa Arryn",
    info: "'Tão Alto como a Honra'. Protetores do Vale, vivem no impenetrável Ninho da Águia."
  },

  // --- PAREDE DIREITA (x: 2.45) ---
  { 
    x: 2.45, y: 1.8, z: 6.5, rotateY: -Math.PI / 2, texIndex: 2,
    title: "Casa Baratheon",
    info: "'Nossa é a Fúria'. A linhagem que conquistou o Trono de Ferro após a rebelião."
  },
  { 
    x: 2.45, y: 1.8, z: 11.5, rotateY: -Math.PI / 2, texIndex: 3,
    title: "Casa Targaryen",
    info: "'Fogo e Sangue'. Os últimos Senhores dos Dragões da antiga Valíria."
  },
  { 
    x: 2.45, y: 1.8, z: 16.5, rotateY: -Math.PI / 2, texIndex: 6,
    title: "Casa Greyjoy",
    info: "'Nós Não Semeamos'. Senhores das Ilhas de Ferro, mestres dos mares e navios."
  },
  { 
    x: 2.45, y: 1.8, z: 21.5, rotateY: -Math.PI / 2, texIndex: 7,
    title: "Casa Martell",
    info: "'Insubmissos, Não Curvados, Não Quebrados'. Senhores de Dorne, nunca conquistados por Aegon."
  },
];

// Pegar referências do HTML
const uiElement = document.getElementById("poster-ui");
const uiTitle = document.getElementById("poster-title");
const uiText = document.getElementById("poster-text");

// Carregar trono OBJ e textura
let ironThroneObj = null;
let ironThroneTexture = null;

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

  gl.bindVertexArray(null);
  
  requestAnimationFrame(render);
}

render();