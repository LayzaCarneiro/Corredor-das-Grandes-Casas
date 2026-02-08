import { normalize, cross } from './math.js';

/*
  Classe Camera
  Responsável por:
  - Controlar posição (W, A, S, D)
  - Controlar rotação (mouse)
  - Gerar matriz de visualização (View Matrix)
  - Tratar colisão opcional
*/

export class Camera {
  constructor(canvas, opts = {}) {

    // ===== Configuração inicial =====
    this.canvas = canvas; // salva referência do canvas

    this.position = opts.position ?? [0, 0, 3]; // posição inicial
    this.yaw = -90;   // rotação horizontal
    this.pitch = 0;   // rotação vertical

    // Movimento independente de FPS
    this.speed = opts.speed ?? 3.0;
    this.sensitivity = 0.1;

    // Controle de teclas pressionadas
    this.keys = {};

    // Sistema opcional de colisão
    // collisionFn(x, z, radius) -> retorna true se colidir
    this.collisionFn = opts.collisionFn ?? null;
    this.radius = opts.radius ?? 0.35;

    // ===== Eventos =====

    // Teclado
    window.addEventListener("keydown", e => {
      this.keys[e.key.toLowerCase()] = true;
    });

    window.addEventListener("keyup", e => {
      this.keys[e.key.toLowerCase()] = false;
    });

    // Ativa pointer lock ao clicar
    canvas.addEventListener("click", () => {
      canvas.requestPointerLock();
    });

    // Movimento do mouse
    window.addEventListener("mousemove", e => {
      this.updateRotation(e);
    });
  }

  // =============================
  // Atualiza rotação com o mouse
  // =============================
  updateRotation(e) {
    if (document.pointerLockElement !== this.canvas) return;

    this.yaw += e.movementX * this.sensitivity;
    this.pitch -= e.movementY * this.sensitivity;

    // Limita rotação vertical
    this.pitch = Math.max(-89, Math.min(89, this.pitch));
  }

  // =============================
  // Atualiza posição (WASD)
  // =============================
  updatePosition(deltaTimeSeconds) {

    // fallback se não passar deltaTime
    const dt = (deltaTimeSeconds === undefined || Number.isNaN(deltaTimeSeconds))
      ? (1 / 60)
      : deltaTimeSeconds;

    const yawRad = this.yaw * Math.PI / 180;

    // Vetores direção no plano XZ
    const forward = [Math.cos(yawRad), 0, Math.sin(yawRad)];
    const right = [-Math.sin(yawRad), 0, Math.cos(yawRad)];

    let dx = 0;
    let dz = 0;

    const step = this.speed * dt;

    if (this.keys["w"]) {
      dx += forward[0] * step;
      dz += forward[2] * step;
    }

    if (this.keys["s"]) {
      dx -= forward[0] * step;
      dz -= forward[2] * step;
    }

    if (this.keys["a"]) {
      dx -= right[0] * step;
      dz -= right[2] * step;
    }

    if (this.keys["d"]) {
      dx += right[0] * step;
      dz += right[2] * step;
    }

    // Se não houve movimento, sai
    if (dx === 0 && dz === 0) return;

    const [x, y, z] = this.position;

    // ===== Tratamento de colisão =====
    if (this.collisionFn) {
      const nextX = x + dx;
      const nextZ = z + dz;

      let newX = x;
      let newZ = z;

      // Testa eixo X
      if (!this.collisionFn(nextX, z, this.radius)) {
        newX = nextX;
      }

      // Testa eixo Z
      if (!this.collisionFn(newX, nextZ, this.radius)) {
        newZ = nextZ;
      }

      this.position = [newX, y, newZ];
      return;
    }

    // Sem colisão
    this.position = [x + dx, y, z + dz];
  }

  // =============================
  // Gera matriz View
  // =============================
  getViewMatrix() {

    const yawRad = this.yaw * Math.PI / 180;
    const pitchRad = this.pitch * Math.PI / 180;

    // Vetor frente da câmera
    const front = normalize([
      Math.cos(yawRad) * Math.cos(pitchRad),
      Math.sin(pitchRad),
      Math.sin(yawRad) * Math.cos(pitchRad)
    ]);

    // Vetores ortogonais
    const right = normalize(cross(front, [0, 1, 0]));
    const up = cross(right, front);

    // Matriz LookAt manual
    return new Float32Array([
      right[0],  up[0],  -front[0], 0,
      right[1],  up[1],  -front[1], 0,
      right[2],  up[2],  -front[2], 0,
      -right.reduce((acc, v, i) => acc + v * this.position[i], 0),
      -up.reduce((acc, v, i) => acc + v * this.position[i], 0),
       front.reduce((acc, v, i) => acc + v * this.position[i], 0),
      1
    ]);
  }
}
