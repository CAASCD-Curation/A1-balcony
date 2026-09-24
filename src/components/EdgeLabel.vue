<script setup>
defineProps({
  label: { type: String, required: true },
  pending: { type: Boolean, default: false },
  expanded: { type: Boolean, default: false },
  position: { type: Object, default: () => ({}) }
})
const emit = defineEmits(['toggle'])
</script>

<template>
  <span v-if="pending" class="edge-label pending" :style="position">{{ label }}</span>
  <button
    v-else
    class="edge-label"
    :aria-expanded="expanded"
    aria-controls="reading"
    :style="position"
    @click="emit('toggle')"
  >{{ label }}</button>
</template>
