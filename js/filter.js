/* ════════════════════════════════════════════════════════
   filter.js — 关键词检索 / 筛选状态
   点击详情中的关键词 → 只保留匹配卡片 → 重新随机布局 → 再次落下
   ════════════════════════════════════════════════════════ */

const Filter = (() => {
  let statusEl, keywordEl, countEl;
  let allEntries = [];
  let currentKeyword = null;

  function init(entries) {
    allEntries = entries;
    statusEl = document.getElementById('filter-status');
    keywordEl = document.getElementById('filter-keyword');
    countEl = document.getElementById('filter-count');
    document.getElementById('btn-reset').addEventListener('click', reset);
  }

  function matched(keyword) {
    return allEntries.filter((e) => (e.keywords || []).includes(keyword));
  }

  /* 应用关键词筛选：清空建筑 → 匹配卡片重新落下 */
  function apply(keyword) {
    const list = matched(keyword);
    if (!list.length) return;
    currentKeyword = keyword;

    keywordEl.textContent = keyword;
    countEl.textContent = list.length + ' 条';
    statusEl.hidden = false;

    App.rebuild(list, 'drop');

    // 滚回建筑起点，观看重新堆叠
    document.querySelector('.site-main').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* 恢复完整建筑 */
  function reset() {
    if (!currentKeyword) return;
    currentKeyword = null;
    statusEl.hidden = true;
    App.rebuild(allEntries, 'drop');
  }

  function current() {
    return currentKeyword ? matched(currentKeyword) : allEntries;
  }

  return { init, apply, reset, current };
})();
