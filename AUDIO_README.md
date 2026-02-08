# 🎵 Sistema de Áudio - Documentação

## Implementação

Foi adicionado um sistema de áudio usando a **Web Audio API nativa** do navegador (HTML5 Audio), que **NÃO é uma biblioteca gráfica** e portanto está em conformidade com os requisitos do projeto.

## Arquivos Adicionados

- **`src/audio.js`** - Gerenciador de áudio com controles de play/pause/volume
- Modificado **`src/main.js`** - Import e inicialização do sistema de áudio

## Como Usar

### 1. Preparar o Arquivo de Áudio

Coloque seu arquivo de música na pasta do projeto. Formatos suportados:
- MP3 (`.mp3`) - Recomendado
- M4A/MP4 Audio (`.m4a`, `.mp4`)
- OGG (`.ogg`)
- WAV (`.wav`)

Exemplo de estrutura:
```
virtual_tour/
├── audio/
│   └── background-music.mp3
├── models/
├── src/
└── index.html
```

### 2. Ativar a Música

No arquivo `src/main.js`, descomente e ajuste a linha (próximo ao final do arquivo):

```javascript
// Linha ~156
audioManager.loadAndPlay('audio/background-music.mp3', 0.3);
```

Parâmetros:
- **Primeiro argumento**: Caminho para o arquivo de áudio
- **Segundo argumento**: Volume (0.0 a 1.0, onde 0.3 = 30%)

### 3. Controles Disponíveis

**Tecla M** - Muta/Desmuta a música

**API JavaScript**:
```javascript
// Pausar
audioManager.pause();

// Retomar
audioManager.resumeAudio();

// Ajustar volume (0.0 a 1.0)
audioManager.setVolume(0.5);

// Alternar play/pause
audioManager.toggle();

// Parar completamente
audioManager.stop();
```

## Observações Importantes

### Política de Autoplay dos Navegadores

Navegadores modernos (Chrome, Firefox, Safari) bloqueiam autoplay de áudio até que o usuário interaja com a página. O sistema implementado lida com isso automaticamente:

1. Tenta tocar a música automaticamente
2. Se bloqueado, aguarda o primeiro clique ou tecla pressionada
3. Exibe mensagem no console: "⚠ Áudio requer interação do usuário"

### Mensagens de Console

O sistema exibe mensagens úteis:
- `✓ Áudio carregado e pronto para tocar`
- `🎵 Música tocando em loop: [arquivo]`
- `⚠ Áudio requer interação do usuário. Clique na tela para iniciar.`
- `🎵 Música iniciada após interação do usuário`
- `⏸ Música pausada`
- `🔊 Volume ajustado para: [valor]`

## Exemplo Completo

```javascript
import { audioManager } from './audio.js';

// Carregar e tocar música em loop com volume 30%
audioManager.loadAndPlay('audio/epic-music.mp3', 0.3);

// Ajustar volume depois
setTimeout(() => {
  audioManager.setVolume(0.5); // 50%
}, 5000);

// Pausar após 1 minuto
setTimeout(() => {
  audioManager.pause();
}, 60000);
```

## Conformidade com Requisitos

✅ **Permitido pelo Requisito VII**: "É permitida a criação de contexto gráfico (canvas) como SDL, PyGame, GTK ou **Canvas (HTML5)**"

✅ **Não é biblioteca gráfica**: Web Audio API é API nativa do navegador para áudio, não afeta renderização WebGL

✅ **Não viola Requisito VI**: "WebGL puro" se refere apenas ao sistema gráfico, não proíbe áudio

## Onde Encontrar Música Livre

Sites com música livre de direitos autorais:
- [FreePD](https://freepd.com/)
- [Incompetech](https://incompetech.com/music/)
- [Free Music Archive](https://freemusicarchive.org/)
- [YouTube Audio Library](https://studio.youtube.com/)

## Troubleshooting

**Música não toca:**
1. Verifique o caminho do arquivo
2. Clique na tela (política de autoplay)
3. Verifique o console (F12) para mensagens de erro
4. Teste o arquivo de áudio diretamente no navegador

**Volume muito baixo:**
```javascript
audioManager.setVolume(1.0); // Volume máximo
```

**Música não faz loop:**
- O sistema já está configurado com `audio.loop = true`
- Verifique se não há erros no console
