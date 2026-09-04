// ============================================================
// 横屏空白微信小游戏 · 入口文件
// 横屏由 game.json 的 deviceOrientation: "landscape" 锁定
// 后续玩法内容统一在 DESIGN_WIDTH × DESIGN_HEIGHT 坐标系内绘制
// ============================================================

const canvas = wx.createCanvas();
const ctx = canvas.getContext('2d');

// 设计分辨率（横屏 16:9），后续所有游戏坐标按此设计
const DESIGN_WIDTH = 1280;
const DESIGN_HEIGHT = 720;

let screenWidth = DESIGN_WIDTH;
let screenHeight = DESIGN_HEIGHT;
let scale = 1;
let offsetX = 0;
let offsetY = 0;

function updateViewport() {
  const info = wx.getSystemInfoSync();
  const w = info.windowWidth;
  const h = info.windowHeight;

  // 横屏下 windowWidth 为长边；若个别预览场景出现竖屏，交换保证始终横向
  screenWidth = Math.max(w, h);
  screenHeight = Math.min(w, h);

  canvas.width = w;
  canvas.height = h;

  // 等比缩放 + 居中适配（letterbox），避免拉伸变形
  scale = Math.min(w / DESIGN_WIDTH, h / DESIGN_HEIGHT);
  offsetX = (w - DESIGN_WIDTH * scale) / 2;
  offsetY = (h - DESIGN_HEIGHT * scale) / 2;
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 画布底色
  ctx.fillStyle = '#0b1420';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 以设计分辨率为基准居中绘制内容（后续把游戏画面画在这个 save/restore 之间）
  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);

  ctx.fillStyle = '#16222f';
  ctx.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);

  ctx.fillStyle = '#e8e4d8';
  ctx.font = '36px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('横屏小游戏 · 空白骨架', DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2 - 10);

  ctx.fillStyle = '#8a94a6';
  ctx.font = '22px sans-serif';
  ctx.fillText('已在横屏模式 · 等待填充玩法', DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2 + 30);

  ctx.restore();
}

function loop() {
  render();
  requestAnimationFrame(loop);
}

wx.onWindowResize(updateViewport);
updateViewport();
loop();
