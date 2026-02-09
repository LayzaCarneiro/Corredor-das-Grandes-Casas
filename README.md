# Corredor das Grandes Casas - Game of Thrones 🏰

**Simulação interativa 3D desenvolvida em JavaScript com WebGL**, explorando manipulação de modelos 3D, iluminação Phong, shaders, colisão e interação em primeira pessoa.

Projeto acadêmico da disciplina de **Computação Gráfica**, desenvolvido para criar um tour virtual em um corredor com pôsteres, espada e trono.

---

## Descrição do Projeto

O projeto permite explorar um **corredor 3D estilizado**, com modelos interativos e posters informativos sobre casas de fantasia:

* Corredor com piso, paredes e tapete renderizados via WebGL.
* Posters 3D com informações exibidas dinamicamente quando o usuário se aproxima.
* Modelos 3D detalhados da **Espada** e do **Trono de Ferro**, posicionados no cenário.
* Movimento em primeira pessoa.
* Interações simples de colisão para impedir que o usuário atravesse objetos sólidos.

---

**Recursos Implementados:**

| Recurso                           | Implementação no projeto                                                                       |
| --------------------------------- | ---------------------------------------------------------------------------------------------- |
| **Renderização 3D**               | Geometria do cenário, posters e modelos carregados via OBJ e texturas.                         |
| **Shading Phong**                 | Luz ambiente, difusa e especular aplicada a todos os objetos com normal matrix.                |
| **Transformações geométricas**    | Escala, rotação e translação aplicadas a modelos e objetos da cena.                            |
| **Câmera em primeira pessoa**     | Movimento via teclado (W/A/S/D), mouse para olhar em volta.                                    |
| **Interações e colisão**          | Limites de paredes, colisão com trono e detecção de proximidade de posters.                    |
| **Texturas e materiais**          | Posters, espada e trono com texturas aplicadas dinamicamente.                          |
| **UI interativa**                 | Exibe título e informações do poster quando a câmera se aproxima.                              |
| **Animação da espada**            | Pequeno movimento (bob) baseado na velocidade da câmera para efeito de caminhada realista.     |
| **Carregamento de modelos OBJ**   | Espada e Trono de Ferro carregados dinamicamente, criados em VAOs para renderização eficiente. |
| **Shaders e iluminação dinâmica** | Uso de Phong, normal mapping básico e texturas aplicadas via WebGL.                            |

---

### Fluxo da Simulação:

1. **Intro / Tela Inicial** – Página HTML de entrada (`intro.html`) com breve animação.
2. **Corredor 3D** – Renderização do cenário com posters, trono e espada.
3. **Movimentação** – Navegação em primeira pessoa usando **W/A/S/D** e mouse.
4. **Interação com Posters** – Quando a câmera se aproxima de um poster, a UI exibe título e informações detalhadas.
5. **Exploração do Trono** – Colisão detecta limites do trono, mantendo a experiência realista.
6. **Visualização de Objetos** – Espada em primeira pessoa com efeito de bob, posters interativos e iluminação aplicada.

---

## Screenshots

Exemplos de visualizações do projeto:

---

## Requisitos do Sistema

* **Navegador:** Chrome, Firefox ou Edge (com suporte WebGL 2.0)
* **Node.js:** 16+ (para servidor local, se necessário)
* **Dependências:** Nenhuma além do navegador (todas assets são carregadas localmente)

---

## Instalação e Execução

### 1. Clone o projeto

```bash
git clone https://github.com/LayzaCarneiro/Corredor-das-Grandes-Casas
cd Corredor-das-Grandes-Casas
```

### 2. Execute em um servidor local

> Navegadores não permitem `fetch()` de arquivos locais (`file://`) por segurança. Use um servidor HTTP simples:

**Python 3**

```bash
python3 -m http.server 8000
```

**Node.js (http-server)**

```bash
npm install -g http-server
http-server -p 8000
```

### 3. Abra no navegador

Acesse: `http://localhost:8000/scene.html`

