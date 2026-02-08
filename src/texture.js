/**
 * Módulo de carregamento de texturas para WebGL
 * Implementado do zero sem bibliotecas externas (Requisito VI)
 */

/**
 * Carrega uma imagem como textura WebGL
 * @param {WebGL2RenderingContext} gl - Contexto WebGL
 * @param {string} url - Caminho para a imagem
 * @returns {Promise<WebGLTexture>} Textura carregada
 */
export async function loadTexture(gl, url) {
  return new Promise((resolve, reject) => {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Textura temporária (1x1 pixel magenta) enquanto carrega
    const pixel = new Uint8Array([255, 0, 255, 255]); // Magenta
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixel);

    const image = new Image();
    image.crossOrigin = "anonymous"; // Para evitar problemas de CORS

    image.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

      // Verificar se a imagem é potência de 2
      if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
        // Gerar mipmaps para melhor qualidade
        gl.generateMipmap(gl.TEXTURE_2D);
      } else {
        // Não é potência de 2, usar configurações compatíveis
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      }

      console.log(`✓ Textura carregada: ${url} (${image.width}x${image.height})`);
      resolve(texture);
    };

    image.onerror = () => {
      console.error(`✗ Erro ao carregar textura: ${url}`);
      reject(new Error(`Falha ao carregar imagem: ${url}`));
    };

    image.src = url;
  });
}

/**
 * Verifica se um número é potência de 2
 * @param {number} value - Valor a verificar
 * @returns {boolean}
 */
function isPowerOf2(value) {
  return (value & (value - 1)) === 0;
}

/**
 * Carrega arquivo MTL (Material) e extrai informações
 * @param {string} url - Caminho para o arquivo .mtl
 * @returns {Promise<Object>} Objeto com materiais
 */
export async function loadMTL(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Falha ao carregar MTL: ${url}`);
    }
    
    const text = await response.text();
    const materials = {};
    let currentMaterial = null;
    
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line === '' || line.startsWith('#')) continue;
      
      const parts = line.split(/\s+/);
      const type = parts[0];
      
      switch (type) {
        case 'newmtl': // Novo material
          currentMaterial = parts[1];
          materials[currentMaterial] = {
            ambient: [1.0, 1.0, 1.0],
            diffuse: [1.0, 1.0, 1.0],
            specular: [1.0, 1.0, 1.0],
            shininess: 32.0,
            textures: {}
          };
          break;
          
        case 'Ka': // Cor ambiente
          if (currentMaterial) {
            materials[currentMaterial].ambient = [
              parseFloat(parts[1]),
              parseFloat(parts[2]),
              parseFloat(parts[3])
            ];
          }
          break;
          
        case 'Kd': // Cor difusa
          if (currentMaterial) {
            materials[currentMaterial].diffuse = [
              parseFloat(parts[1]),
              parseFloat(parts[2]),
              parseFloat(parts[3])
            ];
          }
          break;
          
        case 'Ks': // Cor especular
          if (currentMaterial) {
            materials[currentMaterial].specular = [
              parseFloat(parts[1]),
              parseFloat(parts[2]),
              parseFloat(parts[3])
            ];
          }
          break;
          
        case 'Ns': // Shininess
          if (currentMaterial) {
            materials[currentMaterial].shininess = parseFloat(parts[1]);
          }
          break;
          
        case 'map_Kd': // Textura difusa
          if (currentMaterial) {
            materials[currentMaterial].textures.diffuse = parts.slice(1).join(' ');
          }
          break;
      }
    }
    
    console.log('✓ Materiais carregados:', Object.keys(materials));
    return materials;
  } catch (error) {
    console.error('✗ Erro ao carregar MTL:', error);
    return {};
  }
}
