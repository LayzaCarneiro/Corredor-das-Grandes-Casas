// poster.js
// --- Funções para criar, renderizar e atualizar os pôsteres na sala ---

import { createVAO, loadTexture, createPosterMesh } from './scenario.js';
import { POSTER_PATHS, POSTERS_CONFIG } from './data.js';
import { setPhongMaterial, setPhongMatrices, normalMatrixFromMat4 } from './phong.js';

// Arrays globais para armazenar texturas e VAO da geometria do pôster
let posterTextures = [];
let posterVao = null;

/**
 * setupPosters(gl)
 * Carrega as texturas e cria a geometria (VAO) dos pôsteres.
 */
export async function setupPosters(gl) {
  // Carrega todas as texturas dos pôsteres
  posterTextures = POSTER_PATHS.map(path => loadTexture(gl, path, true));

  // Cria mesh do pôster (uma geometria padrão para todos) e cria VAO
  const mesh = createPosterMesh();
  posterVao = createVAO(gl, mesh);
}

/**
 * renderPosters(gl, locs, view, projection)
 * Desenha todos os pôsteres na cena.
 */
export function renderPosters(gl, locs, view, projection) {
  // Se VAO ou texturas não estiverem carregados, retorna
  if (!posterVao || posterTextures.length === 0) return;

  gl.uniform1i(locs.uUseTexture, 1); // Ativa modo textura
  gl.activeTexture(gl.TEXTURE0);
  gl.uniform1i(locs.uTexture, 0);

  // Material padrão do papel
  setPhongMaterial(gl, locs, { baseColor:[1,1,1], ka:0.4, kd:0.8, ks:0.1, shininess:5 });
  
  // Vincula o VAO uma vez só (a geometria é a mesma para todos)
  gl.bindVertexArray(posterVao.vao);

  for (const p of POSTERS_CONFIG) {
    // Pega a textura do array baseado no índice definido na config
    const texture = posterTextures[p.texIndex];
    if (texture) gl.bindTexture(gl.TEXTURE_2D, texture);

    const cosY = Math.cos(p.rotateY);
    const sinY = Math.sin(p.rotateY);

    // Matriz de modelo: escala, rotação Y e posição
    const model = new Float32Array([
      1.2 * cosY, 0, -1.2 * sinY, 0,
      0, 1.6, 0, 0,
      1.2 * sinY, 0, 1.2 * cosY, 0,
      p.x, p.y, p.z, 1
    ]);

    // Atualiza matrizes no shader
    setPhongMatrices(gl, locs, {
      model,
      view,
      projection,
      normalMatrix: normalMatrixFromMat4(model),
    });

    // Desenha este pôster específico com a textura vinculada acima
    gl.drawArrays(gl.TRIANGLES, 0, posterVao.vertexCount);
  }
}

/**
 * updatePosterUI(cameraPos, uiElement, uiTitle, uiText, threshold)
 * Atualiza a UI com título e informações do pôster mais próximo da câmera.
 */
export function updatePosterUI(cameraPos, uiElement, uiTitle, uiText, threshold = 2.0) {
  let closest = null;

  for (const p of POSTERS_CONFIG) {
    // Calcula a distância entre a câmera e o pôster
    const dx = p.x - cameraPos[0];
    const dz = p.z - cameraPos[2];
    const distance = Math.hypot(dx, dz);

    if (distance < threshold) {
      closest = p;
      break; // Encontrou um perto, não precisa checar os outros
    }
  }

  // Atualiza a UI baseada no pôster mais próximo
  if (closest) {
    uiTitle.innerText = closest.title;
    uiText.innerText = closest.info;
    uiElement.style.display = "block";
  } else {
    uiElement.style.display = "none";
  }
}
