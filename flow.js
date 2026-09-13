/* ════════════════════════════════════════════════════════
   flow.js — 2.5D 浮动图像群渲染与动效

   结构：
     #scene（preserve-3d，整体等距旋转 + 视差 / 呼吸摆动）
       .slot（平面定位 + 飞入/飞出，WAAPI）
         .slab（图板：图片 + 标签条；CSS 无限漂浮 bob）
         .slab::after（厚度侧面，分类色暗边）

   动效：
   · 进入：图板从远处（高 Z）带随机延迟飞入就位
   · 漂浮：每块独立周期/相位/振幅的缓慢上下漂移
   · 场景：无操作时缓慢呼吸摇摆；鼠标移动时平滑视差跟随
   · 筛选：旧块飞散 → 新集合重新飞入
   原生 WAAPI + CSS animation，无第三方库。
   ════════════════════════════════════════════════════════ */

const Flow = (() => {
  const BASE_RX = 52;   // 基础俯仰
  const BASE_RZ = -36;  // 基础旋转

  let stage, scene;
  let parallax = { tx: 0, ty: 0, x: 0, y: 0 }; // 目标值 / 当前值
  let rafId = null;

  const CAT_COLORS = {
    A: '#a2603f', F: '#7a7e5c', S: '#5e7480', L: '#8a6572',
  };

  function colorOf(entry) {
    return CAT_COLORS[entry.category] || '#a2603f';
  }

  function init() {
    stage = document.getElementById('stage');
    scene = document.getElementById('scene');

    // 立即给出基础变换（不等首帧 rAF，避免空白）
    scene.style.transform =
      `scale(${sceneScale()}) rotateX(${BASE_RX}deg) rotateZ(${BASE_RZ}deg)`;

    stage.addEventListener('mousemove', (e) => {
      const r = stage.getBoundingClientRect();
      parallax.tx = ((e.clientX - r.left) / r.width - 0.5) * 2;  // -1..1
      parallax.ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
    });
    stage.addEventListener('mouseleave', () => { parallax.tx = 0; parallax.ty = 0; });

    rafId = requestAnimationFrame(tick);
  }

  /* 场景呼吸 + 视差缓动 */
  function tick(t) {
    parallax.x += (parallax.tx - parallax.x) * 0.045;
    parallax.y += (parallax.ty - parallax.y) * 0.045;
    const sway = Math.sin(t / 5200) * 1.6;
    const swayZ = Math.cos(t / 7100) * 1.4;
    const scale = sceneScale();
    scene.style.transform =
      `scale(${scale}) ` +
      `rotateX(${BASE_RX + sway - parallax.y * 4}deg) ` +
      `rotateZ(${BASE_RZ + swayZ + parallax.x * 4.5}deg)`;
    rafId = requestAnimationFrame(tick);
  }

  function sceneScale() {
    const w = stage.clientWidth || window.innerWidth;
    return Math.max(0.5, Math.min(1, w / 1150));
  }

  /* 创建单块图板 */
  function createSlab(p) {
    const { entry } = p;
    const slot = document.createElement('div');
    slot.className = 'slot';
    slot.style.setProperty('--x', p.x + 'px');
    slot.style.setProperty('--y', p.y + 'px');
    slot.dataset.id = entry.id;

    const slab = document.createElement('div');
    slab.className = 'slab';
    slab.style.width = p.w + 'px';
    slab.style.height = p.h + 'px';
    slab.style.setProperty('--edge', colorOf(entry));
    // 漂浮：深度 + 振幅 + 周期 + 相位全部随机
    slab.style.setProperty('--z', p.z.toFixed(0) + 'px');
    slab.style.setProperty('--bob', (7 + Math.random() * 12).toFixed(0) + 'px');
    slab.style.animationDuration = (4.5 + Math.random() * 4.5).toFixed(2) + 's';
    slab.style.animationDelay = (-Math.random() * 6).toFixed(2) + 's';

    const img = document.createElement('img');
    img.className = 'slab-img';
    img.src = entry.image;
    img.alt = entry.title;
    img.loading = 'lazy';
    img.draggable = false;
    slab.appendChild(img);

    const label = document.createElement('div');
    label.className = 'slab-label';
    label.textContent = entry.title;
    slab.appendChild(label);

    slab.addEventListener('click', (e) => {
      e.stopPropagation();
      Detail.open(entry, slab);
    });

    slot.appendChild(slab);
    return slot;
  }

  /* 飞入动画（CSS）：对角瀑布级联
     延迟按对角坐标 d = x*0.55 + y 排序 → 云团沿对角线方向
     一波接一波“倾泻”就位，带运动拉伸与落地回弹（平面设计感） */
  function flyIn(slot, p, total, diag) {
    const dn = (p.x * 0.55 + p.y - diag.min) / Math.max(1, diag.max - diag.min); // 0..1
    slot.style.setProperty('--fx', (p.x - 140 - Math.random() * 180).toFixed(1) + 'px');
    slot.style.setProperty('--fy', (p.y - 560 - Math.random() * 340).toFixed(1) + 'px');
    slot.style.setProperty('--fz', (620 + Math.random() * 420).toFixed(0) + 'px');
    slot.style.setProperty('--fdelay', (dn * 1500 + Math.random() * 180).toFixed(0) + 'ms');
    slot.style.setProperty('--fdur', (760 + Math.random() * 380).toFixed(0) + 'ms');
    slot.classList.add('fly-in');
  }

  /* 飞散（筛选清空时）：CSS 类 + 限时 Promise */
  function flyOut(slot) {
    slot.style.setProperty('--fdelay', (Math.random() * 160).toFixed(0) + 'ms');
    slot.classList.add('fly-out');
    return new Promise((res) => setTimeout(res, 640));
  }

  /**
   * 渲染一个集合（完整 232 或某标签子集）
   */
  function render(entries, mode) {
    const W = Math.max(stage.clientWidth, 320);
    const H = Math.max(stage.clientHeight, 320);
    const seed = (Date.now() % 2147483647) >>> 0;
    const placed = FlowLayout.compute(entries, W, H, seed);

    const old = Array.from(scene.children);
    const outro = old.length
      ? Promise.all(old.map(flyOut)).then(() => { scene.innerHTML = ''; })
      : Promise.resolve();

    outro.then(() => {
      /* 对角瀑布级联：先算所有落点的对角坐标范围，供 flyIn 归一化延迟 */
      const ds = placed.map(p => p.x * 0.55 + p.y);
      const diag = ds.length
        ? { min: Math.min(...ds), max: Math.max(...ds) }
        : { min: 0, max: 1 };
      const frag = document.createDocumentFragment();
      for (const p of placed) {
        const slot = createSlab(p);
        frag.appendChild(slot);
        if (mode !== 'none') flyIn(slot, p, placed.length, diag);
      }
      scene.appendChild(frag);
    });
  }

  return { init, render, colorOf };
})();
