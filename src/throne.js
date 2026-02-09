// throne.js
// --- Carregamento, renderização e colisão do Trono de Ferro ---

import { loadOBJ } from './obj.js';
import { createVAO, loadTexture } from './scenario.js';
import { setPhongMatrices, setPhongMaterial, normalMatrixFromMat4 } from './phong.js';

// --- Constantes de escala e posição ---
export const THRONE_SCALE = 1.5;
export const THRONE_POS_X = 0.0;

// --- Referências globais para objeto, textura e AABB ---
let ironThroneObj = null;
let ironThroneTexture = null;
let ironThroneWorldAabbXZ = null;

// --- Funções auxiliares para colisão AABB ---
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

// Encolhe o AABB para diminuir a área de colisão
function shrinkAabbXZ(aabb, factor = 0.85) {
  const cx = (aabb.minX + aabb.maxX) * 0.5;
  const cz = (aabb.minZ + aabb.maxZ) * 0.5;
  const ex = (aabb.maxX - aabb.minX) * 0.5 * factor;
  const ez = (aabb.maxZ - aabb.minZ) * 0.5 * factor;
  return { minX: cx - ex, maxX: cx + ex, minZ: cz - ez, maxZ: cz + ez };
}

// Transforma o AABB local para coordenadas de mundo com escala e translação
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

/**
 * circleIntersectsAabbXZ(cx, cz, r)
 * Verifica se um círculo (posição do jogador) colide com o AABB do trono.
 */
export function circleIntersectsAabbXZ(cx, cz, r) {
  if (!ironThroneWorldAabbXZ) return false;
  const aabb = ironThroneWorldAabbXZ;
  const closestX = Math.max(aabb.minX, Math.min(cx, aabb.maxX));
  const closestZ = Math.max(aabb.minZ, Math.min(cz, aabb.maxZ));
  const dx = cx - closestX;
  const dz = cz - closestZ;
  return (dx * dx + dz * dz) < (r * r);
}

/**
 * getThronePosZ(scenario)
 * Retorna a posição Z do trono baseado no cenário.
 */
function getThronePosZ(scenario) {
  return scenario.params.corridorLength + scenario.params.roomSize - 2.0;
}

/**
 * loadIronThrone(gl, scenario)
 * Carrega modelo, textura e calcula AABB do trono.
 */
export async function loadIronThrone(gl, scenario) {
  try {
    const objData = await loadOBJ('models/iron_throne.obj');
    ironThroneObj = {
      vao: createVAO(gl, objData),
      material: { 
        baseColor: [0.8, 0.8, 0.8], 
        ka: 0.3, kd: 0.7, ks: 0.5, shininess: 160 
      },
      useTexture: true,
    };
    ironThroneTexture = loadTexture(gl, 'models/IronThrone_Diff.vtf.png', false);

    const localAabb = shrinkAabbXZ(computeLocalAabbXZ(objData.positions), 0.82);
    ironThroneWorldAabbXZ = transformAabbXZ(localAabb, {
      scale: THRONE_SCALE,
      tx: THRONE_POS_X,
      tz: getThronePosZ(scenario),
    });

    console.log('Trono de ferro carregado com sucesso');
  } catch (error) {
    console.error('Erro ao carregar trono:', error);
  }
}

/**
 * renderIronThrone(gl, locs, scenario, view, projection)
 * Renderiza o trono de ferro no cenário.
 */
export function renderIronThrone(gl, locs, scenario, view, projection) {
  if (!ironThroneObj || !ironThroneTexture) return;

  const throneZ = getThronePosZ(scenario);

  // Matriz de modelo: escala negativa em X/Z para "espelhar", posição final
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

  // Textura
  gl.uniform1i(locs.uUseTexture, 1);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, ironThroneTexture);
  gl.uniform1i(locs.uTexture, 0);

  // Desenha o VAO
  gl.bindVertexArray(ironThroneObj.vao.vao);
  gl.drawArrays(gl.TRIANGLES, 0, ironThroneObj.vao.vertexCount);
}
