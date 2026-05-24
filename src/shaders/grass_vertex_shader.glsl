uniform vec4 grassParams;
uniform float time;
uniform float i;
uniform float j;
attribute vec2 chunkOffset;

varying vec3 vColour;
varying vec4 vGrassData;
varying vec3 vNormal;
varying vec3 vWorldPosition;

uvec2 murmurHash21(uint src){
     const uint M=0x5bd1e995u;
     uvec2 h=uvec2(1190494759u,2147483647u);
     src*=M;src^=src>>24u;src*=M;
     h*=M;h^=src;
     h^=h>>13u;h*=M;h^=h>>15u;
     return h;
}

// 2 outputs, 1 input
vec2 hash21(float src){
     uvec2 h=murmurHash21(floatBitsToUint(src));
     return uintBitsToFloat(h&0x007fffffu|0x3f800000u)-1.;
}
     
vec3 hash(vec3 p){
     p=vec3(
          dot(p,vec3(127.1,311.7,74.7)),
          dot(p,vec3(269.5,183.3,246.1)),
          dot(p,vec3(113.5,271.9,124.6)));
          return-1.+2.*fract(sin(p)*43758.5453123);
}
          
float saturate(float x){
     return clamp(x,0.,1.);
}

float easeOut(float x,float t){
     return 1.-pow(1.-x,t);
}

float inverseLerp(float v,float minValue,float maxValue){
     return(v-minValue)/(maxValue-minValue);
}

float remap(float v,float inMin,float inMax,float outMin,float outMax){
     float t=inverseLerp(v,inMin,inMax);
     return mix(outMin,outMax,t);
}
          
mat3 rotateY(float theta){
     float c=cos(theta);
     float s=sin(theta);
     return mat3(
          vec3(c,0,s),
          vec3(0,1,0),
          vec3(-s,0,c)
     );
}
          
mat3 rotateAxis(vec3 axis,float angle){
     float s=sin(angle);
     float c=cos(angle);
     float oc=1.-c;
     
     return mat3(
          oc*axis.x*axis.x+c,oc*axis.x*axis.y-axis.z*s,oc*axis.z*axis.x+axis.y*s,
          oc*axis.x*axis.y+axis.z*s,oc*axis.y*axis.y+c,oc*axis.y*axis.z-axis.x*s,
          oc*axis.z*axis.x-axis.y*s,oc*axis.y*axis.z+axis.x*s,oc*axis.z*axis.z+c
     );
}
          
vec3 bezier(vec3 P0,vec3 P1,vec3 P2,vec3 P3,float t){
     return(1.-t)*(1.-t)*(1.-t)*P0+
     3.*(1.-t)*(1.-t)*t*P1+
     3.*(1.-t)*t*t*P2+
     t*t*t*P3;
}
          
vec3 bezierGrad(vec3 P0,vec3 P1,vec3 P2,vec3 P3,float t){
     return 3.*(1.-t)*(1.-t)*(P1-P0)+
     6.*(1.-t)*t*(P2-P1)+
     3.*t*t*(P3-P2);
}
          
float noise(in vec3 p)
{
     vec3 i=floor(p);
     vec3 f=fract(p);
     
     vec3 u=f*f*(3.-2.*f);
     
     return mix(mix(mix(dot(hash(i+vec3(0.,0.,0.)),f-vec3(0.,0.,0.)),
     dot(hash(i+vec3(1.,0.,0.)),f-vec3(1.,0.,0.)),u.x),
     mix(dot(hash(i+vec3(0.,1.,0.)),f-vec3(0.,1.,0.)),
     dot(hash(i+vec3(1.,1.,0.)),f-vec3(1.,1.,0.)),u.x),u.y),
     mix(mix(dot(hash(i+vec3(0.,0.,1.)),f-vec3(0.,0.,1.)),
     dot(hash(i+vec3(1.,0.,1.)),f-vec3(1.,0.,1.)),u.x),
     mix(dot(hash(i+vec3(0.,1.,1.)),f-vec3(0.,1.,1.)),
     dot(hash(i+vec3(1.,1.,1.)),f-vec3(1.,1.,1.)),u.x),u.y),u.z);
}

vec3 permute(vec3 x){return mod(((x*34.)+1.)*x,289.);}

