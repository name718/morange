import { Button, Image, Text, View } from '@tarojs/components';
import { useDidShow } from '@tarojs/taro';
import Taro from '@tarojs/taro';
import { useState } from 'react';
import { clearHistory, getHistory, type HistoryItem } from '@/lib/history';
import { formatDimension, formatFileSize, saveToAlbum } from '@/lib/canvas-helper';
import './index.scss';

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);

  useDidShow(() => {
    setItems(getHistory());
  });

  const handleClear = () => {
    clearHistory();
    setItems([]);
    Taro.showToast({ title: '已清空', icon: 'success' });
  };

  const saveItem = async (item: HistoryItem) => {
    await saveToAlbum(item.path).catch(() => undefined);
  };

  return (
    <View className="historyPage">
      <View className="configSection">
        <Text className="sectionTitle">最近处理</Text>
        <Text className="historyHint">保存最近 {items.length} 条结果，临时文件可能被系统清理。</Text>
        {items.length > 0 && (
          <Button className="clearButton" onClick={handleClear}>清空记录</Button>
        )}
      </View>

      {items.length > 0 ? (
        <View className="historyList">
          {items.map((item) => (
            <View key={item.id} className="historyCard">
              <Image className="historyThumb" src={item.path} mode="aspectFill" />
              <View className="historyBody">
                <Text className="historyTitle">{item.title}</Text>
                <Text className="historyMeta">{item.action} · {formatDimension(item.width, item.height)}</Text>
                <Text className="historyMeta">{formatFileSize(item.size)}</Text>
                <Button className="saveSmallButton" onClick={() => saveItem(item)}>保存</Button>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View className="emptyResult">
          <Text className="emptyResult__title">暂无处理记录</Text>
        </View>
      )}
    </View>
  );
}
