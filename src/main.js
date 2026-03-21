import * as THREE from "three";
import markdownit from "markdown-it";
import Stats from "stats.js";
import { HDRLoader } from "three/addons/loaders/HDRLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { SMAAPass } from "three/examples/jsm/postprocessing/SMAAPass.js";
import { Cache } from "three";
import fshGrassText from "./shaders/grass_fragment_shader.glsl?raw";
import vshGrassText from "./shaders/grass_vertex_shader.glsl?raw";
import fshGroundText from "./shaders/ground_fragment_shader.glsl?raw";
import vshGroundText from "./shaders/ground_vertex_shader.glsl?raw";
import * as projectParsing from "./projects/project_parsing";
import projectTest from "./projects/test.md?raw"
import getAboutMePage from "./routes/about.md?raw";
import getProjectsPage from "./routes/projects.md?raw";
import getContactPage from "./routes/contact.md?raw";
import get404Page from "./routes/404.md?raw";

//var stats = new Stats();
//stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
//document.body.appendChild(stats.dom);

const canvas = document.querySelector("canvas.webgl");
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ canvas: canvas });
const screenSizes = {
     width: window.innerWidth,
     height: window.innerHeight,
};
renderer.setSize(screenSizes.width, screenSizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
Cache.enabled = true;
const light = new THREE.AmbientLight(0x404040, 300); // soft white light
scene.add(light);
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let json = projectParsing.projectParser(projectTest);
let scrollValue = 0;
const threshold = 0.5;
const clickable = [];

const GRASS_SEGMENTS = 5;
const GRASS_PATCH_SIZE = 300;
const GRASS_WIDTH = 0.75;
const GRASS_HEIGHT = 4.5;
const NUM_GRASS = GRASS_PATCH_SIZE * GRASS_PATCH_SIZE * 2.0;

function createGeometry(segments) {
     const VERTICES = (segments + 1) * 2;
     const indeces = new Array(segments * 12);

     for (let i = 0; i < segments; i++) {
          const vi = i * 2;
          indeces[i * 12 + 0] = vi + 0;
          indeces[i * 12 + 1] = vi + 1;
          indeces[i * 12 + 2] = vi + 2;

          indeces[i * 12 + 3] = vi + 2;
          indeces[i * 12 + 4] = vi + 1;
          indeces[i * 12 + 5] = vi + 3;

          const fi = VERTICES + vi;
          indeces[i * 12 + 6] = fi + 2;
          indeces[i * 12 + 7] = fi + 1;
          indeces[i * 12 + 8] = fi + 0;

          indeces[i * 12 + 9] = fi + 3;
          indeces[i * 12 + 10] = fi + 1;
          indeces[i * 12 + 11] = fi + 2;
     }

     const geometry = new THREE.InstancedBufferGeometry();
     geometry.instanceCount = NUM_GRASS;
     geometry.setIndex(indeces);
     geometry.boundingSphere = new THREE.Sphere(
          new THREE.Vector3(0, 0, 0),
          1 + GRASS_PATCH_SIZE * 2,
     );

     return geometry;
}

//Make ground
const terrainDiffuse = new THREE.TextureLoader().load("/terrainTexture/Terrain_Texture_BaseColor.png");
terrainDiffuse.wrapS = THREE.RepeatWrapping;
terrainDiffuse.wrapT = THREE.RepeatWrapping;
const groundMaterial = new THREE.ShaderMaterial({
     uniforms: 
     {
          uTerrainTexture: { value: terrainDiffuse },
          uTileScale: { value: 30.0 },
     },
     vertexShader: vshGroundText,
     fragmentShader: fshGroundText,
});
const groundGeometry = new THREE.PlaneGeometry(
     GRASS_PATCH_SIZE * 2,
     GRASS_PATCH_SIZE * 2,
     256,
     256,
);
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotateX(-Math.PI / 2);
scene.add(ground);

//Make sky
const hdrLoader = new HDRLoader();
const envMap = await hdrLoader.loadAsync("/puresky.hdr");
envMap.mapping = THREE.EquirectangularReflectionMapping;
scene.background = envMap;
scene.backgroundRotation.y += Math.PI * 1.125;

//Make grass
const grassUniforms = {
     grassParams: { value: new THREE.Vector4(GRASS_SEGMENTS, GRASS_PATCH_SIZE, GRASS_WIDTH, GRASS_HEIGHT) },
     time: { value: 0 }
};
const grassMaterial = new THREE.ShaderMaterial({
     uniforms: grassUniforms,
     vertexShader: vshGrassText,
     fragmentShader: fshGrassText,
     side: THREE.FrontSide,
});
const grassGeometry = createGeometry(GRASS_SEGMENTS);
const grass = new THREE.Mesh(grassGeometry, grassMaterial);
scene.add(grass);

//Make statue
const randInt = Math.floor(Math.random() * 6.0) + 1.0; //random matcap material on DOM load, change 6.0 to be one less than the number of matcap files you have
const gltfLoader = new GLTFLoader();
const matcapTexture = new THREE.TextureLoader().load(`/matcap${randInt}.png`);
const matcapMaterial = new THREE.MeshMatcapMaterial({
     matcap: matcapTexture
});
let statueParts = [];

async function loadStatue(scene) {
     try {
          const gltf = await gltfLoader.loadAsync('/bust_separated.glb');
          const statue = gltf.scene;

          statue.traverse((child) => {
               if (child.isMesh)
                    {
                    child.material = matcapMaterial;
                    child.position.set(0, -30, 0);
                    child.rotation.y = 4;
                    child.scale.set(3, 3, 3);                    
                    }

          });
          statueParts = statue.children;
          scene.add(statue);
          return statue;

     } catch (error) {
          console.error('Error loading GLTF:', error);
     }
}
loadStatue(scene);



const camera = new THREE.PerspectiveCamera(80, screenSizes.width / screenSizes.height, 0.1, 750);
camera.position.set(70, 10, -310);
camera.lookAt(0, 0, 0);
scene.add(camera);

canvas.addEventListener("click", () => {
     history.pushState(null, "", "/");
     handleRouteChange();
});

function ensureScrolled() {
if (scrollValue < threshold)
     scrollValue = 1.0;

return scrollValue
}

function handleRouteChange() {
     const md = markdownit({
          html: true,
          linkify: true,
          typographer: true,
          breaks: true,
     });
     const path = window.location.pathname;
     let view;

     switch (path) {
          case "/":
               document.getElementById("overlay").classList.remove("overlay--panel");
               document.getElementById("overlay").classList.remove("overlay--expanded");
               document.getElementById("overlay").classList.add("overlay--hidden");
               break;
          case "/about":
               view = md.render(getAboutMePage);
               document.getElementById("overlay-content").innerHTML = view;
               document.getElementById("overlay").classList.remove("overlay--hidden");
               document.getElementById("overlay").classList.add("overlay--panel");
               ensureScrolled();
               break;
          case "/projects":
               view = md.render(getProjectsPage)
               document.getElementById("overlay-content").innerHTML = view;
               document.getElementById("overlay").classList.remove("overlay--hidden");
               document.getElementById("overlay").classList.add("overlay--panel");
               projectParsing.renderProjectCard(json);
               projectParsing.renderProjectCard(json);
               projectParsing.renderProjectCard(json);
               ensureScrolled();
               break;
          case "/contact":
               view = md.render(getContactPage);
               document.getElementById("overlay-content").innerHTML = view;
               document.getElementById("overlay").classList.remove("overlay--hidden");
               document.getElementById("overlay").classList.add("overlay--panel");
               ensureScrolled();
               break;
          default:
               view = md.render(get404Page);
               document.getElementById("overlay-content").innerHTML = view;
               document.getElementById("overlay").classList.remove("overlay--hidden");
               document.getElementById("overlay").classList.add("overlay--panel");
               ensureScrolled();
     }
}

handleRouteChange();

window.addEventListener("popstate", handleRouteChange);

document.querySelectorAll(".route").forEach((link) => {
     link.addEventListener("click", function (e) {
          e.preventDefault();
          history.pushState(null, "", this.href);
          handleRouteChange();
     });
});

function lerp(a, b, t) {
     return a + (b - a) * t;
}



const scrollTarget = document.getElementById("webgl");
window.addEventListener("wheel", (event) => {
     if (event.target == scrollTarget) {
          scrollValue += event.deltaY * 0.0008;
          scrollValue = Math.min(Math.max(scrollValue, 0), 1);
         // console.log(scrollValue)
     }
});

//const controls = new OrbitControls(camera, canvas);

const renderPass = new RenderPass(scene, camera);
const composer = new EffectComposer(renderer);
composer.addPass(renderPass);

const smaaPass = new SMAAPass(
     screenSizes.width * renderer.getPixelRatio(),
     screenSizes.height * renderer.getPixelRatio(),
);

composer.addPass(smaaPass);

function onResize() {
     const pixelRatio = renderer.getPixelRatio();
     renderer.setSize(screenSizes.width, screenSizes.height);

     camera.aspect = screenSizes.width / screenSizes.height;
     camera.updateProjectionMatrix();

     composer.setSize(screenSizes.width, screenSizes.height);

     smaaPass.setSize(
          screenSizes.width * pixelRatio,
          screenSizes.height * pixelRatio,
     );
}

window.addEventListener("resize", onResize);

const timer = new THREE.Timer();
timer.connect(document);

const nav = document.getElementById("nav");
const name = document.getElementById("name");
const overlay = document.getElementById("overlay");

let uiShown = false;


document.addEventListener("click", function (e) {
     const icon = e.target.closest("[data-action]");


     if (!icon) return;
     const img = icon.querySelector("img");
     const isFullscreen = icon.dataset.fullscreen === "true";
     const action = icon.dataset.action;
     if (action === "expand") {
          handleExpand();
     }

     if (!isFullscreen) {
          img.src="/minimize.svg"
          icon.dataset.fullscreen = "true";
     } 
     else {
          img.src="/maximize.svg"
          icon.dataset.fullscreen = "false";
     }
});


//TODO: Use URL query parameters to track expanded state
let expanded = false;
function handleExpand() {
     if (expanded == false) {
          overlay.classList.remove("overlay--panel");
          overlay.classList.add("overlay--expanded");
          expanded = true;
     } else {
          overlay.classList.remove("overlay--expanded");
          overlay.classList.add("overlay--panel");
          expanded = false;
     }
}

const tick = () => {
     //stats.begin();
     //controls.update;
     timer.update();
     const elapsedTime = timer.getElapsed();

     grassUniforms.time.value = elapsedTime;
     camera.fov = lerp(80, 100, scrollValue);
     camera.position.z = lerp(-310, -30, scrollValue);
     camera.position.y = lerp(-5, 5, scrollValue);
     camera.position.x = lerp(0, -30, scrollValue);
     //camera.rotation.z = lerp(-Math.PI, -Math.PI * 1.1, scrollValue);
     camera.rotation.y = lerp(0, Math.PI * -0.2, scrollValue);
     //camera.rotation.x = lerp(Math.PI, Math.PI * 0.8, scrollValue);
     camera.updateProjectionMatrix();
     const statueTimer = elapsedTime * 0.25;

     //Statue animations
     for (let i = 0; i < statueParts.length; i++) {
          statueParts[i].position.y = -33 + (i * (Math.cos(statueTimer) + 0.95) * 1.5);
     }

     // UI trigger logic
     if (scrollValue > threshold && !uiShown) {
          nav.classList.add("show-ui");
          name.classList.add("show-ui");
          uiShown = true;
     }

     if (scrollValue <= threshold && uiShown) {
          nav.classList.remove("show-ui");
          name.classList.remove("show-ui");
          history.pushState(null, "", "/");
          handleRouteChange();
          uiShown = false;
     }
     composer.render();
     //stats.end();
     window.requestAnimationFrame(tick);
};
tick();

//weird camera pathing
// camera.fov = lerp(80, 110, scrollValue);
// camera.position.z = lerp(-310, -20, scrollValue);
// camera.position.y = lerp(10, -5, scrollValue);
// camera.position.x = lerp(0, 30, scrollValue);
// camera.rotation.z = lerp(-Math.PI, -Math.PI / 1.2, scrollValue);
// camera.rotation.y = lerp(0, Math.PI / 3.5, scrollValue);
// camera.rotation.x = lerp(Math.PI, Math.PI / 1.25, scrollValue);

//camera.position.set(380, 15, 260);
//camera.lookAt(0,-100, 0) //position 1
