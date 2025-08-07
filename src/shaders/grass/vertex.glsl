#include ../getElevation.glsl

uniform float uGrassHeight;
uniform float uGrassDensity;
uniform float uNumOfGrass;
uniform float uTerrainSize;
uniform float uTime;

float random(vec3 p) {
    return fract(sin(dot(p.xyz, vec3(12.9898, 78.233, 54.53))) * 43758.5453);
}

float random2D(vec2 st) {
    return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453123);
}

// Returns XZ offset
void getGrassPosition(int instanceID, out vec3 offset, out float heightScale, out float finalX, out float finalY, out float finalZ) {
    float instance = float(instanceID);
    float probability;
    float vert = position.y;

    finalX = mod(instance, (uTerrainSize * uGrassDensity));                //divides into rows (terainSize * grassDensity = numOfRows)
    finalZ = instance / ((uNumOfGrass / uGrassDensity) / uTerrainSize);    //divides into cols (terainSize * grassDensity = numOfCols)

    finalX /= uGrassDensity;                                                         //centers onto terrain 
    finalZ /= uGrassDensity;                                                         //centers onto terrain 

    finalX -= (uTerrainSize / 2.0);                                             //centers onto terrain
    finalZ -= (uTerrainSize / 2.0);                                             //centers onto terrain

    finalX += random2D(vec2(finalX, finalZ));                                       //random offset
    finalZ += random2D(vec2(finalZ + 5.0, finalX + 2.0));                           //random offset



    heightScale = random(vec3(finalX, 50.0, finalZ)) * 5.0 * uGrassHeight * snoise(vec2(finalX, finalZ) * 0.015);

    //random height base value
    if (heightScale < 1.0)
    heightScale = (random(vec3(finalX, 70.0, finalZ)) + 1.0) * uGrassHeight;

    //random culling. further breaks homogeny. remove if final output looks gross.
    //TODO: Just make finalX and finalZ random in [(0,0):(500,500)]. Mimic lines 22-32
    //or just keep it commented out. why take away grass? looks worse.
    
    // probability = snoise(vec2(finalX + 500.0, finalZ - 500.0) * 0.008);
    // if (probability > random(vec3(finalX, - 70.0, finalZ)) + 0.2)
    //     heightScale = -1.0;


    // Elevation lookup
    finalY = getElevation(vec3(finalX, - finalZ, 0.0));//z axis is flipped, so I unflipped it. Not sure why it is flipped.

    finalY += 1.6; //EXTREMELY TEMP FIX DELETE ASAP

    float bend = vert * vert * sin(uTime) * 0.25;

    offset = vec3(finalX, finalY, finalZ + bend);
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
    float finalX, finalY, finalZ;
    getGrassPosition(gl_InstanceID, offset, heightScale, finalX, finalY, finalZ);
    getGrassAngle(vec3(finalX, finalY, finalZ), rotY);

    // Apply rotation AFTER offset, to vertex in local space
    vec3 rotated = rotY * vec3(position.x, position.y * heightScale, position.z);
    
    // final position
    csm_Position = rotated + offset;
}
