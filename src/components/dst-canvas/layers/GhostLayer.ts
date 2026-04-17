import { Container, Sprite, Assets, Texture, Graphics } from 'pixi.js'
import { Camera, worldToScreen, unitsToPx } from '../coordinateSystem'

const DISPLAY_UNITS = 4
const ANCHOR_Y = 0.8

export class GhostLayer {
  container: Container
  private sprite: Sprite | null = null
  private ring: Graphics
  private loadedId: string | null = null

  constructor() {
    this.container = new Container()
    this.container.visible = false
    this.ring = new Graphics()
    this.container.addChild(this.ring)
  }

  async setStructureType(id: string) {
    if (this.loadedId === id) return
    this.loadedId = id

    if (this.sprite) {
      this.container.removeChild(this.sprite)
      this.sprite.destroy()
      this.sprite = null
    }

    try {
      const tex: Texture = await Assets.load(`/src/assets/structures/${id}.png`)
      if (this.loadedId !== id) return  // stale load guard
      this.sprite = new Sprite(tex)
      this.sprite.anchor.set(0.5, ANCHOR_Y)
      this.sprite.alpha = 0.55
      this.container.addChildAt(this.sprite, 0)
    } catch {
      // no sprite available
    }
  }

  render(worldX: number, worldY: number, isValid: boolean, camera: Camera, screenW: number, screenH: number) {
    const screen = worldToScreen(worldX, worldY, camera, screenW, screenH)
    const sizePx = unitsToPx(DISPLAY_UNITS, camera.zoom)

    if (this.sprite) {
      this.sprite.position.set(screen.x, screen.y)
      this.sprite.width = sizePx
      this.sprite.height = sizePx
      this.sprite.tint = isValid ? 0x44ff88 : 0xff4444
    }

    this.ring.clear()
    this.ring.circle(screen.x, screen.y, sizePx * 0.5)
    this.ring.stroke({ width: 2, color: isValid ? 0x44ff88 : 0xff4444, alpha: 0.85 })
  }

  show() { this.container.visible = true }
  hide() { this.container.visible = false }

  destroy() {
    this.container.destroy({ children: true })
  }
}
