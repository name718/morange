import { View, Text, Navigator } from '@tarojs/components';
import { BRAND } from '@morange/constants';
import './index.scss';

interface FeatureCard {
  id: string;
  icon: string;
  title: string;
  description: string;
  url: string;
}

const FEATURES: FeatureCard[] = [
  {
    id: 'split',
    icon: '九',
    title: '9宫格切图',
    description: '将图片切分为多个小图',
    url: '/pages/split/index'
  },
  {
    id: 'merge',
    icon: '拼',
    title: '长图拼接',
    description: '多张图片拼接成长图',
    url: '/pages/merge/index'
  },
  {
    id: 'compress',
    icon: '压',
    title: '图片压缩',
    description: '压缩图片减小体积',
    url: '/pages/compress/index'
  },
  {
    id: 'resize',
    icon: '尺',
    title: '尺寸修改',
    description: '调整图片尺寸大小',
    url: '/pages/resize/index'
  },
  {
    id: 'crop',
    icon: '裁',
    title: '裁剪证件照',
    description: '头像、证件照和封面尺寸',
    url: '/pages/crop/index'
  },
  {
    id: 'frame',
    icon: '框',
    title: '边框留白',
    description: '添加留白、圆角和阴影',
    url: '/pages/frame/index'
  },
  {
    id: 'watermark',
    icon: '印',
    title: '图片水印',
    description: '添加文字或平铺水印',
    url: '/pages/watermark/index'
  },
  {
    id: 'convert',
    icon: '转',
    title: '格式转换',
    description: '图片格式互相转换',
    url: '/pages/convert/index'
  },
  {
    id: 'history',
    icon: '记',
    title: '处理记录',
    description: '查看最近生成的图片',
    url: '/pages/history/index'
  }
];

export default function IndexPage() {
  return (
    <View className="homePage">
      <View className="hero">
        <Text className="hero__eyebrow">{BRAND.nameEn} Image</Text>
        <Text className="hero__title">沐橙图片</Text>
        <Text className="hero__subtitle">本地处理，快速高效，保护隐私</Text>
      </View>

      <View className="featuresGrid">
        {FEATURES.map((feature) => (
          <Navigator key={feature.id} url={feature.url} className="featureCard">
            <Text className="featureCard__icon">{feature.icon}</Text>
            <Text className="featureCard__title">{feature.title}</Text>
            <Text className="featureCard__desc">{feature.description}</Text>
          </Navigator>
        ))}
      </View>

      <View className="footer">
        <Text className="footer__text">© 2026 {BRAND.name} · 本地处理不上传</Text>
      </View>
    </View>
  );
}
