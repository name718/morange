export const BRAND = {
  name: '沐橙',
  nameEn: 'Morange',
  slogan: '把日常工具收进一个轻巧的小程序家族',
  color: '#E66C32',
  colorLight: '#F3A06F',
  colorDark: '#A9471F'
} as const;

export const STORAGE_KEYS = {
  favorites: 'morange:favorites',
  recentApps: 'morange:recent-apps'
} as const;

export type AppStatus = 'online' | 'building' | 'planned';
export type AppTier = 'hub' | 'fast' | 'retention' | 'deep' | 'creative';

export interface MiniProgramDefinition {
  id: string;
  appId?: string;
  name: string;
  nameEn: string;
  shortName: string;
  icon: string;
  path: string;
  tier: AppTier;
  status: AppStatus;
  tags: string[];
  summary: string;
  features: string[];
  backendRoadmap: string;
  accent: string;
}

export const TIER_LABELS: Record<AppTier, string> = {
  hub: '家族中枢',
  fast: '极速上线',
  retention: '高频留存',
  deep: '深度价值',
  creative: '创意拓展'
};

export const STATUS_LABELS: Record<AppStatus, string> = {
  online: '已接入',
  building: '搭建中',
  planned: '规划中'
};

export const MINI_PROGRAMS: MiniProgramDefinition[] = [
  {
    id: 'morange-box',
    name: '沐橙工具箱',
    nameEn: 'Morange Box',
    shortName: '工具箱',
    icon: '/assets/icons/box.png',
    path: '/pages/index/index',
    tier: 'hub',
    status: 'online',
    tags: ['总入口', '收藏', '最近使用'],
    summary: '沐橙全系列工具的统一导航入口，负责产品分发、收藏和使用记录。',
    features: ['工具分类展示', '一键跳转小程序', '收藏常用工具', '最近使用记录'],
    backendRoadmap: '后续接入账号体系、云端同步收藏和个性化推荐。',
    accent: '#E66C32'
  },
  {
    id: 'morange-convert',
    appId: 'wx36628617f47d9adf',
    name: '沐橙换算',
    nameEn: 'Morange Convert',
    shortName: '换算',
    icon: '/assets/icons/convert.png',
    path: '/pages/index/index',
    tier: 'fast',
    status: 'online',
    tags: ['单位换算', '离线可用', '纯前端'],
    summary: '长度、重量、面积、体积、时间、进制和像素等常用单位换算。',
    features: ['常用单位换算', '历史记录', '常用单位置顶'],
    backendRoadmap: '可拓展实时汇率、金价等联网数据。',
    accent: '#2f80ed'
  },
  {
    id: 'morange-focus',
    name: '沐橙番茄',
    nameEn: 'Morange Focus',
    shortName: '番茄',
    icon: '/assets/icons/focus.png',
    path: '/pages/index/index',
    tier: 'fast',
    status: 'building',
    tags: ['专注计时', '本地统计', '提醒'],
    summary: '标准番茄钟、休息提醒、本地专注统计和历史日历。',
    features: ['25 分钟专注', '休息提醒', '每日统计', '专注历史'],
    backendRoadmap: '可拓展云同步、排行榜和白噪音音频库。',
    accent: '#eb5757'
  },
  {
    id: 'morange-random',
    name: '沐橙随机',
    nameEn: 'Morange Random',
    shortName: '随机',
    icon: '/assets/icons/random.png',
    path: '/pages/index/index',
    tier: 'fast',
    status: 'building',
    tags: ['抽签', '转盘', '随机选择'],
    summary: '随机数字、抽签分组、骰子转盘、真心话大冒险和选择器。',
    features: ['随机数字', '抽签分组', '骰子转盘', '内置题库'],
    backendRoadmap: '可拓展自定义题库云保存和多人联机抽签。',
    accent: '#9b51e0'
  },
  {
    id: 'morange-bill',
    name: '沐橙记账',
    nameEn: 'Morange Bill',
    shortName: '记账',
    icon: '/assets/icons/bill.png',
    path: '/pages/index/index',
    tier: 'retention',
    status: 'planned',
    tags: ['收支', '统计', '图表'],
    summary: '收支录入、分类标签、日期筛选和月度统计可视化。',
    features: ['收支录入', '分类标签', '月度统计', '图表分析'],
    backendRoadmap: '可拓展多设备同步、预算提醒和多账本。',
    accent: '#27ae60'
  },
  {
    id: 'morange-days',
    name: '沐橙纪念日',
    nameEn: 'Morange Days',
    shortName: '纪念日',
    icon: '/assets/icons/days.png',
    path: '/pages/index/index',
    tier: 'retention',
    status: 'planned',
    tags: ['倒计时', '生日', '置顶'],
    summary: '生日、节日、考试和旅行等自定义倒计时或正数日。',
    features: ['日期管理', '倒数/正数日', '分类筛选', '重要置顶'],
    backendRoadmap: '可拓展云备份、推送提醒和年度日历。',
    accent: '#f2994a'
  },
  {
    id: 'morange-note',
    name: '沐橙便签',
    nameEn: 'Morange Note',
    shortName: '便签',
    icon: '/assets/icons/note.png',
    path: '/pages/index/index',
    tier: 'retention',
    status: 'planned',
    tags: ['笔记', '标签', '搜索'],
    summary: '文本笔记、标签分类、置顶、关键词搜索和本地图片。',
    features: ['笔记增删改查', '标签分类', '置顶', '关键词搜索'],
    backendRoadmap: '可拓展云同步、富文本、加密和多端编辑。',
    accent: '#f2c94c'
  },
  {
    id: 'morange-word',
    name: '沐橙词本',
    nameEn: 'Morange Word',
    shortName: '词本',
    icon: '/assets/icons/word.png',
    path: '/pages/index/index',
    tier: 'deep',
    status: 'planned',
    tags: ['背单词', '生词本', '复习'],
    summary: '内置基础词库、单词背诵、生词本、记忆标记和复习提醒。',
    features: ['内置词库', '背诵进度', '生词本', '复习提醒'],
    backendRoadmap: '可拓展云端词库、自定义词本和智能复习。',
    accent: '#56ccf2'
  }
];

export const FEATURED_APP_IDS = ['morange-convert', 'morange-focus', 'morange-random'] as const;

export function getMiniProgramById(id: string): MiniProgramDefinition | undefined {
  return MINI_PROGRAMS.find((app) => app.id === id);
}

export function getMiniProgramsByTier(tier: AppTier): MiniProgramDefinition[] {
  return MINI_PROGRAMS.filter((app) => app.tier === tier);
}
