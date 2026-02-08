import { perspective } from './math.js';
import { vsSource, fsSource, createProgram } from './shaders.js';
import { Camera } from './camera.js';
import { loadOBJ } from './obj.js';
import { loadTexture, loadMTL } from './texture.js';

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
const uLightPos = gl.getUniformLocation(program, "uLightPos");
const uViewPos = gl.getUniformLocation(program, "uViewPos");
const uObjectColor = gl.getUniformLocation(program, "uObjectColor");
const uLightColor = gl.getUniformLocation(program, "uLightColor");
const uUseTexture = gl.getUniformLocation(program, "uUseTexture");
const uTexture = gl.getUniformLocation(program, "uTexture");

// Geometria (Cubo com normais e coordenadas de textura)
const cubeData = createCubeWithNormals();

const vao = gl.createVertexArray();
gl.bindVertexArray(vao);

// Buffer de posições
const vbo = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
gl.bufferData(gl.ARRAY_BUFFER, cubeData.positions, gl.STATIC_DRAW);
gl.enableVertexAttribArray(0);
gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

// Buffer de normais
const nbo = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, nbo);
gl.bufferData(gl.ARRAY_BUFFER, cubeData.normals, gl.STATIC_DRAW);
gl.enableVertexAttribArray(1);
gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);

// Buffer de coordenadas de textura
const tbo = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, tbo);
gl.bufferData(gl.ARRAY_BUFFER, cubeData.texCoords, gl.STATIC_DRAW);
gl.enableVertexAttribArray(2);
gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0);

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

// Configurar iluminação (Requisito II - Phong)
gl.uniform3f(uLightColor, 1.0, 1.0, 1.0); // Luz branca
let lightAngle = 0; // Para movimentação da luz (Requisito II)

// Objeto OBJ (será carregado assincronamente)
let objVAO = null;
let objVertexCount = 0;
let objTexture = null; // Textura do objeto (Requisito IV)

// Função para carregar e configurar um modelo OBJ com textura
async function loadOBJModel(url) {
  try {
    console.log(`🔄 Carregando modelo OBJ: ${url}`);
    const objData = await loadOBJ(url);
    
    console.log(`✓ Modelo carregado: ${objData.vertexCount} vértices`);
    console.log(`  - Posições: ${objData.positions.length} valores`);
    console.log(`  - Normais: ${objData.normals.length} valores`);
    console.log(`  - Texcoords: ${objData.texCoords.length} valores`);
    
    // Cria VAO para o objeto OBJ
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    
    // Buffer de posições
    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, objData.positions, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    
    // Buffer de normais
    const normBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, objData.normals, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
    
    // Buffer de coordenadas de textura
    const texBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, objData.texCoords, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0);
    
    gl.bindVertexArray(null);
    
    objVAO = vao;
    objVertexCount = objData.vertexCount;
    
    console.log(`✓ VAO configurado com ${objData.vertexCount} vértices`);
    
    // Carregar arquivo MTL e textura
    const mtlPath = url.replace('.obj', '.mtl');
    try {
      const materials = await loadMTL(mtlPath);
      const materialNames = Object.keys(materials);
      
      if (materialNames.length > 0) {
        const material = materials[materialNames[0]];
        console.log(`✓ Material carregado:`, material);
        
        // Tentar carregar textura difusa se existir
        if (material.textures && material.textures.diffuse) {
          const texturePath = `models/${material.textures.diffuse}`;
          try {
            objTexture = await loadTexture(gl, texturePath);
            console.log(`✓ Textura carregada: ${texturePath}`);
          } catch (error) {
            console.log(`⚠ Textura não encontrada: ${texturePath}`);
            objTexture = null;
          }
        }
      }
    } catch (error) {
      console.log(`⚠ MTL não encontrado`);
    }
    
    console.log(`✅ Modelo OBJ configurado com sucesso!`);
  } catch (error) {
    console.error("❌ Erro ao carregar modelo OBJ:", error);
  }
}

// Carregar o modelo Iron Throne (Requisito IV - objeto com textura)
loadOBJModel('models/iron_throne.obj');

