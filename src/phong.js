import { createProgram } from './shaders.js';

export const phongVsSource = `#version 300 es
layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec2 aTexCoord;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;
uniform mat3 uNormalMatrix;

out vec3 vWorldPos;
out vec3 vWorldNormal;
out vec2 vTexCoord;

void main() {
    vec4 worldPos = uModel * vec4(aPosition, 1.0);
    vWorldPos = worldPos.xyz;

    vWorldNormal = normalize(uNormalMatrix * aNormal);
    vTexCoord = aTexCoord;

    gl_Position = uProjection * uView * worldPos;
}
`;

export const phongFsSource = `#version 300 es
precision highp float;

out vec4 fragColor;

in vec3 vWorldPos;
in vec3 vWorldNormal;
in vec2 vTexCoord;

uniform vec3 uCameraPos;

// Ambiente global
uniform vec3 uAmbientColor; // ex: vec3(0.08)

// Material (modelo de reflexão local de Phong / Blinn-Phong)
uniform vec3  uBaseColor;
uniform float uKa;        // ambiente
uniform float uKd;        // difusa
uniform float uKs;        // especular
uniform float uShininess; // brilho

// Textura
uniform sampler2D uTexture;
uniform int uUseTexture;

// Variável global para armazenar a cor base (com ou sem textura)
vec3 g_baseColor;

struct DirectionalLight {
    vec3 direction; // direção PARA ONDE a luz aponta (mundo)
    vec3 color;
    float intensity;
    int enabled;
};

struct PointLight {
    vec3 position;
    vec3 color;
    float intensity;
    vec3 attenuation; // (kc, kl, kq)
    int enabled;
};

struct SpotLight {
  vec3 position;
  vec3 direction;     // direção PARA ONDE a luz aponta (mundo)
  vec3 color;
  float intensity;
  vec3 attenuation;   // (kc, kl, kq)
  float innerCutoff;  // cos(angulo interno)
  float outerCutoff;  // cos(angulo externo)
  int enabled;
};

uniform DirectionalLight uDirLight;
uniform PointLight uPointLight;
uniform SpotLight uSpotLight;

vec3 applyDirectionalLight(vec3 n, vec3 v) {
    if (uDirLight.enabled == 0) return vec3(0.0);

    vec3 l = normalize(-uDirLight.direction);
    float ndotl = max(dot(n, l), 0.0);

    // Blinn-Phong
    vec3 h = normalize(v + l);
    float spec = (ndotl > 0.0) ? pow(max(dot(n, h), 0.0), uShininess) : 0.0;

    vec3 lightColor = uDirLight.color * uDirLight.intensity;
    vec3 diffuse = uKd * ndotl * lightColor * g_baseColor;
    vec3 specular = uKs * spec * lightColor;
    return diffuse + specular;
}

vec3 applyPointLight(vec3 n, vec3 v) {
    if (uPointLight.enabled == 0) return vec3(0.0);

    vec3 toLight = uPointLight.position - vWorldPos;
    float dist = length(toLight);
    vec3 l = toLight / max(dist, 1e-6);

    float att = 1.0 / (uPointLight.attenuation.x +
                      uPointLight.attenuation.y * dist +
                      uPointLight.attenuation.z * dist * dist);

    float ndotl = max(dot(n, l), 0.0);

    vec3 h = normalize(v + l);
    float spec = (ndotl > 0.0) ? pow(max(dot(n, h), 0.0), uShininess) : 0.0;

    vec3 lightColor = uPointLight.color * uPointLight.intensity * att;
    vec3 diffuse = uKd * ndotl * lightColor * g_baseColor;
    vec3 specular = uKs * spec * lightColor;
    return diffuse + specular;
}

vec3 applySpotLight(vec3 n, vec3 v) {
  if (uSpotLight.enabled == 0) return vec3(0.0);

  vec3 toLight = uSpotLight.position - vWorldPos;
  float dist = length(toLight);
  vec3 l = toLight / max(dist, 1e-6);

  // Cone: só ilumina se o fragmento estiver à frente do cone
  vec3 spotDir = normalize(uSpotLight.direction);
  float theta = dot(normalize(-l), spotDir); // 1.0 quando alinhado
  float eps = max(uSpotLight.innerCutoff - uSpotLight.outerCutoff, 1e-6);
  float cone = clamp((theta - uSpotLight.outerCutoff) / eps, 0.0, 1.0);
  if (cone <= 0.0) return vec3(0.0);

  float att = 1.0 / (uSpotLight.attenuation.x +
            uSpotLight.attenuation.y * dist +
            uSpotLight.attenuation.z * dist * dist);

  float ndotl = max(dot(n, l), 0.0);

  vec3 h = normalize(v + l);
  float spec = (ndotl > 0.0) ? pow(max(dot(n, h), 0.0), uShininess) : 0.0;

  vec3 lightColor = uSpotLight.color * uSpotLight.intensity * att * cone;
  vec3 diffuse = uKd * ndotl * lightColor * g_baseColor;
  vec3 specular = uKs * spec * lightColor;
  return diffuse + specular;
}

void main() {
    vec3 n = normalize(vWorldNormal);
    vec3 v = normalize(uCameraPos - vWorldPos);

    // Define a cor base (textura ou cor sólida)
    g_baseColor = uBaseColor;
    if (uUseTexture == 1) {
        g_baseColor = texture(uTexture, vTexCoord).rgb;
    }

    vec3 ambient = uKa * uAmbientColor * g_baseColor;
    vec3 color = ambient;

    color += applyDirectionalLight(n, v);
    color += applyPointLight(n, v);
    color += applySpotLight(n, v);

    fragColor = vec4(color, 1.0);
}
`;

