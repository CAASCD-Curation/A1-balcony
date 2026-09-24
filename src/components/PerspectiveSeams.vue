<script setup>
defineProps({ d: { type: String, default: '' } })
</script>

<template>
  <svg id="perspective" aria-hidden="true"><path id="seams" :d="d" /></svg>
</template>
