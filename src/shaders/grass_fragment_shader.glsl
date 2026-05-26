varying vec3 vColour;
varying vec4 vGrassData;
varying vec3 vNormal;
varying vec3 vWorldPosition;

float remap(float v,float a,float b,float c,float d)
{
     return c+(v-a)*(d-c)/(b-a);
}

float saturate(float x){
     return clamp(x,0.,1.);
}

vec3 lambertLight(vec3 normal,vec3 viewDir,vec3 lightDir,vec3 lightColour){
     float wrap=.5;//the more you increase this value, the more it wraps the light around the edges
     float dotNL=saturate((dot(normal,lightDir)+wrap)/(1.+wrap));
     vec3 lighting=vec3(dotNL);
     
     float backlight=saturate((dot(viewDir,-lightDir)+wrap)/(1.+wrap));
     vec3 scatter=vec3(pow(backlight,2.));
     
     lighting+=scatter;
     
     return lighting*lightColour;
}

vec3 hemiLight(vec3 normal,vec3 groundColour,vec3 skyColour){
     return mix(groundColour,skyColour,.5*normal.y+.5);
}

vec3 phongSpecular(vec3 normal,vec3 lightDir,vec3 viewDir){
     float dotNL=saturate(dot(normal,lightDir));
     
     vec3 r=normalize(reflect(-lightDir,normal));
     float phongValue=max(0.,dot(viewDir,r));
     phongValue=pow(phongValue,256.);//arbitrary
     
     vec3 specular=dotNL*vec3(phongValue);
     return specular;
}

void main(){
     float grassX=vGrassData.x;
     float grassY=vGrassData.y;
     
     vec3 normal=normalize(vNormal);
     vec3 viewDir=normalize(cameraPosition-vWorldPosition);
     
     vec3 baseColor=mix(vColour * 0.75, vColour, smoothstep(0.1, 0.0, abs(grassX)));
     
     //Hemi
     vec3 c1=vec3(1.,1.,1.);
     vec3 c2=vec3(.05,.05,.20);
     
     vec3 ambientLighting=hemiLight(normal,c2,c1);
     
     //Directional light
     vec3 lightDir=normalize(vec3(-1.,.5,1.));
     vec3 lightColour=vec3(1.);
     vec3 diffuseLighting=lambertLight(normal,viewDir,lightDir,lightColour);
     
     vec3 specular=phongSpecular(normal,lightDir,viewDir);
     
     //Fake AO
     float ao=remap(grassY+.2,0.,1.,.125,1.);
     
     vec3 lighting=diffuseLighting*.5+ambientLighting*.5;
     
     vec3 colour=baseColor*ambientLighting+specular*.25;
     colour*=ao;
     
     
     gl_FragColor=vec4(colour,1.);
}
