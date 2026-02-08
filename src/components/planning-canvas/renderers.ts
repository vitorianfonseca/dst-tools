import { Camera, worldToScreen } from "./camera";
import { PlacedStructure } from "@/hooks/usePlacedStructures";
import { PlacedGroundTile } from "@/hooks/useGroundTiles";

export interface ThemeColors {
  canvasBg: string;
  canvasGrid: string;
  surfaceElevated: string;
  border: string;
  card: string;
  primary: string;
  primaryAlpha20: string;
  primaryAlpha30: string;
  primaryAlpha50: string;
  destructiveAlpha20: string;
  destructiveAlpha30: string;
  destructiveAlpha60: string;
}

// Fallback colors matching the DST dark theme
const FALLBACK_COLORS: ThemeColors = {
  canvasBg: "hsl(30, 12%, 10%)",
  canvasGrid: "hsl(30, 10%, 16%)",
  surfaceElevated: "hsl(30, 12%, 14%)",
  border: "hsl(30, 10%, 20%)",
  card: "hsl(30, 12%, 12%)",
  primary: "hsl(32, 90%, 52%)",
  primaryAlpha20: "hsla(32, 90%, 52%, 0.2)",
  primaryAlpha30: "hsla(32, 90%, 52%, 0.3)",
  primaryAlpha50: "hsla(32, 90%, 52%, 0.5)",
  destructiveAlpha20: "hsla(0, 84%, 60%, 0.2)",
  destructiveAlpha30: "hsla(0, 84%, 60%, 0.3)",
  destructiveAlpha60: "hsla(0, 84%, 60%, 0.6)",
};

function hslToComma(raw: string): string {
  const parts = raw.trim().split(/\s+/);
  if (parts.length >= 3) {
    return `hsl(${parts[0]}, ${parts[1]}, ${parts[2]})`;
  }
  return raw;
}

function hslaToComma(raw: string, alpha: number): string {
  const parts = raw.trim().split(/\s+/);
  if (parts.length >= 3) {
    return `hsla(${parts[0]}, ${parts[1]}, ${parts[2]}, ${alpha})`;
  }
  return raw;
}

export function extractThemeColors(): ThemeColors {
  try {
    const style = getComputedStyle(document.documentElement);
    const get = (name: string, fallback: string) => {
      const raw = style.getPropertyValue(name).trim();
      if (!raw) return fallback;
      return hslToComma(raw);
    };
    const getAlpha = (name: string, alpha: number, fallback: string) => {
      const raw = style.getPropertyValue(name).trim();
      if (!raw) return fallback;
      return hslaToComma(raw, alpha);
    };

    return {
      canvasBg: get("--canvas-bg", FALLBACK_COLORS.canvasBg),
      canvasGrid: get("--canvas-grid", FALLBACK_COLORS.canvasGrid),
      surfaceElevated: get("--surface-elevated", FALLBACK_COLORS.surfaceElevated),
      border: get("--border", FALLBACK_COLORS.border),
      card: get("--card", FALLBACK_COLORS.card),
      primary: get("--primary", FALLBACK_COLORS.primary),
      primaryAlpha20: getAlpha("--primary", 0.2, FALLBACK_COLORS.primaryAlpha20),
      primaryAlpha30: getAlpha("--primary", 0.3, FALLBACK_COLORS.primaryAlpha30),
      primaryAlpha50: getAlpha("--primary", 0.5, FALLBACK_COLORS.primaryAlpha50),
      destructiveAlpha20: getAlpha("--destructive", 0.2, FALLBACK_COLORS.destructiveAlpha20),
      destructiveAlpha30: getAlpha("--destructive", 0.3, FALLBACK_COLORS.destructiveAlpha30),
      destructiveAlpha60: getAlpha("--destructive", 0.6, FALLBACK_COLORS.destructiveAlpha60),
    };
  } catch {
    return FALLBACK_COLORS;
  }
}

