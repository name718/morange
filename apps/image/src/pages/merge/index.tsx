import { Button, Canvas, Image, Slider, Text, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState } from 'react';
import type { ImageMeta, ProcessResult } from '@/types';
import { getImageInfo, getFileSize, formatFileSize, formatDimension, saveToAlbum } from '@/lib/canvas-helper';
import { collageImages, mergeImages } from '@/lib/merge-images';
import { addHistory } from '@/lib/history';
import './index.scss';

const CANVAS_ID = 'mergeCanvas';
const MAX_IMAGES = 9;

export default function MergePage() {
  const [sourceImages, setSourceImages] = useState<ImageMeta[]>([]);
  const [direction, setDirection] = useState<'horizontal' | 'vertical'>('vertical');
  const [template, setTemplate] = useState<'long' | 'grid'>('long');
  const [spacing, setSpacing] = useState(0);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [processing, setProcessing] = useState(false);

  const chooseImages = () => {
    Taro.chooseMedia({
      count: MAX_IMAGES - sourceImages.length,
      mediaType: ['image'],
      sourceType: ['album'],
      success: async (res) => {
        try {
          const newImages: ImageMeta[] = [];

          for (const file of res.tempFiles) {
            if (!file?.tempFilePath) continue;

            const info = await getImageInfo(file.tempFilePath);
            const size = file.size || (await getFileSize(file.tempFilePath));

            newImages.push({
              path: file.tempFilePath,
              width: info.width,
              height: info.height,
              size,
              type: info.type
            });
          }

          setSourceImages([...sourceImages, ...newImages]);
          setResult(null);
        } catch {
          Taro.showToast({ title: '读取图片失败', icon: 'none' });
        }
      }
    });
  };

  const removeImage = (index: number) => {
    setSourceImages(sourceImages.filter((_, i) => i !== index));
    setResult(null);
  };

  const handleMerge = async () => {
    if (sourceImages.length < 2) {
      Taro.showToast({ title: '至少需要2张图片', icon: 'none' });
      return;
    }

    setProcessing(true);
    try {
      const mergeResult = template === 'grid'
        ? await collageImages(CANVAS_ID, sourceImages, spacing)
        : await mergeImages(CANVAS_ID, sourceImages, {
          direction,
          spacing
        });
      setResult(mergeResult);
      addHistory(template === 'grid' ? '拼图模板' : '长图拼接', mergeResult, template === 'grid' ? '拼图模板' : '长图拼接');
      Taro.showToast({ title: '拼接完成', icon: 'success' });
    } catch (err) {
      console.error(err);
      Taro.showToast({ title: '处理失败', icon: 'none' });
    } finally {
      setProcessing(false);
    }
  };

  const saveResult = async () => {
    if (!result) {
      Taro.showToast({ title: '请先拼接图片', icon: 'none' });
      return;
    }

    await saveToAlbum(result.path).catch(() => undefined);
  };

  return (
    <View className="mergePage">
      <View className="uploadSection">
        {sourceImages.length > 0 ? (
          <>
            <View className="imageList">
              {sourceImages.map((img, index) => (
                <View key={index} className="imageItem">
                  <Image className="imageItemThumb" src={img.path} mode="aspectFill" />
                  <Button className="removeBtn" onClick={() => removeImage(index)}>
                    ×
                  </Button>
                </View>
              ))}
            </View>
            <Text className="uploadInfo">
              已选择 {sourceImages.length} 张图片{sourceImages.length < MAX_IMAGES && `，还可选 ${MAX_IMAGES - sourceImages.length} 张`}
            </Text>
          </>
        ) : (
          <View className="emptyUpload">
            <Text className="emptyUpload__title">选择图片开始拼接</Text>
            <Text className="emptyUpload__desc">最多选择 {MAX_IMAGES} 张图片</Text>
          </View>
        )}
        <Button className="button" onClick={chooseImages} disabled={sourceImages.length >= MAX_IMAGES}>
          {sourceImages.length > 0 ? '继续添加' : '选择图片'}
        </Button>
      </View>

      <View className="configSection">
        <Text className="sectionTitle">拼接模式</Text>
        <View className="directionButtons">
          <Button
            className={`directionBtn${template === 'long' ? ' is-active' : ''}`}
            onClick={() => {
              setTemplate('long');
              setResult(null);
            }}
          >
            <Text className="directionBtn__label">长图拼接</Text>
          </Button>
          <Button
            className={`directionBtn${template === 'grid' ? ' is-active' : ''}`}
            onClick={() => {
              setTemplate('grid');
              setDirection('horizontal');
              setResult(null);
            }}
          >
            <Text className="directionBtn__label">横向拼图</Text>
          </Button>
        </View>

        {template === 'long' && (
          <>
            <Text className="sectionTitle">拼接方向</Text>
            <View className="directionButtons">
              <Button
                className={`directionBtn${direction === 'vertical' ? ' is-active' : ''}`}
                onClick={() => {
                  setDirection('vertical');
                  setResult(null);
                }}
              >
                <Text className="directionBtn__icon">⬇️</Text>
                <Text className="directionBtn__label">纵向拼接</Text>
              </Button>
              <Button
                className={`directionBtn${direction === 'horizontal' ? ' is-active' : ''}`}
                onClick={() => {
                  setDirection('horizontal');
                  setResult(null);
                }}
              >
                <Text className="directionBtn__icon">➡️</Text>
                <Text className="directionBtn__label">横向拼接</Text>
              </Button>
            </View>
          </>
        )}

        <View className="sliderRow">
          <View className="sliderLabel">
            <Text className="sliderLabel__title">图片间距</Text>
            <Text className="sliderLabel__value">{spacing}px</Text>
          </View>
          <Slider
            min={0}
            max={50}
            step={5}
            value={spacing}
            activeColor="#E66C32"
            backgroundColor="#f2d8c4"
            blockColor="#E66C32"
            onChange={(e) => {
              setSpacing(Number(e.detail.value));
              setResult(null);
            }}
          />
        </View>

        <Button className="button" loading={processing} disabled={processing || sourceImages.length < 2} onClick={handleMerge}>
          {processing ? '拼接中...' : '开始拼接'}
        </Button>
      </View>

      <View className="resultSection">
        <Text className="sectionTitle">拼接结果</Text>
        {result ? (
          <>
            <Image className="resultPreview" src={result.path} mode="widthFix" showMenuByLongpress />
            <Text className="resultInfo">
              {formatDimension(result.width, result.height)} · {formatFileSize(result.size)}
            </Text>
            <Button className="button" onClick={saveResult}>
              保存到相册
            </Button>
          </>
        ) : (
          <View className="emptyResult">
            <Text className="emptyResult__title">等待拼接</Text>
          </View>
        )}
      </View>

      <Canvas id={CANVAS_ID} type="2d" className="hiddenCanvas" />
    </View>
  );
}
