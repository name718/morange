import { Button, Canvas, Image, Text, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState } from 'react';
import type { ImageMeta, ProcessResult } from '@/types';
import { getImageInfo, getFileSize, formatFileSize, formatDimension, saveManyToAlbum, saveToAlbum } from '@/lib/canvas-helper';
import { compressImage } from '@/lib/image-processor';
import { addHistory } from '@/lib/history';
import './index.scss';

const CANVAS_ID = 'compressCanvas';

const QUALITY_OPTIONS = [
  { id: 'high', label: '高质量', value: 0.92 },
  { id: 'medium', label: '中等', value: 0.75 },
  { id: 'low', label: '低质量', value: 0.5 }
];

const TARGET_OPTIONS = [
  { id: 'none', label: '不限制', value: undefined },
  { id: '200', label: '200KB', value: 200 },
  { id: '500', label: '500KB', value: 500 },
  { id: '1024', label: '1MB', value: 1024 }
];

export default function CompressPage() {
  const [sourceImage, setSourceImage] = useState<ImageMeta | null>(null);
  const [sourceImages, setSourceImages] = useState<ImageMeta[]>([]);
  const [qualityId, setQualityId] = useState('medium');
  const [targetId, setTargetId] = useState('none');
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [batchResults, setBatchResults] = useState<ProcessResult[]>([]);
  const [processing, setProcessing] = useState(false);

  const quality = QUALITY_OPTIONS.find((q) => q.id === qualityId) || QUALITY_OPTIONS[1];
  const target = TARGET_OPTIONS.find((t) => t.id === targetId) || TARGET_OPTIONS[0];

  const chooseImage = () => {
    Taro.chooseMedia({
      count: 9,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        try {
          const images: ImageMeta[] = [];
          for (const file of res.tempFiles) {
            if (!file?.tempFilePath) continue;
            const info = await getImageInfo(file.tempFilePath);
            const size = file.size || (await getFileSize(file.tempFilePath));
            images.push({
              path: file.tempFilePath,
              width: info.width,
              height: info.height,
              size,
              type: info.type
            });
          }
          setSourceImages(images);
          setSourceImage(images[0] || null);
          setResult(null);
          setBatchResults([]);
        } catch {
          Taro.showToast({ title: '读取图片失败', icon: 'none' });
        }
      }
    });
  };

  const handleCompress = async () => {
    if (sourceImages.length === 0 || !sourceImage) {
      Taro.showToast({ title: '请先选择图片', icon: 'none' });
      return;
    }

    setProcessing(true);
    try {
      const results: ProcessResult[] = [];
      for (let i = 0; i < sourceImages.length; i++) {
        Taro.showLoading({ title: `压缩 ${i + 1}/${sourceImages.length}`, mask: true });
        const compressed = await compressImage(CANVAS_ID, sourceImages[i], quality.value, target.value);
        results.push(compressed);
        addHistory('图片压缩', compressed, sourceImages.length > 1 ? `批量压缩 ${i + 1}` : '图片压缩');
      }
      Taro.hideLoading();
      setResult(results[0] || null);
      setBatchResults(results);
      Taro.showToast({ title: sourceImages.length > 1 ? '批量压缩完成' : '压缩完成', icon: 'success' });
    } catch (err) {
      Taro.hideLoading();
      console.error(err);
      Taro.showToast({ title: '处理失败', icon: 'none' });
    } finally {
      setProcessing(false);
    }
  };

  const saveResult = async () => {
    if (!result && batchResults.length === 0) {
      Taro.showToast({ title: '请先压缩图片', icon: 'none' });
      return;
    }

    if (batchResults.length > 1) {
      await saveManyToAlbum(batchResults.map((item) => item.path)).catch(() => undefined);
    } else if (result) {
      await saveToAlbum(result.path).catch(() => undefined);
    }
  };

  const compressionRate = sourceImage && result
    ? Math.round((1 - result.size / sourceImage.size) * 100)
    : 0;

  return (
    <View className="compressPage">
      <View className="uploadSection">
        {sourceImage ? (
          <>
            <Image className="previewImage" src={sourceImage.path} mode="aspectFit" />
            <Text className="imageMeta">
              已选择 {sourceImages.length} 张 · {formatDimension(sourceImage.width, sourceImage.height)} · {formatFileSize(sourceImage.size)}
            </Text>
          </>
        ) : (
          <View className="emptyUpload">
            <Text className="emptyUpload__title">选择图片开始压缩</Text>
            <Text className="emptyUpload__desc">支持相册和拍照</Text>
          </View>
        )}
        <Button className="button" onClick={chooseImage}>
          {sourceImage ? '重新选择' : '选择图片'}
        </Button>
      </View>

      <View className="configSection">
        <Text className="sectionTitle">压缩质量</Text>
        <View className="qualityOptions">
          {QUALITY_OPTIONS.map((option) => (
            <Button
              key={option.id}
              className={`qualityBtn${qualityId === option.id ? ' is-active' : ''}`}
              onClick={() => {
                setQualityId(option.id);
                setResult(null);
              }}
            >
              <Text className="qualityBtn__label">{option.label}</Text>
              <Text className="qualityBtn__value">{Math.round(option.value * 100)}%</Text>
            </Button>
          ))}
        </View>

        <Text className="sectionTitle">目标大小</Text>
        <View className="targetOptions">
          {TARGET_OPTIONS.map((option) => (
            <Button
              key={option.id}
              className={`targetBtn${targetId === option.id ? ' is-active' : ''}`}
              onClick={() => {
                setTargetId(option.id);
                setResult(null);
              }}
            >
              <Text className="targetBtn__label">{option.label}</Text>
            </Button>
          ))}
        </View>

        <Button className="button" loading={processing} disabled={processing || !sourceImage} onClick={handleCompress}>
          {processing ? '压缩中...' : '开始压缩'}
        </Button>
      </View>

      <View className="resultSection">
        <Text className="sectionTitle">压缩结果</Text>
        {result && sourceImage ? (
          <>
            <Image className="resultPreview" src={result.path} mode="aspectFit" />
            {batchResults.length > 1 && (
              <Text className="resultInfo">已生成 {batchResults.length} 张压缩图片，点击保存会逐张保存到相册</Text>
            )}
            <View className="statsGrid">
              <View className="statItem">
                <Text className="statItem__value">{formatFileSize(sourceImage.size)}</Text>
                <Text className="statItem__label">原始大小</Text>
              </View>
              <View className="statItem">
                <Text className="statItem__value">{formatFileSize(result.size)}</Text>
                <Text className="statItem__label">压缩后</Text>
              </View>
              <View className="statItem">
                <Text className="statItem__value">{compressionRate}%</Text>
                <Text className="statItem__label">压缩率</Text>
              </View>
            </View>
            <Button className="button" onClick={saveResult}>
              {batchResults.length > 1 ? '保存全部到相册' : '保存到相册'}
            </Button>
          </>
        ) : (
          <View className="emptyResult">
            <Text className="emptyResult__title">等待压缩</Text>
          </View>
        )}
      </View>

      <Canvas id={CANVAS_ID} type="2d" className="hiddenCanvas" />
    </View>
  );
}
