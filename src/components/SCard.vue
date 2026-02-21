<script setup lang="ts">
defineProps<{
  /** Custom padding override, default is 32px ('p-8') */
  padding?: string
}>()
</script>

<template>
  <div
    class="flex flex-col items-stretch gap-4 sm:gap-6 rounded-2xl border border-general-border bg-white"
    :class="{ 'p-5 sm:p-8': !padding }"
    :style="padding ? { padding } : undefined"
  >
    <slot />
  </div>
</template>
