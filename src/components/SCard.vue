<script setup lang="ts">
defineProps<{
  /** Custom padding override, default is '32px' */
  padding?: string
}>()
</script>

<template>
  <div class="s-card" :style="padding ? { padding } : undefined">
    <slot />
  </div>
</template>

<style scoped>
.s-card {
  display: flex;
  padding: 32px;
  flex-direction: column;
  align-items: flex-end;
  gap: 24px;
  border-radius: 16px;
  border: 1px solid var(--color-general-border, #D9D9D9);
  background: var(--color-general-white, #FFF);
}
</style>
