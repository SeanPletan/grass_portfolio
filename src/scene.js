import { Scene, Vector2, WebGLRenderer, Color, InstancedBufferGeometry, InstancedBufferAttribute, Sphere, Vector3, TextureLoader, RepeatWrapping, ShaderMaterial, PlaneGeometry, Mesh, EquirectangularReflectionMapping, Vector4, FrontSide, MeshMatcapMaterial, PerspectiveCamera, Timer, SRGBColorSpace, InstancedMesh, Frustum, Matrix4} from "three";
import { HDRLoader } from "three/addons/loaders/HDRLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { SMAAPass } from "three/examples/jsm/postprocessing/SMAAPass.js";
import { Cache } from "three";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import Stats from 'stats.js';
import fshGrassText from "./shaders/grass_fragment_shader.glsl?raw";
import vshGrassText from "./shaders/grass_vertex_shader.glsl?raw";
import fshGroundText from "./shaders/ground_fragment_shader.glsl?raw";
import vshGroundText from "./shaders/ground_vertex_shader.glsl?raw";


//TODO

//1. Photoshop the .webp to have blown out whites + bloom (think black hole sun music video). You can download the 8K .jpg from HDRIHaven. Kloofendall48d



/* 
To unlock Chrome framerate (app will be in an unusable state, ONLY for fps monitoring):
(69 fps at default camera view, ~~90fps at full zoom near statue [chunks have been frustum culled])

//google-chrome --args --disable-gpu-vsync --disable-frame-rate-limit

*/

function lerp(a, b, t) {
     return a + (b - a) * t;
}

