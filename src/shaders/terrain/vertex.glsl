#include ../simplexNoise2d.glsl
uniform float uBigTerrainElevation;
uniform vec2 uBigTerrainFrequency;

void main()
{
  float elevation = sin(position.x * 0.1) * sin(position.y * 0.05) * 3.0; 
  elevation += (snoise(position.xz * 0.1)) * (snoise(position.yz * 0.01) * 5.0);
  csm_Position = position + vec3(0.0, 0.0, elevation);
}