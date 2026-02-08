# 🚀 Guia Rápido - Como Adicionar Modelo OBJ

## Passo 1: Obter um Modelo OBJ

### Opção A: Usar o exemplo incluído
Já incluído: `models/pyramid.obj` - Uma pirâmide simples para teste

### Opção B: Baixar da Internet
Sites recomendados:
- [Free3D](https://free3d.com)
- [Sketchfab](https://sketchfab.com/features/free-3d-models)

### Opção C: Criar no Blender
1. Abra o Blender
2. Modele seu objeto
3. File → Export → Wavefront (.obj)
4. Salve na pasta `models/`

## Passo 2: Adicionar ao Projeto

1. Coloque seu arquivo `.obj` na pasta `models/`
2. Abra `src/main.js`
3. Localize a linha ~147 (tem um comentário)
4. Descomente e ajuste:

```javascript
// ANTES (comentado):
// loadOBJModel('models/pyramid.obj');

// DEPOIS (ativo):
loadOBJModel('models/pyramid.obj');
```

## Passo 3: Testar

1. Inicie um servidor local:
```bash
python -m http.server 8000
```

2. Abra o navegador:
```
http://localhost:8000
```

3. Clique no canvas e use:
   - **W/A/S/D**: Mover
   - **Mouse**: Olhar ao redor

## Passo 4: Ajustar Posição/Escala

No `main.js`, função `render()`, linha ~171:

```javascript
const objModel = new Float32Array([
  escala, 0, 0, 0,           // Escala X
  0, escala, 0, 0,           // Escala Y
  0, 0, escala, 0,           // Escala Z
  posX, posY, posZ, 1        // Posição X, Y, Z
]);
```

Exemplo - Modelo maior na posição (0, 2, -5):
```javascript
const objModel = new Float32Array([
  2, 0, 0, 0,    // 2x maior
  0, 2, 0, 0,
  0, 0, 2, 0,
  0, 2, -5, 1    // 2 unidades acima, 5 à frente
]);
```

## 🎯 Exemplos Práticos

### Carregar múltiplos modelos:

```javascript
// Variáveis globais
let model1 = { vao: null, count: 0 };
let model2 = { vao: null, count: 0 };

// Carregar
loadOBJModel('models/tree.obj').then(data => {
  // configurar model1 com data
});
loadOBJModel('models/house.obj').then(data => {
  // configurar model2 com data
});

// Renderizar
if (model1.vao) {
  gl.bindVertexArray(model1.vao);
  gl.uniformMatrix4fv(uModel, false, matrizPosicao1);
  gl.drawArrays(gl.TRIANGLES, 0, model1.count);
}
```

## ❗ Problemas Comuns

### Modelo não aparece
- Verifique o console (F12) para erros
- Modelo pode estar muito grande/pequeno → ajuste a escala
- Modelo pode estar longe → ajuste a posição
- Use `console.log()` para debug

### Erro de CORS
- Use servidor local (não abra o HTML diretamente)
- `python -m http.server 8000`

### Modelo aparece preto
- É normal! Os shaders atuais não têm iluminação
- Próximo passo: implementar iluminação Phong (requisito II)

## 📝 Próximos Passos (Requisitos do Projeto)

1. ✅ **Leitor OBJ** - Completo!
2. ⬜ **Iluminação Phong** - Próximo
3. ⬜ **Texturas** - Depois
4. ⬜ **Animações** - Depois

---

**Dúvidas?** Consulte o [README_OBJ.md](README_OBJ.md) completo
