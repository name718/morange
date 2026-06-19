import { Image, ScrollView, Text, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useMemo, useState } from 'react';
import {
  BRAND,
  FEATURED_APP_IDS,
  MINI_PROGRAMS,
  MiniProgramDefinition,
  TIER_LABELS,
  AppTier
} from '@morange/constants';
import { useFavoriteApps, useRecentApps } from '@morange/hooks';
import { MiniProgramCard } from '@morange/ui';
import { formatDateTime } from '@morange/utils';
import './index.scss';

const TIERS: AppTier[] = ['hub', 'fast', 'retention', 'deep', 'creative'];

function openApp(app: MiniProgramDefinition, recordRecentApp: (id: string) => void) {
  recordRecentApp(app.id);

  if (app.appId) {
    Taro.navigateToMiniProgram({
      appId: app.appId,
      path: app.path,
      fail: () => {
        Taro.navigateTo({ url: `/pages/detail/index?id=${app.id}` });
      }
    });
    return;
  }

  Taro.navigateTo({ url: `/pages/detail/index?id=${app.id}` });
}

export default function IndexPage() {
  const [activeTier, setActiveTier] = useState<AppTier>('fast');
  const { favoriteSet, toggleFavorite } = useFavoriteApps();
  const { recentApps, recordRecentApp } = useRecentApps();

  const featuredApps = useMemo(
    () => MINI_PROGRAMS.filter((app) => FEATURED_APP_IDS.includes(app.id as never)),
    []
  );

  const visibleApps = useMemo(
    () => MINI_PROGRAMS.filter((app) => app.tier === activeTier),
    [activeTier]
  );

  const favoriteApps = useMemo(
    () => MINI_PROGRAMS.filter((app) => favoriteSet.has(app.id)),
    [favoriteSet]
  );

  const recentMiniPrograms = useMemo(
    () =>
      recentApps
        .map((id) => MINI_PROGRAMS.find((app) => app.id === id))
        .filter((app): app is MiniProgramDefinition => Boolean(app)),
    [recentApps]
  );

  return (
    <ScrollView className="home" scrollY>
      <View className="hero">
        <View>
          <Text className="hero__eyebrow">{BRAND.nameEn} Suite</Text>
          <Text className="hero__title">{BRAND.name}工具矩阵</Text>
          <Text className="hero__subtitle">{BRAND.slogan}</Text>
        </View>
        <Image className="hero__logo" src="/assets/icons/box.png" mode="aspectFit" />
      </View>

      <View className="metrics">
        <View className="metric">
          <Text className="metric__value">{MINI_PROGRAMS.length}</Text>
          <Text className="metric__label">产品规划</Text>
        </View>
        <View className="metric">
          <Text className="metric__value">{featuredApps.length}</Text>
          <Text className="metric__label">优先上线</Text>
        </View>
        <View className="metric">
          <Text className="metric__value">{favoriteSet.size}</Text>
          <Text className="metric__label">我的收藏</Text>
        </View>
      </View>

      <View className="section">
        <View className="section__header">
          <Text className="section__title">优先搭建</Text>
          <Text className="section__hint">更新于 {formatDateTime()}</Text>
        </View>
        {featuredApps.map((app) => (
          <MiniProgramCard
            key={app.id}
            app={app}
            favorite={favoriteSet.has(app.id)}
            onOpen={(target) => openApp(target, recordRecentApp)}
            onToggleFavorite={toggleFavorite}
          />
        ))}
      </View>

      {favoriteApps.length > 0 && (
        <View className="section">
          <Text className="section__title">我的收藏</Text>
          <View className="chipGrid">
            {favoriteApps.map((app) => (
              <View key={app.id} className="appChip" onClick={() => openApp(app, recordRecentApp)}>
                <Image className="appChip__icon" src={app.icon} mode="aspectFit" />
                <Text className="appChip__name">{app.shortName}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {recentMiniPrograms.length > 0 && (
        <View className="section">
          <Text className="section__title">最近使用</Text>
          <View className="chipGrid">
            {recentMiniPrograms.map((app) => (
              <View
                key={app.id}
                className="appChip appChip--recent"
                onClick={() => openApp(app, recordRecentApp)}
              >
                <Image className="appChip__icon" src={app.icon} mode="aspectFit" />
                <Text className="appChip__name">{app.shortName}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View className="section">
        <Text className="section__title">产品梯队</Text>
        <ScrollView className="tabs" scrollX>
          {TIERS.map((tier) => (
            <Text
              key={tier}
              className={`tabs__item${activeTier === tier ? ' is-active' : ''}`}
              onClick={() => setActiveTier(tier)}
            >
              {TIER_LABELS[tier]}
            </Text>
          ))}
        </ScrollView>
        {visibleApps.map((app) => (
          <MiniProgramCard
            key={app.id}
            app={app}
            favorite={favoriteSet.has(app.id)}
            onOpen={(target) => openApp(target, recordRecentApp)}
            onToggleFavorite={toggleFavorite}
          />
        ))}
      </View>
    </ScrollView>
  );
}
