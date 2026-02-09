# Documentação Técnica — Virtual Tour (WebGL2)

Documento focado no código: responsabilidades de cada módulo, parâmetros/retornos das funções, fluxo do “jogo” (páginas + loop principal) e detalhes do modelo de iluminação de **Phong/Blinn‑Phong**.

> Escopo: esta documentação descreve o estado atual do projeto (corredor + sala), com câmera FPS, colisão simples em XZ e iluminação configurável via shader Phong.

---

## 1. Visão Geral do Projeto

### 1.1 Estrutura (arquivos relevantes)

- `index.html`: tela inicial (UI) com botão para entrar no passeio.
- `intro.html`: introdução/story + equipe, com botão para entrar no corredor.
- `scene.html`: página que contém apenas o `<canvas>` e carrega `src/main.js`.
- `src/main.js`: inicialização WebGL + criação do cenário + loop de render.
- `src/camera.js`: câmera FPS (yaw/pitch), controle WASD, pointer lock e colisão.
- `src/scenario.js`: geração procedural de geometria (corredor → sala) + colisão em XZ + criação de VAO.
- `src/phong.js`: shaders (vertex/fragment) e funções utilitárias para setar uniforms do Phong.
- `src/math.js`: matemática mínima (perspectiva, normalize, cross).
- `src/shaders.js`: compilação/linkagem de shaders (helper genérico).

---

## 2. Fluxo do Jogo (Navegação e Runtime)

### 2.1 Navegação entre páginas

```
index.html
  └─(botão "INICIAR PASSEIO")→ intro.html
        └─(botão "ENTRAR NO CORREDOR")→ scene.html
              └─ carrega src/main.js (WebGL2)
```

### 2.2 Loop principal do WebGL

O loop de execução acontece em `src/main.js` com `requestAnimationFrame(render)`:

1. Ajuste de `deltaTime` (em segundos) e atualização de movimento da câmera.
2. Recomputar matriz de projeção (`perspective`) usando FOV configurado.
3. Limpar frame (`gl.clear`) e configurar viewport.
4. Calcular matriz de view (`camera.getViewMatrix()`).
5. Configurar iluminação (Phong) e material.
6. Renderizar cada “parte” do cenário (piso, paredes, teto, porta) chamando `gl.drawArrays`.

### 2.3 Controles

- Clique no canvas em `scene.html` ativa `pointer lock`.
- Mouse: altera `yaw` e `pitch`.
- Teclado: `WASD` move no plano XZ.

### 2.4 Como Rodar (servidor local)

Como o projeto usa **ES Modules** (`<script type="module">`) e carrega arquivos via URL, rode sempre com um **servidor HTTP local** (não abrir via `file://`).

Depois de iniciar um servidor na pasta raiz do projeto, acesse:

- `http://localhost:8000/` (fluxo completo: `index.html` → `intro.html` → `scene.html`)
- ou direto: `http://localhost:8000/scene.html`

#### Usando Python 3

```bash
cd virtual_tour
python3 -m http.server 8000
```

> Em muitos sistemas, `python -m http.server 8000` também funciona (se `python` apontar para Python 3).

#### Usando Python 2 (legado)

```bash
cd virtual_tour
python -m SimpleHTTPServer 8000
```

> Esse comando só existe no Python 2.

#### Usando JavaScript/Node.js

```bash
cd virtual_tour
npx http-server -p 8000
```

> Na primeira vez, o `npx` pode baixar o `http-server`.

#### Usando PHP

```bash
cd virtual_tour
php -S localhost:8000
```

---

## 3. Módulo de Matemática (`src/math.js`)

### 3.1 `perspective(fovy, aspect, near, far)`

- **Parâmetros**
  - `fovy`: ângulo vertical em radianos (ex.: `75°` → `1.309` rad)
  - `aspect`: razão `largura/altura`
  - `near`, `far`: planos de corte
- **Retorno**: `Float32Array(16)` com matriz de projeção perspectiva (column-major).
- **Comportamento**
  - Calcula `f = 1/tan(fovy/2)`.
  - Produz matriz compatível com pipeline usual de OpenGL/WebGL.

