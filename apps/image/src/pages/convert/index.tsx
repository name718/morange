import { Button, Canvas, Image, Slider, Text, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState } from 'react';
import type { ImageMeta, ProcessResult, ImageFormat } from '@/types';
import { getImageInfo, getFileSize, formatFileSize, formatDimension, saveToAlbum } from '@/lib/canvas-helper';
import { convertFormat } from '@/lib/image-processor';
import { addHistory } from '@/lib/history';
import './index.scss';

const CANVAS_ID = 'convertCanvas';

const FORMATS = [
  { id: 'jpg', label: 'JPG', desc: '通用格式' },
  { id: 'png', label: 'PNG', desc: '支持透明' }
] satisfies Array<{ id: ImageFormat; label: string; desc: string }>;

export default function ConvertPage() {
  const [sourceImage, setSourceImage] = useState<ImageMeta | null>(null);
  const [targetFormat, setTargetFormat] = useState<ImageFormat>('jpg');
  const [quality, setQuality] = useState(75);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [processing, setProcessing] = useState(false);

  const chooseImage = () => {
    Taro.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const file = res.tempFiles[0];
        if (!file?.tempFilePath) return;

        try {
          const info = await getImageInfo(file.tempFilePath);
          const size = file.size || (await getFileSize(file.tempFilePath));

          setSourceImage({
            path: file.tempFilePath,
            width: info.width,
            height: info.height,
            size,
            type: info.type
          });
          setResult(null);
        } catch {
          Taro.showToast({ title: '读取图片失败', icon: 'none' });
        }
      }
    });
  };

  const handleConvert = async () => {
    if (!sourceImage) {
      Taro.showToast({ title: '请先选择图片', icon: 'none' });
      return;
    }

    setProcessing(true);
    try {
      const converted = await convertFormat(CANVAS_ID, sourceImage, targetFormat, quality / 100);
      setResult(converted);
      addHistory('格式转换', converted, `${targetFormat.toUpperCase()} 转换`);
      Taro.showToast({ title: '转换完成', icon: 'success' });
    } catch (err) {
      console.error(err);
      Taro.showToast({ title: '转换失败', icon: 'none' });
    } finally {
      setProcessing(false);
    }
  };

  const saveResult = async () => {
    if (!result) {
      Taro.showToast({ title: '请先转换格式', icon: 'none' });
      return;
    }

    await saveToAlbum(result.path).catch(() => undefined);
  };

  const getFormatInfo = () => {
    switch (targetFormat) {
      case 'jpg':
        return {
          title: 'JPG 格式',
          desc: '最常用的图片格式，体积小，兼容性好，适合照片和普通图片。不支持透明背景。'
        };
      case 'png':
        return {
          title: 'PNG 格式',
          desc: '支持透明背景的图片格式，适合 Logo、图标等需要透明效果的图片。体积较大。'
        };
    }
  };

  const formatInfo = getFormatInfo();

  return (
    <View className="convertPage">
      <View className="uploadSection">
        {sourceImage ? (
          <>
            <Image className="previewImage" src={sourceImage.path} mode="aspectFit" />
            <Text className="imageMeta">
              {sourceImage.type?.toUpperCase() || '未知格式'} · {formatDimension(sourceImage.width, sourceImage.height)} · {formatFileSize(sourceImage.size)}
            </Text>
          </>
        ) : (
          <View className="emptyUpload">
            <Text className="emptyUpload__title">选择图片转换格式</Text>
            <Text className="emptyUpload__desc">支持相册和拍照</Text>
          </View>
        )}
        <Button className="button" onClick={chooseImage}>
          {sourceImage ? '重新选择' : '选择图片'}
        </Button>
      </View>

      <View className="configSection">
        <Text className="sectionTitle">目标格式</Text>
        <View className="formatButtons">
          {FORMATS.map((format) => (
            <Button
              key={format.id}
              className={`formatBtn${targetFormat === format.id ? ' is-active' : ''}`}
              onClick={() => {
                setTargetFormat(format.id);
                setResult(null);
              }}
            >
              <Text className="formatBtn__label">{format.label}</Text>
              <Text className="formatBtn__desc">{format.desc}</Text>
            </Button>
          ))}
        </View>

        <View className="formatInfo">
          <Text className="formatInfo__title">{formatInfo.title}</Text>
          <Text className="formatInfo__desc">{formatInfo.desc}</Text>
        </View>

        <View className="sliderRow">
          <View className="sliderLabel">
            <Text className="sliderLabel__title">转换质量</Text>
            <Text className="sliderLabel__value">{quality}%</Text>
          </View>
          <Slider
            min={50}
            max={95}
            step={5}
            value={quality}
            activeColor="#E66C32"
            backgroundColor="#f2d8c4"
            blockColor="#E66C32"
            onChange={(e) => {
              setQuality(Number(e.detail.value));
              setResult(null);
            }}
          />
        </View>

        <Button className="button" loading={processing} disabled={processing || !sourceImage} onClick={handleConvert}>
          {processing ? '转换中...' : '开始转换'}
        </Button>
      </View>

      <View className="resultSection">
        <Text className="sectionTitle">转换结果</Text>
        {result ? (
          <>
            <Image className="resultPreview" src={result.path} mode="aspectFit" />
            <Text className="resultInfo">
              {targetFormat.toUpperCase()} · {formatDimension(result.width, result.height)} · {formatFileSize(result.size)}
            </Text>
            <Button className="button" onClick={saveResult}>
              保存到相册
            </Button>
          </>
        ) : (
          <View className="emptyResult">
            <Text className="emptyResult__title">等待转换</Text>
          </View>
        )}
      </View>

      <Canvas id={CANVAS_ID} type="2d" className="hiddenCanvas" />
    </View>
  );
}
