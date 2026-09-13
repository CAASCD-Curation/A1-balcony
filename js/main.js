/* ════════════════════════════════════════════════════════
   main.js — 主控：加载数据 → 初始化场景 → 渲染图像群
   ════════════════════════════════════════════════════════ */

const App = (() => {
  let data = null;
  let resizeTimer = null;

  /* 重建图像群（全量或标签子集） */
  function rebuild(entries, mode) {
    Flow.render(entries, mode);
  }

  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => rebuild(Filter.current(), 'none'), 280);
  }

  async function init() {
    data = await DataSource.load();

    document.getElementById('head-total').textContent = data.entries.length;

    Flow.init();
    Detail.init();
    Filter.init(data.entries);

    rebuild(data.entries, location.search.includes('flat') ? 'none' : 'drop');

    window.addEventListener('resize', onResize);
  }

  document.addEventListener('DOMContentLoaded', () => {
    init().catch((err) => {
      console.error(err);
      document.getElementById('scene').innerHTML =
        '<p style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);color:#96907f;white-space:nowrap">' +
        err.message + '</p>';
    });
  });

  return { rebuild };
})();
