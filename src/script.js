import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import Stats from 'stats.js';
import CustomShaderMaterial from 'three-custom-shader-material/vanilla'
import terrainVertexShader from './shaders/terrain/vertex.glsl'
import terrainFragmentShader from './shaders/terrain/fragment.glsl'
import grassVertexShader from './shaders/grass/vertex.glsl'
import grassFragmentShader from './shaders/grass/fragment.glsl'

var stats = new Stats();
stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild( stats.dom );


// if(crossOriginIsolated)
//     console.log("ISOLATED!"); //currently isolated. look at vite.config.js for cross-origin-opener-policy headers
// else
//     console.log('NOT ISOLATED!');




const canvas = document.querySelector('canvas.webgl')
const scene = new THREE.Scene()
/**
 * Environment map
 */
const rgbeLoader = new RGBELoader()
rgbeLoader.load('./purenight.hdr', (environmentMap) =>
{
    environmentMap.mapping = THREE.EquirectangularReflectionMapping

    scene.background = environmentMap
    scene.environment = environmentMap
})

/**
 * Models
 */
const gltfLoader = new GLTFLoader()

const terrainSize = 1000;

/**
 * Terrain
 */
const terrainGeometry = new THREE.PlaneGeometry(terrainSize, terrainSize, 256, 256)
terrainGeometry.computeTangents()

const terrainMaterial = new CustomShaderMaterial({
    baseMaterial: THREE.MeshPhysicalMaterial,
    vertexShader: terrainVertexShader,
    fragmentShader: terrainFragmentShader,
    wireframe: false,
    roughness: 0.9,
    metalness: 0.0,
    side: THREE.FrontSide,
    color: new THREE.Color('rgb(92, 64, 51)'),
})

const depthMaterial = new CustomShaderMaterial({
    baseMaterial: THREE.MeshDepthMaterial,
    vertexShader: terrainVertexShader,
    //depthPacking: THREE.RGBADepthPacking //The depthPacking is an algorithm used by Three.js to encode the depth in all 4 channels instead of a grayscale depth, which improves the precision.
})

const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial)
terrain.customDepthMaterial = depthMaterial
terrain.rotation.x = - Math.PI * 0.5
scene.add(terrain)




const grassWidth = 0.15;
const grassHeight = 3.0;
const grassDensity = 2.5;
let numOfGrass = 700000;


const grassGeometry = new THREE.PlaneGeometry(grassWidth, grassHeight);


//instancedMesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);








/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}
window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})
/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1)
camera.position.set(-330, 200, 0)
//camera.position.set(0, 2, 4)
scene.add(camera)
// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))



const tick = () =>
{
    stats.begin();
    controls.update()
    renderer.render(scene, camera);
    console.log(
      'Draw calls:', renderer.info.render.calls,
      'Triangles:', renderer.info.render.triangles
    );    
    stats.end();
    window.requestAnimationFrame(tick)
}

function runBenchmark(durationMs = 10000) {
    const start = performance.now();
    let frameCount = 0;

    function renderLoop() {
        const now = performance.now();
        if (now - start < durationMs) {
            renderer.render(scene, camera);
            frameCount++;
            setTimeout(renderLoop, 0); // Schedule next call, avoids recursion
            console.log(frameCount);
        } else {
            const elapsed = now - start;
            const fps = frameCount / (elapsed / 1000);
            console.log(`Uncapped render FPS: ${fps.toFixed(2)}`);
        }
    }

    renderLoop();
}

//console.log(renderer.info);
//runBenchmark(); // 220-223 fps with terrain and skybox. 2 draw calls with 131084 traingles (256*256*2 + 6*2).
                //17-40 fps with 10,000,000 instanced square grass blades with Basic Shader Material (2131084 triangles). Unexpected crash on third bench run.
tick();



/////////////////////////////
//** NOTEBOOK BELOW HERE **//
/*
- When clicking into either the blog, project list, futre idea, etc.; Go to a different or zoomed in camera angle for each
- The UI should look like paper. translucent. perhaps not filling the entire screen. 90%? Vaguely modeled after Monster Hunter: Rise
- Probably a texture/image for the UI background. Not a color. https://www.gameuidatabase.com/uploads/Monster-Hunter-Rise07292022-034945-29850.jpg
*/