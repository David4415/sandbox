import * as THREE from "three"
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"
import { clone } from "three/addons/utils/SkeletonUtils.js"

// Use these only for files you have added to the game folder or have a URL for;
// prefer the procedural models in primitives.js when no asset is available.

const gltfLoader = new GLTFLoader()
const textureLoader = new THREE.TextureLoader()
const gltfCache = new Map()

// Loads a .glb / .gltf. Every call returns an independent clone (skeletons included),
// so you can place the same model many times. Result: { scene, animations }.
export async function loadGLTF(url, { castShadow = true, receiveShadow = true } = {}) {
  if (!gltfCache.has(url)) gltfCache.set(url, gltfLoader.loadAsync(url))
  const gltf = await gltfCache.get(url)
  const scene = clone(gltf.scene)
  scene.traverse((child) => {
    if (!child.isMesh) return
    child.castShadow = castShadow
    child.receiveShadow = receiveShadow
  })
  return { scene, animations: gltf.animations }
}

export async function loadTexture(url, { repeat = null, srgb = true } = {}) {
  const texture = await textureLoader.loadAsync(url)
  if (srgb) texture.colorSpace = THREE.SRGBColorSpace
  if (repeat) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(...repeat)
  }
  return texture
}

// Scales a model to a target height and centers it with its feet on y = 0.
export function fitModel(object, height = 1.8) {
  const box = new THREE.Box3().setFromObject(object)
  const size = box.getSize(new THREE.Vector3())
  object.scale.multiplyScalar(height / size.y)
  box.setFromObject(object)
  const center = box.getCenter(new THREE.Vector3())
  object.position.x -= center.x
  object.position.z -= center.z
  object.position.y -= box.min.y
  const wrapper = new THREE.Group()
  wrapper.add(object)
  return wrapper
}
