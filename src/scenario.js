// Cenário corredor → sala (quadrada), sem libs externas.
// Gera geometria manualmente (posições + normais)
// e fornece função simples de colisão no plano XZ.


// ----------------------------------------------------
// Funções utilitárias para construção de geometria
// ----------------------------------------------------

// Adiciona um triângulo à malha.
// pos  → array de posições (x,y,z)
// nor  → array de normais
// a,b,c → vértices do triângulo ([x,y,z])
// n → normal do triângulo
function pushTri(pos, nor, a, b, c, n) {
  // Adiciona os 3 vértices sequencialmente
  pos.push(...a, ...b, ...c);

  // Repete a mesma normal para os 3 vértices
  // (geometria não indexada, flat shading)
  nor.push(...n, ...n, ...n);
}

// Cria um quad (retângulo) usando dois triângulos.
// Ordem: a-b-c e a-c-d
function pushQuad(pos, nor, a, b, c, d, n) {
  pushTri(pos, nor, a, b, c, n);
  pushTri(pos, nor, a, c, d, n);
}

// Cria estrutura inicial da malha
function makeMesh() {
  return { positions: [], normals: [], vertexCount: 0 };
}

// Converte arrays JS para Float32Array
// e calcula quantidade final de vértices
function finalizeMesh(mesh) {
  mesh.vertexCount = mesh.positions.length / 3; // 3 coords por vértice
  mesh.positions = new Float32Array(mesh.positions);
  mesh.normals = new Float32Array(mesh.normals);
  return mesh;
}


// ----------------------------------------------------
// Funções para construir partes do cenário
// ----------------------------------------------------

// Adiciona um piso horizontal no plano Y = constante
function addFloor(mesh, x0, x1, z0, z1, y) {
  // Normal apontando para cima (+Y)
  const n = [0, 1, 0];

  // Define os 4 cantos do retângulo
  const a = [x0, y, z0];
  const b = [x1, y, z0];
  const c = [x1, y, z1];
  const d = [x0, y, z1];

  pushQuad(mesh.positions, mesh.normals, a, b, c, d, n);
}

// Adiciona um teto horizontal
function addCeiling(mesh, x0, x1, z0, z1, y) {
  // Normal apontando para baixo (-Y)
  const n = [0, -1, 0];

  // Ordem invertida para manter o winding correto
  // (importante para back-face culling)
  const a = [x0, y, z0];
  const b = [x0, y, z1];
  const c = [x1, y, z1];
  const d = [x1, y, z0];

  pushQuad(mesh.positions, mesh.normals, a, b, c, d, n);
}

// Adiciona parede vertical paralela ao plano YZ (x constante)
function addWallX(mesh, x, z0, z1, y0, y1, normalX) {
  // Normal aponta para dentro do ambiente
  const n = [normalX, 0, 0];

  const a = [x, y0, z0];
  const b = [x, y0, z1];
  const c = [x, y1, z1];
  const d = [x, y1, z0];

  // Ajusta ordem dos vértices dependendo do sentido da normal
  if (normalX > 0) {
    pushQuad(mesh.positions, mesh.normals, a, b, c, d, n);
  } else {
    pushQuad(mesh.positions, mesh.normals, a, d, c, b, n);
  }
}

// Adiciona parede vertical paralela ao plano XY (z constante)
function addWallZ(mesh, z, x0, x1, y0, y1, normalZ) {
  const n = [0, 0, normalZ];

  const a = [x0, y0, z];
  const b = [x1, y0, z];
  const c = [x1, y1, z];
  const d = [x0, y1, z];

  if (normalZ > 0) {
    pushQuad(mesh.positions, mesh.normals, a, b, c, d, n);
  } else {
    pushQuad(mesh.positions, mesh.normals, a, d, c, b, n);
  }
}


// ----------------------------------------------------
// Criação do cenário completo
// ----------------------------------------------------

