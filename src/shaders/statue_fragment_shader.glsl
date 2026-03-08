varying vec2 vUv;
varying float vHeight;

void main() {
     float strength=mod(vHeight * 10.0, 1.0);
     strength=step(0.5, strength);

     float strength2 = mod(vHeight * 10.0, 1.0);
     strength2 = step(strength2, 0.5);

     gl_FragColor=vec4(strength, 0.0, strength2, 1.0);
}