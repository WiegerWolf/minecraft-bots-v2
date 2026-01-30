import * as THREE from 'three'
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js'

export class SpectatorControls {
  private controls: PointerLockControls
  private keys = new Set<string>()
  private baseSpeed = 20
  private boostMultiplier = 3
  private overlay: HTMLDivElement

  constructor(private camera: THREE.Camera, private domElement: HTMLElement) {
    this.controls = new PointerLockControls(camera, domElement)

    this.overlay = document.createElement('div')
    Object.assign(this.overlay.style, {
      position: 'fixed',
      bottom: '8px',
      left: '50%',
      transform: 'translateX(-50%)',
      padding: '4px 12px',
      background: 'rgba(0,0,0,0.4)',
      color: 'rgba(255,255,255,0.7)',
      fontSize: '12px',
      fontFamily: 'monospace',
      borderRadius: '4px',
      pointerEvents: 'none',
      zIndex: '1000',
    })
    this.overlay.textContent = 'click to control camera'
    document.body.appendChild(this.overlay)

    this.domElement.addEventListener('click', () => this.controls.lock())

    this.controls.addEventListener('lock', () => {
      this.overlay.style.display = 'none'
    })
    this.controls.addEventListener('unlock', () => {
      this.overlay.style.display = 'block'
    })

    document.addEventListener('keydown', (e: KeyboardEvent) => this.keys.add(e.code))
    document.addEventListener('keyup', (e: KeyboardEvent) => this.keys.delete(e.code))
  }

  update(delta: number) {
    if (!this.controls.isLocked) return

    const speed = this.baseSpeed * (this.keys.has('ControlLeft') || this.keys.has('ControlRight') ? this.boostMultiplier : 1)
    const distance = speed * delta

    const forward = new THREE.Vector3()
    this.camera.getWorldDirection(forward)
    forward.y = 0
    forward.normalize()

    const right = new THREE.Vector3()
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize()

    if (this.keys.has('KeyW')) this.camera.position.addScaledVector(forward, distance)
    if (this.keys.has('KeyS')) this.camera.position.addScaledVector(forward, -distance)
    if (this.keys.has('KeyA')) this.camera.position.addScaledVector(right, -distance)
    if (this.keys.has('KeyD')) this.camera.position.addScaledVector(right, distance)
    if (this.keys.has('Space')) this.camera.position.y += distance
    if (this.keys.has('ShiftLeft') || this.keys.has('ShiftRight')) this.camera.position.y -= distance
  }

  dispose() {
    this.controls.dispose()
    this.overlay.remove()
  }
}
