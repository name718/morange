import { Button, Canvas, Image, Input, Slider, Text, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState } from 'react';
import type { ImageMeta, ProcessResult, WatermarkConfig } from '@/types';
import { getImageInfo, getFileSize, formatFileSize, saveToAlbum } from '@/lib/canvas-helper';
import { addWatermark } from '@/lib/watermark';
import { addHistory } from '@/lib/history';
import './index.scss';

const CANVAS_ID = 'watermarkCanvas';

const POSITIONS = [
  { id: 'top-left', icon: '↖️' },
  { id: 'top-center', icon: '⬆️' },
  { id: 'top-right', icon: '↗️' },
  { id: 'center-left', icon: '⬅️' },
  { id: 'center', icon: '⏺' },
  { id: 'center-right', icon: '➡️' },
  { id: 'bottom-left', icon: '↙️' },
  { id: 'bottom-center', icon: '⬇️' },
  { id: 'bottom-right', icon: '↘️' }
] as const;

const COLORS = [
  { id: 'white', value: '#ffffff' },
  { id: 'black', value: '#000000' },
  { id: 'red', value: '#ff0000' },
  { id: 'blue', value: '#0000ff' },
  { id: 'orange', value: '#e66c32' }
];

export default function WatermarkPage() {
  const [sourceImage, setSourceImage] = useState<ImageMeta | null>(null);
  const [watermarkType, setWatermarkType] = useState<WatermarkConfig['type']>('text');
  const [logoImage, setLogoImage] = useState<ImageMeta | null>(null);
  const [text, setText] = useState('沐橙图片');
  const [fontSize, setFontSize] = useState(48);
  const [logoScale, setLogoScale] = useState(20);
  const [colorId, setColorId] = useState('white');
  const [opacity, setOpacity] = useState(50);
  const [position, setPosition] = useState<WatermarkConfig['position']>('bottom-right');
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [processing, setProcessing] = useState(false);

  const color = COLORS.find((c) => c.id === colorId) || COLORS[0];

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

  const chooseLogoImage = () => {
    Taro.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album'],
      success: async (res) => {
        const file = res.tempFiles[0];
        if (!file?.tempFilePath) return;

        try {
          const info = await getImageInfo(file.tempFilePath);
          const size = file.size || (await getFileSize(file.tempFilePath));

          setLogoImage({
            path: file.tempFilePath,
            width: info.width,
            height: info.height,
            size,
            type: info.type
          });
          setResult(null);
        } catch {
          Taro.showToast({ title: '读取 Logo 失败', icon: 'none' });
        }
      }
    });
  };

  const handleAddWatermark = async () => {
    if (!sourceImage) {
      Taro.showToast({ title: '请先选择图片', icon: 'none' });
      return;
    }

    if ((watermarkType === 'text' || watermarkType === 'tile') && !text.trim()) {
      Taro.showToast({ title: '请输入水印文字', icon: 'none' });
      return;
    }

    if (watermarkType === 'image' && !logoImage) {
      Taro.showToast({ title: '请选择 Logo 图片', icon: 'none' });
      return;
    }

    setProcessing(true);
    try {
      const config: WatermarkConfig = {
        type: watermarkType,
        text: text.trim(),
        fontSize,
        color: color.value,
        opacity: opacity / 100,
        imagePath: logoImage?.path,
        imageScale: logoScale / 100,
        position
      };

      const watermarked = await addWatermark(CANVAS_ID, sourceImage, config);
      setResult(watermarked);
      addHistory('图片水印', watermarked, watermarkType === 'image' ? 'Logo 水印' : '文字水印');
      Taro.showToast({ title: '水印添加完成', icon: 'success' });
    } catch (err) {
      console.error(err);
      Taro.showToast({ title: '处理失败', icon: 'none' });
    } finally {
      setProcessing(false);
    }
  };

  const saveResult = async () => {
    if (!result) {
      Taro.showToast({ title: '请先添加水印', icon: 'none' });
      return;
    }

    await saveToAlbum(result.path).catch(() => undefined);
  };

  return (
    <View className="watermarkPage">
      <View className="uploadSection">
        {sourceImage ? (
          <>
            <Image className="previewImage" src={sourceImage.path} mode="aspectFit" />
          </>
        ) : (
          <View className="emptyUpload">
            <Text className="emptyUpload__title">选择图片添加水印</Text>
            <Text className="emptyUpload__desc">支持相册和拍照</Text>
          </View>
        )}
        <Button className="button" onClick={chooseImage}>
          {sourceImage ? '重新选择' : '选择图片'}
        </Button>
      </View>

      <View className="configSection">
        <Text className="sectionTitle">水印类型</Text>
        <View className="typeButtons">
          <Button
            className={`typeBtn${watermarkType === 'text' ? ' is-active' : ''}`}
            onClick={() => {
              setWatermarkType('text');
              setResult(null);
            }}
          >
            单个水印
          </Button>
          <Button
            className={`typeBtn${watermarkType === 'image' ? ' is-active' : ''}`}
            onClick={() => {
              setWatermarkType('image');
              setResult(null);
            }}
          >
            Logo 水印
          </Button>
          <Button
            className={`typeBtn${watermarkType === 'tile' ? ' is-active' : ''}`}
            onClick={() => {
              setWatermarkType('tile');
              setResult(null);
            }}
          >
            平铺水印
          </Button>
        </View>

        {watermarkType === 'image' ? (
          <>
            <View className="logoPicker">
              {logoImage ? (
                <>
                  <Image className="logoPreview" src={logoImage.path} mode="aspectFit" />
                  <View className="logoMeta">
                    <Text className="logoMeta__title">Logo 已选择</Text>
                    <Text className="logoMeta__desc">{logoImage.width}×{logoImage.height} · {formatFileSize(logoImage.size)}</Text>
                  </View>
                </>
              ) : (
                <View className="logoEmpty">
                  <Text className="logoEmpty__title">选择 Logo 图片</Text>
                  <Text className="logoEmpty__desc">建议使用透明 PNG</Text>
                </View>
              )}
              <Button className="logoButton" onClick={chooseLogoImage}>
                {logoImage ? '更换 Logo' : '选择 Logo'}
              </Button>
            </View>

            <View className="sliderRow">
              <View className="sliderLabel">
                <Text className="sliderLabel__title">Logo 宽度</Text>
                <Text className="sliderLabel__value">{logoScale}%</Text>
              </View>
              <Slider
                min={8}
                max={50}
                step={2}
                value={logoScale}
                activeColor="#E66C32"
                backgroundColor="#f2d8c4"
                blockColor="#E66C32"
                onChange={(e) => {
                  setLogoScale(Number(e.detail.value));
                  setResult(null);
                }}
              />
            </View>
          </>
        ) : (
          <>
            <View className="inputGroup">
              <Text className="inputLabel">水印文字</Text>
              <Input
                className="input"
                value={text}
                onInput={(e) => {
                  setText(e.detail.value);
                  setResult(null);
                }}
                placeholder="输入水印文字"
              />
            </View>

            <View className="sliderRow">
              <View className="sliderLabel">
                <Text className="sliderLabel__title">字号大小</Text>
                <Text className="sliderLabel__value">{fontSize}px</Text>
              </View>
              <Slider
                min={20}
                max={120}
                step={4}
                value={fontSize}
                activeColor="#E66C32"
                backgroundColor="#f2d8c4"
                blockColor="#E66C32"
                onChange={(e) => {
                  setFontSize(Number(e.detail.value));
                  setResult(null);
                }}
              />
            </View>

            <View className="inputGroup">
              <Text className="inputLabel">水印颜色</Text>
              <View className="colorPicker">
                {COLORS.map((c) => (
                  <Button
                    key={c.id}
                    className={`colorOption${colorId === c.id ? ' is-active' : ''}`}
                    style={{ background: c.value }}
                    onClick={() => {
                      setColorId(c.id);
                      setResult(null);
                    }}
                  />
                ))}
              </View>
            </View>
          </>
        )}

        <View className="sliderRow">
          <View className="sliderLabel">
            <Text className="sliderLabel__title">透明度</Text>
            <Text className="sliderLabel__value">{opacity}%</Text>
          </View>
          <Slider
            min={10}
            max={100}
            step={5}
            value={opacity}
            activeColor="#E66C32"
            backgroundColor="#f2d8c4"
            blockColor="#E66C32"
            onChange={(e) => {
              setOpacity(Number(e.detail.value));
              setResult(null);
            }}
          />
        </View>

        {watermarkType !== 'tile' && (
          <>
            <Text className="sectionTitle">水印位置</Text>
            <View className="positionGrid">
              {POSITIONS.map((pos) => (
                <Button
                  key={pos.id}
                  className={`positionBtn${position === pos.id ? ' is-active' : ''}`}
                  onClick={() => {
                    setPosition(pos.id);
                    setResult(null);
                  }}
                >
                  {pos.icon}
                </Button>
              ))}
            </View>
          </>
        )}

        <Button className="button" loading={processing} disabled={processing || !sourceImage} onClick={handleAddWatermark}>
          {processing ? '处理中...' : '添加水印'}
        </Button>
      </View>

      <View className="resultSection">
        <Text className="sectionTitle">添加结果</Text>
        {result ? (
          <>
            <Image className="resultPreview" src={result.path} mode="aspectFit" />
            <Button className="button" onClick={saveResult}>
              保存到相册
            </Button>
          </>
        ) : (
          <View className="emptyResult">
            <Text className="emptyResult__title">等待添加水印</Text>
          </View>
        )}
      </View>

      <Canvas id={CANVAS_ID} type="2d" className="hiddenCanvas" />
    </View>
  );
}
