import * as THREE from 'three'
import { io } from 'socket.io-client'
import { SpectatorControls } from './spectator-controls'

// prismarine-viewer modules expect THREE as a global — must be set before require()
;(globalThis as any).THREE = THREE

const TWEEN = require('@tweenjs/tween.js')
const { Viewer } = require('prismarine-viewer/viewer/lib/viewer')
const Entity = require('prismarine-viewer/viewer/lib/entity/Entity')

const socket = io({
  path: window.location.pathname + 'socket.io'
})

const renderer = new THREE.WebGLRenderer()
renderer.setPixelRatio(window.devicePixelRatio || 1)
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const viewer = new Viewer(renderer)
const controls = new SpectatorControls(viewer.camera, renderer.domElement)

const clock = new THREE.Clock()

function animate() {
  window.requestAnimationFrame(animate)
  controls.update(clock.getDelta())
  viewer.update()
  renderer.render(viewer.scene, viewer.camera)
}
animate()

window.addEventListener('resize', () => {
  viewer.camera.aspect = window.innerWidth / window.innerHeight
  viewer.camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

let firstPositionUpdate = true

socket.on('version', (version: string) => {
  if (!viewer.setVersion(version)) {
    return
  }

  firstPositionUpdate = true

  // Default missing entity width/height to avoid NaN in BoxGeometry fallback
  socket.on('entity', (e: any) => {
    if (e.width == null || isNaN(e.width)) e.width = 0.6
    if (e.height == null || isNaN(e.height)) e.height = 1.8
  })

  viewer.listen(socket)

  let botMesh: THREE.Object3D | undefined
  socket.on('position', ({ pos, addMesh, yaw, pitch }: any) => {
    // In spectator mode we ignore first-person camera updates from the server.
    // We only use position data to place the bot mesh and set initial camera.
    if (pos.y > 0 && firstPositionUpdate) {
      viewer.camera.position.set(pos.x, pos.y + 20, pos.z + 20)
      viewer.camera.lookAt(pos.x, pos.y, pos.z)
      firstPositionUpdate = false
    }

    if (addMesh) {
      if (!botMesh) {
        botMesh = new Entity('1.16.4', 'player', viewer.scene).mesh
        if (botMesh) viewer.scene.add(botMesh)
      }
      if (botMesh) {
        new TWEEN.Tween(botMesh.position).to({ x: pos.x, y: pos.y, z: pos.z }, 50).start()
        const da = (yaw - botMesh.rotation.y) % (Math.PI * 2)
        const dy = 2 * da % (Math.PI * 2) - da
        new TWEEN.Tween(botMesh.rotation).to({ y: botMesh.rotation.y + dy }, 50).start()
      }
    }
  })
})