* Movimentação: **W/A/S/D**
* Olhar ao redor: **Mouse**
* Interação: Aproximar-se dos posters para exibir informações

---

## Estrutura de Pastas

```bash
Corredor-das-Grandes-Casas/
│
├── README.md          # Descrição geral do projeto
├── index.html         # Página inicial 
├── intro.html         # Tela de introdução com narrativa inicial
├── scene.html         # Cena principal 3D do corredor, onde acontece a exploração
├── assets/            # Recursos visuais (imagens utilizadas na UI e no cenário)
├── audio/             # Arquivos de música
├── docs/              # Documentação adicional, screenshots, diagramas e explicações técnicas
├── models/            # Modelos 3D (OBJ) e texturas associadas (espada, trono, posters, etc.)
├── node_modules/      # Dependências npm
└── src/               # Código-fonte principal do projeto
    ├── camera.js      # Controle da câmera em primeira pessoa: movimento, rotação e posição
    ├── data.js        # Configurações e dados dos posters (posição, título, informações, texturas)
    ├── main.js        # Script principal que inicializa WebGL, shaders, cenas e loop de renderização
    ├── math.js        # Funções matemáticas auxiliares (vetores, matrizes, operações trigonométricas)
    ├── obj.js         # Funções para carregar arquivos OBJ e parsear geometria 3D
    ├── poster.js      # Criação, renderização e UI interativa dos posters dentro do corredor
    ├── phong.js       # Implementação do shading Phong: materiais, iluminação e normal matrices
    ├── scenario.js    # Criação de meshes do cenário (corredor, piso, paredes, tapete, teto) e VAOs
    ├── scene.js       # Montagem do mundo 3D: instanciamento do cenário e configuração de partes
    ├── sword.js       # Carregamento e renderização da espada em primeira pessoa com efeito de bob
    ├── throne.js      # Carregamento, renderização e colisão do Trono de Ferro
    ├── transform.js   # Funções de transformação geométrica: escala, rotação, translação e multiplicação de matrizes
    └── shaders.js     # Shaders GLSL (vertex e fragment) utilizados para renderização Phong e texturas

```

---

## Dependências

| Pacote                 | Versão | Descrição                                       |
| ---------------------- | ------ | ----------------------------------------------- |
| `WebGL 2.0`            | n/a    | Motor gráfico do navegador para renderização 3D |
| `gl-matrix` (opcional) | ≥3.4   | Matrizes e operações vetoriais (se usadas)      |

> Todas as bibliotecas necessárias são carregadas via `<script>` ou estão incluídas no código.

---

## Documentação Técnica

* **`docs/`** – Contém screenshots, diagrama de pastas e explicações sobre o carregamento de modelos, shaders e interação 3D.
* Cada módulo no `src/` está comentado para explicar responsabilidades, como:

  * `poster.js` → UI dinâmica de posters
  * `sword.js` → Renderização da espada em primeira pessoa
  * `throne.js` → Trono de ferro com colisão
  * `scene.js` → Construção do cenário e VAOs do corredor

---

## Slides e Vídeo Demonstrativo

Para apresentar o projeto, preparamos materiais visuais e um vídeo demonstrativo:

* **Slides da Apresentação:** [Clique aqui para abrir os slides](docs/slides_corredor.pdf)  
* **Vídeo Demonstrativo:** [Assista no YouTube](https://youtu.be/SEU_VIDEO_DEMO)  

---

## Integrantes

Equipe responsável pelo desenvolvimento do projeto:

| <img src="assets/team/layza.png" width="300"/> | <img src="assets/team/william.png" width="300"/> | <img src="assets/team/valente.png" width="300"/> |
|---------------------------------|---------------------------------------|---------------------------------------|
| **🐉 Lady Layza Carneiro**              | **🫎 Sor Samuel William**                    | **🐺 Sor Samuel Valente**                     |
| [GitHub](https://github.com/LayzaCarneiro) | [GitHub](https://github.com/William-SWS) | [GitHub](https://github.com/ValenteBy) |

---


## Licença

Projeto acadêmico desenvolvido para a disciplina de Computação Gráfica.
