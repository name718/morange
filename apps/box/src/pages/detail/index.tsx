import { Image, Text, View } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { getMiniProgramById, STATUS_LABELS, TIER_LABELS } from '@morange/constants';
import { useFavoriteApps, useRecentApps } from '@morange/hooks';
import './index.scss';

export default function DetailPage() {
  const router = useRouter();
  const app = getMiniProgramById(String(router.params.id || ''));
  const { favoriteSet, toggleFavorite } = useFavoriteApps();
  const { recordRecentApp } = useRecentApps();

  if (!app) {
    return (
      <View className="detail detail--empty">
        <Text className="detail__title">未找到产品</Text>
        <Text className="detail__summary">请返回工具箱重新选择。</Text>
      </View>
    );
  }

  const openMiniProgram = () => {
    recordRecentApp(app.id);
    if (!app.appId) {
      Taro.showToast({ title: '待配置小程序 AppID', icon: 'none' });
      return;
    }

    Taro.navigateToMiniProgram({ appId: app.appId, path: app.path });
  };

  return (
    <View className="detail">
      <View className="detail__hero" style={{ backgroundColor: app.accent }}>
        <Image className="detail__icon" src={app.icon} mode="aspectFit" />
        <Text className="detail__name">{app.name}</Text>
        <Text className="detail__nameEn">{app.nameEn}</Text>
      </View>

      <View className="detail__panel">
        <View className="detail__meta">
          <Text className="detail__pill">{TIER_LABELS[app.tier]}</Text>
          <Text className="detail__pill detail__pill--light">{STATUS_LABELS[app.status]}</Text>
        </View>
        <Text className="detail__summary">{app.summary}</Text>

        <Text className="detail__sectionTitle">核心功能</Text>
        {app.features.map((feature) => (
          <Text key={feature} className="detail__feature">
            {feature}
          </Text>
        ))}

        <Text className="detail__sectionTitle">后端拓展</Text>
        <Text className="detail__roadmap">{app.backendRoadmap}</Text>

        <View className="detail__actions">
          <Text className="detail__button" onClick={openMiniProgram}>
            打开小程序
          </Text>
          <Text
            className={`detail__button detail__button--ghost${
              favoriteSet.has(app.id) ? ' is-active' : ''
            }`}
            onClick={() => toggleFavorite(app.id)}
          >
            {favoriteSet.has(app.id) ? '取消收藏' : '加入收藏'}
          </Text>
        </View>
      </View>
    </View>
  );
}
