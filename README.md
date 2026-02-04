# Passeio Virtual 3D

Projeto acadêmico desenvolvido como **Passeio Virtual 3D**, utilizando **WebGL puro (sem Three.js ou bibliotecas gráficas de alto nível)**, com foco em computação gráfica, pipeline de renderização, câmera em primeira pessoa, iluminação e transformações geométricas.

---

## Objetivo do Projeto

Desenvolver um ambiente 3D interativo que permita ao usuário explorar um cenário virtual por meio de uma **câmera em primeira pessoa**, implementando manualmente os principais conceitos de Computação Gráfica, como:

* Projeção perspectiva
* Pipeline gráfico
* Modelo de iluminação de Phong
* Transformações geométricas
* Texturização
* Interação via teclado e mouse

Todo o cenário é **construído manualmente no código**, sem importação de modelos externos.

---

## Tecnologias Utilizadas

* **JavaScript (ES6+)**
* **WebGL 2.0**
* **HTML5 Canvas** (apenas para criação do contexto gráfico)
* **Biblioteca de Álgebra Linear** (ex.: `glMatrix` ou equivalente)

> ⚠️ Não são utilizadas bibliotecas gráficas de alto nível como Three.js.

---

## Funcionalidades Implementadas

### Requisitos Gerais

* ✅ Projeção perspectiva
* ✅ Câmera com movimentação livre
* ✅ Iluminação baseada no **modelo de reflexão de Phong**
* ✅ Fonte de luz móvel
* ✅ Objetos 3D com:

  * textura
  * cor sólida
* ✅ Animações por transformações geométricas
* ✅ Interação por teclado (WASD / setas)
* ✅ Renderização feita exclusivamente com WebGL puro

### Requisitos Específicos — Passeio Virtual

* ✅ Câmera em primeira pessoa (FPS)
* ✅ Controle por teclado (WASD)
* ✅ Cenário construído manualmente no código
* ❌ Não há detecção de colisão realista (opcional)

---

## Arquitetura do Projeto

O projeto segue uma arquitetura modular para facilitar manutenção, leitura e extensão do código.

```
project-name/
│
├── index.html              # Canvas e inicialização
├── README.md
├── assets/
│   ├── textures/           # Texturas usadas na cena
│
├── src/
│   ├── core/
│   │   ├── glContext.js    # Inicialização do WebGL
│   │   ├── shader.js       # Compilação e linkagem de shaders
│   │   └── program.js      # Programa WebGL
│   │
│   ├── math/
│   │   ├── matrix.js       # Matrizes (model, view, projection)
│   │   └── vector.js
│   │
│   ├── camera/
│   │   └── fpsCamera.js    # Câmera em primeira pessoa
│   │
│   ├── scene/
│   │   ├── scene.js        # Gerenciamento da cena
│   │   └── objects.js      # Objetos 3D da cena
│   │
│   ├── lighting/
│   │   └── phong.js        # Parâmetros do modelo de Phong
│   │
│   ├── input/
│   │   └── controls.js     # Teclado e mouse
│   │
│   └── main.js             # Loop principal de renderização
│
└── shaders/
    ├── vertex.glsl
    └── fragment.glsl
```

---

## Pipeline Gráfico (Resumo)

1. Definição dos vértices no espaço do objeto
2. Aplicação da **Matriz Model**
3. Transformação para o espaço da câmera (**View Matrix**)
4. Aplicação da **Projeção Perspectiva**
5. Cálculo da iluminação no Fragment Shader (Phong)
6. Rasterização e exibição no Canvas

---

## Iluminação — Modelo de Phong

A iluminação é calculada no **Fragment Shader**, considerando:

* Componente ambiente
* Componente difusa
* Componente especular

A posição da fonte de luz pode ser animada dinamicamente na cena.

---

## Controles

| Tecla | Ação                    |
| ----- | ----------------------- |
| W     | Mover para frente       |
| S     | Mover para trás         |
| A     | Mover para a esquerda   |
| D     | Mover para a direita    |
| ↑ ↓   | Olhar para cima / baixo |
| ← →   | Rotação horizontal      |

---

## ▶Como Executar o Projeto

### Opção 1 — Servidor local simples

```bash
python3 -m http.server
```

Acesse no navegador:

```
http://localhost:8000
```

### Opção 2 — Extensão Live Server (VS Code)

1. Instale a extensão **Live Server**
2. Clique com o botão direito em `index.html`
3. Selecione **Open with Live Server**

---

## Avaliação (Checklist)

* [] Projeção perspectiva e câmera
* [] Iluminação Phong
* [] Transformações geométricas e animações
* [] Texturização
* [] Interação teclado/mouse
* [] Organização do código
* [] Documentação

---

## 👥 Equipe

* Layza Carneiro
* Samuel William
* Samuel Valente

---

## 📎 Entregáveis

* 🔗 Repositório GitHub: *(link aqui)*
* 🎞️ Vídeo de demonstração: *(link aqui)*
* 📊 Slides de apresentação: *(link aqui)*

---

## 🧠 Observações Finais

Este projeto tem caráter **didático**, priorizando a implementação manual dos conceitos fundamentais de Computação Gráfica, sem abstrações fornecidas por engines ou bibliotecas gráficas de alto nível.
