import { Scene, WebGLRenderer, Color, InstancedBufferGeometry, Sphere, Vector3, TextureLoader, RepeatWrapping, ShaderMaterial, PlaneGeometry, Mesh, EquirectangularReflectionMapping, Vector4, FrontSide, MeshMatcapMaterial, PerspectiveCamera, Timer } from "three";
import { HDRLoader } from "three/addons/loaders/HDRLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { SMAAPass } from "three/examples/jsm/postprocessing/SMAAPass.js";
import { Cache } from "three";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'stats.js';
import fshGrassText from "./shaders/grass_fragment_shader.glsl?raw";
import vshGrassText from "./shaders/grass_vertex_shader.glsl?raw";
import fshGroundText from "./shaders/ground_fragment_shader.glsl?raw";
import vshGroundText from "./shaders/ground_vertex_shader.glsl?raw";



// TODO
// 1. DRACO compression for statue
// 2. DONE------------------------------------                                  do NOT do import * as THREE from "three". Only load what you need. Tree-shaking with vite? idk
// 3. use a lower-res terrain texture.       .webp
// 4.

function lerp(a, b, t) {
     return a + (b - a) * t;
}

export function makeScene() {

     const stats = new Stats();
     document.body.appendChild(stats.dom);

     const canvas = document.querySelector("canvas.webgl");
     const scene = new Scene();
     const renderer = new WebGLRenderer({ canvas: canvas });
     const screenSizes = {
          width: window.innerWidth,
          height: window.innerHeight,
     };
     renderer.setSize(screenSizes.width, screenSizes.height);
     renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
     Cache.enabled = true;
     scene.background = new Color(0x9095cc);



     const GRASS_SEGMENTS = 4;
     const GRASS_PATCH_SIZE = 30;
     const GRASS_WIDTH = 0.75;
     const GRASS_HEIGHT = 4.5;
     const NUM_GRASS = GRASS_PATCH_SIZE * GRASS_PATCH_SIZE * 10.0;
     const NUM_PATCHES = 10;
     const TOTAL_SIZE = GRASS_PATCH_SIZE * NUM_PATCHES * 2; //600

     console.log(NUM_PATCHES, TOTAL_SIZE)

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

          const geometry = new InstancedBufferGeometry();
          geometry.instanceCount = NUM_GRASS;
          geometry.setIndex(indeces);
          geometry.boundingSphere = new Sphere(
               new Vector3(0, 0, 0),
               1 + GRASS_PATCH_SIZE * 2,
          );

          return geometry;
     }

     //Make ground
     const terrainDiffuse = new TextureLoader().load("/terrainTexture/Terrain_Texture_BaseColor.webp"); //converted from png to webp: 567kB to 49kB
     terrainDiffuse.wrapS = RepeatWrapping;
     terrainDiffuse.wrapT = RepeatWrapping;
     const groundMaterial = new ShaderMaterial({
          uniforms:
          {
               uTerrainTexture: { value: terrainDiffuse },
               uTileScale: { value: 30.0 },
          },
          vertexShader: vshGroundText,
          fragmentShader: fshGroundText,
     });
     const groundGeometry = new PlaneGeometry(
          TOTAL_SIZE,
          TOTAL_SIZE,
          32,
          32,
     );
     const ground = new Mesh(groundGeometry, groundMaterial);
     ground.rotateX(-Math.PI / 2);
     scene.add(ground);

     //Make sky
     const hdrLoader = new HDRLoader();
     hdrLoader.loadAsync("/puresky2.hdr").then((envMap) => {
          envMap.mapping = EquirectangularReflectionMapping;
          scene.background = envMap;
          scene.backgroundRotation.y += Math.PI * 1.125;
     });

     //Make grass
     const grassUniforms = {
          grassParams: { value: new Vector4(GRASS_SEGMENTS, GRASS_PATCH_SIZE, GRASS_WIDTH, GRASS_HEIGHT) },
          time: { value: 0 }
     };
     const grassMaterial = new ShaderMaterial({
          uniforms: grassUniforms,
          vertexShader: vshGrassText,
          fragmentShader: fshGrassText,
          side: FrontSide,
     });
     const grassGeometry = createGeometry(GRASS_SEGMENTS);
     const grass = new Mesh(grassGeometry, grassMaterial);
     scene.add(grass);

     //Make statue
     const randInt = Math.floor(Math.random() * 6.0) + 1.0; //random matcap material on DOM load, change 6.0 to the number of matcap files you have [1,x]
     const gltfLoader = new GLTFLoader();
     const matcapTexture = new TextureLoader().load(`/matcap${randInt}.webp`);
     const matcapMaterial = new MeshMatcapMaterial({
          matcap: matcapTexture
     });
     let statueParts = [];

     async function loadStatue(scene) {
          try {
               const gltf = await gltfLoader.loadAsync('/bust_separated.glb');
               const statue = gltf.scene;

               statue.traverse((child) => {
                    if (child.isMesh) {
                         child.material = matcapMaterial;
                         child.position.set(-3, -30, -3);
                         child.rotation.y = 4;
                         child.scale.set(3, 3, 3);
                    }

               });
               statueParts.push(...statue.children);
               scene.add(statue);
               return statue;

          } catch (error) {
               console.error('Error loading GLTF:', error);
          }
     }
     loadStatue(scene);

     // //make Origin Marker
     // const cubeGeo = new THREE.BoxGeometry(1, 100, 1);
     // const cube = new THREE.Mesh(cubeGeo, matcapMaterial)
     // scene.add(cube);

     const camera = new PerspectiveCamera(80, screenSizes.width / screenSizes.height, 0.1, 750);
     camera.position.set(70, 10, -310);
     camera.lookAt(0, 0, 0);
     scene.add(camera);


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

     const controls = new OrbitControls(camera, renderer.domElement);


     return {
          camera,
          composer,
          grassUniforms,
          statueParts,
          controls,
          stats
     };

}  


