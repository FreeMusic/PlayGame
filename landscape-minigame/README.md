# 横屏空白微信小游戏骨架

一个可运行的原生微信小游戏骨架（零依赖、无引擎），进入即横屏。

## 如何运行

1. 打开「微信开发者工具」。
2. 选择「导入项目」，目录指向本文件夹（`landscape-minigame`）。
3. AppID 选择「测试号」或填入你自己的 AppID（当前 `project.config.json` 用 `touristappid` 游客模式）。
4. 编译即可看到横屏画面 + 居中提示文字。

## 横屏配置

- **关键配置**：`game.json` 里的 `deviceOrientation: "landscape"`，这是进入游戏即横屏的核心开关。
- **代码兜底**：`game.js` 的 `updateViewport()` 会自动取长边为宽、短边为高，个别预览场景出现竖屏也会自动纠正。

## 目录结构

```
landscape-minigame/
├── game.js              # 入口：canvas 渲染循环 + 横屏等比适配
├── game.json            # 游戏配置（横屏锁）
└── project.config.json  # 微信开发者工具项目配置
```

## 后续开发约定

- 游戏画面统一绘制在 `1280 × 720` 设计坐标系内（`render()` 的 `save/restore` 之间）。
- 当前居中的提示文字仅用于验证横屏生效，填充玩法后删除即可。
- 如需 TypeScript，可在本骨架之上加一层编译（如 tsc / esbuild），原生 API 均可用。
