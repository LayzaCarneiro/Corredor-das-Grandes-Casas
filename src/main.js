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
import { createWorld } from './scene.js';
import { setupPosters, renderPosters, updatePosterUI } from './poster.js';
import { loadIronThrone, renderIronThrone, circleIntersectsAabbXZ } from './throne.js';
import { loadSword, renderSword } from './sword.js';

// --- INICIALIZAÇÃO DO CANVAS E WEBGL ---
const canvas = document.getElementById("glCanvas");
const gl = canvas.getContext("webgl2");
if (!gl) alert("WebGL2 não suportado");

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  gl.viewport(0, 0, canvas.width, canvas.height);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// --- PREPARAÇÃO DO PROGRAMA ---
const program = createPhongProgram(gl);
const locs = getPhongLocations(gl, program);
gl.useProgram(program);

// --- CRIAÇÃO DO MUNDO ---
const { scenario, parts } = createWorld(gl);

// Pegar referências do HTML
const uiElement = document.getElementById("poster-ui");
const uiTitle = document.getElementById("poster-title");
const uiText = document.getElementById("poster-text");

// Configurar áudio de fundo
const backgroundAudio = new Audio('audio/YTDown.com_YouTube_Game-of-Thrones-Tema-de-Abertura-Oppenin_Media_8wYhc8xpBkc_001_1080p.mp4');
backgroundAudio.loop = true;
backgroundAudio.volume = 0.3;

// Iniciar áudio após interação do usuário
document.addEventListener('click', () => {
  backgroundAudio.play().catch(e => console.log('Erro ao reproduzir áudio:', e));
}, { once: true });

const camera = new Camera(canvas, {
  position: [0, 1.6, 1.5],
  collisionFn: (x, z, radius) => {
    if (scenario.checkCollision(x, z, radius)) return true;
    if (circleIntersectsAabbXZ(x, z, radius)) return true;
    return false;
  },
  radius: 0.35,
  speed: 3.0,
});

// --- LOOP DE RENDERIZAÇÃO ---
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

  // --- DESENHAR E ATUALIZA PÔSTERES ---
  renderPosters(gl, locs, view, projection);
  updatePosterUI(camera.position, uiElement, uiTitle, uiText);

  // Desenhar trono de ferro no final da sala
  renderIronThrone(gl, locs, scenario, view, projection);

  // Desenhar espada em primeira pessoa (travada na visão)
  renderSword(gl, locs, camera, time, projection);

  gl.bindVertexArray(null);
  
  requestAnimationFrame(render);
}

async function main() {
  await setupPosters(gl);
  await loadIronThrone(gl, scenario);
  await loadSword(gl);

  render();
}

main();
