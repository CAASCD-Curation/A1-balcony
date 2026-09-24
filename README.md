# 阳台 · 向内到向外 / Balcony Archive

一个以「阳台」为主题的交互式影像档案网站。232 张图像按公共性尺度排成一条连续的透视长廊：捏合或向下滚动，画面变小、变远，从私密的日常角落一路穿到公共的形式想象——「向内到向外」。

## 快速开始

```bash
npm install
npm run dev      # 开发服务器（默认端口 7100）
npm run build    # 构建到 dist/
npm run preview  # 预览构建产物
```

## 操作方式

| 操作 | 效果 |
| --- | --- |
| 滚轮 / 双指捏合（张开、捏合） | 沿档案长廊向内 / 向外移动 |
| 方向键、PageUp / PageDown、Home / End | 逐条 / 跳 10 条 / 跳到首尾 |
| 点击当前图像 | 弹出词条信息（标题、原名、来源、公共性） |
| 点击四周边签（天气与情绪 / 材质与历史 / 自我 / 他者） | 展开对应阅读面板 |
| Esc | 关闭面板与气泡 |

## 档案数据

`src/data/entries.js` 收录 232 个条目，每个条目包含：`id`、`category`、`title`、`original`（原名）、`author`、`year`，以及四段文本：`weather`（天气与情绪）、`material`（材质与历史）、`self`（自我）、`other`（他者），另有 `publicness` 公共性评分（1–10，越高越公共：1–3 私密，4–6 中性，7–10 公共）。

分类分布：

- **社会素材**（59）：封阳台、晾衣、堆物、养蜂、办公等当代生活场景
- **文学意象**（49）：《罗密欧与朱丽叶》《倾城之恋》等作品中的阳台
- **经典艺术档案**（61）：绘画、摄影中的阳台图像
- **形式灵感**（63）：建筑与空间形式参考

## 技术架构

- **Vue 3 + Vite**：无路由、无后端，单页沉浸视图
- **`src/composables/useBalcony.js`**：核心状态机与动画循环——
  - 以「目标位置 → 弹性插值 → 当前位置」驱动透视缩放，画面面积随索引呈幂次增长（越向外越"大"）
  - 图像缓存预载（前后各 5 条），并裁剪 18 条以外的解码缓存控制内存
  - 统一处理滚轮、触控捏合、Safari 手势事件与键盘导航
  - 尊重 `prefers-reduced-motion`，无障碍支持（aria-live 播报、面板焦点管理）
- **组件**（`src/components/`）：`PerspectiveSeams`（透视缝线）、`PictureFrame`（主画面）、`EdgeLabel`（边签）、`CaptionTip`（词条气泡）、`ReadingPanel`（阅读面板）
- 自定义字体：汉仪旗黑 40S、Univers Condensed（`public/assets/fonts/`）

## 数据标注

`labeling/`（未入库）是公共性评分的标注工作目录：12 张评分表截图（`sheets/`）、`publicness_scores.json` 原始分数、`apply_scores.cjs` 打标脚本（将分数按序写入 `entries.js` 并回读校验）与 `entries_summary.txt` 条目总览。重新标注时修改 `publicness_scores.json` 后运行 `node labeling/apply_scores.cjs` 即可。