function getVisibleCellRange(
  camera: Camera,
  canvasWidth: number,
  canvasHeight: number,
  cellSize: number
) {
  const worldLeft = camera.x;
  const worldTop = camera.y;
  const worldRight = camera.x + canvasWidth / camera.zoom;
  const worldBottom = camera.y + canvasHeight / camera.zoom;

  return {
    minX: Math.floor(worldLeft / cellSize) - 1,
    maxX: Math.ceil(worldRight / cellSize) + 1,
    minY: Math.floor(worldTop / cellSize) - 1,
    maxY: Math.ceil(worldBottom / cellSize) + 1,
  };
}

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  canvasWidth: number,
  canvasHeight: number,
  cellSize: number,
  colors: ThemeColors
) {
  const { minX, maxX, minY, maxY } = getVisibleCellRange(
    camera,
    canvasWidth,
    canvasHeight,
    cellSize
  );

  // Draw cell backgrounds
  ctx.fillStyle = colors.surfaceElevated;
  for (let gx = minX; gx <= maxX; gx++) {
    for (let gy = minY; gy <= maxY; gy++) {
      const screen = worldToScreen(gx * cellSize, gy * cellSize, camera);
      const size = cellSize * camera.zoom;
      ctx.fillRect(screen.x, screen.y, size, size);
    }
  }

  // Draw grid lines
  ctx.strokeStyle = colors.canvasGrid;
  ctx.lineWidth = 1;

  // Vertical lines
  for (let gx = minX; gx <= maxX + 1; gx++) {
    const screen = worldToScreen(gx * cellSize, minY * cellSize, camera);
    const screenBottom = worldToScreen(
      gx * cellSize,
      (maxY + 1) * cellSize,
      camera
    );
    ctx.beginPath();
    ctx.moveTo(Math.round(screen.x) + 0.5, screen.y);
    ctx.lineTo(Math.round(screenBottom.x) + 0.5, screenBottom.y);
    ctx.stroke();
  }

  // Horizontal lines
  for (let gy = minY; gy <= maxY + 1; gy++) {
    const screen = worldToScreen(minX * cellSize, gy * cellSize, camera);
    const screenRight = worldToScreen(
      (maxX + 1) * cellSize,
      gy * cellSize,
      camera
    );
    ctx.beginPath();
    ctx.moveTo(screen.x, Math.round(screen.y) + 0.5);
    ctx.lineTo(screenRight.x, Math.round(screenRight.y) + 0.5);
    ctx.stroke();
  }
}

export function drawGroundTiles(
  ctx: CanvasRenderingContext2D,
  tiles: PlacedGroundTile[],
  camera: Camera,
  canvasWidth: number,
  canvasHeight: number,
  cellSize: number,
  getImage: (src: string) => HTMLImageElement | null
) {
  const { minX, maxX, minY, maxY } = getVisibleCellRange(
    camera,
    canvasWidth,
    canvasHeight,
    cellSize
  );

  for (const tile of tiles) {
    if (
      tile.gridX < minX ||
      tile.gridX > maxX ||
      tile.gridY < minY ||
      tile.gridY > maxY
    ) {
      continue;
    }

    const img = getImage(tile.tile.image);
    if (!img) continue;

    const screen = worldToScreen(
      tile.gridX * cellSize,
      tile.gridY * cellSize,
      camera
    );
    const size = cellSize * camera.zoom;
    ctx.drawImage(img, screen.x, screen.y, size, size);
  }
}

