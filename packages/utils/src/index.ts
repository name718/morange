import Taro from '@tarojs/taro';

export function safeGetStorage<T>(key: string, fallback: T): T {
  try {
    const value = Taro.getStorageSync<T>(key);
    return value === '' || value === undefined || value === null ? fallback : value;
  } catch {
    return fallback;
  }
}

export function safeSetStorage<T>(key: string, value: T): void {
  try {
    Taro.setStorageSync(key, value);
  } catch {
    Taro.showToast({ title: '本地存储失败', icon: 'none' });
  }
}

export function toggleArrayItem<T>(items: T[], item: T): T[] {
  return items.includes(item) ? items.filter((value) => value !== item) : [item, ...items];
}

export function uniqByRecent(items: string[], next: string, limit = 8): string[] {
  return [next, ...items.filter((item) => item !== next)].slice(0, limit);
}

export function formatDateTime(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}
