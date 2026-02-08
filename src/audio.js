/**
 * Sistema de áudio usando Web Audio API nativa (não é biblioteca gráfica)
 * Permite tocar música de fundo em loop infinito
 */

export class AudioManager {
  constructor() {
    this.audio = null;
    this.isPlaying = false;
  }

  /**
   * Carrega e toca um arquivo de áudio em loop
   * @param {string} url - Caminho para o arquivo de áudio (mp3, m4a, ogg, etc.)
   * @param {number} volume - Volume (0.0 a 1.0)
   */
  async loadAndPlay(url, volume = 0.5) {
    try {
      // Criar elemento de áudio usando HTML5 Audio API
      this.audio = new Audio(url);
      
      // Configurar para loop infinito
      this.audio.loop = true;
      
      // Configurar volume
      this.audio.volume = Math.max(0, Math.min(1, volume));
      
      // Adicionar event listeners
      this.audio.addEventListener('canplaythrough', () => {
        console.log('✓ Áudio carregado e pronto para tocar');
      });
      
      this.audio.addEventListener('error', (e) => {
        console.error('✗ Erro ao carregar áudio:', e);
      });
      
      // Tentar tocar (pode precisar de interação do usuário)
      try {
        await this.audio.play();
        this.isPlaying = true;
        console.log(`🎵 Música tocando em loop: ${url}`);
      } catch (error) {
        console.warn('⚠ Áudio requer interação do usuário. Clique na tela para iniciar.');
        
        // Adicionar listener para iniciar com clique do usuário
        document.addEventListener('click', () => this.resumeAudio(), { once: true });
        document.addEventListener('keydown', () => this.resumeAudio(), { once: true });
      }
      
    } catch (error) {
      console.error('❌ Erro ao configurar áudio:', error);
    }
  }

  /**
   * Retoma o áudio (útil para browsers que bloqueiam autoplay)
   */
  async resumeAudio() {
    if (this.audio && !this.isPlaying) {
      try {
        await this.audio.play();
        this.isPlaying = true;
        console.log('🎵 Música iniciada após interação do usuário');
      } catch (error) {
        console.error('Erro ao retomar áudio:', error);
      }
    }
  }

  /**
   * Pausa o áudio
   */
  pause() {
    if (this.audio && this.isPlaying) {
      this.audio.pause();
      this.isPlaying = false;
      console.log('⏸ Música pausada');
    }
  }

  /**
   * Para o áudio e reseta
   */
  stop() {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.isPlaying = false;
      console.log('⏹ Música parada');
    }
  }

  /**
   * Ajusta o volume
   * @param {number} volume - Volume (0.0 a 1.0)
   */
  setVolume(volume) {
    if (this.audio) {
      this.audio.volume = Math.max(0, Math.min(1, volume));
      console.log(`🔊 Volume ajustado para: ${volume}`);
    }
  }

  /**
   * Alterna entre tocar e pausar
   */
  toggle() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.resumeAudio();
    }
  }
}

/**
 * Instância global do gerenciador de áudio
 */
export const audioManager = new AudioManager();
