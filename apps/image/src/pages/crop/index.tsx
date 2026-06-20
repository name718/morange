import { Button, Canvas, Image, Text, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState } from 'react';
import type { ImageMeta, ProcessResult } from '@/types';
import { getFileSize, getImageInfo, formatDimension, formatFileSize, saveToAlbum } from '@/lib/canvas-helper';
import { addHistory } from '@/lib/history';
import { CROP_PRESETS, cropToPreset } from '@/lib/crop-image';
import './index.scss';

const CANVAS_ID = 'cropCanvas';

export default function CropPage() {
  const [sourceImage, setSourceImage] = useState<ImageMeta | null>(null);
  const [presetId, setPresetId] = useState(CROP_PRESETS[0].id);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [processing, setProcessing] = useState(false);

  const preset = CROP_PRESETS.find((item) => item.id === presetId) || CROP_PRESETS[0];

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

  const handleCrop = async () => {
    if (!sourceImage) {
      Taro.showToast({ title: '请先选择图片', icon: 'none' });
      return;
    }

    setProcessing(true);
    try {
      const cropped = await cropToPreset(CANVAS_ID, sourceImage, preset);
      setResult(cropped);
      addHistory('裁剪证件照', cropped, preset.label);
      Taro.showToast({ title: '裁剪完成', icon: 'success' });
    } catch (err) {
      console.error(err);
      Taro.showToast({ title: '处理失败', icon: 'none' });
    } finally {
      setProcessing(false);
    }
  };

  const saveResult = async () => {
    if (!result) {
      Taro.showToast({ title: '请先裁剪图片', icon: 'none' });
      return;
    }
    await saveToAlbum(result.path).catch(() => undefined);
  };

  return (
    <View className="cropPage">
      <View className="uploadSection">
        {sourceImage ? (
          <>
            <Image className="previewImage" src={sourceImage.path} mode="aspectFit" />
            <Text className="imageMeta">
              {formatDimension(sourceImage.width, sourceImage.height)} · {formatFileSize(sourceImage.size)}
            </Text>
          </>
        ) : (
          <View className="emptyUpload">
            <Text className="emptyUpload__title">选择图片裁剪成标准尺寸</Text>
            <Text className="emptyUpload__desc">支持头像、证件照、封面和竖版海报</Text>
          </View>
        )}
        <Button className="button" onClick={chooseImage}>
          {sourceImage ? '重新选择' : '选择图片'}
        </Button>
      </View>

      <View className="configSection">
        <Text className="sectionTitle">裁剪规格</Text>
        <View className="presetOptions">
          {CROP_PRESETS.map((item) => (
            <Button
              key={item.id}
              className={`presetBtn${presetId === item.id ? ' is-active' : ''}`}
              onClick={() => {
                setPresetId(item.id);
                setResult(null);
              }}
            >
              <Text className="presetBtn__label">{item.label}</Text>
              <Text className="presetBtn__size">{item.width}×{item.height}</Text>
              <Text className="presetBtn__note">{item.note}</Text>
            </Button>
          ))}
        </View>

        <Button className="button" loading={processing} disabled={processing || !sourceImage} onClick={handleCrop}>
          {processing ? '裁剪中...' : `裁剪为${preset.label}`}
        </Button>
      </View>

      <View className="resultSection">
        <Text className="sectionTitle">裁剪结果</Text>
        {result ? (
          <>
            <Image className="resultPreview" src={result.path} mode="aspectFit" />
            <Text className="resultInfo">
              {formatDimension(result.width, result.height)} · {formatFileSize(result.size)}
            </Text>
            <Button className="button" onClick={saveResult}>
              保存到相册
            </Button>
          </>
        ) : (
          <View className="emptyResult">
            <Text className="emptyResult__title">等待裁剪</Text>
          </View>
        )}
      </View>

      <Canvas id={CANVAS_ID} type="2d" className="hiddenCanvas" />
    </View>
  );
}
