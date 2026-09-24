<script setup>
defineProps({
  visible: { type: Boolean, default: false },
  text: { type: String, default: '' },
  position: { type: Object, default: () => ({}) }
})
</script>

<template>
  <div id="caption" role="status" v-show="visible" :style="position">{{ text }}</div>
</template>
