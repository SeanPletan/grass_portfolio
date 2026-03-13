varying vec2 vUv;
uniform float minY;
uniform float maxY;
varying float vHeight;

void main(){
     vUv=uv;
     vec3 newPos = position;
     
     
     const float segments=10.0;
     
     vHeight=(position.y-minY)/(maxY-minY);
     float elevation=vHeight;
     
     float segment_number=min(floor(segments*vHeight),segments-1.);
     float width=1.0/segments;
     
     elevation=segment_number*width;

     elevation=minY+elevation*(maxY-minY);
     
     gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);
}