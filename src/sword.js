// sword.js
import { loadOBJ } from './obj.js';
import { createVAO, loadTexture } from './scenario.js';
import { multiplyMat4, translateMat4, rotateXMat4, rotateYMat4, rotateZMat4, scaleMat4 } from './transform.js';
import { setPhongMatrices, setPhongMaterial, normalMatrixFromMat4 } from './phong.js';

let swordObj = null;
let swordTexture = null;

export async function loadSword(gl) {
  try {
    const objData = await loadOBJ('models/espada.obj');
    swordObj = {
      vao: createVAO(gl, objData),
      material: { 
        baseColor: [0.7, 0.7, 0.7], 
        ka: 0.3, kd: 0.7, ks: 0.6, shininess: 100 
      },
      useTexture: true,
    };
    swordTexture = loadTexture(gl, 'models/espada.jpg', false);
    console.log('Espada carregada com sucesso');
  } catch (error) {
    console.error('Erro ao carregar espada:', error);
  }
}

// --- Função para desenhar espada em primeira pessoa ---
export function renderSword(gl, locs, camera, time, projection) {
  if (!swordObj || !swordTexture) return;

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

  const swordTranslate = translateMat4(
    0.1,
    -0.6 + bobY,
    -0.5
  );
  swordMatrix = multiplyMat4(swordTranslate, swordMatrix);

  const cameraTranslate = translateMat4(
    camera.position[0],
    camera.position[1],
    camera.position[2]
  );
  swordMatrix = multiplyMat4(cameraTranslate, swordMatrix);

  // View simplificada (sem rotação)
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

  gl.uniform1i(locs.uUseTexture, 1);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, swordTexture);
  gl.uniform1i(locs.uTexture, 0);

  gl.bindVertexArray(swordObj.vao.vao);
  gl.drawArrays(gl.TRIANGLES, 0, swordObj.vao.vertexCount);
}
