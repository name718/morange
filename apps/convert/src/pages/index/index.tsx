import { Button, Input, ScrollView, Text, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useMemo, useState } from 'react';
import { BRAND } from '@morange/constants';
import { safeGetStorage, safeSetStorage, uniqByRecent } from '@morange/utils';
import {
  convertValue,
  getCategory,
  getUnit,
  normalizeNumericInput,
  parseInputValue,
  UNIT_CATEGORIES,
  UnitCategoryId
} from '@/lib/conversion';
import './index.scss';

const STORAGE = {
  category: 'morange:convert:category',
  favorites: 'morange:convert:favorites',
  recent: 'morange:convert:recent',
  unitByCategory: 'morange:convert:unit-by-category'
} as const;

type UnitByCategory = Partial<Record<UnitCategoryId, string>>;

interface FavoritePair {
  categoryId: UnitCategoryId;
  unitId: string;
}

function pairKey(pair: FavoritePair): string {
  return `${pair.categoryId}:${pair.unitId}`;
}

function parsePairKey(key: string): FavoritePair | null {
  const [categoryId, unitId] = key.split(':') as [UnitCategoryId | undefined, string | undefined];
  if (!categoryId || !unitId || !UNIT_CATEGORIES.some((category) => category.id === categoryId)) {
    return null;
  }
  return { categoryId, unitId };
}

function readInitialCategory(): UnitCategoryId {
  const stored = safeGetStorage<UnitCategoryId>(STORAGE.category, 'length');
  return UNIT_CATEGORIES.some((category) => category.id === stored) ? stored : 'length';
}

