export interface RatioOption {
  id: string;
  name: string;
  ratio: number | null;
}

export interface QualityOption {
  id: string;
  name: string;
  quality: number;
  description: string;
}

export interface TargetSizeOption {
  id: string;
  name: string;
  maxKb: number | null;
}

export interface IdPhotoPreset {
  id: string;
  name: string;
  size: string;
  width: number;
  height: number;
  note: string;
}

export interface ImageMeta {
  path: string;
  width: number;
  height: number;
  size: number;
  type?: string;
}

export interface ProcessOptions {
  ratio: number | null;
  quality: number;
  maxKb: number | null;
  maxEdge: number;
  outputWidth?: number;
  outputHeight?: number;
}

export interface CropRect {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  dw: number;
  dh: number;
}

export const RATIO_OPTIONS: RatioOption[] = [
  { id: 'origin', name: '原比例', ratio: null },
  { id: 'square', name: '1:1', ratio: 1 },
  { id: 'portrait', name: '3:4', ratio: 3 / 4 },
  { id: 'landscape', name: '4:3', ratio: 4 / 3 },
  { id: 'wide', name: '16:9', ratio: 16 / 9 },
  { id: 'story', name: '9:16', ratio: 9 / 16 }
];

export const QUALITY_OPTIONS: QualityOption[] = [
  { id: 'clear', name: '清晰', quality: 0.88, description: '适合头像、证件、重要图片' },
  { id: 'standard', name: '标准', quality: 0.72, description: '体积和清晰度平衡' },
  { id: 'small', name: '极小', quality: 0.52, description: '优先减小文件体积' }
];

export const TARGET_SIZE_OPTIONS: TargetSizeOption[] = [
  { id: 'none', name: '不限制', maxKb: null },
  { id: '200', name: '200KB', maxKb: 200 },
  { id: '500', name: '500KB', maxKb: 500 },
  { id: '1024', name: '1MB', maxKb: 1024 }
];

export const ID_PHOTO_PRESETS: IdPhotoPreset[] = [
  {
    id: 'one-inch',
    name: '一寸',
    size: '295×413',
    width: 295,
    height: 413,
    note: '常见报名、档案'
  },
  { id: 'two-inch', name: '二寸', size: '413×579', width: 413, height: 579, note: '常见证件照' },
  {
    id: 'small-one-inch',
    name: '小一寸',
    size: '260×378',
    width: 260,
    height: 378,
    note: '考试报名常用'
  },
  {
    id: 'small-two-inch',
    name: '小二寸',
    size: '413×531',
    width: 413,
    height: 531,
    note: '签证/表格常见'
  },
  { id: 'exam', name: '考试报名', size: '480×640', width: 480, height: 640, note: '通用线上报名' },
  {
    id: 'social',
    name: '社保回执',
    size: '358×441',
    width: 358,
    height: 441,
    note: '社保/资料上传'
  },
  {
    id: 'avatar',
    name: '头像方图',
    size: '600×600',
    width: 600,
    height: 600,
    note: '头像、账号资料'
  },
  {
    id: 'custom-doc',
    name: '文档上传',
    size: '800×800',
    width: 800,
    height: 800,
    note: '表单附件常用'
  }
];

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '--';
  }
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))}KB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(2)}MB`;
}

export function formatDimension(width: number, height: number): string {
  return `${Math.round(width)}×${Math.round(height)}`;
}

export function createCropRect(
  width: number,
  height: number,
  ratio: number | null,
  maxEdge: number,
  outputWidth?: number,
  outputHeight?: number
): CropRect {
  const sourceRatio = width / height;
  const targetRatio =
    outputWidth && outputHeight ? outputWidth / outputHeight : ratio || sourceRatio;
  let sw = width;
  let sh = height;

  if (sourceRatio > targetRatio) {
    sw = height * targetRatio;
  } else {
    sh = width / targetRatio;
  }

  const scale = Math.min(1, maxEdge / Math.max(sw, sh));
  const dw = outputWidth || Math.max(1, Math.round(sw * scale));
  const dh = outputHeight || Math.max(1, Math.round(sh * scale));

  return {
    sx: Math.max(0, Math.round((width - sw) / 2)),
    sy: Math.max(0, Math.round((height - sh) / 2)),
    sw: Math.round(sw),
    sh: Math.round(sh),
    dw,
    dh
  };
}

export function compressionRate(originalSize: number, outputSize: number): string {
  if (!originalSize || !outputSize || outputSize >= originalSize) {
    return '0%';
  }
  return `${Math.round((1 - outputSize / originalSize) * 100)}%`;
}
