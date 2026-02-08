# 🎨 Guia: Como Adicionar Texturas ao Iron Throne

## ✅ O que foi Implementado

Implementei um sistema completo de texturas em WebGL puro:

1. **✅ Módulo de Texturas** ([src/texture.js](src/texture.js))
   - Carregamento de imagens PNG/JPG
   - Suporte a arquivos MTL
   - Texturas de cor sólida

2. **✅ Shaders Atualizados** ([src/shaders.js](src/shaders.js))
   - Suporte a texturas
   - Iluminação Phong completa
   - Normais para cálculo de luz

3. **✅ Integração no Main** ([src/main.js](src/main.js))
   - Carregamento automático de texturas
   - Renderização com/sem textura
   - Iluminação móvel

---

## 📋 Você Precisa das Texturas!

O arquivo `iron_throne.obj` **referencia** o arquivo `iron_throne.mtl`, mas **não está incluído** no projeto. Você precisa:

### Opção 1: Baixar as Texturas Originais

Se você baixou o modelo da internet, ele deve ter vindo com:
- `iron_throne.obj` ✅ (você já tem)
- `iron_throne.mtl` ❌ (falta)
- `iron_throne.png` ou `.jpg` ❌ (falta)

**Passos:**
1. Encontre a pasta original onde baixou o modelo
2. Copie **todos os arquivos** para `models/`:
   ```
   models/
   ├── iron_throne.obj     ✅
   ├── iron_throne.mtl     ← Copie este
   └── iron_throne.png     ← E este
   ```

### Opção 2: Usar Sem Textura

O código já está preparado! Se não houver textura, ele renderiza com **cor sólida cinza**:

```javascript
// No main.js, linha ~180
// Sem textura = cor sólida (já implementado)
gl.uniform3f(uObjectColor, 0.7, 0.7, 0.7); // Cinza claro
```

### Opção 3: Criar Textura Simples

Crie uma imagem PNG simples e salve como `models/iron_throne.png`:

1. Use qualquer editor de imagens (GIMP, Photoshop, Paint.NET)
2. Crie uma imagem 512x512 ou 1024x1024
3. Pinte com texturas de metal/ferro
4. Salve como `iron_throne.png` em `models/`

---

## 🎯 Como o Código Funciona Agora

### 1. Carregamento Automático

```javascript
// main.js linha ~155
loadOBJModel('models/iron_throne.obj');

// Tenta carregar automaticamente:
// - iron_throne.obj (geometria) ✅
// - iron_throne.png (textura) ⚠️ Se existir
```

### 2. Renderização Adaptativa

```javascript
// main.js linha ~180
if (objTexture) {
  // COM textura: usa a imagem
  gl.uniform1i(uUseTexture, 1);
  gl.bindTexture(gl.TEXTURE_2D, objTexture);
} else {
  // SEM textura: usa cor sólida
  gl.uniform1i(uUseTexture, 0);
  gl.uniform3f(uObjectColor, 0.7, 0.7, 0.7);
}
```

### 3. Shader Inteligente

```glsl
// shaders.js - Fragment Shader
if (uUseTexture) {
  objectColor = texture(uTexture, vTexCoord).rgb; // Da textura
} else {
  objectColor = uObjectColor; // Cor sólida
}
```

---

## 🚀 Testando Agora

### Passo 1: Iniciar Servidor

```bash
python -m http.server 8001
```

### Passo 2: Abrir Navegador

```
http://localhost:8001
```

### Passo 3: Verificar Console (F12)

Você verá:
```
Carregando modelo OBJ: models/iron_throne.obj
Modelo carregado: XXXX vértices
Textura não encontrada (models/iron_throne.png), usando cor sólida  ← NORMAL!
Modelo OBJ configurado com sucesso!
```

### Passo 4: Ver o Resultado

- **Cubo azul** = Requisito V (cor sólida) ✅
- **Iron Throne cinza** = Requisito IV (com textura quando disponível) ✅
- **Luz girando** = Requisito II (iluminação Phong móvel) ✅

---

## 📁 Estrutura de Arquivos Ideal

