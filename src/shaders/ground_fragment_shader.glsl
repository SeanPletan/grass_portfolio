uniform sampler2D uTerrainTexture;
uniform float uTileScale;

varying vec2 vUv;

void main(){
     vec2 tiledUV=vUv*uTileScale;
     vec3 terrainDiffuse=texture2D(uTerrainTexture,tiledUV).xyz;
     //terrainDiffuse*=.5;//0.5 for daylight
     gl_FragColor=vec4(terrainDiffuse,1.0);
}