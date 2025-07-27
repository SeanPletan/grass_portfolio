#include ../getElevation.glsl

uniform float uGrassHeight;
uniform float uGrassDensity;
uniform float uNumOfGrass;
uniform int uTerrainSize;

float random(vec3 p) {
    return fract(sin(dot(p.xyz, vec3(12.9898, 78.233, 54.53))) * 43758.5453);
}

float random2D(vec2 st) {
    return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453123);
}

// Returns XZ offset
void getGrassPosition(int instanceID, out vec3 offset) {

    float floatTerrainSize = float(uTerrainSize);
    float grassDensity = uGrassDensity;
    float instance = float(instanceID);

    float gridX = mod(instance, (floatTerrainSize * grassDensity));
    float gridZ = instance / ((uNumOfGrass / grassDensity) / floatTerrainSize);


    //int gridX = (instanceID % (uTerrainSize * grassDensity));                               //divides into rows (terainSize * grassDensity = numOfRows)
    //int gridZ = (instanceID / ((uNumOfGrass / grassDensity) / uTerrainSize));               //divides into cols (terainSize * grassDensity = numOfCols)

    float finalX = float(gridX) / float(grassDensity);                  //centers onto terrain 
    float finalZ = float(gridZ) / float(grassDensity);                  //centers onto terrain 

    finalX -= (floatTerrainSize / 2.0);                                 //centers onto terrain
    finalZ -= (floatTerrainSize / 2.0);                                 //centers onto terrain

    finalX += random2D(vec2(gridX, gridZ));                             //random offset
    finalZ += random2D(vec2(gridZ + 5.0, gridX + 2.0));                     //random offset




    // Elevation lookup
    float finalY = getElevation(vec3(finalX, - finalZ, 0.0)); //z axis is flipped, so I unflipped it. Not sure why it is flipped.
    finalY += (uGrassHeight / 2.0); //make the bottom of the grass level with terrain


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
    getGrassPosition(gl_InstanceID, offset);
    getGrassAngle(offset, rotY);


    // Apply rotation AFTER offset, to vertex in local space
    vec3 rotated = rotY * position;
    
    // final position
    csm_Position = rotated + offset;
}
