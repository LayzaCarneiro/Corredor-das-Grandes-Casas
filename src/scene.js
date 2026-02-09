import { createCorridorRoomScenario, createVAO } from './scenario.js';

export function createWorld(gl) {
  const scenario = createCorridorRoomScenario(gl, {
    corridorWidth: 5,
    corridorLength: 25,
    roomSize: 10,
    wallHeight: 4,
    doorWidth: 2.2,
    doorHeight: 3.0,
  });

  const parts = [
    { name: 'floor', vao: createVAO(gl, scenario.meshes.floor), material: { baseColor:[0.35,0.18,0.08], ka:0.35, kd:0.75, ks:0.08, shininess:12 }, useTexture:false },
    { name: 'carpet', vao: createVAO(gl, scenario.meshes.carpet), material: { baseColor:[0.75,0.08,0.10], ka:0.35, kd:0.85, ks:0.05, shininess:8 } },
    { name: 'walls', vao: createVAO(gl, scenario.meshes.walls), material: { baseColor:[0.45,0.45,0.48], ka:0.25, kd:0.7, ks:0.15, shininess:22 }, useTexture:false },
    { name: 'ceiling', vao: createVAO(gl, scenario.meshes.ceiling), material: { baseColor:[0.08,0.08,0.22], ka:0.35, kd:0.6, ks:0.12, shininess:18 }, useTexture:false },
    { name: 'door', vao: createVAO(gl, scenario.meshes.door), material: { baseColor:[0.35,0.20,0.10], ka:0.35, kd:0.65, ks:0.18, shininess:28 }, useTexture:false },
  ];

  return { scenario, parts };
}
