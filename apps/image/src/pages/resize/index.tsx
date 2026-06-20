import { Button, Canvas, Image, Input, Text, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState } from 'react';
import type { ImageMeta, ProcessResult } from '@/types';
import { getImageInfo, getFileSize, formatFileSize, formatDimension, saveToAlbum } from '@/lib/canvas-helper';
import { resizeImage } from '@/lib/image-processor';
import { addHistory } from '@/lib/history';
import './index.scss';

const CANVAS_ID = 'resizeCanvas';

const PRESET_SIZES = [
  { id: 'avatar', label: '头像', width: 500, height: 500 },
  { id: 'cover', label: '封面', width: 1280, height: 720 },
  { id: 'post', label: '朋友圈', width: 1080, height: 1080 },
  { id: 'story', label: '竖屏', width: 1080, height: 1920 }
];

export default function ResizePage() {
  const [sourceImage, setSourceImage] = useState<ImageMeta | null>(null);
  const [mode, setMode] = useState<'preset' | 'custom'>('preset');
  const [presetId, setPresetId] = useState('avatar');
  const [customWidth, setCustomWidth] = useState('');
  const [customHeight, setCustomHeight] = useState('');
  const [keepRatio, setKeepRatio] = useState(true);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [processing, setProcessing] = useState(false);

  const preset = PRESET_SIZES.find((p) => p.id === presetId) || PRESET_SIZES[0];

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
          setCustomWidth(String(info.width));
          setCustomHeight(String(info.height));
        } catch {
          Taro.showToast({ title: '读取图片失败', icon: 'none' });
        }
      }
    });
  };

  const handleResize = async () => {
    if (!sourceImage) {
      Taro.showToast({ title: '请先选择图片', icon: 'none' });
      return;
    }

    let targetWidth: number;
    let targetHeight: number;

    if (mode === 'preset') {
      targetWidth = preset.width;
      targetHeight = preset.height;
    } else {
      const w = parseInt(customWidth);
      const h = parseInt(customHeight);

      if (!w || !h || w <= 0 || h <= 0) {
        Taro.showToast({ title: '请输入有效的尺寸', icon: 'none' });
        return;
      }

      targetWidth = w;
      targetHeight = h;
    }

    setProcessing(true);
    try {
      const resized = await resizeImage(CANVAS_ID, sourceImage, targetWidth, targetHeight);
      setResult(resized);
      addHistory('尺寸修改', resized, '尺寸修改');
      Taro.showToast({ title: '调整完成', icon: 'success' });
    } catch (err) {
      console.error(err);
      Taro.showToast({ title: '处理失败', icon: 'none' });
    } finally {
      setProcessing(false);
    }
  };

  const saveResult = async () => {
    if (!result) {
      Taro.showToast({ title: '请先调整尺寸', icon: 'none' });
      return;
    }

    await saveToAlbum(result.path).catch(() => undefined);
  };

  const handleWidthChange = (value: string) => {
    setCustomWidth(value);
    if (keepRatio && sourceImage) {
      const w = parseInt(value);
      if (w > 0) {
        const ratio = sourceImage.height / sourceImage.width;
        setCustomHeight(String(Math.round(w * ratio)));
      }
    }
    setResult(null);
  };

  const handleHeightChange = (value: string) => {
    setCustomHeight(value);
    if (keepRatio && sourceImage) {
      const h = parseInt(value);
      if (h > 0) {
        const ratio = sourceImage.width / sourceImage.height;
        setCustomWidth(String(Math.round(h * ratio)));
      }
    }
    setResult(null);
  };

  return (
    <View className="resizePage">
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
            <Text className="emptyUpload__title">选择图片调整尺寸</Text>
            <Text className="emptyUpload__desc">支持相册和拍照</Text>
          </View>
        )}
        <Button className="button" onClick={chooseImage}>
          {sourceImage ? '重新选择' : '选择图片'}
        </Button>
      </View>

      <View className="configSection">
        <Text className="sectionTitle">调整模式</Text>
        <View className="modeButtons">
          <Button
            className={`modeBtn${mode === 'preset' ? ' is-active' : ''}`}
            onClick={() => {
              setMode('preset');
              setResult(null);
            }}
          >
            预设尺寸
          </Button>
          <Button
            className={`modeBtn${mode === 'custom' ? ' is-active' : ''}`}
            onClick={() => {
              setMode('custom');
              setResult(null);
            }}
          >
            自定义
          </Button>
        </View>

        {mode === 'preset' ? (
          <>
            <Text className="sectionTitle">选择尺寸</Text>
            <View className="presetOptions">
              {PRESET_SIZES.map((size) => (
                <Button
                  key={size.id}
                  className={`presetBtn${presetId === size.id ? ' is-active' : ''}`}
                  onClick={() => {
                    setPresetId(size.id);
                    setResult(null);
                  }}
                >
                  <Text className="presetBtn__label">{size.label}</Text>
                  <Text className="presetBtn__size">{formatDimension(size.width, size.height)}</Text>
                </Button>
              ))}
            </View>
          </>
        ) : (
          <>
            <Text className="sectionTitle">自定义尺寸</Text>
            <View className="ratioToggle">
              <Button
                className={`ratioBtn${keepRatio ? ' is-active' : ''}`}
                onClick={() => setKeepRatio(!keepRatio)}
              >
                {keepRatio ? '🔒 保持比例' : '🔓 自由调整'}
              </Button>
            </View>
            <View className="customInputs">
              <View className="inputGroup">
                <Text className="inputLabel">宽度 (px)</Text>
                <Input
                  className="input"
                  type="number"
                  value={customWidth}
                  onInput={(e) => handleWidthChange(e.detail.value)}
                  placeholder="输入宽度"
                />
              </View>
              <View className="inputGroup">
                <Text className="inputLabel">高度 (px)</Text>
                <Input
                  className="input"
                  type="number"
                  value={customHeight}
                  onInput={(e) => handleHeightChange(e.detail.value)}
                  placeholder="输入高度"
                />
              </View>
            </View>
          </>
        )}

        <Button className="button" loading={processing} disabled={processing || !sourceImage} onClick={handleResize}>
          {processing ? '调整中...' : '开始调整'}
        </Button>
      </View>

      <View className="resultSection">
        <Text className="sectionTitle">调整结果</Text>
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
            <Text className="emptyResult__title">等待调整</Text>
          </View>
        )}
      </View>

      <Canvas id={CANVAS_ID} type="2d" className="hiddenCanvas" />
    </View>
  );
}