### 3.2 `normalize(v)`

- **Parâmetros**: `v` array `[x, y, z]`.
- **Retorno**: novo array com vetor unitário.
- **Observação**: assume `len != 0` (não trata vetor nulo explicitamente).

### 3.3 `cross(a, b)`

- **Parâmetros**: `a`, `b` vetores `[x, y, z]`.
- **Retorno**: produto vetorial `a × b`.

---

## 4. Sistema de Shaders Base (`src/shaders.js`)

### 4.1 `vsSource` / `fsSource`

- Shaders mínimos (não-Phong) usados como exemplo/base.
- No projeto atual, o “runtime real” usa os shaders definidos em `src/phong.js`.

### 4.2 `createProgram(gl, vsSource, fsSource)`

- **Parâmetros**
  - `gl`: contexto WebGL2
  - `vsSource`: string GLSL do vertex shader
  - `fsSource`: string GLSL do fragment shader
- **Retorno**: `WebGLProgram`
- **Comportamento**
  - Compila vertex e fragment shader.
  - Faz link do programa.
  - Em caso de erro de compilação, loga `gl.getShaderInfoLog(shader)` no console.

---

## 5. Iluminação de Phong / Blinn‑Phong (`src/phong.js`)

Este arquivo contém:

- `phongVsSource`: vertex shader
- `phongFsSource`: fragment shader
- Helpers JS para **localizar uniforms** e **setar valores** (material, câmera, luzes).

### 5.1 Vertex Shader (`phongVsSource`)

**Entradas (atributos):**
- `layout(location=0) in vec3 aPosition`
- `layout(location=1) in vec3 aNormal`

**Uniforms:**
- `uModel`, `uView`, `uProjection`: matrizes 4×4
- `uNormalMatrix`: matriz 3×3

**Saídas para o fragment shader:**
- `vWorldPos`: posição do fragmento em mundo (calculada como `uModel * vec4(aPosition,1)`)
- `vWorldNormal`: normal em mundo (normalizada após multiplicação por `uNormalMatrix`)

> A normal matrix é necessária porque normal não deve ser transformada com a mesma matriz 4×4 do modelo quando há escala não-uniforme.

### 5.2 Fragment Shader (`phongFsSource`)

O fragment shader calcula a cor final como soma de:

- **Ambiente:**
  - `ambient = uKa * uAmbientColor * uBaseColor`
- **Difusa (Lambert):**
  - `diffuse = uKd * max(dot(n, l), 0) * lightColor * uBaseColor`
- **Especular (Blinn‑Phong):**
  - `h = normalize(v + l)` (half-vector)
  - `spec = pow(max(dot(n, h), 0), uShininess)`
  - `specular = uKs * spec * lightColor`

Onde:
- `n` é a normal do fragmento em mundo.
- `v` é o vetor direção do fragmento para a câmera (`normalize(uCameraPos - vWorldPos)`).
- `l` depende do tipo de luz.

#### 5.2.1 Luz Direcional (`DirectionalLight`)

- Campos: `direction`, `color`, `intensity`, `enabled`.
- `l = normalize(-direction)`.
- **Não tem atenuação por distância**.

#### 5.2.2 Luz Pontual (`PointLight`)

- Campos: `position`, `color`, `intensity`, `attenuation(kc,kl,kq)`, `enabled`.
- Direção:
  - `toLight = position - vWorldPos`
  - `dist = length(toLight)`
  - `l = toLight / dist`
- Atenuação:
  - `att = 1 / (kc + kl*dist + kq*dist²)`
- `lightColor = color * intensity * att`

> No runtime atual, a luz pontual é usada como “luz da cabeça” do jogador.

#### 5.2.3 SpotLight (`SpotLight`) — (implementada, pode ser ativada)

- Campos:
  - `position`, `direction`, `color`, `intensity`
  - `attenuation(kc,kl,kq)`
  - `innerCutoff`, `outerCutoff` (valores já em **cos**)
  - `enabled`

