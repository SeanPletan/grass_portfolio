varying vec2 vUv;
uniform float minY;
uniform float maxY;
varying float vHeight;

void main(){
     float strength=mod(vHeight*10.,1.);
     strength=step(.5,strength);
     
     float strength2=mod(vHeight*10.,1.);
     strength2=step(strength2,.5);
     
     //gl_FragColor=vec4(strength, 0.0, strength2,1.);
     gl_FragColor=vec4(vec3(mix(0.0, maxY - minY)),1.);
}