export function makeScene() {

     const stats = new Stats();
     document.body.appendChild(stats.dom);

     const canvas = document.querySelector("canvas.webgl");
     const scene = new Scene();
     const renderer = new WebGLRenderer({ canvas: canvas, powerPreference: 'high-performance' });
     const screenSizes = {
          width: window.innerWidth,
          height: window.innerHeight,
     };
     renderer.setSize(screenSizes.width, screenSizes.height);
     renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
     Cache.enabled = true;
     scene.background = new Color(0x9095cc);



     const GRASS_SEGMENTS = 4;
     const GRASS_WIDTH = 0.75;
     const GRASS_HEIGHT = 4.5;

     const GRASS_DENSITY = 3.0;
     const GRASS_CHUNK_SIZE = 20;
     const NUM_CHUNKS_PER_SIDE = 5;     
     
     const NUM_GRASS_PER_CHUNK = GRASS_CHUNK_SIZE * GRASS_CHUNK_SIZE * GRASS_DENSITY;
     const TOTAL_NUM_GRASS = NUM_GRASS_PER_CHUNK * NUM_CHUNKS_PER_SIDE * NUM_CHUNKS_PER_SIDE;
     const TOTAL_GROUND_SIZE = GRASS_CHUNK_SIZE * NUM_CHUNKS_PER_SIDE * 2; //600

     //////////////////////////////////////////////////////////////////////////////////////////////////////////
     ///////////////////////////////////////////START GRASS CREATION///////////////////////////////////////////
     //////////////////////////////////////////////////////////////////////////////////////////////////////////
     //Make grass geometry
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
          geometry.instanceCount = TOTAL_NUM_GRASS;
          geometry.setIndex(indeces);
          geometry.boundingSphere = new Sphere(
               new Vector3(0, 0, 0),
               TOTAL_GROUND_SIZE,
          );

          return geometry;
     }

     //Make grass mesh data
     const grassUniforms = {
          grassParams: { value: new Vector4(GRASS_SEGMENTS, GRASS_CHUNK_SIZE, GRASS_WIDTH, GRASS_HEIGHT) },
          time: { value: 0 }
     };
     const grassMaterial = new ShaderMaterial({
          uniforms: grassUniforms,
          vertexShader: vshGrassText,
          fragmentShader: fshGrassText,
          side: FrontSide,
     });
     const grassGeometry = createGeometry(GRASS_SEGMENTS);

     // //Make grass chunks
     // class Chunk {
     //      constructor(i, j) {
     //           this.chunkIndex = [i, j];

     //           // world position of chunk center
     //           this.worldCenter = new Vector3(
     //                i * GRASS_CHUNK_SIZE * 2 + GRASS_CHUNK_SIZE,
     //                0,
     //                j * GRASS_CHUNK_SIZE * 2 + GRASS_CHUNK_SIZE
     //           );

     //           // bounding sphere (covers whole chunk + grass height)
     //           const radiusXZ = Math.sqrt((GRASS_CHUNK_SIZE * GRASS_CHUNK_SIZE + GRASS_CHUNK_SIZE * GRASS_CHUNK_SIZE)) / 2.0;
     //           this.boundingRadius = radiusXZ + 1.0; //1.0 for margin of error

     //           // build per-instance data for this chunk
     //           this.template = this.buildTemplate(i, j);
     //      }

     //      buildTemplate(i, j) {
     //           const chunkIndexInstanceAttribute = new Float32Array(NUM_GRASS_PER_CHUNK * 2);

     //           let ptr = 0;
     //           for (let k = 0; k < NUM_GRASS_PER_CHUNK * 2; k++) {
     //                chunkIndexInstanceAttribute[ptr++] = i;
     //                chunkIndexInstanceAttribute[ptr++] = j;
     //           }

     //           return chunkIndexInstanceAttribute;
     //      }
     // }

     // const chunks = [];

     // for (let i = -(NUM_CHUNKS_PER_SIDE / 2); i < (NUM_CHUNKS_PER_SIDE / 2); i++) {
     //      for (let j = -(NUM_CHUNKS_PER_SIDE / 2); j < (NUM_CHUNKS_PER_SIDE / 2); j++) {
     //           chunks.push(new Chunk(i, j));
     //      }
     // }

     // // buffer that goes to GPU every frame (worst case size)
     // const visibleChunkOffsetBuffer = new Float32Array(TOTAL_NUM_GRASS * 2);

     // const chunkOffsetAttribute = new InstancedBufferAttribute(visibleChunkOffsetBuffer, 2, false);

     // grassGeometry.setAttribute("chunkOffset", chunkOffsetAttribute);


     // //Make camera frustum for chunk culling
     // const frustum = new Frustum();
     // const projScreenMatrix = new Matrix4();

     // //frustum culling loop and dynamic frame visibility buffer
     // function updateGrassCulling(camera) {

     //      // STEP 1 — build camera frustum
     //      camera.updateMatrixWorld();
     //      projScreenMatrix.multiplyMatrices(
     //           camera.projectionMatrix,
     //           camera.matrixWorldInverse
     //      );
     //      frustum.setFromProjectionMatrix(projScreenMatrix);

     //      // STEP 2 — iterate chunks + stream visible templates
     //      let visiblePtr = 0;

     //      for (const chunk of chunks) {

     //           // STEP 3 — sphere vs frustum test
     //           const sphere = new Sphere(chunk.worldCenter, chunk.boundingRadius);

     //           if (!frustum.intersectsSphere(sphere)) continue;

     //           // STEP 4 — memcpy template into visible buffer
     //           visibleChunkOffsetBuffer.set(chunk.template, visiblePtr);

     //           visiblePtr += chunk.template.length;
     //      }

     //      // STEP 5 — upload only the part we filled
     //      chunkOffsetAttribute.needsUpdate = true;

     //      // STEP 6 — tell GPU how many instances to draw
     //      grassGeometry.instanceCount = visiblePtr / 2;
     // }

     //frustum, projScreenMatrix, frustum, chunks, visibleChunkOffsetBuffer, chunkOffsetAttribute

          //old
     const chunkOffsetData = new Float16Array(TOTAL_NUM_GRASS * 2);
     let ptr = 0;

     for (let i = -(NUM_CHUNKS_PER_SIDE / 2); i < (NUM_CHUNKS_PER_SIDE / 2); i++) {
          for (let j = -(NUM_CHUNKS_PER_SIDE / 2); j < (NUM_CHUNKS_PER_SIDE / 2); j++) {
               for (let k = 0; k < NUM_GRASS_PER_CHUNK; k++) {
                    chunkOffsetData[ptr++] = i;
                    chunkOffsetData[ptr++] = j;
               }
          }
     }
     grassGeometry.setAttribute("chunkOffset", new InstancedBufferAttribute(chunkOffsetData, 2, false));

     const grass = new Mesh(grassGeometry, grassMaterial);
     scene.add(grass);

     //////////////////////////////////////////////////////////////////////////////////////////////////////////
     ////////////////////////////////////////// END GRASS CREATION ////////////////////////////////////////////
     //////////////////////////////////////////////////////////////////////////////////////////////////////////


     // Make statue
     const dracoLoader = new DRACOLoader();
     dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.4.1/'); //recommended by google, as more users will have this in their cache

     const randInt = Math.floor(Math.random() * 6) + 1; // random matcap
     const matcapTexture = new TextureLoader().load(`/matcap${randInt}.webp`);
     const matcapMaterial = new MeshMatcapMaterial({ matcap: matcapTexture });

     let statueParts = [];

     // async function loadDRCStatue(scene) {
     //      for (let i = 1; i < 10; i++)
     //      {
     //           // Decode the DRACO geometry and make a mesh.
     //           const geometry = await dracoLoader.loadAsync(`bust/bust_00${i}.drc`);
     //           const statueMesh = new Mesh(geometry, matcapMaterial);


     //           // Transform mesh
     //           statueMesh.position.set(-3, -30, -3);
     //           statueMesh.rotation.y = 4;
     //           //statueMesh.name = `bust_00${i}`;

     //           // Add to scene and track parts
     //           statueParts.push(statueMesh);
     //           scene.add(statueMesh);
     //      }
     // }

     // loadDRCStatue(scene);

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
          TOTAL_GROUND_SIZE,
          TOTAL_GROUND_SIZE,
          128,
          128,
     );
     const ground = new Mesh(groundGeometry, groundMaterial);
     ground.rotateX(-Math.PI / 2);
     scene.add(ground);

     //Make sky
     const skyLoader = new TextureLoader();
     const sky = skyLoader.load('puresky.webp', () => {
          sky.mapping = EquirectangularReflectionMapping;
          sky.colorSpace = SRGBColorSpace;
          scene.background = sky;
          scene.backgroundRotation.y += Math.PI * 1.125;
     })

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
          stats,
          renderer,
          grassGeometry,
          scene
     };

}  


