/* ════════════════════════════════════════════════════════
   flow-layout.js — 浮动图像群的平面分布
   黄金角螺线（phyllotaxis）铺开 + 随机抖动：
   密度均匀、中心略密、边缘自然渐稀，块与块轻微交叠，
   像一团漂浮的图像云层。尺寸随块数自适应。
   ════════════════════════════════════════════════════════ */

const FlowLayout = (() => {
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffle(arr, rnd) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * @param entries 词条
   * @param W/H     场景可用像素尺寸
   * @param seed    随机种子（每次筛选不同 → 云团形态不同）
   * @returns [{entry, x, y, z, w, h, order}]
   *          x/y 为场景平面坐标（中心为 0,0），z 为前后深度
   */
  function compute(entries, W, H, seed) {
    const rnd = mulberry32(seed);
    const items = shuffle(entries.slice(), rnd);
    const n = items.length;

    // 块尺寸随数量自适应：集合越小，图板越大
    const base = Math.max(58, Math.min(190, Math.sqrt((W * H) / (n * 2.4))));

    const GOLDEN = Math.PI * (3 - Math.sqrt(5));
    const maxR = Math.min(W, H) * 0.46;

    return items.map((entry, i) => {
      const r = maxR * Math.sqrt((i + 0.5) / n) * (0.72 + rnd() * 0.3);
      const theta = i * GOLDEN + rnd() * 0.6;
      const x = Math.cos(theta) * r * 1.5 + (rnd() - 0.5) * base * 0.7; // 横向椭圆
      const y = Math.sin(theta) * r * 0.86 + (rnd() - 0.5) * base * 0.7;
      const z = (rnd() - 0.5) * 220;
      const w = Math.round(base * (0.72 + rnd() * 0.75));
      const h = Math.round(w * (0.62 + rnd() * 0.62));
      return { entry, x, y, z, w, h, order: i };
    });
  }

  return { compute };
})();
