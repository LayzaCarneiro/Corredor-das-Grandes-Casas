/**
 * camera.js
 * Gerencia o estado da câmera, movimentação FPS e detecção de colisão.
 */

import { normalize, cross } from './math.js';

export class Camera {
  constructor(canvas, opts = {}) {
    this.canvas = canvas; // Armazena referência para o canvas
    this.position = opts.position ?? [0, 0, 3];
    this.velocity = [0, 0, 0];

    // Rotação em graus
    this.yaw = 90; // Olhar para o fundo do corredor inicialmente
    this.pitch = 0; // Olhar para o horizonte

    // velocidade em unidades/segundo (independente de FPS)
    this.speed = opts.speed ?? 3.0; // Unidades por segundo
    this.sensitivity = 0.1; // Sensibilidade do mouse
    this.keys = {}; // Estado do teclado

    // Sistema de Colisão
    // Colisão: (x, z, radius) => boolean (true = colide)
    this.collisionFn = opts.collisionFn ?? null;
    this.radius = opts.radius ?? 0.35; // Raio do "corpo" do jogador

    // Direção do último movimento (XZ) para cálculos de efeitos de luz/balanço
    // Começa alinhada ao yaw inicial.
    {
      const yawRad = this.yaw * Math.PI / 180;
      this.lastMoveDir = [Math.cos(yawRad), 0, Math.sin(yawRad)];
    }

    window.addEventListener("keydown", e => this.keys[e.key.toLowerCase()] = true);
    window.addEventListener("keyup", e => this.keys[e.key.toLowerCase()] = false);
    canvas.addEventListener("click", () => canvas.requestPointerLock());
    window.addEventListener("mousemove", e => this.updateRotation(e));
  }

  /**
   * Converte o movimento do mouse em rotação (Yaw e Pitch).
   */
  updateRotation(e) {
    // Só rotaciona se o mouse estiver travado (Pointer Lock ativo)
    if (document.pointerLockElement !== document.getElementById("glCanvas")) return;
    this.yaw += e.movementX * this.sensitivity;

    // Limita o pitch para evitar que a câmera "capote" (Gimbal Lock)
    this.pitch -= e.movementY * this.sensitivity;
    this.pitch = Math.max(-89, Math.min(89, this.pitch));  
  }

  /**
   * Calcula a nova posição baseada no tempo decorrido (deltaTime).
   * Inclui lógica de deslizamento em paredes.
   */
  updatePosition(deltaTimeSeconds) {
    // fallback para chamadas antigas (aprox 60 FPS)
    const dt = (deltaTimeSeconds === undefined || Number.isNaN(deltaTimeSeconds)) ? (1 / 60) : deltaTimeSeconds;

    const yawRad = this.yaw * Math.PI / 180;
    const forward = [Math.cos(yawRad), 0, Math.sin(yawRad)];
    const right = [-Math.sin(yawRad), 0, Math.cos(yawRad)];

    let dx = 0;
    let dz = 0;
    const step = this.speed * dt;

    // Inputs de direção
    if (this.keys["w"]) { dx += forward[0] * step; dz += forward[2] * step; }
    if (this.keys["s"]) { dx -= forward[0] * step; dz -= forward[2] * step; }
    if (this.keys["a"]) { dx -= right[0] * step; dz -= right[2] * step; }
    if (this.keys["d"]) { dx += right[0] * step; dz += right[2] * step; }

    // Armazenar velocidade para animações
    this.velocity = [dx / dt, 0, dz / dt];

    if (dx === 0 && dz === 0) return;

    // Atualiza direção do movimento para animações de câmera/luz
    const len = Math.hypot(dx, dz) || 1;
    this.lastMoveDir = [dx / len, 0, dz / len];

    const [x, y, z] = this.position;

    // Lógica de Colisão: Testa X e Z separadamente para permitir deslizar em paredes
    if (this.collisionFn) {
      const nextX = x + dx;
      const nextZ = z + dz;

      let newX = x;
      let newZ = z;

      // Se não colidir no eixo X, permite movimento em X
      if (!this.collisionFn(nextX, z, this.radius)) newX = nextX;
      // Se não colidir no eixo Z (usando a nova posição X), permite movimento em Z
      if (!this.collisionFn(newX, nextZ, this.radius)) newZ = nextZ;

      this.position = [newX, y, newZ];
      return;
    }

    // Sem colisão (fallback)
    this.position = [x + dx, y, z + dz];
  }

  /**
   * Gera a Matriz de Visualização (View Matrix) para o Shader.
   * Transforma coordenadas do mundo para coordenadas da câmera.
   */
  getViewMatrix() {
    const yawRad = this.yaw * Math.PI / 180;
    const pitchRad = this.pitch * Math.PI / 180;

    // Vetor Frontal (Target)
    const front = normalize([
      Math.cos(yawRad) * Math.cos(pitchRad),
      Math.sin(pitchRad),
      Math.sin(yawRad) * Math.cos(pitchRad)
    ]);

    // Vetores ortonormais da câmera
    const right = normalize(cross(front, [0, 1, 0]));
    const up = cross(right, front);

    // Matriz de visualização (LookAt integrada)
    // Inverte a rotação e translação para simular o movimento da cena ao redor da câmera
    return new Float32Array([
      right[0], up[0], -front[0], 0,
      right[1], up[1], -front[1], 0,
      right[2], up[2], -front[2], 0,
      -right.reduce((acc, v, i) => acc + v * this.position[i], 0),
      -up.reduce((acc, v, i) => acc + v * this.position[i], 0),
      front.reduce((acc, v, i) => acc + v * this.position[i], 0),
      1
    ]);
  }
}