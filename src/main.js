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
import fshStatueText from "./shaders/statue_fragment_shader.glsl?raw";
import vshStatueText from "./shaders/statue_vertex_shader.glsl?raw";
import getAboutMePage from "./routes/about.md?raw";
import getProjectsPage from "./routes/projects";
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
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const clickable = [];

const GRASS_SEGMENTS = 5;
const GRASS_PATCH_SIZE = 300;
const GRASS_WIDTH = 0.75;
const GRASS_HEIGHT = 4.5;
const NUM_GRASS = GRASS_PATCH_SIZE * GRASS_PATCH_SIZE * 3;

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
const terrainDiffuse = new THREE.TextureLoader().load(
     "/terrainTexture/Terrain_Texture_BaseColor.png",
);
terrainDiffuse.wrapS = THREE.RepeatWrapping;
terrainDiffuse.wrapT = THREE.RepeatWrapping;
const groundMaterial = new THREE.ShaderMaterial({
     uniforms: {
          uTerrainTexture: { value: terrainDiffuse },
          uTileScale: { value: 30.0 },
     },
     vertexShader: vshGroundText,
     fragmentShader: fshGroundText,
});
const groundGeometry = new THREE.PlaneGeometry(
     GRASS_PATCH_SIZE * 2,
     GRASS_PATCH_SIZE * 2,
     512,
     512,
);
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotateX(-Math.PI / 2);
scene.add(ground);

//Make sky
const hdrLoader = new HDRLoader();
const envMap = await hdrLoader.loadAsync("/puresky.hdr");
envMap.mapping = THREE.EquirectangularReflectionMapping;
//scene.environment = envMap; //nothing is using three.js' lighting. its all shader work
scene.background = envMap;
scene.backgroundRotation.y += Math.PI * 1.125;

//Make grass
const grassUniforms = {
     grassParams: {
          value: new THREE.Vector4(
               GRASS_SEGMENTS,
               GRASS_PATCH_SIZE,
               GRASS_WIDTH,
               GRASS_HEIGHT,
          ),
     },
     time: { value: 0 },
     resolution: { value: new THREE.Vector2(1, 1) },
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

//Make statue AND bake in transformations for future bug-prevention
const statueUniforms = {
     time: { value: 0 },
     minY: { value: 0.0 },
     maxY: { value: 0.0 },
};
const statueMaterial = new THREE.ShaderMaterial({
     uniforms: statueUniforms,
     vertexShader: vshStatueText,
     fragmentShader: fshStatueText,
     side: THREE.DoubleSide,
});
const loader = new GLTFLoader();
const gltf = await loader.loadAsync("/bust_statue.glb");
const statue = gltf.scene;
scene.add(statue);

// Bake transformations
statue.matrixAutoUpdate = false;
statue.scale.set(5, 5, 5);
// statue.rotation.set(0.2, Math.PI + 0.6, 0.2);
// statue.position.y = -365;
statue.updateMatrix();

let top = 0.0;
let bottom = 0.0;

statue.traverse((child) => {
     if (child.isMesh) {
          // Apply matrix to geometry
          child.geometry.applyMatrix4(child.matrix);
          child.geometry.computeVertexNormals(); // fix normals after baking
          child.geometry.computeBoundingBox();
          console.log(child.geometry);
          const bbox = child.geometry.boundingBox;
          statueUniforms.minY.value = bbox.min.y;
          statueUniforms.maxY.value = bbox.max.y;

          const secondBB = new THREE.Box3().setFromObject(child);
          top = secondBB.max.y;
          bottom = secondBB.min.y;
          console.log(top, bottom);
          statueUniforms.maxY.value = top;
          statueUniforms.minY.value = bottom;

          // Reset transforms
          child.scale.set(1, 1, 1);
          //     child.rotation.set(0, 0, 0);
          //     child.position.set(0, 0, 0);
          child.updateMatrix();

          child.material = statueMaterial;
     }
});

const boxGeometry = new THREE.BoxGeometry(5, (top - bottom) * 5.0, 5);
const boxMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const box = new THREE.Mesh(boxGeometry, boxMaterial);
scene.add(box);
box.position.set(30, 365, 25);

const camera = new THREE.PerspectiveCamera(
     80,
     screenSizes.width / screenSizes.height,
     0.1,
     750,
);
camera.position.set(70, 10, -310);
camera.lookAt(0, 0, 0);
scene.add(camera);

canvas.addEventListener("click", () => {
     history.pushState(null, "", "/");
     handleRouteChange();
});

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
               //view = getAboutMePage();
               document.getElementById("overlay-content").innerHTML = view;
               document.getElementById("overlay").classList.remove("overlay--hidden");
               document.getElementById("overlay").classList.add("overlay--panel");
               break;
          case "/projects":
               view = getProjectsPage();
               document.getElementById("overlay-content").innerHTML = view;
               document.getElementById("overlay").classList.remove("overlay--hidden");
               document.getElementById("overlay").classList.add("overlay--panel");
               break;
          case "/contact":
               view = md.render(getContactPage);
               document.getElementById("overlay-content").innerHTML = view;
               document.getElementById("overlay").classList.remove("overlay--hidden");
               document.getElementById("overlay").classList.add("overlay--panel");
               break;
          default:
               view = md.render(get404Page);
               document.getElementById("overlay-content").innerHTML = view;
               document.getElementById("overlay").classList.remove("overlay--hidden");
               document.getElementById("overlay").classList.add("overlay--panel");
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

let scrollValue = 0;

const scrollTarget = document.getElementById("webgl");
window.addEventListener("wheel", (event) => {
     if (event.target == scrollTarget) {
          scrollValue += event.deltaY * 0.0008;
          scrollValue = Math.min(Math.max(scrollValue, 0), 1);
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
const threshold = 0.5;

document.addEventListener("click", function (e) {
     const icon = e.target.closest("[data-action]");

     if (!icon) return;

     const action = icon.dataset.action;

     if (action === "expand") {
          handleExpand();
     }
});

const icon = document.getElementById("fullscreen");
const expandPath = document.getElementById("expand-path");
const collapsePath = document.getElementById("collapse-path");
let fullscreen = false;
if (icon)
{
     icon.addEventListener("click", () => {
          if (!fullscreen) {
               expandPath.style.display = "none";
               collapsePath.style.display = "block";
               fullscreen = true;
          } else {
               expandPath.style.display = "block";
               collapsePath.style.display = "none";
               fullscreen = false;
          }
          console.log("fullscreen", fullscreen);
     });
}


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
     grassUniforms.time.value = statueUniforms.time.value = elapsedTime;
     camera.fov = lerp(80, 100, scrollValue);
     camera.position.z = lerp(-310, -30, scrollValue);
     camera.position.y = lerp(-5, 5, scrollValue);
     camera.position.x = lerp(0, -30, scrollValue);
     //camera.rotation.z = lerp(-Math.PI, -Math.PI * 1.1, scrollValue);
     camera.rotation.y = lerp(0, Math.PI * -0.2, scrollValue);
     //camera.rotation.x = lerp(Math.PI, Math.PI * 0.8, scrollValue);
     camera.updateProjectionMatrix();

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
