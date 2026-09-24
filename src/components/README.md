# src/components · 视图组件

五个无状态展示组件，由 `App.vue` 组合、由 `useBalcony.js` 集中驱动。组件本身不持有业务逻辑，只接收 props 渲染并向上抛事件；几何位置（`position` / `width` / `height`）均由状态机计算后以像素样式传入。

## 组件一览

| 组件 | 职责 | 关键 props | 事件 |
| --- | --- | --- | --- |
| `PerspectiveSeams.vue` | 全屏 SVG 透视缝线：从四角指向主画面四角，强化「空间纵深」 | `d`（path 路径） | — |
| `PictureFrame.vue` | 主画面：当前条目的图像，本身是一个 `<button>` | `width` `height` `src` `alt` `imageOk` `expanded` `ariaLabel` | `select`（点击，透传原生事件） |
| `EdgeLabel.vue` | 悬浮在四边的阅读入口标签；`pending` 时渲染为纯文本占位（自我 / 他者两签暂未启用） | `label` `pending` `expanded` `position` | `toggle` |
| `CaptionTip.vue` | 点击图像后弹出的词条气泡（标题｜原名｜来源｜公共性） | `visible` `text` `position` | — |
| `ReadingPanel.vue` | 边签展开后的阅读面板，带标题与关闭按钮 | `open` `title` `text` `position` | `close` |

## 数据流

```
useBalcony.js（状态机 / 动画循环）
        │  state（frameWidth、seamsD、labelStyles、panelStyle……）
        ▼
App.vue ──组合──▶ 五个展示组件（props 下行，事件上行）
```

## 无障碍约定

- `PictureFrame` 用真实 `<button>` 承载图像，`aria-expanded` 同步气泡开合
- `EdgeLabel` 通过 `aria-controls="reading"` 与阅读面板关联
- `CaptionTip` 使用 `role="status"`（即系 polite live region）
- `ReadingPanel` 使用 `aria-labelledby="reading-title"`
- 状态机经 `aria-live="polite"` 区域播报「序号 / 总数 · 标题」

## 样式说明

组件只负责结构，全部样式集中在 `src/main.css`，以各组件的根元素 id / class（`#perspective`、`#picture`、`#image`、`#caption`、`#reading`、`.edge-label` 等）为锚点。修改外观请改 `main.css`，不要在组件内加 scoped 样式。
