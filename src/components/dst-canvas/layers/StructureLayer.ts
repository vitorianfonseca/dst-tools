import { Container, Sprite, Assets, Texture } from 'pixi.js'
import { Camera, worldToScreen, unitsToPx } from '../coordinateSystem'
import { PlacedStructure } from '@/hooks/usePlacedStructures'

const DISPLAY_UNITS = 4
const ANCHOR_Y = 0.8

export class StructureLayer {
  container: Container
  private sprites = new Map<string, Sprite>()
  private textures = new Map<string, Texture>()

  constructor() {
    this.container = new Container()
    this.container.sortableChildren = true
  }

  async preload(structureIds: string[]) {
    const unique = [...new Set(structureIds)]
    await Promise.all(
      unique.map(async id => {
        if (this.textures.has(id)) return
        try {
          const tex = await Assets.load(`/src/assets/structures/${id}.png`)
          this.textures.set(id, tex)
        } catch {
          // missing sprite — skip silently
        }
      })
    )
  }

  render(
    structures: PlacedStructure[],
    selectedId: string | null,
    camera: Camera,
    screenW: number,
    screenH: number
  ) {
    const currentIds = new Set(structures.map(s => s.id))

    for (const [id, sprite] of this.sprites) {
      if (!currentIds.has(id)) {
        this.container.removeChild(sprite)
        sprite.destroy()
        this.sprites.delete(id)
      }
    }

    for (const s of structures) {
      let sprite = this.sprites.get(s.id)
      const tex = this.textures.get(s.structure.id)
      if (!tex) continue

      if (!sprite) {
        sprite = new Sprite(tex)
        sprite.anchor.set(0.5, ANCHOR_Y)
        this.sprites.set(s.id, sprite)
        this.container.addChild(sprite)
      }

      const screen = worldToScreen(s.gridX, s.gridY, camera, screenW, screenH)
      const sizePx = unitsToPx(DISPLAY_UNITS, camera.zoom)

      sprite.position.set(screen.x, screen.y)
      sprite.width = sizePx
      sprite.height = sizePx
      sprite.tint = selectedId === s.id ? 0xd4823b : s.built ? 0x88aa66 : 0xffffff
      sprite.zIndex = s.gridY
      sprite.alpha = s.built ? 0.7 : 1
    }

    this.container.sortChildren()
  }

  destroy() {
    this.container.destroy({ children: true })
  }
}
