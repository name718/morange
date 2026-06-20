import type { ImageMeta, ProcessResult } from '@/types';
import {
  exportCanvas,
  getFileSize,
  getScaledSize,
  loadCanvasImage,
  prepareCanvas,
  queryCanvas
} from './canvas-helper';

export interface FrameConfig {
  padding: number;
  radius: number;
  backgroundColor: string;
  shadow: boolean;
}

export async function addFrame(
  canvasId: string,
  image: ImageMeta,
  config: FrameConfig,
  quality: number = 0.92
): Promise<ProcessResult> {
  const canvas = await queryCanvas(canvasId);
  const img = await loadCanvasImage(canvas, image.path);

  const padding = Math.max(0, Math.floor(config.padding));
  const rawWidth = image.width + padding * 2;
  const rawHeight = image.height + padding * 2;
  const output = getScaledSize(rawWidth, rawHeight);
  const outputScale = Math.min(output.width / rawWidth, output.height / rawHeight);
  const scaledPadding = Math.floor(padding * outputScale);
  const scaledRadius = Math.floor(config.radius * outputScale);
  const availableWidth = Math.max(1, output.width - scaledPadding * 2);
  const availableHeight = Math.max(1, output.height - scaledPadding * 2);
  const scale = Math.min(
    availableWidth / image.width,
    availableHeight / image.height,
    1
  );
  const drawWidth = Math.max(1, Math.floor(image.width * scale));
  const drawHeight = Math.max(1, Math.floor(image.height * scale));
  const x = Math.floor((output.width - drawWidth) / 2);
  const y = Math.floor((output.height - drawHeight) / 2);

  const ctx = prepareCanvas(canvas, output.width, output.height);
  ctx.fillStyle = config.backgroundColor;
  ctx.fillRect(0, 0, output.width, output.height);

  if (config.shadow) {
    ctx.shadowColor = 'rgba(36, 24, 16, 0.22)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 14;
  }

  drawRoundedImage(ctx, img, x, y, drawWidth, drawHeight, scaledRadius);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  const path = await exportCanvas(canvas, output.width, output.height, quality, 'jpg');
  const size = await getFileSize(path);
  return { path, width: output.width, height: output.height, size };
}

function drawRoundedImage(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const r = Math.min(Math.max(0, radius), width / 2, height / 2);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(img, x, y, width, height);
  ctx.restore();
}
