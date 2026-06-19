import { Image, Text, View } from '@tarojs/components';
import type { MiniProgramDefinition } from '@morange/constants';
import { STATUS_LABELS } from '@morange/constants';

export interface MiniProgramCardProps {
  app: MiniProgramDefinition;
  favorite?: boolean;
  onOpen?: (app: MiniProgramDefinition) => void;
  onToggleFavorite?: (id: string) => void;
}

export function MiniProgramCard({
  app,
  favorite = false,
  onOpen,
  onToggleFavorite
}: MiniProgramCardProps) {
  return (
    <View className="morange-card" onClick={() => onOpen?.(app)}>
      <View className="morange-card__iconWrap" style={{ backgroundColor: `${app.accent}18` }}>
        <Image className="morange-card__icon" src={app.icon} mode="aspectFit" />
      </View>
      <View className="morange-card__body">
        <View className="morange-card__titleRow">
          <Text className="morange-card__title">{app.name}</Text>
          <Text className={`morange-card__status morange-card__status--${app.status}`}>
            {STATUS_LABELS[app.status]}
          </Text>
        </View>
        <Text className="morange-card__summary">{app.summary}</Text>
        <View className="morange-card__tags">
          {app.tags.slice(0, 3).map((tag) => (
            <Text key={tag} className="morange-card__tag">
              {tag}
            </Text>
          ))}
        </View>
      </View>
      <Text
        className={`morange-card__favorite${favorite ? ' is-active' : ''}`}
        onClick={(event) => {
          event.stopPropagation();
          onToggleFavorite?.(app.id);
        }}
      >
        {favorite ? '已收藏' : '收藏'}
      </Text>
    </View>
  );
}
