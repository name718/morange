import type { ImageMeta, ProcessResult, ImageFormat } from '@/types';
import {
  queryCanvas,
  loadCanvasImage,
  exportCanvas,
  getFileSize,
  getScaledSize,
  prepareCanvas
} from './canvas-helper';

/**
 * 图片压缩
 */
export async function compressImage(
  canvasId: string,
  image: ImageMeta,
  quality: number,
  targetSizeKB?: number
): Promise<ProcessResult> {
  const canvas = await queryCanvas(canvasId);
  const img = await loadCanvasImage(canvas, image.path);

  const { width, height } = getScaledSize(image.width, image.height);
  const ctx = prepareCanvas(canvas, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  let resultPath = await exportCanvas(canvas, width, height, quality, 'jpg');
  let resultSize = await getFileSize(resultPath);

  if (targetSizeKB && targetSizeKB > 0) {
    // 二分查找最优质量
    let low = 0.1;
    let high = Math.max(0.3, quality);
    const maxBytes = targetSizeKB * 1024;
    let smallestPath = resultPath;
    let smallestSize = resultSize;

    for (let i = 0; i < 8; i++) {
      const mid = Number(((low + high) / 2).toFixed(2));
      const path = await exportCanvas(canvas, width, height, mid, 'jpg');
      const size = await getFileSize(path);

      if (size < smallestSize) {
        smallestPath = path;
        smallestSize = size;
      }

      if (size <= maxBytes) {
        resultPath = path;
        resultSize = size;
        low = mid;
      } else {
        high = mid;
      }
    }

    if (resultSize > maxBytes) {
      resultPath = smallestPath;
      resultSize = smallestSize;
    }
  }

  return {
    path: resultPath,
    width,
    height,
    size: resultSize
  };
}

/**
 * 尺寸修改
 */
export async function resizeImage(
  canvasId: string,
  image: ImageMeta,
  targetWidth: number,
  targetHeight: number,
  quality: number = 0.92
): Promise<ProcessResult> {
  const canvas = await queryCanvas(canvasId);
  const img = await loadCanvasImage(canvas, image.path);

  const { width, height } = getScaledSize(targetWidth, targetHeight);
  const ctx = prepareCanvas(canvas, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  const path = await exportCanvas(canvas, width, height, quality, 'jpg');
  const size = await getFileSize(path);

  return { path, width, height, size };
}

/**
 * 格式转换
 */
export async function convertFormat(
  canvasId: string,
  image: ImageMeta,
  format: ImageFormat,
  quality: number = 0.92
): Promise<ProcessResult> {
  const canvas = await queryCanvas(canvasId);
  const img = await loadCanvasImage(canvas, image.path);

  const { width, height } = getScaledSize(image.width, image.height);
  const ctx = prepareCanvas(canvas, width, height);

  // PNG 需要透明背景
  if (format !== 'png') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
  }

  ctx.drawImage(img, 0, 0, width, height);

  const path = await exportCanvas(canvas, width, height, quality, format);
  const size = await getFileSize(path);

  return { path, width, height, size };
}