**Cone:**
- `theta = dot(normalize(-l), normalize(direction))`
- `cone = clamp((theta - outerCutoff) / (innerCutoff - outerCutoff), 0, 1)`

Isso cria borda suave: dentro do cone interno `cone≈1`; fora do cone externo `cone=0`.

### 5.3 Funções utilitárias em JS

#### 5.3.1 `createPhongProgram(gl)`

- **Parâmetros:** `gl`.
- **Retorno:** `WebGLProgram`.
- **Comportamento:** chama `createProgram` com `phongVsSource` e `phongFsSource`.

#### 5.3.2 `getPhongLocations(gl, program)`

- **Parâmetros:** `gl`, `program`.
- **Retorno:** objeto com todas as `WebGLUniformLocation` usadas pelo shader.
- **Uso:** evita fazer `getUniformLocation` a cada frame.

#### 5.3.3 `setPhongMatrices(gl, locs, { model, view, projection, normalMatrix })`

- **Parâmetros**
  - `model`, `view`, `projection`: `Float32Array(16)` (opcionais)
  - `normalMatrix`: `Float32Array(9)` (opcional)
- **Retorno:** nenhum.
- **Comportamento:** só seta uniform se o campo existir.

#### 5.3.4 `setPhongCamera(gl, locs, cameraPos)`

- **Parâmetros:** `cameraPos` array `[x,y,z]`.
- **Retorno:** nenhum.

#### 5.3.5 `setPhongAmbient(gl, locs, ambientColor)`

- **Parâmetros:** `ambientColor` array `[r,g,b]`.
- **Retorno:** nenhum.

#### 5.3.6 `setPhongMaterial(gl, locs, material)`

- **Parâmetros:**
  - `material.baseColor`: `[r,g,b]`
  - `material.ka`, `material.kd`, `material.ks`: floats
  - `material.shininess`: float
- **Retorno:** nenhum.

#### 5.3.7 `setPhongDirectionalLight(gl, locs, light)`

- **Parâmetros:**
  - `light.enabled` (default `true`)
  - `light.direction`, `light.color`, `light.intensity`
- **Retorno:** nenhum.
- **Comportamento:** se `enabled=false`, seta apenas o flag e retorna.

#### 5.3.8 `setPhongPointLight(gl, locs, light)`

- **Parâmetros:**
  - `light.enabled` (default `true`)
  - `light.position`, `light.color`, `light.intensity`
  - `light.attenuation`: `[kc,kl,kq]` (default `[1,0.09,0.032]`)
- **Retorno:** nenhum.

#### 5.3.9 `setPhongSpotLight(gl, locs, light)`

- **Parâmetros:**
  - `light.enabled` (default `true`)
  - `light.position`, `light.direction`, `light.color`, `light.intensity`
  - `light.attenuation` (default `[1,0.14,0.07]`)
  - `light.innerCutoff`, `light.outerCutoff` (defaults 12°/20° em cos)
- **Retorno:** nenhum.

#### 5.3.10 `normalMatrixFromMat4(modelMat4)`

- **Parâmetros:** `modelMat4` (`Float32Array(16)`).
- **Retorno:** `Float32Array(9)` com `transpose(inverse(mat3(model)))`.
- **Comportamento:**
  - Extrai a parte 3×3 da matriz.
  - Calcula inversa por cofatores.
  - Transpõe para obter a normal matrix.

---

## 6. Câmera FPS (`src/camera.js`)

### 6.1 `class Camera`

A câmera mantém estado de posição e orientação e fornece a view matrix.

#### 6.1.1 `constructor(canvas, opts = {})`

- **Parâmetros**
  - `canvas`: elemento `<canvas>` usado para pointer lock.
  - `opts.position`: `[x,y,z]` inicial.
  - `opts.speed`: velocidade em unidades/segundo.
  - `opts.sensitivity`: sensibilidade do mouse (atual: propriedade fixa no código).
  - `opts.collisionFn`: função opcional `(x, z, radius) => boolean`.
  - `opts.radius`: raio para colisão.
