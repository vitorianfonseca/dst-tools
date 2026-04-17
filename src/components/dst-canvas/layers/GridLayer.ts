import { Graphics, Container } from 'pixi.js'
import { Camera, UNITS_PER_TILE, BASE_PIXELS_PER_UNIT, worldToScreen } from '../coordinateSystem'

export class GridLayer {
  container: Container
  private g: Graphics

  constructor() {
    this.container = new Container()
    this.g = new Graphics()
    this.container.addChild(this.g)
  }

  render(camera: Camera, screenW: number, screenH: number) {
    this.g.clear()
    const ppu = BASE_PIXELS_PER_UNIT * camera.zoom

    const left   = camera.x - screenW / 2 / ppu
    const right  = camera.x + screenW / 2 / ppu
    const top    = camera.y - screenH / 2 / ppu
    const bottom = camera.y + screenH / 2 / ppu

    const u0x = Math.floor(left) - 1
    const u1x = Math.ceil(right) + 1
    const u0y = Math.floor(top) - 1
    const u1y = Math.ceil(bottom) + 1

    for (let ux = u0x; ux <= u1x; ux++) {
      const isTile = ((ux % UNITS_PER_TILE) + UNITS_PER_TILE) % UNITS_PER_TILE === 0
      const sx = worldToScreen(ux, 0, camera, screenW, screenH).x
      this.g.moveTo(sx, 0).lineTo(sx, screenH)
        .stroke({ width: 1, color: isTile ? 0x7a5a3a : 0x4a3a2a, alpha: isTile ? 0.6 : 0.3 })
    }
    for (let uy = u0y; uy <= u1y; uy++) {
      const isTile = ((uy % UNITS_PER_TILE) + UNITS_PER_TILE) % UNITS_PER_TILE === 0
      const sy = worldToScreen(0, uy, camera, screenW, screenH).y
      this.g.moveTo(0, sy).lineTo(screenW, sy)
        .stroke({ width: 1, color: isTile ? 0x7a5a3a : 0x4a3a2a, alpha: isTile ? 0.6 : 0.3 })
    }
  }

  destroy() {
    this.container.destroy({ children: true })
  }
}
