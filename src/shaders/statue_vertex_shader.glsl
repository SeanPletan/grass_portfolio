varying vec2 vUv;
uniform float minY;
uniform float maxY;
varying float vHeight;



void main(){
     vUv=uv;
     
     float y=position.y;// local Y
     vHeight=(y-minY)/(maxY-minY);

     gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);
}