- **Efeitos**
  - Registra listeners de teclado (`keydown`/`keyup`) e mouse (`mousemove`).
  - Clique no canvas chama `requestPointerLock()`.

#### 6.1.2 `updateRotation(e)`

- **Parâmetros:** evento de mouse (`movementX`, `movementY`).
- **Retorno:** nenhum.
- **Comportamento:**
  - Só atualiza se o canvas estiver em pointer lock.
  - `yaw += movementX*sensitivity`
  - `pitch` é clampado em `[-89, 89]` graus.

#### 6.1.3 `updatePosition(deltaTimeSeconds)`

- **Parâmetros:** `deltaTimeSeconds` (float). Se omitido, usa fallback ~`1/60`.
- **Retorno:** nenhum.
- **Comportamento:**
  - Calcula vetores `forward` e `right` no plano XZ a partir de `yaw`.
  - Aplica WASD para compor deslocamento `(dx, dz)`.
  - Atualiza `lastMoveDir` (normalizado em XZ) apenas quando há movimento.
  - Se existe `collisionFn`, faz “slide”: testa mover em X e depois em Z.

#### 6.1.4 `getViewMatrix()`

- **Parâmetros:** nenhum.
- **Retorno:** `Float32Array(16)` com view matrix.
- **Comportamento:**
  - Calcula vetor `front` com `yaw` e `pitch` (inclui inclinação vertical).
  - Usa `cross(front, up)` para obter `right` e `up` ortonormais.
  - Monta a matriz no formato compatível com WebGL (column-major).

---

## 7. Cenário Procedural e Colisão (`src/scenario.js`)

### 7.1 Funções de construção de malha (internas)

Essas funções não são exportadas, mas são o “motor” do cenário.

#### `pushTri(pos, nor, a, b, c, n)`

- **Parâmetros**
  - `pos`: array mutável de posições (números)
  - `nor`: array mutável de normais (números)
  - `a`, `b`, `c`: vértices `[x,y,z]`
  - `n`: normal `[x,y,z]`
- **Efeito:** adiciona 3 vértices e repete a normal 3 vezes.

#### `pushQuad(pos, nor, a, b, c, d, n)`

- **Descrição:** cria 2 triângulos (`a-b-c` e `a-c-d`).

#### `makeMesh()` / `finalizeMesh(mesh)`

- `makeMesh()` cria `{ positions: [], normals: [], vertexCount: 0 }`.
- `finalizeMesh()` converte para `Float32Array` e calcula `vertexCount`.

#### `addFloor(...)`, `addCeiling(...)`, `addWallX(...)`, `addWallZ(...)`

- Adicionam quads com normais corretas.
- `addWallX`/`addWallZ` ajustam o winding dependendo do sinal da normal.

### 7.2 `createCorridorRoomScenario(gl, cfg = {})`

- **Parâmetros (cfg)**
  - `corridorWidth`, `corridorLength`
  - `roomSize`
  - `wallHeight`
  - `doorWidth`, `doorHeight`, `doorThickness`
  - `carpetWidth`: largura do tapete (unidades do mundo)
  - `carpetOffsetY`: deslocamento em Y do tapete (evita z-fighting com o piso)
- **Retorno**: objeto `{ params, meshes, checkCollision }`
  - `params`: configuração final resolvida (com defaults)
  - `meshes`: `{ floor, carpet, ceiling, walls, door }` com `positions`, `normals`, `vertexCount`
  - `checkCollision(x,z,radius)`: colisão em XZ

**Sistema de coordenadas do cenário:**
- Corredor: `z ∈ [0, Lc]`
- Sala: `z ∈ [Lc, Lc + S]`
- Paredes laterais em `x = ±(largura/2)`.

**Tapete vermelho (objeto sólido):**

