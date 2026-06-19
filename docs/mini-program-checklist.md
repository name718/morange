# 新增小程序清单

## 1. 产品登记

- 在 `packages/constants/src/index.ts` 添加 `MINI_PROGRAMS` 配置。
- 确认 `id` 使用 `morange-{shortName}`。
- 填写 `name`、`nameEn`、`shortName`、`summary`、`features`、`backendRoadmap`。
- 设置 `tier` 和 `status`。
- 准备图标，原始图标放 `icon/`，应用内图标放 `apps/{app}/src/assets/icons`。

## 2. 应用 scaffold

- 新建 `apps/{shortName}`。
- 包名使用 `@morange/{shortName}`。
- 复制并调整 Taro 配置、Babel 配置、ESLint 配置、tsconfig。
- 页面至少包含 `src/pages/index/index.tsx`、`index.scss`、`index.config.ts`。
- 全局样式从工具箱风格继承，不重新发明视觉体系。

## 3. 样式落地

- 页面背景使用暖色渐变。
- Hero 使用品牌橙或深暖色渐变。
- 主功能区使用圆角卡片。
- 主按钮使用品牌橙。
- 产品辅助色只用于局部图标底、状态或强调。
- 页面内至少复用一个 `packages/ui` 组件，除非该小程序没有列表或卡片结构。

## 4. 数据与存储

- 本地存储 key 必须登记到 `STORAGE_KEYS`。
- 所有存储读取必须有 fallback。
- 涉及列表数据时必须考虑空状态。
- 涉及删除、清空、重置必须二次确认。

## 5. 工具箱接入

- 在工具箱能看到该产品卡片。
- 未配置真实 `appId` 时，点击进入详情页。
- 配置真实 `appId` 后，点击可跳转目标小程序。
- 收藏和最近使用能记录该产品。

## 6. 验证

至少执行：

```bash
pnpm type-check
pnpm --filter @morange/{shortName} build
pnpm --filter @morange/box build
```

## 7. 上线前检查

- 微信开发者工具预览无明显样式错位。
- 首页首屏信息完整。
- 空状态、错误状态、无权限状态可理解。
- 没有 AppSecret、私钥、测试 token。
- 产品名称、图标、描述与工具箱一致。
