# 工程开发规范

## 适用范围

本规范适用于 Morange monorepo 内所有微信小程序应用和共享包。

## 技术栈

- 包管理：`pnpm` workspace。
- 小程序框架：Taro 4 + React 18 + TypeScript。
- 样式：SCSS，单位使用 Taro 默认 `px` 转换规则。
- 质量工具：TypeScript、ESLint、Prettier。

## 目录约定

```text
apps/
  box/                 # 沐橙工具箱，总入口小程序
  convert/             # 单个业务小程序，后续按此规则新增
packages/
  constants/           # 品牌、产品矩阵、枚举、静态配置
  hooks/               # Taro/React 可复用 hooks
  ui/                  # 跨小程序共享 UI 组件
  utils/               # 无业务耦合工具函数
tooling/
  eslint-config/       # 统一 ESLint 配置
  tsconfig/            # 统一 TypeScript 配置
docs/                  # 工程和设计规范
icon/                  # 原始图标资源
```

## 新增小程序命名

- 目录名使用英文短名：`apps/convert`、`apps/focus`、`apps/random`。
- 包名使用 `@morange/{shortName}`：`@morange/convert`。
- 小程序中文名固定为 `沐橙XX`，英文名固定为 `Morange XX`。
- 产品 ID 固定使用 `morange-{shortName}`，例如 `morange-convert`。
- 页面文件使用 Taro 约定：`src/pages/{page}/index.tsx`、`index.scss`、`index.config.ts`。

## 产品注册表

所有小程序必须先登记到 `packages/constants/src/index.ts` 的 `MINI_PROGRAMS`。

必须填写：

- `id`：全局唯一产品 ID。
- `appId`：上线前必须补齐；未上线阶段可以缺省。
- `name`、`nameEn`、`shortName`：保持沐橙命名体系。
- `icon`：应用内资源路径，统一放在 `src/assets/icons`。
- `tier`、`status`：用于工具箱筛选和展示。
- `summary`、`features`、`backendRoadmap`：用于详情页、运营文案和后续扩展判断。
- `accent`：产品辅助色，只能作为点缀，不得替代品牌主色。

## 共享代码规则

- 能被两个以上小程序复用的代码必须进入 `packages/*`。
- `packages/constants` 只放静态配置、枚举和类型，不引用 Taro API。
- `packages/utils` 可以封装 Taro 无关工具；如封装 Taro 存储，函数必须容错。
- `packages/hooks` 放 React/Taro hooks，不写 UI。
- `packages/ui` 放跨小程序视觉组件，组件不得硬编码单个业务小程序逻辑。

## React 和 Taro 编码规则

- 组件使用函数组件。
- Props 必须声明 TypeScript 类型。
- 页面状态优先本地 `useState`；跨页面或跨小程序状态先抽 hooks，不直接引入全局状态库。
- Taro API 调用必须处理失败分支，尤其是存储、跳转、授权、保存图片。
- 小程序间跳转优先走 `appId + path`，未配置 `appId` 时必须降级到详情页或提示，不允许静默失败。

## 本地存储规则

- 存储 key 统一登记到 `STORAGE_KEYS`。
- key 必须带 `morange:` 前缀。
- 读取本地存储必须有 fallback。
- 写入失败必须给用户可理解提示，不能吞掉关键错误。
- 涉及隐私、密码、账本等敏感数据，上线前必须单独做加密和数据删除方案评审。

## 样式代码规则

- 全局基础样式放在各 app 的 `src/app.scss`。
- 跨小程序组件样式 class 使用 `morange-` 前缀。
- 页面私有 class 使用语义名，如 `.hero`、`.section`、`.metric`。
- 组件样式推荐 BEM：`.morange-card__title`、`.morange-card--featured`。
- 禁止在多个 app 内复制大段样式；超过两个页面复用时抽到 `packages/ui` 或后续主题包。

## 质量门禁

提交前至少执行：

```bash
pnpm type-check
pnpm --filter @morange/box build
```

新增目标小程序后，必须补充对应构建命令，例如：

```bash
pnpm --filter @morange/convert build
```

## 禁止项

- 禁止绕过 `packages/constants` 私自维护产品列表。
- 禁止同一功能在多个 app 复制实现。
- 禁止将密钥、AppSecret、服务端 token 写入前端代码。
- 禁止未处理失败分支的 `navigateToMiniProgram`、`setStorageSync`、授权 API。
- 禁止页面样式脱离沐橙品牌主视觉。