- O tapete é um mesh separado (`meshes.carpet`) para permitir **material próprio** (vermelho sólido).
- Ele vai do início do passeio até a entrada da sala, cobrindo `z ∈ [0, Lc]`.
- Ele fica levemente acima do piso (`carpetOffsetY`, default `0.01`) para evitar “z-fighting” (briga no depth buffer) com o mesh do piso.

#### `checkCollision(x, z, radius = 0.35)`

- **Retorno:** `true` se o ponto (com raio) colide.
- **Regras:**
  - Bloqueia `z < radius` (parede/porta de entrada).
  - No corredor: bloqueia `|x| > corridorWidth/2 - radius`.
  - Na sala: bloqueia `|x| > roomSize/2 - radius`.
  - Bloqueia saída após o fundo da sala.

### 7.3 `createVAO(gl, mesh)`

- **Parâmetros**
  - `mesh.positions`: `Float32Array` (vec3)
  - `mesh.normals`: `Float32Array` (vec3)
- **Retorno**: `{ vao, vertexCount }`.
- **Comportamento**
  - Cria VAO.
  - Seta `aPosition` em `location=0`.
  - Seta `aNormal` em `location=1`.
  - O desenho é feito com `gl.drawArrays(gl.TRIANGLES, 0, vertexCount)`.

---

## 8. Loop de Render e Configuração (`src/main.js`)

### 8.1 `resizeCanvas()`

- **Parâmetros:** nenhum.
- **Retorno:** nenhum.
- **Comportamento:** ajusta `canvas.width/height` para o tamanho da janela.

### 8.2 Constantes de gameplay

- `MOVE_SPEED`: unidades/segundo.
- `TARGET_TIME_TO_ROOM`: usado como base para estimar comprimento do corredor.
- `CORRIDOR_EXTRA`: ajuste fino do comprimento.
- `FOV_DEG`: campo de visão vertical em graus.

### 8.3 `render(time)`

- **Parâmetros:** `time` em ms (fornecido pelo `requestAnimationFrame`).
- **Retorno:** nenhum.
- **Comportamento:**
  1. Calcula `dt` (clampado em 0.05s para estabilidade).
  2. Move a câmera (`camera.updatePosition(dt)`).
  3. Recalcula projeção perspectiva.
  4. Configura a iluminação:
     - `ambient` baixo
     - `DirectionalLight` desabilitada
     - `PointLight` ativa na posição da cabeça (iluminação local)
     - `SpotLight` desabilitada (mas disponível para alternar).
  5. Seta matrizes e normal matrix.
  6. Renderiza as partes do cenário, cada uma com seu material.
     - Partes típicas (na ordem de desenho): `floor`, `carpet`, `walls`, `ceiling`, `door`.
     - O tapete (`carpet`) usa material vermelho sólido e é desenhado separado do piso para não “tingir” o chão todo e para poder controlar o brilho/reflectância de forma independente.

---

## 9. Notas Importantes e Ajustes Rápidos

### 9.1 Ajuste de “alcance” da luz

O alcance percebido da luz pontual depende fortemente de `attenuation = [kc, kl, kq]`:

- Para **cair mais rápido** (menos luz longe): aumente `kq`.
- Para **cair mais devagar** (mais alcance): diminua `kl`/`kq` e/ou aumente `intensity`.

### 9.2 Ajuste de FOV

- `FOV_DEG` em `src/main.js` controla o FOV vertical.
- Valores comuns:
  - 60°: mais “zoom”
  - 75°: confortável para FPS
  - 90°: bem aberto (pode distorcer nas bordas)

### 9.3 Alternar para modo “tocha” (spotlight)

O shader já suporta `SpotLight`. Para usar como lanterna:

- Desabilite `PointLight`.
- Habilite `SpotLight` com `position` na cabeça e `direction` apontando para frente.

---

## 10. Glossário

- **Phong**: modelo de iluminação local (ambiente + difusa + especular).
- **Blinn‑Phong**: variante do especular usando half-vector `h = normalize(v + l)`.
- **VAO**: Vertex Array Object; armazena bindings de buffers e layout de atributos.
- **Pointer Lock**: API do browser para capturar movimento relativo do mouse (FPS).
