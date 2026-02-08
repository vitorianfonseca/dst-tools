export interface Camera {
  x: number; // world-space left edge of viewport
  y: number; // world-space top edge of viewport
  zoom: number; // scale factor
}

export function screenToWorld(
  screenX: number,
  screenY: number,
  camera: Camera
): { x: number; y: number } {
  return {
    x: screenX / camera.zoom + camera.x,
    y: screenY / camera.zoom + camera.y,
  };
}

export function worldToScreen(
  worldX: number,
  worldY: number,
  camera: Camera
): { x: number; y: number } {
  return {
    x: (worldX - camera.x) * camera.zoom,
    y: (worldY - camera.y) * camera.zoom,
  };
}

export function worldToCell(
  worldX: number,
  worldY: number,
  cellSize: number
): { x: number; y: number } {
  return {
    x: Math.floor(worldX / cellSize),
    y: Math.floor(worldY / cellSize),
  };
}

export function screenToCell(
  screenX: number,
  screenY: number,
  camera: Camera,
  cellSize: number
): { x: number; y: number } {
  const world = screenToWorld(screenX, screenY, camera);
  return worldToCell(world.x, world.y, cellSize);
}
