import type { ImageMeta, ProcessResult, SplitConfig } from '@/types';
import {
  queryCanvas,
  loadCanvasImage,
  exportCanvas,
  getFileSize,
  prepareCanvas
} from './canvas-helper';

/**
 * 9宫格切图
 */
export async function splitImage(
  canvasId: string,
  image: ImageMeta,
  config: SplitConfig,
  quality: number = 0.92
): Promise<ProcessResult[]> {
  const canvas = await queryCanvas(canvasId);
  const img = await loadCanvasImage(canvas, image.path);

  const { rows, cols } = config;
  if (!Number.isInteger(rows) || !Number.isInteger(cols) || rows <= 0 || cols <= 0) {
    throw new Error('Invalid split grid');
  }

  const results: ProcessResult[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const sx = Math.floor((image.width * col) / cols);
      const sy = Math.floor((image.height * row) / rows);
      const nextX = Math.floor((image.width * (col + 1)) / cols);
      const nextY = Math.floor((image.height * (row + 1)) / rows);
      const pieceWidth = Math.max(1, nextX - sx);
      const pieceHeight = Math.max(1, nextY - sy);

      const ctx = prepareCanvas(canvas, pieceWidth, pieceHeight);
      ctx.drawImage(
        img,
        sx,
        sy,
        pieceWidth,
        pieceHeight,
        0,
        0,
        pieceWidth,
        pieceHeight
      );

      const path = await exportCanvas(canvas, pieceWidth, pieceHeight, quality, 'jpg');
      const size = await getFileSize(path);

      results.push({
        path,
        width: pieceWidth,
        height: pieceHeight,
        size
      });
    }
  }

  return results;
}