export function createPhongProgram(gl) {
  return createProgram(gl, phongVsSource, phongFsSource);
}

export function getPhongLocations(gl, program) {
  return {
    // Matrizes
    uModel: gl.getUniformLocation(program, 'uModel'),
    uView: gl.getUniformLocation(program, 'uView'),
    uProjection: gl.getUniformLocation(program, 'uProjection'),
    uNormalMatrix: gl.getUniformLocation(program, 'uNormalMatrix'),

    // Câmera + ambiente
    uCameraPos: gl.getUniformLocation(program, 'uCameraPos'),
    uAmbientColor: gl.getUniformLocation(program, 'uAmbientColor'),

    // Material
    uBaseColor: gl.getUniformLocation(program, 'uBaseColor'),
    uKa: gl.getUniformLocation(program, 'uKa'),
    uKd: gl.getUniformLocation(program, 'uKd'),
    uKs: gl.getUniformLocation(program, 'uKs'),
    uShininess: gl.getUniformLocation(program, 'uShininess'),

    // Textura
    uTexture: gl.getUniformLocation(program, 'uTexture'),
    uUseTexture: gl.getUniformLocation(program, 'uUseTexture'),

    // Luz direcional
    uDirLight_direction: gl.getUniformLocation(program, 'uDirLight.direction'),
    uDirLight_color: gl.getUniformLocation(program, 'uDirLight.color'),
    uDirLight_intensity: gl.getUniformLocation(program, 'uDirLight.intensity'),
    uDirLight_enabled: gl.getUniformLocation(program, 'uDirLight.enabled'),

    // Luz pontual
    uPointLight_position: gl.getUniformLocation(program, 'uPointLight.position'),
    uPointLight_color: gl.getUniformLocation(program, 'uPointLight.color'),
    uPointLight_intensity: gl.getUniformLocation(program, 'uPointLight.intensity'),
    uPointLight_attenuation: gl.getUniformLocation(program, 'uPointLight.attenuation'),
    uPointLight_enabled: gl.getUniformLocation(program, 'uPointLight.enabled'),

    // Spot (tocha)
    uSpotLight_position: gl.getUniformLocation(program, 'uSpotLight.position'),
    uSpotLight_direction: gl.getUniformLocation(program, 'uSpotLight.direction'),
    uSpotLight_color: gl.getUniformLocation(program, 'uSpotLight.color'),
    uSpotLight_intensity: gl.getUniformLocation(program, 'uSpotLight.intensity'),
    uSpotLight_attenuation: gl.getUniformLocation(program, 'uSpotLight.attenuation'),
    uSpotLight_innerCutoff: gl.getUniformLocation(program, 'uSpotLight.innerCutoff'),
    uSpotLight_outerCutoff: gl.getUniformLocation(program, 'uSpotLight.outerCutoff'),
    uSpotLight_enabled: gl.getUniformLocation(program, 'uSpotLight.enabled'),
  };
}

export function setPhongMatrices(gl, locs, { model, view, projection, normalMatrix }) {
  if (model) gl.uniformMatrix4fv(locs.uModel, false, model);
  if (view) gl.uniformMatrix4fv(locs.uView, false, view);
  if (projection) gl.uniformMatrix4fv(locs.uProjection, false, projection);
  if (normalMatrix) gl.uniformMatrix3fv(locs.uNormalMatrix, false, normalMatrix);
}