export function drawStructures(
  ctx: CanvasRenderingContext2D,
  structures: PlacedStructure[],
  camera: Camera,
  canvasWidth: number,
  canvasHeight: number,
  cellSize: number,
  getImage: (src: string) => HTMLImageElement | null,
  hoveredId: string | null,
  movingId: string | null,
  colors: ThemeColors
) {
  const { minX, maxX, minY, maxY } = getVisibleCellRange(
    camera,
    canvasWidth,
    canvasHeight,
    cellSize
  );

  for (const placed of structures) {
    if (placed.id === movingId) continue; // Skip structure being moved

    if (
      placed.gridX < minX ||
      placed.gridX > maxX ||
      placed.gridY < minY ||
      placed.gridY > maxY
    ) {
      continue;
    }

    const screen = worldToScreen(
      placed.gridX * cellSize,
      placed.gridY * cellSize,
      camera
    );
    const size = cellSize * camera.zoom;
    const padding = 2 * camera.zoom;
    const innerSize = size - padding * 2;

    // Background
    const isHovered = placed.id === hoveredId;
    if (placed.built) {
      ctx.fillStyle = colors.primaryAlpha20;
    } else {
      ctx.fillStyle = colors.card;
    }

    const radius = 8 * camera.zoom;
    roundRect(
      ctx,
      screen.x + padding,
      screen.y + padding,
      innerSize,
      innerSize,
      radius
    );
    ctx.fill();

    // Border
    if (placed.built) {
      ctx.strokeStyle = colors.primaryAlpha50;
    } else if (isHovered) {
      ctx.strokeStyle = colors.primary;
    } else {
      ctx.strokeStyle = colors.border;
    }
    ctx.lineWidth = 2 * camera.zoom;
    roundRect(
      ctx,
      screen.x + padding,
      screen.y + padding,
      innerSize,
      innerSize,
      radius
    );
    ctx.stroke();

    // Structure image
    const imgSrc = placed.structure.iconImage;
    if (imgSrc) {
      const img = getImage(imgSrc);
      if (img) {
        const imgSize = 80 * camera.zoom;
        const imgX = screen.x + (size - imgSize) / 2;
        const imgY = screen.y + (size - imgSize) / 2;
        ctx.drawImage(img, imgX, imgY, imgSize, imgSize);
      }
    } else {
      // Emoji fallback
      ctx.font = `${48 * camera.zoom}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(
        placed.structure.icon,
        screen.x + size / 2,
        screen.y + size / 2
      );
    }
  }
}

export function drawMovingStructure(
  ctx: CanvasRenderingContext2D,
  structure: PlacedStructure,
  screenX: number,
  screenY: number,
  cellSize: number,
  camera: Camera,
  getImage: (src: string) => HTMLImageElement | null,
  colors: ThemeColors
) {
  const size = cellSize * camera.zoom;
  const padding = 2 * camera.zoom;
  const innerSize = size - padding * 2;
  const x = screenX - size / 2;
  const y = screenY - size / 2;

  ctx.globalAlpha = 0.7;

  // Background
  ctx.fillStyle = colors.card;
  const radius = 8 * camera.zoom;
  roundRect(ctx, x + padding, y + padding, innerSize, innerSize, radius);
  ctx.fill();

  // Border
  ctx.strokeStyle = colors.primary;
  ctx.lineWidth = 2 * camera.zoom;
  roundRect(ctx, x + padding, y + padding, innerSize, innerSize, radius);
  ctx.stroke();

  // Image
  const imgSrc = structure.structure.iconImage;
  if (imgSrc) {
    const img = getImage(imgSrc);
    if (img) {
      const imgSize = 80 * camera.zoom;
      const imgX = x + (size - imgSize) / 2;
      const imgY = y + (size - imgSize) / 2;
      ctx.drawImage(img, imgX, imgY, imgSize, imgSize);
    }
  } else {
    ctx.font = `${48 * camera.zoom}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(structure.structure.icon, x + size / 2, y + size / 2);
  }

  ctx.globalAlpha = 1.0;
}

export function drawPaintOverlay(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  cellSize: number,
  startCell: { x: number; y: number },
  currentCell: { x: number; y: number },
  isErasing: boolean,
  colors: ThemeColors
) {
  const minX = Math.min(startCell.x, currentCell.x);
  const maxX = Math.max(startCell.x, currentCell.x);
  const minY = Math.min(startCell.y, currentCell.y);
  const maxY = Math.max(startCell.y, currentCell.y);

  const topLeft = worldToScreen(minX * cellSize, minY * cellSize, camera);
  const width = (maxX - minX + 1) * cellSize * camera.zoom;
  const height = (maxY - minY + 1) * cellSize * camera.zoom;

  ctx.fillStyle = isErasing ? colors.destructiveAlpha20 : colors.primaryAlpha30;
  ctx.fillRect(topLeft.x, topLeft.y, width, height);

  ctx.strokeStyle = isErasing
    ? colors.destructiveAlpha60
    : colors.primaryAlpha50;
  ctx.lineWidth = 2;
  ctx.setLineDash([]);
  ctx.strokeRect(topLeft.x, topLeft.y, width, height);
}

export function drawDragHighlight(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  cellSize: number,
  cell: { x: number; y: number },
  colors: ThemeColors
) {
  const screen = worldToScreen(
    cell.x * cellSize,
    cell.y * cellSize,
    camera
  );
  const size = cellSize * camera.zoom;

  ctx.fillStyle = colors.primaryAlpha20;
  ctx.fillRect(screen.x, screen.y, size, size);
}

export function drawHoverHighlight(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  cellSize: number,
  cell: { x: number; y: number },
  colors: ThemeColors
) {
  const screen = worldToScreen(
    cell.x * cellSize,
    cell.y * cellSize,
    camera
  );
  const size = cellSize * camera.zoom;

  ctx.fillStyle = colors.primaryAlpha20;
  ctx.fillRect(screen.x, screen.y, size, size);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}
