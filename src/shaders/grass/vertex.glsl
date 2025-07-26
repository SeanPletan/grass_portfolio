#include ../getElevation.glsl

uniform float uGrassHeight;
uniform int uNumOfGrass;
uniform int uTerrainSize;

float random2D(vec2 st) {
    return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453123);
}

// Returns random 2D offset and rotation matrix
void getGrassPosition(int instanceID, out vec3 offset, out mat3 rotY) {
    float seed = float(instanceID);

    // Random angle [0, 2π]
    //TODO: angles are the same across all z-values of a small band of x-values. fix that. leads to banding.
    float angle = random2D(vec2(seed, seed + 5.0)) * 6.2831853;
    float s = sin(angle);
    float c = cos(angle);
    rotY = mat3(
        c, 0.0, -s,
        0.0, 1.0, 0.0,
        s, 0.0, c
    );

    int gridX = (instanceID % uTerrainSize) - (uTerrainSize / 2); //divides into rows, and then offsets it to center
    int gridZ = (instanceID / (uNumOfGrass / uTerrainSize)) - (uTerrainSize / 2); //divides into cols, and then offsets it to center

    float elevationX = float(gridX);
    float elevationZ = float(gridZ);

    // Elevation lookup
    float gridY = getElevation(vec3(elevationX, - elevationZ, 0.0)); //z axis is flipped, so I unflipped it. Not sure why it is flipped.
    gridY += (uGrassHeight / 2.0); //make the bottom of the grass level with terrain
    offset = vec3(float(gridX) + random2D(vec2(gridX, gridZ)), gridY, float(gridZ) + random2D(vec2(gridZ + 5, gridX + 2)));
}

void main() {
    // Compute per-instance transform
    vec3 offset;
    mat3 rotY;
    getGrassPosition(gl_InstanceID, offset, rotY);

    // Apply rotation AFTER offset, to vertex in local space
    vec3 rotated = rotY * position;
    
    // final position
    csm_Position = rotated + offset;
}
