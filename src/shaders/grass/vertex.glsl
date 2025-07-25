#include ../simplexNoise2d.glsl

void main() {
    int resolution = 500;
    int id = gl_InstanceID;

    // Convert instance ID to grid coordinates
    int gridX = id % resolution;
    int gridZ = id / resolution;
    vec2 gridPos = vec2(float(gridX), float(gridZ));

    // Hardcoded spacing and jitter
    float spacing = 5.0;
    float jitterAmount = 3.0;
    float elevationScale = 2.0;

    vec2 baseXZ = gridPos * spacing;

    // Apply jitter to break up the grid
    vec2 jitter = vec2(
        snoise(gridPos + 42.0),
        snoise(gridPos + 99.0)
    ) * jitterAmount;

    vec2 finalXZ = baseXZ + jitter;

    // Sample elevation from noise function
    float elevation = 0.0;

    // Final position of the instance
    csm_Position = vec3(finalXZ.x, elevation, finalXZ.y);
}













// varying float offsetX;
// varying float offsetZ;

// // Random number generator
// float random2D(vec2 st) {
//     return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453123);
// }


// // Returns random 2D offset and rotation matrix
// void getInstanceTransform(int instanceID, out vec3 offset, out mat3 rotY) {
//     float seed = float(instanceID);

//     // Random angle [0, 2π]
//     float angle = random2D(vec2(seed, seed + 5.0)) * 6.2831853;
//     float s = sin(angle);
//     float c = cos(angle);
//     rotY = mat3(
//         c, 0.0, -s,
//         0.0, 1.0, 0.0,
//         s, 0.0, c
//     );

//     // Random XZ offset
//     offsetX = random2D(vec2(seed, seed + 1.0));
//     offsetZ = random2D(vec2(seed + 2.0, seed + 3.0));


//     // Elevation lookup
//     float offsetY = getElevation(vec3(offsetX, offsetZ, 0.0));
//     offset = vec3(offsetX * 500.0 - 250.0, offsetY, offsetZ * 500.0 - 250.0);
// }

// void main() {
//     // Compute per-instance transform
//     vec3 offset;
//     mat3 rotY;
//     getInstanceTransform(gl_InstanceID, offset, rotY);

//     // Apply rotation AFTER offset, to vertex in local space
//     vec3 rotated = rotY * position;
//     //vec3 transformed = rotated + offset;

//     // Project to clip space
//     csm_Position = rotated + offset;
// }
