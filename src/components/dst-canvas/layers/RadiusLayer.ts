import { Graphics, Container } from 'pixi.js'
import { Camera, worldToScreen, unitsToPx } from '../coordinateSystem'
import { PlacedStructure } from '@/hooks/usePlacedStructures'
import { getRadii } from '../structureRadii'

export class RadiusLayer {
  container: Container
  private g: Graphics

  constructor() {
    this.container = new Container()
    this.g = new Graphics()
    this.container.addChild(this.g)
  }

  render(structures: PlacedStructure[], camera: Camera, screenW: number, screenH: number) {
    this.g.clear()

    for (const s of structures) {
      const radii = getRadii(s.structure.id)
      if (radii.length === 0) continue

      const screen = worldToScreen(s.gridX, s.gridY, camera, screenW, screenH)

      for (const r of radii) {
        const radiusPx = unitsToPx(r.radius, camera.zoom)
        this.g.circle(screen.x, screen.y, radiusPx)
        this.g.fill({ color: r.color, alpha: r.fillAlpha })
        this.g.stroke({ width: 1.5, color: r.color, alpha: r.strokeAlpha })
      }
    }
  }

  destroy() {
    this.container.destroy({ children: true })
  }
}