function render() {
  camera.updatePosition();
  
  // Animação da luz (Requisito II - movimentação de fonte de luz)
  lightAngle += 0.01;
  const lightX = Math.cos(lightAngle) * 5.0;
  const lightZ = Math.sin(lightAngle) * 5.0;
  gl.uniform3f(uLightPos, lightX, 3.0, lightZ);
  
  // Posição da câmera para cálculo especular
  const camPos = camera.position;
  gl.uniform3f(uViewPos, camPos[0], camPos[1], camPos[2]);
  
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
  gl.uniformMatrix4fv(uView, false, camera.getViewMatrix());

  // Renderiza o cubo original (Requisito V - objeto com cor sólida)
  gl.bindVertexArray(vao);
  
  // Animação do cubo (Requisito III - objeto animado)
  const cubeRotation = Date.now() * 0.001; // Rotação contínua
  const cos = Math.cos(cubeRotation);
  const sin = Math.sin(cubeRotation);
  const animatedModel = new Float32Array([
    cos, 0, sin, 0,
    0,   1, 0,   0,
   -sin, 0, cos, 0,
    0,   0, 0,   1
  ]);
  
  gl.uniformMatrix4fv(uModel, false, animatedModel);
  gl.uniform1i(uUseTexture, 0); // Não usa textura
  gl.uniform3f(uObjectColor, 0.2, 0.8, 0.2); // Verde (cor sólida)
  gl.drawArrays(gl.TRIANGLES, 0, 36);
  
  // Renderiza o modelo OBJ Iron Throne (Requisito IV - objeto com textura)
  if (objVAO && objVertexCount > 0) {
    // Matriz de transformação para o Iron Throne
    const objModel = new Float32Array([
      2, 0, 0, 0,
      0, 2, 0, 0,
      0, 0, 2, 0,
      0, 0, -5, 1  // Posição no cenário
    ]);
    
    gl.bindVertexArray(objVAO);
    gl.uniformMatrix4fv(uModel, false, objModel);
    
    if (objTexture) {
      // Renderiza com textura
      gl.uniform1i(uUseTexture, 1);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, objTexture);
      gl.uniform1i(uTexture, 0);
    } else {
      // Fallback: renderiza com cor sólida marrom
      gl.uniform1i(uUseTexture, 0);
      gl.uniform3f(uObjectColor, 0.6, 0.3, 0.1);
    }
    
    gl.drawArrays(gl.TRIANGLES, 0, objVertexCount);
  }
  
  requestAnimationFrame(render);
}

render();

// Função auxiliar para criar cubo com normais e coordenadas de textura
function createCubeWithNormals() {
  const positions = new Float32Array([
    // Frente (Z+)
    -0.5, -0.5,  0.5,  0.5, -0.5,  0.5,  0.5,  0.5,  0.5,
    -0.5, -0.5,  0.5,  0.5,  0.5,  0.5, -0.5,  0.5,  0.5,
    // Trás (Z-)
    -0.5, -0.5, -0.5, -0.5,  0.5, -0.5,  0.5,  0.5, -0.5,
    -0.5, -0.5, -0.5,  0.5,  0.5, -0.5,  0.5, -0.5, -0.5,
    // Esquerda (X-)
    -0.5, -0.5, -0.5, -0.5, -0.5,  0.5, -0.5,  0.5,  0.5,
    -0.5, -0.5, -0.5, -0.5,  0.5,  0.5, -0.5,  0.5, -0.5,
    // Direita (X+)
     0.5, -0.5, -0.5,  0.5,  0.5, -0.5,  0.5,  0.5,  0.5,
     0.5, -0.5, -0.5,  0.5,  0.5,  0.5,  0.5, -0.5,  0.5,
    // Topo (Y+)
    -0.5,  0.5, -0.5, -0.5,  0.5,  0.5,  0.5,  0.5,  0.5,
    -0.5,  0.5, -0.5,  0.5,  0.5,  0.5,  0.5,  0.5, -0.5,
    // Base (Y-)
    -0.5, -0.5, -0.5,  0.5, -0.5,  0.5, -0.5, -0.5,  0.5,
    -0.5, -0.5, -0.5,  0.5, -0.5, -0.5,  0.5, -0.5,  0.5,
  ]);
  
  const normals = new Float32Array([
    // Frente
    0, 0, 1,  0, 0, 1,  0, 0, 1,  0, 0, 1,  0, 0, 1,  0, 0, 1,
    // Trás
    0, 0, -1,  0, 0, -1,  0, 0, -1,  0, 0, -1,  0, 0, -1,  0, 0, -1,
    // Esquerda
    -1, 0, 0,  -1, 0, 0,  -1, 0, 0,  -1, 0, 0,  -1, 0, 0,  -1, 0, 0,
    // Direita
    1, 0, 0,  1, 0, 0,  1, 0, 0,  1, 0, 0,  1, 0, 0,  1, 0, 0,
    // Topo
    0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0,
    // Base
    0, -1, 0,  0, -1, 0,  0, -1, 0,  0, -1, 0,  0, -1, 0,  0, -1, 0,
  ]);
  
  const texCoords = new Float32Array([
    // Frente
    0, 0,  1, 0,  1, 1,  0, 0,  1, 1,  0, 1,
    // Trás
    0, 0,  0, 1,  1, 1,  0, 0,  1, 1,  1, 0,
    // Esquerda
    0, 0,  1, 0,  1, 1,  0, 0,  1, 1,  0, 1,
    // Direita
    0, 0,  0, 1,  1, 1,  0, 0,  1, 1,  1, 0,
    // Topo
    0, 0,  0, 1,  1, 1,  0, 0,  1, 1,  1, 0,
    // Base
    0, 0,  1, 0,  0, 1,  0, 0,  1, 1,  1, 0,
  ]);
  
  return { positions, normals, texCoords };
}