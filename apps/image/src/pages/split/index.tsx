import { Button, Canvas, Image, Text, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState } from 'react';
import type { ImageMeta, ProcessResult } from '@/types';
import { getImageInfo, getFileSize, formatFileSize, formatDimension, saveManyToAlbum } from '@/lib/canvas-helper';
import { splitImage } from '@/lib/split-grid';
import { addHistory } from '@/lib/history';
import './index.scss';

const CANVAS_ID = 'splitCanvas';

const GRID_OPTIONS = [
  { rows: 2, cols: 2, label: '2×2', desc: '4张图' },
  { rows: 3, cols: 3, label: '3×3', desc: '9张图' },
  { rows: 4, cols: 4, label: '4×4', desc: '16张图' }
];

export default function SplitPage() {
  const [sourceImage, setSourceImage] = useState<ImageMeta | null>(null);
  const [gridOption, setGridOption] = useState(GRID_OPTIONS[1]); // 默认 3×3
  const [results, setResults] = useState<ProcessResult[]>([]);
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
          setResults([]);
        } catch {
          Taro.showToast({ title: '读取图片失败', icon: 'none' });
        }
      }
    });
  };

  const handleSplit = async () => {
    if (!sourceImage) {
      Taro.showToast({ title: '请先选择图片', icon: 'none' });
      return;
    }

    setProcessing(true);
    try {
      const splitResults = await splitImage(CANVAS_ID, sourceImage, {
        rows: gridOption.rows,
        cols: gridOption.cols
      });
      setResults(splitResults);
      splitResults.forEach((item, index) => addHistory('宫格切图', item, `切图 ${index + 1}`));
      Taro.showToast({ title: '切图完成', icon: 'success' });
    } catch (err) {
      console.error(err);
      Taro.showToast({ title: '处理失败', icon: 'none' });
    } finally {
      setProcessing(false);
    }
  };

  const saveAll = async () => {
    if (results.length === 0) {
      Taro.showToast({ title: '没有可保存的图片', icon: 'none' });
      return;
    }

    try {
      await saveManyToAlbum(results.map((item) => item.path));
    } catch {
      // saveManyToAlbum 已经负责 loading、权限弹窗和错误提示。
    }
  };

  return (
    <View className="splitPage">
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
            <Text className="emptyUpload__title">选择图片开始切图</Text>
            <Text className="emptyUpload__desc">支持相册和拍照</Text>
          </View>
        )}
        <Button className="button" onClick={chooseImage}>
          {sourceImage ? '重新选择' : '选择图片'}
        </Button>
      </View>

      <View className="configSection">
        <Text className="sectionTitle">切图方式</Text>
        <View className="gridOptions">
          {GRID_OPTIONS.map((option) => (
            <Button
              key={`${option.rows}x${option.cols}`}
              className={`gridOption${gridOption === option ? ' is-active' : ''}`}
              onClick={() => {
                setGridOption(option);
                setResults([]);
              }}
            >
              <Text className="gridOption__label">{option.label}</Text>
              <Text className="gridOption__desc">{option.desc}</Text>
            </Button>
          ))}
        </View>
        <Button className="button" loading={processing} disabled={processing || !sourceImage} onClick={handleSplit}>
          {processing ? '切图中...' : '开始切图'}
        </Button>
      </View>

      <View className="resultSection">
        <Text className="sectionTitle">切图结果</Text>
        {results.length > 0 ? (
          <>
            <View className="resultGrid" style={{ gridTemplateColumns: `repeat(${gridOption.cols}, 1fr)` }}>
              {results.map((result, index) => (
                <View key={index} className="resultItem">
                  <Image className="resultItemImage" src={result.path} mode="widthFix" />
                </View>
              ))}
            </View>
            <Text className="resultInfo">共 {results.length} 张图片</Text>
            <Button className="button" onClick={saveAll}>
              保存全部到相册
            </Button>
          </>
        ) : (
          <View className="emptyResult">
            <Text className="emptyResult__title">等待切图</Text>
          </View>
        )}
      </View>

      <Canvas id={CANVAS_ID} type="2d" className="hiddenCanvas" />
    </View>
  );
}
