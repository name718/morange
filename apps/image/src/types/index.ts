// 图片元数据
export interface ImageMeta {
  path: string;
  width: number;
  height: number;
  size: number;
  type?: string;
}

// 处理结果
export interface ProcessResult {
  path: string;
  width: number;
  height: number;
  size: number;
}

// 水印配置
export interface WatermarkConfig {
  type: 'text' | 'image' | 'tile';
  // 文字水印
  text?: string;
  fontSize?: number;
  color?: string;
  opacity?: number;
  // 图片水印
  imagePath?: string;
  imageScale?: number;
  // 位置
  position?: 'top-left' | 'top-center' | 'top-right' | 'center-left' | 'center' | 'center-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  // 平铺水印
  tileSpacing?: number;
  tileRotation?: number;
}

// 拼接配置
export interface MergeConfig {
  direction: 'horizontal' | 'vertical';
  spacing: number;
  maxWidth?: number;
}

// 裁切配置
export interface SplitConfig {
  rows: number;
  cols: number;
}

// 格式类型
export type ImageFormat = 'jpg' | 'png';
