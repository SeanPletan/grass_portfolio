#include simplexNoise2d.glsl

float getElevation(vec3 position) {
  float elevation = 0.0;
  float amp = 9.0;
  float freq = 0.005;
  float gain = 0.25;
  float lac = 2.7;

  for (int i = 1; i <= 5; i++)
  {
    elevation += (amp * snoise(position.xy * freq));
    //elevation += (9.0 * snoise(position.xy * 0.005));
    amp *= gain;
    freq *= lac;
  }
  return elevation;
}