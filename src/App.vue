<script setup>
import { ref, computed } from 'vue'
import { useBalcony } from './composables/useBalcony'
import PerspectiveSeams from './components/PerspectiveSeams.vue'
import PictureFrame from './components/PictureFrame.vue'
import EdgeLabel from './components/EdgeLabel.vue'
import CaptionTip from './components/CaptionTip.vue'
import ReadingPanel from './components/ReadingPanel.vue'

const space = ref(null)
const caption = ref(null)
const reading = ref(null)
const labels = [ref(null), ref(null), ref(null), ref(null)]

const {
  state, entries,
  togglePanel, closePanel, onPictureClick, onSpaceClick
} = useBalcony({ space, caption, reading, labels })

const currentEntry = computed(() => state.shown >= 0 ? entries[state.shown] : null)
const pictureLabel = computed(() =>
  currentEntry.value ? currentEntry.value.title + '：点击显示词条、原名与来源' : '显示当前词条信息'
)
const imageAlt = computed(() => currentEntry.value ? currentEntry.value.title : '')

const labelDefs = [
  { id: 'weather', text: '天气与情绪', pending: false },
  { id: 'material', text: '材质与历史', pending: false },
  { id: 'self', text: '自我', pending: true },
  { id: 'other', text: '他者', pending: true }
]
</script>

<template>
  <main id="space" ref="space" aria-label="阳台档案：向内到向外" tabindex="-1" @click="onSpaceClick">
    <PerspectiveSeams :d="state.seamsD" />

    <PictureFrame
      :width="state.frameWidth"
      :height="state.frameHeight"
      :src="state.currentSrc"
      :alt="imageAlt"
      :image-ok="state.imageOk"
      :expanded="state.captionVisible"
      :aria-label="pictureLabel"
      @select="onPictureClick"
    />

    <EdgeLabel
      v-for="(def, i) in labelDefs"
      :key="def.id"
      :id="def.id"
      :ref="el => { labels[i].value = el }"
      :label="def.text"
      :pending="def.pending"
      :expanded="state.panel === def.id"
      :position="state.labelStyles[i]"
      @toggle="togglePanel(def.id)"
    />

    <CaptionTip
      ref="caption"
      :visible="state.captionVisible"
      :text="state.captionText"
      :position="state.captionStyle"
    />

    <ReadingPanel
      ref="reading"
      :open="!!state.panel"
      :title="state.panelTitle"
      :text="state.panelText"
      :position="state.panelStyle"
      @close="closePanel(true)"
    />

    <p id="hint" :class="{ dismissed: state.hintDismissed }">双指张开向外 · 捏合向内</p>
    <div class="sr-only" id="announcement" aria-live="polite">{{ state.announcement }}</div>
  </main>
</template>
