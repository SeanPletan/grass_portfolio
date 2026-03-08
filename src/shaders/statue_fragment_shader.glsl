varying vec2 vUv;
varying float vHeight;

void main() {
     float strength=mod(vHeight*10.,1.);
     strength=step(.5,strength);

     gl_FragColor=vec4(vec3(strength), 1.0);
}