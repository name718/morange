import Taro from '@tarojs/taro';
import type { ProcessResult } from '@/types';

const HISTORY_KEY = 'morange:image:history';
const MAX_HISTORY = 20;

export interface HistoryItem extends ProcessResult {
  id: string;
  title: string;
  action: string;
  createdAt: number;
}

export function getHistory(): HistoryItem[] {
  try {
    const items = Taro.getStorageSync<HistoryItem[]>(HISTORY_KEY);
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

export function addHistory(
  action: string,
  result: ProcessResult,
  title: string = '处理结果'
): HistoryItem {
  const item: HistoryItem = {
    ...result,
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    action,
    title,
    createdAt: Date.now()
  };
  const next = [item, ...getHistory()].slice(0, MAX_HISTORY);
  Taro.setStorageSync(HISTORY_KEY, next);
  return item;
}

export function clearHistory() {
  Taro.removeStorageSync(HISTORY_KEY);
}
