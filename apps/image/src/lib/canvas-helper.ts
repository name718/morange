import Taro from '@tarojs/taro';
import type { ImageFormat } from '@/types';

export const MAX_CANVAS_SIZE = 4096;

/**
 * 查询 Canvas 节点
 */
export async function queryCanvas(canvasId: string): Promise<Taro.Canvas> {
  return new Promise((resolve, reject) => {
    Taro.createSelectorQuery()
      .select(`#${canvasId}`)
      .fields({ node: true, size: true })
      .exec((res) => {
        const canvas = res?.[0]?.node as Taro.Canvas | undefined;
        if (!canvas) {
          reject(new Error('Canvas not ready'));
          return;
        }
        resolve(canvas);
      });
  });
}

/**
 * 加载图片到 Canvas
 */
export async function loadCanvasImage(
  canvas: Taro.Canvas,
  path: string
): Promise<CanvasImageSource> {
  return new Promise((resolve, reject) => {
    const image = canvas.createImage();
    image.onload = () => resolve(image as unknown as CanvasImageSource);
    image.onerror = (err) => reject(err);
    image.src = path;
  });
}

/**
 * 设置 Canvas 尺寸并返回最新 2D 上下文。
 * 变更 width/height 会重置绘图状态，调用方必须使用返回的新 ctx。
 */
export function prepareCanvas(
  canvas: Taro.Canvas,
  width: number,
  height: number
): CanvasRenderingContext2D {
  const safeWidth = Math.max(1, Math.floor(width));
  const safeHeight = Math.max(1, Math.floor(height));

  canvas.width = safeWidth;
  canvas.height = safeHeight;

  const ctx = getContext2D(canvas);
  ctx.clearRect(0, 0, safeWidth, safeHeight);
  return ctx;
}

/**
 * 导出 Canvas 为临时文件
 */
export async function exportCanvas(
  canvas: Taro.Canvas,
  width: number,
  height: number,
  quality: number = 0.92,
  format: ImageFormat = 'jpg'
): Promise<string> {
  if (!checkSizeLimit(width, height)) {
    throw new Error(`Canvas size exceeds limit: ${width}x${height}`);
  }

  return new Promise((resolve, reject) => {
    Taro.canvasToTempFilePath({
      canvas,
      x: 0,
      y: 0,
      width,
      height,
      destWidth: width,
      destHeight: height,
      fileType: format,
      quality: clampQuality(quality),
      success: (res) => resolve(res.tempFilePath),
      fail: reject
    });
  });
}

/**
 * 获取文件大小
 */
export async function getFileSize(path: string): Promise<number> {
  return new Promise((resolve, reject) => {
    Taro.getFileInfo({
      filePath: path,
      success: (res) => resolve(res.size),
      fail: reject
    });
  });
}

/**
 * 获取图片信息
 */
export async function getImageInfo(path: string): Promise<Taro.getImageInfo.SuccessCallbackResult> {
  return new Promise((resolve, reject) => {
    Taro.getImageInfo({
      src: path,
      success: resolve,
      fail: reject
    });
  });
}

/**
 * 创建 Canvas 上下文
 */
export function getContext2D(canvas: Taro.Canvas): CanvasRenderingContext2D {
  return canvas.getContext('2d') as CanvasRenderingContext2D;
}

/**
 * 清空 Canvas
 */
export function clearCanvas(canvas: Taro.Canvas, ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

/**
 * 检查尺寸是否超限
 */
export function checkSizeLimit(width: number, height: number): boolean {
  return width <= MAX_CANVAS_SIZE && height <= MAX_CANVAS_SIZE;
}

/**
 * 自动降采样超大图片
 */
export function getScaledSize(width: number, height: number): { width: number; height: number } {
  if (width <= MAX_CANVAS_SIZE && height <= MAX_CANVAS_SIZE) {
    return { width, height };
  }

  const scale = Math.min(MAX_CANVAS_SIZE / width, MAX_CANVAS_SIZE / height);
  return {
    width: Math.max(1, Math.floor(width * scale)),
    height: Math.max(1, Math.floor(height * scale))
  };
}

export function clampQuality(quality: number): number {
  if (!Number.isFinite(quality)) {
    return 0.92;
  }

  return Math.min(1, Math.max(0.1, quality));
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '--';
  }
  if (bytes < 1024) {
    return `${bytes}B`;
  }
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)}KB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(2)}MB`;
}

/**
 * 格式化尺寸
 */
export function formatDimension(width: number, height: number): string {
  return `${Math.round(width)} × ${Math.round(height)}`;
}

/**
 * 保存图片到相册
 */
export async function saveToAlbum(
  filePath: string,
  options: { showSuccessToast?: boolean; showFailToast?: boolean } = {}
): Promise<void> {
  const { showSuccessToast = true, showFailToast = true } = options;

  return new Promise((resolve, reject) => {
    Taro.saveImageToPhotosAlbum({
      filePath,
      success: () => {
        if (showSuccessToast) {
          Taro.showToast({ title: '已保存到相册', icon: 'success' });
        }
        resolve();
      },
      fail: (err) => {
        if (!showFailToast) {
          reject(err);
          return;
        }

        if (err.errMsg?.includes('auth')) {
          Taro.showModal({
            title: '保存失败',
            content: '请确认已允许保存到相册。是否打开设置检查权限？',
            confirmText: '打开设置',
            success: (res) => {
              if (res.confirm) {
                Taro.openSetting();
              }
            }
          });
        } else {
          Taro.showToast({ title: '保存失败', icon: 'none' });
        }
        reject(err);
      }
    });
  });
}

export async function saveManyToAlbum(filePaths: string[]): Promise<void> {
  if (filePaths.length === 0) {
    return;
  }

  Taro.showLoading({ title: `保存 1/${filePaths.length}`, mask: true });

  try {
    for (let i = 0; i < filePaths.length; i++) {
      if (i > 0) {
        Taro.showLoading({ title: `保存 ${i + 1}/${filePaths.length}`, mask: true });
      }
      await saveToAlbum(filePaths[i], { showSuccessToast: false, showFailToast: false });
    }
    Taro.hideLoading();
    Taro.showToast({ title: `已保存 ${filePaths.length} 张`, icon: 'success' });
  } catch (err) {
    Taro.hideLoading();
    const errMsg = err instanceof Error ? err.message : String(err);
    if (errMsg.includes('auth')) {
      Taro.showModal({
        title: '保存失败',
        content: '请确认已允许保存到相册。是否打开设置检查权限？',
        confirmText: '打开设置',
        success: (res) => {
          if (res.confirm) {
            Taro.openSetting();
          }
        }
      });
    } else {
      Taro.showToast({ title: '保存失败', icon: 'none' });
    }
    throw err;
  }
}
