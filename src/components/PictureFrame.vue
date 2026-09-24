<script setup>
defineProps({
  width: { type: Number, default: 0 },
  height: { type: Number, default: 0 },
  src: { type: String, default: '' },
  alt: { type: String, default: '' },
  imageOk: { type: Boolean, default: true },
  expanded: { type: Boolean, default: false },
  ariaLabel: { type: String, default: '显示当前词条信息' }
})
const emit = defineEmits(['select'])
</script>

<template>
  <button
    id="picture"
    :style="{ width: width + 'px', height: height + 'px' }"
    :aria-label="ariaLabel"
    :aria-expanded="expanded"
    @click="emit('select', $event)"
  >
    <img v-show="imageOk" id="image" :src="src" :alt="alt" draggable="false">
    <span id="image-error" v-show="!imageOk">图片未能载入</span>
  </button>
</template>
