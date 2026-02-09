/**
 * math.js
 * Utilitários matemáticos essenciais para projeção 3D e álgebra vetorial.
 */


/**
 * Cria uma matriz de projeção perspectiva.
 * @param {number} fovy - Campo de visão vertical em radianos.
 * @param {number} aspect - Proporção da tela (largura / altura).
 * @param {number} near - Distância do plano de corte próximo.
 * @param {number} far - Distância do plano de corte distante.
 */
export function perspective(fovy, aspect, near, far) {
  const f = 1.0 / Math.tan(fovy / 2);
  return new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far + near) / (near - far), -1,
    0, 0, (2 * far * near) / (near - far), 0
  ]);
}

/**
 * Normaliza um vetor 3D (faz com que seu comprimento seja 1).
 * @param {number[]} v - Vetor [x, y, z].
 */
export function normalize(v) {
  const len = Math.hypot(v[0], v[1], v[2]);
  
  // Prevenção contra divisão por zero se o vetor for nulo
  if (len === 0) return [0, 0, 0];
  
  return [v[0] / len, v[1] / len, v[2] / len];
}

/**
 * Calcula o produto vetorial (Cross Product) entre dois vetores.
 * Útil para encontrar vetores perpendiculares (como o eixo 'Right' da câmera).
 */
export function cross(a, b) {
  return [
    a[1]*b[2] - a[2]*b[1],
    a[2]*b[0] - a[0]*b[2],
    a[0]*b[1] - a[1]*b[0]
  ];
}