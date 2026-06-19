import { Button, Canvas, Image, ScrollView, Slider, Text, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useMemo, useState } from 'react';
import { BRAND } from '@morange/constants';
import {
  compressionRate,
  createCropRect,
  formatDimension,
  formatFileSize,
  ID_PHOTO_PRESETS,
  ImageMeta,
  ProcessOptions,
  QUALITY_OPTIONS,
  RATIO_OPTIONS,
  TARGET_SIZE_OPTIONS
} from '@/lib/image-tools';
import './index.scss';

const CANVAS_ID = 'imageProcessor';
const MAX_EDGE_OPTIONS = [800, 1080, 1440, 2160, 3000];
type WorkMode = 'general' | 'id-photo';

interface OutputMeta {
  path: string;
  size: number;
  width: number;
  height: number;
}

function getFileSize(path: string): Promise<number> {
  return new Promise((resolve, reject) => {
    Taro.getFileInfo({
      filePath: path,
      success: (res) => resolve(res.size),
      fail: reject
    });
  });
}

function queryCanvas(): Promise<Taro.Canvas> {
  return new Promise((resolve, reject) => {
    Taro.createSelectorQuery()
      .select(`#${CANVAS_ID}`)
      .fields({ node: true, size: true })
      .exec((res) => {
        const canvas = res?.[0]?.node as Taro.Canvas | undefined;
        if (!canvas) {
          reject(new Error('canvas not ready'));
          return;
        }
        resolve(canvas);
      });
  });
}

function loadCanvasImage(canvas: Taro.Canvas, path: string): Promise<CanvasImageSource> {
  return new Promise((resolve, reject) => {
    const image = canvas.createImage();
    image.onload = () => resolve(image as unknown as CanvasImageSource);
    image.onerror = reject;
    image.src = path;
  });
}

function exportCanvas(
  canvas: Taro.Canvas,
  width: number,
  height: number,
  quality: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    Taro.canvasToTempFilePath({
      canvas,
      width,
      height,
      destWidth: width,
      destHeight: height,
      fileType: 'jpg',
      quality,
      success: (res) => resolve(res.tempFilePath),
      fail: reject
    });
  });
}

async function renderImage(meta: ImageMeta, options: ProcessOptions): Promise<OutputMeta> {
  const canvas = await queryCanvas();
  const image = await loadCanvasImage(canvas, meta.path);
  const crop = createCropRect(
    meta.width,
    meta.height,
    options.ratio,
    options.maxEdge,
    options.outputWidth,
    options.outputHeight
  );
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

  canvas.width = crop.dw;
  canvas.height = crop.dh;
  ctx.clearRect(0, 0, crop.dw, crop.dh);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, crop.dw, crop.dh);
  ctx.drawImage(image, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, crop.dw, crop.dh);

  let low = 0.3;
  let high = options.quality;
  let bestPath = await exportCanvas(canvas, crop.dw, crop.dh, high);
  let bestSize = await getFileSize(bestPath);

  if (options.maxKb) {
    const maxBytes = options.maxKb * 1024;
    for (let index = 0; index < 7; index += 1) {
      const mid = Number(((low + high) / 2).toFixed(2));
      const path = await exportCanvas(canvas, crop.dw, crop.dh, mid);
      const size = await getFileSize(path);

      if (size <= maxBytes) {
        bestPath = path;
        bestSize = size;
        low = mid;
      } else {
        high = mid;
      }
    }
  }

  return {
    path: bestPath,
    size: bestSize,
    width: crop.dw,
    height: crop.dh
  };
}