export default function IndexPage() {
  const [activeCategoryId, setActiveCategoryId] = useState<UnitCategoryId>(readInitialCategory);
  const [unitByCategory, setUnitByCategory] = useState<UnitByCategory>(() =>
    safeGetStorage<UnitByCategory>(STORAGE.unitByCategory, {})
  );
  const [inputValue, setInputValue] = useState('1');
  const [favoriteKeys, setFavoriteKeys] = useState<string[]>(() =>
    safeGetStorage<string[]>(STORAGE.favorites, [])
  );
  const [recentKeys, setRecentKeys] = useState<string[]>(() =>
    safeGetStorage<string[]>(STORAGE.recent, [])
  );

  const activeCategory = useMemo(() => getCategory(activeCategoryId), [activeCategoryId]);
  const activeUnitId = unitByCategory[activeCategoryId] || activeCategory.baseUnitId;
  const activeUnit = useMemo(
    () => getUnit(activeCategory, activeUnitId),
    [activeCategory, activeUnitId]
  );
  const parsedValue = useMemo(() => parseInputValue(inputValue), [inputValue]);
  const results = useMemo(
    () => (parsedValue === null ? [] : convertValue(activeCategory, parsedValue, activeUnit.id)),
    [activeCategory, activeUnit.id, parsedValue]
  );

  const favoritePairs = useMemo(
    () =>
      favoriteKeys
        .map(parsePairKey)
        .filter((pair): pair is FavoritePair => Boolean(pair))
        .slice(0, 8),
    [favoriteKeys]
  );
  const recentPairs = useMemo(
    () =>
      recentKeys
        .map(parsePairKey)
        .filter((pair): pair is FavoritePair => Boolean(pair))
        .slice(0, 8),
    [recentKeys]
  );

  const activePairKey = pairKey({ categoryId: activeCategoryId, unitId: activeUnit.id });
  const topResults = results.filter((result) => result.unit.id !== activeUnit.id).slice(0, 5);

  const selectCategory = (categoryId: UnitCategoryId) => {
    setActiveCategoryId(categoryId);
    safeSetStorage(STORAGE.category, categoryId);
    recordRecent(categoryId, unitByCategory[categoryId] || getCategory(categoryId).baseUnitId);
  };

  const selectUnit = (unitId: string) => {
    const next = { ...unitByCategory, [activeCategoryId]: unitId };
    setUnitByCategory(next);
    safeSetStorage(STORAGE.unitByCategory, next);
    recordRecent(activeCategoryId, unitId);
  };

  const recordRecent = (categoryId: UnitCategoryId, unitId: string) => {
    setRecentKeys((current) => {
      const next = uniqByRecent(current, pairKey({ categoryId, unitId }), 10);
      safeSetStorage(STORAGE.recent, next);
      return next;
    });
  };

  const toggleFavorite = () => {
    const exists = favoriteKeys.includes(activePairKey);
    const next = exists
      ? favoriteKeys.filter((key) => key !== activePairKey)
      : [activePairKey, ...favoriteKeys].slice(0, 12);
    setFavoriteKeys(next);
    safeSetStorage(STORAGE.favorites, next);
    Taro.showToast({ title: exists ? '已取消收藏' : '已加入常用', icon: 'none' });
  };

  const applyPair = (pair: FavoritePair) => {
    const category = getCategory(pair.categoryId);
    const unit = getUnit(category, pair.unitId);
    setActiveCategoryId(category.id);
    safeSetStorage(STORAGE.category, category.id);
    const next = { ...unitByCategory, [category.id]: unit.id };
    setUnitByCategory(next);
    safeSetStorage(STORAGE.unitByCategory, next);
    recordRecent(category.id, unit.id);
  };

  const copyResult = (value: string, unitName: string, symbol: string) => {
    Taro.setClipboardData({
      data: `${value} ${symbol}`,
      success: () => Taro.showToast({ title: `已复制${unitName}`, icon: 'none' }),
      fail: () => Taro.showToast({ title: '复制失败，请重试', icon: 'none' })
    });
  };

  const clearInput = () => {
    setInputValue('');
  };

  const appendInput = (value: string) => {
    const next = normalizeNumericInput(`${inputValue}${value}`);
    setInputValue(next);
  };

  const toggleSign = () => {
    const next = inputValue.startsWith('-') ? inputValue.slice(1) : `-${inputValue || '0'}`;
    setInputValue(normalizeNumericInput(next));
  };

  return (
    <ScrollView className="convert" scrollY>
      <View className="hero">
        <View>
          <Text className="hero__eyebrow">{BRAND.nameEn} Convert</Text>
          <Text className="hero__title">沐橙换算</Text>
          <Text className="hero__subtitle">常用单位一屏换算，离线可用，结果清楚。</Text>
        </View>
      </View>

      <ScrollView className="categoryTabs" scrollX>
        {UNIT_CATEGORIES.map((category) => (
          <View
            key={category.id}
            className={`categoryTab${category.id === activeCategoryId ? ' is-active' : ''}`}
            onClick={() => selectCategory(category.id)}
          >
            <Text className="categoryTab__icon">{category.icon}</Text>
            <Text className="categoryTab__name">{category.name}</Text>
          </View>
        ))}
      </ScrollView>

      <View className="panel inputPanel">
        <View className="panel__header">
          <View>
            <Text className="panel__title">{activeCategory.name}换算</Text>
            <Text className="panel__desc">{activeCategory.description}</Text>
          </View>
          <Button
            className={`favoriteButton${favoriteKeys.includes(activePairKey) ? ' is-active' : ''}`}
            onClick={toggleFavorite}
          >
            {favoriteKeys.includes(activePairKey) ? '常用' : '收藏'}
          </Button>
        </View>

        <View className="inputBox">
          <Input
            className="inputBox__field"
            type="text"
            value={inputValue}
            placeholder="输入数值"
            placeholderClass="inputBox__placeholder"
            onInput={(event) => {
              const next = normalizeNumericInput(String(event.detail.value));
              setInputValue(next);
              return next;
            }}
          />
          <Button className="inputBox__clear" onClick={clearInput}>
            清空
          </Button>
        </View>

        <View className="inputTools">
          <Button className="inputTool" onClick={() => appendInput('.')}>
            小数点
          </Button>
          <Button className="inputTool" onClick={toggleSign}>
            正/负
          </Button>
          <Button className="inputTool" onClick={() => appendInput('00')}>
            00
          </Button>
        </View>

        <ScrollView className="unitPicker" scrollX>
          {activeCategory.units.map((unit) => (
            <View
              key={unit.id}
              className={`unitPill${unit.id === activeUnit.id ? ' is-active' : ''}`}
              onClick={() => selectUnit(unit.id)}
            >
              <Text className="unitPill__name">{unit.name}</Text>
              <Text className="unitPill__symbol">{unit.symbol}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <View className="answerCard">
        <Text className="answerCard__label">当前输入</Text>
        <Text className="answerCard__value">
          {inputValue || '0'} {activeUnit.symbol}
        </Text>
        <Text className="answerCard__hint">点击任意结果可复制</Text>
      </View>

      {topResults.length > 0 && (
        <View className="section">
          <Text className="section__title">常看结果</Text>
          {topResults.map((result) => (
            <View
              key={result.unit.id}
              className="resultRow resultRow--featured"
              onClick={() => copyResult(result.displayValue, result.unit.name, result.unit.symbol)}
            >
              <View>
                <Text className="resultRow__value">{result.displayValue}</Text>
                <Text className="resultRow__name">{result.unit.name}</Text>
              </View>
              <Text className="resultRow__symbol">{result.unit.symbol}</Text>
            </View>
          ))}
        </View>
      )}

      {favoritePairs.length > 0 && (
        <View className="section">
          <Text className="section__title">常用单位</Text>
          <View className="quickGrid">
            {favoritePairs.map((pair) => {
              const category = getCategory(pair.categoryId);
              const unit = getUnit(category, pair.unitId);
              return (
                <View key={pairKey(pair)} className="quickItem" onClick={() => applyPair(pair)}>
                  <Text className="quickItem__category">{category.name}</Text>
                  <Text className="quickItem__unit">{unit.name}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {recentPairs.length > 0 && (
        <View className="section">
          <Text className="section__title">最近使用</Text>
          <ScrollView className="recentList" scrollX>
            {recentPairs.map((pair) => {
              const category = getCategory(pair.categoryId);
              const unit = getUnit(category, pair.unitId);
              return (
                <View key={pairKey(pair)} className="recentChip" onClick={() => applyPair(pair)}>
                  {category.name} · {unit.name}
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}

      <View className="section resultSection">
        <Text className="section__title">全部结果</Text>
        {parsedValue === null ? (
          <View className="emptyState">
            <Text className="emptyState__title">输入一个数值开始换算</Text>
            <Text className="emptyState__desc">支持小数和负数，结果会自动同步刷新。</Text>
          </View>
        ) : (
          results.map((result) => (
            <View
              key={result.unit.id}
              className={`resultRow${result.unit.id === activeUnit.id ? ' is-source' : ''}`}
              onClick={() => copyResult(result.displayValue, result.unit.name, result.unit.symbol)}
            >
              <View>
                <Text className="resultRow__value">{result.displayValue}</Text>
                <Text className="resultRow__name">{result.unit.name}</Text>
              </View>
              <Text className="resultRow__symbol">{result.unit.symbol}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