export function startSceneTick(sceneCtx, appState, dom) {
     const { camera, composer, grassUniforms, statueParts, controls, stats } = sceneCtx;
     const { nav, name } = dom;
     const timer = new Timer();
     let rafId = null;
     let running = false;
     timer.connect(document);

     const tick = () => {
          if (!running) return;

          timer.update();
          const elapsedTime = timer.getElapsed();
          const statueTimer = elapsedTime * 0.25;

          grassUniforms.time.value = elapsedTime;

          // camera.fov = lerp(80, 100, appState.scrollValue);
          // camera.position.z = lerp(-310, -33, appState.scrollValue);
          // camera.position.y = lerp(-5, 5, appState.scrollValue);
          // camera.position.x = lerp(0, -33, appState.scrollValue);
          // camera.rotation.y = lerp(0, Math.PI * -0.2, appState.scrollValue);
          controls.update();
          camera.updateProjectionMatrix();

          for (let i = 0; i < statueParts.length; i++)
               statueParts[i].position.y = -33 + (i * (Math.cos(statueTimer) + 0.95) * 1.5);

          // UI trigger logic
          if (appState.scrollValue > appState.threshold && !appState.uiShown && !appState.uiShownFullscreenOverruled) {
               nav.classList.add("show-ui");
               name.classList.add("show-ui");
               appState.uiShown = true;
               const scrollHelper = document.getElementById("scroll-helper");
               if (scrollHelper) {
                    scrollHelper.classList.remove("show-scroll-helper");
                    scrollHelper.classList.add("hide-scroll-helper");
               }
          }
          else if (appState.scrollValue > appState.threshold && appState.uiShown && appState.uiShownFullscreenOverruled) {
               //handles removing nav and name only when expanded. set by the long ass variable name
               nav.classList.remove("show-ui");
               name.classList.remove("show-ui");
               appState.uiShown = false;
          }
          else if (appState.scrollValue <= appState.threshold && appState.uiShown) {
               nav.classList.remove("show-ui");
               name.classList.remove("show-ui");
               history.pushState(null, "", "/");
               document.getElementById("overlay").classList.remove("overlay--panel");
               document.getElementById("overlay").classList.remove("overlay--expanded");
               document.getElementById("overlay").classList.add("overlay--hidden");
               appState.uiShown = false;
          }
          stats.begin();
          composer.render();
          stats.end();
          rafId = requestAnimationFrame(tick);
     };

     function startLoop() {
          if (running) return;   // prevent double loops
          running = true;
          timer.reset();         // prevents huge time jump on resume
          timer.update();
          rafId = requestAnimationFrame(tick);
     }

     function pauseLoop() {
          running = false;
          if (rafId !== null) {
               cancelAnimationFrame(rafId);
               rafId = null;
          }
     }

     startLoop();
     return {
          pause: pauseLoop,
          resume: startLoop,
          syncWithAppState: () => {
               if (appState.paused) pauseLoop();
               else startLoop();
          }
     };
}