float snoise(vec2 v){
     const vec4 C=vec4(.211324865405187,.366025403784439,
     -.577350269189626,.024390243902439);
     vec2 i=floor(v+dot(v,C.yy));
     vec2 x0=v-i+dot(i,C.xx);
     vec2 i1;
     i1=(x0.x>x0.y)?vec2(1.,0.):vec2(0.,1.);
     vec4 x12=x0.xyxy+C.xxzz;
     x12.xy-=i1;
     i=mod(i,289.);
     vec3 p=permute(permute(i.y+vec3(0.,i1.y,1.))
     +i.x+vec3(0.,i1.x,1.));
     vec3 m=max(.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),
     dot(x12.zw,x12.zw)),0.);
     m=m*m;
     m=m*m;
     vec3 x=2.*fract(p*C.www)-1.;
     vec3 h=abs(x)-.5;
     vec3 ox=floor(x+.5);
     vec3 a0=x-ox;
     m*=1.79284291400159-.85373472095314*(a0*a0+h*h);
     vec3 g;
     g.x=a0.x*x0.x+h.x*x0.y;
     g.yz=a0.yz*x12.xz+h.yz*x12.yw;
     return 130.*dot(m,g);
}
          
float getElevation(vec3 position){
     float elevation=0.;
     float amp=30.;//8
     float freq=-.0015;//0.008
     float gain=.25;
     float lac=3.;
     
     for(int i=1;i<=4;i++)
     {
          elevation+=(amp*snoise(vec2(position.x,-position.z+150.)*freq));
          amp*=gain;
          freq*=lac;
     }
     return elevation+length(vec2(position.x,-position.z)*.02);
}

const vec3 BASE_COLOUR=vec3(.2118,.5569,.1569);
const vec3 TIP_COLOUR=vec3(.5098,.698,.3216);
          
