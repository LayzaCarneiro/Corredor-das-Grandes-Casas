// sword.js
// --- Carregamento e renderização da espada em primeira pessoa ---

import { loadOBJ } from './obj.js';
import { createVAO, loadTexture } from './scenario.js';
import { multiplyMat4, translateMat4, rotateXMat4, rotateYMat4, rotateZMat4, scaleMat4 } from './transform.js';
import { setPhongMatrices, setPhongMaterial, normalMatrixFromMat4 } from './phong.js';

// Referências globais para o objeto e textura da espada
let swordObj = null;
let swordTexture = null;

/**
 * loadSword(gl)
 * Carrega o modelo OBJ da espada e sua textura, criando o VAO e material.
 */
export async function loadSword(gl) {
  try {
    const objData = await loadOBJ('models/espada.obj');  // carrega geometria
    swordObj = {
      vao: createVAO(gl, objData),
      material: { 
        baseColor: [0.7, 0.7, 0.7], 
        ka: 0.3, kd: 0.7, ks: 0.6, shininess: 100 
      },
      useTexture: true,
    };
    swordTexture = loadTexture(gl, 'models/espada.jpg', false);  // carrega textura
    console.log('Espada carregada com sucesso');
  } catch (error) {
    console.error('Erro ao carregar espada:', error);
  }
}

/**
 * renderSword(gl, locs, camera, time, projection)
 * Renderiza a espada em primeira pessoa, com animação de "bobbing" baseada no movimento da câmera.
 */
export function renderSword(gl, locs, camera, time, projection) {
  if (!swordObj || !swordTexture) return;

  // Calcula magnitude do movimento da câmera para animar o "bobbing"
  const movementMagnitude = Math.sqrt(
    camera.velocity[0] ** 2 + camera.velocity[2] ** 2
  );
  
  const bobAmount = 0.4 * Math.min(movementMagnitude / 3.0, 1.0);
  const bobSpeed = 2.5;
  const bobY = Math.sin(time * 0.001 * bobSpeed) * bobAmount;

  // Construir matriz da espada
  let swordMatrix = scaleMat4(0.7, 0.35, 0.7);
  swordMatrix = multiplyMat4(rotateXMat4(Math.PI / 2), swordMatrix);
  swordMatrix = multiplyMat4(rotateZMat4(Math.PI / 4), swordMatrix);
  swordMatrix = multiplyMat4(rotateYMat4(Math.PI / 6), swordMatrix);

  // Translação relativa à "mão" do jogador
  const swordTranslate = translateMat4(
    0.1,
    -0.6 + bobY,
    -0.5
  );
  swordMatrix = multiplyMat4(swordTranslate, swordMatrix);

  // Adiciona posição da câmera (para seguir o jogador)
  const cameraTranslate = translateMat4(
    camera.position[0],
    camera.position[1],
    camera.position[2]
  );
  swordMatrix = multiplyMat4(cameraTranslate, swordMatrix);

  // View simplificada (sem rotação)
  // Mantém a espada fixa na tela sem girar com a câmera
  const simplifiedView = new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    -camera.position[0], -camera.position[1], -camera.position[2], 1,
  ]);

  // Atualiza matrizes e materiais no shader
  setPhongMatrices(gl, locs, {
    model: swordMatrix,
    view: simplifiedView,
    projection,
    normalMatrix: normalMatrixFromMat4(swordMatrix),
  });

  setPhongMaterial(gl, locs, swordObj.material);

  // Configura textura
  gl.uniform1i(locs.uUseTexture, 1);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, swordTexture);
  gl.uniform1i(locs.uTexture, 0);

  // Desenha a espada
  gl.bindVertexArray(swordObj.vao.vao);
  gl.drawArrays(gl.TRIANGLES, 0, swordObj.vao.vertexCount);
}
