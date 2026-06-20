import type { ImageMeta, ProcessResult, MergeConfig } from '@/types';
import {
  queryCanvas,
  loadCanvasImage,
  exportCanvas,
  getFileSize,
  prepareCanvas,
  getScaledSize,
  MAX_CANVAS_SIZE
} from './canvas-helper';

/**
 * 长图拼接
 */
export async function mergeImages(
  canvasId: string,
  images: ImageMeta[],
  config: MergeConfig,
  quality: number = 0.92
): Promise<ProcessResult> {
  if (images.length === 0) {
    throw new Error('No images to merge');
  }

  const canvas = await queryCanvas(canvasId);

  // 加载所有图片
  const loadedImages = await Promise.all(
    images.map((img) => loadCanvasImage(canvas, img.path))
  );

  const { direction, maxWidth = MAX_CANVAS_SIZE } = config;
  const spacing = Math.max(0, Math.floor(config.spacing || 0));

  let totalWidth = 0;
  let totalHeight = 0;
  let maxImageWidth = 0;
  let maxImageHeight = 0;

  // 计算缩放后的尺寸
  const scaledSizes = images.map((img) => {
    let width = img.width;
    let height = img.height;

    if (direction === 'vertical' && width > maxWidth) {
      const scale = maxWidth / width;
      width = maxWidth;
      height = Math.floor(height * scale);
    } else if (direction === 'horizontal' && height > maxWidth) {
      const scale = maxWidth / height;
      height = maxWidth;
      width = Math.floor(width * scale);
    }

    maxImageWidth = Math.max(maxImageWidth, width);
    maxImageHeight = Math.max(maxImageHeight, height);

    return { width, height };
  });

  // 计算总尺寸
  if (direction === 'horizontal') {
    totalWidth = scaledSizes.reduce((sum, size) => sum + size.width, 0) + spacing * (images.length - 1);
    totalHeight = maxImageHeight;
  } else {
    totalWidth = maxImageWidth;
    totalHeight = scaledSizes.reduce((sum, size) => sum + size.height, 0) + spacing * (images.length - 1);
  }

  const limitedSize = getScaledSize(totalWidth, totalHeight);
  const finalScale = Math.min(limitedSize.width / totalWidth, limitedSize.height / totalHeight);
  const outputWidth = limitedSize.width;
  const outputHeight = limitedSize.height;

  const ctx = prepareCanvas(canvas, outputWidth, outputHeight);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, outputWidth, outputHeight);

  // 绘制图片
  let offsetX = 0;
  let offsetY = 0;

  for (let i = 0; i < loadedImages.length; i++) {
    const img = loadedImages[i];
    const { width, height } = scaledSizes[i];

    if (direction === 'horizontal') {
      // 垂直居中
      const y = Math.floor((totalHeight - height) / 2);
      ctx.drawImage(
        img,
        Math.round(offsetX * finalScale),
        Math.round(y * finalScale),
        Math.round(width * finalScale),
        Math.round(height * finalScale)
      );
      offsetX += width + spacing;
    } else {
      // 水平居中
      const x = Math.floor((totalWidth - width) / 2);
      ctx.drawImage(
        img,
        Math.round(x * finalScale),
        Math.round(offsetY * finalScale),
        Math.round(width * finalScale),
        Math.round(height * finalScale)
      );
      offsetY += height + spacing;
    }
  }

  const path = await exportCanvas(canvas, outputWidth, outputHeight, quality, 'jpg');
  const size = await getFileSize(path);

  return {
    path,
    width: outputWidth,
    height: outputHeight,
    size
  };
}

/**
 * 宫格拼图模板。图片会按格子居中裁切填充，适合社交拼图。
 */
export async function collageImages(
  canvasId: string,
  images: ImageMeta[],
  spacing: number = 12,
  quality: number = 0.92
): Promise<ProcessResult> {
  if (images.length === 0) {
    throw new Error('No images to collage');
  }

  const canvas = await queryCanvas(canvasId);
  const loadedImages = await Promise.all(images.map((img) => loadCanvasImage(canvas, img.path)));
  const cols = images.length <= 2 ? images.length : images.length <= 4 ? 2 : 3;
  const rows = Math.ceil(images.length / cols);
  const safeSpacing = Math.min(96, Math.max(0, Math.floor(spacing)));
  const cellSize = Math.max(1, Math.floor((MAX_CANVAS_SIZE - safeSpacing * (cols - 1)) / cols));
  const width = cellSize * cols + safeSpacing * (cols - 1);
  const height = cellSize * rows + safeSpacing * (rows - 1);
  const ctx = prepareCanvas(canvas, width, height);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < loadedImages.length; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const x = col * (cellSize + safeSpacing);
    const y = row * (cellSize + safeSpacing);
    const source = getCoverSourceRect(images[i].width, images[i].height, 1);

    ctx.drawImage(
      loadedImages[i],
      source.x,
      source.y,
      source.width,
      source.height,
      x,
      y,
      cellSize,
      cellSize
    );
  }

  const path = await exportCanvas(canvas, width, height, quality, 'jpg');
  const size = await getFileSize(path);
  return { path, width, height, size };
}

function getCoverSourceRect(
  width: number,
  height: number,
  targetRatio: number
): { x: number; y: number; width: number; height: number } {
  const sourceRatio = width / height;
  let sourceWidth = width;
  let sourceHeight = height;
  let x = 0;
  let y = 0;

  if (sourceRatio > targetRatio) {
    sourceWidth = height * targetRatio;
    x = (width - sourceWidth) / 2;
  } else {
    sourceHeight = width / targetRatio;
    y = (height - sourceHeight) / 2;
  }

  return { x, y, width: sourceWidth, height: sourceHeight };
}