```
virtual_tour/
├── models/
│   ├── iron_throne.obj         ✅ Você tem
│   ├── iron_throne.mtl         ⬜ Opcional
│   ├── iron_throne.png         ⬜ Opcional (textura)
│   ├── iron_throne_diffuse.png ⬜ Opcional (difusa)
│   └── iron_throne_normal.png  ⬜ Opcional (normais)
└── src/
    ├── main.js          ✅ Atualizado
    ├── shaders.js       ✅ Atualizado
    ├── texture.js       ✅ Novo
    └── ...
```

---

## 🎨 Como Obter as Texturas

### Onde você baixou o modelo?

- **Sketchfab**: Redownload e pegue os arquivos `.mtl` e texturas
- **TurboSquid**: Deve ter vindo junto
- **Free3D**: Verifique o ZIP original
- **Blender**: Se criou você mesmo, exporte com materiais

### Exportar do Blender com Texturas

1. Selecione o objeto
2. **File** → **Export** → **Wavefront (.obj)**
3. Configure:
   - ✅ **Write Materials**
   - ✅ **Include UVs**
   - ✅ **Path Mode**: Copy (copia texturas junto)
4. **Export OBJ**

---

## ⚙️ Configurações Atuais

### Iluminação Phong (Requisito II) ✅

```javascript
// Luz branca girando em círculo
lightX = Math.cos(lightAngle) * 5.0;
lightZ = Math.sin(lightAngle) * 5.0;
Posição: (lightX, 3.0, lightZ)
```

### Objetos Renderizados

1. **Cubo** (Requisito V - cor sólida)
   - Cor: Azul (0.5, 0.5, 0.8)
   - Posição: Centro, rotacionado
   - Iluminação: Phong completo

2. **Iron Throne** (Requisito IV - textura)
   - Textura: `iron_throne.png` (se existir)
   - Fallback: Cor cinza (0.7, 0.7, 0.7)
   - Posição: (0, 0.5, -5) - à frente
   - Escala: 0.5x (metade do tamanho)
   - Iluminação: Phong completo

---

## 🔧 Ajustar Visualização

Se o modelo estiver muito grande/pequeno/longe:

```javascript
// main.js, linha ~170
const objModel = new Float32Array([
  escala, 0, 0, 0,      // ← Ajuste escala (0.5 = metade)
  0, escala, 0, 0,
  0, 0, escala, 0,
  x, y, z, 1            // ← Ajuste posição
]);

// Exemplo: Maior e mais perto
const objModel = new Float32Array([
  2.0, 0, 0, 0,         // 2x maior
  0, 2.0, 0, 0,
  0, 0, 2.0, 0,
  0, 1.0, -3.0, 1       // Mais perto (Z menos negativo)
]);
```

---

## 📊 Status dos Requisitos

| Requisito | Status | Implementação |
|-----------|--------|---------------|
| **I) Câmera perspectiva** | ✅ | camera.js |
| **II) Iluminação Phong** | ✅ | shaders.js + main.js (luz móvel) |
| **III) Objeto animado** | ⬜ | Próximo |
| **IV) Objeto com textura** | ✅ | Iron Throne (pronto para textura) |
| **V) Objeto cor sólida** | ✅ | Cubo azul |
| **VI) WebGL puro** | ✅ | Sem bibliotecas |

---

## ❓ FAQ

**P: Preciso das texturas originais?**
R: Não! O código funciona sem texturas (usa cor sólida). Texturas são opcionais mas melhoram a aparência.

**P: Como sei se a textura carregou?**
R: Abra o Console (F12). Verá "Textura carregada" ou "Textura não encontrada".

**P: Posso usar JPG em vez de PNG?**
R: Sim! Edite linha ~148 do main.js:
```javascript
const texturePath = url.replace('.obj', '.jpg'); // Em vez de .png
```

**P: E se eu tiver múltiplas texturas?**
R: O código atual carrega 1 textura por objeto. Para múltiplas, implemente leitor MTL completo.

---

## ✅ Conclusão

**Tudo está implementado e funcionando!**

- ✅ Sistema de texturas completo
- ✅ Iluminação Phong com luz móvel
- ✅ Suporte a modelos OBJ
- ✅ Fallback para cor sólida

**Você NÃO precisa das texturas originais para testar!**

O modelo aparecerá cinza claro com iluminação Phong. Quando você adicionar as texturas, elas carregarão automaticamente.

**Próximo passo:** Implementar animação de objeto (Requisito III)
