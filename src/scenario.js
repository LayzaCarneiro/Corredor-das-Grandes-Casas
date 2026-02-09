// Cenário corredor → sala (quadrada), sem libs externas.
// Gera geometria (posições+normais) e fornece função de colisão em XZ.

function pushTri(pos, nor, a, b, c, n) {
  pos.push(...a, ...b, ...c);
  nor.push(...n, ...n, ...n);
}

function pushQuad(pos, nor, a, b, c, d, n) {
  // a-b-c e a-c-d
  pushTri(pos, nor, a, b, c, n);
  pushTri(pos, nor, a, c, d, n);
}

function makeMesh() {
  return { positions: [], normals: [], vertexCount: 0 };
}

function finalizeMesh(mesh) {
  mesh.vertexCount = mesh.positions.length / 3;
  mesh.positions = new Float32Array(mesh.positions);
  mesh.normals = new Float32Array(mesh.normals);
  return mesh;
}

function addFloor(mesh, x0, x1, z0, z1, y) {
  // Visto de cima (normal +Y)
  const n = [0, 1, 0];
  const a = [x0, y, z0];
  const b = [x1, y, z0];
  const c = [x1, y, z1];
  const d = [x0, y, z1];
  pushQuad(mesh.positions, mesh.normals, a, b, c, d, n);
}

function addCeiling(mesh, x0, x1, z0, z1, y) {
  // Teto visto de baixo (normal -Y). Ordem invertida pra manter winding consistente.
  const n = [0, -1, 0];
  const a = [x0, y, z0];
  const b = [x0, y, z1];
  const c = [x1, y, z1];
  const d = [x1, y, z0];
  pushQuad(mesh.positions, mesh.normals, a, b, c, d, n);
}

function addWallX(mesh, x, z0, z1, y0, y1, normalX) {
  // Parede vertical em x = constante, normal apontando para dentro.
  const n = [normalX, 0, 0];
  const a = [x, y0, z0];
  const b = [x, y0, z1];
  const c = [x, y1, z1];
  const d = [x, y1, z0];

  // Ajusta winding: se normalX > 0, queremos que a face "olhe" +X.
  if (normalX > 0) {
    pushQuad(mesh.positions, mesh.normals, a, b, c, d, n);
  } else {
    // inverte
    pushQuad(mesh.positions, mesh.normals, a, d, c, b, n);
  }
}