export function startSceneTick(sceneCtx, appState, dom) {
     const { camera, composer, grassUniforms, grassGeometry, statueParts, controls, stats, renderer, scene } = sceneCtx;
     const { nav, name } = dom;
     const timer = new Timer();
     let rafId = null;
     let running = false;
     timer.connect(document);

     let count = 1;

     const tick = () => {
          if (!running) return;

          timer.update();
          const elapsedTime = timer.getElapsed();
          const statueTimer = elapsedTime * 0.25;


          grassUniforms.time.value = elapsedTime;
          // GRASS FRUSTUM CULLING LOGIC:
          //frustumMatrix = projectionMatrix * viewMatrix;
          //frustum.setFromProjectionMatrix(frustumMatrix);

          grassGeometry.instanceCount = count % 30000;
          count += 20;


          // camera.fov = lerp(80, 100, appState.scrollValue);
          // camera.position.z = lerp(-310, -33, appState.scrollValue);
          // camera.position.y = lerp(-5, 5, appState.scrollValue);
          // camera.position.x = lerp(0, -33, appState.scrollValue);
          // camera.rotation.y = lerp(0, Math.PI * -0.2, appState.scrollValue);
          controls.update();
          camera.updateProjectionMatrix();

          //updateGrassCulling(camera);



          for (let i = 0; i < statueParts.length; i++)
               statueParts[i].position.y = -33 + (i * (Math.sin(statueTimer) + 0.95) * 1.5);

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
          renderer.render(scene, camera);
          stats.end();
          rafId = requestAnimationFrame(tick);   
          console.log(renderer.info.render.calls, renderer.info.render.triangles); 
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
