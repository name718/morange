import type { ImageMeta, ProcessResult, WatermarkConfig } from '@/types';
import {
  queryCanvas,
  loadCanvasImage,
  exportCanvas,
  getFileSize,
  getScaledSize,
  prepareCanvas
} from './canvas-helper';

type SizedCanvasImageSource = CanvasImageSource & {
  width: number;
  height: number;
};

/**
 * 添加水印
 */
export async function addWatermark(
  canvasId: string,
  image: ImageMeta,
  config: WatermarkConfig,
  quality: number = 0.92
): Promise<ProcessResult> {
  const canvas = await queryCanvas(canvasId);
  const img = await loadCanvasImage(canvas, image.path);

  const { width, height } = getScaledSize(image.width, image.height);
  const ctx = prepareCanvas(canvas, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  // 添加水印
  if (config.type === 'text') {
    drawTextWatermark(ctx, width, height, config);
  } else if (config.type === 'image' && config.imagePath) {
    const watermarkImg = (await loadCanvasImage(canvas, config.imagePath)) as SizedCanvasImageSource;
    drawImageWatermark(ctx, width, height, watermarkImg, config);
  } else if (config.type === 'tile') {
    drawTileWatermark(ctx, width, height, config);
  }

  const path = await exportCanvas(canvas, width, height, quality, 'jpg');
  const size = await getFileSize(path);

  return { path, width, height, size };
}

/**
 * 绘制文字水印
 */
function drawTextWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: WatermarkConfig
) {
  const text = config.text || '沐橙图片';
  const fontSize = config.fontSize || 48;
  const color = config.color || '#ffffff';
  const opacity = config.opacity ?? 0.5;
  const position = config.position || 'bottom-right';

  ctx.font = `${fontSize}px sans-serif`;
  ctx.fillStyle = color;
  ctx.globalAlpha = opacity;
  ctx.textBaseline = 'top';

  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;
  const textHeight = fontSize;

  const padding = 20;
  const { x, y } = getWatermarkPosition(width, height, textWidth, textHeight, position, padding);

  ctx.fillText(text, x, y);
  ctx.globalAlpha = 1;
}

/**
 * 绘制图片水印
 */
function drawImageWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  watermarkImg: SizedCanvasImageSource,
  config: WatermarkConfig
) {
  const scale = Math.min(0.8, Math.max(0.05, config.imageScale || 0.2));
  const opacity = config.opacity ?? 0.5;
  const position = config.position || 'bottom-right';

  const maxWidth = width * scale;
  const maxHeight = height * 0.8;
  const sizeScale = Math.min(maxWidth / watermarkImg.width, maxHeight / watermarkImg.height);
  const imgWidth = watermarkImg.width * sizeScale;
  const imgHeight = watermarkImg.height * sizeScale;

  const padding = 20;
  const { x, y } = getWatermarkPosition(width, height, imgWidth, imgHeight, position, padding);

  ctx.globalAlpha = opacity;
  ctx.drawImage(watermarkImg, x, y, imgWidth, imgHeight);
  ctx.globalAlpha = 1;
}

/**
 * 绘制平铺水印
 */
function drawTileWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: WatermarkConfig
) {
  const text = config.text || '沐橙图片';
  const fontSize = config.fontSize || 32;
  const color = config.color || '#000000';
  const opacity = config.opacity ?? 0.1;
  const spacing = config.tileSpacing || 100;
  const rotation = config.tileRotation ?? -30;

  ctx.font = `${fontSize}px sans-serif`;
  ctx.fillStyle = color;
  ctx.globalAlpha = opacity;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';

  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;

  // 计算平铺数量
  const cols = Math.ceil(width / (textWidth + spacing)) + 2;
  const rows = Math.ceil(height / (fontSize + spacing)) + 2;

  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-width / 2, -height / 2);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * (textWidth + spacing) - textWidth;
      const y = row * (fontSize + spacing);
      ctx.fillText(text, x, y);
    }
  }

  ctx.restore();
  ctx.globalAlpha = 1;
}

/**
 * 计算水印位置
 */
function getWatermarkPosition(
  canvasWidth: number,
  canvasHeight: number,
  watermarkWidth: number,
  watermarkHeight: number,
  position: string,
  padding: number
): { x: number; y: number } {
  let x = padding;
  let y = padding;

  switch (position) {
    case 'top-left':
      x = padding;
      y = padding;
      break;
    case 'top-center':
      x = (canvasWidth - watermarkWidth) / 2;
      y = padding;
      break;
    case 'top-right':
      x = canvasWidth - watermarkWidth - padding;
      y = padding;
      break;
    case 'center-left':
      x = padding;
      y = (canvasHeight - watermarkHeight) / 2;
      break;
    case 'center':
      x = (canvasWidth - watermarkWidth) / 2;
      y = (canvasHeight - watermarkHeight) / 2;
      break;
    case 'center-right':
      x = canvasWidth - watermarkWidth - padding;
      y = (canvasHeight - watermarkHeight) / 2;
      break;
    case 'bottom-left':
      x = padding;
      y = canvasHeight - watermarkHeight - padding;
      break;
    case 'bottom-center':
      x = (canvasWidth - watermarkWidth) / 2;
      y = canvasHeight - watermarkHeight - padding;
      break;
    case 'bottom-right':
      x = canvasWidth - watermarkWidth - padding;
      y = canvasHeight - watermarkHeight - padding;
      break;
  }

  return {
    x: Math.min(Math.max(padding, x), Math.max(padding, canvasWidth - watermarkWidth - padding)),
    y: Math.min(Math.max(padding, y), Math.max(padding, canvasHeight - watermarkHeight - padding))
  };
}
