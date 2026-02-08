// Vertex Shader com suporte para Phong e texturas
export const vsSource = `#version 300 es
layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec2 aTexCoord;

uniform mat4 uModel; 
uniform mat4 uView; 
uniform mat4 uProjection;

out vec3 vNormal;
out vec3 vFragPos;
out vec2 vTexCoord;

void main() { 
    vec4 worldPos = uModel * vec4(aPosition, 1.0);
    vFragPos = worldPos.xyz;
    vNormal = mat3(transpose(inverse(uModel))) * aNormal;
    vTexCoord = aTexCoord;
    
    gl_Position = uProjection * uView * worldPos; 
}
`;

// Fragment Shader com iluminação Phong (Requisito II)
export const fsSource = `#version 300 es
precision highp float;

in vec3 vNormal;
in vec3 vFragPos;
in vec2 vTexCoord;

uniform vec3 uLightPos;      // Posição da luz
uniform vec3 uViewPos;       // Posição da câmera
uniform vec3 uObjectColor;   // Cor do objeto (se sem textura)
uniform vec3 uLightColor;    // Cor da luz

uniform bool uUseTexture;    // Flag: usar textura ou cor sólida
uniform sampler2D uTexture;  // Textura

out vec4 fragColor;

void main() { 
    // Cor base (textura ou cor sólida) - Requisito IV e V
    vec3 objectColor;
    if (uUseTexture) {
        objectColor = texture(uTexture, vTexCoord).rgb;
    } else {
        objectColor = uObjectColor;
    }
    
    // Componente Ambiente
    float ambientStrength = 0.3;
    vec3 ambient = ambientStrength * uLightColor;
    
    // Componente Difusa (Lambert)
    vec3 norm = normalize(vNormal);
    vec3 lightDir = normalize(uLightPos - vFragPos);
    float diff = max(dot(norm, lightDir), 0.0);
    vec3 diffuse = diff * uLightColor;
    
    // Componente Especular (Phong)
    float specularStrength = 0.5;
    vec3 viewDir = normalize(uViewPos - vFragPos);
    vec3 reflectDir = reflect(-lightDir, norm);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
    vec3 specular = specularStrength * spec * uLightColor;
    
    // Resultado final (Modelo de Reflexão de Phong - Requisito II)
    vec3 result = (ambient + diffuse + specular) * objectColor;
    fragColor = vec4(result, 1.0);
}
`;

export function createProgram(gl, vsSource, fsSource) {
  const createShader = (type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader));
    }
    return shader;
  };

  const program = gl.createProgram();
  gl.attachShader(program, createShader(gl.VERTEX_SHADER, vsSource));
  gl.attachShader(program, createShader(gl.FRAGMENT_SHADER, fsSource));
  gl.linkProgram(program);
  return program;
}