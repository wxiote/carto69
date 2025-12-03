<template>
  <div class="map-container">
    <button class="back-button" @click="$emit('back')">
      ← Retour
    </button>
    
    <div ref="sceneContainer" class="scene"></div>
    
    <div class="floor-selector">
      <button
        v-for="floor in floors"
        :key="floor.name"
        :class="{ active: selectedFloor === floor.name }"
        @click="selectFloor(floor.name)"
      >
        {{ floor.label }}
      </button>
    </div>
    
    <div class="info-panel">
      <p>{{ floors.find(f => f.name === selectedFloor)?.label }}</p>
      <p class="controls-hint">Molette: zoom | Clic glisser: rotation</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const emit = defineEmits(['back'])

const sceneContainer = ref(null)
let scene, camera, renderer, controls
let floorObjects = {}

const floors = [
  { name: 'outside', label: 'Extérieur' },
  { name: 'B1-LL3', label: 'Parking -3' },
  { name: 'B1-LL2', label: 'Parking -2' },
  { name: 'B1-LL1', label: 'Parking -1' },
  { name: 'B1-UL1', label: 'RDC' },
  { name: 'B1-UL2', label: 'Niveau 1' },
  { name: 'B1-UL3', label: 'Niveau 2' }
]

const selectedFloor = ref('B1-UL1')

onMounted(async () => {
  await initScene()
  await loadFloorData()
  animate()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onWindowResize)
  if (renderer) {
    renderer.dispose()
  }
  if (controls) {
    controls.dispose()
  }
})

async function initScene() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xf0f0f0)

  camera = new THREE.PerspectiveCamera(
    50,
    sceneContainer.value.clientWidth / sceneContainer.value.clientHeight,
    0.1,
    2000
  )
  camera.position.set(0, 150, 200)
  camera.lookAt(0, 0, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(sceneContainer.value.clientWidth, sceneContainer.value.clientHeight)
  renderer.setPixelRatio(window.devicePixelRatio)
  sceneContainer.value.appendChild(renderer.domElement)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.maxPolarAngle = Math.PI / 2

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4)
  directionalLight.position.set(100, 100, 50)
  scene.add(directionalLight)

  window.addEventListener('resize', onWindowResize)
}

function onWindowResize() {
  if (!sceneContainer.value) return
  
  camera.aspect = sceneContainer.value.clientWidth / sceneContainer.value.clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(sceneContainer.value.clientWidth, sceneContainer.value.clientHeight)
}

async function loadFloorData() {
  try {
    const response = await fetch('/mapCC.json')
    const data = await response.json()
    
    const loader = new THREE.ObjectLoader()
    const loadedObject = loader.parse(data)
    
    loadedObject.children.forEach(child => {
      if (child.userData && child.userData.name) {
        const floorName = child.userData.name
        floorObjects[floorName] = child
        scene.add(child)
        child.visible = floorName === selectedFloor.value
      }
    })
    
    const box = new THREE.Box3().setFromObject(loadedObject)
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    
    controls.target.copy(center)
    
    const maxDim = Math.max(size.x, size.y, size.z)
    const fov = camera.fov * (Math.PI / 180)
    let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2))
    cameraZ *= 1.5
    
    camera.position.set(center.x + cameraZ * 0.5, center.y + cameraZ * 0.7, center.z + cameraZ)
    camera.lookAt(center)
    
  } catch (error) {
    console.error('Erreur chargement:', error)
  }
}

function selectFloor(floorName) {
  selectedFloor.value = floorName
  
  Object.entries(floorObjects).forEach(([name, object]) => {
    object.visible = name === floorName
  })
}

function animate() {
  requestAnimationFrame(animate)
  controls.update()
  renderer.render(scene, camera)
}
</script>

<style scoped lang="scss">
.map-container {
  width: 100%;
  height: 100vh;
  position: relative;
  overflow: hidden;
}

.scene {
  width: 100%;
  height: 100%;
}

.back-button {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 100;
  background: rgba(255, 255, 255, 0.95);
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;

  &:hover {
    background: white;
    transform: translateX(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
}

.floor-selector {
  position: absolute;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 100;

  button {
    background: rgba(255, 255, 255, 0.9);
    border: 2px solid rgba(90, 140, 75, 0.3);
    padding: 12px 16px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.3s ease;
    white-space: nowrap;
    min-width: 140px;
    text-align: left;

    &:hover {
      background: white;
      border-color: rgba(90, 140, 75, 0.6);
      transform: translateX(4px);
    }

    &.active {
      background: rgba(90, 140, 75, 0.9);
      color: white;
      border-color: rgba(90, 140, 75, 1);
      transform: translateX(4px);
      box-shadow: 0 4px 12px rgba(90, 140, 75, 0.3);
    }
  }
}

.info-panel {
  position: absolute;
  bottom: 20px;
  left: 20px;
  background: rgba(255, 255, 255, 0.95);
  padding: 16px 20px;
  border-radius: 8px;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);

  p {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #333;

    &.controls-hint {
      margin-top: 8px;
      font-size: 12px;
      font-weight: 400;
      color: #666;
    }
  }
}

@media (max-width: 768px) {
  .floor-selector {
    left: 10px;
    top: auto;
    bottom: 80px;
    transform: none;
    flex-direction: row;
    flex-wrap: wrap;
    max-width: calc(100% - 20px);

    button {
      min-width: auto;
      padding: 8px 12px;
      font-size: 12px;
    }
  }

  .back-button {
    top: 10px;
    right: 10px;
    padding: 8px 16px;
    font-size: 14px;
  }

  .info-panel {
    bottom: 10px;
    left: 10px;
    padding: 12px 16px;

    p {
      font-size: 14px;

      &.controls-hint {
        font-size: 11px;
      }
    }
  }
}
</style>
