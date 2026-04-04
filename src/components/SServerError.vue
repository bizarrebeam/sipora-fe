<script setup lang="ts">
import { useServerErrorStore } from '@/stores/serverError'
import PriwitanIcon from '@/assets/priwitan-whistle.svg'

const serverErrorStore = useServerErrorStore()

function handleReload() {
  window.location.reload()
}
</script>

<template>
  <Teleport to="body">
    <Transition name="overlay-error">
      <div v-if="serverErrorStore.visible" class="server-error-overlay">
        <div class="server-error-card">
          <div class="server-error-icon-wrapper">
            <img :src="PriwitanIcon" alt="" class="server-error-whistle" />
          </div>
          <h2 class="server-error-title">Oops!</h2>
          <p class="server-error-message">
            {{ serverErrorStore.message }}
          </p>
          <p class="server-error-sub">Jangan khawatir, tim teknis kami sedang menangani hal ini.</p>
          <button class="server-error-btn" @click="handleReload">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
            Muat Ulang Halaman
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* ── Server Error Overlay ── */
.server-error-overlay {
  position: fixed;
  inset: 0;
  z-index: 11000; /* Higher than SNotFound / SDialog / SAlert */
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(12px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(180%);
}

.server-error-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 28px;
  padding: 48px 40px 36px;
  max-width: 440px;
  width: calc(100% - 32px);
  box-shadow:
    0 20px 60px rgba(42, 44, 135, 0.16),
    0 4px 12px rgba(0, 0, 0, 0.08);
}

.server-error-icon-wrapper {
  width: 84px;
  height: 84px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-blue-50, #eef0fb);
  border-radius: 50%;
  margin-bottom: 20px;
  animation: floatPriwitan 2.8s ease-in-out infinite;
}

.server-error-whistle {
  width: 48px;
  height: 48px;
  object-fit: contain;
  filter: drop-shadow(0 2px 8px rgba(88, 89, 169, 0.3));
}

.server-error-title {
  font-family: "Space Grotesk", "Be Vietnam Pro", sans-serif;
  font-weight: 800;
  font-size: 52px;
  color: var(--color-blue-500, #2E3094);
  margin: 0 0 12px;
  line-height: 1;
  letter-spacing: -1.5px;
}

.server-error-message {
  font-family: "Be Vietnam Pro", sans-serif;
  font-weight: 600;
  font-size: 16px;
  color: var(--color-general-black, #333);
  line-height: 1.5;
  margin: 0 0 8px;
}

.server-error-sub {
  font-family: "Be Vietnam Pro", sans-serif;
  font-weight: 400;
  font-size: 14px;
  color: var(--color-neutral-400, #999);
  margin: 0 0 28px;
}

.server-error-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 14px 32px;
  border: none;
  border-radius: 12px;
  background: var(--color-blue-500, #2E3094);
  color: white;
  font-family: "Be Vietnam Pro", sans-serif;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(46, 48, 148, 0.2);
}

.server-error-btn:hover {
  background: var(--color-blue-600, #252783);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(46, 48, 148, 0.3);
}

.server-error-btn:active {
  transform: translateY(0);
}

/* Transitions */
.overlay-error-enter-active,
.overlay-error-leave-active {
  transition: opacity 0.4s ease;
}

.overlay-error-enter-from,
.overlay-error-leave-to {
  opacity: 0;
}

.overlay-error-enter-active .server-error-card,
.overlay-error-leave-active .server-error-card {
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.overlay-error-enter-from .server-error-card {
  transform: scale(0.85) translateY(30px);
  opacity: 0;
}

@keyframes floatPriwitan {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
</style>