export default function IndexPage() {
  const [sourceImage, setSourceImage] = useState<ImageMeta | null>(null);
  const [outputImage, setOutputImage] = useState<OutputMeta | null>(null);
  const [workMode, setWorkMode] = useState<WorkMode>('general');
  const [ratioId, setRatioId] = useState('origin');
  const [idPhotoId, setIdPhotoId] = useState('one-inch');
  const [qualityId, setQualityId] = useState('standard');
  const [targetSizeId, setTargetSizeId] = useState('500');
  const [maxEdgeIndex, setMaxEdgeIndex] = useState(1);
  const [processing, setProcessing] = useState(false);

  const ratio = useMemo(
    () => RATIO_OPTIONS.find((item) => item.id === ratioId) || RATIO_OPTIONS[0],
    [ratioId]
  );
  const idPhotoPreset = useMemo(
    () => ID_PHOTO_PRESETS.find((item) => item.id === idPhotoId) || ID_PHOTO_PRESETS[0],
    [idPhotoId]
  );
  const quality = useMemo(
    () => QUALITY_OPTIONS.find((item) => item.id === qualityId) || QUALITY_OPTIONS[1],
    [qualityId]
  );
  const targetSize = useMemo(
    () => TARGET_SIZE_OPTIONS.find((item) => item.id === targetSizeId) || TARGET_SIZE_OPTIONS[0],
    [targetSizeId]
  );
  const maxEdge = MAX_EDGE_OPTIONS[maxEdgeIndex];
  const targetReached =
    outputImage && targetSize.maxKb ? outputImage.size <= targetSize.maxKb * 1024 : true;

  const chooseImage = () => {
    Taro.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const file = res.tempFiles[0];
        if (!file?.tempFilePath) {
          return;
        }

        Taro.getImageInfo({
          src: file.tempFilePath,
          success: async (info) => {
            const size = file.size || (await getFileSize(file.tempFilePath));
            setSourceImage({
              path: file.tempFilePath,
              width: info.width,
              height: info.height,
              size,
              type: info.type
            });
            setOutputImage(null);
          },
          fail: () => Taro.showToast({ title: '读取图片失败', icon: 'none' })
        });
      },
      fail: () => Taro.showToast({ title: '未选择图片', icon: 'none' })
    });
  };

  const processImage = async () => {
    if (!sourceImage) {
      Taro.showToast({ title: '请先选择图片', icon: 'none' });
      return;
    }

    setProcessing(true);
    try {
      const output = await renderImage(sourceImage, {
        ratio: workMode === 'id-photo' ? idPhotoPreset.width / idPhotoPreset.height : ratio.ratio,
        quality: quality.quality,
        maxKb: targetSize.maxKb,
        maxEdge,
        outputWidth: workMode === 'id-photo' ? idPhotoPreset.width : undefined,
        outputHeight: workMode === 'id-photo' ? idPhotoPreset.height : undefined
      });
      setOutputImage(output);
      Taro.showToast({ title: '处理完成', icon: 'success' });
    } catch {
      Taro.showToast({ title: '处理失败，请换张图片重试', icon: 'none' });
    } finally {
      setProcessing(false);
    }
  };

  const saveImage = () => {
    if (!outputImage) {
      Taro.showToast({ title: '请先处理图片', icon: 'none' });
      return;
    }

    Taro.saveImageToPhotosAlbum({
      filePath: outputImage.path,
      success: () => Taro.showToast({ title: '已保存到相册', icon: 'success' }),
      fail: () => {
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
      }
    });
  };

  return (
    <ScrollView className="imagePage" scrollY>
      <View className="hero">
        <Text className="hero__eyebrow">{BRAND.nameEn} Image</Text>
        <Text className="hero__title">沐橙图片</Text>
        <Text className="hero__subtitle">裁剪、压缩、缩尺寸，本地处理不上传。</Text>
      </View>

      <View className="privacyCard">
        <Text className="privacyCard__title">本地处理</Text>
        <Text className="privacyCard__desc">图片只在当前设备处理，不上传服务器。</Text>
      </View>

      <View className="panel uploadPanel">
        {sourceImage ? (
          <View className="preview">
            <Image className="preview__image" src={sourceImage.path} mode="aspectFit" />
            <View className="preview__meta">
              <Text className="preview__title">原图</Text>
              <Text className="preview__line">
                {formatFileSize(sourceImage.size)} /{' '}
                {formatDimension(sourceImage.width, sourceImage.height)}
              </Text>
            </View>
          </View>
        ) : (
          <View className="emptyUpload">
            <Text className="emptyUpload__title">选择一张图片开始</Text>
            <Text className="emptyUpload__desc">支持相册和拍照，首版专注单图裁剪压缩。</Text>
          </View>
        )}
        <Button className="primaryButton" onClick={chooseImage}>
          {sourceImage ? '重新选择' : '选择图片'}
        </Button>
      </View>

      <View className="panel">
        <Text className="sectionTitle">处理模式</Text>
        <View className="modeSwitch">
          <Button
            className={`modeButton${workMode === 'general' ? ' is-active' : ''}`}
            onClick={() => {
              setWorkMode('general');
              setOutputImage(null);
            }}
          >
            裁剪压缩
          </Button>
          <Button
            className={`modeButton${workMode === 'id-photo' ? ' is-active' : ''}`}
            onClick={() => {
              setWorkMode('id-photo');
              setOutputImage(null);
            }}
          >
            证件照
          </Button>
        </View>

        {workMode === 'general' ? (
          <>
            <Text className="sectionTitle sectionTitle--spaced">裁剪比例</Text>
            <View className="optionGrid">
              {RATIO_OPTIONS.map((item) => (
                <Button
                  key={item.id}
                  className={`optionPill${item.id === ratioId ? ' is-active' : ''}`}
                  onClick={() => {
                    setRatioId(item.id);
                    setOutputImage(null);
                  }}
                >
                  {item.name}
                </Button>
              ))}
            </View>
          </>
        ) : (
          <>
            <Text className="sectionTitle sectionTitle--spaced">证件照规格</Text>
            <View className="presetGrid">
              {ID_PHOTO_PRESETS.map((item) => (
                <View
                  key={item.id}
                  className={`presetCard${item.id === idPhotoId ? ' is-active' : ''}`}
                  onClick={() => {
                    setIdPhotoId(item.id);
                    setOutputImage(null);
                  }}
                >
                  <Text className="presetCard__name">{item.name}</Text>
                  <Text className="presetCard__size">{item.size}</Text>
                  <Text className="presetCard__note">{item.note}</Text>
                </View>
              ))}
            </View>
            <View className="idPhotoTip">
              <Text className="idPhotoTip__title">说明</Text>
              <Text className="idPhotoTip__desc">
                当前版本提供证件照尺寸裁剪和压缩，不做人像抠图/换底色；请使用纯色背景照片效果更好。
              </Text>
            </View>
          </>
        )}

        <Text className="sectionTitle sectionTitle--spaced">压缩质量</Text>
        <View className="qualityList">
          {QUALITY_OPTIONS.map((item) => (
            <View
              key={item.id}
              className={`qualityItem${item.id === qualityId ? ' is-active' : ''}`}
              onClick={() => {
                setQualityId(item.id);
                setOutputImage(null);
              }}
            >
              <Text className="qualityItem__name">{item.name}</Text>
              <Text className="qualityItem__desc">{item.description}</Text>
            </View>
          ))}
        </View>

        <Text className="sectionTitle sectionTitle--spaced">目标大小</Text>
        <View className="optionGrid">
          {TARGET_SIZE_OPTIONS.map((item) => (
            <Button
              key={item.id}
              className={`optionPill${item.id === targetSizeId ? ' is-active' : ''}`}
              onClick={() => {
                setTargetSizeId(item.id);
                setOutputImage(null);
              }}
            >
              {item.name}
            </Button>
          ))}
        </View>

        {workMode === 'general' && (
          <>
            <View className="sliderHeader">
              <Text className="sectionTitle">最长边</Text>
              <Text className="sliderHeader__value">{maxEdge}px</Text>
            </View>
            <Slider
              min={0}
              max={MAX_EDGE_OPTIONS.length - 1}
              step={1}
              value={maxEdgeIndex}
              activeColor="#E66C32"
              backgroundColor="#f2d8c4"
              blockColor="#E66C32"
              onChange={(event) => {
                setMaxEdgeIndex(Number(event.detail.value));
                setOutputImage(null);
              }}
            />
          </>
        )}
      </View>

      <View className="panel resultPanel">
        <Text className="sectionTitle">处理结果</Text>
        {outputImage && sourceImage ? (
          <View>
            <Image className="resultImage" src={outputImage.path} mode="aspectFit" />
            <View className="statsGrid">
              <View className="statItem">
                <Text className="statItem__value">{formatFileSize(outputImage.size)}</Text>
                <Text className="statItem__label">处理后</Text>
              </View>
              <View className="statItem">
                <Text className="statItem__value">
                  {formatDimension(outputImage.width, outputImage.height)}
                </Text>
                <Text className="statItem__label">尺寸</Text>
              </View>
              <View className="statItem">
                <Text className="statItem__value">
                  {compressionRate(sourceImage.size, outputImage.size)}
                </Text>
                <Text className="statItem__label">压缩率</Text>
              </View>
            </View>
            {workMode === 'id-photo' && (
              <View className="specHint">
                <Text className="specHint__title">{idPhotoPreset.name}</Text>
                <Text className="specHint__desc">
                  已按 {idPhotoPreset.size}px
                  导出。不同地区/考试可能要求不同，请提交前核对官方规格。
                </Text>
              </View>
            )}
            {targetSize.maxKb && (
              <View className={`targetHint${targetReached ? ' is-ok' : ' is-warn'}`}>
                <Text className="targetHint__title">
                  {targetReached ? '已达到目标大小' : '未完全达到目标'}
                </Text>
                <Text className="targetHint__desc">
                  目标 {targetSize.name}，当前 {formatFileSize(outputImage.size)}
                  {targetReached ? '' : '。可尝试降低最长边或选择极小质量。'}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View className="emptyResult">
            <Text className="emptyResult__title">等待处理</Text>
            <Text className="emptyResult__desc">选择参数后点击下方按钮生成图片。</Text>
          </View>
        )}
      </View>

      <View className="actions">
        <Button
          className="processButton"
          loading={processing}
          disabled={processing}
          onClick={processImage}
        >
          {processing ? '处理中' : '开始处理'}
        </Button>
        <Button className="saveButton" disabled={!outputImage} onClick={saveImage}>
          保存图片
        </Button>
      </View>

      <Canvas id={CANVAS_ID} type="2d" className="hiddenCanvas" />
    </ScrollView>
  );
}