export function setPhongCamera(gl, locs, cameraPos) {
  gl.uniform3fv(locs.uCameraPos, cameraPos);
}

export function setPhongAmbient(gl, locs, ambientColor) {
  gl.uniform3fv(locs.uAmbientColor, ambientColor);
}

export function setPhongMaterial(gl, locs, material) {
  if (material.baseColor) gl.uniform3fv(locs.uBaseColor, material.baseColor);
  if (material.ka !== undefined) gl.uniform1f(locs.uKa, material.ka);
  if (material.kd !== undefined) gl.uniform1f(locs.uKd, material.kd);
  if (material.ks !== undefined) gl.uniform1f(locs.uKs, material.ks);
  if (material.shininess !== undefined) gl.uniform1f(locs.uShininess, material.shininess);
}

export function setPhongDirectionalLight(gl, locs, light) {
  const enabled = light && (light.enabled ?? true);
  gl.uniform1i(locs.uDirLight_enabled, enabled ? 1 : 0);
  if (!enabled) return;

  gl.uniform3fv(locs.uDirLight_direction, light.direction);
  gl.uniform3fv(locs.uDirLight_color, light.color);
  gl.uniform1f(locs.uDirLight_intensity, light.intensity ?? 1.0);
}

export function setPhongPointLight(gl, locs, light) {
  const enabled = light && (light.enabled ?? true);
  gl.uniform1i(locs.uPointLight_enabled, enabled ? 1 : 0);
  if (!enabled) return;

  gl.uniform3fv(locs.uPointLight_position, light.position);
  gl.uniform3fv(locs.uPointLight_color, light.color);
  gl.uniform1f(locs.uPointLight_intensity, light.intensity ?? 1.0);
  gl.uniform3fv(locs.uPointLight_attenuation, light.attenuation ?? [1.0, 0.09, 0.032]);
}

export function setPhongSpotLight(gl, locs, light) {
  const enabled = light && (light.enabled ?? true);
  gl.uniform1i(locs.uSpotLight_enabled, enabled ? 1 : 0);
  if (!enabled) return;

  gl.uniform3fv(locs.uSpotLight_position, light.position);
  gl.uniform3fv(locs.uSpotLight_direction, light.direction);
  gl.uniform3fv(locs.uSpotLight_color, light.color);
  gl.uniform1f(locs.uSpotLight_intensity, light.intensity ?? 1.0);
  gl.uniform3fv(locs.uSpotLight_attenuation, light.attenuation ?? [1.0, 0.14, 0.07]);
  gl.uniform1f(locs.uSpotLight_innerCutoff, light.innerCutoff ?? Math.cos((12 * Math.PI) / 180));
  gl.uniform1f(locs.uSpotLight_outerCutoff, light.outerCutoff ?? Math.cos((20 * Math.PI) / 180));
}

// Computa normal matrix = transpose(inverse(mat3(model))) em ordem column-major.
export function normalMatrixFromMat4(modelMat4) {
  const m00 = modelMat4[0],  m01 = modelMat4[4],  m02 = modelMat4[8];
  const m10 = modelMat4[1],  m11 = modelMat4[5],  m12 = modelMat4[9];
  const m20 = modelMat4[2],  m21 = modelMat4[6],  m22 = modelMat4[10];

  const b01 =  m22 * m11 - m12 * m21;
  const b11 = -m22 * m10 + m12 * m20;
  const b21 =  m21 * m10 - m11 * m20;

  let det = m00 * b01 + m01 * b11 + m02 * b21;
  if (Math.abs(det) < 1e-12) det = 1e-12;
  const invDet = 1.0 / det;

  // inverse(mat3) em column-major
  const i00 = b01 * invDet;
  const i01 = (-m22 * m01 + m02 * m21) * invDet;
  const i02 = ( m12 * m01 - m02 * m11) * invDet;

  const i10 = b11 * invDet;
  const i11 = ( m22 * m00 - m02 * m20) * invDet;
  const i12 = (-m12 * m00 + m02 * m10) * invDet;

  const i20 = b21 * invDet;
  const i21 = (-m21 * m00 + m01 * m20) * invDet;
  const i22 = ( m11 * m00 - m01 * m10) * invDet;

  // transpose(inverse): em column-major, transpor = trocar off-diagonais
  return new Float32Array([
    i00, i01, i02,
    i10, i11, i12,
    i20, i21, i22,
  ]);
}
