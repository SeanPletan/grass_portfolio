#include ../getElevation.glsl
attribute vec4 tangent;
varying vec3 vVertexColor;

//the point of this function is to calculate y-offset using getElevation(), and to recalulate the normals per face.
void main() {
  vec3 biTangent = cross(normal, tangent.xyz);
  // Neighbours positions    
  float shift = 0.01;
  vec3 positionA = csm_Position + tangent.xyz * shift;
  vec3 positionB = csm_Position + biTangent * shift;

  float elevation = getElevation(csm_Position);
  csm_Position = position + vec3(0.0, 0.0, elevation); //apply calculated displacement to vertices. z-axis is displaced because in script.js, the plane is rotated 90 degrees.
  positionA += getElevation(positionA) * normal;
  positionB += getElevation(positionB) * normal;

  // Compute normal
    vec3 toA = normalize(positionA - csm_Position);
    vec3 toB = normalize(positionB - csm_Position);
    csm_Normal = cross(toA, toB); //apply recalculated normals

    vVertexColor = csm_Normal;
}