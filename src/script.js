import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'
import CustomShaderMaterial from 'three-custom-shader-material/vanilla'
import terrainVertexShader from './shaders/terrain/vertex.glsl'
import terrainFragmentShader from './shaders/terrain/fragment.glsl'


/**
 * Base
 */

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Environment map
 */
// const rgbeLoader = new RGBELoader()
// rgbeLoader.load('./urban_alley_01_1k.hdr', (environmentMap) =>
// {
//     environmentMap.mapping = THREE.EquirectangularReflectionMapping

//     scene.background = environmentMap
//     scene.environment = environmentMap
// })


/**
 * Lights
 */
const directionalLight = new THREE.PointLight('rgba(255, 225, 201, 1)', 2, 0, 0)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.normalBias = 0.2
directionalLight.position.set(30, 20, 10)
const helper = new THREE.CameraHelper(directionalLight.shadow.camera)
scene.add(helper)
scene.add(directionalLight)


/**
 * Terrain
 */
// Geometry
const terrainGeometry = new THREE.PlaneGeometry(100, 100, 128, 128)

// Material
const terrainMaterial = new CustomShaderMaterial({
    //CSM
    baseMaterial: THREE.MeshPhysicalMaterial,
    vertexShader: terrainVertexShader,
    fragmentShader: terrainFragmentShader,
    uniforms:
    {
        uBigTerrainElevation: {value: 1.0},
        uBigTerrainFrequency: { value: new THREE.Vector2(100, 20.5) }
    },
    roughness: 1.0,
    wireframe: false,
    color: '#ffffffff',
    side: THREE.FrontSide
})

const depthMaterial = new CustomShaderMaterial({
    //CSM
    baseMaterial: THREE.MeshDepthMaterial,
    vertexShader: terrainVertexShader,

    //MeshDepthMaterial
    depthPacking: THREE.RGBADepthPacking //The depthPacking is an algorithm used by Three.js to encode the depth in all 4 channels instead of a grayscale depth, which improves the precision.
})

// Mesh
const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial)
terrain.customDepthMaterial = depthMaterial
terrain.receiveShadow = true
terrain.castShadow = true
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
renderer.shadowMap.enabled = true
//renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()