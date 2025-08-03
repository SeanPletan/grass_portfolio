#include ../getElevation.glsl

uniform float uGrassHeight;
uniform float uGrassDensity;
uniform float uNumOfGrass;
uniform float uTerrainSize;

float random(vec3 p) {
    return fract(sin(dot(p.xyz, vec3(12.9898, 78.233, 54.53))) * 43758.5453);
}

float random2D(vec2 st) {
    return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453123);
}

// Returns XZ offset
void getGrassPosition(int instanceID, out vec3 offset, out float heightScale) {
    float instance = float(instanceID);
    float probability;


    float finalX = mod(instance, (uTerrainSize * uGrassDensity));                //divides into rows (terainSize * grassDensity = numOfRows)
    float finalZ = instance / ((uNumOfGrass / uGrassDensity) / uTerrainSize);    //divides into cols (terainSize * grassDensity = numOfCols)

    finalX /= uGrassDensity;                                                         //centers onto terrain 
    finalZ /= uGrassDensity;                                                         //centers onto terrain 

    finalX -= (uTerrainSize / 2.0);                                             //centers onto terrain
    finalZ -= (uTerrainSize / 2.0);                                             //centers onto terrain

    finalX += random2D(vec2(finalX, finalZ));                                       //random offset
    finalZ += random2D(vec2(finalZ + 5.0, finalX + 2.0));                           //random offset



    heightScale = random(vec3(finalX, 50.0, finalZ)) * 3.0 * snoise(vec2(finalX, finalZ) * 0.015);

    //random height base value
    if (heightScale < 1.0)
    heightScale = random(vec3(finalX, 70.0, finalZ)) * 1.0;

    //random culling. further breaks homogeny. remove if final output looks gross.
    probability = snoise(vec2(finalX + 500.0, finalZ - 500.0) * 0.008);
    if (probability > random(vec3(finalX, - 70.0, finalZ)) + 0.2)
        heightScale = 0.0;


    // Elevation lookup
    float finalY = getElevation(vec3(finalX, - finalZ, 0.0));// + abs(random2D(vec2(finalX, finalZ))); //z axis is flipped, so I unflipped it. Not sure why it is flipped.
    finalY += uGrassHeight * heightScale / 2.0; //make the bottom of the grass level with terrain


    offset = vec3(finalX, finalY, finalZ);
}

void getGrassAngle(vec3 p, out mat3 rotY) {
    // Random angle [0, 2π] from input: current position
    float angle = random(p) * 6.2831853;
    float s = sin(angle);
    float c = cos(angle);
    rotY = mat3(
        c, 0.0, -s,
        0.0, 1.0, 0.0,
        s, 0.0, c
    );
}

void main() {
    // Compute per-instance transform
    vec3 offset;
    mat3 rotY;
    float heightScale;
    getGrassPosition(gl_InstanceID, offset, heightScale);
    getGrassAngle(offset, rotY);


    
    vec3 scaled = vec3(position.x, position.y * heightScale, position.z);

    // Apply rotation AFTER offset, to vertex in local space
    vec3 rotated = rotY * scaled;
    
    // final position
    csm_Position = rotated + offset;
}
