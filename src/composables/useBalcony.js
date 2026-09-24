import { reactive, nextTick, onMounted, onBeforeUnmount } from 'vue'
import entries from '../data/entries'

const count = entries.length
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
// 模板 ref 可能指向原生元素或子组件实例，统一解析为 DOM 元素
const dom = r => { const v = r.value; return (v && v.$el) ? v.$el : v }

/**
 * 阳台档案的核心状态机与动画循环。
 * 移植自原 app.js：透视缩放浏览、图片缓存预载、词条面板与气泡。
 * 需要在 App.vue 中以模板 ref 提供 DOM 元素用于尺寸测量：
 * els = { space, picture, caption, reading, labels: [weather, material, self, other] }
 */
export function useBalcony(els) {
  const state = reactive({
    width: innerWidth,
    height: innerHeight,
    frameWidth: 0,
    frameHeight: 0,
    shown: -1,
    currentSrc: '',
    imageOk: true,
    panel: '',
    panelTitle: '',
    panelText: '',
    panelStyle: {},
    captionVisible: false,
    captionText: '',
    captionStyle: {},
    seamsD: '',
    labelStyles: [{}, {}, {}, {}],
    hintDismissed: false,
    announcement: ''
  })

  // ---- 非响应式内部状态（每帧变化，无需触发渲染） ----
  let target = Math.floor(Math.random() * count)
  let position = target
  let requested = -1
  let raf = 0
  let lastTime = 0
  let captionPoint = null
  let settleTimer, hintTimer
  let safariGesture = false, safariScale = 1, lastSafari = -Infinity
  let touchDistance = 0, lastTouchPinch = -Infinity
  const cache = new Map()
  let areas = []

  function limits() {
    const font = Math.min(42, Math.max(18, state.width * .0225))
    return [
      state.width - Math.max(state.width <= 600 ? 90 : 4 * font + 40, state.width * .06),
      state.height - Math.max(78, state.height * .095, 2 * (font * 1.1 + 12))
    ]
  }

  function measureAreas() {
    const [maxW, maxH] = limits()
    areas = entries.map((entry, i) => {
      const ratio = entry.width / entry.height
      return Math.min(
        state.width * state.height * (.003 + .61 * Math.pow(i / (count - 1), 1.7)),
        maxW * maxW / ratio,
        maxH * maxH * ratio
      )
    })
    // Look ahead to narrow portraits, so a later photograph never has less area.
    for (let i = count - 2; i >= 0; i--) areas[i] = Math.min(areas[i], areas[i + 1] * .998)
  }

  function load(index) {
    if (!cache.has(index)) {
      const promise = new Promise(resolve => {
        const img = new Image()
        img.decoding = 'async'
        img.onload = async () => {
          try { await img.decode() } catch (_) { /* Already loaded. */ }
          resolve(img)
        }
        img.onerror = () => resolve(null)
        img.src = entries[index].image
      })
      cache.set(index, promise)
    }
    return cache.get(index)
  }

  function preload(index) {
    for (let d = 1; d <= 5; d++) {
      if (index + d < count) load(index + d)
      if (index - d >= 0) load(index - d)
    }
    // Keep nearby decoded photos without retaining the entire archive in memory.
    for (const key of cache.keys()) if (Math.abs(key - index) > 18) cache.delete(key)
  }

  async function show(index) {
    if (requested === index) return
    requested = index
    const loaded = await load(index)
    if (requested !== index) return
    state.shown = index
    state.imageOk = !!loaded
    state.currentSrc = loaded ? entries[index].image : ''
    state.announcement = `${index + 1} / ${count}，${entries[index].title}`
    closeCaption()
    if (state.panel) state.panelText = entries[index][state.panel]
    preload(index)
    wake()
  }

  function geometry() {
    const e = entries[Math.max(0, state.shown < 0 ? Math.round(target) : state.shown)]
    const ratio = e.width / e.height
    const floor = Math.floor(position), fraction = position - floor
    const area = areas[floor] * (1 - fraction) + areas[Math.min(count - 1, floor + 1)] * fraction
    let w = Math.sqrt(area * ratio), h = w / ratio
    const [maxW, maxH] = limits()
    const fit = Math.min(1, maxW / w, maxH / h)
    return [w * fit, h * fit]
  }

  function placeCaption() {
    const caption = dom(els.caption)
    if (!state.captionVisible || !captionPoint || !caption) return
    state.captionStyle = {
      left: Math.round(clamp(captionPoint.x + 13, 12, Math.max(12, state.width - caption.offsetWidth - 12))) + 'px',
      top: Math.round(clamp(captionPoint.y + 17, 12, state.height - caption.offsetHeight - 12)) + 'px'
    }
  }

  function placePanel() {
    const reading = dom(els.reading)
    if (!state.panel || !reading) return
    const labelY = state.panel === 'weather'
      ? (state.height - state.frameHeight) * .16
      : state.height - (state.height - state.frameHeight) * .16
    const top = state.panel === 'weather' ? labelY + 30 : labelY - reading.offsetHeight - 30
    state.panelStyle = {
      left: Math.max(12, (state.width - reading.offsetWidth) / 2) + 'px',
      top: clamp(top, 24, Math.max(24, state.height - reading.offsetHeight - 24)) + 'px'
    }
  }

  function draw() {
    const { width, height, frameWidth, frameHeight } = state
    const x = (width - frameWidth) / 2, y = (height - frameHeight) / 2
    const right = width - x, bottom = height - y
    state.seamsD = `M0 0 L${x} ${y} M${width} 0 L${right} ${y} M0 ${height} L${x} ${bottom} M${width} ${height} L${right} ${bottom}`
    const points = [
      [width / 2, y * .32], [width / 2, height - y * .32],
      [x * .38, height / 2], [width - x * .38, height / 2]
    ]
    els.labels.forEach((ref, i) => {
      const el = dom(ref)
      if (!el) return
      const halfW = el.offsetWidth / 2, halfH = el.offsetHeight / 2
      state.labelStyles[i] = {
        left: clamp(points[i][0], halfW + 8, width - halfW - 8) + 'px',
        top: clamp(points[i][1], halfH + 6, height - halfH - 6) + 'px'
      }
    })
    placePanel()
    placeCaption()
  }

  function tick(time) {
    raf = 0
    const dt = Math.min(40, lastTime ? time - lastTime : 16)
    lastTime = time
    position += (target - position) * (1 - Math.exp(-dt / (reduce ? 1 : 65)))
    if (Math.abs(target - position) < .0001) position = target
    show(clamp(Math.round(position), 0, count - 1))
    const [w, h] = geometry()
    const blend = 1 - Math.exp(-dt / (reduce ? 1 : 110))
    if (!state.frameWidth) {
      state.frameWidth = w
      state.frameHeight = h
    } else {
      state.frameWidth += (w - state.frameWidth) * blend
      state.frameHeight += (h - state.frameHeight) * blend
    }
    draw()
    if (Math.abs(target - position) > .0001 ||
        Math.abs(w - state.frameWidth) > .015 ||
        Math.abs(h - state.frameHeight) > .015) wake()
  }

  function wake() { if (!raf) raf = requestAnimationFrame(tick) }
  function dismissHint() { clearTimeout(hintTimer); state.hintDismissed = true }

  function move(delta, snap = false) {
    target = clamp(target + delta, 0, count - 1)
    closeCaption()
    dismissHint()
    wake()
    clearTimeout(settleTimer)
    settleTimer = setTimeout(() => { target = Math.round(target); wake() }, snap ? 0 : 180)
  }

  function closeCaption() { state.captionVisible = false }

  // 公共性：1-10，值越高越公共；1-3 私密，4-6 中性，7-10 公共；null/越界视为未标注
  function publicnessLabel(score) {
    if (typeof score !== 'number' || score < 1 || score > 10) return ''
    const band = score <= 3 ? '私密' : score <= 6 ? '中性' : '公共'
    return `公共性 ${score}/10 · ${band}`
  }

  function closePanel(focus = false) {
    const old = state.panel
    state.panel = ''
    if (focus && old) {
      const el = dom(els.labels[old === 'weather' ? 0 : 1])
      el && el.focus({ preventScroll: true })
    }
  }

  async function togglePanel(kind) {
    if (state.shown < 0) return
    if (state.panel === kind) { closePanel(); return }
    closeCaption()
    dismissHint()
    state.panel = kind
    state.panelTitle = kind === 'weather' ? '天气与情绪' : '材质与历史'
    state.panelText = entries[state.shown][kind]
    await nextTick()
    placePanel()
  }

  async function onPictureClick(e) {
    if (state.shown < 0 || performance.now() - lastTouchPinch < 260) return
    if (state.captionVisible) { closeCaption(); return }
    closePanel()
    dismissHint()
    const item = entries[state.shown]
    state.captionText = [item.title, item.original, item.author, publicnessLabel(item.publicness)]
      .filter(Boolean).join(' ｜ ')
    captionPoint = e.detail === 0
      ? { x: state.width / 2, y: state.height / 2 }
      : { x: e.clientX, y: e.clientY }
    state.captionVisible = true
    await nextTick()
    placeCaption()
  }

  function onSpaceClick(e) {
    if (e.target === dom(els.space)) { closePanel(); closeCaption() }
  }

  // ---- 事件处理 ----
  function onWheel(e) {
    const reading = dom(els.reading)
    if (reading && reading.contains(e.target) && !e.ctrlKey) return
    if (safariGesture || performance.now() - lastSafari < 100) { e.preventDefault(); return }
    e.preventDefault()
    const pixels = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? state.height : 1)
    move(-pixels * (e.ctrlKey ? .12 : .025))
  }
  function onGestureStart(e) {
    e.preventDefault()
    safariGesture = true
    safariScale = e.scale || 1
    lastSafari = performance.now()
  }
  function onGestureChange(e) {
    e.preventDefault()
    const scale = e.scale || 1
    move(Math.log(scale / safariScale) * 45)
    safariScale = scale
    lastSafari = performance.now()
  }
  function onGestureEnd(e) {
    e.preventDefault()
    safariGesture = false
    lastSafari = performance.now()
  }
  const distance = touches => Math.hypot(
    touches[0].clientX - touches[1].clientX,
    touches[0].clientY - touches[1].clientY
  )
  function onTouchStart(e) {
    if (e.touches.length === 2) {
      e.preventDefault()
      touchDistance = distance(e.touches)
      lastTouchPinch = performance.now()
    }
  }
  function onTouchMove(e) {
    if (e.touches.length !== 2 || !touchDistance) return
    e.preventDefault()
    const next = distance(e.touches)
    if (!safariGesture && performance.now() - lastSafari > 100) move(Math.log(next / touchDistance) * 45)
    touchDistance = next
    lastTouchPinch = performance.now()
  }
  function onTouchEnd() { touchDistance = 0 }

  function onKeydown(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return
    const steps = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 10, PageDown: -10 }
    if (e.key in steps) { e.preventDefault(); move(steps[e.key], true) }
    else if (e.key === 'Home' || e.key === 'End') { e.preventDefault(); move((e.key === 'Home' ? 0 : count - 1) - target, true) }
    else if (e.key === 'Escape') { closeCaption(); closePanel(true) }
  }

  function onResize() {
    state.width = innerWidth
    state.height = innerHeight
    measureAreas()
    wake()
  }

  onMounted(() => {
    measureAreas()
    const space = dom(els.space)
    space.addEventListener('wheel', onWheel, { passive: false })
    space.addEventListener('gesturestart', onGestureStart, { passive: false })
    space.addEventListener('gesturechange', onGestureChange, { passive: false })
    space.addEventListener('gestureend', onGestureEnd, { passive: false })
    space.addEventListener('touchstart', onTouchStart, { passive: false })
    space.addEventListener('touchmove', onTouchMove, { passive: false })
    space.addEventListener('touchend', onTouchEnd, { passive: true })
    document.addEventListener('keydown', onKeydown)
    addEventListener('resize', onResize)
    document.fonts.ready.then(() => { placePanel(); placeCaption() })
    hintTimer = setTimeout(dismissHint, 6500)
    show(Math.round(target))
    wake()
  })

  onBeforeUnmount(() => {
    if (raf) cancelAnimationFrame(raf)
    clearTimeout(settleTimer)
    clearTimeout(hintTimer)
    const space = dom(els.space)
    if (space) {
      space.removeEventListener('wheel', onWheel)
      space.removeEventListener('gesturestart', onGestureStart)
      space.removeEventListener('gesturechange', onGestureChange)
      space.removeEventListener('gestureend', onGestureEnd)
      space.removeEventListener('touchstart', onTouchStart)
      space.removeEventListener('touchmove', onTouchMove)
      space.removeEventListener('touchend', onTouchEnd)
    }
    document.removeEventListener('keydown', onKeydown)
    removeEventListener('resize', onResize)
  })

  return {
    state,
    entries,
    togglePanel,
    closePanel,
    closeCaption,
    onPictureClick,
    onSpaceClick
  }
}
