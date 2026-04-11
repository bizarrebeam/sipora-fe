<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  visible: boolean
  type?: 'default' | 'warning' | 'no-header'
  title?: string
  description: string
  primaryButtonText?: string
  secondaryButtonText?: string
}>(), {
  type: 'default',
  primaryButtonText: 'OK'
})

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'close'): void
  (e: 'primaryClick'): void
  (e: 'secondaryClick'): void
}>()

const headerClass = computed(() => {
  if (props.type === 'warning') return 'bg-red-50 text-general-red flex items-center justify-center p-7 relative'
  return 'bg-blue-50 text-blue-500 flex items-center justify-center p-7 relative'
})

const showHeader = computed(() => props.type !== 'no-header')

function close() {
  emit('update:visible', false)
  emit('close')
}

function handlePrimary() {
  emit('primaryClick')
}

function handleSecondary() {
  emit('secondaryClick')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="salert-fade">
      <div v-if="visible" class="salert-overlay" @click.self="close">
        <div class="salert-box">
          <!-- Header -->
          <div v-if="showHeader" :class="headerClass">
            <h3 class="w-full text-center heading-h5">{{ title }}</h3>
            <button
              type="button"
              class="absolute right-[21px] top-[21px] flex size-6 items-center justify-center text-general-black hover:opacity-70 transition-opacity"
              @click="close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>

          <!-- No Header Close Button -->
          <button
            v-else
            type="button"
            class="absolute right-6 top-6 flex size-6 items-center justify-center text-general-black hover:opacity-70 transition-opacity z-10"
            @click="close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>

          <!-- Body -->
          <div class="salert-body" :class="{ 'pt-14': !showHeader }">
            <p class="salert-description">{{ description }}</p>

            <!-- Actions -->
            <div class="salert-actions">
              <button
                v-if="secondaryButtonText"
                type="button"
                class="salert-btn salert-btn--secondary"
                :class="type === 'warning' ? 'btn--warning-sec' : 'btn--default-sec'"
                @click="handleSecondary"
              >
                {{ secondaryButtonText }}
              </button>
              <button
                v-if="primaryButtonText"
                type="button"
                class="salert-btn salert-btn--primary"
                :class="type === 'warning' ? 'btn--warning-pri' : 'btn--default-pri'"
                @click="handlePrimary"
              >
                {{ primaryButtonText }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.salert-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(2px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
  padding: 16px;
}

.salert-box {
  width: 100%;
  max-width: 572px;
  background: white;
  border-radius: 16px;
  border: 1px solid var(--color-general-border, #D9D9D9);
  box-shadow: 0px 0px 10px 0px rgba(159, 160, 206, 0.50);
  overflow: hidden;
  position: relative;
}

.salert-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 32px;
}

.salert-description {
  width: 100%;
  color: var(--color-general-black, #333);
  text-align: center;
  font-family: inherit;
  font-size: 18px;
  font-weight: 500;
  line-height: 1.5;
  margin: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.salert-actions {
  display: flex;
  width: 100%;
  justify-content: center;
  align-items: center;
  gap: 24px;
}

.salert-btn {
  flex: 1;
  display: flex;
  padding: 14px 20px;
  justify-content: center;
  align-items: center;
  border-radius: 8px;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.2s;
}

.salert-btn:hover {
  opacity: 0.9;
}

.btn--default-pri { background: var(--color-blue-500, #2E3094); color: white; border: none; }
.btn--default-sec { background: var(--color-blue-50, #EAEAF4); color: var(--color-blue-600); border: none; }

.btn--warning-pri { background: var(--color-general-red, #FC6668); color: white; border: none; }
.btn--warning-sec { background: transparent; color: var(--color-general-black); border: 1px solid var(--color-general-black); }

/* Premium Pop Animation */
.salert-fade-enter-active,
.salert-fade-leave-active {
  transition: opacity 0.3s ease;
}

.salert-fade-enter-from,
.salert-fade-leave-to {
  opacity: 0;
}

.salert-fade-enter-active .salert-box,
.salert-fade-leave-active .salert-box {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.salert-fade-enter-from .salert-box {
  transform: scale(0.8) translateY(20px);
  opacity: 0;
}

.salert-fade-leave-to .salert-box {
  transform: scale(0.95) translateY(0);
  opacity: 0;
  transition: all 0.2s ease-in;
}

@media (max-width: 480px) {
  .salert-description {
    font-size: 16px;
  }
  .salert-actions {
    gap: 12px;
  }
}
</style>
