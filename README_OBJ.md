# 📦 Leitor de Arquivos OBJ

## 📘 Descrição

Implementação própria de um leitor de arquivos OBJ em JavaScript puro, compatível com WebGL 2.0. Este leitor foi desenvolvido do zero, sem uso de bibliotecas externas, seguindo os requisitos do projeto de passeio virtual 3D.

## ✨ Funcionalidades

- ✅ Leitura de vértices (v)
- ✅ Leitura de normais (vn)
- ✅ Leitura de coordenadas de textura (vt)
- ✅ Leitura de faces (f)
- ✅ Suporte a múltiplos formatos de face: `v`, `v/vt`, `v/vt/vn`, `v//vn`
- ✅ Triangulação automática de polígonos com mais de 3 vértices
- ✅ Cálculo automático de normais quando ausentes no arquivo
- ✅ Conversão direta para formato Float32Array (otimizado para WebGL)

## 📂 Estrutura de Arquivos

```
virtual_tour/
├── src/
│   ├── obj.js          ← Leitor OBJ implementado
│   ├── main.js         ← Integração do leitor
│   └── ...
├── models/
│   ├── pyramid.obj     ← Exemplo de modelo OBJ
│   └── ...             ← Coloque seus modelos aqui
└── README_OBJ.md       ← Este arquivo
```

## 🚀 Como Usar

### 1. Preparar o Modelo OBJ

Coloque seus arquivos `.obj` na pasta `models/`. Você pode:
- Criar modelos no Blender e exportar como OBJ
- Baixar modelos gratuitos da internet (ex: [Free3D](https://free3d.com), [TurboSquid Free](https://www.turbosquid.com/Search/3D-Models/free))
- Usar o modelo de exemplo `pyramid.obj` incluído

### 2. Importar e Carregar no Código

No arquivo [main.js](../src/main.js):

```javascript
import { loadOBJ } from './obj.js';

// Carregar modelo assincronamente
async function loadOBJModel(url) {
  const objData = await loadOBJ(url);
  
  // objData contém:
  // - positions: Float32Array com coordenadas XYZ dos vértices
  // - normals: Float32Array com normais
  // - texCoords: Float32Array com coordenadas UV
  // - vertexCount: Número de vértices
  
  // Criar VAO e buffers
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  
  const posBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, objData.positions, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
  
  // Retornar para renderização
  return { vao, vertexCount: objData.vertexCount };
}

// Exemplo de uso
loadOBJModel('models/pyramid.obj').then(model => {
  // Renderizar no loop principal
  gl.bindVertexArray(model.vao);
  gl.drawArrays(gl.TRIANGLES, 0, model.vertexCount);
});
```

### 3. Ativar o Carregamento da Pirâmide

No [main.js](../src/main.js), descomente a linha:

```javascript
// Linha ~114 aproximadamente
loadOBJModel('models/pyramid.obj');
```

### 4. Executar o Projeto

Abra o [index.html](../index.html) em um navegador com suporte a WebGL 2.0. Use um servidor local para evitar problemas de CORS:

```bash
# Opção 1: Python
python -m http.server 8000

# Opção 2: Node.js (npx)
npx http-server

# Opção 3: VS Code Live Server
# Instale a extensão "Live Server" e clique com botão direito no index.html
```

Acesse: `http://localhost:8000`

## 🎮 Controles

- **W/A/S/D**: Mover câmera
- **Mouse**: Rotacionar câmera (clique no canvas primeiro)

## 📝 Formato OBJ Suportado

### Exemplo de Arquivo OBJ

```obj
# Comentário
v 0.0 0.0 0.0           # Vértice (x, y, z)
v 1.0 0.0 0.0
v 0.0 1.0 0.0

vn 0.0 0.0 1.0          # Normal (x, y, z)
vn 0.0 1.0 0.0

vt 0.0 0.0              # Textura (u, v)
vt 1.0 0.0
vt 0.5 1.0

f 1 2 3                 # Face (apenas vértices)
f 1/1 2/2 3/3           # Face (vértice/textura)
f 1//1 2//1 3//2        # Face (vértice//normal)
f 1/1/1 2/2/1 3/3/2     # Face (vértice/textura/normal)
f 1 2 3 4               # Polígono (será triangulado)
```

## 🔧 Detalhes Técnicos

### Triangulação

Polígonos com mais de 3 vértices são automaticamente triangulados usando **fan triangulation**:
- Quad (4 vértices) → 2 triângulos
- Pentagon (5 vértices) → 3 triângulos
- etc.

### Cálculo de Normais

Se o arquivo OBJ não contiver normais (`vn`), o leitor calcula automaticamente as normais por face usando o produto vetorial:

```javascript
normal = (v2 - v1) × (v3 - v1)
```

### Índices

O formato OBJ usa índices 1-based. O leitor converte automaticamente para 0-based (padrão JavaScript/WebGL).

## 🎨 Exemplos de Modelos para Download

### Sites Recomendados (Modelos Gratuitos)

1. **[Free3D](https://free3d.com)** - Vasta coleção gratuita
2. **[TurboSquid Free](https://www.turbosquid.com/Search/3D-Models/free)** - Modelos de qualidade
3. **[Sketchfab](https://sketchfab.com/features/free-3d-models)** - Muitos modelos downloadable
4. **[OpenGameArt](https://opengameart.org)** - Focado em assets de jogos

### Criando no Blender

1. Modelar objeto no Blender
2. File → Export → Wavefront (.obj)
3. Configurações de exportação:
   - ✅ Include Normals
   - ✅ Include UVs
   - ✅ Triangulate Faces (opcional)
   - Scale: 1.0

## 🐛 Troubleshooting

### Modelo não aparece

- Verifique o console do navegador para erros
- Certifique-se que está usando um servidor local (CORS)
- Ajuste a escala do modelo (pode estar muito grande/pequeno)
- Verifique a posição da câmera

### Modelo aparece preto

- Implemente iluminação nos shaders
- Adicione atributo de normal no shader
- Use cores sólidas para debug

### Erros de carregamento

```javascript
// Adicione tratamento de erro
loadOBJModel('models/seu_modelo.obj').catch(err => {
  console.error('Falha ao carregar:', err);
});
```

## 📊 Performance

- Modelos pequenos (<10k vértices): Excelente
- Modelos médios (10k-50k vértices): Bom
- Modelos grandes (>50k vértices): Pode ter impacto no framerate

**Dica**: Para modelos complexos, considere:
- Reduzir geometria no Blender (Modifier → Decimate)
- Usar LOD (Level of Detail)
- Carregar apenas modelos necessários

## ✅ Conformidade com Requisitos

Este leitor OBJ atende todos os requisitos do projeto:

- ✅ Implementação própria (código do zero)
- ✅ Sem uso de bibliotecas externas de carregamento
- ✅ Compatível com WebGL puro
- ✅ Suporta modelos externos
- ✅ Totalmente documentado

## 📚 Referências

- [OBJ Format Specification](https://en.wikipedia.org/wiki/Wavefront_.obj_file)
- [WebGL2 Fundamentals](https://webgl2fundamentals.org/)
- [Blender OBJ Export](https://docs.blender.org/manual/en/latest/addons/import_export/scene_obj.html)

---

**Desenvolvido para o projeto de Computação Gráfica - Passeio Virtual 3D**
