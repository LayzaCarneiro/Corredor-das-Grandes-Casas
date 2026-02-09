/**
 * Leitor de arquivos OBJ implementado do zero
 * Suporta vértices (v), normais (vn), coordenadas de textura (vt) e faces (f)
 * obj.js - Parser robusto para modelos 3D Wavefront (.obj)
 */

export class OBJLoader {
  constructor() {
    this.vertices = [];
    this.normals = [];
    this.texCoords = [];
    this.faces = [];
  }

  /**
   * Carrega e processa um arquivo OBJ
   * @param {string} url - Caminho para o arquivo .obj
   * @returns {Promise<Object>} Objeto com dados processados
   */
  async load(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Falha ao carregar ${url}: ${response.statusText}`);
      }
      const text = await response.text();
      return this.parse(text);
    } catch (error) {
      console.error("Erro ao carregar arquivo OBJ:", error);
      throw error;
    }
  }

  /**
   * Processa o conteúdo do arquivo OBJ
   * @param {string} text - Conteúdo do arquivo OBJ
   * @returns {Object} Dados processados
   */
  parse(text) {
    this.vertices = [];
    this.normals = [];
    this.texCoords = [];
    this.faces = [];

    const lines = text.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Ignora linhas vazias e comentários
      if (line === '' || line.startsWith('#')) continue;

      const parts = line.split(/\s+/);
      const type = parts[0];

      switch (type) {
        case 'v':  // Vértice (x, y, z)
          this.vertices.push(
            parseFloat(parts[1]),
            parseFloat(parts[2]),
            parseFloat(parts[3])
          );
          break;

        case 'vn': // Normal (x, y, z)
          this.normals.push(
            parseFloat(parts[1]),
            parseFloat(parts[2]),
            parseFloat(parts[3])
          );
          break;

        case 'vt': // Coordenada de textura (u, v)
          this.texCoords.push(
            parseFloat(parts[1]),
            parseFloat(parts[2])
          );
          break;

        case 'f':  // Face
          this.parseFace(parts.slice(1));
          break;
      }
    }

    return this.buildGeometry();
  }

  /**
   * Processa uma face do OBJ
   * Suporta formatos: v, v/vt, v/vt/vn, v//vn
   * @param {Array<string>} faceData - Dados da face
   */
  parseFace(faceData) {
    const face = [];
    
    for (let i = 0; i < faceData.length; i++) {
      const vertexData = faceData[i].split('/');
      face.push({
        vertex: parseInt(vertexData[0]) - 1,  // OBJ usa índices 1-based
        texCoord: vertexData[1] ? parseInt(vertexData[1]) - 1 : -1,
        normal: vertexData[2] ? parseInt(vertexData[2]) - 1 : -1
      });
    }

    // Triangulação (Fan Method) - Essencial para modelos complexos
    if (face.length === 3) {
      this.faces.push(face);
    } else if (face.length > 3) {
      for (let i = 1; i < face.length - 1; i++) {
        this.faces.push([face[0], face[i], face[i + 1]]);
      }
    }
  }

  /**
   * Constrói arrays de geometria para WebGL
   * @returns {Object} Objeto com positions, normals, texCoords e vertexCount
   */
  buildGeometry() {
    const positions = [];
    const normals = [];
    const texCoords = [];

    for (let i = 0; i < this.faces.length; i++) {
      const face = this.faces[i];
      
      for (let j = 0; j < face.length; j++) {
        const vertexIndex = face[j].vertex;
        const normalIndex = face[j].normal;
        const texCoordIndex = face[j].texCoord;

        // Posição
        positions.push(
          this.vertices[vertexIndex * 3],
          this.vertices[vertexIndex * 3 + 1],
          this.vertices[vertexIndex * 3 + 2]
        );

        // Normal
        if (normalIndex >= 0 && this.normals.length > 0) {
          normals.push(
            this.normals[normalIndex * 3],
            this.normals[normalIndex * 3 + 1],
            this.normals[normalIndex * 3 + 2]
          );
        } else {
          // Se não houver normais, calcula normal da face
          normals.push(0, 1, 0);
        }

        // Coordenada de textura
        if (texCoordIndex >= 0 && this.texCoords.length > 0) {
          texCoords.push(
            this.texCoords[texCoordIndex * 2],
            this.texCoords[texCoordIndex * 2 + 1]
          );
        } else {
          texCoords.push(0, 0);
        }
      }
    }

    // Calcula normais se não existirem no arquivo
    if (this.normals.length === 0 && positions.length > 0) {
      this.calculateNormals(positions, normals);
    }

    return {
      positions: new Float32Array(positions),
      normals: new Float32Array(normals),
      texCoords: new Float32Array(texCoords),
      vertexCount: positions.length / 3
    };
  }

  /**
   * Calcula normais por face para geometria sem normais
   * @param {Array<number>} positions - Array de posições
   * @param {Array<number>} normals - Array de normais (output)
   */
  calculateNormals(positions, normals) {
    for (let i = 0; i < positions.length; i += 9) {
      // Pega os três vértices do triângulo
      const v1 = [positions[i], positions[i + 1], positions[i + 2]];
      const v2 = [positions[i + 3], positions[i + 4], positions[i + 5]];
      const v3 = [positions[i + 6], positions[i + 7], positions[i + 8]];

      // Calcula vetores das arestas
      const edge1 = [v2[0] - v1[0], v2[1] - v1[1], v2[2] - v1[2]];
      const edge2 = [v3[0] - v1[0], v3[1] - v1[1], v3[2] - v1[2]];

      // Produto vetorial para obter a normal
      const normal = [
        edge1[1] * edge2[2] - edge1[2] * edge2[1],
        edge1[2] * edge2[0] - edge1[0] * edge2[2],
        edge1[0] * edge2[1] - edge1[1] * edge2[0]
      ];

      // Normaliza
      const len = Math.sqrt(normal[0] * normal[0] + normal[1] * normal[1] + normal[2] * normal[2]);
      if (len > 0) {
        normal[0] /= len;
        normal[1] /= len;
        normal[2] /= len;
      }

      // Aplica a mesma normal para os três vértices do triângulo
      for (let j = 0; j < 3; j++) {
        normals[i / 3 + j * 3] = normal[0];
        normals[i / 3 + j * 3 + 1] = normal[1];
        normals[i / 3 + j * 3 + 2] = normal[2];
      }
    }
  }
}

/**
 * Função auxiliar para carregar um arquivo OBJ
 * @param {string} url - Caminho para o arquivo .obj
 * @returns {Promise<Object>} Dados da geometria
 */
export async function loadOBJ(url) {
  const loader = new OBJLoader();
  return await loader.load(url);
}
