import { Button, Canvas, Image, Slider, Text, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState } from 'react';
import type { ImageMeta, ProcessResult } from '@/types';
import { getFileSize, getImageInfo, formatDimension, formatFileSize, saveToAlbum } from '@/lib/canvas-helper';
import { addFrame } from '@/lib/frame-image';
import { addHistory } from '@/lib/history';
import './index.scss';

const CANVAS_ID = 'frameCanvas';

const COLORS = [
  { id: 'cream', label: '奶油', value: '#fff4e6' },
  { id: 'white', label: '白色', value: '#ffffff' },
  { id: 'black', label: '黑色', value: '#1f1b18' },
  { id: 'green', label: '鼠尾草', value: '#dfe8d4' },
  { id: 'blue', label: '雾蓝', value: '#dce8f2' }
];

export default function FramePage() {
  const [sourceImage, setSourceImage] = useState<ImageMeta | null>(null);
  const [padding, setPadding] = useState(80);
  const [radius, setRadius] = useState(24);
  const [colorId, setColorId] = useState(COLORS[0].id);
  const [shadow, setShadow] = useState(true);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [processing, setProcessing] = useState(false);

  const color = COLORS.find((item) => item.id === colorId) || COLORS[0];

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

  const handleFrame = async () => {
    if (!sourceImage) {
      Taro.showToast({ title: '请先选择图片', icon: 'none' });
      return;
    }

    setProcessing(true);
    try {
      const framed = await addFrame(CANVAS_ID, sourceImage, {
        padding,
        radius,
        backgroundColor: color.value,
        shadow
      });
      setResult(framed);
      addHistory('边框留白', framed, `${color.label}边框`);
      Taro.showToast({ title: '生成完成', icon: 'success' });
    } catch (err) {
      console.error(err);
      Taro.showToast({ title: '处理失败', icon: 'none' });
    } finally {
      setProcessing(false);
    }
  };

  const saveResult = async () => {
    if (!result) {
      Taro.showToast({ title: '请先生成图片', icon: 'none' });
      return;
    }
    await saveToAlbum(result.path).catch(() => undefined);
  };

  return (
    <View className="framePage">
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
            <Text className="emptyUpload__title">给图片添加边框留白</Text>
            <Text className="emptyUpload__desc">适合封面、头像、社交平台配图</Text>
          </View>
        )}
        <Button className="button" onClick={chooseImage}>
          {sourceImage ? '重新选择' : '选择图片'}
        </Button>
      </View>

      <View className="configSection">
        <Text className="sectionTitle">边框样式</Text>
        <View className="colorGrid">
          {COLORS.map((item) => (
            <Button
              key={item.id}
              className={`colorCard${colorId === item.id ? ' is-active' : ''}`}
              onClick={() => {
                setColorId(item.id);
                setResult(null);
              }}
            >
              <View className="colorCard__swatch" style={{ background: item.value }} />
              <Text className="colorCard__label">{item.label}</Text>
            </Button>
          ))}
        </View>

        <View className="sliderRow">
          <View className="sliderLabel">
            <Text className="sliderLabel__title">留白宽度</Text>
            <Text className="sliderLabel__value">{padding}px</Text>
          </View>
          <Slider min={0} max={240} step={10} value={padding} activeColor="#E66C32" backgroundColor="#f2d8c4" blockColor="#E66C32" onChange={(e) => {
            setPadding(Number(e.detail.value));
            setResult(null);
          }} />
        </View>

        <View className="sliderRow">
          <View className="sliderLabel">
            <Text className="sliderLabel__title">图片圆角</Text>
            <Text className="sliderLabel__value">{radius}px</Text>
          </View>
          <Slider min={0} max={120} step={4} value={radius} activeColor="#E66C32" backgroundColor="#f2d8c4" blockColor="#E66C32" onChange={(e) => {
            setRadius(Number(e.detail.value));
            setResult(null);
          }} />
        </View>

        <Button
          className={`shadowToggle${shadow ? ' is-active' : ''}`}
          onClick={() => {
            setShadow(!shadow);
            setResult(null);
          }}
        >
          {shadow ? '已开启阴影' : '开启阴影'}
        </Button>

        <Button className="button" loading={processing} disabled={processing || !sourceImage} onClick={handleFrame}>
          {processing ? '生成中...' : '生成边框图'}
        </Button>
      </View>

      <View className="resultSection">
        <Text className="sectionTitle">生成结果</Text>
        {result ? (
          <>
            <Image className="resultPreview" src={result.path} mode="aspectFit" />
            <Text className="resultInfo">
              {formatDimension(result.width, result.height)} · {formatFileSize(result.size)}
            </Text>
            <Button className="button" onClick={saveResult}>保存到相册</Button>
          </>
        ) : (
          <View className="emptyResult">
            <Text className="emptyResult__title">等待生成</Text>
          </View>
        )}
      </View>

      <Canvas id={CANVAS_ID} type="2d" className="hiddenCanvas" />
    </View>
  );
}
