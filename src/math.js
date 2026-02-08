/*
  Gera matriz de projeção perspectiva.
  
  fovy   -> campo de visão vertical (em radianos)
  aspect -> proporção da tela (largura / altura)
  near   -> plano de corte próximo
  far    -> plano de corte distante
  
  Retorna matriz 4x4 no formato Float32Array
*/
export function perspective(fovy, aspect, near, far) {

  const f = 1.0 / Math.tan(fovy / 2); // fator de escala vertical

  return new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far + near) / (near - far), -1,
    0, 0, (2 * far * near) / (near - far), 0
  ]);
}


/*
  Normaliza um vetor 3D.
  Retorna um vetor de mesmo sentido com comprimento 1.
*/
export function normalize(v) {

  const len = Math.hypot(v[0], v[1], v[2]);

  // Evita divisão por zero
  if (len === 0) return [0, 0, 0];

  return [
    v[0] / len,
    v[1] / len,
    v[2] / len
  ];
}


/*
  Produto vetorial (cross product) entre dois vetores 3D.
  Retorna um vetor perpendicular a ambos.
*/
export function cross(a, b) {

  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  ];
}
