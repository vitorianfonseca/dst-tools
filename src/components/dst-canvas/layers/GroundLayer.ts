import { Container, Sprite, Assets, Texture } from 'pixi.js'
import { Camera, UNITS_PER_TILE, worldToScreen, unitsToPx } from '../coordinateSystem'
import { PlacedGroundTile } from '@/hooks/useGroundTiles'

const TILE_SIZE_UNITS = UNITS_PER_TILE  // 1 tile = 4 game units

export class GroundLayer {
  container: Container
  private sprites = new Map<string, Sprite>()
  private textures = new Map<string, Texture>()

  constructor() {
    this.container = new Container()
    this.container.sortableChildren = false
  }

  async preload(imageUrl: string, tileId: string) {
    if (this.textures.has(tileId)) return
    try {
      const tex = await Assets.load(imageUrl)
      this.textures.set(tileId, tex)
    } catch {
      // missing texture — skip
    }
  }

  render(tiles: PlacedGroundTile[], camera: Camera, screenW: number, screenH: number) {
    const currentKeys = new Set(tiles.map(t => `${t.gridX},${t.gridY}`))

    for (const [key, sprite] of this.sprites) {
      if (!currentKeys.has(key)) {
        this.container.removeChild(sprite)
        sprite.destroy()
        this.sprites.delete(key)
      }
    }

    const sizePx = unitsToPx(TILE_SIZE_UNITS, camera.zoom)

    for (const t of tiles) {
      const key = `${t.gridX},${t.gridY}`
      const tex = this.textures.get(t.tile.id)
      if (!tex) continue

      let sprite = this.sprites.get(key)
      if (!sprite) {
        sprite = new Sprite(tex)
        sprite.anchor.set(0, 0)
        this.sprites.set(key, sprite)
        this.container.addChild(sprite)
      }

      const worldX = t.gridX * TILE_SIZE_UNITS
      const worldY = t.gridY * TILE_SIZE_UNITS
      const screen = worldToScreen(worldX, worldY, camera, screenW, screenH)

      sprite.position.set(screen.x, screen.y)
      sprite.width = sizePx
      sprite.height = sizePx
    }
  }

  destroy() {
    this.container.destroy({ children: true })
  }
}
