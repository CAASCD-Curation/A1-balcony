<script setup>
defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '' },
  text: { type: String, default: '' },
  position: { type: Object, default: () => ({}) }
})
const emit = defineEmits(['close'])
</script>

<template>
  <section id="reading" v-show="open" aria-labelledby="reading-title" :style="position">
    <div class="reading-header">
      <h1 id="reading-title">{{ title }}</h1>
      <button id="close-reading" aria-label="收起文字" @click="emit('close')">×</button>
    </div>
    <p id="reading-text">{{ text }}</p>
  </section>
</template>
