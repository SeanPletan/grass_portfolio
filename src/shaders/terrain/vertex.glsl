#include ../simplexNoise2d.glsl
uniform float uSimplexA;
uniform float uSimplexF;
uniform float uGain;
uniform float uLacunarity;
attribute vec4 tangent;

float getElevation(vec3 position) {
  // Calculate elevation based on position and noise functions

  float elevation = 0.0;
  float amp = uSimplexA;
  float freq = uSimplexF;
  float gain = uGain;
  float lac = uLacunarity;
  // float amp = 18.20;
  // float freq = 0.0025;
  // float gain = 0.21;
  // float lac = 3.15;

  for (int i = 1; i <= 5; i++)
  {
    elevation += (amp * snoise(position.xy * freq));
    amp *= gain;
    freq *= lac;
  }
  return elevation;
}

void main() {
  vec3 biTangent = cross(normal, tangent.xyz);
  // Neighbours positions    
  float shift = 0.01;
  vec3 positionA = csm_Position + tangent.xyz * shift;
  vec3 positionB = csm_Position + biTangent * shift;

  float elevation = getElevation(csm_Position);
  csm_Position = position + vec3(0.0, 0.0, elevation); //apply calculated displacement to vertices
  positionA += getElevation(positionA) * normal;
  positionB += getElevation(positionB) * normal;

  // Compute normal
    vec3 toA = normalize(positionA - csm_Position);
    vec3 toB = normalize(positionB - csm_Position);
    csm_Normal = cross(toA, toB); //apply recalculated normals
}