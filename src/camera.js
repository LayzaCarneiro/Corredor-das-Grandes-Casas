import { normalize, cross } from './math.js';

export class Camera {
  constructor(canvas, opts = {}) {
    this.position = opts.position ?? [0, 0, 3];
    this.yaw = -90;
    this.pitch = 0;
    this.speed = 0.05;
    this.sensitivity = 0.1;
    this.keys = {};

    // Colisão (opcional): (x, z, radius) => boolean (true = colide)
    this.collisionFn = opts.collisionFn ?? null;
    this.radius = opts.radius ?? 0.35;

    window.addEventListener("keydown", e => this.keys[e.key.toLowerCase()] = true);
    window.addEventListener("keyup", e => this.keys[e.key.toLowerCase()] = false);
    canvas.addEventListener("click", () => canvas.requestPointerLock());
    window.addEventListener("mousemove", e => this.updateRotation(e));
  }

  updateRotation(e) {
    if (document.pointerLockElement !== document.getElementById("glCanvas")) return;
    this.yaw += e.movementX * this.sensitivity;
    this.pitch = Math.max(-89, Math.min(89, this.pitch - e.movementY * this.sensitivity));
  }

  updatePosition() {
    const yawRad = this.yaw * Math.PI / 180;
    const forward = [Math.cos(yawRad), 0, Math.sin(yawRad)];
    const right = [-Math.sin(yawRad), 0, Math.cos(yawRad)];

    let dx = 0;
    let dz = 0;
    if (this.keys["w"]) { dx += forward[0] * this.speed; dz += forward[2] * this.speed; }
    if (this.keys["s"]) { dx -= forward[0] * this.speed; dz -= forward[2] * this.speed; }
    if (this.keys["a"]) { dx -= right[0] * this.speed; dz -= right[2] * this.speed; }
    if (this.keys["d"]) { dx += right[0] * this.speed; dz += right[2] * this.speed; }

    if (dx === 0 && dz === 0) return;

    const [x, y, z] = this.position;

    // Desliza nas paredes: testa eixo X e Z separadamente.
    if (this.collisionFn) {
      const nextX = x + dx;
      const nextZ = z + dz;

      let newX = x;
      let newZ = z;

      if (!this.collisionFn(nextX, z, this.radius)) newX = nextX;
      if (!this.collisionFn(newX, nextZ, this.radius)) newZ = nextZ;

      this.position = [newX, y, newZ];
      return;
    }

    this.position = [x + dx, y, z + dz];
  }

  getViewMatrix() {
    const yawRad = this.yaw * Math.PI / 180;
    const pitchRad = this.pitch * Math.PI / 180;
    const front = normalize([
      Math.cos(yawRad) * Math.cos(pitchRad),
      Math.sin(pitchRad),
      Math.sin(yawRad) * Math.cos(pitchRad)
    ]);
    const right = normalize(cross(front, [0, 1, 0]));
    const up = cross(right, front);

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