function addWallZ(mesh, z, x0, x1, y0, y1, normalZ) {
  // Parede vertical em z = constante, normal apontando para dentro.
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

export function createCorridorRoomScenario(gl, cfg = {}) {
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

  // Coordenadas:
  // - Corredor em z ∈ [0, Lc]
  // - Sala em z ∈ [Lc, Lc + S]
  // - Origem (0,0,0) no plano da porta.

  const floor = makeMesh();
  const ceiling = makeMesh();
  const walls = makeMesh();
  const door = makeMesh();

  // Piso
  addFloor(floor, -Wc / 2, Wc / 2, 0, Lc, 0);
  addFloor(floor, -S / 2, S / 2, Lc, Lc + S, 0);

  // Teto
  addCeiling(ceiling, -Wc / 2, Wc / 2, 0, Lc, H);
  addCeiling(ceiling, -S / 2, S / 2, Lc, Lc + S, H);

  // Paredes do corredor (laterais)
  addWallX(walls, -Wc / 2, 0, Lc, 0, H, 1);
  addWallX(walls, Wc / 2, 0, Lc, 0, H, -1);

  // Paredes da sala (laterais + fundo)
  addWallX(walls, -S / 2, Lc, Lc + S, 0, H, 1);
  addWallX(walls, S / 2, Lc, Lc + S, 0, H, -1);
  addWallZ(walls, Lc + S, -S / 2, S / 2, 0, H, -1);

  // Parede frontal do corredor em z=0 com vão da porta (interior normal +Z)
  // Segmentos: esquerda, direita e topo.
  const halfDoor = params.doorWidth / 2;

  // esquerda
  addWallZ(walls, 0, -Wc / 2, -halfDoor, 0, H, 1);
  // direita
  addWallZ(walls, 0, halfDoor, Wc / 2, 0, H, 1);
  // topo acima da porta
  addWallZ(walls, 0, -halfDoor, halfDoor, params.doorHeight, H, 1);

  // “Fechamentos” na entrada da sala (z = Lc): fecha as laterais deixando o vão do corredor.
  // Normal +Z para apontar para dentro da sala.
  addWallZ(walls, Lc, -S / 2, -Wc / 2, 0, H, 1);
  addWallZ(walls, Lc, Wc / 2, S / 2, 0, H, 1);

  // Porta (placa fina no vão), levemente para dentro para evitar z-fighting.
  const zDoor = params.doorThickness;
  addWallZ(door, zDoor, -halfDoor, halfDoor, 0, params.doorHeight, 1);

  const meshes = {
    floor: finalizeMesh(floor),
    ceiling: finalizeMesh(ceiling),
    walls: finalizeMesh(walls),
    door: finalizeMesh(door),
  };

  // Colisão: restringe o movimento ao interior do corredor e da sala.
  // Retorna true se colidir.
  function checkCollision(x, z, radius = 0.35) {
    // não atravessa a porta/parede de entrada
    if (z < 0 + radius) return true;

    const corridorMaxX = Wc / 2 - radius;
    const roomMaxX = S / 2 - radius;

    // Corredor
    if (z < Lc) {
      if (Math.abs(x) > corridorMaxX) return true;
      return false;
    }

    // Sala
    if (z <= Lc + S - radius) {
      if (Math.abs(x) > roomMaxX) return true;
      return false;
    }

    // fora do fundo
    return true;
  }

  return { params, meshes, checkCollision };
}

export function createPosterMesh() {
  const positions = new Float32Array([
    -0.5, -0.5,  0.0,  // Inferior Esquerda
     0.5, -0.5,  0.0,  // Inferior Direita
     0.5,  0.5,  0.0,  // Superior Direita
    -0.5, -0.5,  0.0,  // Inferior Esquerda
     0.5,  0.5,  0.0,  // Superior Direita
    -0.5,  0.5,  0.0,  // Superior Esquerda
  ]);

  const normals = new Float32Array([
    0, 0, 1,  0, 0, 1,  0, 0, 1,
    0, 0, 1,  0, 0, 1,  0, 0, 1,
  ]);

  const texCoords = new Float32Array([
    0, 0,   1, 0,   1, 1,
    0, 0,   1, 1,   0, 1,
  ]);

  return { 
    positions, 
    normals, 
    texCoords, 
    vertexCount: 6 // ESSENCIAL: sem isso o drawArrays desenha zero
  };
}

export function createVAO(gl, mesh) {
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  // positions (loc 0)
  const posBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, mesh.positions, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

  // normals (loc 1)
  const norBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, norBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, mesh.normals, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);

  // texCoords (loc 2) - se existirem
  if (mesh.texCoords && mesh.texCoords.length > 0) {
    const texBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.texCoords, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0);
  }

  gl.bindVertexArray(null);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return { vao, vertexCount: mesh.vertexCount };
}

/**
 * Carrega uma textura do WebGL
 * @param {WebGL2RenderingContext} gl - Contexto WebGL
 * @param {string} url - Caminho da imagem
 * @returns {WebGLTexture} Textura carregada
 */
// No final do scenario.js

export function loadTexture(gl, url) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Textura temporária cinza (placeholder)
  const pixel = new Uint8Array([128, 128, 128, 255]);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixel);

  const image = new Image();
  image.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    
    // --- A CORREÇÃO MÁGICA AQUI ---
    // Diz ao WebGL para inverter o eixo Y da imagem ao desembalar
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); 
    // ------------------------------

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    
    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
      gl.generateMipmap(gl.TEXTURE_2D);
    } else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
  };
  image.src = url;
  return texture;
}

function isPowerOf2(value) {
  return (value & (value - 1)) === 0;
}