export function createCorridorRoomScenario(gl, cfg = {}) {

  // Parâmetros configuráveis com valores padrão
  const params = {
    corridorWidth: cfg.corridorWidth ?? 6,
    corridorLength: cfg.corridorLength ?? 18,
    roomSize: cfg.roomSize ?? 20,
    wallHeight: cfg.wallHeight ?? 4,
    doorWidth: cfg.doorWidth ?? 2.2,
    doorHeight: cfg.doorHeight ?? 3.0,
    doorThickness: cfg.doorThickness ?? 0.08,
  };

  const Wc = params.corridorWidth;
  const Lc = params.corridorLength;
  const S = params.roomSize;
  const H = params.wallHeight;

  // Sistema de coordenadas:
  // Corredor → z ∈ [0, Lc]
  // Sala     → z ∈ [Lc, Lc + S]
  // Porta está no plano z = 0

  const floor = makeMesh();
  const ceiling = makeMesh();
  const walls = makeMesh();
  const door = makeMesh();

  // ---------- Piso ----------
  addFloor(floor, -Wc / 2, Wc / 2, 0, Lc, 0);
  addFloor(floor, -S / 2, S / 2, Lc, Lc + S, 0);

  // ---------- Teto ----------
  addCeiling(ceiling, -Wc / 2, Wc / 2, 0, Lc, H);
  addCeiling(ceiling, -S / 2, S / 2, Lc, Lc + S, H);

  // ---------- Paredes do corredor ----------
  addWallX(walls, -Wc / 2, 0, Lc, 0, H, 1);
  addWallX(walls, Wc / 2, 0, Lc, 0, H, -1);

  // ---------- Paredes da sala ----------
  addWallX(walls, -S / 2, Lc, Lc + S, 0, H, 1);
  addWallX(walls, S / 2, Lc, Lc + S, 0, H, -1);
  addWallZ(walls, Lc + S, -S / 2, S / 2, 0, H, -1);

  // ---------- Parede frontal com vão da porta ----------
  const halfDoor = params.doorWidth / 2;

  addWallZ(walls, 0, -Wc / 2, -halfDoor, 0, H, 1); // esquerda
  addWallZ(walls, 0, halfDoor, Wc / 2, 0, H, 1);   // direita
  addWallZ(walls, 0, -halfDoor, halfDoor, params.doorHeight, H, 1); // topo

  // ---------- Fechamento da entrada da sala ----------
  addWallZ(walls, Lc, -S / 2, -Wc / 2, 0, H, 1);
  addWallZ(walls, Lc, Wc / 2, S / 2, 0, H, 1);

  // ---------- Porta (placa fina) ----------
  const zDoor = params.doorThickness;
  addWallZ(door, zDoor, -halfDoor, halfDoor, 0, params.doorHeight, 1);

  const meshes = {
    floor: finalizeMesh(floor),
    ceiling: finalizeMesh(ceiling),
    walls: finalizeMesh(walls),
    door: finalizeMesh(door),
  };

  // ----------------------------------------------------
  // Colisão simples no plano XZ
  // ----------------------------------------------------
  function checkCollision(x, z, radius = 0.35) {

    // Impede atravessar parede frontal
    if (z < 0 + radius) return true;

    const corridorMaxX = Wc / 2 - radius;
    const roomMaxX = S / 2 - radius;

    // Dentro do corredor
    if (z < Lc) {
      if (Math.abs(x) > corridorMaxX) return true;
      return false;
    }

    // Dentro da sala
    if (z <= Lc + S - radius) {
      if (Math.abs(x) > roomMaxX) return true;
      return false;
    }

    // Fora do fundo da sala
    return true;
  }

  return { params, meshes, checkCollision };
}


// ----------------------------------------------------
// Criação de VAO (WebGL2)
// ----------------------------------------------------

export function createVAO(gl, mesh) {

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  // Buffer de posições (location = 0 no shader)
  const posBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, mesh.positions, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

  // Buffer de normais (location = 1 no shader)
  const norBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, norBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, mesh.normals, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);

  // Desvincula para evitar alterações acidentais
  gl.bindVertexArray(null);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return { vao, vertexCount: mesh.vertexCount };
}
