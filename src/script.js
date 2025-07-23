import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'
import Stats from 'stats.js';
import GUI from 'lil-gui'
import CustomShaderMaterial from 'three-custom-shader-material/vanilla'
import terrainVertexShader from './shaders/terrain/vertex.glsl'
import terrainFragmentShader from './shaders/terrain/fragment.glsl'

var stats = new Stats();
stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild( stats.dom );


if(crossOriginIsolated)
    console.log("ISOLATED!"); //currently isolated. look at vite.config.js for cross-origin-opener-policy headers
else
    console.log('NOT ISOLATED!');

/**
 * Base
 */

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Debug
 */
const gui = new GUI()

/**
 * Environment map
 */
const rgbeLoader = new RGBELoader()
rgbeLoader.load('./urban_alley_01_1k.hdr', (environmentMap) =>
{
    environmentMap.mapping = THREE.EquirectangularReflectionMapping

    scene.background = environmentMap
    scene.environment = environmentMap
})


/**
 * Terrain
 */
const terrainGeometry = new THREE.PlaneGeometry(500, 500, 256, 256)
terrainGeometry.computeTangents()

const terrainMaterial = new CustomShaderMaterial({
    baseMaterial: THREE.MeshPhysicalMaterial,
    vertexShader: terrainVertexShader,
    fragmentShader: terrainFragmentShader,
    uniforms:
    {
        uSimplexA: {value: 9.0},
        uSimplexF: {value: 0.005},
        uGain: {value: 0.25},
        uLacunarity: {value: 2.7},
    },
    wireframe: false,
    roughness: 0.9,
    metalness: 0.0,
    side: THREE.FrontSide,
    color: new THREE.Color('rgb(92, 64, 51)'),
})

gui.add(terrainMaterial.uniforms.uSimplexA, 'value').min(0).max(30).step(0.01).name('uSimplexAmplitude');
gui.add(terrainMaterial.uniforms.uSimplexF, 'value').min(0).max(0.05).step(0.001).name('uSimplexFrequency');
gui.add(terrainMaterial.uniforms.uGain, 'value').min(0.0).max(1.0).step(0.01).name('uGain');
gui.add(terrainMaterial.uniforms.uLacunarity, 'value').min(0).max(5).step(0.05).name('uLacunarity');

const depthMaterial = new CustomShaderMaterial({
    baseMaterial: THREE.MeshDepthMaterial,
    vertexShader: terrainVertexShader,
    depthPacking: THREE.RGBADepthPacking //The depthPacking is an algorithm used by Three.js to encode the depth in all 4 channels instead of a grayscale depth, which improves the precision.
})

// Mesh
const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial)
terrain.customDepthMaterial = depthMaterial
terrain.rotation.x = - Math.PI * 0.5
scene.add(terrain)

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
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1)
camera.position.set(-60, 20, 30)
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

function runBenchmark(durationMs = 5000) {
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
//runBenchmark();
tick();