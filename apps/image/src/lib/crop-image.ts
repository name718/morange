import type { ImageMeta, ProcessResult } from '@/types';
import {
  exportCanvas,
  getFileSize,
  getScaledSize,
  loadCanvasImage,
  prepareCanvas,
  queryCanvas
} from './canvas-helper';

export interface CropPreset {
  id: string;
  label: string;
  width: number;
  height: number;
  note: string;
}

export const CROP_PRESETS: CropPreset[] = [
  { id: 'square', label: '头像方图', width: 800, height: 800, note: '1:1 社交头像' },
  { id: 'one-inch', label: '一寸照', width: 295, height: 413, note: '常见报名资料' },
  { id: 'two-inch', label: '二寸照', width: 413, height: 579, note: '证件照常用' },
  { id: 'exam', label: '考试报名', width: 480, height: 640, note: '线上报名通用' },
  { id: 'cover', label: '横版封面', width: 1280, height: 720, note: '16:9 封面图' },
  { id: 'story', label: '竖版海报', width: 1080, height: 1920, note: '9:16 竖屏' }
];

export async function cropToPreset(
  canvasId: string,
  image: ImageMeta,
  preset: CropPreset,
  quality: number = 0.92
): Promise<ProcessResult> {
  const canvas = await queryCanvas(canvasId);
  const img = await loadCanvasImage(canvas, image.path);

  const output = getScaledSize(preset.width, preset.height);
  const ctx = prepareCanvas(canvas, output.width, output.height);

  const sourceRatio = image.width / image.height;
  const targetRatio = preset.width / preset.height;
  let sx = 0;
  let sy = 0;
  let sw = image.width;
  let sh = image.height;

  if (sourceRatio > targetRatio) {
    sw = image.height * targetRatio;
    sx = (image.width - sw) / 2;
  } else {
    sh = image.width / targetRatio;
    sy = (image.height - sh) / 2;
  }

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, output.width, output.height);
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, output.width, output.height);

  const path = await exportCanvas(canvas, output.width, output.height, quality, 'jpg');
  const size = await getFileSize(path);
  return { path, width: output.width, height: output.height, size };
}
