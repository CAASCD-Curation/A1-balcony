/* ════════════════════════════════════════════════════════
   detail.js — 详情面板（不跳转页面，单扇透明玻璃窗开合）
   ════════════════════════════════════════════════════════ */

const Detail = (() => {
  const CAT_COLORS = {
    A: '#a2603f', F: '#7a7e5c', S: '#5e7480', L: '#8a6572',
  };
  const colorOf = (entry) => CAT_COLORS[entry.category] || '#a2603f';

  let overlay, panel, media, meta, title, original, desc, keywords;

  let sourceElement, hideTimer, openFrame, lastFocus;
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

  function init() {
    overlay = document.getElementById('detail-overlay');
    panel = document.getElementById('detail-panel');
    media = document.getElementById('detail-media');
    meta = document.getElementById('detail-meta');
    title = document.getElementById('detail-title');
    original = document.getElementById('detail-original');
    desc = document.getElementById('detail-desc');
    keywords = document.getElementById('detail-keywords');

    panel.setAttribute('aria-labelledby', 'detail-title');
    document.getElementById('detail-close').addEventListener('click', close);
    document.getElementById('detail-backdrop').addEventListener('click', close);
    document.addEventListener('keydown', (e) => {
      if (overlay.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'Tab') {
        const items = [...panel.querySelectorAll('button')];
        const first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  function open(entry, source) {
    clearTimeout(hideTimer);
    cancelAnimationFrame(openFrame);
    lastFocus = document.activeElement;
    sourceElement = source;
    overlay.classList.remove('open');
    panel.querySelectorAll('.window-leaf').forEach(el => el.remove());
    // 图片区：有图显示图，无图留中性底
    media.className = 'detail-media';
    media.style.setProperty('--cat-color', colorOf(entry));
    media.innerHTML = '';
    if (entry.image) {
      const img = document.createElement('img');
      img.src = entry.image;
      img.alt = entry.title;
      media.appendChild(img);
    }

    // 元信息
    meta.innerHTML = '';
    const parts = [
      { text: entry.category_name, cls: 'cat' },
      { text: entry.dimension },
      { text: entry.source },
      { text: entry.year },
    ].filter((p) => p.text);
    parts.forEach((p, i) => {
      const span = document.createElement('span');
      span.textContent = p.text;
      if (p.cls) span.className = p.cls;
      meta.appendChild(span);
      if (i < parts.length - 1) meta.appendChild(document.createTextNode('·'));
    });

    title.textContent = entry.title;
    original.textContent = entry.original_title || '';
    original.style.display = entry.original_title ? '' : 'none';
    desc.textContent = entry.description || '';

    // 关键词 → 点击触发筛选重建
    keywords.innerHTML = '';
    (entry.keywords || []).forEach((k) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'kw-chip';
      chip.textContent = k;
      chip.addEventListener('click', () => {
        close();
        Filter.apply(k);
      });
      keywords.appendChild(chip);
    });

    // The moving pane is pure glass: content stays in the actual detail view.
    const leaf = document.createElement('div');
    leaf.className = 'window-leaf';
    leaf.setAttribute('aria-hidden', 'true');
    panel.appendChild(leaf);
    overlay.hidden = false;
    panel.scrollTop = 0;
    panel.querySelector('.detail-body').scrollTop = 0;
    document.body.classList.add('locked');
    const box = { width: panel.offsetWidth };
    const from = source?.getBoundingClientRect();
    panel.style.setProperty('--from-x', from ? `${from.left + from.width / 2 - innerWidth / 2}px` : '0px');
    panel.style.setProperty('--from-y', from ? `${from.top + from.height / 2 - innerHeight / 2}px` : '24px');
    panel.style.setProperty('--from-scale', from ? Math.max(.08, Math.min(.7, from.width / box.width)) : .8);
    // Flush the closed pose before starting a fresh opening.
    void panel.offsetWidth;
    openFrame = requestAnimationFrame(() => {
      overlay.classList.add('open');
      document.getElementById('detail-close').focus({ preventScroll: true });
    });
  }

  function close() {
    if (overlay.hidden) return;
    cancelAnimationFrame(openFrame);
    clearTimeout(hideTimer);
    overlay.classList.remove('open');
    hideTimer = setTimeout(() => {
      overlay.hidden = true;
      document.body.classList.remove('locked');
      if (sourceElement?.isConnected) {
        sourceElement.setAttribute('tabindex', '-1');
        sourceElement.focus({ preventScroll: true });
      } else if (lastFocus?.isConnected) lastFocus.focus({ preventScroll: true });
    }, reduced() ? 0 : 920);
  }

  return { init, open, close };
})();