void main(){
     int GRASS_SEGMENTS=int(grassParams.x);
     int GRASS_VERTICES=(GRASS_SEGMENTS+1)*2;
     float GRASS_PATCH_SIZE=grassParams.y;
     float GRASS_WIDTH=grassParams.z;
     float GRASS_HEIGHT=grassParams.w;
     
     // Figure out grass offset
     vec2 hashedInstanceID=hash21(float(gl_InstanceID))*2.-1.;
     vec3 grassOffset=vec3(hashedInstanceID.x,0.,hashedInstanceID.y)*GRASS_PATCH_SIZE;
     vec3 grassChunkElevationOffset = grassOffset;
     grassChunkElevationOffset.x += (chunkOffset.x * GRASS_PATCH_SIZE * 2.) + GRASS_PATCH_SIZE;
     grassChunkElevationOffset.z += (chunkOffset.y * GRASS_PATCH_SIZE * 2.) + GRASS_PATCH_SIZE;
     grassOffset.y=getElevation(grassChunkElevationOffset);
     grassOffset.x += (chunkOffset.x * GRASS_PATCH_SIZE * 2.) + GRASS_PATCH_SIZE;
     grassOffset.z +=(chunkOffset.y*GRASS_PATCH_SIZE*2.)+GRASS_PATCH_SIZE;
     
     vec3 grassBladeWorldPos=(modelMatrix*vec4(grassOffset,1.)).xyz;
     vec3 hashVal=hash(grassBladeWorldPos);

     // Grass rotation
     const float PI=3.14159;
     float angle=remap(hashVal.x,-1.,1.,-PI,PI);
     
     //Debug
     //grassOffset = vec3(float(gl_InstanceID) * 0.5 - 8.0, 0.0, 0.0);
     //angle = float(gl_InstanceID) * 0.2;
     
     // Figure out vertex id, > GRASS_VERTICES is other side
     int vertFB_ID=gl_VertexID%(GRASS_VERTICES*2);
     int vertID=vertFB_ID%GRASS_VERTICES;
     
     // 0 = left, 1 = right
     int xTest=vertID&0x1;
     int zTest=(vertFB_ID>=GRASS_VERTICES)?1:-1;
     float xSide=float(xTest);
     float zSide=float(zTest);
     float heightPercentage=float(vertID-xTest)/(float(GRASS_SEGMENTS)*2.);
     
     float width=GRASS_WIDTH*easeOut(1.-heightPercentage,2.);
     // float width = GRASS_WIDTH * smoothstep(0.0, 0.25, 1.0 - heightPercentage); //SMOOTHSTEP SHAPING FUNCTION
     float height=GRASS_HEIGHT;
     height+=clamp(noise(vec3(grassBladeWorldPos)*.02)*3.,-2.,2.5);
     
     //calculate the vertex position
     float x=(xSide-.5)*width;
     float y=heightPercentage*height;
     float z=0.;
     
     //Grass lean factor
     //float randWindPatchSize = remap(abs(noise(vec3(grassBladeWorldPos.zxy))), -1.0, 1.0, -0.5, 0.5);
     float windStrength=noise(vec3(grassBladeWorldPos.x*.02,0.,grassBladeWorldPos.z*.02)+(time*.4));
     float windAngle=0.;
     vec3 windAxis=vec3(cos(windAngle),0.,sin(windAngle));
     float windLeanAngle=windStrength*3.*heightPercentage;///**MODIFY MIDDLE NUMBER FOR LEAN STRENGTH** (DEFAULT 1.5)
     float randomLeanAnimation=noise(vec3(grassBladeWorldPos.xz,time*2.5))*(windStrength*.5+.25);
     //randomLeanAnimation = 0.0;
     float leanFactor=remap(hashVal.y,-1.,1.,-.4,.4)+randomLeanAnimation;
     
     //Debug
     //leanFactor = 1.0;
     
     //Add the bezier curve for bend (if you wanna get really fancy, you can animate each control point to make it wiggle, and other cool stuff)
     vec3 p1=vec3(0.);
     vec3 p2=vec3(0.,.33,0.);
     vec3 p3=vec3(0.,.66,0.);
     vec3 p4=vec3(0.,cos(leanFactor),sin(leanFactor));
     vec3 curve=bezier(p1,p2,p3,p4,heightPercentage);
     
     // Calculate surface normals
     vec3 curveGrad=bezierGrad(p1,p2,p3,p4,heightPercentage);// bezier derivative
     mat2 curveRot90=mat2(0.,1.,-1.,0.)*-zSide;
     
     y=curve.y*height;
     z=curve.z*height;
     
     // Generate grass matrix (use to transform the localspace position before the grassOffset is applies)
     mat3 grassMat=rotateAxis(windAxis,windLeanAngle)*rotateY(angle);
     
     vec3 grassLocalPosition=grassMat*vec3(x,y,z)+grassOffset;
     vec3 grassLocalNormal=grassMat*vec3(0.,curveRot90*curveGrad.yz);

     //GRASS ORIGIN MASK
     /////////////////////////////////////////////////////////////////////////////////////////////////
     /////////////////////////////////////////////////////////////////////////////////////////////////
     float dist=length(grassBladeWorldPos.xz);
     float mask=smoothstep(14.0,15.0,dist);// 0 inside, 1 outside  //14.0, 15.0
     vec3 maskedPosition=mix(grassOffset,grassLocalPosition,mask);
     
     //Blend normal
     float distanceBlend=smoothstep(0.,1.,distance(cameraPosition,grassBladeWorldPos));
     grassLocalNormal=mix(grassLocalNormal,vec3(0.,1.,0.),distanceBlend);//0.5 in video
     grassLocalNormal=normalize(grassLocalNormal);
     
     // Viewspace thicken
     vec4 mvPosition=modelViewMatrix*vec4(maskedPosition,1.);
     
     vec3 viewDir=normalize(cameraPosition-grassBladeWorldPos);
     vec3 grassFaceNormal=(grassMat*vec3(0.,0.,-zSide));
     
     float viewDotNormal=saturate(dot(grassFaceNormal,viewDir));
     float viewSpaceThickenFactor=easeOut(
     1.-viewDotNormal,16.)*smoothstep(0.,.1,viewDotNormal);
     
     mvPosition.x+=viewSpaceThickenFactor*(xSide-.5)*width*.5*-zSide;
     
     gl_Position=projectionMatrix*mvPosition;
     
     //vColour = grassLocalNormal; //confirming which side is front side.
     
     vec3 c1=mix(BASE_COLOUR,TIP_COLOUR,heightPercentage);
     vec3 c2=mix(vec3(.5922,.5922,.2353),vec3(.8078,.8,.3843),heightPercentage);
     //vec3 c3 = mix(vec3(0.1569, 0.2314, 0.0), vec3(0.3294, 0.3216, 0.0), heightPercentage);
     float noiseValue=noise(grassBladeWorldPos*.1);
     vColour=mix(c1,c2,smoothstep(-1.,1.,noiseValue));
     //vColour = mix(c3, vColour, smoothstep(-1.0, 1.0, noise(grassBladeWorldPos * 0.1)));
     vColour += (vec3((chunkOffset.x + 1.) / 3., 0, (chunkOffset.y + 1.) / 3.)) * 0.02; //uncomment for chunk debug colors! beautiful!
     
     vNormal=normalize((modelMatrix*vec4(grassLocalNormal,0.)).xyz);
     vWorldPosition=(modelMatrix*vec4(grassLocalPosition,1.)).xyz;
     
     vGrassData=vec4(x,heightPercentage,0.,0.);
}