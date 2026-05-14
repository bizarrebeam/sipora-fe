<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
    title: string,
    items?: Array<{ label: string, count: number }>,
    maxItems?: number,
    note?: string,
}>()

const list = computed(() => {
    const m = props.maxItems || 5
    return (props.items || []).slice(0, m)
})
</script>


<template>
    <div class="rounded-2xl border border-gray-200 bg-white p-12 w-full">
        <div class="flex items-center justify-between mb-3">
            <div>
                <h3 class="text-lg font-bold text-gray-800">{{ props.title }}</h3>
                <p v-if="props.note" class="mt-1 text-sm text-gray-500 font-medium">{{ props.note }}</p>
            </div>
        </div>

        <ul class="space-y-3">
            <li v-for="(it, idx) in list" :key="idx" class="flex items-center mt-6 justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-700">{{ idx + 1 }}</div>
                    <div class="text-sm text-gray-700 truncate max-w-xs">{{ it.label }}</div>
                </div>
                <div class="text-sm font-semibold text-gray-800">{{ it.count }}</div>
            </li>
            <li v-if="(props.items || []).length === 0" class="text-sm text-gray-500">Belum ada data</li>
        </ul>
    </div>
</template>

<style scoped>
.max-w-xs { max-width: 14rem; }
</style>